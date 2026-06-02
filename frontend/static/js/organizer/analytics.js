// frontend/static/js/organizer/analytics.js
let salesChart = null, distributionChart = null;

async function loadEvents() {
    try {
        const events = await OrganizerAPI.events.getAll(1, 100);
        const selector = document.getElementById('eventSelector');
        selector.innerHTML = '<option value="">Select an event</option>' + events.results.map(e => `<option value="${e.id}">${escapeHtml(e.title)}</option>`).join('');
    } catch(e) { console.error(e); }
}

async function loadAnalytics(eventId) {
    if (!eventId) return;
    try {
        const data = await OrganizerAPI.events.getAnalytics(eventId);
        document.getElementById('totalTicketsKpi').innerText = data.total_tickets || 0;
        document.getElementById('ticketsSoldKpi').innerText = data.tickets_sold || 0;
        document.getElementById('attendanceKpi').innerText = data.attendance || 0;
        document.getElementById('revenueKpi').innerText = '$' + (data.revenue || 0).toLocaleString();
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
        data: {
            labels: data.map(d => d.date),
            datasets: [{
                label: 'Tickets Sold',
                data: data.map(d => d.sold),
                borderColor: '#ff6b00',
                backgroundColor: 'rgba(255,107,0,0.18)',
                fill: true,
                tension: 0.3,
                pointRadius: 3,
                pointBackgroundColor: '#ff6b00'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { mode: 'index', intersect: false }
            },
            scales: {
                x: { title: { display: true, text: 'Date' }, grid: { color: 'rgba(0,0,0,0.05)' } },
                y: { beginAtZero: true, title: { display: true, text: 'Tickets Sold' }, grid: { color: 'rgba(0,0,0,0.05)' } }
            }
        }
    });
}

function updateDistributionChart(data) {
    if (distributionChart) distributionChart.destroy();
    const ctx = document.getElementById('distributionChart').getContext('2d');
    distributionChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(data),
            datasets: [{
                data: Object.values(data),
                backgroundColor: ['#ff6b00', '#10b981', '#3b82f6', '#8b5cf6']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadEvents();
    document.getElementById('eventSelector').addEventListener('change', (e) => {
        if (e.target.value) loadAnalytics(e.target.value);
        else document.getElementById('kpiRow').style.display = 'none';
    });
});