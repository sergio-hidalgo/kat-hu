import { defineConfig } from 'vitest/config';

/**
 * Vitest rather than Jest: Nest 12 ships as ESM only, and Jest can load ESM
 * just on Node >= 24.9, below the repo's >= 22.12 floor. Nest's own ESM
 * scaffold uses Vitest for the same reason. Decorator metadata survives
 * because esbuild reads `experimentalDecorators` from tsconfig.json.
 *
 * `.mts` because this app is `"type": "commonjs"` — a `.ts` config would be
 * loaded as CJS and warn on its own `import` syntax.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
  },
});
