// EVENT DETAIL MODULE - Live Reviews, Organizer Details, Directions
console.log('Event detail loaded');

const urlParams = new URLSearchParams(window.location.search);
const eventId = urlParams.get('id');

function showToast(message, type = 'success') {
    const existing = document.querySelector('.custom-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i><span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function renderStars(rating) {
    if (rating === 0) return '<i class="far fa-star"></i><i class="far fa-star"></i><i class="far fa-star"></i><i class="far fa-star"></i><i class="far fa-star"></i>';
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= fullStars) {
            stars += '<i class="fas fa-star"></i>';
        } else if (i === fullStars + 1 && hasHalf) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    return stars;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function getEventReviews(eventId) {
    if (!window.MOCK_EVENTS_DATA) return [];
    return window.MOCK_EVENTS_DATA.getReviews(eventId);
}

function getAverageRating(eventId) {
    const reviews = getEventReviews(eventId);
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return sum / reviews.length;
}

function renderReviewsList(eventId) {
    const reviews = getEventReviews(eventId);
    if (reviews.length === 0) {
        return '<div class="empty-state">No reviews yet. Be the first to review this event!</div>';
    }
    
    return reviews.map(review => `
        <div class="review-card">
            <div class="review-header">
                <div class="reviewer-info">
                    <div class="reviewer-avatar">${review.userName.charAt(0)}</div>
                    <div>
                        <div class="reviewer-name">${review.userName}</div>
                        <div class="review-date">${new Date(review.created_at).toLocaleDateString()}</div>
                    </div>
                </div>
                <div class="review-rating">${renderStars(review.rating)}</div>
            </div>
            <div class="review-title">${review.title}</div>
            <div class="review-content">${review.content}</div>
        </div>
    `).join('');
}

function updateReviewsUI(eventId) {
    const avgRating = getAverageRating(eventId);
    const reviewsCount = getEventReviews(eventId).length;
    const ratingNumber = document.querySelector('.rating-number');
    const starsLarge = document.querySelector('.stars-large');
    const reviewCount = document.querySelector('.review-count');
    const reviewsList = document.getElementById('reviewsList');
    
    if (ratingNumber) ratingNumber.textContent = avgRating.toFixed(1);
    if (starsLarge) starsLarge.innerHTML = renderStars(avgRating);
    if (reviewCount) reviewCount.textContent = `Based on ${reviewsCount} review${reviewsCount !== 1 ? 's' : ''}`;
    if (reviewsList) reviewsList.innerHTML = renderReviewsList(eventId);
}

function setupReviewModal(eventId) {
    const modal = document.getElementById('reviewModal');
    const writeBtn = document.getElementById('writeReviewBtn');
    const closeBtn = document.querySelector('.modal-close');
    
    if (!writeBtn) return;
    
    writeBtn.onclick = () => {
        const token = localStorage.getItem('attendee_access_token');
        if (!token) {
            showToast('Please login to write a review', 'info');
            setTimeout(() => window.location.href = '/login/', 1500);
            return;
        }
        if (modal) modal.style.display = 'flex';
        resetRatingStars();
    };
    
    if (closeBtn) {
        closeBtn.onclick = () => {
            if (modal) modal.style.display = 'none';
            resetReviewForm();
        };
    }
    
    if (modal) {
        window.onclick = (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                resetReviewForm();
            }
        };
    }
    
    setupRatingStars();
    
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.onsubmit = (e) => {
            e.preventDefault();
            submitReview(eventId);
        };
    }
}

function setupRatingStars() {
    const stars = document.querySelectorAll('.rating-select i');
    const ratingInput = document.getElementById('reviewRating');
    if (!stars.length) return;
    
    stars.forEach(star => {
        star.onclick = function() {
            const rating = parseInt(this.dataset.rating);
            if (ratingInput) ratingInput.value = rating;
            stars.forEach((s, i) => {
                if (i < rating) {
                    s.classList.remove('far');
                    s.classList.add('fas');
                } else {
                    s.classList.remove('fas');
                    s.classList.add('far');
                }
            });
        };
        
        star.onmouseenter = function() {
            const rating = parseInt(this.dataset.rating);
            stars.forEach((s, i) => {
                if (i < rating) {
                    s.classList.remove('far');
                    s.classList.add('fas');
                } else {
                    s.classList.remove('fas');
                    s.classList.add('far');
                }
            });
        };
        
        star.onmouseleave = function() {
            const currentRating = parseInt(ratingInput?.value || 5);
            stars.forEach((s, i) => {
                if (i < currentRating) {
                    s.classList.remove('far');
                    s.classList.add('fas');
                } else {
                    s.classList.remove('fas');
                    s.classList.add('far');
                }
            });
        };
    });
}

function resetRatingStars() {
    const stars = document.querySelectorAll('.rating-select i');
    const ratingInput = document.getElementById('reviewRating');
    if (ratingInput) ratingInput.value = 5;
    stars.forEach((s, i) => {
        if (i < 5) {
            s.classList.remove('far');
            s.classList.add('fas');
        } else {
            s.classList.remove('fas');
            s.classList.add('far');
        }
    });
}

function resetReviewForm() {
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) reviewForm.reset();
    resetRatingStars();
}

function submitReview(eventId) {
    const rating = parseInt(document.getElementById('reviewRating')?.value || 0);
    const title = document.getElementById('reviewTitle')?.value.trim();
    const content = document.getElementById('reviewText')?.value.trim();
    
    if (!title) {
        showToast('Please enter a review title', 'error');
        return;
    }
    if (!content) {
        showToast('Please enter your review', 'error');
        return;
    }
    if (rating === 0) {
        showToast('Please select a rating', 'error');
        return;
    }
    
    const user = JSON.parse(localStorage.getItem('attendee_user') || '{}');
    const userName = user.name || 'Guest User';
    const userInitial = userName.charAt(0).toUpperCase();
    
    const newReview = {
        id: Date.now(),
        userName: userName,
        userInitial: userInitial,
        rating: rating,
        title: title,
        content: content,
        created_at: new Date().toISOString()
    };
    
    if (window.MOCK_EVENTS_DATA) {
        window.MOCK_EVENTS_DATA.addReview(parseInt(eventId), newReview);
    }
    
    updateReviewsUI(eventId);
    
    const modal = document.getElementById('reviewModal');
    if (modal) modal.style.display = 'none';
    resetReviewForm();
    showToast('Thank you for your review!', 'success');
}

function renderEventDetails(event) {
    const container = document.getElementById('eventDetailContainer');
    if (!container) return;
    
    const avgRating = getAverageRating(event.id);
    const reviewsCount = getEventReviews(event.id).length;
    const wishlist = JSON.parse(localStorage.getItem('event_wishlist') || '[]');
    const isInWishlist = wishlist.includes(event.id);
    
    container.innerHTML = `
        <div class="event-content-wrapper">
            <div class="event-main">
                <div class="event-breadcrumb">
                    <a href="/">Home</a> / 
                    <a href="/events/">Events</a> / 
                    <span>${event.title}</span>
                </div>
                
                <div class="event-image-container">
                    <img src="${event.image}" alt="${event.title}" class="event-main-image">
                    ${event.is_featured ? '<div class="event-featured-badge">Featured</div>' : ''}
                </div>
                
                <div class="event-title-section">
                    <h1>${event.title}</h1>
                    <div class="event-rating">
                        <div class="stars">${renderStars(avgRating)}</div>
                        <span class="rating-count">(${reviewsCount} reviews)</span>
                    </div>
                </div>
                
                <div class="event-meta">
                    <span><i class="fas fa-calendar"></i> ${formatDate(event.date)} at ${event.time || 'TBA'}</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${event.location}</span>
                    <span><i class="fas fa-ticket-alt"></i> ${event.available_tickets} tickets left</span>
                </div>
                
                <a href="https://maps.google.com/?q=${encodeURIComponent(event.location)}" target="_blank" class="directions-btn">
                    <i class="fas fa-directions"></i> Get Directions
                </a>
                
                <div class="event-tabs">
                    <button class="tab-btn active" data-tab="details">Details</button>
                    <button class="tab-btn" data-tab="organizer">Organizer</button>
                    <button class="tab-btn" data-tab="reviews">Reviews</button>
                </div>
                
                <div id="detailsTab" class="tab-content active">
                    <div class="event-description">
                        <h3><i class="fas fa-info-circle"></i> About This Event</h3>
                        <p>${event.description}</p>
                    </div>
                    
                    <div class="event-features">
                        <h3><i class="fas fa-star"></i> Event Features</h3>
                        <ul>
                            ${event.features.map(f => `<li><i class="fas fa-check-circle"></i> ${f}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div class="event-venue">
                        <h3><i class="fas fa-map-marker-alt"></i> Venue Information</h3>
                        <p><strong>Venue:</strong> ${event.venue || event.location}</p>
                        <p><strong>Address:</strong> ${event.location}</p>
                        ${event.parking_available ? '<p><i class="fas fa-parking"></i> Free parking available</p>' : '<p><i class="fas fa-parking"></i> Limited street parking</p>'}
                        ${event.wheelchair_accessible ? '<p><i class="fas fa-wheelchair"></i> Wheelchair accessible</p>' : ''}
                        <a href="https://maps.google.com/?q=${encodeURIComponent(event.location)}" target="_blank" class="map-link">
                            <i class="fas fa-external-link-alt"></i> View on Google Maps
                        </a>
                    </div>
                    
                    ${event.is_virtual ? `
                    <div class="virtual-event">
                        <i class="fas fa-video"></i>
                        <strong>Virtual Event:</strong> 
                        <a href="${event.virtual_link}" target="_blank">Join Online</a>
                    </div>
                    ` : ''}
                </div>
                
                <div id="organizerTab" class="tab-content">
                    <div class="organizer-info">
                        <h3><i class="fas fa-building"></i> About the Organizer</h3>
                        <p><strong>${event.organizer}</strong></p>
                        ${event.organizer_email ? `<p><i class="fas fa-envelope"></i> <a href="mailto:${event.organizer_email}">${event.organizer_email}</a></p>` : ''}
                        ${event.organizer_phone ? `<p><i class="fas fa-phone"></i> <a href="tel:${event.organizer_phone}">${event.organizer_phone}</a></p>` : ''}
                        <div class="refund-policy">
                            <i class="fas fa-ticket-alt"></i>
                            <strong>Refund Policy:</strong> ${event.refund_policy}
                        </div>
                    </div>
                </div>
                
                <div id="reviewsTab" class="tab-content">
                    <div class="reviews-summary">
                        <div class="average-rating">
                            <div class="rating-number">${avgRating.toFixed(1)}</div>
                            <div class="stars-large">${renderStars(avgRating)}</div>
                            <div class="review-count">Based on ${reviewsCount} reviews</div>
                        </div>
                        <button id="writeReviewBtn" class="write-review-btn">Write a Review</button>
                    </div>
                    <div id="reviewsList" class="reviews-list">
                        ${renderReviewsList(event.id)}
                    </div>
                </div>
            </div>
            
            <div class="event-sidebar">
                <div class="ticket-card">
                    <h3>Get Your Tickets</h3>
                    <div class="ticket-price-info">
                        <span class="current-price">KES ${event.price.toLocaleString()}</span>
                        ${event.original_price ? `<span class="original-price">KES ${event.original_price.toLocaleString()}</span>` : ''}
                    </div>
                    <div class="ticket-availability">
                        <i class="fas fa-check-circle"></i> ${event.available_tickets} tickets available
                    </div>
                    
                    <div class="ticket-quantity">
                        <label>Quantity</label>
                        <div class="quantity-selector">
                            <button class="qty-btn" id="decreaseQty">-</button>
                            <input type="number" id="ticketQuantity" value="1" min="1" max="${event.available_tickets}">
                            <button class="qty-btn" id="increaseQty">+</button>
                        </div>
                    </div>
                    
                    <div class="ticket-total">
                        <span>Total:</span>
                        <span class="total-amount" id="totalAmount">KES ${event.price.toLocaleString()}</span>
                    </div>
                    
                    <button id="bookNowBtn" class="book-now-btn">
                        <i class="fas fa-ticket-alt"></i> Book Ticket
                    </button>
                    
                    <button id="wishlistBtn" class="wishlist-sidebar-btn ${isInWishlist ? 'active' : ''}">
                        <i class="fas fa-heart"></i> ${isInWishlist ? 'Saved to Wishlist' : 'Save to Wishlist'}
                    </button>
                    
                    <div class="ticket-info">
                        <p><i class="fas fa-shield-alt"></i> Secure booking</p>
                        <p><i class="fas fa-envelope"></i> E-tickets sent instantly</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Setup tabs
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.tab;
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`${tabId}Tab`).classList.add('active');
        });
    });
    
    // Setup quantity selector
    let quantity = 1;
    const qtyInput = document.getElementById('ticketQuantity');
    const totalSpan = document.getElementById('totalAmount');
    const decreaseBtn = document.getElementById('decreaseQty');
    const increaseBtn = document.getElementById('increaseQty');
    const bookBtn = document.getElementById('bookNowBtn');
    const wishlistBtn = document.getElementById('wishlistBtn');
    
    function updateTotal() {
        const total = quantity * event.price;
        totalSpan.textContent = `KES ${total.toLocaleString()}`;
    }
    
    if (decreaseBtn) {
        decreaseBtn.onclick = () => {
            if (quantity > 1) {
                quantity--;
                qtyInput.value = quantity;
                updateTotal();
            }
        };
    }
    
    if (increaseBtn) {
        increaseBtn.onclick = () => {
            if (quantity < event.available_tickets) {
                quantity++;
                qtyInput.value = quantity;
                updateTotal();
            }
        };
    }
    
    if (qtyInput) {
        qtyInput.onchange = () => {
            quantity = parseInt(qtyInput.value) || 1;
            if (quantity < 1) quantity = 1;
            if (quantity > event.available_tickets) quantity = event.available_tickets;
            qtyInput.value = quantity;
            updateTotal();
        };
    }
    
    // Book button
    if (bookBtn) {
        bookBtn.onclick = () => {
            const token = localStorage.getItem('attendee_access_token');
            if (!token) {
                showToast('Please login to book tickets', 'info');
                setTimeout(() => window.location.href = '/login/', 1500);
                return;
            }
            
            if (event.available_tickets <= 0) {
                showToast('Sorry, this event is sold out!', 'error');
                return;
            }
            
            let cart = JSON.parse(localStorage.getItem('eventhub_booking_cart') || '{"items":[],"total":0}');
            
            const existing = cart.items.find(i => i.id === event.id);
            if (existing) {
                showToast(`${event.title} is already in your booking cart!`, 'info');
                return;
            }
            
            cart.items.push({ 
                id: event.id, 
                title: event.title, 
                price: event.price, 
                quantity: quantity, 
                image: event.image,
                date: event.date,
                location: event.location,
                category: event.category_name
            });
            
            cart.total = cart.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
            localStorage.setItem('eventhub_booking_cart', JSON.stringify(cart));
            showToast(`${quantity} ticket(s) for ${event.title} added to booking cart!`, 'success');
            window.dispatchEvent(new Event('cart-updated'));
        };
    }
    
    // Wishlist button
    if (wishlistBtn) {
        wishlistBtn.onclick = () => {
            const token = localStorage.getItem('attendee_access_token');
            if (!token) {
                showToast('Please login to save to wishlist', 'info');
                setTimeout(() => window.location.href = '/login/', 1500);
                return;
            }
            
            let updatedWishlist = JSON.parse(localStorage.getItem('event_wishlist') || '[]');
            const idx = updatedWishlist.indexOf(event.id);
            
            if (idx === -1) {
                updatedWishlist.push(event.id);
                wishlistBtn.classList.add('active');
                wishlistBtn.innerHTML = '<i class="fas fa-heart"></i> Saved to Wishlist';
                showToast('Event saved to wishlist!', 'success');
            } else {
                updatedWishlist.splice(idx, 1);
                wishlistBtn.classList.remove('active');
                wishlistBtn.innerHTML = '<i class="fas fa-heart"></i> Save to Wishlist';
                showToast('Event removed from wishlist', 'info');
            }
            
            localStorage.setItem('event_wishlist', JSON.stringify(updatedWishlist));
            window.dispatchEvent(new Event('wishlist-updated'));
        };
    }
    
    setupReviewModal(event.id);
}

function loadEventDetails() {
    const container = document.getElementById('eventDetailContainer');
    if (!container) return;
    
    if (!eventId) {
        container.innerHTML = '<div class="error-state">Event not found</div>';
        return;
    }
    
    if (!window.MOCK_EVENTS_DATA) {
        container.innerHTML = '<div class="error-state">Data not loaded</div>';
        return;
    }
    
    const event = window.MOCK_EVENTS_DATA.getEventById(eventId);
    
    if (!event) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <h2>Event Not Found</h2>
                <p>The event you're looking for doesn't exist or has been removed.</p>
                <a href="/events/" class="btn-primary">Browse Events</a>
            </div>
        `;
        return;
    }
    
    renderEventDetails(event);
}

document.addEventListener('DOMContentLoaded', loadEventDetails);
