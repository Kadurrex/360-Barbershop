// Set minimum date to today
document.addEventListener('DOMContentLoaded', function() {
    const dateInput = document.getElementById('date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
    
    // Set default date to today
    dateInput.value = today;
});

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
    
    const formData = {
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
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
        
        if (response.ok) {
            // Hide form and show success message
            document.getElementById('appointmentForm').style.display = 'none';
            document.getElementById('successMessage').style.display = 'block';
            
            // Reset form and show it again after 5 seconds
            setTimeout(() => {
                document.getElementById('appointmentForm').reset();
                document.getElementById('appointmentForm').style.display = 'block';
                document.getElementById('successMessage').style.display = 'none';
                
                // Reset date to today
                const today = new Date().toISOString().split('T')[0];
                document.getElementById('date').value = today;
            }, 5000);
        } else {
            alert('אירעה שגיאה בשליחת הטופס. אנא נסה שוב.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('אירעה שגיאה בשליחת הטופס. אנא נסה שוב.');
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
    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(26, 26, 26, 1)';
    } else {
        navbar.style.background = 'rgba(26, 26, 26, 0.95)';
    }
});

