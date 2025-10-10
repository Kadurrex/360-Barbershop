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

        // Simple approach: Use the date and time as-is with Israeli timezone
        // Google Calendar API will handle the timezone conversion properly
        const dateTimeString = `${appointment.date}T${appointment.time}:00`;
        
        console.log(`Creating calendar event for ${appointment.name}`);
        console.log(`Input: ${appointment.date} at ${appointment.time}`);
        console.log(`DateTime string: ${dateTimeString}`);

        const event = {
            summary: `תספורת: ${appointment.name}`,
            description: `שם: ${appointment.name}\nטלפון: ${appointment.phone}\nשירות: ${appointment.service}\nהערות: ${appointment.notes || 'אין'}`,
            start: {
                dateTime: dateTimeString,
                timeZone: 'Asia/Jerusalem',
            },
            end: {
                dateTime: `${appointment.date}T${parseInt(appointment.time.split(':')[0]) + 1}:00:00`,
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

        console.log('✅ Event created successfully:', response.data.htmlLink);
        return response.data;
    } catch (error) {
        console.error('Error creating calendar event:', error);
        throw error;
    }
}

async function getBusyTimes(date) {
    try {
        const auth = getAuth();
        const calendar = google.calendar({ version: 'v3', auth });

        // Parse the date
        const [year, month, day] = date.split('-');
        
        // Create start and end of day in Israeli timezone
        const startOfDay = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0);
        const endOfDay = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 23, 59, 59);

        console.log(`Fetching busy times for ${date}`);
        console.log(`Start: ${startOfDay.toISOString()}`);
        console.log(`End: ${endOfDay.toISOString()}`);

        // Fetch all events for the day
        const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin: startOfDay.toISOString(),
            timeMax: endOfDay.toISOString(),
            timeZone: 'Asia/Jerusalem',
            singleEvents: true,
            orderBy: 'startTime',
        });

        const events = response.data.items || [];
        const busyTimes = [];

        events.forEach(event => {
            if (event.start && event.start.dateTime) {
                // Get the raw datetime strings from Google Calendar
                const startTimeStr = event.start.dateTime;
                const endTimeStr = event.end.dateTime;
                
                console.log(`\nProcessing event: ${event.summary}`);
                console.log(`Start datetime: ${startTimeStr}`);
                console.log(`End datetime: ${endTimeStr}`);
                
                // Create Date objects
                const startTime = new Date(startTimeStr);
                const endTime = new Date(endTimeStr);
                
                // Convert to Israeli time and get the hour
                const startHourInIsrael = parseInt(startTime.toLocaleString('en-US', { 
                    timeZone: 'Asia/Jerusalem', 
                    hour: '2-digit', 
                    hour12: false 
                }));
                
                const endHourInIsrael = parseInt(endTime.toLocaleString('en-US', { 
                    timeZone: 'Asia/Jerusalem', 
                    hour: '2-digit', 
                    hour12: false 
                }));
                
                console.log(`Israeli time: ${startHourInIsrael}:00 - ${endHourInIsrael}:00`);

                // Add all hours that this event spans
                let currentHour = startHourInIsrael;
                const finalHour = endHourInIsrael;
                
                // Block the start hour and all hours up to (but not including) the end hour
                while (currentHour < finalHour) {
                    const timeSlot = `${currentHour.toString().padStart(2, '0')}:00`;
                    if (!busyTimes.includes(timeSlot)) {
                        busyTimes.push(timeSlot);
                        console.log(`  Blocking: ${timeSlot}`);
                    }
                    currentHour++;
                }
            }
        });

        console.log(`Busy times for ${date}:`, busyTimes);
        return busyTimes;
    } catch (error) {
        console.error('Error fetching busy times from Google Calendar:', error);
        // Return empty array if there's an error (don't block booking)
        return [];
    }
}

module.exports = { addEventToCalendar, getBusyTimes };