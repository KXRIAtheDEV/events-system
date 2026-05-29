// frontend/static/js/organizer/reviews.js
let reviewPage = 1, currentReviewId = null;

async function loadReviews() {
    try {
        const eventId = document.getElementById('eventFilter').value;
        let data;
        if (eventId) data = await OrganizerAPI.reviews.getEventReviews(eventId, reviewPage, 20);
        else data = await OrganizerAPI.reviews.getAll(reviewPage, 20);
        const tbody = document.getElementById('reviewsTableBody');
        if (!data.results?.length) { tbody.innerHTML = '<tr><td colspan="6">No reviews</td></tr>'; return; }
        tbody.innerHTML = data.results.map(r => `
            <tr>
                <td>${escapeHtml(r.event_title)}</td>
                <td>${escapeHtml(r.attendee_name)}</td>
                <td><span class="star-display">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span> ${r.rating}</td>
                <td>${escapeHtml(r.comment || '-')}</td>
                <td>${r.response ? escapeHtml(r.response) : '<span class="text-muted">Not responded</span>'}</td>
                <td>${!r.response ? `<button class="btn btn-sm btn-outline-primary respond-btn" data-id="${r.id}" data-review="${escapeHtml(r.comment || '')}">Respond</button>` : '-'}</td>
            </tr>
        `).join('');
        if (typeof renderPagination === 'function') renderPagination(data, reviewPage, (p) => { reviewPage = p; loadReviews(); }, 'reviewsPagination');
        attachRespondEvents();
        updateStats();
    } catch(e) { console.error(e); }
}

async function updateStats() {
    try {
        const stats = await OrganizerAPI.reviews.getStats();
        document.getElementById('avgRatingDisplay').innerText = stats.avg_rating?.toFixed(1) || '0';
        const stars = '★'.repeat(Math.floor(stats.avg_rating || 0)) + '☆'.repeat(5 - Math.floor(stats.avg_rating || 0));
        document.getElementById('starDisplay').innerHTML = `<span class="star-display">${stars}</span>`;
        document.getElementById('totalReviewsDisplay').innerText = stats.total_reviews || 0;
        document.getElementById('responseRateDisplay').innerText = stats.response_rate || 0;
    } catch(e) {}
}

function attachRespondEvents() {
    document.querySelectorAll('.respond-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentReviewId = btn.dataset.id;
            document.getElementById('reviewPreview').innerHTML = `<div class="alert alert-secondary">${btn.dataset.review}</div>`;
            document.getElementById('responseText').value = '';
            new bootstrap.Modal(document.getElementById('respondModal')).show();
        });
    });
}

async function submitResponse() {
    const response = document.getElementById('responseText').value.trim();
    if (!response) { alert('Please enter a response'); return; }
    try {
        await OrganizerAPI.reviews.respond(currentReviewId, response);
        if(window.showToast) window.showToast('Response sent', 'success');
        bootstrap.Modal.getInstance(document.getElementById('respondModal')).hide();
        loadReviews();
        updateStats();
    } catch(e) { if(window.showToast) window.showToast(e.message, 'error'); }
}

async function loadEventsForFilter() {
    try {
        const events = await OrganizerAPI.events.getAll(1, 100);
        const filter = document.getElementById('eventFilter');
        filter.innerHTML = '<option value="">All Events</option>' + events.results.map(e => `<option value="${e.id}">${escapeHtml(e.title)}</option>`).join('');
    } catch(e) { console.error(e); }
}

document.getElementById('eventFilter')?.addEventListener('change', () => { reviewPage = 1; loadReviews(); updateStats(); });
document.getElementById('exportBtn')?.addEventListener('click', () => window.open(ORGANIZER_API_CONFIG.API_BASE + ORGANIZER_API_CONFIG.ENDPOINTS.REVIEWS.export, '_blank'));
document.getElementById('submitResponseBtn')?.addEventListener('click', submitResponse);

document.addEventListener('DOMContentLoaded', () => { loadReviews(); loadEventsForFilter(); updateStats(); });