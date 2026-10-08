import { initCarousel } from './carousel-init';

/**
 * Starts every carousel on the page (`ui/Carousel.astro`). A page that holds
 * one imports this from a `<script>` of its own, **outside** the element that
 * holds the bands: in `astro dev` a component's script is emitted before the
 * band that first uses it, and a `<script>` between two bands breaks the
 * `+` and `:last-child` selectors of the colour rhythm (`blocks/rhythm.ts`).
 */
for (const root of document.querySelectorAll<HTMLElement>('[data-carousel]')) {
  initCarousel(root);
}
