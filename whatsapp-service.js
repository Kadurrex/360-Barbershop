// WhatsApp Notification Service - SIMPLE VERSION
// This version just creates a clickable link and shows enhanced console notifications

const axios = require('axios');

// Your phone number: 0535594136
const PHONE_NUMBER = '972535594136'; // Format: 972 (Israel) + your number without leading 0

/**
 * Send WhatsApp notification - AUTOMATIC VERSION
 * This creates a WhatsApp link that you can click to open directly
 */

async function sendWhatsAppNotification(appointmentData) {
    // Format the message
    const message = `
🎉 *תור חדש במספרה 360!*

👤 *שם:* ${appointmentData.name}
📞 *טלפון:* ${appointmentData.phone}
📧 *אימייל:* ${appointmentData.email}
💇 *שירות:* ${getServiceName(appointmentData.service)}
📅 *תאריך:* ${appointmentData.date}
🕐 *שעה:* ${appointmentData.time}
📝 *הערות:* ${appointmentData.notes || 'ללא'}
    `.trim();

    // Create WhatsApp link
    const whatsappLink = `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(message)}`;
    
    // Enhanced console notification
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║     🎉 תור חדש נקבע! NEW BOOKING!    ║');
    console.log('╚════════════════════════════════════════╝\n');
    console.log('👤 שם / Name:', appointmentData.name);
    console.log('📞 טלפון / Phone:', appointmentData.phone);
    console.log('📧 אימייל / Email:', appointmentData.email);
    console.log('💇 שירות / Service:', getServiceName(appointmentData.service));
    console.log('📅 תאריך / Date:', appointmentData.date);
    console.log('🕐 שעה / Time:', appointmentData.time);
    console.log('📝 הערות / Notes:', appointmentData.notes || 'ללא / None');
    console.log('\n📱 WhatsApp Link (click to send):');
    console.log(whatsappLink);
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║  Copy the link above and paste in     ║');
    console.log('║  your browser to send via WhatsApp!   ║');
    console.log('╚════════════════════════════════════════╝\n');
    
    // Try to open in browser automatically (Windows)
    try {
        const { exec } = require('child_process');
        exec(`start ${whatsappLink}`);
        console.log('✅ WhatsApp link opened in browser!\n');
    } catch (error) {
        console.log('ℹ️  Please copy and paste the link above to send via WhatsApp\n');
    }
    
    return true;
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

