// ============================================
// SUCCESS STORIES PAGE - WORKING VERSION
// ============================================

(function() {
    'use strict';
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
    function initialize() {
        console.log('Success Stories initializing...');
        
        // Default stories data
        const DEFAULT_STORIES = [
            {
                id: 1,
                name: 'Yvonne Eshitemi',
                email: 'yvonne@example.com',
                role: 'Event Enthusiast',
                rating: 5,
                message: 'EventHub made it so easy to discover and book tickets for amazing events in Nairobi. The QR code check-in was seamless!',
                event: 'Music Festival 2024',
                avatar: 'https://randomuser.me/api/portraits/women/16.jpg',
                isDefault: true
            },
            {
                id: 2,
                name: 'Wilson Thoma',
                email: 'wilson@example.com',
                role: 'Regular Attendee',
                rating: 5,
                message: 'I\'ve attended over 20 events through EventHub. The platform is reliable, and customer support is exceptional!',
                event: '20+ Events',
                avatar: 'https://randomuser.me/api/portraits/men/80.jpg',
                isDefault: true
            },
            {
                id: 3,
                name: 'Scholasticah Mutuku',
                email: 'scholasticah@example.com',
                role: 'Adventure Seeker',
                rating: 5,
                message: 'Best event discovery platform in Kenya! The variety of events and ease of booking is unmatched.',
                event: 'Cultural Fest 2024',
                avatar: 'https://randomuser.me/api/portraits/women/89.jpg',
                isDefault: true
            },
            {
                id: 4,
                name: 'Brad Omwamba',
                email: 'brad@example.com',
                role: 'Event Organizer',
                rating: 5,
                message: 'As an event organizer, EventHub helped us sell out our event in record time. The support team is amazing!',
                event: 'Tech Summit 2024',
                avatar: 'https://randomuser.me/api/portraits/men/70.jpg',
                isDefault: true
            },
            {
                id: 5,
                name: 'Bullim Njeri',
                email: 'bullim@example.com',
                role: 'Mobile User',
                rating: 5,
                message: 'The mobile app is fantastic! I can browse, book, and check-in using my phone. No more paper tickets!',
                event: 'Food Festival 2024',
                avatar: 'https://randomuser.me/api/portraits/women/90.jpg',
                isDefault: true
            },
            {
                id: 6,
                name: 'Toji Mraster',
                email: 'toji@example.com',
                role: 'First-time User',
                rating: 5,
                message: 'The customer service team went above and beyond to help me with a booking issue. Exceptional service!',
                event: 'Business Forum',
                avatar: 'https://randomuser.me/api/portraits/men/55.jpg',
                isDefault: true
            }
        ];
        
        // Application state
        let allStories = [];
        let currentPage = 1;
        const STORIES_PER_PAGE = 3;
        let submittedEmails = new Set();
        
        // DOM elements
        const storiesGrid = document.getElementById('testimonialsGrid');
        const loadMoreBtn = document.getElementById('readMoreBtn');
        const shareBtn = document.getElementById('shareStoryBtn');
        const modal = document.getElementById('storyModal');
        const closeModalBtn = document.getElementById('closeModalBtn');
        const storyForm = document.getElementById('storyForm');
        
        // Helper functions
        function escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        function generateStars() {
            return '<i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>';
        }
        
        function getCurrentUserEmail() {
            try {
                const user = JSON.parse(localStorage.getItem('attendee_user') || '{}');
                if (user && user.email) {
                    return user.email.toLowerCase().trim();
                }
            } catch(e) {
                console.error('Error getting user:', e);
            }
            return null;
        }
        
        // Load and save data
        function loadData() {
            const saved = localStorage.getItem('eventhub_stories');
            if (saved) {
                allStories = JSON.parse(saved);
                console.log('Loaded stories from storage:', allStories.length);
            } else {
                allStories = [...DEFAULT_STORIES];
                saveData();
                console.log('Loaded default stories:', allStories.length);
            }
            
            const savedEmails = localStorage.getItem('eventhub_submitted_emails');
            if (savedEmails) {
                submittedEmails = new Set(JSON.parse(savedEmails));
            }
            
            // Add default story emails to submitted set
            DEFAULT_STORIES.forEach(story => {
                if (story.email) {
                    submittedEmails.add(story.email.toLowerCase());
                }
            });
            saveEmails();
        }
        
        function saveData() {
            localStorage.setItem('eventhub_stories', JSON.stringify(allStories));
        }
        
        function saveEmails() {
            localStorage.setItem('eventhub_submitted_emails', JSON.stringify([...submittedEmails]));
        }
        
        // Create story card
        function createStoryCard(story) {
            const card = document.createElement('div');
            card.className = 'testimonial-card';
            card.setAttribute('data-id', story.id);
            
            const currentUserEmail = getCurrentUserEmail();
            const isOwnStory = currentUserEmail && story.email && 
                              story.email.toLowerCase() === currentUserEmail && 
                              !story.isDefault;
            
            const badge = story.isDefault ? 
                '<span class="default-badge"><i class="fas fa-star-of-life"></i> Featured Story</span>' : 
                '<span class="user-badge"><i class="fas fa-user-plus"></i> Your Story</span>';
            
            const deleteButton = isOwnStory ? 
                `<button class="delete-story-btn" data-id="${story.id}" data-email="${escapeHtml(story.email)}">
                    <i class="fas fa-trash-alt"></i> Delete
                </button>` : '';
            
            card.innerHTML = `
                <div class="testimonial-header">
                    <i class="fas fa-quote-left quote-icon"></i>
                    <div class="rating">${generateStars()}</div>
                </div>
                <p class="testimonial-text">${escapeHtml(story.message)}</p>
                <div class="testimonial-author">
                    <div class="author-avatar">
                        ${story.avatar ? `<img src="${story.avatar}" alt="${story.name}">` : '<i class="fas fa-user-circle"></i>'}
                    </div>
                    <div class="author-info">
                        <h4>${escapeHtml(story.name)}</h4>
                        <p>${escapeHtml(story.role)}</p>
                        ${story.event ? `<p class="event-attended">📌 ${escapeHtml(story.event)}</p>` : ''}
                    </div>
                </div>
                <div class="story-footer">
                    <div class="story-badge-container">${badge}</div>
                    ${deleteButton}
                </div>
            `;
            
            // Add delete event listener
            if (isOwnStory) {
                const deleteBtn = card.querySelector('.delete-story-btn');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        deleteStory(story.id, story.email);
                    });
                }
            }
            
            return card;
        }
        
        function deleteStory(storyId, storyEmail) {
            const currentUserEmail = getCurrentUserEmail();
            
            if (!currentUserEmail) {
                showToast('Please login to delete your story', 'error');
                return;
            }
            
            if (storyEmail.toLowerCase() !== currentUserEmail) {
                showToast('You can only delete your own stories!', 'error');
                return;
            }
            
            const storyToDelete = allStories.find(s => s.id === storyId);
            if (storyToDelete && storyToDelete.isDefault) {
                showToast('Default stories cannot be deleted!', 'error');
                return;
            }
            
            // Remove story
            allStories = allStories.filter(s => s.id !== storyId);
            submittedEmails.delete(storyEmail.toLowerCase());
            
            saveData();
            saveEmails();
            
            // Update pagination
            const totalPages = Math.ceil(allStories.length / STORIES_PER_PAGE);
            if (currentPage > totalPages && totalPages > 0) {
                currentPage = totalPages;
            }
            if (currentPage < 1) currentPage = 1;
            
            renderStories();
            updateShareButtonState();
            showToast('Your story has been deleted!', 'success');
        }
        
        // Render stories
        function renderStories() {
            if (!storiesGrid) return;
            
            storiesGrid.innerHTML = '';
            
            const start = (currentPage - 1) * STORIES_PER_PAGE;
            const end = start + STORIES_PER_PAGE;
            const pageStories = allStories.slice(start, end);
            
            if (pageStories.length === 0) {
                storiesGrid.innerHTML = '<div class="empty-message"><i class="fas fa-comment-dots"></i> No stories yet. Be the first to share!</div>';
                updatePaginationButton();
                return;
            }
            
            pageStories.forEach(story => {
                storiesGrid.appendChild(createStoryCard(story));
            });
            
            updatePaginationButton();
            updatePaginationInfo(start, end);
        }
        
        function updatePaginationButton() {
            if (!loadMoreBtn) return;
            
            const totalPages = Math.ceil(allStories.length / STORIES_PER_PAGE);
            if (currentPage < totalPages) {
                loadMoreBtn.innerHTML = `<i class="fas fa-book-open"></i> Load More (${currentPage + 1}/${totalPages})`;
            } else {
                loadMoreBtn.innerHTML = `<i class="fas fa-redo-alt"></i> Start Over`;
            }
        }
        
        function updatePaginationInfo(start, end) {
            let info = document.querySelector('.pagination-info');
            if (!info) {
                info = document.createElement('div');
                info.className = 'pagination-info';
                storiesGrid.parentNode.insertBefore(info, storiesGrid.nextSibling);
            }
            info.innerHTML = `Showing ${start + 1}-${Math.min(end, allStories.length)} of ${allStories.length} stories`;
        }
        
        function nextPage() {
            const totalPages = Math.ceil(allStories.length / STORIES_PER_PAGE);
            if (currentPage < totalPages) {
                currentPage++;
                renderStories();
                storiesGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                currentPage = 1;
                renderStories();
                storiesGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
        
        // Add new story
        function addNewStory(storyData) {
            const email = storyData.email.toLowerCase().trim();
            
            if (submittedEmails.has(email)) {
                showToast('You have already shared a story! One story per user is allowed.', 'error');
                return false;
            }
            
            const newStory = {
                id: Date.now(),
                name: storyData.name,
                email: email,
                role: 'Event Enthusiast',
                rating: storyData.rating,
                message: storyData.message,
                event: storyData.event || '',
                avatar: null,
                date: new Date().toISOString(),
                isDefault: false
            };
            
            allStories.unshift(newStory);
            submittedEmails.add(email);
            
            saveData();
            saveEmails();
            
            currentPage = 1;
            renderStories();
            
            // Scroll to the new story
            setTimeout(() => {
                storiesGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
                const firstCard = document.querySelector('.testimonial-card');
                if (firstCard) {
                    firstCard.style.transition = 'all 0.3s ease';
                    firstCard.style.boxShadow = '0 0 0 3px #f59e0b';
                    setTimeout(() => {
                        if (firstCard) firstCard.style.boxShadow = '';
                    }, 2000);
                }
            }, 100);
            
            showToast('Your story has been published successfully!', 'success');
            return true;
        }
        
        // Update share button state
        function updateShareButtonState() {
            if (!shareBtn) return;
            
            const currentUserEmail = getCurrentUserEmail();
            
            if (!currentUserEmail) {
                shareBtn.style.display = 'none';
                return;
            }
            
            shareBtn.style.display = 'inline-flex';
            
            if (submittedEmails.has(currentUserEmail)) {
                shareBtn.disabled = true;
                shareBtn.style.opacity = '0.5';
                shareBtn.style.cursor = 'not-allowed';
            } else {
                shareBtn.disabled = false;
                shareBtn.style.opacity = '1';
                shareBtn.style.cursor = 'pointer';
            }
        }
        
        // Modal functions
        function openModal() {
            const currentUserEmail = getCurrentUserEmail();
            
            if (!currentUserEmail) {
                showToast('Please login to share your story', 'error');
                return;
            }
            
            if (submittedEmails.has(currentUserEmail)) {
                showToast('You have already shared a story!', 'error');
                return;
            }
            
            if (modal) {
                modal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
                
                // Auto-fill form
                const emailInput = document.getElementById('storyEmail');
                if (emailInput) {
                    emailInput.value = currentUserEmail;
                    emailInput.readOnly = true;
                }
                
                // Try to auto-fill name
                try {
                    const user = JSON.parse(localStorage.getItem('attendee_user') || '{}');
                    if (user.first_name) {
                        const nameInput = document.getElementById('storyName');
                        if (nameInput) {
                            const fullName = user.first_name + (user.last_name ? ' ' + user.last_name : '');
                            nameInput.value = fullName;
                        }
                    }
                } catch(e) {}
            }
        }
        
        function closeModal() {
            if (modal) {
                modal.style.display = 'none';
                document.body.style.overflow = '';
                if (storyForm) storyForm.reset();
                
                const ratingInput = document.getElementById('storyRating');
                if (ratingInput) ratingInput.value = '0';
                
                const stars = document.querySelectorAll('.rating-input i');
                stars.forEach(star => {
                    star.classList.remove('fas');
                    star.classList.add('far');
                });
            }
        }
        
        // Toast notification
        function showToast(message, type = 'success') {
            const existingToast = document.querySelector('.toast-notification');
            if (existingToast) existingToast.remove();
            
            const toast = document.createElement('div');
            toast.className = `toast-notification ${type}`;
            const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
            toast.innerHTML = `<i class="fas ${icon}"></i> <span>${escapeHtml(message)}</span>`;
            document.body.appendChild(toast);
            
            setTimeout(() => {
                if (toast.parentNode) toast.remove();
            }, 3000);
        }
        
        // Rating stars setup
        function setupRatingStars() {
            const stars = document.querySelectorAll('.rating-input i');
            const ratingInput = document.getElementById('storyRating');
            
            stars.forEach(star => {
                star.addEventListener('click', function() {
                    const rating = parseInt(this.dataset.rating);
                    if (ratingInput) ratingInput.value = rating;
                    
                    stars.forEach((s, index) => {
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
        }
        
        // Counter animation
        function animateCounters() {
            const counters = document.querySelectorAll('.counter');
            counters.forEach(counter => {
                const target = parseInt(counter.dataset.target);
                let current = 0;
                const interval = setInterval(() => {
                    current += Math.ceil(target / 50);
                    if (current >= target) {
                        counter.textContent = target;
                        clearInterval(interval);
                    } else {
                        counter.textContent = current;
                    }
                }, 40);
            });
        }
        
        // Form submission
        if (storyForm) {
            storyForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const name = document.getElementById('storyName')?.value.trim();
                const email = document.getElementById('storyEmail')?.value.trim();
                const eventName = document.getElementById('storyEvent')?.value.trim();
                const rating = document.getElementById('storyRating')?.value;
                const message = document.getElementById('storyMessage')?.value.trim();
                
                if (!name) {
                    showToast('Please enter your name', 'error');
                    return;
                }
                if (!email) {
                    showToast('Please enter your email', 'error');
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
                
                const success = addNewStory({
                    name: name,
                    email: email,
                    event: eventName,
                    rating: parseInt(rating),
                    message: message
                });
                
                if (success) {
                    closeModal();
                    updateShareButtonState();
                }
            });
        }
        
        // Event listeners
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', nextPage);
        }
        
        if (shareBtn) {
            shareBtn.addEventListener('click', openModal);
        }
        
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', closeModal);
        }
        
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === modal) closeModal();
            });
        }
        
        // Listen for auth changes
        window.addEventListener('auth-state-changed', function() {
            updateShareButtonState();
            renderStories();
        });
        
        // Initialize
        loadData();
        renderStories();
        updateShareButtonState();
        setupRatingStars();
        animateCounters();
        
        console.log('Success Stories initialized with', allStories.length, 'stories');
    }
})();