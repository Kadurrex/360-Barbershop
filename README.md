# 360 Barbershop - Landing Page

A modern, Hebrew landing page for a barbershop with appointment booking functionality.

## Features

- 🇮🇱 Fully Hebrew language support with RTL layout
- 💈 Modern and elegant design
- 📅 Appointment booking system
- 📱 Fully responsive (mobile, tablet, desktop)
- ✨ Smooth animations and transitions
- 🎨 Professional color scheme with gold accents

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript
- **Backend**: Node.js, Express
- **Styling**: Custom CSS with modern design principles
- **Font**: Heebo (Google Fonts) - optimized for Hebrew

## Installation

1. Clone or download this repository
2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to `http://localhost:3000`

## Deployment

### Deploy to Render (Recommended - Free Tier Available)

1. Push your code to GitHub
2. Go to [Render](https://render.com)
3. Sign up or log in
4. Click "New +" and select "Web Service"
5. Connect your GitHub repository
6. Configure:
   - **Name**: 360-barbershop
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
7. Click "Create Web Service"
8. Your site will be live at: `https://360-barbershop.onrender.com` (or your custom URL)

### Deploy to Railway

1. Push your code to GitHub
2. Go to [Railway](https://railway.app)
3. Sign up with GitHub
4. Click "New Project" → "Deploy from GitHub repo"
5. Select your repository
6. Railway will automatically detect it's a Node.js app
7. Your site will be live with a generated URL

### Deploy to Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

3. Follow the prompts and your site will be live

### Deploy to Heroku

1. Install Heroku CLI
2. Login:
```bash
heroku login
```

3. Create app:
```bash
heroku create 360-barbershop
```

4. Deploy:
```bash
git push heroku main
```

## API Endpoints

- `GET /` - Serve the landing page
- `POST /api/appointments` - Create a new appointment
- `GET /api/appointments` - Get all appointments
- `GET /api/appointments/:id` - Get appointment by ID
- `DELETE /api/appointments/:id` - Delete appointment
- `GET /health` - Health check endpoint

## File Structure

```
360-barbershop/
├── index.html          # Main HTML file
├── styles.css          # CSS styling
├── script.js           # Frontend JavaScript
├── server.js           # Backend server
├── package.json        # Dependencies
├── appointments.json   # Appointments database (auto-generated)
└── README.md          # This file
```

## Customization

### Change Colors
Edit the CSS variables in `styles.css`:
```css
:root {
    --primary-color: #d4af37;    /* Gold */
    --secondary-color: #1a1a1a;  /* Dark */
    --accent-color: #f0e68c;     /* Light gold */
}
```

### Change Business Details
Edit the footer section in `index.html` to update:
- Phone number
- Address
- Opening hours

### Add Real Images
Replace the gallery placeholder divs with actual images:
```html
<div class="gallery-item">
    <img src="your-image.jpg" alt="Description">
</div>
```

## Production Considerations

For production use, consider:
1. Replace JSON file storage with a proper database (PostgreSQL, MongoDB)
2. Add email notifications for appointments
3. Add admin panel to manage appointments
4. Implement authentication for admin access
5. Add payment integration if needed
6. Set up SSL certificate (most hosting platforms include this)
7. Add analytics (Google Analytics)
8. Implement SEO optimizations

## Support

For issues or questions, please contact the development team.

## License

MIT License - feel free to use this for your barbershop business!

