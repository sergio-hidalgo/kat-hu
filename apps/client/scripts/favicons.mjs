/**
 * Regenerates the favicon set from the brand mark.
 *
 * Run it from the repo root with `pnpm --filter client favicons`. The output is
 * committed, so this only needs running when `kathu_logo_purple.png` changes.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const source = join(root, 'src/assets/brand/kathu_logo_purple.png');
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

// .ico carries both sizes: 16 is the tab, 32 is the bookmark bar and Windows.
await writeFile(
  join(out, 'favicon.ico'),
  await pngToIco([await render(16, 1), await render(32, 2)]),
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
