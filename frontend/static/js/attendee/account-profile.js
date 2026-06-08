// ============================================
// ACCOUNT PROFILE MODULE
// Secure, centralized user profile store.
// Reads/writes attendee_user in localStorage,
// prefills payment & billing fields across all flows.
// ============================================

const AccountProfile = (() => {

    const STORAGE_KEY = 'attendee_user';

    /**
     * Returns the current stored profile object.
     * Fields: name, full_name, email, phone, ...
     */
    function get() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        } catch (e) {
            return {};
        }
    }

    /**
     * Merges `data` into the stored profile and saves it.
     * Dispatches a custom 'profile-updated' event on window.
     */
    function save(data) {
        try {
            const current = get();
            const merged = Object.assign({}, current, data);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            window.dispatchEvent(new CustomEvent('profile-updated', { detail: merged }));
            return merged;
        } catch (e) {
            console.error('[AccountProfile] save error:', e);
        }
    }

    /**
     * Fetches fresh profile data from the API and syncs it to localStorage.
     * Silent on failure — does not throw.
     */
    async function syncFromAPI() {
        try {
            const token = localStorage.getItem('attendee_access_token');
            if (!token) return;
            const response = await fetch('/api/attendee/profile/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const profile = await response.json();
                save(profile);
            }
        } catch (e) {
            // Silently degrade — local data will be used instead
        }
    }

    /**
     * Prefills a set of form inputs from the stored profile.
     *
     * @param {Object} fieldMap — keys are DOM element IDs, values are profile keys.
     *   Example: { mpesaPhone: 'phone', billingName: 'name', billingEmail: 'email' }
     *
     * When a field is successfully prefilled:
     *   - The input value is set
     *   - A subtle "Autofilled · Edit anytime" hint chip appears below it
     */
    function prefill(fieldMap) {
        const profile = get();

        Object.entries(fieldMap).forEach(([elementId, profileKey]) => {
            const input = document.getElementById(elementId);
            if (!input) return;

            // Resolve value: check both key variations (name / full_name etc.)
            const value = profile[profileKey]
                || profile['full_name']  // fallback for 'name' -> 'full_name'
                || '';

            // Only prefill if there's something to fill and the field is empty
            const effectiveValue = profileKey === 'name'
                ? (profile.full_name || profile.name || profile.first_name || '')
                : (profile[profileKey] || '');

            if (!effectiveValue) return;

            // Set the value
            input.value = effectiveValue;

            // Inject autofill hint if not already present
            _injectHint(input, elementId);
        });
    }

    /**
     * Injects a subtle "Autofilled" hint chip below the input field.
     * Safe to call multiple times — only one hint per field.
     */
    function _injectHint(input, id) {
        const hintId = `__autofill_hint_${id}`;
        if (document.getElementById(hintId)) return; // already injected

        const hint = document.createElement('div');
        hint.id = hintId;
        hint.setAttribute('aria-label', 'Field was autofilled from your account');
        hint.style.cssText = `
            display: inline-flex;
            align-items: center;
            gap: 4px;
            margin-top: 4px;
            font-size: 0.72rem;
            color: #6366f1;
            font-weight: 500;
            opacity: 0;
            transform: translateY(-4px);
            transition: opacity 0.3s ease, transform 0.3s ease;
            pointer-events: none;
            user-select: none;
        `;
        hint.innerHTML = `
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Autofilled from your account &middot; Edit anytime
        `;

        // Insert after the input
        if (input.parentNode) {
            input.parentNode.insertBefore(hint, input.nextSibling);
        }

        // Animate in
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                hint.style.opacity = '1';
                hint.style.transform = 'translateY(0)';
            });
        });

        // Remove hint if user clears the field manually
        input.addEventListener('input', () => {
            if (!input.value) {
                hint.style.opacity = '0';
            } else {
                hint.style.opacity = '1';
            }
        }, { once: false });
    }

    /**
     * Returns a display-safe name string.
     */
    function getDisplayName() {
        const p = get();
        return p.full_name || p.name || p.first_name || 'User';
    }

    /**
     * Returns the stored phone number, formatted for M-Pesa (254XXXXXXXXX).
     */
    function getMpesaPhone() {
        const p = get();
        const raw = p.phone || '';
        if (!raw) return '';
        let cleaned = raw.replace(/\D/g, '');
        if (cleaned.startsWith('0')) cleaned = '254' + cleaned.substring(1);
        if (!cleaned.startsWith('254')) cleaned = '254' + cleaned;
        return cleaned;
    }

    // Public API
    return { get, save, syncFromAPI, prefill, getDisplayName, getMpesaPhone };
})();

// Expose globally
window.AccountProfile = AccountProfile;
