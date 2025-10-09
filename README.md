# 360 Barbershop

Modern Hebrew barbershop landing page with appointment booking system.

## Features

- Modern, responsive design
- Online appointment booking
- Admin dashboard
- WhatsApp notifications
- Google Calendar integration
- Automatic reminders

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up Google Calendar API:
   - Create a project in Google Cloud Console
   - Enable Google Calendar API
   - Create OAuth 2.0 credentials
   - Save as `secure_data/credentials.json`
   - Run `node get-refresh-token.js` to get token

4. Environment Variables:
   ```
   PORT=3000
   ADMIN_PASSWORD=your_admin_password
   OWNER_PHONE=your_phone_number
   ```

5. Start the server:
   ```bash
   npm start
   ```

## Deployment

1. Create a Render account at https://render.com
2. Create a new Web Service
3. Connect your GitHub repository
4. Add environment variables:
   - `PORT`: 3000
   - `ADMIN_PASSWORD`: your_admin_password
   - `OWNER_PHONE`: your_phone_number
5. Add the following Build Command:
   ```bash
   npm install
   ```
6. Add the following Start Command:
   ```bash
   node server.js
   ```

## Security

All sensitive data is stored in the `secure_data` directory:
- `appointments.json`: Appointment data
- `credentials.json`: Google Calendar credentials
- `token.json`: Google Calendar refresh token

These files are not included in Git and must be set up manually in production.

## License

MIT