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

        // Create the date string in the correct format for Israeli timezone
        // The date comes as YYYY-MM-DD and time as HH:MM from the form
        
        // Parse the date and time components
        const [year, month, day] = appointment.date.split('-');
        const [hour, minute] = appointment.time.split(':');
        
        // Create a date object for the appointment date to check if it's DST
        const appointmentDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        
        // Check if the appointment date is in DST period (roughly March-October in Israel)
        // Israel DST typically runs from last Friday in March to first Sunday in October
        const monthNum = parseInt(month);
        let isDST = false;
        
        if (monthNum >= 4 && monthNum <= 9) {
            isDST = true; // Definitely DST (April to September)
        } else if (monthNum === 3) {
            // March - check if it's after the last Friday
            const lastFriday = new Date(parseInt(year), 2, 31);
            lastFriday.setDate(31 - lastFriday.getDay() + 5); // Last Friday of March
            isDST = appointmentDate >= lastFriday;
        } else if (monthNum === 10) {
            // October - check if it's before the first Sunday
            const firstSunday = new Date(parseInt(year), 9, 1);
            firstSunday.setDate(1 + (7 - firstSunday.getDay()) % 7); // First Sunday of October
            isDST = appointmentDate < firstSunday;
        }
        
        // Use the appropriate timezone offset
        const timezoneOffset = isDST ? '+03:00' : '+02:00';
        const dateTimeString = `${appointment.date}T${appointment.time}:00${timezoneOffset}`;
        
        // Create Date objects with the correct timezone
        const startDateTime = new Date(dateTimeString);
        const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour later
        
        console.log(`Creating calendar event for ${appointment.name}`);
        console.log(`Date: ${appointment.date}, Time: ${appointment.time}`);
        console.log(`Is DST: ${isDST}, Timezone offset: ${timezoneOffset}`);
        console.log(`Start: ${startDateTime.toLocaleString('he-IL')}`);
        console.log(`End: ${endDateTime.toLocaleString('he-IL')}`);
        
        const finalStartDateTime = startDateTime;
        const finalEndDateTime = endDateTime;

        const event = {
            summary: `תספורת: ${appointment.name}`,
            description: `שם: ${appointment.name}\nטלפון: ${appointment.phone}\nשירות: ${appointment.service}\nהערות: ${appointment.notes || 'אין'}`,
            start: {
                dateTime: finalStartDateTime.toISOString(),
                timeZone: 'Asia/Jerusalem',
            },
            end: {
                dateTime: finalEndDateTime.toISOString(),
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