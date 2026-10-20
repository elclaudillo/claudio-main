// Turns the artwork masters in art/ (uploaded through /admin) into web sizes:
//   art/<name>.<jpg|png|webp>  ->  public/img/sm/<name>.webp  (cards, 800px wide)
//                                  public/img/lg/<name>.webp  (hero/modal, ≤1800px)
// Runs before every build, at dev-server start, and again whenever a file in
// art/ changes while `npm run dev` is running. Up-to-date outputs are skipped.
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { join, parse } from 'node:path';
import sharp from 'sharp';

const ART = 'art';
const OUT = 'public/img';
const SIZES = [
  { dir: 'sm', resize: { width: 800, withoutEnlargement: true }, quality: 78 },
  { dir: 'lg', resize: { width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true }, quality: 80 },
];
const IMAGE = /\.(jpe?g|png|webp|avif|tiff?)$/i;

export async function buildArtImages(log = console) {
  for (const s of SIZES) mkdirSync(join(OUT, s.dir), { recursive: true });
  const masters = existsSync(ART) ? readdirSync(ART).filter((f) => IMAGE.test(f)) : [];
  const names = new Set();
  let made = 0;
  for (const file of masters) {
    const input = join(ART, file);
    const name = parse(file).name;
    names.add(name);
    const mtime = statSync(input).mtimeMs;
    for (const s of SIZES) {
      const output = join(OUT, s.dir, `${name}.webp`);
      if (existsSync(output) && statSync(output).mtimeMs >= mtime) continue;
      await sharp(input).rotate().resize(s.resize).webp({ quality: s.quality }).toFile(output);
      made++;
    }
  }
  // Drop outputs whose master was deleted in the dashboard.
  for (const s of SIZES) {
    for (const f of readdirSync(join(OUT, s.dir))) {
      if (!names.has(parse(f).name)) unlinkSync(join(OUT, s.dir, f));
    }
  }
  if (made) log.info(`art images: ${made} written (${masters.length} masters)`);
}

export function artImages() {
  return {
    name: 'art-images',
    hooks: {
      'astro:config:setup': async ({ command, logger }) => {
        if (command === 'dev' || command === 'build') await buildArtImages(logger);
      },
      'astro:server:setup': ({ server, logger }) => {
        server.watcher.add(ART);
        let timer;
        const rebuild = (path) => {
          if (!path.replace(/\\/g, '/').includes(`${ART}/`)) return;
          clearTimeout(timer);
          timer = setTimeout(() => buildArtImages(logger).catch((e) => logger.error(e.message)), 300);
        };
        server.watcher.on('add', rebuild);
        server.watcher.on('change', rebuild);
        server.watcher.on('unlink', rebuild);
      },
    },
  };
}
