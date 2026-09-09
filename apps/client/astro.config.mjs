// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  /**
   * On-demand rendering. Every page is built per request, so a post published
   * in Sanity is live on the next reload and visibility flags (spec 10) and
   * sessions (spec 09) can be evaluated for the visitor asking. Nothing is
   * `prerender = true` yet — a page that opts out of the request is a page
   * that cannot be hidden or personalised, so it needs a reason.
   */
  output: 'server',
  /** Standalone: `node dist/server/entry.mjs` runs anywhere. Spec 13 picks a host. */
  adapter: node({ mode: 'standalone' }),
  /**
   * React is here for islands — the few places state actually lives (the
   * booking form, the cart). Pages, layouts and blocks stay `.astro`
   * (`apps/client/AGENTS.md`).
   */
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
