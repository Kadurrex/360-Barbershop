// Admin Dashboard JavaScript
const ADMIN_PASSWORD = '360admin';
let appointments = [];
let currentFilter = 'all';
let authToken = '';
let refreshInterval;

// Check if already logged in
if (localStorage.getItem('adminLoggedIn') === 'true') {
    authToken = localStorage.getItem('authToken');
    if (authToken) {
        showDashboard();
    } else {
        logout(); // Invalid state, force logout
    }
}

// Login form handler
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const password = document.getElementById('password').value;
    
    if (password === ADMIN_PASSWORD) {
        authToken = `Bearer ${ADMIN_PASSWORD}`;
        localStorage.setItem('adminLoggedIn', 'true');
        localStorage.setItem('authToken', authToken);
        showDashboard();
    } else {
        document.getElementById('loginError').style.display = 'block';
    }
});

function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    loadAppointments();
    
    // Clear any existing refresh interval
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    
    // Refresh every 15 seconds for better responsiveness
    refreshInterval = setInterval(loadAppointments, 15000);
}

function logout() {
    // Clear refresh interval
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
    
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('authToken');
    location.reload();
}

async function loadAppointments() {
    try {
        const response = await fetch('/api/appointments', {
            headers: {
                'Authorization': authToken
            }
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        appointments = await response.json();
        
        // Sort by creation timestamp (newest first)
        appointments.sort((a, b) => {
            const timeA = parseInt(a.id) || 0;
            const timeB = parseInt(b.id) || 0;
            return timeB - timeA;
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
        <div class="appointment-card" data-id="${apt.id}">
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
                'Content-Type': 'application/json',
                'Authorization': authToken
            },
            body: JSON.stringify({ status })
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        if (response.ok) {
            loadAppointments();
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
            method: 'DELETE',
            headers: {
                'Authorization': authToken
            }
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        if (response.ok) {
            loadAppointments();
        }
    } catch (error) {
        console.error('Error deleting appointment:', error);
        alert('שגיאה במחיקת התור');
    }
}