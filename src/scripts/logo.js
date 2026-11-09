// Header logo (components/Logo.astro): every 15 s the next word's tiles fly
// in, as on the old site. Stays on the name for visitors who prefer reduced motion.
export function initLogo() {
  const logo = document.querySelector('[data-logo]');
  if (!logo || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const words = [...logo.children];
  let cur = 0;
  setInterval(() => {
    if (document.hidden) return;
    words[cur].classList.remove('is-active');
    cur = (cur + 1) % words.length;
    words[cur].classList.add('is-active');
  }, 15000);
}
