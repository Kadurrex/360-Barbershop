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
            const result = await response.json();
            
            // Show WhatsApp link if appointment was approved
            if (result.whatsappLink) {
                showWhatsAppLink(result.whatsappLink, result.appointment.name);
            }
            
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

/**
 * Show WhatsApp link in a popup/modal
 */
function showWhatsAppLink(whatsappLink, clientName) {
    // Create a modal popup
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 10px;
        max-width: 500px;
        width: 90%;
        text-align: center;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;
    
    modalContent.innerHTML = `
        <h3 style="color: #25D366; margin-bottom: 20px;">📱 שליחת הודעת WhatsApp</h3>
        <p style="margin-bottom: 20px;">התור של <strong>${clientName}</strong> אושר בהצלחה!</p>
        <p style="margin-bottom: 20px;">לחץ על הכפתור למטה כדי לשלוח הודעת אישור ללקוח:</p>
        
        <a href="${whatsappLink}" target="_blank" style="
            display: inline-block;
            background: #25D366;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 25px;
            font-weight: bold;
            margin: 10px;
            transition: background 0.3s;
        " onmouseover="this.style.background='#128C7E'" onmouseout="this.style.background='#25D366'">
            📱 פתח WhatsApp
        </a>
        
        <button onclick="this.closest('.modal').remove()" style="
            background: #666;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            margin: 10px;
        ">
            סגור
        </button>
        
        <div style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 5px;">
            <small style="color: #666;">
                💡 טיפ: הכפתור יפתח WhatsApp Web עם ההודעה מוכנה לשליחה
            </small>
        </div>
    `;
    
    modal.className = 'modal';
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    // Auto-close after 30 seconds
    setTimeout(() => {
        if (document.body.contains(modal)) {
            modal.remove();
        }
    }, 30000);
}