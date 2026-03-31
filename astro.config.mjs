import { defineConfig } from 'astro/config';

export default defineConfig({
  site: process.env.SITE_URL || 'http://localhost:3000',
  vite: {
    define: {
      'process.env': JSON.stringify(process.env),
    },
  },
  integrations: [],
  output: 'static',
  outDir: './dist',
  public: './public',
});
