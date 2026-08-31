import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://jojun.jonathanrbt.lat',
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/ogl')) return 'ogl';
            if (id.includes('node_modules/gsap')) return 'gsap';
          }
        }
      }
    }
  },
  build: { inlineStylesheets: 'auto' }
});
