/* ============================================================
   Cultigen — main.js
   Painted scenery + scroll reveal + the engine demo
   ============================================================ */
(function () {
  'use strict';

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Navigation ───────────────────────────────────────── */
  const nav       = document.getElementById('nav');
  const mobileNav = document.getElementById('mobile-nav');
  const toggle    = document.querySelector('.nav-toggle');
  const hero      = document.querySelector('.hero');

  nav.classList.add('on-dark'); // hero is light-painted → dark text

  function updateNav() {
    const past = window.scrollY > (hero ? hero.offsetHeight * 0.6 : 60);
    nav.classList.toggle('scrolled', past);
  }
  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  if (toggle && mobileNav) {
    toggle.addEventListener('click', () => {
      const open = mobileNav.classList.toggle('open');
      toggle.textContent = open ? '✕' : '☰';
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', e => {
      if (!nav.contains(e.target) && !mobileNav.contains(e.target)) {
        mobileNav.classList.remove('open');
        toggle.textContent = '☰';
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
    mobileNav.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        toggle.textContent = '☰';
        toggle.setAttribute('aria-expanded', 'false');
      })
    );
  }

  /* ── Scroll reveal ────────────────────────────────────── */
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.08 });
    reveals.forEach(el => io.observe(el));
  }
  document.querySelectorAll('[data-stagger]').forEach(parent => {
    Array.from(parent.children).forEach((child, i) => {
      child.style.transitionDelay = (i * 90) + 'ms';
    });
  });

  /* ── Year ─────────────────────────────────────────────── */
  document.querySelectorAll('.year').forEach(el => { el.textContent = new Date().getFullYear(); });

  /* ── Shared pointer state for the hero ────────────────── */
  // canvas-space mouse for spores; -9999 = "off screen"
  const pointer = { x: -9999, y: -9999, inside: false };

  /* ── Parallax: hero art + interactive sunlight (mouse) ── */
  const heroArt = document.querySelector('.hero-art');
  const sunGlow = document.getElementById('hero-sun-glow');
  if (!reduce && (heroArt || sunGlow)) {
    let sy = 0, mx = 0, my = 0, raf = null;
    function apply() {
      if (heroArt) heroArt.style.transform = `translate3d(${mx}px, ${sy * 0.14 + my}px, 0)`;
      // sunlight drifts with the cursor and can grow — feels like light stirring
      if (sunGlow) sunGlow.style.transform =
        `translate(calc(-50% + ${mx * 3.6}px), calc(-50% + ${my * 3}px)) scale(var(--sun-scale,1))`;
      raf = null;
    }
    function schedule() { if (raf === null) raf = requestAnimationFrame(apply); }
    window.addEventListener('scroll', () => { sy = window.scrollY; schedule(); }, { passive: true });
    window.addEventListener('mousemove', e => {
      mx = (e.clientX / window.innerWidth - .5) * 16;
      my = (e.clientY / window.innerHeight - .5) * 10;
      // brighten + grow the sunlight as the cursor nears its home (≈46%/34%)
      if (sunGlow) {
        const near = 1 - Math.min(1, Math.hypot(e.clientX / window.innerWidth - .46,
                                                 e.clientY / window.innerHeight - .34) * 1.3);
        sunGlow.style.setProperty('--sun-boost', (0.8 + near * 0.55).toFixed(3));
        sunGlow.style.setProperty('--sun-scale', (1 + near * 0.18).toFixed(3));
      }
      schedule();
    }, { passive: true });
  }

  /* ── Interactive light points (spores) on canvas ──────── */
  const canvas = document.getElementById('spore-canvas');
  if (canvas && !reduce) {
    const ctx = canvas.getContext('2d');

    // pre-rendered soft glow sprite (fast to blit each frame)
    const S = 40, sprite = document.createElement('canvas');
    sprite.width = sprite.height = S;
    const sc = sprite.getContext('2d');
    const sg = sc.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    sg.addColorStop(0, 'rgba(255,251,226,1)');
    sg.addColorStop(0.35, 'rgba(255,244,206,0.55)');
    sg.addColorStop(1, 'rgba(255,244,206,0)');
    sc.fillStyle = sg; sc.fillRect(0, 0, S, S);

    let W = 0, H = 0, dpr = 1, parts = [];
    function mk(fromBottom) {
      return {
        x: Math.random() * W,
        y: fromBottom ? H + Math.random() * 40 : Math.random() * H,
        r: 1 + Math.random() * 3,
        vy: 0.12 + Math.random() * 0.4,
        ph: Math.random() * Math.PI * 2,
        ps: 0.004 + Math.random() * 0.01,
        amp: 0.15 + Math.random() * 0.7,
        a: 0.35 + Math.random() * 0.6
      };
    }
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = Math.max(16, Math.round(W / 42));
      parts = Array.from({ length: target }, () => mk(false));
    }
    function tick() {
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      const R = 130;
      for (const p of parts) {
        if (pointer.inside) {              // cursor repels nearby points
          const dx = p.x - pointer.x, dy = p.y - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < R * R) {
            const d = Math.sqrt(d2) || 1, f = (1 - d / R) * 2.6;
            p.x += (dx / d) * f; p.y += (dy / d) * f;
          }
        }
        p.ph += p.ps;
        p.x += Math.sin(p.ph) * p.amp;
        p.y -= p.vy;
        if (p.y < -12) Object.assign(p, mk(true));
        if (p.x < -12) p.x = W + 12; else if (p.x > W + 12) p.x = -12;
        const s = p.r * 6;
        ctx.globalAlpha = p.a;
        ctx.drawImage(sprite, p.x - s / 2, p.y - s / 2, s, s);
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      requestAnimationFrame(tick);
    }
    function onMove(e) {
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      pointer.inside = pointer.y >= 0 && pointer.y <= r.height;
    }
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseout', () => { pointer.inside = false; }, { passive: true });
    window.addEventListener('resize', resize, { passive: true });
    resize(); requestAnimationFrame(tick);
  }

  /* ══════════════════════════════════════════════════════
     ENGINE DEMO
     ══════════════════════════════════════════════════════ */
  const PAPERS = [
    { // 0 — frontier paper
      icon: '🧬',
      outputs: [
        { t: 'How proteins get their shape', p: 'A 5-lesson unit on amino acids, folding, and why 3-D shape decides what a molecule can do — pitched for grades 9–12.' },
        { t: 'Fold-it-yourself protein viewer', p: 'An interactive where students rotate a real predicted structure and watch confidence scores light up region by region.' },
        { t: 'Paper-model folding kit', p: 'Print-and-fold polypeptide chains with magnetic residues, so a class can build a protein by hand from its sequence.' },
      ],
    },
    { // 1 — industry process
      icon: '🔋',
      outputs: [
        { t: 'How a battery is really made', p: 'A unit on electrochemistry and energy storage — how ions shuttle between electrodes — grounded in how real gigafactory lines coat, stack, and seal a cell.' },
        { t: 'Build-a-cell simulator', p: 'An interactive where students choose anode, cathode and electrolyte and watch capacity, safety and cost trade off against each other.' },
        { t: 'Safe coin-cell kit', p: 'Assemble a working coin-cell by hand and measure its real charge/discharge curve — the factory process, shrunk to a desk.' },
      ],
    },
    { // 2 — a product
      icon: '☕',
      outputs: [
        { t: 'The physics of a shot', p: 'A unit on pressure, heat transfer and solubility — the science of extraction — reverse-engineered from a machine students use every day.' },
        { t: 'Espresso extraction simulator', p: 'An interactive where students dial in grind, pressure and temperature and watch the shot — and the flavor — change in real time.' },
        { t: 'See-through brew kit', p: 'A clear-chamber brewer that makes pressure and flow visible, so learners can watch extraction actually happen.' },
      ],
    },
    { // 3 — frontier paper
      icon: '🍄',
      outputs: [
        { t: 'Rules that grow patterns', p: 'A unit on emergence: how simple local rules make complex, self-repairing patterns — bridging biology, math, and CS.' },
        { t: 'Grow-a-creature sandbox', p: 'A browser toy where students paint a seed, run the rules, damage the result, and watch it heal itself back.' },
        { t: 'Cellular-automata card game', p: 'A tabletop kit of rule cards and a grid mat where players "run" an automaton by hand, round by round.' },
      ],
    },
  ];

  const demo = document.getElementById('engine-demo');
  if (demo) {
    const chips   = Array.from(document.querySelectorAll('.pchip'));
    const runBtn  = document.getElementById('run-btn');
    const pod     = document.getElementById('pod');
    const steps   = Array.from(document.querySelectorAll('.step'));
    const outs    = Array.from(document.querySelectorAll('.oc'));
    const hint    = document.getElementById('hint');
    const stageSp = document.getElementById('stage-spores');
    let selected  = 0;
    let running   = false;
    let timers    = [];

    // stage ambient spores
    if (stageSp && !reduce) {
      for (let i = 0; i < 14; i++) {
        const s = document.createElement('span');
        s.className = 'stage-spore';
        s.style.left = (Math.random() * 100) + '%';
        s.style.bottom = '0';
        s.style.animationDuration = (5 + Math.random() * 6) + 's';
        s.style.animationDelay = (-Math.random() * 8) + 's';
        stageSp.appendChild(s);
      }
    }

    function clearTimers() { timers.forEach(clearTimeout); timers = []; }

    function reset() {
      steps.forEach(s => s.classList.remove('on'));
      outs.forEach(o => o.classList.remove('show'));
      pod.classList.remove('running');
    }

    function fillOutputs(paper) {
      paper.outputs.forEach((o, i) => {
        document.getElementById('o' + i + '-t').textContent = o.t;
        document.getElementById('o' + i + '-p').textContent = o.p;
      });
    }

    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        if (running) return;
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        selected = parseInt(chip.dataset.paper, 10);
        reset();
        hint.textContent = 'Press “Run Cultigen” to begin ↑';
      });
    });

    function run() {
      if (running) return;
      running = true;
      clearTimers();
      reset();
      const paper = PAPERS[selected];
      fillOutputs(paper);
      pod.classList.add('running');
      runBtn.textContent = '⟳ Running…';
      runBtn.disabled = true;

      const stepDelay = reduce ? 120 : 850;

      steps.forEach((step, i) => {
        timers.push(setTimeout(() => {
          step.classList.add('on');
          hint.textContent = step.querySelector('.s-t').childNodes[0].textContent.trim() + '…';
        }, stepDelay * (i + 1)));
      });

      // bloom outputs after the pipeline
      const bloomStart = stepDelay * (steps.length + 1);
      outs.forEach((o, i) => {
        timers.push(setTimeout(() => o.classList.add('show'), bloomStart + i * (reduce ? 60 : 260)));
      });

      timers.push(setTimeout(() => {
        pod.classList.remove('running');
        hint.textContent = '✓ Package ready — content · asset · kit';
        runBtn.textContent = '↻ Run again';
        runBtn.disabled = false;
        running = false;
      }, bloomStart + outs.length * (reduce ? 60 : 260) + 300));
    }

    runBtn.addEventListener('click', run);
  }

})();
