// EVENT DETAIL MODULE - Live API Integration
console.log('Event detail loaded');

const urlParams = new URLSearchParams(window.location.search);
const eventId = urlParams.get('id');
let eventData = null;

// API endpoints
const API = {
    event: '/api/attendee/events/',
    cart: '/api/attendee/cart/',
    wishlist: '/api/attendee/wishlist/',
    reviews: '/api/attendee/reviews/'
};

function showToast(message, type = 'success') {
    const existing = document.querySelector('.custom-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 10000;
        padding: 12px 20px;
        border-radius: 12px;
        color: white;
        font-size: 14px;
        font-weight: 500;
        background: ${type === 'success' ? '#10b981' : '#3b82f6'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideInRight 0.3s ease;
    `;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i><span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function renderStars(rating) {
    if (!rating || rating === 0) return '<i class="far fa-star"></i><i class="far fa-star"></i><i class="far fa-star"></i><i class="far fa-star"></i><i class="far fa-star"></i>';
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
    if (!dateString) return 'TBA';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

async function loadEventDetails() {
    const container = document.getElementById('eventDetailContainer');
    if (!container) return;
    
    if (!eventId) {
        container.innerHTML = '<div class="error-state">Event not found</div>';
        return;
    }
    
    try {
        const response = await fetch(`${API.event}${eventId}/`);
        const data = await response.json();
        
        if (data.success && data.event) {
            eventData = data.event;
            renderEventDetails(eventData);
            await loadReviews();
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <h2>Event Not Found</h2>
                    <p>The event you're looking for doesn't exist or has been removed.</p>
                    <a href="/events/" class="btn-primary">Browse Events</a>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading event:', error);
        container.innerHTML = '<div class="error-state">Failed to load event details</div>';
    }
}

async function loadReviews() {
    try {
        const response = await fetch(`${API.reviews}?event_id=${eventId}`);
        const data = await response.json();
        
        const reviewsList = document.getElementById('reviewsList');
        if (reviewsList) {
            if (data.reviews && data.reviews.length > 0) {
                reviewsList.innerHTML = renderReviewsList(data.reviews);
            } else {
                reviewsList.innerHTML = '<div class="empty-state">No reviews yet. Be the first to review this event!</div>';
            }
        }
        
        // Update rating display
        if (data.avg_rating) {
            const ratingNumber = document.querySelector('.rating-number');
            const starsLarge = document.querySelector('.stars-large');
            const reviewCount = document.querySelector('.review-count');
            
            if (ratingNumber) ratingNumber.textContent = data.avg_rating.toFixed(1);
            if (starsLarge) starsLarge.innerHTML = renderStars(data.avg_rating);
            if (reviewCount) reviewCount.textContent = `Based on ${data.total_reviews || 0} reviews`;
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
    }
}

function renderReviewsList(reviews) {
    return reviews.map(review => `
        <div class="review-card">
            <div class="review-header">
                <div class="reviewer-info">
                    <div class="reviewer-avatar">${(review.user_name || 'U').charAt(0)}</div>
                    <div>
                        <div class="reviewer-name">${escapeHtml(review.user_name || 'Anonymous')}</div>
                        <div class="review-date">${formatDate(review.created_at)}</div>
                    </div>
                </div>
                <div class="review-rating">${renderStars(review.rating)}</div>
            </div>
            <div class="review-title">${escapeHtml(review.title)}</div>
            <div class="review-content">${escapeHtml(review.content)}</div>
        </div>
    `).join('');
}

function renderEventDetails(event) {
    const container = document.getElementById('eventDetailContainer');
    if (!container) return;
    
    const wishlist = JSON.parse(localStorage.getItem('event_wishlist') || '[]');
    const isInWishlist = wishlist.some(item => item.id == event.id);
    
    container.innerHTML = `
        <div class="event-content-wrapper">
            <div class="event-main">
                <div class="event-breadcrumb">
                    <a href="/">Home</a> / 
                    <a href="/events/">Events</a> / 
                    <span>${escapeHtml(event.title)}</span>
                </div>
                
                <div class="event-image-container">
                    <img src="${event.image || '/static/images/placeholder.jpg'}" alt="${event.title}" class="event-main-image" onerror="this.src='/static/images/placeholder.jpg'">
                    ${event.is_featured ? '<div class="event-featured-badge">Featured</div>' : ''}
                </div>
                
                <div class="event-title-section">
                    <h1>${escapeHtml(event.title)}</h1>
                    <div class="event-rating">
                        <div class="stars">${renderStars(event.avg_rating || 0)}</div>
                        <span class="rating-count">(${event.review_count || 0} reviews)</span>
                    </div>
                </div>
                
                <div class="event-meta">
                    <span><i class="fas fa-calendar"></i> ${formatDate(event.date)} at ${event.time || 'TBA'}</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(event.location)}</span>
                    <span><i class="fas fa-ticket-alt"></i> ${event.available_tickets || 0} tickets left</span>
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
                        <p>${escapeHtml(event.description || 'No description available.')}</p>
                    </div>
                    
                    <div class="event-venue">
                        <h3><i class="fas fa-map-marker-alt"></i> Venue Information</h3>
                        <p><strong>Venue:</strong> ${escapeHtml(event.venue || event.location)}</p>
                        <p><strong>Address:</strong> ${escapeHtml(event.location)}</p>
                        ${event.parking_available ? '<p><i class="fas fa-parking"></i> Free parking available</p>' : '<p><i class="fas fa-parking"></i> Limited street parking</p>'}
                        ${event.wheelchair_accessible ? '<p><i class="fas fa-wheelchair"></i> Wheelchair accessible</p>' : ''}
                    </div>
                </div>
                
                <div id="organizerTab" class="tab-content">
                    <div class="organizer-info">
                        <h3><i class="fas fa-building"></i> About the Organizer</h3>
                        <p><strong>${escapeHtml(event.organizer || 'EventHub')}</strong></p>
                        ${event.organizer_email ? `<p><i class="fas fa-envelope"></i> <a href="mailto:${event.organizer_email}">${event.organizer_email}</a></p>` : ''}
                        ${event.organizer_phone ? `<p><i class="fas fa-phone"></i> <a href="tel:${event.organizer_phone}">${event.organizer_phone}</a></p>` : ''}
                        <div class="refund-policy">
                            <i class="fas fa-ticket-alt"></i>
                            <strong>Refund Policy:</strong> ${event.refund_policy || 'Standard refund policy applies'}
                        </div>
                    </div>
                </div>
                
                <div id="reviewsTab" class="tab-content">
                    <div class="reviews-summary">
                        <div class="average-rating">
                            <div class="rating-number">${(event.avg_rating || 0).toFixed(1)}</div>
                            <div class="stars-large">${renderStars(event.avg_rating || 0)}</div>
                            <div class="review-count">Based on ${event.review_count || 0} reviews</div>
                        </div>
                        <button id="writeReviewBtn" class="write-review-btn">Write a Review</button>
                    </div>
                    <div id="reviewsList" class="reviews-list">
                        <div class="loading-state">Loading reviews...</div>
                    </div>
                </div>
            </div>
            
            <div class="event-sidebar">
                <div class="ticket-card">
                    <h3>Get Your Tickets</h3>
                    <div class="ticket-price-info">
                        <span class="current-price">KES ${(event.price || 0).toLocaleString()}</span>
                        ${event.original_price ? `<span class="original-price">KES ${event.original_price.toLocaleString()}</span>` : ''}
                    </div>
                    <div class="ticket-availability">
                        <i class="fas fa-check-circle"></i> ${event.available_tickets || 0} tickets available
                    </div>
                    
                    <div class="ticket-quantity">
                        <label>Quantity</label>
                        <div class="quantity-selector">
                            <button class="qty-btn" id="decreaseQty">-</button>
                            <input type="number" id="ticketQuantity" value="1" min="1" max="${event.available_tickets || 10}">
                            <button class="qty-btn" id="increaseQty">+</button>
                        </div>
                    </div>
                    
                    <div class="ticket-total">
                        <span>Total:</span>
                        <span class="total-amount" id="totalAmount">KES ${(event.price || 0).toLocaleString()}</span>
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
    
    setupTabs();
    setupQuantitySelector(event);
    setupBookButton(event);
    setupWishlistButton(event);
    setupReviewModal(event);
}

function setupTabs() {
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
}

function setupQuantitySelector(event) {
    let quantity = 1;
    const qtyInput = document.getElementById('ticketQuantity');
    const totalSpan = document.getElementById('totalAmount');
    const decreaseBtn = document.getElementById('decreaseQty');
    const increaseBtn = document.getElementById('increaseQty');
    
    function updateTotal() {
        const total = quantity * (event.price || 0);
        totalSpan.textContent = `KES ${total.toLocaleString()}`;
    }
    
    if (decreaseBtn) {
        decreaseBtn.onclick = () => {
            if (quantity > 1) {
                quantity--;
                if (qtyInput) qtyInput.value = quantity;
                updateTotal();
            }
        };
    }
    
    if (increaseBtn) {
        increaseBtn.onclick = () => {
            if (quantity < (event.available_tickets || 10)) {
                quantity++;
                if (qtyInput) qtyInput.value = quantity;
                updateTotal();
            }
        };
    }
    
    if (qtyInput) {
        qtyInput.onchange = () => {
            quantity = parseInt(qtyInput.value) || 1;
            if (quantity < 1) quantity = 1;
            if (quantity > (event.available_tickets || 10)) quantity = event.available_tickets || 10;
            qtyInput.value = quantity;
            updateTotal();
        };
    }
}

function setupBookButton(event) {
    const bookBtn = document.getElementById('bookNowBtn');
    if (!bookBtn) return;
    
    bookBtn.onclick = () => {
        const token = localStorage.getItem('attendee_access_token');
        if (!token) {
            showToast('Please login to book tickets', 'info');
            setTimeout(() => window.location.href = '/login/', 1500);
            return;
        }
        
        const quantity = parseInt(document.getElementById('ticketQuantity')?.value || 1);
        
        let cart = localStorage.getItem('eventhub_cart');
        if (cart) {
            try {
                cart = JSON.parse(cart);
            } catch(e) {
                cart = { items: [], subtotal: 0, platform_fee: 0, total: 0 };
            }
        } else {
            cart = { items: [], subtotal: 0, platform_fee: 0, total: 0 };
        }
        
        const existingItem = cart.items.find(i => i.id == event.id);
        if (existingItem) {
            showToast(`${event.title} is already in your cart!`, 'info');
            setTimeout(() => window.location.href = '/cart/', 1000);
            return;
        }
        
        cart.items.push({
            id: event.id,
            title: event.title,
            price: event.price,
            quantity: quantity,
            image: event.image,
            location: event.location,
            date: event.date,
            category: event.category_name
        });
        
        cart.subtotal = cart.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        cart.platform_fee = Math.ceil(cart.subtotal * 0.05);
        cart.total = cart.subtotal + cart.platform_fee;
        
        localStorage.setItem('eventhub_cart', JSON.stringify(cart));
        window.dispatchEvent(new Event('cart-updated'));
        
        showToast(`${quantity} ticket(s) added to cart! Redirecting...`, 'success');
        setTimeout(() => window.location.href = '/cart/', 1000);
    };
}

function setupWishlistButton(event) {
    const wishlistBtn = document.getElementById('wishlistBtn');
    if (!wishlistBtn) return;
    
    wishlistBtn.onclick = () => {
        const token = localStorage.getItem('attendee_access_token');
        if (!token) {
            showToast('Please login to save to wishlist', 'info');
            setTimeout(() => window.location.href = '/login/', 1500);
            return;
        }
        
        let wishlist = JSON.parse(localStorage.getItem('event_wishlist') || '[]');
        const exists = wishlist.some(item => item.id == event.id);
        
        if (!exists) {
            wishlist.push({
                id: event.id,
                title: event.title,
                price: event.price,
                image: event.image,
                location: event.location,
                date: event.date,
                category: event.category_name,
                added_at: new Date().toISOString()
            });
            wishlistBtn.classList.add('active');
            wishlistBtn.innerHTML = '<i class="fas fa-heart"></i> Saved to Wishlist';
            showToast('Event saved to wishlist!', 'success');
        } else {
            wishlist = wishlist.filter(item => item.id != event.id);
            wishlistBtn.classList.remove('active');
            wishlistBtn.innerHTML = '<i class="fas fa-heart"></i> Save to Wishlist';
            showToast('Event removed from wishlist', 'info');
        }
        
        localStorage.setItem('event_wishlist', JSON.stringify(wishlist));
        window.dispatchEvent(new Event('wishlist-updated'));
    };
}

function setupReviewModal(event) {
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
        reviewForm.onsubmit = async (e) => {
            e.preventDefault();
            await submitReview(event.id);
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

async function submitReview(eventId) {
    const rating = parseInt(document.getElementById('reviewRating')?.value || 0);
    const title = document.getElementById('reviewTitle')?.value.trim();
    const content = document.getElementById('reviewText')?.value.trim();
    const token = localStorage.getItem('attendee_access_token');
    
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
    
    try {
        const response = await fetch(API.reviews, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                event_id: eventId,
                rating: rating,
                title: title,
                content: content
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Thank you for your review!', 'success');
            const modal = document.getElementById('reviewModal');
            if (modal) modal.style.display = 'none';
            resetReviewForm();
            await loadReviews();
        } else {
            showToast(data.message || 'Failed to submit review', 'error');
        }
    } catch (error) {
        console.error('Error submitting review:', error);
        showToast('Failed to submit review', 'error');
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', loadEventDetails);
