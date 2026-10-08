/**
 * Cuts the phone version of the /drops banner (spec 05e follow-up, 2026-10-07).
 *
 * Below `md` the band shows a window of the 1584×369 photograph, anchored at
 * 65% (`object-[65%_50%]`), and that window is never wider than 759px of layout
 * at the band's shortest (20rem) — 875 source pixels at the cover scale. A phone
 * was downloading all 1584. This keeps 900 of them, placed so the same window
 * lands on the same pixels: the crop's left is 65% of what it leaves out
 * (0.65 × (1584 − 900) = 445), and with the same 65% anchor the window in the
 * crop is the window in the original. From `md` the full photograph is used.
 *
 * Run: `pnpm --filter client banner-mobile`. The output is committed; run it
 * again only if `banner_drops.jpg` changes.
 */
import sharp from 'sharp';

const FULL = 1584;
const KEEP = 900;
const left = Math.round(0.65 * (FULL - KEEP));

await sharp('src/assets/brand/banner_drops.jpg')
  .extract({ left, top: 0, width: KEEP, height: 369 })
  .jpeg({ quality: 92, mozjpeg: true })
  .toFile('src/assets/brand/banner_drops_sm.jpg');

console.log(`banner_drops_sm.jpg: ${KEEP}×369 from x=${left}`);
