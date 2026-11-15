import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/presentation/',
  plugins: [react()],
  server: {
    // allow public tunnel URLs (cloudflared quick tunnels get a new random subdomain each run)
    allowedHosts: ['.trycloudflare.com'],
    // the cost model reads ../config/assumptions.json (shared with the Python app)
    fs: { allow: ['..'] },
    // the "Fragen" tab talks to the advisor of the Python app (python3 server.py, port 8000)
    proxy: { '/api': 'http://127.0.0.1:8000' },
  },
  build: {
    outDir: '../static/presentation',
    emptyOutDir: true,
  },
});
