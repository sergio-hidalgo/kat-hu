/**
 * Switches on the decorative masks that wait for it — the línea-fina drawings
 * (`ui/Flora.astro`) and the footer's closing edge (`ui/SectionEdge.astro`) —
 * once the page has loaded, and only the ones near the screen. Whatever carries
 * `data-mask-defer` is held back; this sets `data-mask-on`.
 *
 * A mask's file is fetched the moment the element has one, at high priority —
 * so on a phone the daisy and the leaf queued up with the hero photograph, the
 * largest contentful paint, on a throttled connection, and the footer's two
 * files (32 and 24 KB) were requested for a strip at the very end of the page.
 * They are decoration. So each one waits: it writes its mask into a custom
 * property, which downloads nothing, and this adds `data-mask-on` — the CSS
 * rule in `theme.css` that turns the property into a `mask` — when `load` has
 * fired and the element is within 600px of the viewport. One that is
 * `display: none` (a desktop drawing on a phone) never intersects, so it is
 * never fetched at all.
 *
 * Without JavaScript they stay hidden: they are `aria-hidden` decoration, and
 * a page without them says the same thing.
 */
const NEAR = '600px 0px';

function start(): void {
  const masks = document.querySelectorAll<HTMLElement>('[data-mask-defer]:not([data-mask-on])');
  if (!('IntersectionObserver' in window)) {
    for (const mask of masks) mask.setAttribute('data-mask-on', '');
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.setAttribute('data-mask-on', '');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: NEAR },
  );
  for (const mask of masks) observer.observe(mask);
}

if (document.readyState === 'complete') start();
else window.addEventListener('load', start, { once: true });

export {};
