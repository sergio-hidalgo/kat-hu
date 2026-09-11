import type { BlockId } from '@kat-hu/contracts';
import type { AstroComponentFactory } from 'astro/runtime/server/index.js';
import AboutTeaser from './AboutTeaser.astro';
import BlogTeaser from './BlogTeaser.astro';
import Cta from './Cta.astro';
import Hero from './Hero.astro';
import HowItWorks from './HowItWorks.astro';
import Services from './Services.astro';
import ShopTeaser from './ShopTeaser.astro';
import Testimonials from './Testimonials.astro';

/**
 * The one place a registered block id meets the component that renders it
 * (spec 05). `pages/index.astro` walks `BLOCKS` and looks each visible id up
 * here, and `registry.test.ts` holds this map, the registry and the files in
 * this folder to one another.
 *
 * Every block takes the same two props — its own slice of the landing copy
 * and the request's flags — so the page renders any of them the same way.
 */
export const BLOCK_COMPONENTS: Record<BlockId, AstroComponentFactory> = {
  hero: Hero,
  services: Services,
  'how-it-works': HowItWorks,
  'about-teaser': AboutTeaser,
  testimonials: Testimonials,
  'blog-teaser': BlogTeaser,
  'shop-teaser': ShopTeaser,
  cta: Cta,
};

/** `how-it-works` → `HowItWorks.astro`: the file a block id must live in. */
export function blockFileName(id: string): string {
  return `${id
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')}.astro`;
}
