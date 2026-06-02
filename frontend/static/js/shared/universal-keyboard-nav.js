/**
 * UNIVERSAL KEYBOARD NAVIGATION
 * One file that works on ALL pages automatically
 */

(function() {
    'use strict';
    
    const CONFIG = {
        focusableSelectors: [
            'a[href]', 'button', 'input', 'select', 'textarea',
            '[tabindex]:not([tabindex="-1"])', '[contenteditable="true"]',
            '.event-card', '.premium-card', '.category-card', '.wishlist-card'
        ],
        carouselSelectors: [
            '.categories-carousel', '.featured-carousel', '.hero-slideshow'
        ],
        modalSelectors: [
            '.modal', '.dropdown-menu', '.mobile-profile-dropdown'
        ]
    };
    
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setup);
        } else {
            setup();
        }
        
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes.length) {
                    refreshFocusableElements();
                }
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    }
    
    function setup() {
        addSkipLinks();
        addFocusStyles();
        setupGlobalKeyboardEvents();
        setupCarouselKeyboardNav();
        setupCardGridNav();
        refreshFocusableElements();
        
        console.log('Keyboard Navigation enabled - Press ? for shortcuts');
    }
    
    function addSkipLinks() {
        if (document.querySelector('.skip-links')) return;
        
        const skipLinks = document.createElement('div');
        skipLinks.className = 'skip-links';
        skipLinks.innerHTML = `
            <a href="#main-content" class="skip-link">Skip to main content</a>
            <a href="#" class="skip-link search-skip">Skip to search</a>
            <a href="#" class="skip-link account-skip">Skip to account</a>
        `;
        document.body.insertBefore(skipLinks, document.body.firstChild);
        
        // Add click handlers for skip links
        const searchSkip = skipLinks.querySelector('.search-skip');
        if (searchSkip) {
            searchSkip.addEventListener('click', function(e) {
                e.preventDefault();
                const searchInput = document.querySelector('input[type="search"], #searchInput, #desktopSearchInput, [placeholder*="Search"]');
                if (searchInput) searchInput.focus();
            });
        }
        
        const accountSkip = skipLinks.querySelector('.account-skip');
        if (accountSkip) {
            accountSkip.addEventListener('click', function(e) {
                e.preventDefault();
                const accountBtn = document.querySelector('.profile-btn, #profileBtn, [aria-label="Account"]');
                if (accountBtn) accountBtn.focus();
            });
        }
    }
    
    function addFocusStyles() {
        if (document.getElementById('keyboard-nav-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'keyboard-nav-styles';
        styles.textContent = `
            /* Skip links - hidden until focused */
            .skip-links {
                position: absolute;
                top: 0;
                left: 0;
                z-index: 9999;
                pointer-events: none;
            }
            
            .skip-link {
                position: absolute;
                top: -40px;
                left: 0;
                background: #f59e0b;
                color: #1a1a2e;
                padding: 8px 16px;
                text-decoration: none;
                font-weight: bold;
                border-radius: 0 0 4px 0;
                transition: top 0.2s ease;
                pointer-events: auto;
                font-size: 14px;
                white-space: nowrap;
            }
            
            .skip-link:focus {
                top: 0;
                outline: 2px solid #fff;
                outline-offset: -2px;
            }
            
            /* Focus indicators for keyboard users only */
            :focus-visible {
                outline: 3px solid #f59e0b !important;
                outline-offset: 3px !important;
                position: relative;
                z-index: 1000;
            }
            
            :focus:not(:focus-visible) {
                outline: none !important;
            }
            
            /* Make interactive cards focusable */
            .event-card, .premium-card, .category-card, .wishlist-card {
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .event-card:focus-visible, .premium-card:focus-visible,
            .category-card:focus-visible, .wishlist-card:focus-visible {
                transform: translateY(-5px);
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
            }
            
            /* Shortcuts help modal */
            .shortcuts-help-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.8);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .shortcuts-help-content {
                background: white;
                padding: 2rem;
                border-radius: 16px;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
            }
            
            .shortcuts-help-content kbd {
                background: #f1f5f9;
                border-radius: 4px;
                padding: 2px 6px;
                font-family: monospace;
                border: 1px solid #cbd5e1;
                display: inline-block;
                min-width: 30px;
                text-align: center;
            }
            
            .shortcuts-help-content ul {
                list-style: none;
                padding: 0;
            }
            
            .shortcuts-help-content li {
                padding: 8px 0;
                border-bottom: 1px solid #e2e8f0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .shortcuts-help-content h3 {
                margin-top: 0;
            }
            
            .shortcuts-close {
                margin-top: 1rem;
                padding: 8px 16px;
                background: #f59e0b;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                width: 100%;
            }
        `;
        document.head.appendChild(styles);
    }
    
    function setupGlobalKeyboardEvents() {
        document.addEventListener('keydown', function(e) {
            const isTyping = e.target.matches('input, textarea, select, [contenteditable="true"]');
            
            if (e.key === '?' && !isTyping) {
                e.preventDefault();
                showShortcutsHelp();
                return;
            }
            
            if (e.key === '/' && !isTyping) {
                e.preventDefault();
                const searchInput = document.querySelector('input[type="search"], #searchInput, #desktopSearchInput, [placeholder*="Search"]');
                if (searchInput) searchInput.focus();
                return;
            }
            
            if (e.key === 'Escape') {
                closeAllModalsAndDropdowns();
                return;
            }
            
            if (e.key === 'Tab') {
                handleFocusTrap(e);
            }
            
            if ((e.key === 'Enter' || e.key === ' ') && !isTyping) {
                const activeEl = document.activeElement;
                if (activeEl && activeEl.classList && 
                    (activeEl.classList.contains('event-card') || 
                     activeEl.classList.contains('premium-card') ||
                     activeEl.classList.contains('category-card') ||
                     activeEl.classList.contains('wishlist-card'))) {
                    e.preventDefault();
                    const link = activeEl.querySelector('a') || activeEl;
                    const url = link.getAttribute('href') || activeEl.getAttribute('data-url');
                    if (url) window.location.href = url;
                    else if (activeEl.onclick) activeEl.onclick();
                }
            }
        });
    }
    
    function handleFocusTrap(e) {
        const openModal = document.querySelector('.modal[style*="display: flex"], .modal.show, .dropdown-menu.show');
        if (!openModal) return;
        
        const focusable = Array.from(openModal.querySelectorAll(CONFIG.focusableSelectors.join(',')));
        if (!focusable.length) return;
        
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }
    
    function setupCarouselKeyboardNav() {
        document.addEventListener('keydown', function(e) {
            const activeCarousel = document.activeElement?.closest(CONFIG.carouselSelectors.join(','));
            if (!activeCarousel) return;
            
            const scrollAmount = 300;
            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    activeCarousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    activeCarousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                    break;
                case 'Home':
                    e.preventDefault();
                    activeCarousel.scrollTo({ left: 0, behavior: 'smooth' });
                    break;
                case 'End':
                    e.preventDefault();
                    activeCarousel.scrollTo({ left: activeCarousel.scrollWidth, behavior: 'smooth' });
                    break;
            }
        });
    }
    
    function setupCardGridNav() {
        document.addEventListener('keydown', function(e) {
            const grid = document.activeElement?.closest('.events-grid, .wishlist-grid, .featured-grid, .categories-carousel');
            if (!grid) return;
            
            const cards = Array.from(grid.querySelectorAll('.event-card, .premium-card, .wishlist-card, .category-card'));
            const currentIndex = cards.indexOf(document.activeElement);
            
            if (currentIndex === -1) return;
            
            const cardsPerRow = Math.floor(grid.clientWidth / (cards[0]?.clientWidth || 300)) || 3;
            
            switch(e.key) {
                case 'ArrowRight':
                    e.preventDefault();
                    if (currentIndex + 1 < cards.length) cards[currentIndex + 1].focus();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    if (currentIndex - 1 >= 0) cards[currentIndex - 1].focus();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    if (currentIndex + cardsPerRow < cards.length) cards[currentIndex + cardsPerRow].focus();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    if (currentIndex - cardsPerRow >= 0) cards[currentIndex - cardsPerRow].focus();
                    break;
            }
        });
    }
    
    function closeAllModalsAndDropdowns() {
        CONFIG.modalSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                el.classList.remove('show');
                if (el.style) el.style.display = 'none';
            });
        });
        
        const mobileMenu = document.getElementById('navLinks');
        if (mobileMenu) mobileMenu.classList.remove('show');
        
        const overlay = document.getElementById('mobileOverlay');
        if (overlay) overlay.classList.remove('show');
        
        document.querySelectorAll('.dropdown-menu').forEach(dd => dd.classList.remove('show'));
    }
    
    function showShortcutsHelp() {
        const existing = document.querySelector('.shortcuts-help-modal');
        if (existing) existing.remove();
        
        const modal = document.createElement('div');
        modal.className = 'shortcuts-help-modal';
        modal.innerHTML = `
            <div class="shortcuts-help-content">
                <h3>⌨️ Keyboard Shortcuts</h3>
                <ul>
                    <li><kbd>?</kbd> <span>Show this help menu</span></li>
                    <li><kbd>/</kbd> <span>Focus search box</span></li>
                    <li><kbd>Tab</kbd> <span>Navigate between elements</span></li>
                    <li><kbd>Enter</kbd> / <kbd>Space</kbd> <span>Activate button or card</span></li>
                    <li><kbd>←</kbd> <kbd>→</kbd> <span>Navigate carousels / cards</span></li>
                    <li><kbd>↑</kbd> <kbd>↓</kbd> <span>Navigate card grids</span></li>
                    <li><kbd>Esc</kbd> <span>Close modals / dropdowns</span></li>
                    <li><kbd>Home</kbd> <span>Scroll carousel to start</span></li>
                    <li><kbd>End</kbd> <span>Scroll carousel to end</span></li>
                </ul>
                <button class="shortcuts-close" onclick="this.closest('.shortcuts-help-modal').remove()">Close</button>
            </div>
        `;
        document.body.appendChild(modal);
        modal.querySelector('.shortcuts-close').focus();
    }
    
    function refreshFocusableElements() {
        document.querySelectorAll('.event-card, .premium-card, .category-card, .wishlist-card').forEach(card => {
            if (!card.hasAttribute('tabindex')) {
                card.setAttribute('tabindex', '0');
                card.setAttribute('role', 'article');
            }
        });
    }
    
    window.KeyboardNav = {
        init: init,
        showHelp: showShortcutsHelp,
        refresh: refreshFocusableElements
    };
    
    init();
})();
