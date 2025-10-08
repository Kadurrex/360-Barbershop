const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { sendWhatsAppNotification } = require('./whatsapp-service');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Store appointments in a JSON file (in production, you'd use a database)
const APPOINTMENTS_FILE = 'appointments.json';

// Initialize appointments file if it doesn't exist
if (!fs.existsSync(APPOINTMENTS_FILE)) {
    fs.writeFileSync(APPOINTMENTS_FILE, JSON.stringify([], null, 2));
}

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
            createdAt: new Date().toISOString()
        };
        
        const appointments = JSON.parse(fs.readFileSync(APPOINTMENTS_FILE, 'utf8'));
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
        
        // Send WhatsApp notification
        try {
            await sendWhatsAppNotification(newAppointment);
        } catch (error) {
            console.error('WhatsApp notification error:', error.message);
            // Don't fail the request if notification fails
        }
        
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

