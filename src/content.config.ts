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
    category: z.enum(['generative', 'portrait', 'watercolour']).nullish(),
    visible: z.boolean().default(true),
    featured: z.boolean().default(false),
    heroOrder: z.number().nullish(),
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
    selectedMedia: z.string(),
    otherWork: z.string(),
    installNote: z.string(),
  }),
});

// Selected Media (About section): link groups and long documents.
const media = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/media' }),
  schema: z.object({
    title: z.string(),
    order: z.number().default(99),
    layout: z.enum(['row', 'list']).default('list'),
    items: z.array(z.object({
      label: z.string(),
      source: text,
      url: z.string(),
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

export const collections = { works, site, media, mediaDocs };
