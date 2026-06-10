// EVENTS MODULE - Live API Integration
console.log('Events.js loaded');

let currentCategory = "all";
let currentSearch = "";
let filteredEvents = [];
let eventsCatalog = [];

// API endpoints
const API = {
    events: '/api/attendee/events/',
    categories: '/api/attendee/categories/',
};

function showToast(message, type) {
    const toast = document.createElement('div');
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
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function formatDate(dateString) {
    if (!dateString) return 'TBA';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

async function loadEventsFromAPI() {
    try {
        const params = new URLSearchParams();

        if (currentCategory !== 'all') {
            params.set('category', currentCategory);
        }

        if (currentSearch) {
            params.set('search', currentSearch);
            params.set('limit', '200');
        }

        const url = API.events + (params.toString() ? '?' + params.toString() : '');
        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            eventsCatalog = data.events || [];
        } else {
            console.error('Failed to load events:', data.message);
            eventsCatalog = [];
        }
    } catch (error) {
        console.error('Error loading events:', error);
        eventsCatalog = [];
    }
}

async function loadCategoriesFromAPI() {
    try {
        const response = await fetch(API.categories);
        const data = await response.json();
        
        if (data.success && data.categories) {
            return data.categories;
        }
        return [];
    } catch (error) {
        console.error('Error loading categories:', error);
        return [];
    }
}

async function addFilters() {
    const container = document.querySelector('.events-page .container');
    if (!container) return;
    
    const header = container.querySelector('.events-header');
    if (!header) return;
    
    const categoriesData = await loadCategoriesFromAPI();
    
    const categories = [
        { id: "all", name: "All Events", icon: "fa-calendar-alt" },
        ...categoriesData.map(cat => ({
            id: cat.slug || cat.id,
            name: cat.name,
            icon: cat.icon || "fa-tag"
        }))
    ];
    
    // Remove existing filter section if any
    let existingSection = document.querySelector('.filters-section');
    if (existingSection) {
        existingSection.remove();
    }
    
    const filterSection = document.createElement('div');
    filterSection.className = 'filters-section';
    
    // Category buttons
    let categoriesHtml = '<div class="categories-wrapper">';
    categories.forEach(cat => {
        categoriesHtml += `<button class="category-btn ${currentCategory === cat.id ? 'active' : ''}" data-category="${cat.id}"><i class="fas ${cat.icon}"></i><span>${cat.name}</span></button>`;
    });
    categoriesHtml += '</div>';
    
    filterSection.innerHTML = categoriesHtml;
    header.insertAdjacentElement('afterend', filterSection);
    
    // Category button event listeners
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentCategory = btn.dataset.category;
            document.querySelectorAll('.category-btn').forEach(b => b.classList.toggle('active', b.dataset.category === currentCategory));
            filterEvents();
        });
    });
    
    // Set up page search listener (Option 1)
    setupPageSearchListener();
}

function setupPageSearchListener() {
    const pageSearchInput = document.getElementById('searchInput');
    if (pageSearchInput) {
        pageSearchInput.removeEventListener('input', handleSearchInput);
        pageSearchInput.addEventListener('input', handleSearchInput);
    }
}

function handleSearchInput(e) {
    currentSearch = e.target.value.toLowerCase().trim();
    filterEvents();
}

async function filterEvents() {
    await loadEventsFromAPI();
    filteredEvents = [...eventsCatalog];
    
    // Update stats display
    const stats = document.getElementById('searchStats');
    if (stats) {
        if (currentSearch) {
            stats.innerHTML = `🔍 Found ${filteredEvents.length} event${filteredEvents.length !== 1 ? 's' : ''} for "${currentSearch}"`;
        } else if (currentCategory !== 'all') {
            const categoryName = document.querySelector(`.category-btn[data-category="${currentCategory}"] span`)?.textContent || currentCategory;
            stats.innerHTML = `📂 ${filteredEvents.length} event${filteredEvents.length !== 1 ? 's' : ''} in ${categoryName}`;
        } else {
            stats.innerHTML = `📅 ${filteredEvents.length} upcoming event${filteredEvents.length !== 1 ? 's' : ''}`;
        }
    }
    renderEvents();
}

function toggleWishlist(id, btn) {
    const token = localStorage.getItem('attendee_access_token');
    if (!token) {
        showToast('🔐 Please login to save to wishlist', 'info');
        setTimeout(() => window.location.href = '/login/', 1500);
        return;
    }
    
    const event = eventsCatalog.find(e => e.id == id);
    if (!event) return;
    
    let wishlist = JSON.parse(localStorage.getItem('event_wishlist') || '[]');
    const exists = wishlist.some(item => item.id == id);
    
    if (!exists) {
        wishlist.push({
            id: event.id,
            title: event.title,
            price: event.price,
            image: event.image,
            location: event.location,
            date: event.date,
            category: event.category_name,
            original_price: event.original_price,
            added_at: new Date().toISOString()
        });
        btn.innerHTML = '<i class="fas fa-heart"></i> Saved';
        btn.style.background = '#f59e0b';
        showToast('❤️ Event saved to wishlist!', 'success');
    } else {
        wishlist = wishlist.filter(item => item.id != id);
        btn.innerHTML = '<i class="far fa-heart"></i> Save';
        btn.style.background = 'rgba(0,0,0,0.5)';
        showToast('🗑️ Removed from wishlist', 'info');
    }
    
    localStorage.setItem('event_wishlist', JSON.stringify(wishlist));
    window.dispatchEvent(new Event('wishlist-updated'));
    
    const badge = document.getElementById('wishlistBadgeDropdown');
    if (badge) {
        badge.textContent = wishlist.length;
        badge.style.display = wishlist.length > 0 ? 'inline-block' : 'none';
    }
}

function renderEvents() {
    const grid = document.getElementById('eventsGrid');
    if (!grid) return;
    
    if (filteredEvents.length === 0) { 
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <h3>No events found</h3>
                <p>Try adjusting your search or browse all events</p>
                <button onclick="resetFilters()" class="btn-browse">
                    <i class="fas fa-redo-alt"></i> Browse All Events
                </button>
            </div>
        `; 
        return; 
    }
    
    const wishlist = JSON.parse(localStorage.getItem('event_wishlist') || '[]');
    const wishlistIds = wishlist.map(item => item.id);
    
    grid.innerHTML = filteredEvents.map(e => {
        const inWishlist = wishlistIds.includes(e.id);
        return `
            <div class="event-card" onclick="window.location.href='/events/detail/?id=${e.id}'">
                <div class="card-image-container">
                    <img src="${e.image || '/static/images/placeholder.jpg'}" class="card-bg-image" onerror="this.src='/static/images/placeholder.jpg'">
                    <div class="card-gradient-overlay"></div>
                    ${e.featured ? '<span class="featured-badge">Featured</span>' : ''}
                    <button class="wishlist-btn" data-id="${e.id}" style="background:${inWishlist ? '#f59e0b' : 'rgba(0,0,0,0.5)'}">
                        <i class="${inWishlist ? 'fas' : 'far'} fa-heart"></i> ${inWishlist ? 'Saved' : 'Save'}
                    </button>
                </div>
                <div class="card-content">
                    <span class="card-category">${e.category_name || 'Event'}</span>
                    <h3 class="card-title">${e.title}</h3>
                    <div class="card-meta">
                        <span><i class="fas fa-calendar"></i> ${formatDate(e.date)}</span>
                        <span><i class="fas fa-map-marker-alt"></i> ${e.location ? e.location.split(',')[0] : 'TBD'}</span>
                    </div>
                    <div class="card-price">KES ${(e.price || 0).toLocaleString()}</div>
                </div>
                <div class="card-actions">
                    <button class="card-action-btn view-details-btn" onclick="event.stopPropagation();window.location.href='/events/detail/?id=${e.id}'">
                        <i class="fas fa-info-circle"></i> Details
                    </button>
                    <button class="card-action-btn book-ticket-btn" data-id="${e.id}">
                        <i class="fas fa-ticket-alt"></i> Book Ticket
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    document.querySelectorAll('.book-ticket-btn').forEach(btn => {
        btn.removeEventListener('click', handleBookClick);
        btn.addEventListener('click', handleBookClick);
    });
    
    document.querySelectorAll('.wishlist-btn').forEach(btn => {
        btn.removeEventListener('click', handleWishlistClick);
        btn.addEventListener('click', handleWishlistClick);
    });
}

function handleBookClick(e) {
    e.stopPropagation();
    const id = parseInt(this.dataset.id);
    bookTicket(id);
}

function handleWishlistClick(e) {
    e.stopPropagation();
    const id = parseInt(this.dataset.id);
    const btn = this;
    toggleWishlist(id, btn);
}

function bookTicket(id) {
    const token = localStorage.getItem('attendee_access_token');
    if (!token) {
        showToast('🔐 Please login to book tickets', 'info');
        setTimeout(() => window.location.href = '/login/', 1500);
        return;
    }
    
    const event = eventsCatalog.find(e => e.id == id);
    if (!event) return;
    
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
    
    const existingItem = cart.items.find(i => i.id == id);
    if (existingItem) {
        showToast(`🎟️ ${event.title} is already in your booking cart!`, 'info');
        return;
    }
    
    cart.items.push({
        id: event.id,
        title: event.title,
        category: event.category_name,
        date: event.date,
        location: event.location,
        price: event.price,
        image: event.image,
        quantity: 1
    });
    
    cart.subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cart.platform_fee = 0;
    cart.total = cart.subtotal;
    
    localStorage.setItem('eventhub_cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cart-updated'));
    
    showToast(`✅ ${event.title} added to booking cart!`, 'success');
}

function resetFilters() {
    currentCategory = "all";
    currentSearch = "";
    
    // Update active category button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === currentCategory);
    });
    
    // Clear page search input
    const pageSearchInput = document.getElementById('searchInput');
    if (pageSearchInput) {
        pageSearchInput.value = '';
    }
    
    filterEvents();
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);

// Make resetFilters available globally
window.resetFilters = resetFilters;

document.addEventListener('DOMContentLoaded', async () => { 
    await addFilters(); 
    await filterEvents(); 
});