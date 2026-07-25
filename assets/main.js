/* artineer — main.js */
(function () {

  // ── Navigation ──────────────────────────────────────────
  const nav       = document.querySelector('.nav');
  const mobileNav = document.getElementById('mobile-nav');
  const toggle    = document.querySelector('.nav-toggle');
  const hero      = document.querySelector('[data-dark-hero]');

  if (hero) nav.classList.add('on-dark');
  else      nav.classList.add('on-light');

  function updateNav() {
    const past = window.scrollY > (hero ? hero.offsetHeight * 0.7 : 60);
    nav.classList.toggle('scrolled', past);
  }
  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  // Mobile menu
  if (toggle && mobileNav) {
    toggle.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
      toggle.textContent = mobileNav.classList.contains('open') ? '✕' : '☰';
    });
    document.addEventListener('click', e => {
      if (!nav.contains(e.target) && !mobileNav.contains(e.target)) {
        mobileNav.classList.remove('open');
        toggle.textContent = '☰';
      }
    });
    // Close on link click
    mobileNav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        toggle.textContent = '☰';
      });
    });
  }

  // ── Scroll Reveal ────────────────────────────────────────
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.08 });
    reveals.forEach(el => io.observe(el));
  }

  // ── Staggered reveal for grid children ───────────────────
  document.querySelectorAll('[data-stagger]').forEach(parent => {
    const children = parent.children;
    Array.from(children).forEach((child, i) => {
      child.style.transitionDelay = (i * 80) + 'ms';
    });
  });

  // ── Year ─────────────────────────────────────────────────
  document.querySelectorAll('.year').forEach(el => {
    el.textContent = new Date().getFullYear();
  });

})();

/* ===========================================================
   Paper stacks — hover peel + click to open reader modal
   =========================================================== */
(function () {
  document.querySelectorAll('.paper-stack').forEach(function (stack) {
    var pages = Array.from(stack.querySelectorAll('.ps-page'));

    pages.forEach(function (page, index) {
      page.addEventListener('mouseenter', function () {
        pages.forEach(function (p, i) {
          if (i > index) {
            p.style.transitionDelay = ((i - index - 1) * 55) + 'ms';
            p.style.zIndex = '20';
            p.classList.add('is-peel');
          }
        });
      });
    });

    stack.addEventListener('mouseleave', function () {
      pages.forEach(function (p) {
        p.classList.remove('is-peel');
        p.style.zIndex = '';
        p.style.transitionDelay = '';
      });
    });

    stack.addEventListener('click', function () {
      var base  = stack.dataset.base;
      var total = parseInt(stack.dataset.pages, 10) || 8;
      paperModal.open(base, total, 1);
    });
  });

  /* Preview-pages buttons (text trigger) */
  document.querySelectorAll('[data-preview-paper]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var base  = btn.dataset.previewPaper;
      var total = parseInt(btn.dataset.pages, 10) || 8;
      paperModal.open(base, total, 1);
    });
  });
})();

/* ===========================================================
   Multi-paper reader modal
   =========================================================== */
var paperModal = (function () {
  var modal    = document.getElementById('paper-modal');
  if (!modal) return { open: function () {} };

  var img      = modal.querySelector('.pm-img');
  var curEl    = document.getElementById('pm-cur');
  var totEl    = document.getElementById('pm-tot');
  var btnPrev  = modal.querySelector('.pm-prev');
  var btnNext  = modal.querySelector('.pm-next');
  var backdrop = modal.querySelector('.pm-backdrop');
  var closeBtn = modal.querySelector('.pm-close');

  var current  = 1;
  var total    = 8;
  var basePath = '';

  function show(n) {
    current = Math.max(1, Math.min(total, n));
    var pad = current < 10 ? '0' + current : '' + current;
    img.src = basePath + 'page-' + pad + '.jpg';
    curEl.textContent = current;
    totEl.textContent = total;
    btnPrev.disabled = (current === 1);
    btnNext.disabled = (current === total);
  }

  function open(base, tot, startPage) {
    basePath = base;
    total    = tot || 8;
    show(startPage || 1);
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    setTimeout(function () { img.src = ''; }, 300);
  }

  btnPrev.addEventListener('click', function () { show(current - 1); });
  btnNext.addEventListener('click', function () { show(current + 1); });
  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', close);

  document.addEventListener('keydown', function (e) {
    if (!modal.classList.contains('is-open')) return;
    if (e.key === 'Escape')     close();
    if (e.key === 'ArrowLeft')  show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });

  return { open: open, close: close };
})();
