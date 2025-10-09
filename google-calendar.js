const { google } = require('googleapis');

// Load the credentials and token from environment variables
function getAuth() {
    // Use environment variables for production, fallback to files for local development
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
        console.error('Missing Google Calendar environment variables');
        throw new Error('Google Calendar credentials not configured');
    }

    const oAuth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        'https://three60-barbershop.onrender.com/oauth2callback'
    );
    
    // Set credentials using the refresh token
    oAuth2Client.setCredentials({
        refresh_token: refreshToken
    });
    
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