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

  /* ── Floating spores in the hero ──────────────────────── */
  const sporeBox = document.getElementById('spores');
  if (sporeBox && !reduce) {
    const N = window.innerWidth < 700 ? 14 : 26;
    for (let i = 0; i < N; i++) {
      const s = document.createElement('span');
      s.className = 'spore';
      const size = 3 + Math.random() * 7;
      s.style.width = size + 'px';
      s.style.height = size + 'px';
      s.style.left = (Math.random() * 100) + '%';
      s.style.setProperty('--drift', (Math.random() * 120 - 60) + 'px');
      s.style.animationDuration = (14 + Math.random() * 16) + 's';
      s.style.animationDelay = (-Math.random() * 20) + 's';
      sporeBox.appendChild(s);
    }
  }

  /* ── Parallax: clouds drift + hills shift on scroll ───── */
  if (!reduce) {
    const clouds = Array.from(document.querySelectorAll('.cloud'));
    let t0 = null;
    function drift(ts) {
      if (t0 === null) t0 = ts;
      const el = (ts - t0) / 1000;
      clouds.forEach(c => {
        const speed = parseFloat(c.dataset.speed) || 20;   // px / s
        const w = window.innerWidth + 400;
        const x = (el * speed) % w;
        c.style.transform = `translateX(${x}px)`;
      });
      requestAnimationFrame(drift);
    }
    requestAnimationFrame(drift);

    const hillEls = Array.from(document.querySelectorAll('[data-hill]'));
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      hillEls.forEach(h => {
        const depth = parseInt(h.dataset.hill, 10);
        h.setAttribute('transform', `translate(0 ${y * depth * 0.03})`);
      });
    }, { passive: true });
  }

  /* ══════════════════════════════════════════════════════
     ENGINE DEMO
     ══════════════════════════════════════════════════════ */
  const PAPERS = [
    {
      icon: '🧬',
      outputs: [
        { t: 'How proteins get their shape', p: 'A 5-lesson unit on amino acids, folding, and why 3-D shape decides what a molecule can do — pitched for grades 9–12.' },
        { t: 'Fold-it-yourself protein viewer', p: 'An interactive where students rotate a real predicted structure and watch confidence scores light up region by region.' },
        { t: 'Paper-model folding kit', p: 'Print-and-fold polypeptide chains with magnetic residues, so a class can build a protein by hand from its sequence.' },
      ],
    },
    {
      icon: '🍄',
      outputs: [
        { t: 'Rules that grow patterns', p: 'A unit on emergence: how simple local rules make complex, self-repairing patterns — bridging biology, math, and CS.' },
        { t: 'Grow-a-creature sandbox', p: 'A browser toy where students paint a seed, run the rules, damage the result, and watch it heal itself back.' },
        { t: 'Cellular-automata card game', p: 'A tabletop kit of rule cards and a grid mat where players "run" an automaton by hand, round by round.' },
      ],
    },
    {
      icon: '✂️',
      outputs: [
        { t: 'Rewriting a single letter', p: 'A unit on the DNA alphabet, point mutations, and how base editors change one letter without cutting the strand.' },
        { t: 'DNA base-editor simulator', p: 'An interactive where students target a mutation, choose an editor, and see on-target vs. off-target effects play out.' },
        { t: 'Bead-model DNA kit', p: 'A color-coded bead strand and swap-tool so learners physically perform a base edit and read the new codon.' },
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
