// ============================================
// ENHANCED PAGE LOADER MODULE
// Bold White Text with Sequential Rotating Dots
// ============================================

(function() {
    'use strict';
    
    let loader = null;
    let isHidden = false;
    let navigationTimeout = null;
    let activeRequests = 0;
    let dotAnimationInterval = null;
    let minDisplayTimer = null;
    let loaderStartTime = null;
    
    // Configuration
    const CONFIG = {
        minDisplayTime: 800,
        maxDisplayTime: 5000,
        fadeOutDelay: 300,
        navigationDelay: 150
    };
    
    // Create loader DOM element
    function createLoader() {
        if (document.getElementById('pageLoader')) return;
        
        const loaderHTML = `
            <div id="pageLoader" class="page-loader">
                <div class="loader-overlay"></div>
                <div class="loader-container">
                    <div class="loader-spinner-ring">
                        <div class="spinner-ring arrow-1"></div>
                        <div class="spinner-ring arrow-2"></div>
                        <div class="spinner-ring arrow-3"></div>
                        <div class="spinner-ring arrow-4"></div>
                        <div class="loader-center-logo">
                            <i class="fas fa-calendar-alt"></i>
                        </div>
                    </div>
                    <div class="loader-text">
                        <div class="loading-bold">
                            <span>LOADING</span>
                            <div class="dots-container">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('afterbegin', loaderHTML);
        loader = document.getElementById('pageLoader');
    }
    
    // Start sequential rotating dots animation
    function startDotAnimation() {
        const dots = document.querySelectorAll('.dots-container span');
        if (dots.length === 0) return;
        
        let currentIndex = 0;
        
        // Initial state - first dot active
        dots.forEach((dot, idx) => {
            dot.classList.remove('active');
            if (idx === currentIndex) {
                dot.classList.add('active');
            }
        });
        
        // Rotate through dots sequentially
        dotAnimationInterval = setInterval(() => {
            // Remove active class from all dots
            dots.forEach(dot => {
                dot.classList.remove('active');
            });
            
            // Add active class to current dot
            dots[currentIndex].classList.add('active');
            
            // Move to next dot
            currentIndex = (currentIndex + 1) % dots.length;
        }, 500); // Change dot every 500ms
    }
    
    // Stop dot animation
    function stopDotAnimation() {
        if (dotAnimationInterval) {
            clearInterval(dotAnimationInterval);
            dotAnimationInterval = null;
        }
    }
    
    // Check if minimum time has passed
    function hasMinimumTimePassed() {
        if (!loaderStartTime) return true;
        const elapsed = Date.now() - loaderStartTime;
        return elapsed >= CONFIG.minDisplayTime;
    }
    
    // Show loader
    function showLoader(message = null, delay = false) {
        if (!loader) {
            loader = document.getElementById('pageLoader');
            if (!loader) {
                createLoader();
                loader = document.getElementById('pageLoader');
            }
        }
        
        const showLoaderImmediately = () => {
            if (loader) {
                loader.style.display = 'flex';
                loader.classList.remove('fade-out');
                loader.classList.add('active');
                isHidden = false;
                document.body.style.overflow = 'hidden';
                loaderStartTime = Date.now();
                
                startDotAnimation();
                
                if (navigationTimeout) clearTimeout(navigationTimeout);
                navigationTimeout = setTimeout(() => {
                    if (loader && loader.style.display !== 'none') {
                        hideLoader();
                    }
                }, CONFIG.maxDisplayTime);
            }
        };
        
        if (delay) {
            setTimeout(showLoaderImmediately, CONFIG.navigationDelay);
        } else {
            showLoaderImmediately();
        }
    }
    
    // Hide loader
    function hideLoader() {
        if (!loader) {
            loader = document.getElementById('pageLoader');
        }
        
        if (loader && !isHidden && loader.classList.contains('active')) {
            if (hasMinimumTimePassed()) {
                performHide();
            } else {
                const remainingTime = CONFIG.minDisplayTime - (Date.now() - loaderStartTime);
                if (minDisplayTimer) clearTimeout(minDisplayTimer);
                minDisplayTimer = setTimeout(() => {
                    performHide();
                }, remainingTime);
            }
        }
    }
    
    function performHide() {
        if (loader && !isHidden && loader.classList.contains('active')) {
            isHidden = true;
            loader.classList.add('fade-out');
            document.body.style.overflow = '';
            
            stopDotAnimation();
            
            if (navigationTimeout) clearTimeout(navigationTimeout);
            if (minDisplayTimer) clearTimeout(minDisplayTimer);
            
            setTimeout(() => {
                if (loader) {
                    loader.style.display = 'none';
                    loader.classList.remove('fade-out', 'active');
                }
                loaderStartTime = null;
            }, CONFIG.fadeOutDelay);
        }
    }
    
    // Force hide
    function forceHideLoader() {
        if (loader) {
            loader.style.display = 'none';
            loader.classList.remove('active', 'fade-out');
            isHidden = true;
            document.body.style.overflow = '';
            stopDotAnimation();
        }
        
        if (navigationTimeout) clearTimeout(navigationTimeout);
        if (minDisplayTimer) clearTimeout(minDisplayTimer);
        loaderStartTime = null;
    }
    
    // Track async requests
    function requestStarted() {
        activeRequests++;
        if (activeRequests === 1) {
            showLoader(null, true);
        }
    }
    
    function requestFinished() {
        activeRequests--;
        if (activeRequests === 0) {
            hideLoader();
        }
    }
    
    // Initialize
    function initLoader() {
        createLoader();
        loader = document.getElementById('pageLoader');
        
        window.addEventListener('load', function() {
            setTimeout(hideLoader, 100);
        });
        
        setTimeout(function() {
            if (loader && loader.style.display !== 'none') {
                hideLoader();
            }
        }, CONFIG.maxDisplayTime);
    }
    
    // Setup navigation detection
    function setupNavigationDetection() {
        let navigationTimeoutId = null;
        
        document.addEventListener('click', function(e) {
            const link = e.target.closest('a');
            
            if (link && link.href) {
                const isInternalLink = link.href.indexOf(window.location.origin) === 0;
                const isAnchorLink = link.getAttribute('href')?.startsWith('#');
                const isSamePage = link.href === window.location.href;
                const hasNoLoader = link.hasAttribute('data-no-loader');
                const isDownload = link.hasAttribute('download');
                const isMailTo = link.href.startsWith('mailto:');
                const isTel = link.href.startsWith('tel:');
                
                if (isInternalLink && !isAnchorLink && !isSamePage && !hasNoLoader && 
                    !isDownload && !isMailTo && !isTel) {
                    
                    if (navigationTimeoutId) clearTimeout(navigationTimeoutId);
                    navigationTimeoutId = setTimeout(() => {
                        showLoader(null, false);
                    }, 100);
                }
            }
        });
        
        document.addEventListener('submit', function(e) {
            const form = e.target.closest('form');
            if (form && !form.hasAttribute('data-no-loader')) {
                if (navigationTimeoutId) clearTimeout(navigationTimeoutId);
                navigationTimeoutId = setTimeout(() => {
                    showLoader(null, false);
                }, 100);
            }
        });
        
        window.addEventListener('beforeunload', function() {
            if (navigationTimeoutId) clearTimeout(navigationTimeoutId);
            showLoader(null, false);
        });
        
        // Intercept fetch requests
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            requestStarted();
            return originalFetch.apply(this, args)
                .finally(() => requestFinished());
        };
        
        // Intercept XMLHttpRequest
        if (window.XMLHttpRequest) {
            const originalOpen = XMLHttpRequest.prototype.open;
            const originalSend = XMLHttpRequest.prototype.send;
            
            XMLHttpRequest.prototype.open = function() {
                this._url = arguments[1];
                return originalOpen.apply(this, arguments);
            };
            
            XMLHttpRequest.prototype.send = function() {
                requestStarted();
                this.addEventListener('loadend', () => requestFinished());
                return originalSend.apply(this, arguments);
            };
        }
        
        // Intercept jQuery AJAX if available
        if (typeof jQuery !== 'undefined') {
            $(document).ajaxStart(function() {
                requestStarted();
            });
            $(document).ajaxComplete(function() {
                requestFinished();
            });
        }
        
        // History API
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;
        
        history.pushState = function() {
            showLoader(null, true);
            originalPushState.apply(this, arguments);
            setTimeout(() => {
                if (loader && loader.style.display !== 'none') {
                    setTimeout(hideLoader, 500);
                }
            }, 800);
        };
        
        history.replaceState = function() {
            showLoader(null, true);
            originalReplaceState.apply(this, arguments);
            setTimeout(() => {
                if (loader && loader.style.display !== 'none') {
                    setTimeout(hideLoader, 500);
                }
            }, 800);
        };
        
        window.addEventListener('popstate', function() {
            showLoader(null, true);
            setTimeout(() => {
                if (loader && loader.style.display !== 'none') {
                    setTimeout(hideLoader, 500);
                }
            }, 800);
        });
    }
    
    // Expose public API
    window.PageLoader = {
        show: showLoader,
        hide: hideLoader,
        forceHide: forceHideLoader,
        init: initLoader,
        setMinDisplayTime: function(time) {
            CONFIG.minDisplayTime = time;
        }
    };
    
    window.showPageLoader = showLoader;
    window.hidePageLoader = hideLoader;
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            initLoader();
            setupNavigationDetection();
        });
    } else {
        initLoader();
        setupNavigationDetection();
    }
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.PageLoader;
}
