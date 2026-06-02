// frontend/static/js/organizer/payouts.js
let payoutPage = 1;

async function loadPayoutSummary() {
    try {
        const summary = await OrganizerAPI.payouts.getSummary();
        document.getElementById('totalEarned').innerText = 'KSh ' + (summary.total_earned || 0).toLocaleString();
        document.getElementById('availableBalance').innerText = 'KSh ' + (summary.available_balance || 0).toLocaleString();
        document.getElementById('pendingPayouts').innerText = 'KSh ' + (summary.pending_payouts || 0).toLocaleString();
        document.getElementById('nextPayout').innerText = 'KSh ' + (summary.next_payout || 0).toLocaleString();
    } catch(e) { console.error(e); }
}

async function loadPayoutHistory() {
    try {
        const data = await OrganizerAPI.payouts.getHistory(payoutPage, 20);
        const tbody = document.getElementById('historyList');
        if (!data.results?.length) { tbody.innerHTML = '<tr><td colspan="3">No history</td></tr>'; return; }
        tbody.innerHTML = data.results.map(p => `
            <tr>
                <td>${new Date(p.date).toLocaleDateString()}</td>
                <td>KSh ${p.amount}</td>
                <td><span class="badge ${p.status === 'completed' ? 'bg-success' : 'bg-warning'}">${p.status}</span></td>
            </tr>
        `).join('');
        if (typeof renderPagination === 'function') renderPagination(data, payoutPage, (p) => { payoutPage = p; loadPayoutHistory(); }, 'payoutPagination');
    } catch(e) { console.error(e); }
}

async function loadUpcomingPayout() {
    try {
        const upcoming = await OrganizerAPI.payouts.getUpcoming();
        document.getElementById('upcomingInfo').innerHTML = upcoming ? `Next payout: KSh ${upcoming.amount} on ${new Date(upcoming.date).toLocaleDateString()}` : 'No upcoming payouts';
    } catch(e) {}
}

async function loadBankSettings() {
    try {
        const settings = await OrganizerAPI.payouts.getSettings();
        document.getElementById('bankName').value = settings.bank_name || '';
        document.getElementById('accountNumber').value = settings.account_number || '';
        document.getElementById('accountHolder').value = settings.account_holder || '';
        document.getElementById('bankDetails').innerHTML = settings.bank_name ? `<p>Bank: ${settings.bank_name}<br>Account: ****${String(settings.account_number).slice(-4)}</p>` : '<p class="text-muted">No bank details</p>';
    } catch(e) {}
}

async function requestPayout() {
    const amount = parseFloat(document.getElementById('requestAmount').value);
    if (isNaN(amount) || amount < 10) { alert('Minimum amount KSh 10'); return; }
    try {
        await OrganizerAPI.payouts.requestPayout(amount);
        if(window.showToast) window.showToast('Request sent', 'success');
        bootstrap.Modal.getInstance(document.getElementById('requestPayoutModal')).hide();
        loadPayoutSummary();
    } catch(e) { alert(e.message); }
}

async function saveBankDetails() {
    const data = {
        bank_name: document.getElementById('bankName').value,
        account_number: document.getElementById('accountNumber').value,
        account_holder: document.getElementById('accountHolder').value
    };
    try {
        await OrganizerAPI.payouts.updateSettings(data);
        if(window.showToast) window.showToast('Bank details saved', 'success');
        bootstrap.Modal.getInstance(document.getElementById('bankModal')).hide();
        loadBankSettings();
    } catch(e) { alert(e.message); }
}

document.getElementById('submitRequest')?.addEventListener('click', requestPayout);
document.getElementById('saveBankBtn')?.addEventListener('click', saveBankDetails);

document.addEventListener('DOMContentLoaded', () => { loadPayoutSummary(); loadPayoutHistory(); loadUpcomingPayout(); loadBankSettings(); });