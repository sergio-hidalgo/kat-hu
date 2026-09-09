/**
 * Regenerates the favicon set from the brand mark.
 *
 * Run it from the repo root with `pnpm --filter client favicons`. The output is
 * committed, so this only needs running when the mark changes.
 *
 * Two different jobs, deliberately kept apart:
 *
 * - **The tab icon** (`favicon.svg`, `favicon.ico`) is the mark as
 *   `references/kathu_favicon.png` draws it — purple, white flowers — with a
 *   thick white outline and a **transparent** background, so it holds its own
 *   against a dark tab strip as well as a light one.
 * - **The app icons** (`icon-192`, `icon-512`, `apple-touch-icon`) keep the
 *   Shell backing they have always had: a home-screen tile is a tile, and iOS
 *   flattens transparency onto black anyway.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const source = join(root, 'src/assets/brand/kathu_logo_purple.png');
const markSource = join(root, 'src/assets/brand/kathu-mark.svg');
const out = join(root, 'public');

/** Shell, so the mark never sits on transparency in contexts that flatten it. */
const background = { r: 0xfb, g: 0xf9, b: 0xf6, alpha: 1 };

/** `contain` keeps the mark's aspect ratio; the padding is the breathing room
    a browser tab needs at 16px. */
const render = (size, padding) =>
  sharp(source)
    .resize(size - padding * 2, size - padding * 2, {
      fit: 'contain',
      background,
    })
    .extend({
      top: padding,
      bottom: padding,
      left: padding,
      right: padding,
      background,
    })
    .png()
    .toBuffer();

const png = [
  ['icon-192.png', 192, 16],
  ['icon-512.png', 512, 42],
  ['apple-touch-icon.png', 180, 20],
];

await mkdir(out, { recursive: true });

for (const [name, size, padding] of png) {
  await writeFile(join(out, name), await render(size, padding));
  console.log(`wrote public/${name}`);
}

/* ------------------------------------------------------------------ tab icon

   The outline is a white copy of the mark drawn underneath itself with a fat
   white stroke, so it hugs the silhouette exactly rather than being a shape
   someone drew by hand. The stroke also closes over the flowers — they are
   holes in the path (`fill-rule: evenodd`) — which is what turns them white,
   the way `references/kathu_favicon.png` has them.

   The vector source is `kathu-mark.svg`, read for its path data and nothing
   else. Nothing about the logo changes. */
const markPath = (await readFile(markSource, 'utf8')).match(/ d="([^"]+)"/)?.[1];
if (!markPath) throw new Error(`no path data in ${markSource}`);

/** The mark's own box, from its `viewBox`. */
const ART = { width: 174, height: 255 };
/** The square the tab icon is drawn in, with the outline inside it. */
const CANVAS = 292;
/** Thick enough to read as an outline at 32px, the size a retina tab uses. */
const OUTLINE = 22;
/** The purple of `references/kathu_favicon.png`, sampled from the file. */
const PURPLE = '#574490';

const half = OUTLINE / 2;
const tx = (CANVAS - (ART.width + OUTLINE)) / 2 + half;
const ty = (CANVAS - (ART.height + OUTLINE)) / 2 + half;

const tabIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS} ${CANVAS}" width="${CANVAS}" height="${CANVAS}">
  <g transform="translate(${tx} ${ty})">
    <path d="${markPath}" fill="#ffffff" stroke="#ffffff" stroke-width="${OUTLINE}" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="${markPath}" fill="${PURPLE}" fill-rule="evenodd"/>
  </g>
</svg>
`;

await writeFile(join(out, 'favicon.svg'), tabIcon);
console.log('wrote public/favicon.svg');

/** `density` rasterises the vector at the target size instead of scaling a
    96dpi bitmap up. The background stays transparent — that is the point. */
const tab = (size) =>
  sharp(Buffer.from(tabIcon), { density: (72 * size) / CANVAS })
    .resize(size, size)
    .png()
    .toBuffer();

// .ico carries both sizes: 16 is the tab, 32 is the bookmark bar and Windows.
await writeFile(join(out, 'favicon.ico'), await pngToIco([await tab(16), await tab(32)]));
console.log('wrote public/favicon.ico');

await writeFile(
  join(out, 'site.webmanifest'),
  `${JSON.stringify(
    {
      name: 'kathu',
      short_name: 'kathu',
      lang: 'es',
      start_url: '/',
      display: 'standalone',
      background_color: '#fbf9f6',
      theme_color: '#2b2350',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    },
    null,
    2,
  )}\n`,
);
console.log('wrote public/site.webmanifest');
