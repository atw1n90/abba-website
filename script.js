/* =========================================================
   ABBA GLOBAL CORP — MULTI-PAGE SITE INTERACTIONS
   - Active sticky-nav highlight (per page)
   - Homepage truck drive-in animation trigger
   - IntersectionObserver reveal animations (inner pages)
   - Subtle parallax on tagged elements
   - Footer year
   ========================================================= */

(function () {
    'use strict';

    /* ----------- Footer year ----------- */
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    /* ----------- Active sticky-nav highlight by body.page-X class ----------- */
    const bodyClass = document.body.className || '';
    const pageMatch = bodyClass.match(/page-(\w+)/);
    if (pageMatch) {
        const activeLink = document.querySelector('.sticky-nav a[data-page="' + pageMatch[1] + '"]');
        if (activeLink) activeLink.classList.add('active');
    }

    /* ----------- Homepage: trigger truck drive-in on load ----------- */
    const truckHome = document.querySelector('.truck-home');
    if (truckHome) {
        requestAnimationFrame(() => {
            setTimeout(() => truckHome.classList.add('truck-animated'), 60);
        });
    }

    /* ----------- IntersectionObserver: reveal animations (inner pages) ----------- */
    const revealEls = document.querySelectorAll('.fade-in, .slide-up, .slide-left, .slide-right, .zoom-in');

    function computeStagger(el) {
        const parent = el.parentElement;
        if (!parent) return 0;
        const siblings = Array.from(parent.children).filter(c =>
            c.classList.contains('fade-in') ||
            c.classList.contains('slide-up') ||
            c.classList.contains('slide-left') ||
            c.classList.contains('slide-right') ||
            c.classList.contains('zoom-in')
        );
        if (siblings.length <= 1) return 0;
        const idx = siblings.indexOf(el);
        if (idx < 0) return 0;
        return Math.min(idx, 5) * 90;
    }

    if ('IntersectionObserver' in window && revealEls.length) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const delay = computeStagger(el);
                    if (delay) el.style.transitionDelay = (delay / 1000) + 's';
                    el.classList.add('visible');
                    observer.unobserve(el);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        revealEls.forEach(el => observer.observe(el));
    } else {
        revealEls.forEach(el => el.classList.add('visible'));
    }

    /* ----------- Subtle parallax on tagged elements ----------- */
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const parallaxEls = document.querySelectorAll('[data-parallax]');
    let parallaxTicking = false;

    function applyParallax() {
        const viewportH = window.innerHeight;
        parallaxEls.forEach((el) => {
            const rect = el.getBoundingClientRect();
            if (rect.bottom < -100 || rect.top > viewportH + 100) return;
            const speed = parseFloat(el.dataset.parallax) || 0.12;
            const center = rect.top + rect.height / 2;
            const offset = (center - viewportH / 2) * speed * -1;
            el.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
        });
        parallaxTicking = false;
    }
    function onScrollParallax() {
        if (!parallaxTicking) {
            requestAnimationFrame(applyParallax);
            parallaxTicking = true;
        }
    }
    if (!prefersReducedMotion && parallaxEls.length) {
        window.addEventListener('scroll', onScrollParallax, { passive: true });
        applyParallax();
    }

})();
