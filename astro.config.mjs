import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import { storyblok } from '@storyblok/astro';

const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');

export default defineConfig({
  output: 'static',
  integrations: [
    storyblok({
      accessToken: env.STORYBLOK_PREVIEW_TOKEN,
      components: {
        hero: 'storyblok/Hero',
        project: 'storyblok/Project',
      },
    }),
  ],
});
