// Home and Work page behaviour, ported from the original Claude Design component:
//  - every card shows a random image from its series and re-picks every 6 s
//  - the slideshow at the top of the page (see slideshow.js)
//  - clicking a card opens the detail modal
//  - the Live button pulses while the YouTube channel is on air
//  - Contact / language dropdowns

import { initSlideshow } from './slideshow.js';

const img = (size, name) => `/img/${size}/${name}.webp`;
const pick = (list) => list[Math.floor(Math.random() * list.length)];

// Fix a card's image frame to the shape of the first image it shows. Later
// variants are letterboxed inside it, so the card never changes height and
// the masonry columns never reshuffle under the visitor.
function lockFrame(el) {
  const frame = el.parentElement;
  const lock = () => {
    if (frame.classList.contains('is-locked') || !el.naturalWidth) return;
    frame.style.aspectRatio = `${el.naturalWidth} / ${el.naturalHeight}`;
    frame.classList.add('is-locked');
  };
  if (el.complete) lock(); else el.addEventListener('load', lock, { once: true });
}

// Cross-fade a card to a new image: once the file has loaded, fade it in on
// top, then hand it to the card's own <img> and drop the overlay.
function fadeTo(el, src) {
  if (el.getAttribute('src') === src || el.dataset.pending) return;
  el.dataset.pending = src;
  const over = new Image();
  over.className = 'cc-card-fade';
  over.alt = '';
  over.onload = () => {
    el.parentElement.appendChild(over);
    requestAnimationFrame(() => requestAnimationFrame(() => over.classList.add('is-in')));
  };
  over.onerror = () => delete el.dataset.pending;
  over.addEventListener('transitionend', (e) => {
    if (e.propertyName !== 'opacity') return;
    el.src = src;
    el.decode().catch(() => {}).then(() => {
      over.remove();
      delete el.dataset.pending;
    });
  });
  over.src = src;
}

export function initHome(data) {
  const works = data.works;
  const current = works.map((w) => pick(w.variants));
  let openIdx = -1;

  // ---- cards -------------------------------------------------------------
  // A card's data-idx is its work; cards are matched by that, never by position.
  const cards = [...document.querySelectorAll('.cc-card')];
  const imgOf = (c) => c.querySelector('[data-card-img]');
  const workOf = (c) => Number(c.dataset.idx);
  const visible = new Set();

  cards.forEach((c) => {
    const el = imgOf(c);
    const src = img('sm', current[workOf(c)]);
    // Not fetched yet (lazy, below the fold): just point it at the pick.
    if (!el.complete) el.src = src; else fadeTo(el, src);
    lockFrame(el);
  });

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) visible.add(e.target); else visible.delete(e.target);
    }
  }, { rootMargin: '200px 0px' });
  cards.forEach((c) => io.observe(c));

  // Off-screen cards keep their image; there is no point downloading what
  // nobody is looking at. They pick up a fresh variant once scrolled to.
  setInterval(() => {
    if (document.hidden || openIdx !== -1) return;
    for (const c of visible) {
      const i = workOf(c);
      current[i] = pick(works[i].variants);
      fadeTo(imgOf(c), img('sm', current[i]));
    }
  }, 6000);

  initSlideshow(works, data.slides, img);

  // ---- modal -------------------------------------------------------------
  const overlay = document.querySelector('[data-overlay]');
  const $m = (k) => overlay.querySelector(`[data-m-${k}]`);
  let lastFocus = null;

  function openModal(i) {
    const w = works[i];
    openIdx = i;
    lastFocus = document.activeElement;
    $m('img').src = img('lg', current[i]);
    $m('img').alt = w.title;
    $m('title').textContent = w.title;
    $m('year').textContent = w.year;
    $m('year').hidden = !w.year;
    $m('medium').textContent = w.modalMedium;
    $m('extra').textContent = w.modalExtra;
    $m('extra').hidden = !w.modalExtra;
    $m('series').href = w.seriesLink || '#';
    $m('series').hidden = !w.seriesLink;
    // Series pages on this site open in place; outside links in a new tab.
    $m('series').target = /^https?:/.test(w.seriesLink) ? '_blank' : '_self';
    // Watercolours have no sample video: no play link, image isn't a link.
    $m('video').href = w.video || '#';
    $m('video').hidden = !w.video;
    $m('video-cover').href = w.video || '#';
    $m('video-cover').hidden = !w.video;
    overlay.hidden = false;
    overlay.querySelector('[data-close]').focus();
  }
  function closeModal() {
    if (openIdx === -1) return;
    openIdx = -1;
    overlay.hidden = true;
    $m('img').removeAttribute('src');
    if (lastFocus) lastFocus.focus();
  }

  document.querySelectorAll('.cc-works-grid').forEach((grid) => grid.addEventListener('click', (e) => {
    if (e.target.closest('[data-stop]')) return;
    const card = e.target.closest('.cc-card');
    if (card) openModal(Number(card.dataset.idx));
  }));
  cards.forEach((c) => c.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target === c) { e.preventDefault(); openModal(Number(c.dataset.idx)); }
  }));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  overlay.querySelector('[data-close]').addEventListener('click', closeModal);

  // ---- dropdown menus ----------------------------------------------------
  const menuBtns = [...document.querySelectorAll('[data-menu-btn]')];
  const menuOf = (btn) => document.getElementById(btn.getAttribute('aria-controls'));
  const closeMenus = (except) => menuBtns.forEach((b) => {
    if (b === except) return;
    b.setAttribute('aria-expanded', 'false');
    menuOf(b).hidden = true;
  });
  menuBtns.forEach((btn) => btn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeMenus(btn);
    const open = btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', String(open));
    menuOf(btn).hidden = !open;
  }));
  // Outside a menu, or on one of its links, close.
  document.addEventListener('click', (e) => { if (!e.target.closest('.cc-menu') || e.target.closest('.cc-menu a')) closeMenus(); });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    closeMenus();
    closeModal();
  });

  // ---- back to top -------------------------------------------------------
  // Shown once the slideshow is out of view.
  const toTop = document.querySelector('[data-to-top]');
  new IntersectionObserver(([e]) => toTop.classList.toggle('is-shown', !e.isIntersecting))
    .observe(document.querySelector('.cc-top'));

  // ---- light / dark ------------------------------------------------------
  // The initial theme is set by the inline script in <head>. Choosing one
  // here is remembered; until then the site follows the system setting.
  const root = document.documentElement;
  const themeBtn = document.querySelector('[data-theme-btn]');
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const systemDark = matchMedia('(prefers-color-scheme: dark)');
  // The animated logo is a same-origin iframe; it styles itself off this too.
  const logoFrame = document.querySelector('.cc-brand-name iframe');
  const syncLogo = () => {
    try { logoFrame.contentDocument.documentElement.setAttribute('data-theme', root.getAttribute('data-theme')); } catch (e) {}
  };
  logoFrame.addEventListener('load', syncLogo);
  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    syncLogo();
    const dark = theme === 'dark';
    themeBtn.setAttribute('aria-pressed', String(dark));
    themeBtn.setAttribute('aria-label', dark ? 'Light mode' : 'Dark mode');
    themeBtn.title = dark ? 'Light mode' : 'Dark mode';
    themeMeta.setAttribute('content', dark ? '#0e0f12' : '#0b1b33');
  }
  applyTheme(root.getAttribute('data-theme') || 'light');
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('cc-theme-ready')));
  themeBtn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem('cc-theme', next); } catch (e) {}
  });
  systemDark.addEventListener('change', (e) => {
    let saved = null;
    try { saved = localStorage.getItem('cc-theme'); } catch (err) {}
    if (!saved) applyTheme(e.matches ? 'dark' : 'light');
  });

  // ---- live status -------------------------------------------------------
  // /livecheck/ proxies YouTube's /channel/<id>/live page (netlify.toml, and
  // astro.config.mjs for local dev). Off air it is the channel page; on air a
  // watch page. Older pages: canonical watch?v=<id> plus isLiveNow:true (both
  // must hold — stray flags linger after a stream ends). Since Oct 2026 the
  // canonical is "undefined" and the sign is the view counter's isLive:true
  // ("N watching now").
  const liveBtn = document.querySelector('[data-live-btn]');
  function checkLive() {
    fetch(`/livecheck/${Date.now()}/${data.channel}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then((t) => {
        const canon = t.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
        const isWatch = !!(canon && /[?&]v=[\w-]{11}/.test(canon[1]));
        const liveNow = /"isLiveNow"\s*:\s*true/.test(t);
        const ended = /"endTimestamp"\s*:/.test(t);
        const watching = /"videoViewCountRenderer":\{[\s\S]{0,400}?"isLive":true/.test(t);
        liveBtn.classList.toggle('is-live', (isWatch && liveNow && !ended) || watching);
      })
      .catch(() => liveBtn.classList.remove('is-live'));
  }
  checkLive();
  setInterval(checkLive, 60000);
}
