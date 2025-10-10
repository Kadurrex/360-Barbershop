// Set minimum date to today
// Mobile Menu Toggle
const menuToggle = document.querySelector('.menu-toggle');
const navMenu = document.querySelector('.nav-menu');

menuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    menuToggle.classList.toggle('active');
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-menu') && !e.target.closest('.menu-toggle')) {
        navMenu.classList.remove('active');
        menuToggle.classList.remove('active');
    }
});

// Close menu when clicking a link
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        menuToggle.classList.remove('active');
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
    
    // Load reviews
    loadReviews();
    
    // Handle review form submission
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitButton = this.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'שולח...';
            submitButton.disabled = true;
            
            const ratingInput = document.querySelector('input[name="rating"]:checked');
            if (!ratingInput) {
                alert('אנא בחר דירוג');
                submitButton.textContent = originalText;
                submitButton.disabled = false;
                return;
            }
            
            const formData = {
                name: document.getElementById('reviewName').value,
                rating: parseInt(ratingInput.value),
                text: document.getElementById('reviewText').value
            };
            
            try {
                const response = await fetch('/api/reviews', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    // Reset form
                    reviewForm.reset();
                    // Reload reviews
                    loadReviews();
                    // Show success message
                    alert('תודה על הביקורת! הביקורת שלך נוספה בהצלחה ✨');
                } else {
                    alert(result.error || 'אירעה שגיאה בשליחת הביקורת');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('אירעה שגיאה בשליחת הביקורת');
            } finally {
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }
        });
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
    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(26, 26, 26, 1)';
    } else {
        navbar.style.background = 'rgba(26, 26, 26, 0.95)';
    }
});

// Reviews functionality
async function loadReviews() {
    try {
        const response = await fetch('/api/reviews');
        const reviews = await response.json();
        
        const container = document.getElementById('reviewsContainer');
        
        if (reviews.length === 0) {
            container.innerHTML = `
                <div class="no-reviews">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="2"/>
                        <path d="M8 14C8 14 9.5 16 12 16C14.5 16 16 14 16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        <circle cx="9" cy="9" r="1" fill="currentColor"/>
                        <circle cx="15" cy="9" r="1" fill="currentColor"/>
                    </svg>
                    <p>עדיין אין ביקורות. היה הראשון לשתף את החוויה שלך!</p>
                </div>
            `;
            return;
        }
        
        // Sort reviews by date (newest first)
        reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        container.innerHTML = reviews.map(review => `
            <div class="review-card">
                <div class="review-header">
                    <div class="review-name">${review.name}</div>
                    <div class="review-rating">${'⭐'.repeat(review.rating)}</div>
                </div>
                <p class="review-text">${review.text}</p>
                <div class="review-date">${formatReviewDate(review.createdAt)}</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading reviews:', error);
    }
}

function formatReviewDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return 'היום';
    } else if (diffDays === 1) {
        return 'אתמול';
    } else if (diffDays < 7) {
        return `לפני ${diffDays} ימים`;
    } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `לפני ${weeks} ${weeks === 1 ? 'שבוע' : 'שבועות'}`;
    } else {
        return date.toLocaleDateString('he-IL');
    }
}

