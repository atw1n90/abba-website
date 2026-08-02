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

    /* ----------- Homepage: one-pager request modal ----------- */
    const opBtn = document.getElementById('onePagerBtn');
    const opModal = document.getElementById('onePagerModal');
    // Localized status messages — Spanish on the /es/ pages (html lang="es"), English otherwise.
    const isES = (document.documentElement.lang || '').toLowerCase().indexOf('es') === 0;
    const opMsg = isES
        ? {
            sending: 'Enviando…',
            ok: 'Revise su bandeja de entrada — su hoja informativa va en camino.',
            err: 'Algo salió mal. Escríbanos a info@abbaglobalcorp.com.',
            conn: 'No se pudo conectar. Escríbanos a info@abbaglobalcorp.com.',
        }
        : {
            sending: 'Sending…',
            ok: 'Check your inbox — your one-pager is on the way.',
            err: 'Something went wrong. Please email info@abbaglobalcorp.com.',
            conn: 'Could not connect. Please email info@abbaglobalcorp.com.',
        };
    if (opBtn && opModal && typeof opModal.showModal === 'function') {
        const opForm = opModal.querySelector('.op-form');
        const opStatus = opModal.querySelector('.op-status');
        const opSubmit = opModal.querySelector('.op-submit');

        const openModal = () => {
            opStatus.textContent = '';
            opStatus.className = 'op-status';
            opModal.showModal();
        };
        opBtn.addEventListener('click', openModal);
        // Close on the small × or a click on the dark backdrop
        opModal.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => opModal.close()));
        opModal.addEventListener('click', (e) => { if (e.target === opModal) opModal.close(); });

        opForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const endpoint = opForm.dataset.endpoint;
            const payload = Object.fromEntries(new FormData(opForm).entries());
            opSubmit.disabled = true;
            opStatus.className = 'op-status';
            opStatus.textContent = opMsg.sending;
            try {
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                if (res.ok) {
                    opForm.reset();
                    opStatus.className = 'op-status op-ok';
                    opStatus.textContent = opMsg.ok;
                } else {
                    const j = await res.json().catch(() => ({}));
                    opStatus.className = 'op-status op-err';
                    opStatus.textContent = j.error || opMsg.err;
                }
            } catch (err) {
                opStatus.className = 'op-status op-err';
                opStatus.textContent = opMsg.conn;
            } finally {
                opSubmit.disabled = false;
            }
        });
    } else if (opBtn) {
        // Fallback for browsers without <dialog> support: open a pre-filled email
        opBtn.addEventListener('click', () => {
            window.location.href = 'mailto:info@abbaglobalcorp.com?subject=One-Pager%20Request';
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
        return Math.min(idx, 8) * 110;
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

    /* ----------- 3D tilt on cards (hover) ----------- */
    const tiltSelector = '.service-card, .why-card, .fleet-card';
    if (!prefersReducedMotion && window.matchMedia('(hover: hover)').matches) {
        const tiltCards = document.querySelectorAll(tiltSelector);
        tiltCards.forEach((card) => {
            card.style.transformStyle = 'preserve-3d';
            card.style.transition = (card.style.transition || '') + ', transform .15s ease-out';
            let raf = 0;
            const onMove = (e) => {
                if (raf) return;
                raf = requestAnimationFrame(() => {
                    raf = 0;
                    const rect = card.getBoundingClientRect();
                    const x = (e.clientX - rect.left) / rect.width - 0.5;
                    const y = (e.clientY - rect.top) / rect.height - 0.5;
                    const max = 6; // degrees
                    const rx = (-y * max).toFixed(2);
                    const ry = (x * max).toFixed(2);
                    card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
                });
            };
            const onLeave = () => {
                if (raf) cancelAnimationFrame(raf);
                raf = 0;
                card.style.transform = '';
            };
            card.addEventListener('mousemove', onMove);
            card.addEventListener('mouseleave', onLeave);
        });
    }

    /* ----------- Magnetic gold CTAs ----------- */
    if (!prefersReducedMotion && window.matchMedia('(hover: hover)').matches) {
        const magneticBtns = document.querySelectorAll('.btn-gold');
        magneticBtns.forEach((btn) => {
            const radius = 90;
            const strength = 0.28;
            let raf = 0;
            const onMove = (e) => {
                if (raf) return;
                raf = requestAnimationFrame(() => {
                    raf = 0;
                    const rect = btn.getBoundingClientRect();
                    const cx = rect.left + rect.width / 2;
                    const cy = rect.top + rect.height / 2;
                    const dx = e.clientX - cx;
                    const dy = e.clientY - cy;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > radius + Math.max(rect.width, rect.height) / 2) {
                        btn.style.transform = '';
                        return;
                    }
                    btn.style.transform = `translate(${(dx * strength).toFixed(2)}px, ${(dy * strength).toFixed(2)}px)`;
                });
            };
            const onLeave = () => {
                if (raf) cancelAnimationFrame(raf);
                raf = 0;
                btn.style.transform = '';
            };
            btn.style.transition = 'transform .2s cubic-bezier(0.16, 1, 0.3, 1), background .25s ease, box-shadow .25s ease';
            btn.addEventListener('mousemove', onMove);
            btn.addEventListener('mouseleave', onLeave);
        });
    }

})();
