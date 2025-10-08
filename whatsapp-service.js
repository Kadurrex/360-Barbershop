// Enhanced WhatsApp Notification Service
// Supports: Owner notifications, Client confirmations, Reminders

const axios = require('axios');
const { exec } = require('child_process');

// Your phone number: 0535594136
const OWNER_PHONE = '972535594136';

/**
 * Send WhatsApp notification to owner about new appointment
 */
async function sendOwnerNotification(appointmentData) {
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

    const whatsappLink = `https://wa.me/${OWNER_PHONE}?text=${encodeURIComponent(message)}`;
    
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
    console.log('\n📱 WhatsApp Link:');
    console.log(whatsappLink);
    console.log('\n╚════════════════════════════════════════╝\n');
    
    try {
        exec(`start ${whatsappLink}`);
        console.log('✅ WhatsApp link opened!\n');
    } catch (error) {
        console.log('ℹ️  Copy and paste the link above\n');
    }
    
    return true;
}

/**
 * Send WhatsApp confirmation to client after approval
 */
async function sendClientConfirmation(appointmentData) {
    // Format Israeli phone number (remove leading 0, add 972)
    let clientPhone = appointmentData.phone.replace(/^0/, '972').replace(/\D/g, '');
    
    const message = `
✅ *התור שלך אושר!*

שלום ${appointmentData.name}! 👋

התור שלך במספרת 360 מעלות אושר בהצלחה!

📅 *תאריך:* ${formatDateHebrew(appointmentData.date)}
🕐 *שעה:* ${appointmentData.time}
💇 *שירות:* ${getServiceName(appointmentData.service)}

📍 *כתובת:* ויצמן 1, כפר סבא
📞 *טלפון:* 09-7736351

⏰ תקבל תזכורת חצי שעה לפני התור.

נתראה בקרוב! 💈
    `.trim();

    const whatsappLink = `https://wa.me/${clientPhone}?text=${encodeURIComponent(message)}`;
    
    console.log('\n📱 שליחת אישור ללקוח...');
    console.log(`טלפון: ${appointmentData.phone}`);
    console.log(`קישור: ${whatsappLink}\n`);
    
    try {
        exec(`start ${whatsappLink}`);
        console.log('✅ Confirmation link opened!\n');
        return { success: true, link: whatsappLink };
    } catch (error) {
        console.log('ℹ️  Manual confirmation needed\n');
        return { success: false, link: whatsappLink };
    }
}

/**
 * Send WhatsApp reminder 30 minutes before appointment
 */
async function sendClientReminder(appointmentData) {
    let clientPhone = appointmentData.phone.replace(/^0/, '972').replace(/\D/g, '');
    
    const message = `
⏰ *תזכורת לתור!*

שלום ${appointmentData.name}! 👋

מזכירים לך שיש לך תור במספרת 360 מעלות *בעוד חצי שעה!*

🕐 *שעה:* ${appointmentData.time}
💇 *שירות:* ${getServiceName(appointmentData.service)}

📍 *כתובת:* ויצמן 1, כפר סבא
📞 *טלפון:* 09-7736351

אנחנו מחכים לך! 💈
    `.trim();

    const whatsappLink = `https://wa.me/${clientPhone}?text=${encodeURIComponent(message)}`;
    
    console.log('\n⏰ שליחת תזכורת ללקוח...');
    console.log(`שם: ${appointmentData.name}`);
    console.log(`שעה: ${appointmentData.time}`);
    console.log(`קישור: ${whatsappLink}\n`);
    
    try {
        exec(`start ${whatsappLink}`);
        console.log('✅ Reminder link opened!\n');
        return { success: true, link: whatsappLink };
    } catch (error) {
        console.log('ℹ️  Manual reminder needed\n');
        return { success: false, link: whatsappLink };
    }
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

/**
 * Send WhatsApp notification when appointment is unapproved
 */
async function sendUnapprovalNotification(appointmentData) {
    let clientPhone = appointmentData.phone.replace(/^0/, '972').replace(/\D/g, '');
    
    const message = `
⚠️ *עדכון לגבי התור שלך*

שלום ${appointmentData.name},

התור שלך במספרת 360 מעלות בוטל מאישור.

📅 *תאריך:* ${formatDateHebrew(appointmentData.date)}
🕐 *שעה:* ${appointmentData.time}

ייתכן שנצטרך לשנות את המועד. נחזור אליך בהקדם!

📞 *לשאלות:* 053-5594136

סליחה על אי הנוחות 🙏
    `.trim();

    const whatsappLink = `https://wa.me/${clientPhone}?text=${encodeURIComponent(message)}`;
    
    console.log('\n⚠️  שליחת ביטול אישור ללקוח...');
    console.log(`שם: ${appointmentData.name}`);
    console.log(`טלפון: ${appointmentData.phone}`);
    console.log(`קישור: ${whatsappLink}\n`);
    
    try {
        exec(`start ${whatsappLink}`);
        console.log('✅ Unapproval notification link opened!\n');
        return { success: true, link: whatsappLink };
    } catch (error) {
        console.log('ℹ️  Manual notification needed\n');
        return { success: false, link: whatsappLink };
    }
}

/**
 * Format date in Hebrew
 */
function formatDateHebrew(dateString) {
    const date = new Date(dateString);
    const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    
    return `יום ${dayName}, ${day}/${month}/${year}`;
}

module.exports = {
    sendOwnerNotification,
    sendClientConfirmation,
    sendClientReminder,
    sendUnapprovalNotification
};
