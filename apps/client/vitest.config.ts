import { getViteConfig } from 'astro/config';
import type { InlineConfig } from 'vitest/node';

/**
 * Astro's own Vite config, so tests resolve `import.meta.env` and `.astro`
 * files exactly like the site does. Component tests use the Container API
 * from `astro/container`; the default environment stays `node` because
 * everything tested today is pure. Islands (spec 06) opt into jsdom per file
 * with `// @vitest-environment jsdom`.
 */
const test: InlineConfig = {
  environment: 'node',
  include: ['src/**/*.test.ts'],
  /**
   * The Container API cold-renders an `.astro` component through Astro's own
   * pipeline the first time a file asks for one, which on a warm machine still
   * runs past Vitest's 5s default — `Header.test.ts` and `BaseLayout.test.ts`,
   * the two heaviest, failed with `Test timed out in 5000ms` while asserting
   * nothing slow (issue I-008). The renders themselves are pure and offline;
   * this timeout is headroom for the first compile, not permission for a test
   * to wait on anything.
   */
  testTimeout: 20_000,
  /**
   * Placeholders so a checkout with no `.env` can still run the suite:
   * `src/lib/sanity.ts` throws at import time on a missing project id, and
   * `src/data/posts.ts` imports it. Nothing here reaches the network — the
   * tests only call pure functions — so the values are never used.
   */
  env: {
    PUBLIC_SANITY_PROJECT_ID: 'test-project',
    PUBLIC_SANITY_DATASET: 'test-dataset',
  },
};

/**
 * Astro bundles its own copy of Vite, so Vitest's augmentation of Vite's
 * `UserConfig` never reaches `getViteConfig`'s parameter type. `test` above is
 * fully type-checked against Vitest's own type; this cast only bridges the two
 * Vite copies.
 */
export default getViteConfig({ test } as Parameters<typeof getViteConfig>[0]);
