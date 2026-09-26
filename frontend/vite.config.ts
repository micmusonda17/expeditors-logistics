/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { fileURLToPath, URL } from 'node:url';

// `npm run dev`         site + portal against the FastAPI backend (proxied at /api)
// `npm run dev:demo`    no backend needed: sample data kept in the browser
// `npm run build`       production build in dist/
// `npm run build:demo`  single-file demo build in dist-demo/ (for previews)
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react(), ...(mode === 'demo' ? [viteSingleFile()] : [])],
  resolve: {
    alias: { '@shared': fileURLToPath(new URL('../shared', import.meta.url)) }
  },
  server: {
    port: 5173,
    fs: { allow: ['..'] },
    proxy: { '/api': { target: process.env.VITE_PROXY_TARGET || 'http://localhost:8000', changeOrigin: true } }
  },
  build: {
    outDir: mode === 'demo' ? 'dist-demo' : 'dist',
    emptyOutDir: true
  },
  test: { environment: 'node' }
}));
