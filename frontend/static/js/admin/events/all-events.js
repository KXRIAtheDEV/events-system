// ============================================
// ALL EVENTS MANAGEMENT JS
// Location: static/js/admin/events/all-events.js
// ============================================

let currentPage = 1;
let totalPages = 1;

document.addEventListener('DOMContentLoaded', function() {
    loadEvents();
    setupEventListeners();
});

function setupEventListeners() {
    const searchInput = document.getElementById('searchEvents');
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', function() {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                currentPage = 1;
                loadEvents();
            }, 500);
        });
    }

    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            currentPage = 1;
            loadEvents();
        });
    }
}

async function loadEvents() {
    const search = document.getElementById('searchEvents')?.value || '';
    const status = document.getElementById('statusFilter')?.value || '';
    
    Loader.show('Loading events...');
    
    try {
        const params = new URLSearchParams({
            page: currentPage,
            search: search,
            status: status
        });
        const data = await apiRequest(`/api/admin/events/?${params}`);
        
        displayEvents(data.events);
        
        if (data.pagination) {
            totalPages = data.pagination.total_pages;
            renderPagination(currentPage, totalPages);
        }
    } catch (error) {
        console.error('Error loading events:', error);
        document.getElementById('eventsList').innerHTML = 
            '<tr><td colspan="6" class="text-center">Failed to load events</td></tr>';
    } finally {
        Loader.hide();
    }
}

function displayEvents(events) {
    const tbody = document.getElementById('eventsList');
    
    if (!events || events.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No events found</td></tr>';
        return;
    }
    
    tbody.innerHTML = events.map(event => `
        <tr>
            <td><strong>#${event.id}</strong></td>
            <td>
                <a href="/admin-portal/events/detail/?id=${event.id}" class="event-link" style="color: #ec6408; font-weight: 600; text-decoration: none;">
                    ${escapeHtml(event.title)}
                </a>
            </td>
            <td><strong>${escapeHtml(event.organizer_name || 'N/A')}</strong></td>
            <td>${formatDate(event.start_date)}</td>
            <td>${getEventStatusBadge(event.status)}</td>
            <td class="action-buttons" style="display: flex; align-items: center; gap: 6px; padding: 12px 8px;">
                <button class="action-btn view" onclick="viewEvent(${event.id})" aria-label="Review entry" title="Review Event" style="background-color: #2563eb; color: #ffffff; border: none; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; transition: all 0.2s ease; box-shadow: 0 1px 2px rgba(0,0,0,0.05);" onmouseover="this.style.backgroundColor='#1d4ed8'; this.style.boxShadow='0 4px 6px -1px rgba(0,0,0,0.1)';" onmouseout="this.style.backgroundColor='#2563eb'; this.style.boxShadow='0 1px 2px rgba(0,0,0,0.05)';">
                    <i class="fas fa-eye" style="font-size: 11px;"></i> Review
                </button>
                <button class="action-btn delete" onclick="deleteEvent(${event.id})" aria-label="Delete entry" title="Delete Event" style="background-color: #dc2626; color: #ffffff; border: none; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; transition: all 0.2s ease; box-shadow: 0 1px 2px rgba(0,0,0,0.05);" onmouseover="this.style.backgroundColor='#b91c1c'; this.style.boxShadow='0 4px 6px -1px rgba(0,0,0,0.1)';" onmouseout="this.style.backgroundColor='#dc2626'; this.style.boxShadow='0 1px 2px rgba(0,0,0,0.05)';">
                    <i class="fas fa-trash-alt" style="font-size: 11px;"></i> Delete
                </button>
            </td>
        </tr>
    `).join('');
}

function viewEvent(id) {
    window.location.href = `/admin-portal/events/detail/?id=${id}`;
}

async function deleteEvent(id) {
    if (confirm('Are you sure you want to permanently delete this event? This action cannot be undone and will cancel any active bookings.')) {
        Loader.show('Deleting event...');
        try {
            await apiRequest(`/api/admin/events/${id}/delete/`, 'DELETE');
            showToast('Event deleted successfully', 'success');
            loadEvents();
        } catch (error) {
            showToast('Failed to delete event', 'error');
        } finally {
            Loader.hide();
        }
    }
}

function applyFilters() {
    currentPage = 1;
    loadEvents();
}

function exportEvents() {
    const search = document.getElementById('searchEvents')?.value || '';
    const status = document.getElementById('statusFilter')?.value || '';
    const params = new URLSearchParams({
        search: search,
        status: status
    });
    window.open(`/api/admin/events/export/?${params}`, '_blank');
    showToast('Export started', 'success');
}

function renderPagination(current, total) {
    const container = document.getElementById('pagination');
    if (!container) return;
    
    if (total <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = '';
    html += `<button ${current === 1 ? 'disabled' : ''} onclick="changePage(${current - 1})" style="padding: 6px 12px; margin: 0 4px; border: 1px solid #cbd5e1; border-radius: 6px; background: #fff; cursor: pointer;">&laquo;</button>`;
    
    for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) {
        html += `<button class="${i === current ? 'active' : ''}" onclick="changePage(${i})" style="padding: 6px 12px; margin: 0 4px; border: 1px solid ${i === current ? '#ec6408' : '#cbd5e1'}; border-radius: 6px; background: ${i === current ? '#ec6408' : '#fff'}; color: ${i === current ? '#fff' : '#0f172a'}; font-weight: 600; cursor: pointer;">${i}</button>`;
    }
    
    html += `<button ${current === total ? 'disabled' : ''} onclick="changePage(${current + 1})" style="padding: 6px 12px; margin: 0 4px; border: 1px solid #cbd5e1; border-radius: 6px; background: #fff; cursor: pointer;">&raquo;</button>`;
    container.innerHTML = html;
}

function changePage(page) {
    if (page !== currentPage && page >= 1 && page <= totalPages) {
        currentPage = page;
        loadEvents();
    }
}

function getEventStatusBadge(status) {
    const badges = {
        'published': '<span class="status-badge status-approved" style="background: rgba(16, 185, 129, 0.1); color: #10b981; padding: 4px 8px; border-radius: 9999px; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;"><i class="fas fa-check-circle"></i> Published</span>',
        'active': '<span class="status-badge status-approved" style="background: rgba(16, 185, 129, 0.1); color: #10b981; padding: 4px 8px; border-radius: 9999px; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;"><i class="fas fa-check-circle"></i> Published</span>',
        'draft': '<span class="status-badge status-pending" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b; padding: 4px 8px; border-radius: 9999px; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;"><i class="fas fa-clock"></i> Pending Approval</span>',
        'cancelled': '<span class="status-badge status-cancelled" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 4px 8px; border-radius: 9999px; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;"><i class="fas fa-ban"></i> Cancelled</span>',
        'sold_out': '<span class="status-badge status-sold-out" style="background: rgba(107, 114, 128, 0.1); color: #6b7280; padding: 4px 8px; border-radius: 9999px; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;"><i class="fas fa-tags"></i> Sold Out</span>'
    };
    return badges[status] || `<span class="status-badge">${status}</span>`;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-KE');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions global
window.viewEvent = viewEvent;
window.deleteEvent = deleteEvent;
window.applyFilters = applyFilters;
window.exportEvents = exportEvents;
window.changePage = changePage;
