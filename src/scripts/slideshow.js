// The slideshow at the top of every page (components/Slideshow.astro): one
// slide per piece. The piece's image shows first and the YouTube player fades
// in over it only once the video has been playing for a few seconds, past
// YouTube's title/logo overlay and the buffering jump at the start. A slow or
// blocked video just leaves the art on screen. It
// only runs while it's on screen, and not at all if the visitor prefers
// reduced motion (the arrows still work, showing the images).

const VIDEO_MS = 20000; // time on a piece with a sample video
const STILL_MS = 6000; // time on a piece without one
const REVEAL_MS = 3500; // playing this long before the player shows: YouTube's title bar has faded by then
const ORIGIN = 'https://www.youtube-nocookie.com';
const FADE_MS = 500; // matches the .cc-show-img transition in site.css

export function initSlideshow(works, slideIdx, img) {
  const root = document.querySelector('[data-show]');
  if (!root) return;
  const $ = (k) => root.querySelector(`[data-show-${k}]`);
  const stage = $('stage');
  const count = slideIdx.length;
  const motion = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  let index = 0;
  let paused = !motion;
  let onScreen = true;
  let timer = 0;
  let player = null;
  let image = $('img');
  let change = 0; // guards against an image finishing after a newer slide started
  let swapping = false; // between slides: go() restarts the slide when it's done

  const work = () => works[slideIdx[index]];

  let hello = 0; // repeats the "listening" handshake until the player answers
  let reveal = 0;

  function dropPlayer() {
    clearInterval(hello);
    clearTimeout(reveal);
    reveal = 0;
    if (player) player.remove();
    player = null;
  }

  // The embed reports its state by postMessage (YouTube's iframe API protocol)
  // once told we're listening. playerState 1 = playing.
  window.addEventListener('message', (e) => {
    if (!player || e.origin !== ORIGIN || e.source !== player.contentWindow) return;
    let d;
    try { d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; } catch (err) { return; }
    clearInterval(hello);
    if (!d) return;
    const state = d.event === 'onStateChange' ? d.info : d.info && d.info.playerState;
    if (state === 1 && !reveal) {
      const frame = player;
      reveal = setTimeout(() => { if (frame === player) frame.classList.add('is-in'); }, REVEAL_MS);
    }
  });

  // Start or stop the current slide to match the page state.
  function sync() {
    if (swapping) return;
    clearTimeout(timer);
    const running = !paused && onScreen && !document.hidden;
    if (!running) { dropPlayer(); return; }
    const w = work();
    if (w.embed && !player) {
      const frame = document.createElement('iframe');
      frame.className = 'cc-show-player';
      frame.title = w.title;
      frame.allow = 'autoplay; encrypted-media';
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      frame.tabIndex = -1;
      frame.src = `${w.embed}&enablejsapi=1&origin=${encodeURIComponent(location.origin)}`;
      frame.addEventListener('load', () => {
        const ask = () => frame.contentWindow && frame.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), ORIGIN);
        ask();
        hello = setInterval(ask, 250);
        setTimeout(() => clearInterval(hello), 10000);
      }, { once: true });
      image.after(frame);
      player = frame;
    }
    if (count > 1) timer = setTimeout(() => go(index + 1), w.embed ? VIDEO_MS : STILL_MS);
  }

  function setCaption(w) {
    $('title').textContent = w.title;
    $('year').textContent = w.year;
    $('year').hidden = !w.year;
    $('medium').textContent = w.medium;
    $('count').textContent = `${index + 1} / ${count}`;
    for (const el of [$('play'), $('link')]) {
      el.href = w.video || '#';
      el.hidden = !w.video;
    }
    $('series').href = w.seriesLink || '#';
    $('series').hidden = !w.seriesLink;
  }

  // Fade the current slide out to the black stage, then the next one in. The
  // pieces have different shapes, so a cross-fade would leave the old image
  // showing around the edges of the new one.
  function go(k) {
    index = (k + count) % count;
    const w = work();
    const ticket = ++change;
    clearTimeout(timer);
    swapping = true;
    const next = new Image();
    next.className = 'cc-show-img';
    next.alt = w.title;
    next.decoding = 'async';
    next.onload = next.onerror = () => {
      if (ticket !== change) return;
      setCaption(w);
      image.classList.remove('is-in');
      if (player) player.classList.remove('is-in');
      setTimeout(() => {
        if (ticket !== change) return;
        dropPlayer();
        image.replaceWith(next);
        image = next;
        requestAnimationFrame(() => requestAnimationFrame(() => next.classList.add('is-in')));
        swapping = false;
        sync();
      }, FADE_MS);
    };
    next.src = img('lg', w.variants[0]);
  }

  if (count > 1) {
    $('prev').addEventListener('click', () => go(index - 1));
    $('next').addEventListener('click', () => go(index + 1));
    const pause = $('pause');
    const showPaused = () => {
      pause.setAttribute('aria-pressed', String(paused));
      pause.setAttribute('aria-label', paused ? 'Play slideshow' : 'Pause slideshow');
      pause.textContent = paused ? '▶' : '❚❚';
    };
    pause.addEventListener('click', () => { paused = !paused; showPaused(); sync(); });
    showPaused();
  }

  document.addEventListener('visibilitychange', sync);
  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; sync(); }, { threshold: 0.25 }).observe(stage);
}
