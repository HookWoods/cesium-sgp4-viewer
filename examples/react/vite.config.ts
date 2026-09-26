import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { exampleConfig } from '../shared/viteConfig.ts';

export default defineConfig(exampleConfig([react()]));
