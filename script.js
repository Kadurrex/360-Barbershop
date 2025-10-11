// Set minimum date to today
// Mobile Menu Toggle - Shopify Style
const menuToggle = document.querySelector('.menu-toggle');
const navMenu = document.querySelector('.nav-menu');

menuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    menuToggle.classList.toggle('active');
    document.body.classList.toggle('menu-open');
});

// Close menu when clicking outside (on overlay)
document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-menu') && !e.target.closest('.menu-toggle') && navMenu.classList.contains('active')) {
        navMenu.classList.remove('active');
        menuToggle.classList.remove('active');
        document.body.classList.remove('menu-open');
    }
});

// Close menu when clicking a link
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        menuToggle.classList.remove('active');
        document.body.classList.remove('menu-open');
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const dateInput = document.getElementById('date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
        
        // Set default date to today
        dateInput.value = today;
        
        // Load available slots for today
        loadAvailableSlots(today);
        
        // When date changes, update available slots
        dateInput.addEventListener('change', function() {
            loadAvailableSlots(this.value);
        });
        
        // Auto-refresh available slots every 10 seconds
        setInterval(() => {
            const currentDate = dateInput.value;
            if (currentDate) {
                loadAvailableSlots(currentDate);
                console.log('🔄 Auto-refreshed available slots');
            }
        }, 10000); // 10 seconds
    }
});

// Load available time slots for selected date
async function loadAvailableSlots(date) {
    try {
        const response = await fetch(`/api/available-slots/${date}`);
        const data = await response.json();
        
        const timeSelect = document.getElementById('time');
        const currentValue = timeSelect.value;
        
        // Clear existing options
        timeSelect.innerHTML = '<option value="">בחר שעה</option>';
        
        if (data.availableSlots.length === 0) {
            timeSelect.innerHTML += '<option value="" disabled>אין שעות פנויות ליום זה</option>';
            return;
        }
        
        // Add available slots
        data.availableSlots.forEach(slot => {
            const option = document.createElement('option');
            option.value = slot;
            option.textContent = slot;
            timeSelect.appendChild(option);
        });
        
        // Restore previous value if still available
        if (data.availableSlots.includes(currentValue)) {
            timeSelect.value = currentValue;
        }
        
        // Show message if some slots are booked
        if (data.bookedSlots.length > 0) {
            console.log(`${data.bookedSlots.length} time slots already booked for ${date}`);
        }
    } catch (error) {
        console.error('Error loading available slots:', error);
    }
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Form submission handling
document.getElementById('appointmentForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitButton = this.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'שולח...';
    submitButton.disabled = true;
    
    const formData = {
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value,
        service: document.getElementById('service').value,
        date: document.getElementById('date').value,
        time: document.getElementById('time').value,
        notes: document.getElementById('notes').value
    };
    
    // Get service name for display
    const serviceSelect = document.getElementById('service');
    const serviceName = serviceSelect.options[serviceSelect.selectedIndex].text;
    
    try {
        // Send data to server
        const response = await fetch('/api/appointments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Hide form and show success message
            document.getElementById('appointmentForm').style.display = 'none';
            document.getElementById('successMessage').style.display = 'block';
            
            // Scroll to success message smoothly
            document.getElementById('successMessage').scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            
            // Reset form and show it again after 5 seconds
            setTimeout(() => {
                document.getElementById('appointmentForm').reset();
                document.getElementById('appointmentForm').style.display = 'block';
                document.getElementById('successMessage').style.display = 'none';
                submitButton.textContent = originalText;
                submitButton.disabled = false;
                
                // Reset date to today and reload slots
                const today = new Date().toISOString().split('T')[0];
                document.getElementById('date').value = today;
                loadAvailableSlots(today);
            }, 5000);
        } else {
            // Show error message
            alert(result.error || 'אירעה שגיאה בשליחת הטופס. אנא נסה שוב.');
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    } catch (error) {
        console.error('Error:', error);
        alert('אירעה שגיאה בשליחת הטופס. אנא נסה שוב.');
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
});

// Add animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all sections
document.querySelectorAll('section').forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(30px)';
    section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(section);
});

// Add navbar scroll effect
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

