const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Load the credentials and token
function getAuth() {
    const credentials = require('./credentials.json').web;
    const token = require('./token.json');

    const oAuth2Client = new google.auth.OAuth2(
        credentials.client_id,
        credentials.client_secret,
        credentials.redirect_uris[0]
    );
    
    oAuth2Client.setCredentials(token);
    return oAuth2Client;
}

async function addEventToCalendar(appointment) {
    try {
        const auth = getAuth();
        const calendar = google.calendar({ version: 'v3', auth });

        // Format the date and time for Google Calendar
        const startDateTime = new Date(appointment.date + 'T' + appointment.time);
        const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour duration

        const event = {
            summary: `תספורת: ${appointment.name}`,
            description: `שם: ${appointment.name}\nטלפון: ${appointment.phone}\nשירות: ${appointment.service}\nהערות: ${appointment.notes || 'אין'}`,
            start: {
                dateTime: startDateTime.toISOString(),
                timeZone: 'Asia/Jerusalem',
            },
            end: {
                dateTime: endDateTime.toISOString(),
                timeZone: 'Asia/Jerusalem',
            },
            reminders: {
                useDefault: true
            },
        };

        const response = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
        });

        console.log('Event created:', response.data.htmlLink);
        return response.data;
    } catch (error) {
        console.error('Error creating calendar event:', error);
        throw error;
    }
}

module.exports = { addEventToCalendar };