// ============================================
// ATTENDEE SEARCH - Using Global Loader & Mock Data
// ============================================

let currentPage = 1;
let totalPages = 1;
let currentQuery = '';
let currentFilters = {
    category: '',
    city: '',
    sort: 'relevance'
};

// DOM Elements
const searchResultsGrid = document.getElementById('searchResultsGrid');
const resultsCount = document.getElementById('resultsCount');
const searchQueryInfo = document.getElementById('searchQueryInfo');
const categoryFilter = document.getElementById('categoryFilter');
const cityFilter = document.getElementById('cityFilter');
const sortSelect = document.getElementById('sortBy');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    currentQuery = urlParams.get('q') || '';
    
    if (searchQueryInfo) {
        searchQueryInfo.innerHTML = `Showing results for "<strong>${escapeHtml(currentQuery)}</strong>"`;
    }
    
    loadCategories();
    loadSearchResults();
    setupEventListeners();
});

function setupEventListeners() {
    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => {
            currentFilters.category = categoryFilter.value;
            currentPage = 1;
            loadSearchResults();
        });
    }
    
    if (cityFilter) {
        cityFilter.addEventListener('change', () => {
            currentFilters.city = cityFilter.value;
            currentPage = 1;
            loadSearchResults();
        });
    }
    
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            currentFilters.sort = sortSelect.value;
            currentPage = 1;
            loadSearchResults();
        });
    }
}

async function loadCategories() {
    try {
        if (window.MockEventsData && window.MockEventsData.categories) {
            const categories = window.MockEventsData.categories;
            if (categoryFilter && categories && categories.length) {
                categoryFilter.innerHTML = '<option value="">All Categories</option>' + 
                    categories.map(c => `<option value="${c.slug}">${escapeHtml(c.name)}</option>`).join('');
            }
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

async function loadSearchResults() {
    // Use global loader if available
    if (window.PageLoader) {
        window.PageLoader.show('Searching for events...');
    }
    
    try {
        let results = [];
        
        if (window.MockEventsData) {
            results = window.MockEventsData.searchEvents(currentQuery);
            
            // Apply filters
            if (currentFilters.category) {
                results = results.filter(e => e.category === currentFilters.category);
            }
            
            if (currentFilters.city) {
                results = results.filter(e => e.location.toLowerCase().includes(currentFilters.city.toLowerCase()));
            }
            
            // Apply sorting
            switch(currentFilters.sort) {
                case 'date_asc':
                    results.sort((a, b) => new Date(a.date) - new Date(b.date));
                    break;
                case 'date_desc':
                    results.sort((a, b) => new Date(b.date) - new Date(a.date));
                    break;
                case 'price_asc':
                    results.sort((a, b) => a.price - b.price);
                    break;
                case 'price_desc':
                    results.sort((a, b) => b.price - a.price);
                    break;
                default:
                    results.sort((a, b) => new Date(a.date) - new Date(b.date));
            }
        }
        
        const total = results.length;
        totalPages = Math.ceil(total / 12);
        const start = (currentPage - 1) * 12;
        const paginatedResults = results.slice(start, start + 12);
        
        displayResults(paginatedResults);
        renderPagination(currentPage, totalPages);
        
        if (resultsCount) {
            resultsCount.textContent = `Found ${total} event${total !== 1 ? 's' : ''}`;
        }
        
    } catch (error) {
        console.error('Error searching:', error);
        if (searchResultsGrid) {
            searchResultsGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>Search Failed</h3>
                    <p>${error.message || 'Please try again later.'}</p>
                    <button class="btn-primary" onclick="location.reload()">Retry</button>
                </div>
            `;
        }
    } finally {
        // Hide global loader
        if (window.PageLoader) {
            setTimeout(() => window.PageLoader.hide(), 300);
        }
    }
}

function displayResults(events) {
    if (!searchResultsGrid) return;
    
    if (!events || events.length === 0) {
        searchResultsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>No results found</h3>
                <p>We couldn't find any events matching "${escapeHtml(currentQuery)}".</p>
                <p>Try adjusting your search terms or browse all events.</p>
                <a href="/events/" class="btn-primary">Browse All Events</a>
            </div>
        `;
        return;
    }
    
    searchResultsGrid.innerHTML = events.map(event => `
        <div class="premium-card" onclick="window.location.href='/events/detail/?id=${event.id}'" style="cursor: pointer;">
            <div class="card-image-container">
                <img src="${event.image}" alt="${event.title}" class="card-bg-image">
                <div class="card-gradient-overlay"></div>
                ${event.is_featured ? '<span class="featured-badge">Featured</span>' : ''}
                <span class="event-category">${escapeHtml(event.category_name)}</span>
            </div>
            <div class="card-content">
                <h3 class="card-title">${escapeHtml(event.title)}</h3>
                <div class="card-meta">
                    <span><i class="fas fa-calendar"></i> ${formatDate(event.date)}</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(event.location.split(',')[0])}</span>
                </div>
                <div class="card-price">KES ${event.price.toLocaleString()}</div>
            </div>
            <div class="card-actions">
                <button class="card-action-btn view-details-btn" onclick="event.stopPropagation(); window.location.href='/events/detail/?id=${event.id}'">
                    <i class="fas fa-info-circle"></i> Details
                </button>
                <button class="card-action-btn add-to-cart-btn" onclick="event.stopPropagation(); addToCart(${event.id})">
                    <i class="fas fa-cart-plus"></i> Add to Cart
                </button>
            </div>
        </div>
    `).join('');
}

function renderPagination(current, total) {
    const container = document.getElementById('pagination');
    if (!container || total <= 1) {
        if (container) container.innerHTML = '';
        return;
    }
    
    let html = '<div class="pagination-wrapper">';
    html += `<button class="page-btn" ${current === 1 ? 'disabled' : ''} onclick="changePage(${current - 1})">&laquo; Prev</button>`;
    
    let startPage = Math.max(1, current - 2);
    let endPage = Math.min(total, current + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="page-btn ${i === current ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
    }
    
    html += `<button class="page-btn" ${current === total ? 'disabled' : ''} onclick="changePage(${current + 1})">Next &raquo;</button>`;
    html += '</div>';
    container.innerHTML = html;
}

function changePage(page) {
    if (page !== currentPage && page >= 1 && page <= totalPages) {
        currentPage = page;
        loadSearchResults();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function formatDate(dateString) {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i><span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function addToCart(eventId) {
    const token = localStorage.getItem('attendee_access_token');
    
    if (!token) {
        showToast('Please login to add to cart', 'info');
        setTimeout(() => window.location.href = '/login/', 1500);
        return;
    }
    
    showToast('Added to cart!', 'success');
}

// Make functions global
window.changePage = changePage;
window.addToCart = addToCart;
