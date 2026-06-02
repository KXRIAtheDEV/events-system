// ============================================
// GLOBAL HELPERS (used across all modules)
// ============================================

window.showToast = function(message, type = 'info') {
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.style.position = 'fixed';
        toastContainer.style.bottom = '20px';
        toastContainer.style.right = '20px';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'primary'} border-0`;
    toast.role = 'alert';
    toast.innerHTML = `<div class="d-flex"><div class="toast-body">${message}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`;
    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    toast.addEventListener('hidden.bs.toast', () => toast.remove());
};

window.renderPagination = function(data, currentPage, callback, containerId = 'pagination') {
    const container = document.getElementById(containerId);
    if (!container || !data.total_pages || data.total_pages <= 1) return;
    let html = '';
    if (data.previous) html += `<li class="page-item"><a class="page-link" href="#" data-page="${currentPage-1}">Prev</a></li>`;
    for (let i = 1; i <= Math.min(data.total_pages, 5); i++) {
        html += `<li class="page-item ${i === currentPage ? 'active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
    }
    if (data.next) html += `<li class="page-item"><a class="page-link" href="#" data-page="${currentPage+1}">Next</a></li>`;
    container.innerHTML = html;
    container.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = parseInt(link.dataset.page);
            if (page && page !== currentPage && page >= 1 && page <= data.total_pages) {
                callback(page);
            }
        });
    });
};

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
}

// ============================================
// DASHBOARD SPECIFIC FUNCTIONS
// ============================================

let revenueChart = null;

window.loadDashboardStats = async function() {
    const totalEventsEl = document.getElementById('totalEvents');
    const totalTicketsEl = document.getElementById('totalTicketsSold');
    const totalRevenueEl = document.getElementById('totalRevenue');
    const totalAttendeesEl = document.getElementById('totalAttendees');

    // dashboard.js is loaded globally from organizer base template.
    // If we're not on the dashboard page, stats cards are absent.
    if (!totalEventsEl || !totalTicketsEl || !totalRevenueEl || !totalAttendeesEl) {
        return;
    }

    try {
        const stats = await OrganizerAPI.dashboard.getStats();

        // Support both legacy and current backend key names.
        const totalEvents = stats.total_events ?? stats.events_count ?? 0;
        const totalTicketsSold = stats.total_tickets_sold ?? stats.tickets_sold ?? 0;
        const totalRevenue = stats.total_revenue ?? stats.revenue ?? 0;
        const totalAttendees = stats.total_attendees ?? stats.attendees ?? 0;

        totalEventsEl.innerText = totalEvents;
        totalTicketsEl.innerText = Number(totalTicketsSold).toLocaleString();
        totalRevenueEl.innerText = 'Kes ' + Number(totalRevenue).toLocaleString('en-KE');
        totalAttendeesEl.innerText = Number(totalAttendees).toLocaleString();
        if (stats.organizer_name) document.getElementById('organizerName').innerText = stats.organizer_name;
        if (stats.events_change) document.getElementById('eventsChange').innerHTML = (stats.events_change > 0 ? '+' : '') + stats.events_change + '%';
        if (stats.tickets_change) document.getElementById('ticketsChange').innerHTML = (stats.tickets_change > 0 ? '+' : '') + stats.tickets_change + '%';
        if (stats.revenue_change) document.getElementById('revenueChange').innerHTML = (stats.revenue_change > 0 ? '+' : '') + stats.revenue_change + '%';
        if (stats.attendees_change) document.getElementById('attendeesChange').innerHTML = (stats.attendees_change > 0 ? '+' : '') + stats.attendees_change + '%';
    } catch(e) {
        console.error(e);
        // If auth expired, send user to login instead of repeating toasts.
        if (e && (e.status === 401 || e.status === 403)) {
            window.location.href = '/login/';
            return;
        }
        // Keep dashboard usable even when stats endpoint has transient issues.
        totalEventsEl.innerText = '0';
        totalTicketsEl.innerText = '0';
        totalRevenueEl.innerText = 'Kes 0';
        totalAttendeesEl.innerText = '0';
    }
};

window.loadRevenueChart = async function(period) {
    try {
        const data = await OrganizerAPI.dashboard.getRevenue(period);
        const labels = data.labels || ['Jan','Feb','Mar','Apr','May','Jun'];
        const values = data.values || [0,0,0,0,0,0];
        if (revenueChart) revenueChart.destroy();
        const ctx = document.getElementById('revenueChart').getContext('2d');
        revenueChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{ label: 'Revenue', data: values, borderColor: '#ff6b00', backgroundColor: 'rgba(255,107,0,0.1)', fill: true, tension: 0.4 }]
            },
            options: { responsive: true, maintainAspectRatio: true }
        });
    } catch(e) {
        console.error(e);
    }
};

window.loadUpcomingEvents = async function() {
    try {
        const events = await OrganizerAPI.dashboard.getUpcomingEvents(5);
        const container = document.getElementById('upcomingEventsList');
        if (!events || events.length === 0) {
            container.innerHTML = '<div class="text-muted text-center">No upcoming events</div>';
            return;
        }
        container.innerHTML = events.map(e => `
            <div class="border-bottom py-2">
                <strong class="event-name-td">${escapeHtml(e.title)}</strong><br>
                <small>${new Date(e.date).toLocaleDateString()} | ${e.tickets_sold || 0}/${e.capacity || 0} tickets</small>
            </div>
        `).join('');
    } catch(e) {
        console.error(e);
    }
};

window.loadRecentBookings = async function() {
    try {
        const bookings = await OrganizerAPI.dashboard.getRecentBookings(5);
        const container = document.getElementById('recentBookingsList');
        if (!bookings || bookings.length === 0) {
            container.innerHTML = '<div class="text-muted text-center">No recent bookings</div>';
            return;
        }
        container.innerHTML = bookings.map(b => `
            <div class="border-bottom py-2">
                <strong>${escapeHtml(b.event_title)}</strong><br>
                <small>${escapeHtml(b.attendee_name)} - Kes ${b.amount} <span class="status-badge ${b.status === 'confirmed' ? 'active' : 'pending'}">${b.status}</span></small>
            </div>
        `).join('');
    } catch(e) {
        console.error(e);
    }
};

window.loadPerformance = async function() {
    try {
        const perf = await OrganizerAPI.dashboard.getPerformance();
        document.getElementById('performanceScore').innerText = perf.score || 85;
        document.getElementById('performanceProgress').style.width = (perf.score || 85) + '%';
        document.getElementById('avgRating').innerText = perf.avg_rating || 4.5;
        document.getElementById('fulfillmentRate').innerText = perf.fulfillment_rate || 92;
    } catch(e) {
        console.error(e);
    }
};

window.loadNotifications = async function() {
    try {
        const notifs = await OrganizerAPI.dashboard.getNotifications();
        const container = document.getElementById('notificationsList');
        if (!notifs || notifs.length === 0) {
            container.innerHTML = '<div class="text-muted text-center">No notifications</div>';
            return;
        }
        container.innerHTML = notifs.map(n => `
            <div class="notification-item p-2 ${n.is_read ? '' : 'unread'}" data-id="${n.id}">
                <strong>${escapeHtml(n.title)}</strong><br>
                <small>${escapeHtml(n.message)}</small><br>
                <small class="text-muted">${new Date(n.created_at).toLocaleString()}</small>
            </div>
        `).join('');
        document.querySelectorAll('.notification-item.unread').forEach(el => {
            el.addEventListener('click', async () => {
                try {
                    await OrganizerAPI.notifications.markAsRead(el.dataset.id);
                    el.classList.remove('unread');
                } catch(e) {}
            });
        });
    } catch(e) {
        console.error(e);
    }
};

// Attach global listeners (period selector, mark all read)
document.addEventListener('DOMContentLoaded', function() {
    const periodSelect = document.getElementById('revenuePeriod');
    if (periodSelect) {
        periodSelect.addEventListener('change', (e) => loadRevenueChart(e.target.value));
    }
    const markAllBtn = document.getElementById('markAllReadBtn');
    if (markAllBtn) {
        markAllBtn.addEventListener('click', async () => {
            try {
                await OrganizerAPI.notifications.markAllAsRead();
                loadNotifications();
                showToast('All notifications marked as read', 'success');
            } catch(e) {}
        });
    }
});