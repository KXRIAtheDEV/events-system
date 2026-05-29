// frontend/static/js/organizer/promotions.js
let promoPage = 1, editingPromoId = null;

async function loadPromotions() {
    try {
        const data = await OrganizerAPI.promotions.getAll(promoPage, 20);
        document.getElementById('totalPromos').innerText = data.count || 0;
        document.getElementById('activePromos').innerText = data.results?.filter(p => p.is_active).length || 0;
        const tbody = document.getElementById('promoList');
        if (!data.results?.length) { tbody.innerHTML = '<tr><td colspan="7">No promotions</td></tr>'; return; }
        tbody.innerHTML = data.results.map(p => `
            <tr>
                <td><code>${escapeHtml(p.code)}</code></td>
                <td>${p.discount_type === 'percentage' ? p.discount_value + '%' : '$' + p.discount_value}</td>
                <td>${p.event_title || 'All Events'}</td>
                <td>${p.valid_until ? new Date(p.valid_until).toLocaleDateString() : 'Never'}</td>
                <td>${p.used_count || 0}/${p.usage_limit || '∞'}</td>
                <td><span class="badge ${p.is_active ? 'bg-success' : 'bg-secondary'}">${p.is_active ? 'Active' : 'Inactive'}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary toggle-promo" data-id="${p.id}" data-active="${p.is_active}">${p.is_active ? 'Deactivate' : 'Activate'}</button>
                    <button class="btn btn-sm btn-outline-danger delete-promo" data-id="${p.id}">Delete</button>
                </td>
            </tr>
        `).join('');
        if (typeof renderPagination === 'function') renderPagination(data, promoPage, (p) => { promoPage = p; loadPromotions(); }, 'promoPagination');
        attachPromoActions();
    } catch(e) { console.error(e); }
}

async function loadEventsForSelect() {
    try {
        const events = await OrganizerAPI.events.getAll(1, 100);
        const select = document.getElementById('promoEventId');
        select.innerHTML = '<option value="">All Events</option>' + events.results.map(e => `<option value="${e.id}">${escapeHtml(e.title)}</option>`).join('');
    } catch(e) { console.error(e); }
}

async function savePromo() {
    const data = {
        code: document.getElementById('promoCode').value.trim().toUpperCase(),
        discount_type: document.getElementById('discountType').value,
        discount_value: parseFloat(document.getElementById('discountValue').value),
        event_id: document.getElementById('promoEventId').value || null,
        valid_until: document.getElementById('validUntil').value || null,
        usage_limit: document.getElementById('usageLimit').value ? parseInt(document.getElementById('usageLimit').value) : null,
        description: document.getElementById('promoDesc').value
    };
    if (!data.code || !data.discount_value) { alert('Please fill required fields'); return; }
    try {
        if (editingPromoId) await OrganizerAPI.promotions.update(editingPromoId, data);
        else await OrganizerAPI.promotions.create(data);
        if(window.showToast) window.showToast(editingPromoId ? 'Updated' : 'Created', 'success');
        bootstrap.Modal.getInstance(document.getElementById('promoModal')).hide();
        resetPromoForm();
        loadPromotions();
    } catch(e) { if(window.showToast) window.showToast(e.message, 'error'); }
}

async function togglePromo(id, currentActive) {
    try {
        if (currentActive) await OrganizerAPI.promotions.deactivate(id);
        else await OrganizerAPI.promotions.activate(id);
        if(window.showToast) window.showToast(`Promotion ${currentActive ? 'deactivated' : 'activated'}`, 'success');
        loadPromotions();
    } catch(e) { if(window.showToast) window.showToast(e.message, 'error'); }
}

async function deletePromo(id) {
    if (!confirm('Delete this promotion?')) return;
    try {
        await OrganizerAPI.promotions.delete(id);
        if(window.showToast) window.showToast('Deleted', 'success');
        loadPromotions();
    } catch(e) { if(window.showToast) window.showToast(e.message, 'error'); }
}

function attachPromoActions() {
    document.querySelectorAll('.toggle-promo').forEach(btn => {
        btn.addEventListener('click', () => togglePromo(btn.dataset.id, btn.dataset.active === 'true'));
    });
    document.querySelectorAll('.delete-promo').forEach(btn => {
        btn.addEventListener('click', () => deletePromo(btn.dataset.id));
    });
}

function resetPromoForm() {
    document.getElementById('promoCode').value = '';
    document.getElementById('discountValue').value = '';
    document.getElementById('validUntil').value = '';
    document.getElementById('usageLimit').value = '';
    document.getElementById('promoDesc').value = '';
    editingPromoId = null;
    document.querySelector('#promoModal .modal-title').innerText = 'Create Promo';
    document.getElementById('savePromoBtn').innerText = 'Create';
}

document.getElementById('savePromoBtn')?.addEventListener('click', savePromo);

document.addEventListener('DOMContentLoaded', () => { loadPromotions(); loadEventsForSelect(); });