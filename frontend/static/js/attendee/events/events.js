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
        let url = API.events;
        if (currentCategory !== 'all') {
            url += `?category=${currentCategory}`;
        }
        
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
    
    const filterSection = document.createElement('div');
    filterSection.className = 'filters-section';
    
    let categoriesHtml = '<div class="categories-wrapper">';
    categories.forEach(cat => {
        categoriesHtml += `<button class="category-btn ${currentCategory === cat.id ? 'active' : ''}" data-category="${cat.id}"><i class="fas ${cat.icon}"></i><span>${cat.name}</span></button>`;
    });
    categoriesHtml += '</div><div class="search-wrapper"><i class="fas fa-search"></i><input type="text" id="searchInput" placeholder="Search events..."></div><div class="search-stats" id="searchStats"></div>';
    
    filterSection.innerHTML = categoriesHtml;
    header.insertAdjacentElement('afterend', filterSection);
    
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentCategory = btn.dataset.category;
            document.querySelectorAll('.category-btn').forEach(b => b.classList.toggle('active', b.dataset.category === currentCategory));
            filterEvents();
        });
    });
    
    document.getElementById('searchInput')?.addEventListener('input', (e) => {
        currentSearch = e.target.value.toLowerCase();
        filterEvents();
    });
}

async function filterEvents() {
    await loadEventsFromAPI();
    
    let filtered = [...eventsCatalog];
    if (currentCategory !== 'all') filtered = filtered.filter(e => e.category === currentCategory);
    if (currentSearch) filtered = filtered.filter(e => e.title.toLowerCase().includes(currentSearch) || (e.category_name && e.category_name.toLowerCase().includes(currentSearch)) || (e.location && e.location.toLowerCase().includes(currentSearch)));
    filteredEvents = filtered;
    const stats = document.getElementById('searchStats');
    if (stats) {
        stats.innerHTML = currentSearch || currentCategory !== 'all' ? `Found ${filteredEvents.length} event${filteredEvents.length !== 1 ? 's' : ''}` : `Showing ${filteredEvents.length} upcoming events`;
    }
    renderEvents();
}

function toggleWishlist(id, btn) {
    const token = localStorage.getItem('attendee_access_token');
    if (!token) {
        showToast('Please login to save to wishlist', 'info');
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
        showToast('Saved to wishlist!', 'success');
    } else {
        wishlist = wishlist.filter(item => item.id != id);
        btn.innerHTML = '<i class="far fa-heart"></i> Save';
        btn.style.background = 'rgba(0,0,0,0.5)';
        showToast('Removed from wishlist', 'info');
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
        grid.innerHTML = '<div style="text-align:center;padding:4rem;"><i class="fas fa-calendar-times"></i><h3>No events found</h3></div>'; 
        return; 
    }
    
    const wishlist = JSON.parse(localStorage.getItem('event_wishlist') || '[]');
    const wishlistIds = wishlist.map(item => item.id);
    
    grid.innerHTML = filteredEvents.map(e => {
        const inWishlist = wishlistIds.includes(e.id);
        return `
            <div class="event-card" style="position:relative;border-radius:20px;overflow:hidden;background:transparent;box-shadow:0 10px 30px -12px rgba(0,0,0,0.25);transition:transform 0.3s;cursor:pointer;height:100%;" onclick="window.location.href='/events/detail/?id=${e.id}'">
                <div style="position:relative;width:100%;height:280px;overflow:hidden;">
                    <img src="${e.image || '/static/images/placeholder.jpg'}" style="width:100%;height:100%;object-fit:cover;transition:transform 0.5s;" onerror="this.src='/static/images/placeholder.jpg'">
                    <div style="position:absolute;bottom:0;left:0;right:0;height:70%;background:linear-gradient(to top,#ec6408 0%,rgba(236,100,8,0.9) 20%,rgba(236,100,8,0.6) 40%,rgba(236,100,8,0.3) 60%,transparent 100%);"></div>
                    ${e.featured ? '<span style="position:absolute;top:12px;left:12px;background:linear-gradient(135deg,#f59e0b,#ec6408);color:white;padding:4px 12px;border-radius:20px;font-size:0.65rem;">Featured</span>' : ''}
                    <button class="wishlist-btn" data-id="${e.id}" style="position:absolute;top:12px;right:12px;background:${inWishlist ? '#f59e0b' : 'rgba(0,0,0,0.5)'};border:none;padding:6px 12px;border-radius:20px;color:white;font-size:0.65rem;cursor:pointer;">
                        <i class="${inWishlist ? 'fas' : 'far'} fa-heart"></i> ${inWishlist ? 'Saved' : 'Save'}
                    </button>
                </div>
                <div style="position:absolute;bottom:0;left:0;right:0;padding:20px 16px 70px 16px;color:white;">
                    <span style="display:inline-block;padding:4px 12px;background:rgba(0,0,0,0.5);border-radius:20px;font-size:0.65rem;">${e.category_name || 'Event'}</span>
                    <h3 style="font-size:1rem;margin:8px 0 6px;">${e.title}</h3>
                    <div style="font-size:0.65rem;display:flex;gap:12px;margin-bottom:8px;"><span><i class="fas fa-calendar"></i> ${formatDate(e.date)}</span><span><i class="fas fa-map-marker-alt"></i> ${e.location ? e.location.split(',')[0] : 'TBD'}</span></div>
                    <div style="font-size:0.7rem;margin-bottom:8px;color:#ffd045;"><i class="fas fa-ticket-alt"></i> ${e.available_tickets || 0} tickets left</div>
                    <div style="font-size:0.85rem;font-weight:700;color:#ffd045;">KES ${(e.price || 0).toLocaleString()}</div>
                </div>
                <div style="position:absolute;bottom:0;left:0;right:0;display:flex;gap:10px;padding:12px 16px;">
                    <button onclick="event.stopPropagation();window.location.href='/events/detail/?id=${e.id}'" style="flex:1;padding:8px;border-radius:30px;font-size:0.7rem;background:rgba(255,255,255,0.2);color:white;border:1px solid rgba(255,255,255,0.3);cursor:pointer;"><i class="fas fa-info-circle"></i> Details</button>
                    <button class="book-ticket-btn" data-id="${e.id}" style="flex:1;padding:8px;border-radius:30px;font-size:0.7rem;background:linear-gradient(135deg,#f59e0b,#ec6408);color:white;border:none;cursor:pointer;"><i class="fas fa-ticket-alt"></i> Book</button>
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
        showToast('Please login to book tickets', 'info');
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
        showToast(`${event.title} is already in your booking cart!`, 'info');
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
    cart.platform_fee = Math.ceil(cart.subtotal * 0.05);
    cart.total = cart.subtotal + cart.platform_fee;
    
    localStorage.setItem('eventhub_cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cart-updated'));
    
    showToast(`${event.title} added to booking cart!`, 'success');
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', async () => { 
    await loadEventsFromAPI();
    await addFilters(); 
    await filterEvents(); 
});
