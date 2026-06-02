// ============================================
// WISHLIST JS - Works with event IDs from localStorage
// Fetches full event data from eventsCatalog
// ============================================

let wishlistIds = [];
let wishlistItems = [];
let currentSearch = '';
let currentCategory = '';

const wishlistGrid = document.getElementById('wishlistGrid');
const emptyWishlist = document.getElementById('emptyWishlist');
const wishlistInfo = document.getElementById('wishlistInfo');
const wishlistCountSpan = document.getElementById('wishlistCount');
const searchInput = document.getElementById('searchWishlist');
const categoryFilter = document.getElementById('categoryFilter');
const clearAllBtn = document.getElementById('clearAllBtn');
const modal = document.getElementById('shareModal');
const shareLink = document.getElementById('shareLink');
let currentShareEvent = null;

// Import events from the global eventsCatalog if available
function getEventById(eventId) {
    // Try to get from window.MOCK_EVENTS_DATA first (from event detail page)
    if (window.MOCK_EVENTS_DATA && window.MOCK_EVENTS_DATA.getEventById) {
        const event = window.MOCK_EVENTS_DATA.getEventById(eventId);
        if (event) return event;
    }
    
    // Fallback events catalog
    
    return eventsCatalog.find(e => e.id == eventId);
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('Wishlist page loaded');
    loadWishlist();
    setupEventListeners();
    setupModalClose();
});

function setupEventListeners() {
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            currentSearch = this.value.toLowerCase();
            filterAndDisplay();
        });
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            currentCategory = this.value;
            filterAndDisplay();
        });
    }
    
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', clearAllWishlist);
    }
}

function setupModalClose() {
    const closeBtn = document.querySelector('.modal-close');
    if (closeBtn) closeBtn.addEventListener('click', () => closeModal());
    window.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
}

function loadWishlist() {
    try {
        // Get wishlist IDs from localStorage (what event detail page stores)
        const saved = localStorage.getItem('event_wishlist');
        console.log('Raw wishlist IDs:', saved);
        
        if (saved) {
            wishlistIds = JSON.parse(saved);
        } else {
            wishlistIds = [];
        }
        
        // Convert IDs to full event objects
        wishlistItems = [];
        wishlistIds.forEach(id => {
            const event = getEventById(id);
            if (event) {
                wishlistItems.push({
                    id: event.id,
                    title: event.title,
                    price: event.price,
                    image: event.image,
                    location: event.location,
                    date: event.date,
                    category: event.category_name || event.category,
                    original_price: event.original_price,
                    added_at: new Date().toISOString()
                });
            }
        });
        
        console.log('Loaded wishlist items:', wishlistItems.length);
        
        filterAndDisplay();
        updateEmptyState();
        updateWishlistBadge();
        
    } catch (error) {
        console.error('Error loading wishlist:', error);
        wishlistItems = [];
        updateEmptyState();
    }
}

function filterAndDisplay() {
    let filtered = [...wishlistItems];
    
    if (currentSearch) {
        filtered = filtered.filter(item => 
            (item.title || '').toLowerCase().includes(currentSearch) ||
            (item.location || '').toLowerCase().includes(currentSearch) ||
            (item.category || '').toLowerCase().includes(currentSearch)
        );
    }
    
    if (currentCategory) {
        filtered = filtered.filter(item => (item.category || '').toLowerCase() === currentCategory);
    }
    
    displayWishlist(filtered);
    if (wishlistCountSpan) wishlistCountSpan.textContent = filtered.length;
    if (wishlistInfo) wishlistInfo.style.display = filtered.length > 0 ? 'block' : 'none';
}

function displayWishlist(items) {
    if (!wishlistGrid) return;
    
    if (!items || items.length === 0) {
        wishlistGrid.innerHTML = '';
        return;
    }
    
    wishlistGrid.innerHTML = items.map(item => `
        <div class="wishlist-card" data-event-id="${item.id}" onclick="viewEvent(${item.id})">
            <div class="card-image-container">
                <img src="${item.image || '/static/images/placeholder.jpg'}" alt="${escapeHtml(item.title)}" class="card-image" onerror="this.src='/static/images/placeholder.jpg'">
                <div class="card-gradient-overlay"></div>
                <button class="remove-wishlist-btn" onclick="event.stopPropagation(); removeFromWishlist(${item.id})">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
            <div class="card-content">
                <span class="card-category">${escapeHtml(item.category || 'Event')}</span>
                <h3 class="card-title">${escapeHtml(item.title)}</h3>
                <div class="card-meta">
                    <span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(item.location || 'TBD')}</span>
                    <span><i class="fas fa-calendar"></i> ${formatDate(item.date)}</span>
                </div>
                <div class="card-price">KES ${(item.price || 0).toLocaleString()}</div>
            </div>
            <div class="card-actions">
                <button class="card-action-btn view-details-btn" onclick="event.stopPropagation(); viewEvent(${item.id})">
                    <i class="fas fa-info-circle"></i> Details
                </button>
                <button class="card-action-btn add-to-cart-btn" onclick="event.stopPropagation(); addToCart(${item.id})">
                    <i class="fas fa-cart-plus"></i> Book Now
                </button>
                <button class="share-btn-icon" onclick="event.stopPropagation(); openShareModal(${item.id})">
                    <i class="fas fa-share-alt"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function removeFromWishlist(eventId) {
    // Remove from IDs array
    wishlistIds = wishlistIds.filter(id => id != eventId);
    localStorage.setItem('event_wishlist', JSON.stringify(wishlistIds));
    
    // Remove from items array
    wishlistItems = wishlistItems.filter(item => item.id != eventId);
    
    filterAndDisplay();
    updateEmptyState();
    updateWishlistBadge();
    showToast('Removed from wishlist', 'success');
    window.dispatchEvent(new CustomEvent('wishlist-updated'));
}

function clearAllWishlist() {
    if (wishlistItems.length === 0) return;
    if (!confirm('Clear your entire wishlist?')) return;
    
    wishlistIds = [];
    wishlistItems = [];
    localStorage.setItem('event_wishlist', JSON.stringify([]));
    
    filterAndDisplay();
    updateEmptyState();
    updateWishlistBadge();
    showToast('Wishlist cleared', 'success');
    window.dispatchEvent(new CustomEvent('wishlist-updated'));
}

function addToCart(eventId) {
    const token = localStorage.getItem('attendee_access_token');
    if (!token) {
        showToast('Please login to book tickets', 'info');
        setTimeout(() => window.location.href = '/login/', 1500);
        return;
    }
    
    const event = wishlistItems.find(e => e.id == eventId);
    if (!event) {
        showToast('Event not found', 'error');
        return;
    }
    
    let cart = localStorage.getItem('eventhub_cart');
    cart = cart ? JSON.parse(cart) : { items: [], subtotal: 0, platform_fee: 0, total: 0 };
    
    if (cart.items.find(i => i.id == eventId)) {
        showToast('Already in cart!', 'info');
        return;
    }
    
    cart.items.push({
        id: event.id,
        title: event.title,
        price: event.price,
        quantity: 1,
        image: event.image,
        location: event.location,
        date: event.date
    });
    
    cart.subtotal = cart.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    cart.platform_fee = Math.ceil(cart.subtotal * 0.05);
    cart.total = cart.subtotal + cart.platform_fee;
    
    localStorage.setItem('eventhub_cart', JSON.stringify(cart));
    showToast('Added to cart!', 'success');
    window.dispatchEvent(new Event('cart-updated'));
}

function viewEvent(eventId) {
    window.location.href = `/events/detail/?id=${eventId}`;
}

function openShareModal(eventId) {
    const event = wishlistItems.find(e => e.id == eventId);
    if (!event) return;
    currentShareEvent = event;
    if (shareLink) shareLink.value = `${window.location.origin}/events/detail/?id=${event.id}`;
    if (modal) modal.classList.add('show');
}

function closeModal() {
    if (modal) modal.classList.remove('show');
    currentShareEvent = null;
}

function shareOnFacebook() {
    if (!currentShareEvent) return;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/events/detail/?id=${currentShareEvent.id}`)}`, '_blank');
}

function shareOnTwitter() {
    if (!currentShareEvent) return;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${currentShareEvent.title}`)}&url=${encodeURIComponent(`${window.location.origin}/events/detail/?id=${currentShareEvent.id}`)}`, '_blank');
}

function shareOnWhatsApp() {
    if (!currentShareEvent) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(`${currentShareEvent.title} - ${window.location.origin}/events/detail/?id=${currentShareEvent.id}`)}`, '_blank');
}

function shareViaEmail() {
    if (!currentShareEvent) return;
    window.location.href = `mailto:?subject=${encodeURIComponent(`Check out ${currentShareEvent.title}`)}&body=${encodeURIComponent(`${window.location.origin}/events/detail/?id=${currentShareEvent.id}`)}`;
}

function copyShareLink() {
    if (!shareLink) return;
    shareLink.select();
    document.execCommand('copy');
    showToast('Link copied!', 'success');
}

function updateEmptyState() {
    const hasItems = wishlistItems.length > 0;
    if (wishlistGrid) wishlistGrid.style.display = hasItems ? 'grid' : 'none';
    if (emptyWishlist) emptyWishlist.style.display = hasItems ? 'none' : 'flex';
    if (wishlistInfo) wishlistInfo.style.display = hasItems ? 'block' : 'none';
}

function updateWishlistBadge() {
    const count = wishlistItems.length;
    const badge = document.getElementById('wishlistBadgeDropdown');
    const mobileBadge = document.getElementById('mobileWishlistBadge');
    if (badge) {
        if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }
    if (mobileBadge) {
        if (count > 0) {
            mobileBadge.textContent = count;
            mobileBadge.style.display = 'inline-block';
        } else {
            mobileBadge.style.display = 'none';
        }
    }
}

function formatDate(dateString) {
    if (!dateString) return 'TBA';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'TBA';
        return date.toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch(e) { return 'TBA'; }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message, type) {
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 10000;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-size: 0.85rem;
        background: ${type === 'success' ? '#10b981' : '#3b82f6'};
        animation: slideInRight 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i><span>${escapeHtml(message)}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

window.removeFromWishlist = removeFromWishlist;
window.addToCart = addToCart;
window.viewEvent = viewEvent;
window.openShareModal = openShareModal;
window.shareOnFacebook = shareOnFacebook;
window.shareOnTwitter = shareOnTwitter;
window.shareOnWhatsApp = shareOnWhatsApp;
window.shareViaEmail = shareViaEmail;
window.copyShareLink = copyShareLink;
window.clearAllWishlist = clearAllWishlist;
