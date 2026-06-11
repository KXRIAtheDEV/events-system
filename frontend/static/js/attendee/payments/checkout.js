/**
 * Manual M-Pesa checkout flow with screenshot verification (SSE streaming).
 */
(function () {
    'use strict';

    let currentOrder = null;
    let currentStep = 1;

    function getAuthHeaders(json = true) {
        const headers = {};
        const token = localStorage.getItem('attendee_access_token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
        if (json) headers['Content-Type'] = 'application/json';
        const csrf = document.cookie.match(/csrftoken=([^;]+)/);
        if (csrf) headers['X-CSRFToken'] = csrf[1];
        return headers;
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }

    function showToast(message, type = 'info') {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
            return;
        }
        alert(message);
    }

    function tierBadgeClass(tier) {
        if (tier === 'VIP') return 'ticket-tier-vip';
        if (tier === 'VVIP') return 'ticket-tier-vvip';
        return 'ticket-tier-regular';
    }

    function getModal() {
        return document.getElementById('checkoutModal');
    }

    function showStep(step) {
        currentStep = step;
        ['checkoutStep1', 'checkoutStep2', 'checkoutStep3', 'checkoutStep4Success', 'checkoutStep4Fail'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
        const map = { 1: 'checkoutStep1', 2: 'checkoutStep2', 3: 'checkoutStep3', 4: 'checkoutStep4Success', 5: 'checkoutStep4Fail' };
        const target = document.getElementById(map[step]);
        if (target) target.style.display = 'block';
    }

    function renderPaymentOptions(order) {
        const container = document.getElementById('checkoutPaymentOptions');
        if (!container) return;
        const options = order.payment_options || [];
        container.innerHTML = options.map(opt => `
            <div class="checkout-payment-option">
                <div>
                    <strong>${escapeHtml(opt.label)}</strong>
                    <div class="checkout-payment-value">${escapeHtml(opt.value)}</div>
                </div>
                <button type="button" class="checkout-copy-btn" data-copy="${escapeHtml(opt.value)}">
                    <i class="fas fa-copy"></i> Copy
                </button>
            </div>
        `).join('');

        container.querySelectorAll('.checkout-copy-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const value = btn.getAttribute('data-copy');
                try {
                    await navigator.clipboard.writeText(value);
                    showToast('Copied to clipboard!', 'success');
                } catch (e) {
                    showToast('Could not copy. Please copy manually.', 'error');
                }
            });
        });
    }

    function renderStreamStep(message) {
        const el = document.getElementById('checkoutStreamSteps');
        if (!el) return;
        const item = document.createElement('div');
        item.className = 'stream-step active';
        item.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> ${escapeHtml(message)}`;
        el.appendChild(item);
        const prev = el.querySelectorAll('.stream-step.active');
        if (prev.length > 1) {
            prev[prev.length - 2].classList.remove('active');
            prev[prev.length - 2].classList.add('done');
            prev[prev.length - 2].querySelector('i').className = 'fas fa-check-circle';
        }
    }

    async function createOrder(eventId, ticketType, quantity) {
        const response = await fetch('/api/attendee/payment-orders/create/', {
            method: 'POST',
            headers: getAuthHeaders(),
            credentials: 'same-origin',
            body: JSON.stringify({ event_id: eventId, ticket_type: ticketType, quantity }),
        });
        let data = {};
        try {
            data = await response.json();
        } catch (_) {
            data = {};
        }
        if (!response.ok || !data.success) {
            throw new Error(data.message || data.error || 'Could not start checkout.');
        }
        return data.order;
    }

    async function verifyScreenshot(orderId, file) {
        const formData = new FormData();
        formData.append('screenshot', file);
        const token = localStorage.getItem('attendee_access_token');
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const csrf = document.cookie.match(/csrftoken=([^;]+)/);
        if (csrf) headers['X-CSRFToken'] = csrf[1];

        const response = await fetch(`/api/attendee/payment-orders/${orderId}/verify-screenshot/`, {
            method: 'POST',
            headers,
            credentials: 'same-origin',
            body: formData,
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'Verification request failed.');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split('\n\n');
            buffer = parts.pop();
            for (const part of parts) {
                const line = part.trim();
                if (!line.startsWith('data:')) continue;
                const payload = JSON.parse(line.slice(5));
                if (payload.message) renderStreamStep(payload.message);
                if (payload.step === 'success') return payload;
                if (payload.step === 'failed') {
                    const err = new Error(payload.message || 'Verification failed.');
                    err.canRetry = payload.can_retry;
                    err.reason = payload.reason;
                    throw err;
                }
            }
        }
        throw new Error('Verification ended unexpectedly.');
    }

    async function submitMpesaName(orderId, mpesaName) {
        const response = await fetch(`/api/attendee/payment-orders/${orderId}/submit-mpesa-name/`, {
            method: 'POST',
            headers: getAuthHeaders(),
            credentials: 'same-origin',
            body: JSON.stringify({ mpesa_name: mpesaName }),
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Could not submit M-Pesa name.');
        }
        return data;
    }

    function openCheckoutModal(order) {
        currentOrder = order;
        const modal = getModal();
        if (!modal) return;
        modal.style.display = 'flex';

        const nameEl = document.getElementById('checkoutReceiverName');
        const amountEl = document.getElementById('checkoutTotalAmount');
        const tierEl = document.getElementById('checkoutTierBadge');
        if (nameEl) nameEl.textContent = order.mpesa_display_name || '';
        if (amountEl) amountEl.textContent = `KES ${Number(order.total_amount).toLocaleString()}`;
        if (tierEl) {
            tierEl.textContent = order.ticket_type;
            tierEl.className = `checkout-tier-badge ${tierBadgeClass(order.ticket_type)}`;
        }

        renderPaymentOptions(order);
        showStep(1);

        const streamSteps = document.getElementById('checkoutStreamSteps');
        if (streamSteps) streamSteps.innerHTML = '';
        const screenshotInput = document.getElementById('checkoutScreenshot');
        if (screenshotInput) screenshotInput.value = '';
        const preview = document.getElementById('checkoutScreenshotPreview');
        if (preview) preview.innerHTML = '';
        const manualBox = document.getElementById('checkoutManualNameBox');
        if (manualBox) manualBox.style.display = 'none';
    }

    function closeCheckoutModal() {
        const modal = getModal();
        if (modal) modal.style.display = 'none';
        currentOrder = null;
    }

    async function startCheckout(eventId, ticketType, quantity) {
        const token = localStorage.getItem('attendee_access_token');
        if (!token) {
            showToast('Please login to book tickets', 'info');
            setTimeout(() => { window.location.href = '/login/'; }, 1500);
            return;
        }
        try {
            const order = await createOrder(eventId, ticketType, quantity);
            openCheckoutModal(order);
        } catch (e) {
            showToast(e.message, 'error');
        }
    }

    function bindCheckoutEvents() {
        const closeBtn = document.getElementById('checkoutClose');
        if (closeBtn) closeBtn.addEventListener('click', closeCheckoutModal);

        const paidBtn = document.getElementById('checkoutPaidBtn');
        if (paidBtn) paidBtn.addEventListener('click', () => showStep(2));

        const screenshotInput = document.getElementById('checkoutScreenshot');
        if (screenshotInput) {
            screenshotInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                const preview = document.getElementById('checkoutScreenshotPreview');
                if (!preview) return;
                if (!file) { preview.innerHTML = ''; return; }
                const reader = new FileReader();
                reader.onload = () => {
                    preview.innerHTML = `<img src="${reader.result}" alt="Screenshot preview" style="max-width:100%;border-radius:8px;">`;
                };
                reader.readAsDataURL(file);
            });
        }

        const verifyBtn = document.getElementById('checkoutVerifyBtn');
        if (verifyBtn) {
            verifyBtn.addEventListener('click', async () => {
                if (!currentOrder) return;
                const file = screenshotInput?.files[0];
                if (!file) {
                    showToast('Please upload your M-Pesa screenshot.', 'error');
                    return;
                }
                showStep(3);
                const streamSteps = document.getElementById('checkoutStreamSteps');
                if (streamSteps) streamSteps.innerHTML = '';
                verifyBtn.disabled = true;
                try {
                    const result = await verifyScreenshot(currentOrder.id, file);
                    const successMsg = document.getElementById('checkoutSuccessMessage');
                    const ticketNum = document.getElementById('checkoutTicketNumber');
                    const ticketTier = document.getElementById('checkoutSuccessTier');
                    if (successMsg) successMsg.textContent = result.message || 'Payment verified!';
                    if (ticketNum) ticketNum.textContent = result.ticket_number || '';
                    if (ticketTier) {
                        ticketTier.textContent = result.ticket_type || currentOrder.ticket_type;
                        ticketTier.className = `checkout-tier-badge ${tierBadgeClass(result.ticket_type || currentOrder.ticket_type)}`;
                    }
                    showStep(4);
                    window.dispatchEvent(new CustomEvent('checkout-success', { detail: result }));
                } catch (e) {
                    const failMsg = document.getElementById('checkoutFailMessage');
                    if (failMsg) failMsg.textContent = e.message || 'EventHub could not read the screenshot properly, wanna try again?';
                    showStep(5);
                } finally {
                    verifyBtn.disabled = false;
                }
            });
        }

        const retryBtn = document.getElementById('checkoutRetryBtn');
        if (retryBtn) retryBtn.addEventListener('click', () => {
            if (screenshotInput) screenshotInput.value = '';
            const preview = document.getElementById('checkoutScreenshotPreview');
            if (preview) preview.innerHTML = '';
            const manualBox = document.getElementById('checkoutManualNameBox');
            if (manualBox) manualBox.style.display = 'none';
            showStep(2);
        });

        const manualBtn = document.getElementById('checkoutManualBtn');
        if (manualBtn) manualBtn.addEventListener('click', () => {
            const manualBox = document.getElementById('checkoutManualNameBox');
            if (manualBox) manualBox.style.display = 'block';
        });

        const submitNameBtn = document.getElementById('checkoutSubmitNameBtn');
        if (submitNameBtn) {
            submitNameBtn.addEventListener('click', async () => {
                if (!currentOrder) return;
                const nameInput = document.getElementById('checkoutMpesaName');
                const name = nameInput?.value.trim();
                if (!name) {
                    showToast('Please enter your M-Pesa name.', 'error');
                    return;
                }
                submitNameBtn.disabled = true;
                try {
                    await submitMpesaName(currentOrder.id, name);
                    showToast('Submitted for organizer approval.', 'success');
                    closeCheckoutModal();
                } catch (e) {
                    showToast(e.message, 'error');
                } finally {
                    submitNameBtn.disabled = false;
                }
            });
        }

        const viewTicketsBtn = document.getElementById('checkoutViewTicketsBtn');
        if (viewTicketsBtn) viewTicketsBtn.addEventListener('click', () => {
            window.location.href = '/tickets/';
        });
    }

    document.addEventListener('DOMContentLoaded', bindCheckoutEvents);

    window.CheckoutFlow = {
        startCheckout,
        openCheckoutModal,
        closeCheckoutModal,
        createOrder,
    };
})();
