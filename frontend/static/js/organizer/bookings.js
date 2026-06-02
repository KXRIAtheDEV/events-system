// frontend/static/js/organizer/bookings.js
let bookingPage = 1;

async function loadBookings() {
    try {
        const filters = { page: bookingPage, limit: 20 };
        const eventId = document.getElementById('eventFilter').value;
        let data;
        if (eventId) data = await OrganizerAPI.bookings.getEventBookings(eventId, bookingPage, 20);
        else data = await OrganizerAPI.bookings.getAll(bookingPage, 20, filters);
        const tbody = document.getElementById('bookingsTableBody');
        if (!data.results?.length) { tbody.innerHTML = '<tr><td colspan="6">No bookings found</td></tr>'; return; }
        tbody.innerHTML = data.results.map(b => `
            <tr>
                <td>#${b.id}</td>
                <td>${escapeHtml(b.event_title)}</td>
                <td>${escapeHtml(b.attendee_name)}</td>
                <td>$${b.amount}</td>
                <td><span class="badge ${b.status === 'confirmed' ? 'bg-success' : 'bg-warning'}">${b.status}</span></td>
                <td><button class="btn btn-sm btn-outline-primary remind-btn" data-id="${b.id}">Send Reminder</button></td>
            </tr>
        `).join('');
        if (typeof renderPagination === 'function') renderPagination(data, bookingPage, (p) => { bookingPage = p; loadBookings(); }, 'bookingsPagination');
        attachRemindButtons();
    } catch(e) { console.error(e); }
}

function attachRemindButtons() {
    document.querySelectorAll('.remind-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            try {
                await OrganizerAPI.bookings.sendReminder(btn.dataset.id);
                if(window.showToast) window.showToast('Reminder sent', 'success');
            } catch(e) { if(window.showToast) window.showToast(e.message, 'error'); }
        });
    });
}

async function loadEventsForFilter() {
    try {
        const events = await OrganizerAPI.events.getAll(1, 100);
        const filter = document.getElementById('eventFilter');
        filter.innerHTML = '<option value="">All Events</option>' + events.results.map(e => `<option value="${e.id}">${escapeHtml(e.title)}</option>`).join('');
    } catch(e) { console.error(e); }
}

document.getElementById('eventFilter')?.addEventListener('change', () => { bookingPage = 1; loadBookings(); });
document.getElementById('exportBtn')?.addEventListener('click', () => {
    const eventId = document.getElementById('eventFilter').value;
    window.open(`${ORGANIZER_API_CONFIG.API_BASE}${ORGANIZER_API_CONFIG.ENDPOINTS.BOOKINGS.export}${eventId ? `?event_id=${eventId}` : ''}`, '_blank');
});

document.addEventListener('DOMContentLoaded', () => { loadBookings(); loadEventsForFilter(); });