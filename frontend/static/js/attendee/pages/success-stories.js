// ============================================
// SUCCESS STORIES PAGE - Complete Functionality
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // ========== DEFAULT STORIES DATA ==========
    const defaultStories = [
        {
            id: 1,
            name: 'Yvonne Eshitemi',
            role: 'Event Enthusiast',
            rating: 5,
            message: 'EventHub made it so easy to discover and book tickets for amazing events in Nairobi. The QR code check-in was seamless!',
            event: 'Music Festival 2024',
            avatar: 'https://randomuser.me/api/portraits/women/16.jpg',
            date: '2024-03-15'
        },
        {
            id: 2,
            name: 'Wilson Thoma',
            role: 'Regular Attendee',
            rating: 5,
            message: 'I\'ve attended over 20 events through EventHub. The platform is reliable, and customer support is exceptional!',
            event: '20+ Events',
            avatar: 'https://randomuser.me/api/portraits/men/80.jpg',
            date: '2024-03-10'
        },
        {
            id: 3,
            name: 'Scholasticah Mutuku',
            role: 'Adventure Seeker',
            rating: 5,
            message: 'Best event discovery platform in Kenya! The variety of events and ease of booking is unmatched.',
            event: 'Cultural Fest 2024',
            avatar: 'https://randomuser.me/api/portraits/women/89.jpg',
            date: '2024-03-05'
        },
        {
            id: 4,
            name: 'Brad Omwamba',
            role: 'Event Organizer',
            rating: 5,
            message: 'As an event organizer, EventHub helped us sell out our event in record time. The support team is amazing!',
            event: 'Tech Summit 2024',
            avatar: 'https://randomuser.me/api/portraits/men/70.jpg',
            date: '2024-02-28'
        },
        {
            id: 5,
            name: 'Bullim Njeri',
            role: 'Mobile User',
            rating: 5,
            message: 'The mobile app is fantastic! I can browse, book, and check-in using my phone. No more paper tickets!',
            event: 'Food Festival 2024',
            avatar: 'https://randomuser.me/api/portraits/women/90.jpg',
            date: '2024-02-20'
        },
        {
            id: 6,
            name: 'Toji Mraster',
            role: 'First-time User',
            rating: 5,
            message: 'The customer service team went above and beyond to help me with a booking issue. Exceptional service!',
            event: 'Business Forum',
            avatar: 'https://randomuser.me/api/portraits/men/55.jpg',
            date: '2024-02-15'
        },
        {
            id: 7,
            name: 'Stacy Naomi',
            role: 'Entrepreneur',
            rating: 5,
            message: 'The networking opportunities through EventHub\'s business events have been invaluable for my startup!',
            event: 'Business Summit',
            avatar: 'https://randomuser.me/api/portraits/women/69.jpg',
            date: '2024-02-10'
        },
        {
            id: 8,
            name: 'Frank Maina',
            role: 'Sports Fan',
            rating: 5,
            message: 'Getting tickets for major sports events has never been easier. EventHub is a game-changer for sports fans!',
            event: 'Marathon 2024',
            avatar: 'https://randomuser.me/api/portraits/men/16.jpg',
            date: '2024-02-05'
        },
        {
            id: 9,
            name: 'Dev Ndung\'u',
            role: 'Foodie',
            rating: 5,
            message: 'The food festivals and culinary events I found on EventHub were incredible. Can\'t wait for more!',
            event: 'Food Festival 2024',
            avatar: 'https://randomuser.me/api/portraits/women/92.jpg',
            date: '2024-01-28'
        },
        {
            id: 10,
            name: 'Catherine Cherop',
            role: 'Art Lover',
            rating: 5,
            message: 'Thanks to EventHub, I discovered amazing art exhibitions I would have otherwise missed. Great platform!',
            event: 'Art Exhibition',
            avatar: 'https://randomuser.me/api/portraits/women/62.jpg',
            date: '2024-01-20'
        },
        {
            id: 11,
            name: 'Brian Odhiambo',
            role: 'Music Producer',
            rating: 5,
            message: 'EventHub has transformed how I discover local talent and music events. Absolutely love the platform!',
            event: 'Music Concert',
            avatar: 'https://randomuser.me/api/portraits/men/25.jpg',
            date: '2024-01-15'
        }
    ];
    
    // ========== STORIES ARRAY ==========
    let allStories = [];
    let currentPage = 1;
    const cardsPerPage = 3;
    let totalPages = 1;
    
    // ========== DOM ELEMENTS ==========
    const testimonialsGrid = document.getElementById('testimonialsGrid');
    const readMoreBtn = document.getElementById('readMoreBtn');
    const shareStoryBtn = document.getElementById('shareStoryBtn');
    const storyModal = document.getElementById('storyModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const storyForm = document.getElementById('storyForm');
    
    // ========== HELPER FUNCTIONS ==========
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    function generateStars(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += `<i class="fas fa-star"></i>`;
        }
        return stars;
    }
    
    // ========== CREATE STORY CARD ==========
    function createStoryCard(story) {
        const card = document.createElement('div');
        card.className = 'testimonial-card';
        card.setAttribute('data-id', story.id);
        
        card.innerHTML = `
            <div class="testimonial-header">
                <i class="fas fa-quote-left quote-icon"></i>
                <div class="rating">
                    ${generateStars(story.rating)}
                </div>
            </div>
            <p class="testimonial-text">${escapeHtml(story.message)}</p>
            <div class="testimonial-author">
                <div class="author-avatar">
                    ${story.avatar ? `<img src="${story.avatar}" alt="${story.name}">` : '<i class="fas fa-user-circle"></i>'}
                </div>
                <div class="author-info">
                    <h4>${escapeHtml(story.name)}</h4>
                    <p>${escapeHtml(story.role)}</p>
                    ${story.event ? `<p class="event-attended">Attended: ${escapeHtml(story.event)}</p>` : ''}
                </div>
            </div>
        `;
        
        return card;
    }
    
    // ========== LOAD STORIES FROM LOCALSTORAGE OR DEFAULT ==========
    function loadStories() {
        const savedStories = localStorage.getItem('eventhub_success_stories');
        if (savedStories) {
            allStories = JSON.parse(savedStories);
        } else {
            allStories = [...defaultStories];
            saveStories();
        }
        totalPages = Math.ceil(allStories.length / cardsPerPage);
    }
    
    function saveStories() {
        localStorage.setItem('eventhub_success_stories', JSON.stringify(allStories));
        console.log('Stories saved:', allStories.length);
    }
    
    // ========== RENDER CURRENT PAGE ==========
    function renderStories() {
        if (!testimonialsGrid) return;
        
        testimonialsGrid.innerHTML = '';
        
        const start = (currentPage - 1) * cardsPerPage;
        const end = start + cardsPerPage;
        const storiesToShow = allStories.slice(start, end);
        
        if (storiesToShow.length === 0) {
            testimonialsGrid.innerHTML = '<div class="empty-message">No stories yet. Be the first to share!</div>';
            return;
        }
        
        storiesToShow.forEach(story => {
            const card = createStoryCard(story);
            testimonialsGrid.appendChild(card);
        });
        
        updatePaginationButton();
        
        // Animate cards
        const cards = document.querySelectorAll('.testimonial-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
                card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }
    
    function updatePaginationButton() {
        if (!readMoreBtn) return;
        
        if (currentPage < totalPages) {
            readMoreBtn.innerHTML = `<i class="fas fa-book-open"></i> Page ${currentPage + 1} of ${totalPages}`;
        } else {
            readMoreBtn.innerHTML = `<i class="fas fa-redo-alt"></i> Start Over`;
        }
    }
    
    // ========== PAGINATION ==========
    function nextPage() {
        if (currentPage < totalPages) {
            currentPage++;
            renderStories();
        } else {
            currentPage = 1;
            renderStories();
        }
    }
    
    // ========== ADD NEW STORY ==========
    function addNewStory(storyData) {
        console.log('Adding new story:', storyData);
        
        const newStory = {
            id: Date.now(),
            name: storyData.name,
            role: storyData.role || 'Event Enthusiast',
            rating: storyData.rating,
            message: storyData.message,
            event: storyData.event || '',
            avatar: storyData.avatar || null,
            date: new Date().toISOString()
        };
        
        // Add to beginning of array
        allStories.unshift(newStory);
        
        // Save to localStorage
        saveStories();
        
        // Update total pages
        totalPages = Math.ceil(allStories.length / cardsPerPage);
        
        // Reset to page 1
        currentPage = 1;
        
        // Re-render
        renderStories();
        
        // Scroll to top of grid
        testimonialsGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Show success message
        showToast('Your story has been published successfully!', 'success');
        
        console.log('Story added. Total stories:', allStories.length);
    }
    
    // ========== COUNTER ANIMATION ==========
    const statsBar = document.getElementById('statsBar');
    const counters = document.querySelectorAll('.counter');
    let countersAnimated = false;
    
    function animateCounters() {
        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-target'));
            let current = 0;
            const duration = 2000;
            const stepTime = 20;
            const steps = duration / stepTime;
            const increment = target / steps;
            
            if (counter.interval) clearInterval(counter.interval);
            
            counter.interval = setInterval(() => {
                current += increment;
                if (current >= target) {
                    counter.textContent = target;
                    clearInterval(counter.interval);
                    delete counter.interval;
                } else {
                    counter.textContent = Math.floor(current);
                }
            }, stepTime);
        });
    }
    
    if (statsBar && counters.length) {
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !countersAnimated) {
                    countersAnimated = true;
                    animateCounters();
                }
            });
        }, { threshold: 0.3 });
        counterObserver.observe(statsBar);
    } else {
        animateCounters();
    }
    
    // ========== LOGIN STATE CHECK ==========
    function checkLoginState() {
        const accessToken = localStorage.getItem('attendee_access_token');
        const user = JSON.parse(localStorage.getItem('attendee_user') || '{}');
        const isLoggedIn = accessToken && user && Object.keys(user).length > 0;
        
        if (shareStoryBtn) {
            shareStoryBtn.style.display = isLoggedIn ? 'inline-flex' : 'none';
        }
        return { isLoggedIn, user };
    }
    
    // ========== AUTO-FILL USER DATA ==========
    function autoFillUserData() {
        const { isLoggedIn, user } = checkLoginState();
        const storyName = document.getElementById('storyName');
        const storyEmail = document.getElementById('storyEmail');
        
        if (isLoggedIn) {
            if (storyName && user.first_name) {
                const fullName = user.first_name + (user.last_name ? ' ' + user.last_name : '');
                storyName.value = fullName;
                storyName.readOnly = true;
                storyName.style.backgroundColor = '#f1f5f9';
                storyName.style.cursor = 'not-allowed';
            }
            if (storyEmail && user.email) {
                storyEmail.value = user.email;
                storyEmail.readOnly = true;
                storyEmail.style.backgroundColor = '#f1f5f9';
                storyEmail.style.cursor = 'not-allowed';
            }
        } else {
            if (storyName) {
                storyName.value = '';
                storyName.readOnly = false;
                storyName.style.backgroundColor = '';
                storyName.style.cursor = '';
            }
            if (storyEmail) {
                storyEmail.value = '';
                storyEmail.readOnly = false;
                storyEmail.style.backgroundColor = '';
                storyEmail.style.cursor = '';
            }
        }
    }
    
    // ========== MODAL FUNCTIONS ==========
    function openModal() {
        if (storyModal) {
            storyModal.classList.add('show');
            document.body.style.overflow = 'hidden';
            autoFillUserData();
            resetForm();
        }
    }
    
    function closeModal() {
        if (storyModal) {
            storyModal.classList.remove('show');
            document.body.style.overflow = '';
            resetForm();
        }
    }
    
    function resetForm() {
        if (storyForm) {
            storyForm.reset();
        }
        resetRating();
        autoFillUserData();
    }
    
    // ========== RATING STARS ==========
    const ratingStars = document.querySelectorAll('.rating-input i');
    const ratingInput = document.getElementById('storyRating');
    
    function resetRating() {
        if (ratingStars.length) {
            ratingStars.forEach(star => {
                star.classList.remove('fas');
                star.classList.add('far');
            });
        }
        if (ratingInput) ratingInput.value = '0';
    }
    
    if (ratingStars.length) {
        ratingStars.forEach(star => {
            star.addEventListener('click', function() {
                const rating = parseInt(this.getAttribute('data-rating'));
                if (ratingInput) ratingInput.value = rating;
                
                ratingStars.forEach((s, index) => {
                    if (index < rating) {
                        s.classList.remove('far');
                        s.classList.add('fas');
                    } else {
                        s.classList.remove('fas');
                        s.classList.add('far');
                    }
                });
            });
            
            star.addEventListener('mouseenter', function() {
                const rating = parseInt(this.getAttribute('data-rating'));
                ratingStars.forEach((s, index) => {
                    if (index < rating) {
                        s.classList.remove('far');
                        s.classList.add('fas');
                    } else {
                        s.classList.remove('fas');
                        s.classList.add('far');
                    }
                });
            });
        });
        
        const ratingContainer = document.getElementById('ratingInput');
        if (ratingContainer) {
            ratingContainer.addEventListener('mouseleave', function() {
                const currentRating = parseInt(ratingInput?.value || 0);
                ratingStars.forEach((s, index) => {
                    if (index < currentRating) {
                        s.classList.remove('far');
                        s.classList.add('fas');
                    } else {
                        s.classList.remove('fas');
                        s.classList.add('far');
                    }
                });
            });
        }
    }
    
    // ========== FORM SUBMISSION ==========
    if (storyForm) {
        storyForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const name = document.getElementById('storyName')?.value.trim();
            const email = document.getElementById('storyEmail')?.value.trim();
            const eventName = document.getElementById('storyEvent')?.value.trim();
            const rating = document.getElementById('storyRating')?.value;
            const message = document.getElementById('storyMessage')?.value.trim();
            
            // Validation
            if (!name) {
                showToast('Please enter your name', 'error');
                return;
            }
            if (!email || !isValidEmail(email)) {
                showToast('Please enter a valid email address', 'error');
                return;
            }
            if (!rating || rating === '0') {
                showToast('Please select a rating', 'error');
                return;
            }
            if (!message || message.length < 10) {
                showToast('Please enter your story (minimum 10 characters)', 'error');
                return;
            }
            
            // Disable submit button
            const submitBtn = storyForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
            
            try {
                // Create new story object
                const newStory = {
                    name: name,
                    email: email,
                    event: eventName || '',
                    rating: parseInt(rating),
                    message: message,
                    role: 'Event Enthusiast',
                    avatar: null
                };
                
                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 800));
                
                // Add the new story
                addNewStory(newStory);
                
                // Close modal
                closeModal();
                
            } catch (error) {
                console.error('Submission error:', error);
                showToast(error.message || 'Failed to submit. Please try again.', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }
    
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // ========== TOAST NOTIFICATION ==========
    function showToast(message, type = 'success') {
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) existingToast.remove();
        
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> <span>${escapeHtml(message)}</span>`;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast && toast.parentNode) toast.remove();
        }, 5000);
    }
    
    // ========== EVENT LISTENERS ==========
    if (readMoreBtn) {
        readMoreBtn.addEventListener('click', nextPage);
    }
    
    if (shareStoryBtn) {
        shareStoryBtn.addEventListener('click', openModal);
    }
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }
    
    if (storyModal) {
        storyModal.addEventListener('click', function(e) {
            if (e.target === storyModal) closeModal();
        });
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && storyModal.classList.contains('show')) {
                closeModal();
            }
        });
    }
    
    // Listen for auth state changes
    window.addEventListener('auth-state-changed', function(event) {
        checkLoginState();
    });
    
    // ========== INITIALIZE ==========
    loadStories();
    renderStories();
    checkLoginState();
    
    console.log('Initialized with', allStories.length, 'stories');
});

// Make functions global for debugging
window.closeStoryModal = function() {
    const modal = document.getElementById('storyModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
};