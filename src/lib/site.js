// Content helpers. Works and per-language site text come from the content
// collections edited in /admin (src/content/*); language list and social
// links from src/data/site.json; the live stream from src/data/live.json.
import { getCollection } from 'astro:content';
import site from '../data/site.json';
import live from '../data/live.json';

export const { langOrder, langNames, langFullNames, socialLinks } = site;
export const defaultLang = 'en';
export const LIVE_CHANNEL = live.channel;
export const LIVE_VIDEO = live.video || '';

export const langPath = (lang) => (lang === defaultLang ? '/' : `/${lang}/`);

// The Work menu's pages (/work/<id>/). Selected is the home page. A work can
// show on several of these: alhambra is in Selected, All generative and Clocks.
// The Clocks position keeps each series together (mosaics, bonsai, grids,
// religions). All generative shows the clocks in that order, then RSS, then
// the rest by title.
const byClockOrder = (a, b) => a.clockOrder - b.clockOrder || a.title.localeCompare(b.title);
const generativeRank = { clock: 0, rss: 1, generative: 2 };
const byGenerative = (a, b) => generativeRank[a.category] - generativeRank[b.category] || byClockOrder(a, b);
export const workSections = [
  { id: 'all-generative', label: 'menuAllGenerative', match: (w) => ['clock', 'generative', 'rss'].includes(w.category), sort: byGenerative },
  { id: 'clocks', label: 'menuClocks', match: (w) => w.category === 'clock', sort: byClockOrder },
  { id: 'portraits', label: 'menuPortraits', match: (w) => w.category === 'portrait' },
  { id: 'rss', label: 'menuRss', match: (w) => w.category === 'rss' },
  { id: 'watercolors', label: 'catWatercolour', match: (w) => w.category === 'watercolour' },
  { id: 'prints', label: 'catPrint', match: (w) => w.category === 'print' },
];
export const sectionPath = (id) => `work/${id}/`;

export async function strings(lang) {
  const entries = await getCollection('site');
  return (entries.find((e) => e.id === lang) || entries.find((e) => e.id === defaultLang)).data;
}

// "/art/virgin-1.jpg" -> "virgin-1" (the web sizes are named after the master).
const imageName = (path) => path.split('/').pop().replace(/\.[^.]+$/, '');

// Translation rules carried over from the original design: an empty
// translated field falls back to English; the modal shows the translated
// card text unless a separate translated modal text is given.
export async function works(lang) {
  const entries = (await getCollection('works')).filter((e) => e.data.visible);
  return entries
    .sort((a, b) => a.data.title.localeCompare(b.data.title))
    .map(({ id, data: w }) => {
      const t = (lang !== defaultLang && w.translations[lang]) || {};
      const enModal = w.modalMedium || w.medium;
      return {
        id,
        title: w.title,
        year: w.year,
        video: w.video,
        seriesLink: w.seriesLink,
        section: w.section,
        category: w.category || 'generative',
        featured: w.featured,
        heroOrder: w.heroOrder ?? Infinity,
        clockOrder: w.clockOrder ?? Infinity,
        variants: w.images.map(imageName),
        medium: t.medium || w.medium,
        modalMedium: t.modalMedium || t.medium || enModal,
        modalExtra: t.modalExtra || w.modalExtra,
      };
    });
}

// Hero slideshow: visible works marked "featured", in their hero order.
export const heroWorks = (list) =>
  list.filter((w) => w.featured).sort((a, b) => a.heroOrder - b.heroOrder || a.title.localeCompare(b.title));

// Selected Works: same order as the slideshow, then anything not positioned.
export const selectedWorks = (list) =>
  list.filter((w) => w.section === 'selected').sort((a, b) => a.heroOrder - b.heroOrder || a.title.localeCompare(b.title));

// Muted, chromeless YouTube player for a sample video link. Keeps the link's
// start time (watch?v=…&t=393s); loop needs the playlist parameter.
export function videoEmbed(url) {
  const id = url.match(/(?:v=|youtu\.be\/|shorts\/)([\w-]{11})/)?.[1];
  if (!id) return '';
  const start = url.match(/[?&]t=(\d+)/)?.[1] || 0;
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&playsinline=1&controls=0&rel=0&modestbranding=1&loop=1&playlist=${id}&start=${start}`;
}

export const img = (size, name) => `/img/${size}/${name}.webp`;
