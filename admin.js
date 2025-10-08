// Admin Dashboard JavaScript
const ADMIN_PASSWORD = '360admin'; // Change this to your password!
let appointments = [];
let currentFilter = 'all';

// Check if already logged in
if (localStorage.getItem('adminLoggedIn') === 'true') {
    showDashboard();
}

// Login form handler
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const password = document.getElementById('password').value;
    
    if (password === ADMIN_PASSWORD) {
        localStorage.setItem('adminLoggedIn', 'true');
        showDashboard();
    } else {
        document.getElementById('loginError').style.display = 'block';
    }
});

function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    loadAppointments();
    // Refresh every 30 seconds
    setInterval(loadAppointments, 30000);
}

function logout() {
    localStorage.removeItem('adminLoggedIn');
    location.reload();
}

async function loadAppointments() {
    try {
        const response = await fetch('/api/appointments');
        appointments = await response.json();
        
        // Sort by date and time (newest first)
        appointments.sort((a, b) => {
            const dateA = new Date(a.date + ' ' + a.time);
            const dateB = new Date(b.date + ' ' + b.time);
            return dateB - dateA;
        });
        
        updateStats();
        displayAppointments();
    } catch (error) {
        console.error('Error loading appointments:', error);
    }
}

function updateStats() {
    const today = new Date().toISOString().split('T')[0];
    const weekLater = new Date();
    weekLater.setDate(weekLater.getDate() + 7);
    
    const todayAppts = appointments.filter(apt => apt.date === today);
    const pendingAppts = appointments.filter(apt => apt.status === 'pending' || !apt.status);
    const weekAppts = appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate >= new Date() && aptDate <= weekLater;
    });
    
    document.getElementById('totalAppointments').textContent = appointments.length;
    document.getElementById('todayAppointments').textContent = todayAppts.length;
    document.getElementById('pendingAppointments').textContent = pendingAppts.length;
    document.getElementById('weekAppointments').textContent = weekAppts.length;
}

function displayAppointments() {
    const container = document.getElementById('appointmentsList');
    let filteredAppts = appointments;
    
    // Apply filter
    const today = new Date().toISOString().split('T')[0];
    
    if (currentFilter === 'pending') {
        filteredAppts = appointments.filter(apt => apt.status === 'pending' || !apt.status);
    } else if (currentFilter === 'approved') {
        filteredAppts = appointments.filter(apt => apt.status === 'approved');
    } else if (currentFilter === 'today') {
        filteredAppts = appointments.filter(apt => apt.date === today);
    }
    
    if (filteredAppts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
                </svg>
                <h3>אין תורים להצגה</h3>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filteredAppts.map(apt => `
        <div class="appointment-card">
            <div class="appointment-header">
                <h4>${apt.name}</h4>
                <span class="appointment-status status-${apt.status || 'pending'}">
                    ${getStatusText(apt.status)}
                </span>
            </div>
            <div class="appointment-details">
                <div class="detail-item">
                    <strong>📞 טלפון:</strong>
                    <span>${apt.phone}</span>
                </div>
                <div class="detail-item">
                    <strong>📧 אימייל:</strong>
                    <span>${apt.email}</span>
                </div>
                <div class="detail-item">
                    <strong>💇 שירות:</strong>
                    <span>${getServiceName(apt.service)}</span>
                </div>
                <div class="detail-item">
                    <strong>📅 תאריך:</strong>
                    <span>${formatDate(apt.date)}</span>
                </div>
                <div class="detail-item">
                    <strong>🕐 שעה:</strong>
                    <span>${apt.time}</span>
                </div>
            </div>
            ${apt.notes ? `<div style="margin-top: 1rem;"><strong style="color: #f0e68c;">📝 הערות:</strong> ${apt.notes}</div>` : ''}
            <div class="appointment-actions">
                ${apt.status === 'pending' ? `<button class="btn btn-approve" onclick="updateStatus('${apt.id}', 'approved')">אשר תור</button>` : ''}
                ${apt.status === 'approved' ? `<button class="btn btn-pending" onclick="updateStatus('${apt.id}', 'pending')">בטל אישור</button>` : ''}
                ${apt.status !== 'cancelled' ? `<button class="btn btn-cancel" onclick="updateStatus('${apt.id}', 'cancelled')">בטל תור</button>` : ''}
                <button class="btn btn-calendar" onclick="addToGoogleCalendar('${apt.id}')">📅 הוסף ליומן</button>
                <button class="btn btn-delete" onclick="deleteAppointment('${apt.id}')">מחק</button>
            </div>
        </div>
    `).join('');
}

function getStatusText(status) {
    const statuses = {
        'pending': 'ממתין לאישור',
        'approved': 'מאושר',
        'cancelled': 'בוטל'
    };
    return statuses[status] || 'ממתין לאישור';
}

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

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
    });
}

function filterAppointments(filter) {
    currentFilter = filter;
    
    // Update button states
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    displayAppointments();
}

async function updateStatus(id, status) {
    try {
        const response = await fetch(`/api/appointments/${id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });
        
        if (response.ok) {
            loadAppointments();
            // Calendar is now manual - just click the button if needed
        }
    } catch (error) {
        console.error('Error updating status:', error);
        alert('שגיאה בעדכון הסטטוס');
    }
}

async function deleteAppointment(id) {
    if (!confirm('האם אתה בטוח שברצונך למחוק את התור?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/appointments/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadAppointments();
        }
    } catch (error) {
        console.error('Error deleting appointment:', error);
        alert('שגיאה במחיקת התור');
    }
}

function addToGoogleCalendar(id) {
    const appointment = appointments.find(apt => apt.id === id);
    if (!appointment) return;
    
    // Create event details
    const title = `תור במספרה 360 - ${appointment.name}`;
    const description = `
שירות: ${getServiceName(appointment.service)}
לקוח: ${appointment.name}
טלפון: ${appointment.phone}
אימייל: ${appointment.email}
הערות: ${appointment.notes || 'ללא'}
    `.trim();
    
    // Parse date and time
    const startDateTime = new Date(appointment.date + 'T' + appointment.time);
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // +1 hour
    
    // Format for Google Calendar
    const formatGoogleDate = (date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const startFormatted = formatGoogleDate(startDateTime);
    const endFormatted = formatGoogleDate(endDateTime);
    
    // Create Google Calendar URL
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE` +
        `&text=${encodeURIComponent(title)}` +
        `&details=${encodeURIComponent(description)}` +
        `&location=${encodeURIComponent('ויצמן 1, כפר סבא')}` +
        `&dates=${startFormatted}/${endFormatted}`;
    
    // Open in new tab
    window.open(calendarUrl, '_blank');
}

