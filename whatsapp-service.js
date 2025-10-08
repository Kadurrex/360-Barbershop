// WhatsApp Notification Service using CallMeBot API (Free & Easy)
// Alternative: You can also use Twilio, WhatsApp Business API, or other services

const axios = require('axios');

// Your phone number: 0535594136
const PHONE_NUMBER = '972535594136'; // Format: 972 (Israel) + your number without leading 0

/**
 * Send WhatsApp message using CallMeBot API (FREE!)
 * Setup: 
 * 1. Save this number in your phone: +34 644 21 69 69
 * 2. Send this message to it on WhatsApp: "I allow callmebot to send me messages"
 * 3. You'll get an API key in response
 * 4. Replace 'YOUR_API_KEY' below with the key you received
 */

async function sendWhatsAppNotification(appointmentData) {
    // Your CallMeBot API key (you need to get this first)
    const API_KEY = 'YOUR_API_KEY'; // Replace with actual API key after setup
    
    // Format the message
    const message = `
🎉 תור חדש במספרה 360!

👤 שם: ${appointmentData.name}
📞 טלפון: ${appointmentData.phone}
📧 אימייל: ${appointmentData.email}
💇 שירות: ${getServiceName(appointmentData.service)}
📅 תאריך: ${appointmentData.date}
🕐 שעה: ${appointmentData.time}
📝 הערות: ${appointmentData.notes || 'ללא'}

לצפייה בכל התורים: http://localhost:3000/api/appointments
    `.trim();

    try {
        // If API key is not set, just log to console
        if (API_KEY === 'YOUR_API_KEY') {
            console.log('\n⚠️  WhatsApp notification not configured yet!');
            console.log('📱 To enable WhatsApp notifications:');
            console.log('1. Save +34 644 21 69 69 in your phone contacts');
            console.log('2. Send "I allow callmebot to send me messages" to this number on WhatsApp');
            console.log('3. You will receive an API key');
            console.log('4. Add the API key to whatsapp-service.js\n');
            return false;
        }

        // Send via CallMeBot API
        const url = `https://api.callmebot.com/whatsapp.php`;
        const response = await axios.get(url, {
            params: {
                phone: PHONE_NUMBER,
                text: message,
                apikey: API_KEY
            }
        });

        console.log('✅ WhatsApp notification sent successfully!');
        return true;
    } catch (error) {
        console.error('❌ Failed to send WhatsApp notification:', error.message);
        return false;
    }
}

/**
 * Alternative: Send via direct WhatsApp Web link (opens on user's device)
 */
function getWhatsAppLink(appointmentData) {
    const message = `תור חדש: ${appointmentData.name}, ${appointmentData.phone}, ${appointmentData.date} ${appointmentData.time}`;
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${PHONE_NUMBER}?text=${encodedMessage}`;
}

/**
 * Get service name in Hebrew
 */
function getServiceName(serviceCode) {
    const services = {
        'haircut-men': 'תספורת גברים',
        'haircut-women': 'תספורת נשים',
        'haircut-kids': 'תספורת ילדים',
        'coloring': 'צביעת שיער',
        'straightening': 'החלקת שיער',
        'event-styling': 'תסרוקות אירועים'
    };
    return services[serviceCode] || serviceCode;
}

module.exports = {
    sendWhatsAppNotification,
    getWhatsAppLink
};

