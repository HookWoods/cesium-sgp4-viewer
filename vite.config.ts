import { defineConfig } from 'vite';

/**
 * Two library builds share this file:
 *
 * - `vite build` (default mode): the ES module published for bundlers. `cesium`
 *   and `satellite.js` stay external so the application dedupes them.
 * - `vite build --mode iife`: a single script for CDNs and Sandcastle. Only
 *   `cesium` is external, read from the global `Cesium` the page already has.
 *
 * In both, the propagation worker is bundled on its own (with satellite.js) and
 * inlined as a blob, so consumers never have to serve or locate a worker file.
 */
export default defineConfig(({ mode }) => {
  const isIife = mode === 'iife';

  return {
    build: {
      target: 'es2022',
      sourcemap: true,
      emptyOutDir: !isIife,
      lib: {
        entry: 'src/index.ts',
        name: 'CesiumSgp4Viewer',
        formats: [isIife ? 'iife' : 'es'],
        fileName: () => (isIife ? 'cesium-sgp4-viewer.iife.js' : 'index.js'),
      },
      rollupOptions: {
        external: isIife ? ['cesium'] : ['cesium', 'satellite.js'],
        output: { globals: { cesium: 'Cesium' } },
      },
    },
    worker: { format: 'iife' },
  };
});
