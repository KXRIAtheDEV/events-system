// ============================================
// CONTACT PAGE - Form Submission with Validation
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
        
        // Add real-time validation
        addRealTimeValidation();
    }
});

function addRealTimeValidation() {
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const subjectInput = document.getElementById('subject');
    const messageInput = document.getElementById('message');
    
    if (nameInput) {
        nameInput.addEventListener('input', function() {
            validateName(this);
        });
        nameInput.addEventListener('blur', function() {
            validateName(this);
        });
    }
    
    if (emailInput) {
        emailInput.addEventListener('input', function() {
            validateEmail(this);
        });
        emailInput.addEventListener('blur', function() {
            validateEmail(this);
        });
    }
    
    if (subjectInput) {
        subjectInput.addEventListener('input', function() {
            validateSubject(this);
        });
        subjectInput.addEventListener('blur', function() {
            validateSubject(this);
        });
    }
    
    if (messageInput) {
        messageInput.addEventListener('input', function() {
            validateMessage(this);
        });
        messageInput.addEventListener('blur', function() {
            validateMessage(this);
        });
    }
}

function validateName(input) {
    const value = input.value.trim();
    const errorElement = document.getElementById('nameError');
    
    if (!value) {
        showFieldError(input, errorElement, 'Please enter your name');
        return false;
    }
    
    // Check if name contains only letters, spaces, hyphens, and apostrophes
    const nameRegex = /^[A-Za-z\s\-']+$/;
    if (!nameRegex.test(value)) {
        showFieldError(input, errorElement, 'Name can only contain letters, spaces, hyphens, and apostrophes');
        return false;
    }
    
    // Check if name contains numbers
    if (/\d/.test(value)) {
        showFieldError(input, errorElement, 'Name cannot contain numbers');
        return false;
    }
    
    // Check minimum length
    if (value.length < 2) {
        showFieldError(input, errorElement, 'Name must be at least 2 characters');
        return false;
    }
    
    // Check maximum length
    if (value.length > 100) {
        showFieldError(input, errorElement, 'Name cannot exceed 100 characters');
        return false;
    }
    
    clearFieldError(input, errorElement);
    return true;
}

function validateEmail(input) {
    const value = input.value.trim();
    const errorElement = document.getElementById('emailError');
    
    if (!value) {
        showFieldError(input, errorElement, 'Please enter your email address');
        return false;
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
        showFieldError(input, errorElement, 'Please enter a valid email address (e.g., name@example.com)');
        return false;
    }
    
    // Check for valid domain extension
    const domain = value.split('@')[1];
    if (domain && !domain.includes('.')) {
        showFieldError(input, errorElement, 'Please enter a valid domain (e.g., .com, .co.ke, .org)');
        return false;
    }
    
    // Check maximum length
    if (value.length > 255) {
        showFieldError(input, errorElement, 'Email address cannot exceed 255 characters');
        return false;
    }
    
    clearFieldError(input, errorElement);
    return true;
}

function validateSubject(input) {
    const value = input.value.trim();
    const errorElement = document.getElementById('subjectError');
    
    if (!value) {
        showFieldError(input, errorElement, 'Please enter a subject');
        return false;
    }
    
    // Check minimum length
    if (value.length < 3) {
        showFieldError(input, errorElement, 'Subject must be at least 3 characters');
        return false;
    }
    
    // Check maximum length
    if (value.length > 200) {
        showFieldError(input, errorElement, 'Subject cannot exceed 200 characters');
        return false;
    }
    
    clearFieldError(input, errorElement);
    return true;
}

function validateMessage(input) {
    const value = input.value.trim();
    const errorElement = document.getElementById('messageError');
    
    if (!value) {
        showFieldError(input, errorElement, 'Please enter your message');
        return false;
    }
    
    // Check minimum length
    if (value.length < 10) {
        showFieldError(input, errorElement, 'Message must be at least 10 characters');
        return false;
    }
    
    // Check maximum length
    if (value.length > 5000) {
        showFieldError(input, errorElement, 'Message cannot exceed 5000 characters');
        return false;
    }
    
    clearFieldError(input, errorElement);
    return true;
}

function showFieldError(input, errorElement, message) {
    input.classList.add('error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

function clearFieldError(input, errorElement) {
    input.classList.remove('error');
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    }
}

async function handleContactSubmit(e) {
    e.preventDefault();
    
    // Validate all fields
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const subjectInput = document.getElementById('subject');
    const messageInput = document.getElementById('message');
    
    const isNameValid = validateName(nameInput);
    const isEmailValid = validateEmail(emailInput);
    const isSubjectValid = validateSubject(subjectInput);
    const isMessageValid = validateMessage(messageInput);
    
    if (!isNameValid || !isEmailValid || !isSubjectValid || !isMessageValid) {
        showToast('Please fix the errors in the form', 'error');
        return;
    }
    
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const subject = subjectInput.value.trim();
    const message = messageInput.value.trim();
    
    const submitBtn = document.querySelector('#contactForm button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    
    try {
        // Use support API to create a ticket
        if (window.AttendeeAPIEndpoints && window.AttendeeAPIEndpoints.support) {
            await window.AttendeeAPIEndpoints.support.createTicket(
                subject,
                'general',
                `Name: ${name}\nEmail: ${email}\n\nMessage: ${message}`
            );
        } else {
            // Fallback to direct API call
            const response = await fetch('/api/attendee/support/tickets/create/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCSRFToken()
                },
                body: JSON.stringify({
                    subject: subject,
                    category: 'general',
                    message: `Name: ${name}\nEmail: ${email}\n\nMessage: ${message}`
                })
            });
            
            if (!response.ok) throw new Error('Failed to send message');
        }
        
        showToast('Message sent successfully! We\'ll get back to you soon.', 'success');
        contactForm.reset();
        
        // Clear any remaining error styles
        [nameInput, emailInput, subjectInput, messageInput].forEach(input => {
            input.classList.remove('error');
        });
        
    } catch (error) {
        console.error('Contact form error:', error);
        showToast(error.message || 'Failed to send message. Please try again.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

function getCSRFToken() {
    const cookieValue = document.cookie.match('(^|; )csrftoken=([^;]*)');
    return cookieValue ? cookieValue[2] : null;
}

function showToast(message, type = 'success') {
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i><span>${escapeHtml(message)}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
