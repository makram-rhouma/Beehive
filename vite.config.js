import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  appType: 'spa',
  server: {
    port: 5173,
    strictPort: true
  },
  build: {
    outDir: 'docs',
    emptyOutDir: true
  }
});
