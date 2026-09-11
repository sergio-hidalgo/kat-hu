/**
 * The chrome's height, in one place.
 *
 * The header is `fixed`, so its height is not a fact about the header alone:
 * the layout has to push `<main>` down by it, and anything the page scrolls to
 * has to reserve it as `scroll-margin-top` (issue I-007). Written down four
 * times, those numbers drift; written down here, they cannot.
 *
 * Class strings rather than pixel numbers, for the same reason `field.ts`
 * exports classes — Tailwind v4 scans `.ts` sources, so the utilities are
 * still generated, and no file has to translate a number into a utility.
 *
 * Sizes supersede guide §7.7 (72/64px) by the owner's decision of 2026-09-08:
 * the band is 20% taller so the lockup can be real text at a readable size.
 */

/** The bar itself: 80px, 88px from `md`. */
export const BAND_H = 'h-20 md:h-22';

/** The advisory stripe above it: 36px, 40px from `md`. */
export const STRIPE_H = 'h-9 md:h-10';

/**
 * The stripe's height as an offset. The mobile sheet starts *below* the
 * stripe, so the stripe stays put while the menu opens and the sheet's own
 * top row lands exactly where the band's was — nothing moves.
 */
export const STRIPE_TOP = 'top-9 md:top-10';

/** Stripe + band — what `<main>` clears when the announcement is on. */
export const CHROME_PT = 'pt-29 md:pt-32';

/** Band only — what `<main>` clears when the announcement is off. */
export const BAND_PT = 'pt-20 md:pt-22';

/**
 * The same two heights as offsets, for something positioned inside a band
 * that runs under the chrome: the `/drops` banner's ornament frame starts
 * below it, so its top ornaments are visible at scroll 0 (spec 04b).
 */
export const CHROME_TOP = 'top-29 md:top-32';
export const BAND_TOP = 'top-20 md:top-22';

/**
 * The rest of the first screen below the chrome, as a minimum height: the
 * landing hero starts just under the bar and ends at the bottom edge of the
 * screen (spec 05). The same two heights as above in rem (`top-29` is
 * 29 × 0.25rem), which `Header.test.ts` holds them to. `svh`, because on a
 * phone `vh` is measured with the browser's toolbars hidden.
 */
export const CHROME_SCREEN_MIN_H = 'min-h-[calc(100svh_-_7.25rem)] md:min-h-[calc(100svh_-_8rem)]';
export const BAND_SCREEN_MIN_H = 'min-h-[calc(100svh_-_5rem)] md:min-h-[calc(100svh_-_5.5rem)]';

/**
 * Band only, deliberately: anything scrolled to is scrolled to, and by then
 * the stripe has collapsed.
 */
export const SCROLL_MT = 'scroll-mt-20 md:scroll-mt-22';

/**
 * The lockup's `font-size` in the band. 36px ⇒ a 56px mark at `1.56em` —
 * 20% up on the 30px this spec first shipped, by the owner's decision of
 * 2026-09-09, and still clear of the 80px band.
 */
export const LOGO_SIZE = 36;
