/* ============================================================
   GLOBAL.JS — Les Ateliers Bertin
   Utilitaires JavaScript partagés par toutes les pages.
   ============================================================ */


/* ── 1. UTILITAIRES DE FORMATAGE ── */
function fmt(n)  { if (isNaN(n)) return '—'; return Math.round(n).toLocaleString('fr-FR') + ' €'; }
function fmtK(n) { if (isNaN(n)) return '—'; const a = Math.abs(Math.round(n)); return a >= 1000 ? Math.round(a / 1000) + 'k' : a; }
function g(id)   { return parseFloat(document.getElementById(id).value) || 0; }
function s(id,v) { const el = document.getElementById(id); if (el) el.textContent = v; }
function e(ev)   { ev.stopPropagation(); }


/* ── 2. TOAST ── */
let _toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}


/* ── 3. ACCORDÉONS ── */
function setAccordion(item, open) {
  item.classList.toggle('open', open);
  const trig = item.querySelector('.acc-trig');
  if (trig) trig.setAttribute('aria-expanded', String(open));
}
function toggle(item) {
  const open = item.classList.contains('open');
  document.querySelectorAll('.acc-item.open').forEach(el => { if (el !== item) setAccordion(el, false); });
  setAccordion(item, !open);
}


/* ── 4. NAVIGATION : page active, ombre au scroll, menu mobile ── */
(function initNav() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-menu a, .footer-links a').forEach(link => {
    if (link.getAttribute('href') === page) link.setAttribute('aria-current', 'page');
  });

  const header = document.querySelector('.site-header');
  if (!header) return;

  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 4);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const btn = header.querySelector('.nav-toggle');
  if (!btn) return;
  const setMenu = open => {
    document.body.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
  };
  btn.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  header.querySelectorAll('.nav-menu a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  window.addEventListener('keydown', ev => { if (ev.key === 'Escape') setMenu(false); });
  window.matchMedia('(min-width: 761px)').addEventListener('change', mq => { if (mq.matches) setMenu(false); });
})();


/* ── 5. SOUS-NAVIGATION : section visible ── */
(function initSubnav() {
  const links = [...document.querySelectorAll('.subnav-links a[href^="#"]')];
  if (!links.length || !('IntersectionObserver' in window)) return;
  const byId = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      links.forEach(a => a.classList.remove('is-active'));
      const link = byId.get(entry.target.id);
      if (!link) return;
      link.classList.add('is-active');
      const bar = link.parentElement;
      if (bar.scrollWidth > bar.clientWidth) bar.scrollTo({ left: link.offsetLeft - 16, behavior: 'smooth' });
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  byId.forEach((_, id) => { const el = document.getElementById(id); if (el) obs.observe(el); });
})();


/* ── 6. APPARITION AU SCROLL ── */
(function initReveal() {
  const els = document.querySelectorAll('.reveal, .scroll-reveal');
  if (!els.length) return;
  if (!('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('visible')); return; }
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => obs.observe(el));
})();


/* ── 7. COMPTEURS ANIMÉS ── */
(function initCounters() {
  const els = document.querySelectorAll('[data-count]');
  if (!els.length) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el     = entry.target;
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      obs.unobserve(el);
      if (reduce) { el.textContent = target.toLocaleString('fr-FR') + suffix; return; }
      const dur = 1100;
      const t0  = performance.now();
      (function tick(now) {
        const p = Math.min((now - t0) / dur, 1);
        const v = 1 - Math.pow(1 - p, 4);
        el.textContent = Math.round(v * target).toLocaleString('fr-FR') + suffix;
        if (p < 1) requestAnimationFrame(tick);
      })(performance.now());
    });
  }, { threshold: .4 });
  els.forEach(el => obs.observe(el));
})();
