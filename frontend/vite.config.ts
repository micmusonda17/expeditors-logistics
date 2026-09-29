/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, URL } from 'node:url';

// `npm run dev`            site + portal against the FastAPI backend (proxied at /api)
// `npm run dev:demo`       no backend needed: sample data kept in the browser
// `npm run build`          production build in dist/ (Docker, Render)
// `npm run build:demo`     demo build for GitHub Pages in dist-demo/, served from /<repo>/
//                          (set PAGES_BASE=/ if the demo moves to its own domain)
// `npm run build:preview`  one-file demo in dist-preview/ that uses #page addresses,
//                          for hosts that cannot send every page address to index.html

/** GitHub Pages serves 404.html for unknown paths; a copy of index.html makes /services, /track/ELL-XXXX etc. load the site. */
const spaFallback = (outDir: string): Plugin => ({
  name: 'spa-404-fallback',
  apply: 'build',
  closeBundle() { copyFileSync(join(outDir, 'index.html'), join(outDir, '404.html')); }
});

export default defineConfig(({ mode, command }) => {
  const preview = mode === 'preview';
  const outDir = preview ? 'dist-preview' : mode === 'demo' ? 'dist-demo' : 'dist';
  const base = command === 'serve' ? '/' : preview ? './' : mode === 'demo' ? process.env.PAGES_BASE || '/expeditors-logistics/' : '/';
  return {
    base,
    plugins: [react(), ...(preview ? [viteSingleFile()] : []), ...(mode === 'demo' ? [spaFallback(outDir)] : [])],
    define: preview ? { 'import.meta.env.VITE_ROUTER': JSON.stringify('hash') } : {},
    resolve: {
      alias: { '@shared': fileURLToPath(new URL('../shared', import.meta.url)) }
    },
    server: {
      port: 5173,
      fs: { allow: ['..'] },
      proxy: { '/api': { target: process.env.VITE_PROXY_TARGET || 'http://localhost:8000', changeOrigin: true } }
    },
    build: { outDir, emptyOutDir: true },
    test: { environment: 'node' }
  };
});
