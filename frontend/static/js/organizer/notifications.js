// frontend/static/js/organizer/notifications.js
async function loadNotifList() {
    try {
        const data = await OrganizerAPI.notifications.getList(1, 50);
        const container = document.getElementById('notifListPanel');
        if (!data.results?.length) { container.innerHTML = '<div class="text-muted text-center">No notifications</div>'; return; }
        container.innerHTML = data.results.map(n => `
            <div class="notification-item p-2 mb-2 rounded ${n.is_read ? '' : 'unread'}" data-id="${n.id}">
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
    } catch(e) { console.error(e); }
}

async function loadEventsForNotif() {
    try {
        const events = await OrganizerAPI.events.getAll(1, 100);
        const select = document.getElementById('notifEvent');
        select.innerHTML = '<option value="">Select Event</option>' + events.results.map(e => `<option value="${e.id}">${escapeHtml(e.title)}</option>`).join('');
    } catch(e) { console.error(e); }
}

async function sendNotification() {
    const eventId = document.getElementById('notifEvent').value;
    const title = document.getElementById('notifTitle').value.trim();
    const message = document.getElementById('notifMessage').value.trim();
    if (!eventId || !title || !message) { alert('Please fill all fields'); return; }
    try {
        await OrganizerAPI.notifications.sendToAttendees(eventId, title, message);
        if(window.showToast) window.showToast('Notification sent', 'success');
        bootstrap.Modal.getInstance(document.getElementById('sendNotificationModal')).hide();
        document.getElementById('notifTitle').value = '';
        document.getElementById('notifMessage').value = '';
    } catch(e) { if(window.showToast) window.showToast(e.message, 'error'); }
}

async function loadPrefs() {
    try {
        const prefs = await OrganizerAPI.notifications.getPreferences();
        document.getElementById('prefEmail').checked = prefs.email || false;
        document.getElementById('prefBrowser').checked = prefs.browser || false;
        document.getElementById('prefReminders').checked = prefs.event_reminders || false;
        document.getElementById('prefPayout').checked = prefs.payout_updates || false;
    } catch(e) {}
}

async function savePrefs(e) {
    e.preventDefault();
    const prefs = {
        email: document.getElementById('prefEmail').checked,
        browser: document.getElementById('prefBrowser').checked,
        event_reminders: document.getElementById('prefReminders').checked,
        payout_updates: document.getElementById('prefPayout').checked
    };
    try {
        await OrganizerAPI.notifications.updatePreferences(prefs);
        if(window.showToast) window.showToast('Preferences saved', 'success');
    } catch(e) { if(window.showToast) window.showToast(e.message, 'error'); }
}

document.getElementById('markAllReadNotif')?.addEventListener('click', async () => {
    try {
        await OrganizerAPI.notifications.markAllAsRead();
        loadNotifList();
        if(window.showToast) window.showToast('All marked as read', 'success');
    } catch(e) {}
});
document.getElementById('sendNotifBtn')?.addEventListener('click', sendNotification);
document.getElementById('prefForm')?.addEventListener('submit', savePrefs);

document.addEventListener('DOMContentLoaded', () => { loadNotifList(); loadEventsForNotif(); loadPrefs(); });