// ============================================
// TICKETS MODULE - Loads from eventhub_tickets
// ============================================

let allTickets = [];
let currentTab = 'upcoming';
let currentSearch = '';
let currentBookingId = null;

document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    currentBookingId = urlParams.get('booking_id');
    
    loadTickets();
    setupEventListeners();
    
    const path = window.location.pathname;
    if (path.includes('/detail/')) {
        loadTicketDetail();
    } else if (path.includes('/qr/')) {
        loadQRCode();
    }
});

function setupEventListeners() {
    const searchInput = document.getElementById('searchTickets');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            currentSearch = e.target.value.toLowerCase();
            renderTickets();
        });
    }
}

function mapApiTicket(t) {
    return {
        id: t.ticket_number,
        booking_id: t.ticket_number,
        title: t.event?.title || 'Event',
        category: 'Event',
        date: t.event?.start_date,
        location: t.event?.venue_name || t.event?.location || '',
        price: t.price,
        image: t.event?.banner_image,
        ticket_code: t.ticket_number,
        ticket_type: t.ticket_type || 'Regular',
        status: t.status,
        purchased_date: t.purchase_date,
        quantity: t.quantity,
    };
}

function tierBadgeClass(tier) {
    if (tier === 'VIP') return 'ticket-tier-vip';
    if (tier === 'VVIP') return 'ticket-tier-vvip';
    return 'ticket-tier-regular';
}

async function loadTickets() {
    const token = localStorage.getItem('attendee_access_token');
    if (!token) {
        allTickets = [];
        renderTickets();
        return;
    }
    try {
        const headers = { Authorization: `Bearer ${token}` };
        const [upRes, pastRes] = await Promise.all([
            fetch('/api/attendee/tickets/upcoming/', { headers, credentials: 'same-origin' }),
            fetch('/api/attendee/tickets/past/', { headers, credentials: 'same-origin' }),
        ]);
        const up = await upRes.json();
        const past = await pastRes.json();
        allTickets = [...(up.results || []), ...(past.results || [])].map(mapApiTicket);
        if (currentBookingId) {
            allTickets = allTickets.filter(t => t.booking_id === currentBookingId);
        }
        renderTickets();
        updateHeaderInfo();
    } catch (error) {
        console.error('Error loading tickets:', error);
        const container = document.getElementById('ticketsList');
        if (container) {
            container.innerHTML = '<div class="error-state">Failed to load tickets. Please log in and try again.</div>';
        }
    }
}

function updateHeaderInfo() {
    const headerSubtitle = document.querySelector('.page-header .text-muted');
    if (currentBookingId && headerSubtitle) {
        headerSubtitle.innerHTML = `Showing tickets for booking: ${currentBookingId.substring(0, 8)}...`;
    }
}

function getFilteredTickets() {
    let filtered = [...allTickets];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (currentTab === 'upcoming') {
        filtered = filtered.filter(ticket => new Date(ticket.date) >= today);
    } else if (currentTab === 'past') {
        filtered = filtered.filter(ticket => new Date(ticket.date) < today);
    }
    
    if (currentSearch) {
        filtered = filtered.filter(ticket => 
            ticket.title.toLowerCase().includes(currentSearch) ||
            ticket.ticket_code.toLowerCase().includes(currentSearch)
        );
    }
    
    if (currentTab === 'upcoming') {
        filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else {
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    return filtered;
}

function renderTickets() {
    const container = document.getElementById('ticketsList');
    if (!container) return;
    
    const filtered = getFilteredTickets();
    
    if (filtered.length === 0) {
        let emptyMessage = currentTab === 'upcoming' ? 'You have no upcoming events.' : 'You have no past events.';
        if (currentBookingId) {
            emptyMessage = 'No tickets found for this booking.';
        }
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-ticket-alt"></i>
                <h3>No tickets found</h3>
                <p>${emptyMessage}</p>
                <a href="/events/" class="browse-btn">Browse Events</a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filtered.map(ticket => `
        <div class="ticket-card">
            <div class="ticket-header">
                <div class="ticket-image" style="background-image: url('${ticket.image || '/static/images/placeholder.jpg'}')"></div>
                <div class="ticket-info">
                    <div class="ticket-title">${escapeHtml(ticket.title)}</div>
                    <span class="checkout-tier-badge ${tierBadgeClass(ticket.ticket_type)}">${escapeHtml(ticket.ticket_type || 'Regular')}</span>
                    <div class="ticket-meta">
                        <span><i class="fas fa-calendar"></i> ${formatDate(ticket.date)}</span>
                        <span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(ticket.location.split(',')[0])}</span>
                    </div>
                </div>
                <div class="ticket-status status-active">Active</div>
            </div>
            <div class="ticket-body">
                <div class="ticket-code">
                    <span class="code-label">Ticket Code:</span>
                    <span class="code-value">${ticket.ticket_code}</span>
                </div>
                <div class="ticket-price">
                    <span>Price:</span>
                    <strong>${formatCurrency(ticket.price)}</strong>
                </div>
            </div>
            <div class="ticket-footer">
                <button class="btn-qr" onclick="viewQRCode('${ticket.ticket_code}')">
                    <i class="fas fa-qrcode"></i> View QR
                </button>
                <button class="btn-detail" onclick="viewTicketDetail('${ticket.id}')">
                    <i class="fas fa-info-circle"></i> Details
                </button>
            </div>
        </div>
    `).join('');
}

function viewTicketDetail(ticketId) {
    window.location.href = `/tickets/detail/?id=${encodeURIComponent(ticketId)}`;
}

function viewQRCode(ticketCode) {
    window.location.href = `/tickets/qr/?code=${encodeURIComponent(ticketCode)}`;
}

function loadTicketDetail() {
    const container = document.getElementById('ticketDetailContent');
    if (!container) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const ticketId = urlParams.get('id');
    
    if (!ticketId) {
        container.innerHTML = '<div class="error-state">Ticket ID not provided</div>';
        return;
    }
    
    let ticket = allTickets.find(t => t.id === ticketId);
    
    if (!ticket) {
        // Try to find in bookings if not in tickets
        const savedBookings = localStorage.getItem('eventhub_bookings');
        if (savedBookings) {
            const bookings = JSON.parse(savedBookings);
            for (const booking of bookings) {
                for (const item of booking.items) {
                    if (item.ticket_codes) {
                        for (let idx = 0; idx < item.ticket_codes.length; idx++) {
                            const tempId = `${booking.id}_${item.id}_${idx}`;
                            if (tempId === ticketId) {
                                ticket = {
                                    id: tempId,
                                    booking_id: booking.id,
                                    title: item.title,
                                    category: item.category,
                                    date: item.date,
                                    location: item.location,
                                    price: item.price,
                                    image: item.image,
                                    ticket_code: item.ticket_codes[idx],
                                    status: 'active',
                                    purchased_date: booking.booking_date,
                                    receipt_number: booking.receipt_number,
                                    quantity: 1
                                };
                                break;
                            }
                        }
                    } else {
                        for (let i = 0; i < item.quantity; i++) {
                            const tempId = `${booking.id}_${item.id}_${i}`;
                            if (tempId === ticketId) {
                                ticket = {
                                    id: tempId,
                                    booking_id: booking.id,
                                    title: item.title,
                                    category: item.category,
                                    date: item.date,
                                    location: item.location,
                                    price: item.price,
                                    image: item.image,
                                    ticket_code: item.ticket_code || `TKT${Math.floor(Math.random() * 1000000)}`,
                                    status: 'active',
                                    purchased_date: booking.booking_date,
                                    receipt_number: booking.receipt_number,
                                    quantity: 1
                                };
                                break;
                            }
                        }
                    }
                    if (ticket) break;
                }
                if (ticket) break;
            }
        }
    }
    
    if (!ticket) {
        container.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Ticket not found</p>
                <button onclick="window.location.href='/tickets/'" class="btn-back">Back to Tickets</button>
            </div>
        `;
        return;
    }
    
    renderTicketDetail(ticket);
}

function renderTicketDetail(ticket) {
    const container = document.getElementById('ticketDetailContent');
    if (!container) return;
    
    container.innerHTML = `
        <div class="ticket-detail-card">
            <div class="card-header">
                <h3><i class="fas fa-ticket-alt"></i> ${escapeHtml(ticket.title)}</h3>
            </div>
            <div class="card-body">
                <div class="detail-row">
                    <div class="detail-label">Event Date:</div>
                    <div class="detail-value">${formatDate(ticket.date)}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Venue:</div>
                    <div class="detail-value">${escapeHtml(ticket.location)}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Ticket Price:</div>
                    <div class="detail-value">${formatCurrency(ticket.price)}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Ticket Code:</div>
                    <div class="detail-value"><strong>${ticket.ticket_code}</strong></div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Purchased On:</div>
                    <div class="detail-value">${formatDate(ticket.purchased_date)}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Booking ID:</div>
                    <div class="detail-value">${ticket.booking_id || 'N/A'}</div>
                </div>
            </div>
            <div class="card-footer">
                <button class="btn-qr" onclick="viewQRCode('${ticket.ticket_code}')">
                    <i class="fas fa-qrcode"></i> View QR Code
                </button>
                <button class="btn-back" onclick="window.location.href='/tickets/'">
                    <i class="fas fa-arrow-left"></i> Back to Tickets
                </button>
            </div>
        </div>
    `;
}

function loadQRCode() {
    const container = document.getElementById('qrCodeDisplay');
    const ticketInfoDiv = document.getElementById('ticketInfo');
    
    if (!container) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const ticketCode = urlParams.get('code');
    
    if (!ticketCode) {
        container.innerHTML = '<div class="error-state">No ticket code provided</div>';
        return;
    }
    
    let ticket = allTickets.find(t => t.ticket_code === ticketCode);
    
    if (!ticket) {
        const savedBookings = localStorage.getItem('eventhub_bookings');
        if (savedBookings) {
            const bookings = JSON.parse(savedBookings);
            for (const booking of bookings) {
                for (const item of booking.items) {
                    if (item.ticket_codes && item.ticket_codes.includes(ticketCode)) {
                        ticket = {
                            id: `${booking.id}_${item.id}_${item.ticket_codes.indexOf(ticketCode)}`,
                            booking_id: booking.id,
                            title: item.title,
                            category: item.category,
                            date: item.date,
                            location: item.location,
                            price: item.price,
                            image: item.image,
                            ticket_code: ticketCode,
                            status: 'active',
                            purchased_date: booking.booking_date,
                            receipt_number: booking.receipt_number
                        };
                        break;
                    } else if (item.ticket_code === ticketCode) {
                        ticket = {
                            id: `${booking.id}_${item.id}_0`,
                            booking_id: booking.id,
                            title: item.title,
                            category: item.category,
                            date: item.date,
                            location: item.location,
                            price: item.price,
                            image: item.image,
                            ticket_code: ticketCode,
                            status: 'active',
                            purchased_date: booking.booking_date,
                            receipt_number: booking.receipt_number
                        };
                        break;
                    }
                }
                if (ticket) break;
            }
        }
    }
    
    if (!ticket) {
        container.innerHTML = '<div class="error-state">Ticket not found</div>';
        if (ticketInfoDiv) ticketInfoDiv.innerHTML = '';
        return;
    }
    
    const qrData = `${ticket.ticket_code}|${ticket.title}|${ticket.date}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
    
    container.innerHTML = `
        <div class="qr-code">
            <img src="${qrUrl}" alt="QR Code">
            <p class="qr-note">Scan this code at the venue entrance</p>
        </div>
    `;
    
    if (ticketInfoDiv) {
        ticketInfoDiv.innerHTML = `
            <div class="info-row">
                <span class="info-label">Event:</span>
                <span class="info-value">${escapeHtml(ticket.title)}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Date:</span>
                <span class="info-value">${formatDate(ticket.date)}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Venue:</span>
                <span class="info-value">${escapeHtml(ticket.location)}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Ticket Code:</span>
                <span class="info-value"><strong>${ticket.ticket_code}</strong></span>
            </div>
        `;
    }
    
    const exportBtn = document.getElementById('downloadTicketBtn');
    if (exportBtn) {
        exportBtn.onclick = () => exportTicketAsPDF(ticket);
    }
}

function exportTicketAsPDF(ticket) {
    const qrData = `${ticket.ticket_code}|${ticket.title}|${ticket.date}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Ticket - ${ticket.title}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: 'Segoe UI', Arial, sans-serif; 
                    background: #f5f5f5;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    padding: 20px;
                }
                .ticket-card {
                    max-width: 450px;
                    width: 100%;
                    background: white;
                    border-radius: 20px;
                    overflow: hidden;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.15);
                }
                .ticket-header {
                    background: linear-gradient(135deg, #f59e0b, #ec6408);
                    color: white;
                    padding: 20px;
                    text-align: center;
                }
                .ticket-header h1 {
                    font-size: 22px;
                    margin-bottom: 5px;
                }
                .ticket-header p {
                    font-size: 12px;
                    opacity: 0.9;
                }
                .ticket-body {
                    padding: 20px;
                }
                .info-row {
                    display: flex;
                    margin-bottom: 12px;
                    padding-bottom: 8px;
                    border-bottom: 1px solid #e2e8f0;
                }
                .info-label {
                    width: 100px;
                    font-weight: 600;
                    color: #475569;
                    font-size: 13px;
                }
                .info-value {
                    flex: 1;
                    color: #1e293b;
                    font-size: 13px;
                }
                .qr-section {
                    text-align: center;
                    margin: 20px 0;
                    padding: 15px;
                    background: #f8fafc;
                    border-radius: 12px;
                }
                .qr-section img {
                    width: 150px;
                    height: 150px;
                }
                .qr-section p {
                    font-size: 11px;
                    color: #64748b;
                    margin-top: 8px;
                }
                .ticket-footer {
                    background: #f8fafc;
                    padding: 12px;
                    text-align: center;
                    font-size: 10px;
                    color: #94a3b8;
                    border-top: 1px solid #e2e8f0;
                }
                @media print {
                    body { background: white; padding: 0; }
                    .ticket-card { box-shadow: none; }
                }
            </style>
        </head>
        <body>
            <div class="ticket-card">
                <div class="ticket-header">
                    <h1>${escapeHtml(ticket.title)}</h1>
                    <p>Event Ticket</p>
                </div>
                <div class="ticket-body">
                    <div class="info-row">
                        <div class="info-label">Event Date:</div>
                        <div class="info-value">${formatDate(ticket.date)}</div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Venue:</div>
                        <div class="info-value">${escapeHtml(ticket.location)}</div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Ticket Price:</div>
                        <div class="info-value">${formatCurrency(ticket.price)}</div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Ticket Code:</div>
                        <div class="info-value"><strong>${ticket.ticket_code}</strong></div>
                    </div>
                    <div class="qr-section">
                        <img src="${qrUrl}" alt="QR Code">
                        <p>Scan this QR code at the venue entrance</p>
                    </div>
                </div>
                <div class="ticket-footer">
                    <p>Present this ticket at the venue entrance</p>
                    <p>Booking ID: ${ticket.booking_id}</p>
                </div>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

function switchTab(tab) {
    currentTab = tab;
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-tab') === tab) {
            btn.classList.add('active');
        }
    });
    
    renderTickets();
}

function formatDate(dateString) {
    if (!dateString) return 'TBA';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'TBA';
        return date.toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
        return 'TBA';
    }
}

function formatCurrency(amount) {
    try {
        const val = Number(amount);
        if (isNaN(val)) return 'KES 0';
        return `KES ${val.toLocaleString('en-KE')}`;
    } catch (e) {
        return 'KES 0';
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions globally available
window.switchTab = switchTab;
window.viewTicketDetail = viewTicketDetail;
window.viewQRCode = viewQRCode;
window.loadTicketDetail = loadTicketDetail;
window.loadQRCode = loadQRCode;
