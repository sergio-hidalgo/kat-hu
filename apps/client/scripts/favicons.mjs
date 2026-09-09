/**
 * Regenerates the favicon set from the brand mark.
 *
 * Run it from the repo root with `pnpm --filter client favicons`. The output is
 * committed, so this only needs running when the mark changes.
 *
 * **The source is the vector**, `src/assets/brand/kathu-mark.svg` — the same
 * file the header lockup inlines, so the tab icon and the logo on the page can
 * never drift apart. It rasterises cleanly at 16px, which a PNG resized down
 * does not.
 *
 * Everything below is built from one square SVG that this script writes to
 * `public/favicon.svg` and then rasterises: the shipped vector icon and every
 * PNG are literally the same image at different sizes.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const source = join(root, 'src/assets/brand/kathu-mark.svg');
const out = join(root, 'public');

/**
 * The Studio wears the same three icons, under the names Sanity's own
 * `index.html` already links (`/static/favicon.ico`, `/static/favicon.svg`,
 * `/static/apple-touch-icon.png`) — otherwise the owner's editing tab shows
 * Sanity's default mark and not kathu's.
 *
 * This is one app's script writing into another's folder, which the root
 * `AGENTS.md` would rather not see. It is done here anyway because the
 * alternative is two hand-copied sets that drift apart silently, and it is
 * dev-time output, not an import. **When `packages/*` exists, the mark and
 * this script belong there** and both apps should read from it.
 */
const studioOut = join(dirname(root), 'studio/static');

/**
 * The mark carries `fill="currentColor"` because the page colours it. A file
 * the browser loads on its own has nothing to inherit from, so the icon names
 * the colour — `--color-violet-700`, the same value `.kathu-logo` gives the
 * mark in the header, and Shell behind it.
 *
 * The backing is opaque on purpose. The mark's flowers are holes in the path
 * (`fill-rule: evenodd`), so on a transparent icon they take the colour of
 * whatever is behind — and a dark browser tab strip would swallow both them
 * and the outline.
 */
const VIOLET_700 = '#483c7e';
const SHELL = '#fbf9f6';
const background = { r: 0xfb, g: 0xf9, b: 0xf6, alpha: 1 };

/** The mark's own box, from its `viewBox`. */
const ART = { width: 174, height: 255 };
const CANVAS = 256;

/**
 * How much of the square the mark's height fills. 0.88 keeps the cat readable
 * at 16px; the apple-touch icon takes more room off, because iOS rounds the
 * corners in and a mark that reaches the edge gets clipped.
 */
const FILL = 0.88;
const APPLE_FILL = 0.78;

const markPath = (await readFile(source, 'utf8')).match(/ d="([^"]+)"/)?.[1];
if (!markPath) throw new Error(`no path data in ${source}`);

/** One square SVG, centred, at the given fill ratio. */
function square(fill) {
  const scale = (CANVAS * fill) / ART.height;
  const x = (CANVAS - ART.width * scale) / 2;
  const y = (CANVAS - ART.height * scale) / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS} ${CANVAS}" width="${CANVAS}" height="${CANVAS}">
  <rect width="${CANVAS}" height="${CANVAS}" fill="${SHELL}"/>
  <g transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${scale.toFixed(5)})">
    <path fill="${VIOLET_700}" fill-rule="evenodd" d="${markPath}"/>
  </g>
</svg>
`;
}

const icon = square(FILL);
const appleIcon = square(APPLE_FILL);

/** `density` is what makes sharp rasterise the vector at the target size
    rather than at its nominal 96dpi and scale the bitmap up. */
const render = (svg, size) =>
  sharp(Buffer.from(svg), { density: (72 * size) / CANVAS })
    .resize(size, size, { fit: 'contain', background })
    .png()
    .toBuffer();

await mkdir(out, { recursive: true });
await mkdir(studioOut, { recursive: true });

const files = new Map();
files.set('favicon.svg', Buffer.from(icon));
files.set('icon-192.png', await render(icon, 192));
files.set('icon-512.png', await render(icon, 512));
files.set('apple-touch-icon.png', await render(appleIcon, 180));
// .ico carries both sizes: 16 is the tab, 32 is the bookmark bar and Windows.
files.set('favicon.ico', await pngToIco([await render(icon, 16), await render(icon, 32)]));

for (const [name, data] of files) {
  await writeFile(join(out, name), data);
  console.log(`wrote client public/${name}`);
}

/** Only the three the Studio's `index.html` asks for; it has no manifest. */
for (const name of ['favicon.svg', 'favicon.ico', 'apple-touch-icon.png']) {
  await writeFile(join(studioOut, name), files.get(name));
  console.log(`wrote studio static/${name}`);
}

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
