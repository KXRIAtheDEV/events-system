// EVENT DETAIL MODULE - With 4 Tabs: Details, Location, Directions, Reviews
console.log('Event detail loaded');

const urlParams = new URLSearchParams(window.location.search);
const eventId = urlParams.get('id');
let currentEvent = null;
let currentQuantity = 1;
let userLocation = null;

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

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
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
    if (reviewCount) reviewCount.textContent = `Based on ${reviewsCount} reviews`;
    if (reviewsList) reviewsList.innerHTML = renderReviewsList(eventId);
}

// Location Functions
function getUserLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
                resolve(userLocation);
            },
            (error) => {
                let errorMessage = 'Unable to get location';
                if (error.code === 1) errorMessage = 'Location permission denied';
                reject(new Error(errorMessage));
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    });
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

async function getCoordinatesFromAddress(address) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`);
        const data = await response.json();
        if (data && data.length > 0) {
            return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        }
        return null;
    } catch (error) {
        console.error('Geocoding error:', error);
        return null;
    }
}

async function handleLiveLocation() {
    const locationStatus = document.getElementById('locationStatus');
    if (locationStatus) {
        locationStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting your location...';
        locationStatus.style.display = 'flex';
    }
    
    try {
        await getUserLocation();
        const eventCoords = await getCoordinatesFromAddress(currentEvent.location);
        if (eventCoords) {
            currentEvent.coordinates = { lat: eventCoords.lat, lon: eventCoords.lon };
        }
        if (locationStatus) {
            locationStatus.innerHTML = '<i class="fas fa-check-circle"></i> ✅ Location detected!';
            locationStatus.style.background = '#d1fae5';
            setTimeout(() => locationStatus.style.display = 'none', 3000);
        }
        updateDistanceAndMap();
        showToast('Location detected!', 'success');
    } catch (error) {
        if (locationStatus) {
            locationStatus.innerHTML = `<i class="fas fa-exclamation-circle"></i> ⚠️ ${error.message}`;
            locationStatus.style.background = '#fee2e2';
            setTimeout(() => locationStatus.style.display = 'none', 5000);
        }
        showToast(error.message, 'error');
    }
}

function updateDistanceAndMap() {
    const distanceElement = document.getElementById('distanceInfo');
    const mapFrame = document.querySelector('#directionsTab .location-map iframe');
    
    if (userLocation && currentEvent.coordinates) {
        const distance = calculateDistance(
            userLocation.lat, userLocation.lng,
            currentEvent.coordinates.lat, currentEvent.coordinates.lon
        );
        let distanceText = distance < 1 ? `${Math.round(distance * 1000)}m away` : 
                          distance < 10 ? `${distance.toFixed(1)}km away` : 
                          `${Math.round(distance)}km away`;
        if (distanceElement) {
            distanceElement.innerHTML = `<i class="fas fa-location-dot"></i> 📍 ${distanceText} from your location`;
            distanceElement.style.display = 'flex';
        }
        
        if (mapFrame) {
            const mapUrl = `https://maps.google.com/maps?q=${userLocation.lat},${userLocation.lng}&q=${encodeURIComponent(currentEvent.location)}&output=embed`;
            mapFrame.src = mapUrl;
        }
    }
}

function getDirectionsFromLocation() {
    if (!userLocation) {
        showToast('Please get your location first', 'info');
        return;
    }
    const directionsUrl = `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${encodeURIComponent(currentEvent.location)}`;
    window.open(directionsUrl, '_blank');
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
        modal.style.display = 'flex';
        resetRatingStars();
    };
    
    if (closeBtn) closeBtn.onclick = () => {
        modal.style.display = 'none';
        resetReviewForm();
    };
    
    window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
    
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
            ratingInput.value = rating;
            stars.forEach((s, i) => {
                if (i < rating) s.classList.add('fas'), s.classList.remove('far');
                else s.classList.add('far'), s.classList.remove('fas');
            });
        };
        star.onmouseenter = function() {
            const rating = parseInt(this.dataset.rating);
            stars.forEach((s, i) => {
                if (i < rating) s.classList.add('fas'), s.classList.remove('far');
                else s.classList.add('far'), s.classList.remove('fas');
            });
        };
        star.onmouseleave = function() {
            const currentRating = parseInt(ratingInput.value) || 5;
            stars.forEach((s, i) => {
                if (i < currentRating) s.classList.add('fas'), s.classList.remove('far');
                else s.classList.add('far'), s.classList.remove('fas');
            });
        };
    });
}

function resetRatingStars() {
    const stars = document.querySelectorAll('.rating-select i');
    const ratingInput = document.getElementById('reviewRating');
    if (ratingInput) ratingInput.value = 5;
    stars.forEach((s, i) => { if (i < 5) s.classList.add('fas'), s.classList.remove('far'); });
}

function resetReviewForm() {
    document.getElementById('reviewForm')?.reset();
    resetRatingStars();
}

function submitReview(eventId) {
    const rating = parseInt(document.getElementById('reviewRating')?.value || 0);
    const title = document.getElementById('reviewTitle')?.value.trim();
    const content = document.getElementById('reviewText')?.value.trim();
    
    if (!title) { showToast('Please enter a title', 'error'); return; }
    if (!content) { showToast('Please enter your review', 'error'); return; }
    if (rating === 0) { showToast('Please select a rating', 'error'); return; }
    
    const user = JSON.parse(localStorage.getItem('attendee_user') || '{}');
    const userName = user.name || 'Guest';
    
    const newReview = {
        id: Date.now(),
        userName: userName,
        rating: rating,
        title: title,
        content: content,
        created_at: new Date().toISOString()
    };
    
    if (window.MOCK_EVENTS_DATA) {
        window.MOCK_EVENTS_DATA.addReview(parseInt(eventId), newReview);
    }
    
    updateReviewsUI(eventId);
    document.getElementById('reviewModal').style.display = 'none';
    resetReviewForm();
    showToast('Thank you for your review!', 'success');
}

function bookTicket(eventId, quantity) {
    const token = localStorage.getItem('attendee_access_token');
    if (!token) {
        showToast('Please login to book', 'info');
        setTimeout(() => window.location.href = '/login/', 1500);
        return;
    }
    
    if (!window.MOCK_EVENTS_DATA) return;
    const event = window.MOCK_EVENTS_DATA.getEventById(eventId);
    if (!event) return;
    
    if (event.available_tickets <= 0) {
        showToast('Sold out!', 'error');
        return;
    }
    
    let cart = JSON.parse(localStorage.getItem('eventhub_cart') || '{"items":[],"subtotal":0,"platform_fee":0,"total":0}');
    const existing = cart.items.find(i => i.id === eventId);
    
    if (existing) {
        existing.quantity += quantity;
        showToast(`Added ${quantity} more ticket(s)`, 'success');
    } else {
        cart.items.push({ 
            id: event.id, 
            title: event.title, 
            price: event.price, 
            quantity: quantity, 
            image: event.image,
            date: event.date,
            location: event.location
        });
        showToast(`Added to booking cart!`, 'success');
    }
    
    cart.subtotal = cart.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    cart.platform_fee = Math.ceil(cart.subtotal * 0.05);
    cart.total = cart.subtotal + cart.platform_fee;
    
    localStorage.setItem('eventhub_cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cart-updated'));
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
                    <a href="/">Home</a> / <a href="/events/">Events</a> / <span>${event.title}</span>
                </div>
                
                <div class="event-image-container">
                    <img src="${event.image}" alt="${event.title}" class="event-main-image">
                    ${event.is_featured ? '<div class="event-featured-badge">Featured</div>' : ''}
                </div>
                
                <div class="event-title-section">
                    <h1>${event.title}</h1>
                    <div class="event-rating">
                        <div class="stars">${renderStars(avgRating)}</div>
                        <span class="rating-count">(${reviewsCount})</span>
                    </div>
                </div>
                
                <div class="event-meta">
                    <span><i class="fas fa-calendar"></i> ${formatDate(event.date)}</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${event.location.split(',')[0]}</span>
                    <span><i class="fas fa-ticket-alt"></i> ${event.available_tickets} left</span>
                </div>
                
                <div class="event-tabs">
                    <button class="tab-btn active" data-tab="details">Details</button>
                    <button class="tab-btn" data-tab="location">Location</button>
                    <button class="tab-btn" data-tab="directions">Directions</button>
                    <button class="tab-btn" data-tab="reviews">Reviews</button>
                </div>
                
                <!-- Details Tab -->
                <div id="detailsTab" class="tab-content active">
                    <div class="event-description">
                        <h3><i class="fas fa-info-circle"></i> About</h3>
                        <p>${event.description}</p>
                    </div>
                    
                    <div class="event-features">
                        <h3><i class="fas fa-star"></i> Features</h3>
                        <ul>
                            ${event.features.slice(0,4).map(f => `<li><i class="fas fa-check-circle"></i> ${f}</li>`).join('')}
                        </ul>
                    </div>
                </div>
                
                <!-- Location Tab -->
                <div id="locationTab" class="tab-content">
                    <div class="event-location">
                        <h3><i class="fas fa-map-marker-alt"></i> Venue Location</h3>
                        <p><i class="fas fa-location-dot"></i> ${event.location}</p>
                        
                        <div id="locationStatus" class="location-status" style="display: none;"></div>
                        
                        <div class="location-controls">
                            <button id="getLiveLocationBtn" class="btn-live-location">
                                <i class="fas fa-location-arrow"></i> Get My Location
                            </button>
                        </div>
                        
                        <div class="location-map">
                            <iframe 
                                width="100%" 
                                height="250" 
                                frameborder="0" 
                                style="border:0; border-radius: 12px;"
                                src="https://maps.google.com/maps?q=${encodeURIComponent(event.location)}&output=embed"
                                allowfullscreen>
                            </iframe>
                        </div>
                    </div>
                </div>
                
                <!-- Directions Tab -->
                <div id="directionsTab" class="tab-content">
                    <div class="directions-container">
                        <h3><i class="fas fa-directions"></i> Get Directions</h3>
                        
                        <div id="distanceInfo" class="distance-info" style="display: none;"></div>
                        
                        <div class="directions-controls">
                            <button id="getDirectionsBtn" class="btn-get-directions">
                                <i class="fas fa-map-marked-alt"></i> Get Directions from My Location
                            </button>
                        </div>
                        
                        <div class="location-map">
                            <iframe 
                                width="100%" 
                                height="300" 
                                frameborder="0" 
                                style="border:0; border-radius: 12px;"
                                src="https://maps.google.com/maps?q=${encodeURIComponent(event.location)}&output=embed"
                                allowfullscreen>
                            </iframe>
                        </div>
                        
                        <div class="directions-tips">
                            <i class="fas fa-info-circle"></i> 
                            Click "Get My Location" in the Location tab first, then use Directions tab for step-by-step directions.
                        </div>
                    </div>
                </div>
                
                <!-- Reviews Tab -->
                <div id="reviewsTab" class="tab-content">
                    <div class="reviews-summary">
                        <div class="average-rating">
                            <div class="rating-number">${avgRating.toFixed(1)}</div>
                            <div class="stars-large">${renderStars(avgRating)}</div>
                            <div class="review-count">${reviewsCount} reviews</div>
                        </div>
                        <button id="writeReviewBtn" class="write-review-btn">Write Review</button>
                    </div>
                    <div id="reviewsList">${renderReviewsList(event.id)}</div>
                </div>
            </div>
            
            <div class="event-sidebar">
                <div class="ticket-card">
                    <h3>Get Your Tickets</h3>
                    <div class="current-price">KES ${event.price.toLocaleString()}</div>
                    ${event.original_price ? `<div><s class="original-price">KES ${event.original_price.toLocaleString()}</s></div>` : ''}
                    <div class="ticket-availability">
                        <i class="fas fa-check-circle"></i> ${event.available_tickets} tickets left
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
                        <i class="fas fa-heart"></i> ${isInWishlist ? 'Saved' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Setup tabs
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.onclick = () => {
            const tabId = tab.dataset.tab;
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`${tabId}Tab`).classList.add('active');
        };
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
        totalSpan.textContent = `KES ${(quantity * event.price).toLocaleString()}`;
    }
    
    decreaseBtn.onclick = () => { if (quantity > 1) { quantity--; qtyInput.value = quantity; updateTotal(); } };
    increaseBtn.onclick = () => { if (quantity < event.available_tickets) { quantity++; qtyInput.value = quantity; updateTotal(); } };
    qtyInput.onchange = () => { quantity = Math.min(Math.max(parseInt(qtyInput.value) || 1, 1), event.available_tickets); qtyInput.value = quantity; updateTotal(); };
    
    bookBtn.onclick = () => bookTicket(event.id, quantity);
    
    wishlistBtn.onclick = () => {
        const token = localStorage.getItem('attendee_access_token');
        if (!token) {
            showToast('Please login', 'info');
            setTimeout(() => window.location.href = '/login/', 1500);
            return;
        }
        let wishlist = JSON.parse(localStorage.getItem('event_wishlist') || '[]');
        const idx = wishlist.indexOf(event.id);
        if (idx === -1) {
            wishlist.push(event.id);
            wishlistBtn.classList.add('active');
            wishlistBtn.innerHTML = '<i class="fas fa-heart"></i> Saved';
            showToast('Saved to wishlist', 'success');
        } else {
            wishlist.splice(idx, 1);
            wishlistBtn.classList.remove('active');
            wishlistBtn.innerHTML = '<i class="fas fa-heart"></i> Save';
            showToast('Removed from wishlist', 'info');
        }
        localStorage.setItem('event_wishlist', JSON.stringify(wishlist));
        window.dispatchEvent(new Event('wishlist-updated'));
    };
    
    // Location tab buttons
    const liveLocationBtn = document.getElementById('getLiveLocationBtn');
    if (liveLocationBtn) {
        liveLocationBtn.onclick = () => handleLiveLocation();
    }
    
    // Directions tab button
    const directionsBtn = document.getElementById('getDirectionsBtn');
    if (directionsBtn) {
        directionsBtn.onclick = () => getDirectionsFromLocation();
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
                <a href="/events/" class="btn-primary">Browse Events</a>
            </div>
        `;
        return;
    }
    
    currentEvent = event;
    renderEventDetails(event);
}

document.addEventListener('DOMContentLoaded', loadEventDetails);
