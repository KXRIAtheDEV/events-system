// frontend/static/js/organizer/support.js
let supportPage = 1, currentTicket = null;

async function loadTickets() {
    try {
        const data = await OrganizerAPI.support.getTickets(supportPage, 20, 'all');
        const tbody = document.getElementById('ticketList');
        if (!data.results?.length) { tbody.innerHTML = '<tr><td colspan="5">No tickets</td></tr>'; return; }
        tbody.innerHTML = data.results.map(t => `
            <tr>
                <td>#${t.id}</td>
                <td>${escapeHtml(t.subject)}</td>
                <td><span class="badge ${t.status === 'open' ? 'bg-warning' : t.status === 'closed' ? 'bg-secondary' : 'bg-info'}">${t.status}</span></td>
                <td>${new Date(t.updated_at).toLocaleDateString()}</td>
                <td><button class="btn btn-sm btn-outline-primary view-ticket" data-id="${t.id}">View</button></td>
            </tr>
        `).join('');
        if (typeof renderPagination === 'function') renderPagination(data, supportPage, (p) => { supportPage = p; loadTickets(); }, 'supportPagination');
        attachViewTickets();
    } catch(e) { console.error(e); }
}

async function viewTicket(id) {
    try {
        const ticket = await OrganizerAPI.support.getTicketDetail(id);
        currentTicket = id;
        document.getElementById('ticketDetailId').innerText = id;
        let replies = '';
        if (ticket.replies && ticket.replies.length) {
            replies = ticket.replies.map(r => `
                <div class="ticket-reply">
                    <strong>${r.is_staff ? 'Support' : 'You'}:</strong><br>
                    ${escapeHtml(r.message)}<br>
                    <small class="text-muted">${new Date(r.created_at).toLocaleString()}</small>
                </div>
            `).join('');
        }
        document.getElementById('ticketDetailBody').innerHTML = `
            <div><strong>Subject:</strong> ${escapeHtml(ticket.subject)}</div>
            <div><strong>Status:</strong> ${ticket.status}</div>
            <div class="alert alert-secondary mt-2">${escapeHtml(ticket.message)}</div>
            ${replies}
        `;
        new bootstrap.Modal(document.getElementById('ticketDetailModal')).show();
    } catch(e) { alert('Failed to load ticket'); }
}

async function replyToTicket() {
    const message = document.getElementById('replyMessage').value.trim();
    if (!message) { alert('Enter a reply'); return; }
    try {
        await OrganizerAPI.support.replyToTicket(currentTicket, message);
        if(window.showToast) window.showToast('Reply sent', 'success');
        document.getElementById('replyMessage').value = '';
        viewTicket(currentTicket);
        loadTickets();
    } catch(e) { if(window.showToast) window.showToast(e.message, 'error'); }
}

async function createTicket() {
    const subject = document.getElementById('ticketSubject').value.trim();
    const category = document.getElementById('ticketCategory').value;
    const message = document.getElementById('ticketMessage').value.trim();
    if (!subject || !message) { alert('Please fill all fields'); return; }
    try {
        await OrganizerAPI.support.createTicket(subject, category, message);
        if(window.showToast) window.showToast('Ticket created', 'success');
        bootstrap.Modal.getInstance(document.getElementById('newTicketModal')).hide();
        document.getElementById('ticketSubject').value = '';
        document.getElementById('ticketMessage').value = '';
        loadTickets();
    } catch(e) { if(window.showToast) window.showToast(e.message, 'error'); }
}

async function loadFAQ() {
    try {
        const faqs = await OrganizerAPI.support.getFAQ();
        const container = document.getElementById('faqList');
        if (!faqs.length) { container.innerHTML = '<p class="text-muted">No FAQs</p>'; return; }
        container.innerHTML = faqs.map(f => `
            <div class="faq-item">
                <strong>${escapeHtml(f.question)}</strong>
                <p class="small">${escapeHtml(f.answer)}</p>
            </div>
        `).join('');
    } catch(e) { console.error(e); }
}

async function loadGuides() {
    try {
        const guides = await OrganizerAPI.support.getGuides();
        const container = document.getElementById('guidesList');
        if (!guides.length) { container.innerHTML = '<p class="text-muted">No guides</p>'; return; }
        container.innerHTML = guides.map(g => `
            <div class="mb-2"><a href="${g.url}" target="_blank">${escapeHtml(g.title)}</a></div>
        `).join('');
    } catch(e) { console.error(e); }
}

function attachViewTickets() {
    document.querySelectorAll('.view-ticket').forEach(btn => {
        btn.addEventListener('click', () => viewTicket(btn.dataset.id));
    });
}

document.getElementById('createTicketBtn')?.addEventListener('click', createTicket);
document.getElementById('replyTicketBtn')?.addEventListener('click', replyToTicket);

document.addEventListener('DOMContentLoaded', () => {
    loadTickets();
    loadFAQ();
    loadGuides();
});