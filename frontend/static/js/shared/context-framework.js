/**
 * EventHub Shared Context Framework
 * Provides global instances of:
 * - AppCalendar: Handles date validation and formatting
 * - AppTime: Handles local time validation and formatting
 * - AppLocation: Performs soft IP-based geolocation lookup and consent management
 */

(function () {
    // 1. CSS Styles Injection for Consent Banner
    const injectStyles = () => {
        const styleId = 'eh-consent-styles';
        if (document.getElementById(styleId)) return;

        const styles = `
            .eh-consent-banner {
                position: fixed;
                bottom: 24px;
                left: 50%;
                transform: translateX(-50%) translateY(120%);
                width: calc(100% - 48px);
                max-width: 580px;
                background: rgba(30, 41, 59, 0.95);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                border: 1px solid rgba(236, 100, 8, 0.2);
                border-radius: 16px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                padding: 18px 24px;
                z-index: 99999;
                display: flex;
                flex-direction: column;
                gap: 14px;
                transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s ease;
                opacity: 0;
                color: #f8fafc;
                font-family: 'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif;
            }
            .eh-consent-banner.show {
                transform: translateX(-50%) translateY(0);
                opacity: 1;
            }
            .eh-consent-header {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .eh-consent-icon {
                font-size: 1.4rem;
                color: #ec6408; /* Brand Orange */
                animation: eh-pulse 2s infinite;
            }
            .eh-consent-title {
                font-size: 1.05rem;
                font-weight: 700;
                margin: 0;
                letter-spacing: -0.02em;
                color: #ffffff;
            }
            .eh-consent-text {
                font-size: 0.85rem;
                line-height: 1.5;
                color: #cbd5e1;
                margin: 0;
            }
            .eh-consent-text a {
                color: #ec6408;
                text-decoration: none;
                font-weight: 600;
            }
            .eh-consent-text a:hover {
                text-decoration: underline;
            }
            .eh-consent-actions {
                display: flex;
                justify-content: flex-end;
                gap: 12px;
                margin-top: 4px;
            }
            .eh-btn {
                padding: 8px 18px;
                border-radius: 8px;
                font-size: 0.85rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.25s ease;
                border: none;
                outline: none;
            }
            .eh-btn-deny {
                background: transparent;
                color: #94a3b8;
                border: 1px solid rgba(148, 163, 184, 0.3);
            }
            .eh-btn-deny:hover {
                background: rgba(148, 163, 184, 0.1);
                color: #f8fafc;
            }
            .eh-btn-allow {
                background: #ec6408;
                color: #ffffff;
                box-shadow: 0 4px 12px rgba(236, 100, 8, 0.15);
            }
            .eh-btn-allow:hover {
                background: #ff7c1f;
                box-shadow: 0 4px 16px rgba(236, 100, 8, 0.3);
                transform: translateY(-1px);
            }
            @keyframes eh-pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.08); }
                100% { transform: scale(1); }
            }
            @media (max-width: 640px) {
                .eh-consent-banner {
                    bottom: 16px;
                    width: calc(100% - 32px);
                    padding: 16px;
                }
            }
        `;
        const styleSheet = document.createElement("style");
        styleSheet.id = styleId;
        styleSheet.innerText = styles;
        document.head.appendChild(styleSheet);
    };

    // 2. AppCalendar Framework
    class CalendarFramework {
        getTodayDateString() {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        formatDate(dateString, style = 'medium') {
            if (!dateString) return 'TBD';
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;

            let options = { year: 'numeric', month: 'short', day: 'numeric' };
            if (style === 'short') {
                options = { year: 'numeric', month: 'numeric', day: 'numeric' };
            } else if (style === 'long') {
                options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            }
            
            return new Intl.DateTimeFormat('en-KE', options).format(date);
        }

        isPastDate(dateString) {
            if (!dateString) return false;
            const inputDate = new Date(dateString);
            inputDate.setHours(0, 0, 0, 0);
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            return inputDate < today;
        }
    }

    // 3. AppTime Framework
    class TimeFramework {
        getCurrentTimeString() {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            return `${hours}:${minutes}`;
        }

        formatTime(timeString) {
            if (!timeString) return 'TBD';
            let date;
            if (timeString.includes(':') && !timeString.includes('-')) {
                const parts = timeString.split(':');
                date = new Date();
                date.setHours(parseInt(parts[0]), parseInt(parts[1]), 0, 0);
            } else {
                date = new Date(timeString);
            }
            if (isNaN(date.getTime())) return timeString;

            return new Intl.DateTimeFormat('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }).format(date);
        }

        formatDateTime(dateString) {
            if (!dateString) return 'N/A';
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;

            return new Intl.DateTimeFormat('en-KE', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }).format(date);
        }
    }

    // 4. AppLocation & Cookie Consent Framework
    class LocationFramework {
        constructor() {
            this.cacheKey = 'eh_location_context';
            this.consentKey = 'eventhub_cookie_consent';
            this.data = JSON.parse(localStorage.getItem(this.cacheKey)) || null;
        }

        async init() {
            injectStyles();
            
            const consent = localStorage.getItem(this.consentKey);
            if (consent === 'granted') {
                await this.refreshLocation();
            } else if (!consent) {
                // Delay banner presentation slightly for premium UX feel
                setTimeout(() => this.showConsentBanner(), 800);
            }
        }

        async refreshLocation() {
            // Check if we have fresh cached location (cache for 6 hours)
            if (this.data && (Date.now() - this.data.timestamp < 6 * 60 * 60 * 1000)) {
                console.log('AppLocation using cached network location context:', this.data);
                return;
            }

            try {
                console.log('AppLocation pulling soft IP location context...');
                const response = await fetch('https://ipapi.co/json/');
                if (!response.ok) throw new Error('Primary GeoIP lookup failed');
                const locData = await response.json();
                
                this.data = {
                    city: locData.city || 'Nairobi',
                    country: locData.country_name || 'Kenya',
                    countryCode: locData.country || 'KE',
                    timezone: locData.timezone || 'Africa/Nairobi',
                    latitude: locData.latitude || -1.2833,
                    longitude: locData.longitude || 36.8167,
                    timestamp: Date.now()
                };

                localStorage.setItem(this.cacheKey, JSON.stringify(this.data));
                window.dispatchEvent(new CustomEvent('app-location-resolved', { detail: this.data }));
                console.log('AppLocation resolved and cached:', this.data);
            } catch (err) {
                console.warn('ipapi.co fetch failed, trying backup API...', err);
                try {
                    const response = await fetch('https://ipinfo.io/json');
                    if (!response.ok) throw new Error('Backup GeoIP lookup failed');
                    const locData = await response.json();
                    const coords = (locData.loc || '-1.2833,36.8167').split(',');

                    this.data = {
                        city: locData.city || 'Nairobi',
                        country: locData.country || 'Kenya',
                        countryCode: locData.country || 'KE',
                        timezone: locData.timezone || 'Africa/Nairobi',
                        latitude: parseFloat(coords[0]),
                        longitude: parseFloat(coords[1]),
                        timestamp: Date.now()
                    };

                    localStorage.setItem(this.cacheKey, JSON.stringify(this.data));
                    window.dispatchEvent(new CustomEvent('app-location-resolved', { detail: this.data }));
                    console.log('AppLocation resolved from backup and cached:', this.data);
                } catch (backupErr) {
                    console.error('All soft IP geolocations failed. Using default values.', backupErr);
                }
            }
        }

        showConsentBanner() {
            if (document.querySelector('.eh-consent-banner')) return;

            const banner = document.createElement('div');
            banner.className = 'eh-consent-banner';
            banner.innerHTML = `
                <div class="eh-consent-header">
                    <i class="fa-solid fa-cookie-bite eh-consent-icon"></i>
                    <h4 class="eh-consent-title">Cookie & Location Consent</h4>
                </div>
                <p class="eh-consent-text">
                    We use cookies and soft IP-based location analytics to personalize your events stream, display local event calendars, and show precise local times. Learn more in our <a href="/attendee/pages/privacy/">Privacy Policy</a>.
                </p>
                <div class="eh-consent-actions">
                    <button class="eh-btn eh-btn-deny" id="eh-consent-deny">Deny</button>
                    <button class="eh-btn eh-btn-allow" id="eh-consent-allow">Allow All</button>
                </div>
            `;

            document.body.appendChild(banner);

            // Trigger slide in
            setTimeout(() => {
                banner.classList.add('show');
            }, 100);

            // Event Listeners
            document.getElementById('eh-consent-deny').addEventListener('click', () => {
                localStorage.setItem(this.consentKey, 'denied');
                this.dismissBanner(banner);
            });

            document.getElementById('eh-consent-allow').addEventListener('click', async () => {
                localStorage.setItem(this.consentKey, 'granted');
                this.dismissBanner(banner);
                await this.refreshLocation();
            });
        }

        dismissBanner(banner) {
            banner.classList.remove('show');
            setTimeout(() => {
                banner.remove();
            }, 600);
        }

        getCity() {
            return this.data ? this.data.city : 'Nairobi';
        }

        getCountry() {
            return this.data ? this.data.country : 'Kenya';
        }

        getTimezone() {
            return this.data ? this.data.timezone : (Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Nairobi');
        }

        getCoordinates() {
            return this.data ? { latitude: this.data.latitude, longitude: this.data.longitude } : { latitude: -1.2833, longitude: 36.8167 };
        }
    }

    // Instantiate and expose globally
    window.AppCalendar = new CalendarFramework();
    window.AppTime = new TimeFramework();
    window.AppLocation = new LocationFramework();

    // Initialize location on load
    document.addEventListener("DOMContentLoaded", () => {
        window.AppLocation.init();
    });

})();
