// ============================================
// DASHBOARD MODULE - Preserves user data
// ============================================

let allTickets = [];
let allBookings = [];

document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();
    displayCurrentDate();
    displayUserName();
});

function displayCurrentDate() {
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateElement.textContent = now.toLocaleDateString('en-US', options);
    }
}

function displayUserName() {
    const user = JSON.parse(localStorage.getItem('attendee_user') || '{}');
    const userNameSpan = document.getElementById('userName');
    if (userNameSpan) {
        const name = user.name || user.first_name || user.username || 'Attendee';
        userNameSpan.textContent = name;
    }
}

function loadDashboardData() {
    loadTicketsAndBookings();
    loadRecentActivity();
    loadStats();
}

function loadTicketsAndBookings() {
    try {
        const savedTickets = localStorage.getItem('eventhub_tickets');
        const savedBookings = localStorage.getItem('eventhub_bookings');
        
        if (savedTickets && JSON.parse(savedTickets).length > 0) {
            allTickets = JSON.parse(savedTickets);
            console.log('Loaded tickets:', allTickets.length);
        }
        
        if (savedBookings) {
            allBookings = JSON.parse(savedBookings);
            console.log('Loaded bookings:', allBookings.length);
            
            if (!allTickets || allTickets.length === 0) {
                allBookings.forEach(booking => {
                    booking.items.forEach(item => {
                        for (let i = 0; i < item.quantity; i++) {
                            allTickets.push({
                                id: `${item.id}_${i}`,
                                title: item.title,
                                date: item.date,
                                location: item.location,
                                price: item.price,
                                image: item.image,
                                booking_id: booking.id,
                                category: item.category
                            });
                        }
                    });
                });
            }
        }
        
        displayUpcomingTickets();
    } catch (error) {
        console.error('Error loading tickets:', error);
    }
}

function displayUpcomingTickets() {
    const container = document.getElementById('upcomingTicketsList');
    if (!container) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcomingTickets = allTickets
        .filter(ticket => new Date(ticket.date) >= today)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 3);
    
    if (upcomingTickets.length === 0) {
        container.innerHTML = '<div class="empty-state">No upcoming tickets. <a href="/events/">Browse Events</a></div>';
        return;
    }
    
    container.innerHTML = upcomingTickets.map(ticket => `
        <div class="ticket-item" onclick="window.location.href='/tickets/detail/?id=${ticket.id}'">
            <div class="ticket-item-image" style="background-image: url('${ticket.image || '/static/images/placeholder.jpg'}')"></div>
            <div class="ticket-item-info">
                <div class="ticket-item-title">${escapeHtml(ticket.title)}</div>
                <div class="ticket-item-date">${formatDate(ticket.date)}</div>
            </div>
            <div class="ticket-item-price">${formatCurrency(ticket.price)}</div>
        </div>
    `).join('');
}

function loadRecentActivity() {
    const container = document.getElementById('recentActivityList');
    if (!container) return;
    
    const activities = [];
    
    allBookings.forEach(booking => {
        activities.push({
            type: 'booking',
            title: `Booking Confirmed`,
            description: `Booking #${booking.id.substring(0, 8)} - Total: ${formatCurrency(booking.total_amount)}`,
            time: booking.booking_date,
            icon: 'fa-receipt'
        });
    });
    
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));
    const recentActivities = activities.slice(0, 5);
    
    if (recentActivities.length === 0) {
        container.innerHTML = '<div class="empty-state">No recent activity. Start booking events!</div>';
        return;
    }
    
    container.innerHTML = recentActivities.map(activity => `
        <div class="activity-item activity-${activity.type}">
            <div class="activity-icon">
                <i class="fas ${activity.icon}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-title">${escapeHtml(activity.title)}</div>
                <div class="activity-description">${escapeHtml(activity.description)}</div>
                <div class="activity-time">
                    <i class="fas fa-clock"></i>
                    ${formatRelativeTime(activity.time)}
                </div>
            </div>
        </div>
    `).join('');
}

function loadStats() {
    const totalTickets = allTickets.length;
    const totalSpent = allBookings.reduce((sum, booking) => sum + (booking.total_amount || 0), 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingEvents = allTickets.filter(ticket => new Date(ticket.date) >= today).length;
    
    document.getElementById('totalTickets').textContent = totalTickets;
    document.getElementById('totalSpent').textContent = formatCurrency(totalSpent);
    document.getElementById('upcomingEvents').textContent = upcomingEvents;
    document.getElementById('reviewsWritten').textContent = '0';
    
    const pastEvents = allTickets.filter(ticket => new Date(ticket.date) < today).length;
    document.getElementById('eventsAttended').textContent = pastEvents;
}

function refreshActivity() {
    loadRecentActivity();
<<<<<<< HEAD
    showToast('Activity refreshed!', 'success');
=======
    showToast('Activity refreshed', 'success');
}

function setupAutoRefresh() {
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(() => {
        loadStats();
        loadRecentActivity();
    }, 60000);
}

function getActivityIcon(type) {
    const icons = {
        'booking': 'fa-ticket-alt',
        'payment': 'fa-credit-card',
        'refund': 'fa-undo-alt',
        'review': 'fa-star',
        'checkin': 'fa-check-circle',
        'wishlist': 'fa-heart',
        'profile': 'fa-user-edit',
        'default': 'fa-bell'
    };
    return icons[type] || icons.default;
}

function viewTicket(ticketId) {
    window.location.href = `/attendee/tickets/detail/?ticket=${ticketId}`;
}

function viewEvent(eventId) {
    window.location.href = `/events/detail/?id=${eventId}`;
}

function formatNumber(num) {
    return Number(num).toLocaleString('en-KE');
}

function formatCurrency(amount) {
    return `Kes ${Number(amount).toLocaleString('en-KE')}`;
>>>>>>> 8aa022fd1f108f01dddbdeba8e30e4c6f1534b9b
}

function formatDate(dateString) {
    if (!dateString) return 'TBA';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'TBA';
        return date.toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
        return 'TBA';
    }
}

function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDate(dateString);
}

function formatCurrency(amount) {
    try {
        const val = Number(amount);
        if (isNaN(val)) return 'KES 0';
        return `KES ${val.toLocaleString('en-KE')}`;
    } catch (e) {
        return 'KES 0';
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message, type) {
    const existingToast = document.querySelector('.custom-toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed; bottom: 20px; right: 20px; z-index: 10000;
        padding: 12px 20px; border-radius: 12px; color: white;
        background: ${type === 'success' ? '#10b981' : '#3b82f6'};
        animation: slideInRight 0.3s ease; box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    `;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

window.refreshActivity = refreshActivity;
