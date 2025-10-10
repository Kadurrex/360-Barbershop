const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const { sendOwnerNotification, sendClientConfirmation, sendClientReminder, sendUnapprovalNotification, sendCancellationNotification } = require('./whatsapp-service');
const { addEventToCalendar, getBusyTimes } = require('./google-calendar');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '360admin';
const OWNER_PHONE = process.env.OWNER_PHONE || '0535594136';

// Create secure data directory
const DATA_DIR = path.join(__dirname, 'secure_data');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

// Store files in secure directory
const APPOINTMENTS_FILE = path.join(DATA_DIR, 'appointments.json');
const BREAKS_FILE = path.join(DATA_DIR, 'breaks.json');
const CREDENTIALS_FILE = path.join(DATA_DIR, 'credentials.json');
const TOKEN_FILE = path.join(DATA_DIR, 'token.json');

// Initialize files if they don't exist
if (!fs.existsSync(APPOINTMENTS_FILE)) {
    fs.writeFileSync(APPOINTMENTS_FILE, JSON.stringify([], null, 2));
}
if (!fs.existsSync(BREAKS_FILE)) {
    fs.writeFileSync(BREAKS_FILE, JSON.stringify([], null, 2));
}

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files with security headers
app.use(express.static('.', {
    setHeaders: (res, path) => {
        // Don't serve files from secure_data directory
        if (path.includes('secure_data')) {
            res.status(403).end();
            return;
        }
        // Add security headers
        res.set('X-Content-Type-Options', 'nosniff');
        res.set('X-Frame-Options', 'DENY');
        res.set('X-XSS-Protection', '1; mode=block');
    }
}));

// Authentication middleware for admin routes
const authenticateAdmin = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token || token !== `Bearer ${ADMIN_PASSWORD}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

// Check for upcoming appointments every minute and send reminders
cron.schedule('* * * * *', () => {
    try {
        const appointments = JSON.parse(fs.readFileSync(APPOINTMENTS_FILE, 'utf8'));
        const now = new Date();
        
        appointments.forEach(apt => {
            if (apt.status === 'approved' && !apt.reminderSent) {
                const aptDateTime = new Date(apt.date + 'T' + apt.time);
                const timeDiff = aptDateTime - now;
                const minutesDiff = Math.floor(timeDiff / 1000 / 60);
                
                // Send reminder between 25-35 minutes before
                if (minutesDiff >= 25 && minutesDiff <= 35) {
                    sendClientReminder(apt);
                    apt.reminderSent = true;
                    fs.writeFileSync(APPOINTMENTS_FILE, JSON.stringify(appointments, null, 2));
                    console.log(`✅ Reminder sent for appointment: ${apt.name} at ${apt.time} (${minutesDiff} min before)`);
                }
            }
        });
    } catch (error) {
        console.error('Error in reminder cron job:', error);
    }
});

// Public routes
app.post('/api/appointments', async (req, res) => {
    try {
        const newAppointment = {
            id: Date.now().toString(),
            ...req.body,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        
        // Check if time slot is available
        const appointments = JSON.parse(fs.readFileSync(APPOINTMENTS_FILE, 'utf8'));
        const conflict = appointments.find(apt => 
            apt.date === newAppointment.date && 
            apt.time === newAppointment.time &&
            apt.status !== 'cancelled'
        );
        
        if (conflict) {
            return res.status(400).json({ 
                error: 'השעה הזו כבר תפוסה. אנא בחר שעה אחרת.' 
            });
        }
        
        appointments.push(newAppointment);
        fs.writeFileSync(APPOINTMENTS_FILE, JSON.stringify(appointments, null, 2));
        
        // Log appointment details for the owner
        console.log('\n🎉 תור חדש נקבע! / New Appointment Received!');
        console.log('================================');
        console.log(`שם / Name: ${newAppointment.name}`);
        console.log(`טלפון / Phone: ${newAppointment.phone}`);
        console.log(`שירות / Service: ${newAppointment.service}`);
        console.log(`תאריך / Date: ${newAppointment.date}`);
        console.log(`שעה / Time: ${newAppointment.time}`);
        console.log(`הערות / Notes: ${newAppointment.notes || 'ללא / None'}`);
        console.log('================================\n');
        
        res.status(201).json({ 
            success: true, 
            message: 'Appointment created successfully',
            appointment: newAppointment 
        });
    } catch (error) {
        console.error('Error creating appointment:', error);
        res.status(500).json({ error: 'Failed to create appointment' });
    }
});

// Get available time slots for a specific date
app.get('/api/available-slots/:date', async (req, res) => {
    try {
        const requestedDate = req.params.date;
        const appointments = JSON.parse(fs.readFileSync(APPOINTMENTS_FILE, 'utf8'));
        const breaks = JSON.parse(fs.readFileSync(BREAKS_FILE, 'utf8'));
        
        // All possible time slots
        const allSlots = [
            '09:00', '10:00', '11:00', '12:00', '13:00',
            '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
        ];
        
        // Get booked slots for this date (excluding cancelled)
        const bookedSlots = appointments
            .filter(apt => apt.date === requestedDate && apt.status !== 'cancelled')
            .map(apt => apt.time);
        
        // Get break slots for this date
        const breakSlots = breaks
            .filter(brk => brk.date === requestedDate)
            .flatMap(brk => brk.times);
        
        // Get busy times from Google Calendar
        let calendarBusySlots = [];
        try {
            calendarBusySlots = await getBusyTimes(requestedDate);
            console.log(`📅 Google Calendar busy times for ${requestedDate}:`, calendarBusySlots);
        } catch (error) {
            console.error('Error fetching Google Calendar busy times:', error);
            // Continue without calendar busy times if there's an error
        }
        
        // Combine booked slots, break slots, and calendar busy slots
        const unavailableSlots = [...new Set([...bookedSlots, ...breakSlots, ...calendarBusySlots])];
        
        console.log(`Unavailable slots for ${requestedDate}:`, unavailableSlots);
        
        // Return available slots
        const availableSlots = allSlots.filter(slot => !unavailableSlots.includes(slot));
        
        res.json({ 
            date: requestedDate,
            availableSlots,
            calendarBusySlots // Include this for debugging
        });
    } catch (error) {
        console.error('Error getting available slots:', error);
        res.status(500).json({ error: 'Failed to get available slots' });
    }
});

// Protected admin routes
app.get('/api/appointments', authenticateAdmin, (req, res) => {
    try {
        const appointments = JSON.parse(fs.readFileSync(APPOINTMENTS_FILE, 'utf8'));
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read appointments' });
    }
});

app.get('/api/appointments/:id', authenticateAdmin, (req, res) => {
    try {
        const appointments = JSON.parse(fs.readFileSync(APPOINTMENTS_FILE, 'utf8'));
        const appointment = appointments.find(apt => apt.id === req.params.id);
        
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        
        res.json(appointment);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read appointment' });
    }
});

app.put('/api/appointments/:id/status', authenticateAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const appointments = JSON.parse(fs.readFileSync(APPOINTMENTS_FILE, 'utf8'));
        const appointment = appointments.find(apt => apt.id === req.params.id);
        
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        
        const oldStatus = appointment.status;
        appointment.status = status;
        appointment.updatedAt = new Date().toISOString();
        
        fs.writeFileSync(APPOINTMENTS_FILE, JSON.stringify(appointments, null, 2));
        
        console.log(`Appointment ${req.params.id} status updated: ${oldStatus} → ${status}`);
        
        // Send confirmation to client when approved
        let whatsappLink = null;
        if (status === 'approved' && oldStatus !== 'approved') {
            try {
                // Send WhatsApp confirmation
                const confirmResult = await sendClientConfirmation(appointment);
                whatsappLink = confirmResult.link;
                console.log(`✅ Confirmation sent to client: ${appointment.name}`);
                
                // Add to Google Calendar
                try {
                    await addEventToCalendar(appointment);
                    console.log(`✅ Added to Google Calendar: ${appointment.name}`);
                } catch (calendarError) {
                    console.error('Error adding to Google Calendar:', calendarError);
                }
            } catch (error) {
                console.error('Error sending confirmation:', error);
            }
        }
        
        // Send notification to client when unapproved
        if (status === 'pending' && oldStatus === 'approved') {
            try {
                const unapprovalResult = await sendUnapprovalNotification(appointment);
                whatsappLink = unapprovalResult.link;
                console.log(`⚠️  Unapproval notification sent to client: ${appointment.name}`);
            } catch (error) {
                console.error('Error sending unapproval notification:', error);
            }
        }
        
        // Send notification to client when cancelled
        if (status === 'cancelled' && oldStatus !== 'cancelled') {
            try {
                const cancellationResult = await sendCancellationNotification(appointment);
                whatsappLink = cancellationResult.link;
                console.log(`❌ Cancellation notification sent to client: ${appointment.name}`);
            } catch (error) {
                console.error('Error sending cancellation notification:', error);
            }
        }
        
        res.json({ success: true, appointment, whatsappLink });
    } catch (error) {
        console.error('Error updating appointment status:', error);
        res.status(500).json({ error: 'Failed to update appointment status' });
    }
});

app.delete('/api/appointments/:id', authenticateAdmin, (req, res) => {
    try {
        let appointments = JSON.parse(fs.readFileSync(APPOINTMENTS_FILE, 'utf8'));
        const initialLength = appointments.length;
        appointments = appointments.filter(apt => apt.id !== req.params.id);
        
        if (appointments.length === initialLength) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        
        fs.writeFileSync(APPOINTMENTS_FILE, JSON.stringify(appointments, null, 2));
        res.json({ success: true, message: 'Appointment deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete appointment' });
    }
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Access the website at: http://localhost:${PORT}`);
});