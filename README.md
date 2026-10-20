# claudio castillo — site

Static rebuild of Claudio Castillo's Claude Design site (claudiocastillo.netlify.app),
built with [Astro](https://astro.build). The home page has two masonry grids, Selected Works and Other work, each shuffled on every visit. Every page is plain HTML with its text included,
in 11 languages (`/`, `/es/`, `/it/`, `/fr/`, `/de/`, `/ko/`, `/ja/`, `/zh/`, `/ar/`, `/ru/`, `/hi/`),
plus the `/live/` stream page.

## Run locally

```sh
npm install
npm run dev        # http://localhost:4321
```

`npm run build` writes the production site to `dist/`; `npm run preview` serves that build.

## Dashboard (/admin)

Artworks and site text are edited at **/admin/** ([Sveltia CMS](https://sveltiacms.app)).
For each artwork: section (Selected Works or Other work), category, title, year, images, video and series links, card/detail text,
translations, **Visible on site**, **Featured in slideshow** and slideshow position.
There's also a *Site text* section (tagline, headings, About) for every language, and
*Selected Media* (press link groups) plus *Media documents* (Exhibitions, CV / Bio, Art statement).

- **Locally:** `npm run dev`, open http://localhost:4321/admin/ in Chrome or Edge, choose
  *Work with Local Repository* and select this project folder. Saves write straight to
  the files; the open site picks them up (images are resized automatically).
- **Online:** set `backend.repo` in `public/admin/config.yml` to the GitHub repo. Editors
  sign in with GitHub; every save is a commit, and Netlify rebuilds in about a minute.
  "Sign In Using Access Token" works right away with a GitHub personal access token;
  the "Sign In with GitHub" button needs an OAuth app (see Sveltia's auth docs).

## Where things live

| What | File |
| --- | --- |
| One file per artwork (edited by the dashboard) | `src/content/works/*.json` |
| Site text per language (edited by the dashboard) | `src/content/site/*.json` |
| Content schemas (a bad save fails the build, not the live site) | `src/content.config.ts` |
| Dashboard fields | `public/admin/config.yml` |
| Selected Media link groups / documents (dashboard) | `src/content/media/*.json`, `src/content/media-docs/*.md` |
| Press PDFs (moved off the old WordPress server) | `public/press/` |
| Languages and social links | `src/data/site.json` |
| Home page markup | `src/components/Home.astro` |
| Styles (values from the original design) | `src/styles/site.css` |
| Hero/card rotation, modal, menus, live badge | `src/scripts/home.js` |
| Live stream page | `src/pages/live/index.astro` |
| Animated "claudio castillo" logo (Adobe Edge) | `public/ccname/` |
| Proxies and headers for Netlify | `netlify.toml` |

## Artwork images

Masters (up to 1800px) live in `art/`; dashboard uploads land there too.
`scripts/art-images.mjs` makes the web sizes in `public/img/sm` (cards, 800px) and
`public/img/lg` (hero/modal) on every build and whenever `art/` changes during
`npm run dev`. `public/img/` is generated and not committed. The client's full-size
originals are in `source/`, and the zip plus the WordPress export the Other work
entries were imported from are in `notes/` (neither in git).

## Live status

The Live button and `/live/` read YouTube's channel page through `/livecheck/…`
(a proxy, set in `netlify.toml` for Netlify and in `astro.config.mjs` for local dev).
The Login button goes to `api.claudiocastillo.com/admin/`, which is a separate system.
