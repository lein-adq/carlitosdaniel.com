// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://carlitosdaniel.com',

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [
    mdx(),
    sitemap({
      // rag-agent is marked noindex in its frontmatter
      filter: (page) => !page.includes('/work/rag-agent'),
      lastmod: new Date(),
    }),
  ]
});
