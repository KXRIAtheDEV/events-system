// frontend/static/js/organizer/events.js
let currentEventId = null;
let currentPage = 1;
let ticketTypes = [];
let scheduleItems = [];
let analyticsChart = null;

// Load events grid
async function loadEvents(page = 1) {
    try {
        const data = await OrganizerAPI.events.getAll(page, 12);
        const container = document.getElementById('eventsContainer');
        if (!data.results || data.results.length === 0) {
            container.innerHTML = '<div class="text-center text-muted col-12">No events found</div>';
            return;
        }
        container.innerHTML = data.results.map(event => `
            <div class="col-md-4 col-lg-3">
                <div class="event-card" onclick="editEvent(${event.id})">
                    <div class="event-image" style="background-image: url('${event.image_url || '/static/images/placeholder.jpg'}')">
                        <div class="event-status"><span class="badge ${event.status === 'published' ? 'bg-success' : event.status === 'draft' ? 'bg-secondary' : 'bg-danger'}">${event.status}</span></div>
                    </div>
                    <div class="p-3">
                        <h6 class="mb-1">${escapeHtml(event.title)}</h6>
                        <small class="text-muted">${new Date(event.start_date).toLocaleDateString()}</small>
                        <div class="mt-2"><i class="fas fa-ticket-alt"></i> ${event.tickets_sold || 0}/${event.capacity || 0}</div>
                    </div>
                </div>
            </div>
        `).join('');
        if (typeof renderPagination === 'function') renderPagination(data, page, (newPage) => { currentPage = newPage; loadEvents(currentPage); }, 'eventsPagination');
    } catch(e) { console.error(e); if(window.showToast) window.showToast('Failed to load events', 'error'); }
}

// Edit or create event
async function editEvent(eventId = null) {
    currentEventId = eventId;
    resetEventForm();
    if (eventId) {
        document.getElementById('eventModalTitle').innerText = 'Edit Event';
        document.getElementById('saveEventBtn').innerText = 'Update Event';
        try {
            const event = await OrganizerAPI.events.getDetail(eventId);
            document.getElementById('eventId').value = event.id;
            document.getElementById('eventTitle').value = event.title || '';
            document.getElementById('eventCategory').value = event.category || 'Music';
            document.getElementById('eventDescription').value = event.description || '';
            document.getElementById('eventStartDate').value = event.start_date ? event.start_date.slice(0,16) : '';
            document.getElementById('eventEndDate').value = event.end_date ? event.end_date.slice(0,16) : '';
            document.getElementById('eventVenue').value = event.venue || '';
            document.getElementById('eventCapacity').value = event.capacity || '';
            document.getElementById('eventStatus').value = event.status || 'draft';
            await loadTicketTypes(eventId);
            await loadScheduleItems(eventId);
            await loadAnalytics(eventId);
            if (event.image_url) document.getElementById('bannerPreview').innerHTML = `<img src="${event.image_url}" class="image-preview">`;
        } catch(e) { console.error(e); if(window.showToast) window.showToast('Error loading event', 'error'); }
    } else {
        document.getElementById('eventModalTitle').innerText = 'Create New Event';
        document.getElementById('saveEventBtn').innerText = 'Create Event';
        document.getElementById('ticketTypesList').innerHTML = '';
        document.getElementById('scheduleList').innerHTML = '';
    }
    new bootstrap.Modal(document.getElementById('eventModal')).show();
}

async function saveEvent() {
    const data = {
        title: document.getElementById('eventTitle').value,
        category: document.getElementById('eventCategory').value,
        description: document.getElementById('eventDescription').value,
        start_date: document.getElementById('eventStartDate').value,
        end_date: document.getElementById('eventEndDate').value,
        venue: document.getElementById('eventVenue').value,
        capacity: parseInt(document.getElementById('eventCapacity').value) || 0,
        status: document.getElementById('eventStatus').value
    };
    const eventId = document.getElementById('eventId').value;
    try {
        if (eventId) {
            await OrganizerAPI.events.update(eventId, data);
            if(window.showToast) window.showToast('Event updated', 'success');
        } else {
            await OrganizerAPI.events.create(data);
            if(window.showToast) window.showToast('Event created', 'success');
        }
        bootstrap.Modal.getInstance(document.getElementById('eventModal')).hide();
        loadEvents(currentPage);
    } catch(e) { if(window.showToast) window.showToast(e.message, 'error'); }
}

// Ticket types
async function loadTicketTypes(eventId) {
    try {
        const types = await OrganizerAPI.events.getTicketTypes(eventId);
        ticketTypes = types;
        const html = types.map(t => `
            <div class="ticket-type-row d-flex justify-content-between align-items-center">
                <div><strong>${escapeHtml(t.name)}</strong><br><small>$${t.price} | ${t.quantity} available</small></div>
                <div>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="editTicketType(${t.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteTicketType(${t.id})"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('');
        document.getElementById('ticketTypesList').innerHTML = html || '<p class="text-muted">No ticket types</p>';
    } catch(e) { console.error(e); }
}

function showTicketTypeModal(ticketId = null) {
    document.getElementById('ticketTypeId').value = ticketId || '';
    if (ticketId) {
        const ticket = ticketTypes.find(t => t.id == ticketId);
        if (ticket) {
            document.getElementById('ticketTypeName').value = ticket.name;
            document.getElementById('ticketTypePrice').value = ticket.price;
            document.getElementById('ticketTypeQuantity').value = ticket.quantity;
            document.getElementById('ticketTypeDesc').value = ticket.description || '';
        }
    } else {
        document.getElementById('ticketTypeName').value = '';
        document.getElementById('ticketTypePrice').value = '';
        document.getElementById('ticketTypeQuantity').value = '';
        document.getElementById('ticketTypeDesc').value = '';
    }
    new bootstrap.Modal(document.getElementById('ticketTypeModal')).show();
}

async function saveTicketType() {
    const ticketId = document.getElementById('ticketTypeId').value;
    const eventId = document.getElementById('eventId').value;
    const data = {
        name: document.getElementById('ticketTypeName').value,
        price: parseFloat(document.getElementById('ticketTypePrice').value),
        quantity: parseInt(document.getElementById('ticketTypeQuantity').value) || 0,
        description: document.getElementById('ticketTypeDesc').value
    };
    try {
        if (ticketId) {
            await OrganizerAPI.events.updateTicketType(eventId, ticketId, data);
        } else {
            await OrganizerAPI.events.addTicketType(eventId, data);
        }
        if(window.showToast) window.showToast('Ticket type saved', 'success');
        bootstrap.Modal.getInstance(document.getElementById('ticketTypeModal')).hide();
        loadTicketTypes(eventId);
    } catch(e) { if(window.showToast) window.showToast(e.message, 'error'); }
}

async function deleteTicketType(ticketId) {
    if (!confirm('Delete this ticket type?')) return;
    const eventId = document.getElementById('eventId').value;
    try {
        await OrganizerAPI.events.deleteTicketType(eventId, ticketId);
        if(window.showToast) window.showToast('Deleted', 'success');
        loadTicketTypes(eventId);
    } catch(e) { if(window.showToast) window.showToast(e.message, 'error'); }
}

// Schedule items
async function loadScheduleItems(eventId) {
    try {
        const items = await OrganizerAPI.events.getSchedule(eventId);
        scheduleItems = items;
        const html = items.map(s => `
            <div class="schedule-item d-flex justify-content-between align-items-center">
                <div><strong>${escapeHtml(s.title)}</strong><br><small>${new Date(s.start_time).toLocaleString()} - ${new Date(s.end_time).toLocaleString()}</small><br><span class="text-muted">${escapeHtml(s.location)}</span></div>
                <div>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="editScheduleItem(${s.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteScheduleItem(${s.id})"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('');
        document.getElementById('scheduleList').innerHTML = html || '<p class="text-muted">No schedule items</p>';
    } catch(e) { console.error(e); }
}

function showScheduleItemModal(itemId = null) {
    document.getElementById('scheduleItemId').value = itemId || '';
    if (itemId) {
        const item = scheduleItems.find(s => s.id == itemId);
        if (item) {
            document.getElementById('scheduleTitle').value = item.title;
            document.getElementById('scheduleStart').value = item.start_time ? item.start_time.slice(0,16) : '';
            document.getElementById('scheduleEnd').value = item.end_time ? item.end_time.slice(0,16) : '';
            document.getElementById('scheduleLocation').value = item.location || '';
            document.getElementById('scheduleDesc').value = item.description || '';
        }
    } else {
        document.getElementById('scheduleTitle').value = '';
        document.getElementById('scheduleStart').value = '';
        document.getElementById('scheduleEnd').value = '';
        document.getElementById('scheduleLocation').value = '';
        document.getElementById('scheduleDesc').value = '';
    }
    new bootstrap.Modal(document.getElementById('scheduleItemModal')).show();
}

async function saveScheduleItem() {
    const itemId = document.getElementById('scheduleItemId').value;
    const eventId = document.getElementById('eventId').value;
    const data = {
        title: document.getElementById('scheduleTitle').value,
        start_time: document.getElementById('scheduleStart').value,
        end_time: document.getElementById('scheduleEnd').value,
        location: document.getElementById('scheduleLocation').value,
        description: document.getElementById('scheduleDesc').value
    };
    try {
        if (itemId) {
            await OrganizerAPI.events.updateScheduleItem(eventId, itemId, data);
        } else {
            await OrganizerAPI.events.addScheduleItem(eventId, data);
        }
        if(window.showToast) window.showToast('Schedule saved', 'success');
        bootstrap.Modal.getInstance(document.getElementById('scheduleItemModal')).hide();
        loadScheduleItems(eventId);
    } catch(e) { if(window.showToast) window.showToast(e.message, 'error'); }
}

async function deleteScheduleItem(itemId) {
    if (!confirm('Delete this schedule item?')) return;
    const eventId = document.getElementById('eventId').value;
    try {
        await OrganizerAPI.events.deleteScheduleItem(eventId, itemId);
        if(window.showToast) window.showToast('Deleted', 'success');
        loadScheduleItems(eventId);
    } catch(e) { if(window.showToast) window.showToast(e.message, 'error'); }
}

// Media uploads
async function uploadBanner() {
    const file = document.getElementById('bannerImage').files[0];
    if (!file) return;
    const eventId = document.getElementById('eventId').value;
    try {
        const result = await OrganizerAPI.events.uploadImage(eventId, file);
        if(window.showToast) window.showToast('Banner uploaded', 'success');
        document.getElementById('bannerPreview').innerHTML = `<img src="${result.image_url}" class="image-preview">`;
    } catch(e) { if(window.showToast) window.showToast(e.message, 'error'); }
}

async function uploadGallery() {
    const files = document.getElementById('galleryImages').files;
    if (!files.length) return;
    const eventId = document.getElementById('eventId').value;
    try {
        await OrganizerAPI.events.uploadGallery(eventId, Array.from(files));
        if(window.showToast) window.showToast('Gallery uploaded', 'success');
        document.getElementById('galleryPreview').innerHTML = '<p class="text-muted">Images uploaded successfully</p>';
    } catch(e) { if(window.showToast) window.showToast(e.message, 'error'); }
}

// Analytics
async function loadAnalytics(eventId) {
    try {
        const data = await OrganizerAPI.events.getAnalytics(eventId);
        document.getElementById('analyticsTotalTickets').innerText = data.total_tickets || 0;
        document.getElementById('analyticsSold').innerText = data.tickets_sold || 0;
        document.getElementById('analyticsRevenue').innerText = '$' + (data.revenue || 0).toLocaleString();
        document.getElementById('analyticsAttendance').innerText = data.attendance || 0;
        if (analyticsChart) analyticsChart.destroy();
        const ctx = document.getElementById('analyticsChart').getContext('2d');
        analyticsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.sales_data?.map(d => d.date) || [],
                datasets: [{ label: 'Tickets Sold', data: data.sales_data?.map(d => d.sold) || [], borderColor: '#ff6b00' }]
            }
        });
    } catch(e) { console.error(e); }
}

function resetEventForm() {
    document.getElementById('eventForm').reset();
    document.getElementById('eventId').value = '';
    document.getElementById('bannerPreview').innerHTML = '';
    document.getElementById('galleryPreview').innerHTML = '';
    if (analyticsChart) analyticsChart.destroy();
}

document.addEventListener('DOMContentLoaded', () => {
    loadEvents();
    document.getElementById('saveEventBtn')?.addEventListener('click', saveEvent);
    document.getElementById('saveTicketTypeBtn')?.addEventListener('click', saveTicketType);
    document.getElementById('saveScheduleItemBtn')?.addEventListener('click', saveScheduleItem);
});