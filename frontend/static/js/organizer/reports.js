// frontend/static/js/organizer/reports.js
let revenueTrendChart, topEventsChart;

async function loadReportData() {
    const period = document.getElementById('reportPeriod').value;
    try {
        const salesData = await OrganizerAPI.reports.getSales(period);
        const revenueData = await OrganizerAPI.reports.getRevenue(period);
        const eventsData = await OrganizerAPI.reports.getEvents({ period, limit: 5 });
        document.getElementById('reportTotalRevenue').innerText = 'Kes ' + (revenueData.total || 0).toLocaleString();
        document.getElementById('reportTotalTickets').innerText = salesData.total_tickets || 0;
        document.getElementById('reportTotalAttendees').innerText = salesData.total_attendees || 0;
        document.getElementById('reportAvgOrderValue').innerText = 'Kes ' + (salesData.avg_order_value || 0).toLocaleString();
        updateRevenueChart(revenueData.chart_labels || [], revenueData.chart_values || []);
        updateTopEventsChart(eventsData);
        updateTopEventsTable(eventsData.events || []);
    } catch(e) { console.error(e); }
}

function updateRevenueChart(labels, values) {
    if (revenueTrendChart) revenueTrendChart.destroy();
    const ctx = document.getElementById('revenueTrendChart').getContext('2d');
    revenueTrendChart = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets: [{ label: 'Revenue', data: values, borderColor: '#ff6b00', fill: true, backgroundColor: 'rgba(255,107,0,0.1)' }] },
        options: { responsive: true, maintainAspectRatio: true }
    });
}

function updateTopEventsChart(eventsData) {
    if (topEventsChart) topEventsChart.destroy();
    const events = eventsData.events || [];
    const ctx = document.getElementById('topEventsChart').getContext('2d');
    topEventsChart = new Chart(ctx, {
        type: 'bar',
        data: { labels: events.map(e => e.title), datasets: [{ label: 'Tickets Sold', data: events.map(e => e.tickets_sold), backgroundColor: '#764ba2' }] },
        options: { responsive: true, maintainAspectRatio: true }
    });
}

function updateTopEventsTable(events) {
    const tbody = document.getElementById('topEventsTable');
    if (!events.length) { tbody.innerHTML = '<tr><td colspan="4">No data</td></tr>'; return; }
    tbody.innerHTML = events.map(e => `
        <tr>
            <td>${escapeHtml(e.title)}</td>
            <td>${e.tickets_sold || 0}</td>
            <td>Kes ${(e.revenue || 0).toLocaleString()}</td>
            <td>${e.attendance_rate || 0}%</td>
        </tr>
    `).join('');
}

document.getElementById('reportPeriod')?.addEventListener('change', loadReportData);
document.getElementById('exportReportBtn')?.addEventListener('click', () => {
    const period = document.getElementById('reportPeriod').value;
    window.open(ORGANIZER_API_CONFIG.API_BASE + ORGANIZER_API_CONFIG.ENDPOINTS.REPORTS.export('sales') + `?period=${period}`, '_blank');
});

document.addEventListener('DOMContentLoaded', loadReportData);