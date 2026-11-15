// Build for the single-file demo (npm run build:standalone): relative paths, everything inlined,
// written to a temporary folder that tools/build_standalone.mjs turns into one HTML file.
import { defineConfig, mergeConfig } from 'vite';
import base from './vite.config.js';

export default mergeConfig(base, defineConfig({
  base: './',
  define: { 'import.meta.env.VITE_STANDALONE': JSON.stringify('1') },
  build: {
    outDir: 'dist-standalone',
    emptyOutDir: true,
    assetsInlineLimit: 100_000_000, // images as data URIs inside the JS
    cssCodeSplit: false,
    modulePreload: false,
  },
}));
