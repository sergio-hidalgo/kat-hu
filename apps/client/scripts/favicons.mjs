/**
 * Regenerates the browser and home-screen icons.
 *
 * Run it from the repo root with `pnpm --filter client favicons`. The output is
 * committed, so this only needs running when the mark changes.
 *
 * **There is one drawing.** The mark as `references/kathu_favicon.png` draws it
 * — purple, white flowers — with a thick white outline around the silhouette.
 * The outline is a white copy of the same path underneath itself with a fat
 * white stroke, so it hugs the shape exactly rather than being a second shape
 * to keep in sync, and it closes over the flowers (holes in the path, by
 * `fill-rule: evenodd`) which is what turns them white.
 *
 * The vector source is `kathu-mark.svg`, read for its path data and nothing
 * else. Nothing about the logo changes.
 *
 * What differs between the outputs is only the backing:
 *
 * | File                   | Backing    | Why                                     |
 * | :--------------------- | :--------- | :-------------------------------------- |
 * | `favicon.svg` / `.ico` | none       | reads on a dark tab strip and a light one |
 * | `icon-192` / `icon-512`| none       | the same drawing; launchers supply their own |
 * | `apple-touch-icon`     | violet-900 | iOS composites transparency onto **black**, so the icon has to bring its own surface — and violet-900 is the manifest's `theme_color` |
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const markSource = join(root, 'src/assets/brand/kathu-mark.svg');
const out = join(root, 'public');

/** The purple of `references/kathu_favicon.png`, sampled from the file. */
const PURPLE = '#574490';
/** guide §3: the exceptional dark surface, and the manifest's `theme_color`. */
const VIOLET_900 = '#2b2350';

/** The mark's own box, from its `viewBox`. */
const ART = { width: 174, height: 255 };
/** Thick enough to read as an outline at 32px, the size a retina tab uses. */
const OUTLINE = 22;
/** The square everything is drawn in. */
const CANVAS = 292;

/**
 * How much of the square the outlined mark's height fills. The tab icon runs
 * nearly to the edge because it is only ever seen small; the apple-touch icon
 * holds back, because iOS rounds the corners in and clips what reaches them.
 */
const TAB_FILL = (ART.height + OUTLINE) / CANVAS; // 277/292 — scale 1, unchanged
const APPLE_FILL = 0.78;

const markPath = (await readFile(markSource, 'utf8')).match(/ d="([^"]+)"/)?.[1];
if (!markPath) throw new Error(`no path data in ${markSource}`);

/** One square icon: the outlined mark centred, optionally on a surface. */
function square(fill, background) {
  const box = { width: ART.width + OUTLINE, height: ART.height + OUTLINE };
  const scale = (CANVAS * fill) / box.height;
  const x = (CANVAS - box.width * scale) / 2 + (OUTLINE / 2) * scale;
  const y = (CANVAS - box.height * scale) / 2 + (OUTLINE / 2) * scale;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS} ${CANVAS}" width="${CANVAS}" height="${CANVAS}">
${background ? `  <rect width="${CANVAS}" height="${CANVAS}" fill="${background}"/>\n` : ''}  <g transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${scale.toFixed(5)})">
    <path d="${markPath}" fill="#ffffff" stroke="#ffffff" stroke-width="${OUTLINE}" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="${markPath}" fill="${PURPLE}" fill-rule="evenodd"/>
  </g>
</svg>
`;
}

const tabIcon = square(TAB_FILL, null);
const appleIcon = square(APPLE_FILL, VIOLET_900);

/** `density` rasterises the vector at the target size instead of scaling a
    96dpi bitmap up. */
const render = (svg, size) =>
  sharp(Buffer.from(svg), { density: (72 * size) / CANVAS })
    .resize(size, size)
    .png()
    .toBuffer();

await mkdir(out, { recursive: true });

await writeFile(join(out, 'favicon.svg'), tabIcon);
console.log('wrote public/favicon.svg');

for (const [name, svg, size] of [
  ['icon-192.png', tabIcon, 192],
  ['icon-512.png', tabIcon, 512],
  ['apple-touch-icon.png', appleIcon, 180],
]) {
  await writeFile(join(out, name), await render(svg, size));
  console.log(`wrote public/${name}`);
}

// .ico carries both sizes: 16 is the tab, 32 is the bookmark bar and Windows.
await writeFile(
  join(out, 'favicon.ico'),
  await pngToIco([await render(tabIcon, 16), await render(tabIcon, 32)]),
);
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
