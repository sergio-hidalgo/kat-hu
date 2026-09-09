import { defineConfig } from 'vitest/config';

/**
 * Plain TypeScript, no framework — the package is pure Zod schemas and
 * registries, so `node` is the only environment it ever needs.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
