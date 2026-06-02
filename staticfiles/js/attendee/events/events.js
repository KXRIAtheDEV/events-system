// EVENTS MODULE - Working with Toast
console.log('Events.js loaded');

let currentCategory = "all";
let currentSearch = "";
let filteredEvents = [];

const eventsCatalog = [
    { id: 1, title: "Summer Music Festival 2026", category: "music", category_name: "Music", date: "2026-06-15", location: "Uhuru Gardens, Nairobi", price: 2500, original_price: 5000, image: "https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?w=600", featured: true, available_tickets: 150, rating: 4.8, review_count: 234 },
    { id: 2, title: "Tech Innovation Summit", category: "technology", category_name: "Technology", date: "2026-07-20", location: "KICC, Nairobi", price: 5000, original_price: 8000, image: "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?w=600", featured: true, available_tickets: 200, rating: 4.9, review_count: 156 },
    { id: 3, title: "Marathon Kenya 2026", category: "sports", category_name: "Sports", date: "2026-08-10", location: "Eldoret Sports Complex", price: 1500, original_price: 2500, image: "https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?w=600", featured: true, available_tickets: 500, rating: 4.7, review_count: 89 },
    { id: 4, title: "Food & Wine Expo", category: "food", category_name: "Food & Drink", date: "2026-09-05", location: "Sarit Centre, Nairobi", price: 3000, original_price: 4500, image: "https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg?w=600", featured: false, available_tickets: 180, rating: 4.6, review_count: 203 },
    { id: 5, title: "Art & Culture Festival", category: "arts", category_name: "Arts", date: "2026-10-12", location: "Nairobi National Museum", price: 1200, original_price: null, image: "https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?w=600", featured: false, available_tickets: 250, rating: 4.5, review_count: 67 },
    { id: 6, title: "Business Leadership Forum", category: "business", category_name: "Business", date: "2026-11-08", location: "Serena Hotel, Nairobi", price: 8000, original_price: null, image: "https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?w=600", featured: true, available_tickets: 120, rating: 4.9, review_count: 112 }
];

const categories = [
    { id: "all", name: "All Events", icon: "fa-calendar-alt" },
    { id: "music", name: "Music", icon: "fa-music" },
    { id: "technology", name: "Technology", icon: "fa-microchip" },
    { id: "sports", name: "Sports", icon: "fa-futbol" },
    { id: "food", name: "Food & Drink", icon: "fa-utensils" },
    { id: "arts", name: "Arts", icon: "fa-palette" },
    { id: "business", name: "Business", icon: "fa-briefcase" }
];

// Simple working toast
function showToast(message, type) {
    console.log('Toast:', message, type);
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

function renderStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= fullStars) stars += '<i class="fas fa-star"></i>';
        else if (i === fullStars + 1 && hasHalf) stars += '<i class="fas fa-star-half-alt"></i>';
        else stars += '<i class="far fa-star"></i>';
    }
    return stars;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function addFilters() {
    const container = document.querySelector('.events-page .container');
    if (!container) return;
    
    const header = container.querySelector('.events-header');
    if (!header) return;
    
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

function filterEvents() {
    let filtered = [...eventsCatalog];
    if (currentCategory !== 'all') filtered = filtered.filter(e => e.category === currentCategory);
    if (currentSearch) filtered = filtered.filter(e => e.title.toLowerCase().includes(currentSearch) || e.category_name.toLowerCase().includes(currentSearch) || e.location.toLowerCase().includes(currentSearch));
    filteredEvents = filtered;
    const stats = document.getElementById('searchStats');
    if (stats) {
        stats.innerHTML = currentSearch || currentCategory !== 'all' ? `Found ${filteredEvents.length} event${filteredEvents.length !== 1 ? 's' : ''}` : `Showing ${filteredEvents.length} upcoming events`;
    }
    renderEvents();
}

function renderEvents() {
    const grid = document.getElementById('eventsGrid');
    if (!grid) return;
    if (filteredEvents.length === 0) { 
        grid.innerHTML = '<div style="text-align:center;padding:4rem;"><i class="fas fa-calendar-times"></i><h3>No events found</h3></div>'; 
        return; 
    }
    
    const wishlist = JSON.parse(localStorage.getItem('event_wishlist') || '[]');
    grid.innerHTML = filteredEvents.map(e => `
        <div class="event-card" style="position:relative;border-radius:20px;overflow:hidden;background:transparent;box-shadow:0 10px 30px -12px rgba(0,0,0,0.25);transition:transform 0.3s;cursor:pointer;height:100%;" onclick="window.location.href='/events/detail/?id=${e.id}'">
            <div style="position:relative;width:100%;height:280px;overflow:hidden;">
                <img src="${e.image}" style="width:100%;height:100%;object-fit:cover;transition:transform 0.5s;">
                <div style="position:absolute;bottom:0;left:0;right:0;height:70%;background:linear-gradient(to top,#ec6408 0%,rgba(236,100,8,0.9) 20%,rgba(236,100,8,0.6) 40%,rgba(236,100,8,0.3) 60%,transparent 100%);"></div>
                ${e.featured ? '<span style="position:absolute;top:12px;left:12px;background:linear-gradient(135deg,#f59e0b,#ec6408);color:white;padding:4px 12px;border-radius:20px;font-size:0.65rem;">Featured</span>' : ''}
                <button class="wishlist-btn" data-id="${e.id}" style="position:absolute;top:12px;right:12px;background:${wishlist.includes(e.id) ? '#f59e0b' : 'rgba(0,0,0,0.5)'};border:none;padding:6px 12px;border-radius:20px;color:white;font-size:0.65rem;cursor:pointer;">
                    <i class="${wishlist.includes(e.id) ? 'fas' : 'far'} fa-heart"></i> ${wishlist.includes(e.id) ? 'Saved' : 'Save'}
                </button>
            </div>
            <div style="position:absolute;bottom:0;left:0;right:0;padding:20px 16px 70px 16px;color:white;">
                <span style="display:inline-block;padding:4px 12px;background:rgba(0,0,0,0.5);border-radius:20px;font-size:0.65rem;">${e.category_name}</span>
                <h3 style="font-size:1rem;margin:8px 0 6px;">${e.title}</h3>
                <div style="font-size:0.65rem;display:flex;gap:12px;margin-bottom:8px;"><span><i class="fas fa-calendar"></i> ${formatDate(e.date)}</span><span><i class="fas fa-map-marker-alt"></i> ${e.location.split(',')[0]}</span></div>
                <div style="font-size:0.7rem;margin-bottom:8px;color:#ffd045;"><i class="fas fa-ticket-alt"></i> ${e.available_tickets} tickets left</div>
                <div style="font-size:0.85rem;font-weight:700;color:#ffd045;">KES ${e.price.toLocaleString()}</div>
            </div>
            <div style="position:absolute;bottom:0;left:0;right:0;display:flex;gap:10px;padding:12px 16px;">
                <button onclick="event.stopPropagation();window.location.href='/events/detail/?id=${e.id}'" style="flex:1;padding:8px;border-radius:30px;font-size:0.7rem;background:rgba(255,255,255,0.2);color:white;border:1px solid rgba(255,255,255,0.3);cursor:pointer;"><i class="fas fa-info-circle"></i> Details</button>
                <button class="book-ticket-btn" data-id="${e.id}" style="flex:1;padding:8px;border-radius:30px;font-size:0.7rem;background:linear-gradient(135deg,#f59e0b,#ec6408);color:white;border:none;cursor:pointer;"><i class="fas fa-ticket-alt"></i> Book</button>
            </div>
        </div>
    `).join('');
    
    // Add event listeners for book buttons
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

function toggleWishlist(id, btn) {
    const token = localStorage.getItem('attendee_access_token');
    if (!token) {
        showToast('Please login to save to wishlist', 'info');
        setTimeout(() => window.location.href = '/login/', 1500);
        return;
    }
    let wishlist = JSON.parse(localStorage.getItem('event_wishlist') || '[]');
    const idx = wishlist.indexOf(id);
    if (idx === -1) {
        wishlist.push(id);
        btn.innerHTML = '<i class="fas fa-heart"></i> Saved';
        btn.style.background = '#f59e0b';
        showToast('Saved to wishlist!', 'success');
    } else {
        wishlist.splice(idx, 1);
        btn.innerHTML = '<i class="far fa-heart"></i> Save';
        btn.style.background = 'rgba(0,0,0,0.5)';
        showToast('Removed from wishlist', 'info');
    }
    localStorage.setItem('event_wishlist', JSON.stringify(wishlist));
    window.dispatchEvent(new Event('wishlist-updated'));
}

function bookTicket(id) {
    const token = localStorage.getItem('attendee_access_token');
    if (!token) {
        showToast('Please login to book tickets', 'info');
        setTimeout(() => window.location.href = '/login/', 1500);
        return;
    }
    
    const event = eventsCatalog.find(e => e.id === id);
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
    
    const existingItem = cart.items.find(i => i.id === id);
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

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', () => { 
    addFilters(); 
    filterEvents(); 
});
