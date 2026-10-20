import { defineConfig } from 'astro/config';
import { artImages } from './scripts/art-images.mjs';

// TODO: switch to the final domain once it is decided.
const site = 'https://claudiocastillo.netlify.app';

// The live-status check and the Live page's frame grabs go through these
// paths. On Netlify they are proxy rewrites (netlify.toml); this mirrors them
// for `npm run dev` so the Live button and /live/ work locally too.
const youtubeProxy = {
  '/livecheck': {
    target: 'https://www.youtube.com',
    changeOrigin: true,
    rewrite: (p) => p.replace(/^\/livecheck\/[^/]+\/([^/?]+).*/, '/channel/$1/live'),
  },
  '^/snapx/': {
    target: 'https://i.ytimg.com',
    changeOrigin: true,
    rewrite: (p) => p.replace(/^\/snapx\/[^/]+\//, '/vi/'),
  },
  '^/snap/': {
    target: 'https://i.ytimg.com',
    changeOrigin: true,
    rewrite: (p) => p.replace(/^\/snap\//, '/vi/'),
  },
};

export default defineConfig({
  site,
  trailingSlash: 'ignore',
  integrations: [artImages()],
  vite: { server: { proxy: youtubeProxy }, preview: { proxy: youtubeProxy } },
});
