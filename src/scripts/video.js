// Plays YouTube videos on the site instead of sending visitors to YouTube.
// Any link to a single YouTube video (watch?v=, youtu.be/, shorts/) opens a
// full-screen player with a close button. Close, Esc, a tap outside the video
// or the phone's Back gesture all return to the page where the visitor was.
// Channel and playlist links still go to YouTube as before.
//
// The video starts by itself. Browsers that refuse to start it with sound
// (iPhone and iPad always do) get it muted, with YouTube's own "tap to unmute"
// button on the player. While it's open, the page's slideshow stops so only
// one video plays (older iPads stutter with two).

const ORIGIN = 'https://www.youtube-nocookie.com';
const SOUND_WAIT_MS = 2500; // not playing by then: retry muted

const IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export function parseVideo(href) {
  let url;
  try { url = new URL(href, location.href); } catch (e) { return null; }
  const host = url.hostname.replace(/^(www|m)\./, '');
  let id = '';
  let tall = false;
  if (host === 'youtu.be') id = url.pathname.slice(1, 12);
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const shorts = url.pathname.match(/^\/shorts\/([\w-]{11})/);
    const embed = url.pathname.match(/^\/embed\/([\w-]{11})/);
    if (shorts) { id = shorts[1]; tall = true; }
    else if (embed) id = embed[1];
    else if (url.pathname === '/watch') id = url.searchParams.get('v') || '';
  }
  if (!/^[\w-]{11}$/.test(id)) return null;
  const t = url.searchParams.get('t') || url.searchParams.get('start') || '';
  const m = t.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/);
  const start = m ? (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0) : 0;
  return { id, start, tall, href: url.href };
}

let installed = false;

export function initVideo() {
  if (installed) return;
  installed = true;

  let box = null; // the overlay, built on first use
  let frame = null;
  let state = -1;
  let wait = 0;
  let hello = 0;
  let opener = null; // focus returns here on close

  function build() {
    box = document.createElement('div');
    box.className = 'cc-vp';
    box.hidden = true;
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Video');
    box.innerHTML =
      '<button class="cc-vp-close" type="button" aria-label="Close video" title="Close">×</button>' +
      '<div class="cc-vp-stage"></div>' +
      '<p class="cc-vp-error" hidden>This video can only be played on YouTube. <a target="_blank" rel="noopener">Open it on YouTube ↗</a></p>';
    document.body.appendChild(box);
    box.querySelector('.cc-vp-close').addEventListener('click', () => close());
    // A tap on the dark area around the video closes it.
    box.addEventListener('click', (e) => { if (e.target === box || e.target.classList.contains('cc-vp-stage')) close(); });
  }

  const send = (func, args = []) => frame && frame.contentWindow &&
    frame.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args }), ORIGIN);

  window.addEventListener('message', (e) => {
    if (!frame || e.origin !== ORIGIN || e.source !== frame.contentWindow) return;
    let d;
    try { d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; } catch (err) { return; }
    if (!d) return;
    clearInterval(hello);
    if (d.event === 'onError') { showError(); return; }
    const s = d.event === 'onStateChange' ? d.info : d.info && d.info.playerState;
    if (typeof s === 'number') state = s;
  });

  function showError() {
    clearTimeout(wait);
    box.querySelector('.cc-vp-error').hidden = false;
    box.querySelector('.cc-vp-stage').hidden = true;
  }

  function open(video, link) {
    if (!box) build();
    opener = link;
    state = -1;
    const muted = IOS;
    const params = new URLSearchParams({
      autoplay: '1', mute: muted ? '1' : '0', playsinline: '1', rel: '0', modestbranding: '1',
      iv_load_policy: '3', enablejsapi: '1', origin: location.origin,
    });
    if (video.start) params.set('start', String(video.start));
    const stage = box.querySelector('.cc-vp-stage');
    stage.hidden = false;
    stage.classList.toggle('is-tall', video.tall);
    box.querySelector('.cc-vp-error').hidden = true;
    box.querySelector('.cc-vp-error a').href = video.href;
    frame = document.createElement('iframe');
    frame.title = 'Video';
    frame.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.src = `${ORIGIN}/embed/${video.id}?${params}`;
    frame.addEventListener('load', () => {
      const ask = () => frame && frame.contentWindow && frame.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), ORIGIN);
      ask();
      hello = setInterval(ask, 250);
      setTimeout(() => clearInterval(hello), 8000);
      // The browser wouldn't start it with sound: start it muted instead.
      if (!muted) wait = setTimeout(() => { if (state !== 1 && state !== 3) { send('mute'); send('playVideo'); } }, SOUND_WAIT_MS);
    }, { once: true });
    stage.textContent = '';
    stage.appendChild(frame);
    box.hidden = false;
    document.documentElement.classList.add('cc-vp-open');
    document.dispatchEvent(new CustomEvent('cc-video', { detail: { open: true } }));
    box.querySelector('.cc-vp-close').focus({ preventScroll: true });
    // Back closes the video instead of leaving the page.
    history.pushState({ ccVideo: true }, '');
  }

  function close(fromHistory = false) {
    if (!box || box.hidden) return;
    clearTimeout(wait);
    clearInterval(hello);
    box.hidden = true;
    box.querySelector('.cc-vp-stage').textContent = ''; // removing the player stops the video
    frame = null;
    document.documentElement.classList.remove('cc-vp-open');
    document.dispatchEvent(new CustomEvent('cc-video', { detail: { open: false } }));
    if (opener && opener.isConnected) opener.focus({ preventScroll: true });
    if (!fromHistory && history.state && history.state.ccVideo) history.back();
  }

  window.addEventListener('popstate', () => close(true));

  // Capture phase, so Esc closes the video and not the detail window under it.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && box && !box.hidden) { e.stopImmediatePropagation(); e.preventDefault(); close(); }
  }, true);

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const link = e.target.closest && e.target.closest('a[href]');
    if (!link || (box && box.contains(link))) return;
    const video = parseVideo(link.href);
    if (!video) return;
    e.preventDefault();
    open(video, link);
  });
}
