import cloudflare from '@astrojs/cloudflare';
import { cacheCloudflare } from '@astrojs/cloudflare/cache';
import react from '@astrojs/react';
import { d1, r2 } from '@emdash-cms/cloudflare';
import { defineConfig } from 'astro/config';
import emdash from 'emdash/astro';

export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  integrations: [
    react(),
    emdash({
      database: d1({ binding: 'DB', session: 'auto', coalesce: true }),
      storage: r2({ binding: 'MEDIA' }),
    }),
  ],
  // Workers Cache serves repeat visits without running the Worker. Pages pass
  // EmDash cache hints, so publishing in the admin purges the stale copy.
  // Signed-in admins and password-locked projects are never cached.
  cache: { provider: cacheCloudflare() },
  routeRules: {
    '/': { maxAge: 600, swr: 3600 },
    '/projects/[slug]': { maxAge: 600, swr: 3600 },
  },
  devToolbar: { enabled: false },
});
