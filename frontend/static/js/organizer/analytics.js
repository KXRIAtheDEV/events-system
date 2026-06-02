// frontend/static/js/organizer/analytics.js
let salesChart = null, distributionChart = null;

async function loadEvents() {
    try {
        const events = await OrganizerAPI.events.getAll(1, 100);
        const selector = document.getElementById('eventSelector');
        const results = events.results || events || [];
        selector.innerHTML = '<option value="">Select an event</option>' + results.map(e => `<option value="${e.id}">${escapeHtml(e.title || e.name)}</option>`).join('');
    } catch(e) { console.error(e); }
}

async function loadAnalytics(eventId) {
    if (!eventId) return;
    try {
        const data = await OrganizerAPI.events.getAnalytics(eventId);
        document.getElementById('totalTicketsKpi').innerText = data.total_tickets || 0;
        document.getElementById('ticketsSoldKpi').innerText = data.tickets_sold || 0;
        document.getElementById('attendanceKpi').innerText = data.attendance || 0;
        document.getElementById('revenueKpi').innerText = 'Kes ' + (data.revenue || 0).toLocaleString();
        const rate = data.total_tickets ? ((data.attendance || 0) / data.total_tickets * 100).toFixed(1) : 0;
        document.getElementById('attendanceProgress').style.width = rate + '%';
        document.getElementById('attendanceProgress').innerText = rate + '%';
        document.getElementById('kpiRow').style.display = 'flex';
        updateSalesChart(data.sales_data || []);
        updateDistributionChart(data.ticket_distribution || {});
    } catch(e) { console.error(e); }
}

function updateSalesChart(data) {
    if (salesChart) salesChart.destroy();
    const ctx = document.getElementById('salesChart').getContext('2d');
    salesChart = new Chart(ctx, {
        type: 'line',
        data: { labels: data.map(d => d.date), datasets: [{ label: 'Tickets Sold', data: data.map(d => d.sold), borderColor: '#ff6b00', fill: false }] },
        options: { responsive: true, maintainAspectRatio: true }
    });
}

function updateDistributionChart(data) {
    if (distributionChart) distributionChart.destroy();
    const ctx = document.getElementById('distributionChart').getContext('2d');
    distributionChart = new Chart(ctx, {
        type: 'pie',
        data: { labels: Object.keys(data), datasets: [{ data: Object.values(data), backgroundColor: ['#ff6b00', '#10b981', '#3b82f6', '#8b5cf6'] }] }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadEvents();
    document.getElementById('eventSelector').addEventListener('change', (e) => {
        if (e.target.value) loadAnalytics(e.target.value);
        else document.getElementById('kpiRow').style.display = 'none';
    });
});