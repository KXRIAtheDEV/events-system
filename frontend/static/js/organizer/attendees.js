// frontend/static/js/organizer/attendees.js
let attendeePage = 1;

async function loadAttendeeStats() {
    try {
        const stats = await OrganizerAPI.attendees.getStats();
        document.getElementById('totalAttendeesStat').innerText = stats.total_attendees || 0;
        document.getElementById('checkedInAttendeesStat').innerText = stats.checked_in || 0;
        const rate = stats.total_attendees ? ((stats.checked_in / stats.total_attendees) * 100).toFixed(1) : 0;
        document.getElementById('checkinRateAttendeeStat').innerText = rate;
        document.getElementById('eventsCountStat').innerText = stats.events_count || 0;
    } catch(e) { console.error(e); }
}

async function loadAttendees() {
    try {
        const filters = { page: attendeePage, limit: 20 };
        const eventId = document.getElementById('eventFilter').value;
        if (eventId) filters.event_id = eventId;
        const search = document.getElementById('searchInput').value.trim();
        if (search) filters.q = search;
        const data = await OrganizerAPI.attendees.getAll(attendeePage, 20, filters);
        const tbody = document.getElementById('attendeesTableBody');
        if (!data.results?.length) { tbody.innerHTML = '<tr><td colspan="6">No attendees found</td></tr>'; return; }
        tbody.innerHTML = data.results.map(a => `
            <tr>
                <td><input type="checkbox" class="attendee-checkbox" value="${a.id}"></td>
                <td>${escapeHtml(a.name)}</td>
                <td>${escapeHtml(a.email)}</td>
                <td>${escapeHtml(a.event_title)}</td>
                <td><span class="badge ${a.checked_in ? 'bg-success' : 'bg-secondary'}">${a.checked_in ? 'Checked In' : 'Registered'}</span></td>
                <td><button class="btn btn-sm btn-outline-primary msg-one" data-id="${a.id}" data-name="${escapeHtml(a.name)}">Message</button></td>
            </tr>
        `).join('');
        if (typeof renderPagination === 'function') renderPagination(data, attendeePage, (p) => { attendeePage = p; loadAttendees(); }, 'attendeesPagination');
        attachMessageButtons();
        document.getElementById('selectAll').onchange = (e) => {
            document.querySelectorAll('.attendee-checkbox').forEach(cb => cb.checked = e.target.checked);
        };
    } catch(e) { console.error(e); }
}

async function sendBulkMessage() {
    const subject = document.getElementById('bulkSubject').value.trim();
    const message = document.getElementById('bulkMessageText').value.trim();
    if (!subject || !message) { alert('Please enter subject and message'); return; }
    const eventId = document.getElementById('eventFilter').value;
    try {
        await OrganizerAPI.attendees.bulkMessage(eventId || null, message, { subject });
        if(window.showToast) window.showToast('Messages sent', 'success');
        bootstrap.Modal.getInstance(document.getElementById('bulkMessageModal')).hide();
    } catch(e) { alert('Failed: '+e.message); }
}

function attachMessageButtons() {
    document.querySelectorAll('.msg-one').forEach(btn => {
        btn.addEventListener('click', async () => {
            const msg = prompt(`Message to ${btn.dataset.name}:`);
            if (msg) {
                try {
                    await OrganizerAPI.attendees.sendMessage(btn.dataset.id, msg);
                    if(window.showToast) window.showToast('Sent', 'success');
                } catch(e) { alert(e.message); }
            }
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

document.getElementById('eventFilter')?.addEventListener('change', () => { attendeePage = 1; loadAttendees(); loadAttendeeStats(); });
document.getElementById('searchInput')?.addEventListener('input', () => { attendeePage = 1; loadAttendees(); });
document.getElementById('exportBtn')?.addEventListener('click', () => {
    const eventId = document.getElementById('eventFilter').value;
    window.open(`${ORGANIZER_API_CONFIG.API_BASE}${ORGANIZER_API_CONFIG.ENDPOINTS.ATTENDEES.export}${eventId ? `?event_id=${eventId}` : ''}`, '_blank');
});
document.getElementById('bulkMessageBtn')?.addEventListener('click', () => new bootstrap.Modal(document.getElementById('bulkMessageModal')).show());
document.getElementById('sendBulkBtn')?.addEventListener('click', sendBulkMessage);

document.addEventListener('DOMContentLoaded', () => { loadAttendeeStats(); loadAttendees(); loadEventsForFilter(); });