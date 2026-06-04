// ============================================
// PAGE LOADER MODULE - Clean version
// ============================================

(function() {
    'use strict';
    
    let loader = null;
    let navigationTimeout = null;
    let loaderStartTime = null;
    
    var CONFIG = {
        minDisplayTime: 500,
        maxDisplayTime: 10000,
        fadeOutDelay: 300,
        navigationDelay: 150
    };
    
    function createLoader() {
        if (document.getElementById('pageLoader')) return;
        
        var loaderHTML = '<div id="pageLoader" class="page-loader"><div class="loader-overlay"></div><div class="loader-container"><div class="circulating-dots"><div class="dot dot-1"></div><div class="dot dot-2"></div><div class="dot dot-3"></div><div class="dot dot-4"></div><div class="dot dot-5"></div><div class="dot dot-6"></div><div class="dot dot-7"></div><div class="dot dot-8"></div><div class="loader-center-logo"><i class="fas fa-calendar-alt"></i></div></div><div class="loader-text"><div class="loading-bold"><span>LOADING</span><div class="dots-container"><span></span><span></span><span></span></div></div></div></div></div>';
        document.body.insertAdjacentHTML('afterbegin', loaderHTML);
        loader = document.getElementById('pageLoader');
    }
    
    function hasMinimumTimePassed() {
        if (!loaderStartTime) return true;
        var elapsed = Date.now() - loaderStartTime;
        return elapsed >= CONFIG.minDisplayTime;
    }
    
    function showLoader() {
        if (!loader) {
            loader = document.getElementById('pageLoader');
            if (!loader) {
                createLoader();
                loader = document.getElementById('pageLoader');
            }
        }
        
        if (loader) {
            loader.style.display = 'flex';
            loader.classList.remove('fade-out');
            loader.classList.add('active');
            document.body.style.overflow = 'hidden';
            loaderStartTime = Date.now();
            
            if (navigationTimeout) clearTimeout(navigationTimeout);
            navigationTimeout = setTimeout(function() {
                if (loader && loader.style.display !== 'none') {
                    hideLoader();
                }
            }, CONFIG.maxDisplayTime);
        }
    }
    
    function hideLoader() {
        if (!loader) {
            loader = document.getElementById('pageLoader');
        }
        
        if (loader && loader.classList && loader.classList.contains('active')) {
            if (hasMinimumTimePassed()) {
                performHide();
            } else {
                var remainingTime = CONFIG.minDisplayTime - (Date.now() - loaderStartTime);
                setTimeout(function() {
                    performHide();
                }, remainingTime);
            }
        }
    }
    
    function performHide() {
        if (loader && loader.classList.contains('active')) {
            loader.classList.add('fade-out');
            document.body.style.overflow = '';
            
            if (navigationTimeout) clearTimeout(navigationTimeout);
            
            setTimeout(function() {
                if (loader) {
                    loader.style.display = 'none';
                    loader.classList.remove('fade-out', 'active');
                }
                loaderStartTime = null;
            }, CONFIG.fadeOutDelay);
        }
    }
    
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
    
    function setupNavigationDetection() {
        var navigationTimeoutId = null;
        
        document.addEventListener('click', function(e) {
            var link = e.target.closest('a');
            
            if (link && link.href) {
                var isInternalLink = link.href.indexOf(window.location.origin) === 0;
                var isAnchorLink = link.getAttribute('href') && link.getAttribute('href').startsWith('#');
                var isSamePage = link.href === window.location.href;
                var hasNoLoader = link.hasAttribute('data-no-loader');
                var isDownload = link.hasAttribute('download');
                var isMailTo = link.href.startsWith('mailto:');
                var isTel = link.href.startsWith('tel:');
                
                if (isInternalLink && !isAnchorLink && !isSamePage && !hasNoLoader && 
                    !isDownload && !isMailTo && !isTel) {
                    
                    if (navigationTimeoutId) clearTimeout(navigationTimeoutId);
                    navigationTimeoutId = setTimeout(function() {
                        showLoader();
                    }, 100);
                }
            }
        });
        
        document.addEventListener('submit', function(e) {
            var form = e.target.closest('form');
            if (form && !form.hasAttribute('data-no-loader')) {
                if (navigationTimeoutId) clearTimeout(navigationTimeoutId);
                navigationTimeoutId = setTimeout(function() {
                    showLoader();
                }, 100);
            }
        });
        
        window.addEventListener('beforeunload', function() {
            if (navigationTimeoutId) clearTimeout(navigationTimeoutId);
            showLoader();
        });
        
        var originalPushState = history.pushState;
        var originalReplaceState = history.replaceState;
        
        history.pushState = function() {
            showLoader();
            originalPushState.apply(this, arguments);
            setTimeout(function() {
                if (loader && loader.style.display !== 'none') {
                    setTimeout(hideLoader, 500);
                }
            }, 800);
        };
        
        history.replaceState = function() {
            showLoader();
            originalReplaceState.apply(this, arguments);
            setTimeout(function() {
                if (loader && loader.style.display !== 'none') {
                    setTimeout(hideLoader, 500);
                }
            }, 800);
        };
        
        window.addEventListener('popstate', function() {
            showLoader();
            setTimeout(function() {
                if (loader && loader.style.display !== 'none') {
                    setTimeout(hideLoader, 500);
                }
            }, 800);
        });
    }
    
    window.PageLoader = {
        show: showLoader,
        hide: hideLoader,
        init: initLoader,
        setMinDisplayTime: function(time) {
            CONFIG.minDisplayTime = time;
        }
    };
    
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
