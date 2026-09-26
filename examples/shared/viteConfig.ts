import { cpSync, createReadStream, existsSync, statSync } from 'node:fs';
import { dirname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { type Plugin, type PluginOption, type UserConfig } from 'vite';

const here = dirname(fileURLToPath(import.meta.url));
const cesiumBuild = join(
  dirname(fileURLToPath(import.meta.resolve('cesium/package.json'))),
  'Build/Cesium',
);
const CESIUM_DIRS = ['Workers', 'ThirdParty', 'Assets', 'Widgets'];

const CONTENT_TYPES: Record<string, string> = {
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
};

/**
 * Cesium loads its web workers and assets at run time from `CESIUM_BASE_URL`.
 * This plugin serves them under `<base>cesium/` in dev and copies them there on
 * build.
 */
const cesiumAssets = (): Plugin => {
  let outDir = 'dist';
  return {
    name: 'example-cesium-assets',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    configureServer(server) {
      const prefix = `${server.config.base}cesium/`;
      server.middlewares.use((request, response, next) => {
        const url = request.url?.split('?')[0];
        if (!url?.startsWith(prefix)) {
          next();
          return;
        }
        const file = normalize(join(cesiumBuild, decodeURIComponent(url.slice(prefix.length))));
        if (!file.startsWith(cesiumBuild) || !existsSync(file) || !statSync(file).isFile()) {
          next();
          return;
        }
        const type = CONTENT_TYPES[file.slice(file.lastIndexOf('.'))];
        if (type) response.setHeader('Content-Type', type);
        createReadStream(file).pipe(response);
      });
    },
    writeBundle() {
      for (const dir of CESIUM_DIRS) {
        cpSync(join(cesiumBuild, dir), join(outDir, 'cesium', dir), { recursive: true });
      }
    },
  };
};

/** Vite configuration shared by the examples. */
export const exampleConfig = (plugins: PluginOption[] = []): UserConfig => ({
  // GitHub Pages serves each example under its own path.
  base: process.env.EXAMPLE_BASE ?? '/',
  // `tle.txt` is served from the site root.
  publicDir: join(here, '../data'),
  plugins: [cesiumAssets(), ...plugins],
  resolve: {
    // The examples run against the library sources, exactly as published.
    alias: { '@dsanchez31/cesium-sgp4-viewer': join(here, '../../src/index.ts') },
  },
  build: { target: 'es2022', chunkSizeWarningLimit: 6_000 },
});
