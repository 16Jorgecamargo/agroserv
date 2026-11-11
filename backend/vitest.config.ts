import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['src/**/*.unit-spec.ts'],
    env: { NODE_ENV: 'test' },
  },
});
