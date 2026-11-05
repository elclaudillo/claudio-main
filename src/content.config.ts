// Content edited through the /admin dashboard (public/admin/config.yml).
// The schemas here validate whatever the dashboard saves; a bad entry fails
// the build instead of breaking the live page.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const text = z.string().nullish().transform((s) => s ?? '');

const translation = z.object({
  medium: text,
  modalMedium: text,
  modalExtra: text,
}).partial().default({});

const works = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/works' }),
  schema: z.object({
    title: z.string(),
    year: z.union([z.string(), z.number()]).nullish().transform((y) => (y == null ? "" : String(y))),
    section: z.enum(['selected', 'other']).default('selected'),
    category: z.enum(['clock', 'generative', 'portrait', 'print', 'rss', 'watercolour']).nullish(),
    visible: z.boolean().default(true),
    featured: z.boolean().default(false),
    heroOrder: z.number().nullish(),
    clockOrder: z.number().nullish(),
    video: z.union([z.string().url(), z.literal('')]).nullish().transform((s) => s ?? ''),
    seriesLink: text,
    medium: z.string(),
    modalMedium: text,
    modalExtra: text,
    images: z.array(z.string()).min(1, 'Each work needs at least one image'),
    translations: z.record(z.string(), translation).default({}),
  }),
});

const site = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/site' }),
  schema: z.object({
    tagline: z.string(),
    navAbout: z.string(),
    navWorks: z.string(),
    worksHeading: z.string(),
    playVideo: z.string(),
    seriesLinkLabel: z.string(),
    aboutHeading: z.string(),
    aboutQuote: text,
    aboutQuoteAuthor: text,
    about: z.array(z.string()),
    artStatementLabel: z.string().nullish().transform((s) => s || 'Art statement'),
    pressLabel: z.string().nullish().transform((s) => s || 'Press'),
    backToHome: z.string().nullish().transform((s) => s || 'Back to home'),
    catPrint: z.string().nullish().transform((s) => s || 'Prints'),
    catWatercolour: z.string().nullish().transform((s) => s || 'Watercolors'),
    // Work menu labels.
    menuSelected: z.string().nullish().transform((s) => s || 'Selected'),
    menuAllGenerative: z.string().nullish().transform((s) => s || 'All generative'),
    menuClocks: z.string().nullish().transform((s) => s || 'Generative clocks'),
    menuPortraits: z.string().nullish().transform((s) => s || 'Generative portraits'),
    menuRss: z.string().nullish().transform((s) => s || 'RSS Live feeds'),
    menuVideos: z.string().nullish().transform((s) => s || 'Videos'),
    menuAiApps: z.string().nullish().transform((s) => s || 'AI Apps'),
    installNote: z.string(),
    backToTop: z.string().nullish().transform((s) => s || 'Back to top'),
  }),
});

// Press page: one list, sorted by date when the page is built.
// Dates are YYYY-MM-DD, YYYY-MM or YYYY; undated items go at the end.
const press = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/press' }),
  schema: z.object({
    items: z.array(z.object({
      date: z.union([z.string().regex(/^\d{4}(-\d{2}(-\d{2})?)?$/, 'Use YYYY-MM-DD, YYYY-MM or YYYY'), z.literal('')]).nullish().transform((d) => d ?? ''),
      source: text,
      label: z.string(),
      url: text, // empty: shown as a picture with a caption
      logo: text,
      image: text,
      extraLabel: text, // an optional second link, e.g. English or Video
      extraUrl: text,
    })).default([]),
  }),
});

const mediaDocs = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/media-docs' }),
  schema: z.object({
    title: z.string(),
    order: z.number().default(99),
  }),
});

// Series pages (/series/<id>/): the other pieces in a work's series, opened
// from "See additional pieces in same series". Imported once from the
// artist's InDesign publications; edited in /admin since.
const series = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/series' }),
  schema: z.object({
    title: z.string(),
    order: z.number().default(99),
    intro: text,
    pieces: z.array(z.object({
      title: z.string(),
      year: z.union([z.string(), z.number()]).nullish().transform((y) => (y == null ? '' : String(y))),
      image: z.string(),
      video: text,
      text,
    })).min(1, 'A series needs at least one piece'),
    links: z.array(z.object({ label: z.string(), url: z.string() })).default([]),
  }),
});

export const collections = { works, site, press, mediaDocs, series };
