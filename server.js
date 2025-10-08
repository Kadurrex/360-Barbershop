const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const { sendOwnerNotification, sendClientConfirmation, sendClientReminder, sendUnapprovalNotification } = require('./whatsapp-service');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Store appointments in a JSON file
const APPOINTMENTS_FILE = 'appointments.json';
const BREAKS_FILE = 'breaks.json';

// Initialize files if they don't exist
if (!fs.existsSync(APPOINTMENTS_FILE)) {
    fs.writeFileSync(APPOINTMENTS_FILE, JSON.stringify([], null, 2));
}
if (!fs.existsSync(BREAKS_FILE)) {
    fs.writeFileSync(BREAKS_FILE, JSON.stringify([], null, 2));
}

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
                
                // Send reminder 30 minutes before
                if (minutesDiff === 30) {
                    sendClientReminder(apt);
                    apt.reminderSent = true;
                    fs.writeFileSync(APPOINTMENTS_FILE, JSON.stringify(appointments, null, 2));
                    console.log(`✅ Reminder sent for appointment: ${apt.name} at ${apt.time}`);
                }
            }
        });
    } catch (error) {
        console.error('Error in reminder cron job:', error);
    }
});

// Get all appointments
app.get('/api/appointments', (req, res) => {
    try {
        const appointments = JSON.parse(fs.readFileSync(APPOINTMENTS_FILE, 'utf8'));
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read appointments' });
    }
});

// Create new appointment
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
        console.log(`אימייל / Email: ${newAppointment.email}`);
        console.log(`שירות / Service: ${newAppointment.service}`);
        console.log(`תאריך / Date: ${newAppointment.date}`);
        console.log(`שעה / Time: ${newAppointment.time}`);
        console.log(`הערות / Notes: ${newAppointment.notes || 'ללא / None'}`);
        console.log('================================\n');
        
        // Don't send WhatsApp to owner - just log to console
        // Owner will see it in the dashboard
        
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

// Get appointment by ID
app.get('/api/appointments/:id', (req, res) => {
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

// Update appointment status
app.put('/api/appointments/:id/status', async (req, res) => {
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
        if (status === 'approved' && oldStatus !== 'approved') {
            try {
                const confirmResult = await sendClientConfirmation(appointment);
                console.log(`✅ Confirmation sent to client: ${appointment.name}`);
            } catch (error) {
                console.error('Error sending confirmation:', error);
            }
        }
        
        // Send notification to client when unapproved
        if (status === 'pending' && oldStatus === 'approved') {
            try {
                const unapprovalResult = await sendUnapprovalNotification(appointment);
                console.log(`⚠️  Unapproval notification sent to client: ${appointment.name}`);
            } catch (error) {
                console.error('Error sending unapproval notification:', error);
            }
        }
        
        res.json({ success: true, appointment });
    } catch (error) {
        console.error('Error updating appointment status:', error);
        res.status(500).json({ error: 'Failed to update appointment status' });
    }
});

// Get available time slots for a specific date
app.get('/api/available-slots/:date', (req, res) => {
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
        
        // Combine booked and break slots
        const unavailableSlots = [...new Set([...bookedSlots, ...breakSlots])];
        
        // Return available slots
        const availableSlots = allSlots.filter(slot => !unavailableSlots.includes(slot));
        
        res.json({ 
            date: requestedDate,
            availableSlots,
            bookedSlots,
            breakSlots
        });
    } catch (error) {
        console.error('Error getting available slots:', error);
        res.status(500).json({ error: 'Failed to get available slots' });
    }
});

// Breaks Management API
// Get all breaks
app.get('/api/breaks', (req, res) => {
    try {
        const breaks = JSON.parse(fs.readFileSync(BREAKS_FILE, 'utf8'));
        res.json(breaks);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read breaks' });
    }
});

// Add break
app.post('/api/breaks', (req, res) => {
    try {
        const newBreak = {
            id: Date.now().toString(),
            ...req.body,
            createdAt: new Date().toISOString()
        };
        
        const breaks = JSON.parse(fs.readFileSync(BREAKS_FILE, 'utf8'));
        breaks.push(newBreak);
        fs.writeFileSync(BREAKS_FILE, JSON.stringify(breaks, null, 2));
        
        console.log(`✅ Break added: ${newBreak.date} ${newBreak.times.join(', ')}`);
        res.status(201).json({ success: true, break: newBreak });
    } catch (error) {
        console.error('Error adding break:', error);
        res.status(500).json({ error: 'Failed to add break' });
    }
});

// Delete break
app.delete('/api/breaks/:id', (req, res) => {
    try {
        let breaks = JSON.parse(fs.readFileSync(BREAKS_FILE, 'utf8'));
        breaks = breaks.filter(brk => brk.id !== req.params.id);
        fs.writeFileSync(BREAKS_FILE, JSON.stringify(breaks, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete break' });
    }
});

// Delete appointment
app.delete('/api/appointments/:id', (req, res) => {
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

