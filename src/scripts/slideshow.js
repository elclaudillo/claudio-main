// The slideshow at the top of every page (components/Slideshow.astro): one
// slide per piece. The piece's image shows first and the YouTube player fades
// in over it, so a slow or blocked video still leaves the art on screen. It
// only runs while it's on screen, and not at all if the visitor prefers
// reduced motion (the arrows still work, showing the images).

const VIDEO_MS = 20000; // time on a piece with a sample video
const STILL_MS = 6000; // time on a piece without one
const PLAYER_DELAY_MS = 1500; // YouTube's spinner stays hidden behind the image
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

  function dropPlayer() {
    if (player) player.remove();
    player = null;
  }

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
      frame.src = w.embed;
      frame.addEventListener('load', () => setTimeout(() => frame.classList.add('is-in'), PLAYER_DELAY_MS), { once: true });
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
