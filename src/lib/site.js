// Content helpers. Works and per-language site text come from the content
// collections edited in /admin (src/content/*); language list and social
// links from src/data/site.json.
import { getCollection } from 'astro:content';
import site from '../data/site.json';

export const { langOrder, langNames, langFullNames, socialLinks } = site;
export const defaultLang = 'en';
export const LIVE_CHANNEL = 'UCNop6_Z83rJdF_8Tpcss2Ug';

export const langPath = (lang) => (lang === defaultLang ? '/' : `/${lang}/`);

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
        featured: w.featured,
        heroOrder: w.heroOrder ?? Infinity,
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

export const img = (size, name) => `/img/${size}/${name}.webp`;
