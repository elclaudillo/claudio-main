// Home page hero (components/Hero.astro): cross-fades through the slideshow
// works every 5 s with a 2 s fade, still images only. Clicking the image
// opens the piece's video on YouTube when it has one.

export function initHero(works, slideIdx, img) {
  const cur = document.querySelector('[data-hero-cur]');
  if (!cur || !slideIdx.length) return;
  const prev = document.querySelector('[data-hero-prev]');
  const link = document.querySelector('[data-hero-link]');
  let index = 0;

  const setMeta = (w) => {
    if (w.video) link.href = w.video; else link.removeAttribute('href');
    cur.alt = w.title;
  };
  setMeta(works[slideIdx[0]]);
  if (slideIdx.length < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let fading = false;
  setInterval(() => {
    if (document.hidden || fading) return;
    const next = (index + 1) % slideIdx.length;
    const w = works[slideIdx[next]];
    const pre = new Image();
    fading = true;
    pre.onload = pre.onerror = () => {
      prev.style.transition = 'none';
      prev.src = cur.currentSrc || cur.src;
      prev.style.opacity = '1';
      cur.style.transition = 'none';
      cur.style.opacity = '0';
      cur.src = pre.src;
      index = next;
      setMeta(w);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        prev.style.transition = '';
        cur.style.transition = '';
        prev.style.opacity = '0';
        cur.style.opacity = '1';
        fading = false;
      }));
    };
    pre.src = img('lg', w.variants[0]);
  }, 5000);
}
