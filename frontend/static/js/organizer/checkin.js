// frontend/static/js/organizer/checkin.js
let realtimeChart, refreshInterval;

async function loadDevices() {
    try {
        const devices = await OrganizerAPI.checkin.getDevices();
        const container = document.getElementById('devicesList');
        if (!devices.length) { container.innerHTML = '<p class="text-muted">No devices registered</p>'; return; }
        container.innerHTML = devices.map(d => `
            <div class="device-item d-flex justify-content-between align-items-center">
                <div><strong>${escapeHtml(d.name)}</strong><br><small>Last active: ${d.last_active ? new Date(d.last_active).toLocaleString() : 'Never'}</small></div>
                <button class="btn btn-sm btn-outline-danger revoke-device" data-id="${d.id}">Revoke</button>
            </div>
        `).join('');
        document.querySelectorAll('.revoke-device').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm('Revoke this device?')) {
                    await OrganizerAPI.checkin.revokeDevice(btn.dataset.id);
                    loadDevices();
                }
            });
        });
    } catch(e) { console.error(e); }
}

async function loadActiveSession() {
    try {
        const session = await OrganizerAPI.checkin.getActiveSession();
        const container = document.getElementById('activeSession');
        if (session) {
            container.innerHTML = `<div class="alert alert-success">Session active for ${session.event_title}<br>Started: ${new Date(session.started_at).toLocaleString()}</div>`;
            document.getElementById('createSessionBtn').style.display = 'none';
            startRealtime(session.event_id);
        } else {
            container.innerHTML = '<p class="text-muted">No active session</p>';
            document.getElementById('createSessionBtn').style.display = 'inline-block';
            if (refreshInterval) clearInterval(refreshInterval);
        }
    } catch(e) { console.error(e); }
}

async function createSession() {
    const events = await OrganizerAPI.events.getAll(1, 100);
    const id = prompt('Enter event ID:\n' + events.results.map(e => `${e.id}: ${e.title}`).join('\n'));
    if (id) {
        try {
            await OrganizerAPI.checkin.createSession(id);
            if(window.showToast) window.showToast('Session created', 'success');
            loadActiveSession();
        } catch(e) { if(window.showToast) window.showToast(e.message, 'error'); }
    }
}

async function loadRealtimeStats(eventId) {
    if (!eventId) return;
    try {
        const stats = await OrganizerAPI.checkin.getRealtime(eventId);
        if (realtimeChart) realtimeChart.destroy();
        const ctx = document.getElementById('realtimeChart').getContext('2d');
        realtimeChart = new Chart(ctx, {
            type: 'doughnut',
            data: { labels: ['Checked In', 'Remaining'], datasets: [{ data: [stats.checked_in || 0, stats.remaining || 0], backgroundColor: ['#10b981', '#e5e7eb'] }] },
            options: { responsive: true }
        });
        const recentList = document.getElementById('recentCheckins');
        if (stats.recent_checkins?.length) {
            recentList.innerHTML = stats.recent_checkins.map(c => `<li class="list-group-item">${escapeHtml(c.attendee_name)} - ${new Date(c.checked_in_at).toLocaleTimeString()}</li>`).join('');
        } else {
            recentList.innerHTML = '<li class="list-group-item text-muted">No recent check-ins</li>';
        }
    } catch(e) { console.error(e); }
}

function startRealtime(eventId) {
    if (refreshInterval) clearInterval(refreshInterval);
    loadRealtimeStats(eventId);
    refreshInterval = setInterval(() => loadRealtimeStats(eventId), 5000);
}

async function registerDevice() {
    const name = document.getElementById('deviceName').value.trim();
    if (!name) { alert('Enter device name'); return; }
    try {
        await OrganizerAPI.checkin.registerDevice(name);
        if(window.showToast) window.showToast('Device registered', 'success');
        bootstrap.Modal.getInstance(document.getElementById('registerDeviceModal')).hide();
        loadDevices();
    } catch(e) { if(window.showToast) window.showToast(e.message, 'error'); }
}

document.getElementById('createSessionBtn')?.addEventListener('click', createSession);
document.getElementById('registerDeviceBtn')?.addEventListener('click', registerDevice);

document.addEventListener('DOMContentLoaded', () => { loadDevices(); loadActiveSession(); });