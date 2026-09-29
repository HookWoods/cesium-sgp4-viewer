import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    benchmark: {
      // The module runner turns every import into a getter. The cost is the same
      // before and after a change, and benchmarks here only compare the two.
      suppressExportGetterWarnings: true,
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.bench.ts', 'src/__fixtures__/**', 'src/env.d.ts'],
      reporter: ['text', 'lcov'],
    },
  },
});
