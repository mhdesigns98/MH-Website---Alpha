MH Designs, Mike Hayes's portfolio. An Astro site with the EmDash CMS, running as a Cloudflare
Worker (`mh-website`) on the **personal** Cloudflare account. Live at
https://mh-website.mikehayesdesign.workers.dev. Deploy steps, first-deploy migrations and caching
are in [DEPLOY.md](DEPLOY.md).

## Commands

```bash
npm run dev           # Astro dev server, http://localhost:4321 (admin at /_emdash/admin)
npm run build         # production build
npm run typecheck     # astro check
npm run deploy        # build + wrangler deploy (personal account only)
npm run seed:build    # regenerate seed/seed.json from seed/projects/*.md
npx emdash types      # regenerate emdash-env.d.ts from a running site
npx wrangler types    # regenerate worker-configuration.d.ts after editing wrangler.jsonc
```

Before any `wrangler` write, run `npx wrangler whoami` in this folder and confirm the personal
account (`838eca9e…`). The folder is bound to the wrangler auth profile `personal`, and
`account_id` is pinned in `wrangler.jsonc`.

## Key files

| File                              | Purpose                                                                  |
| --------------------------------- | ------------------------------------------------------------------------ |
| `astro.config.mjs`                | Cloudflare adapter, `emdash()` with D1 + R2, Workers Cache route rules   |
| `wrangler.jsonc`                  | Worker name, account, D1/R2 bindings, `cache`, cron trigger              |
| `src/live.config.ts`              | EmDash loader registration (boilerplate, don't modify)                   |
| `src/worker.ts`                   | Worker entry with EmDash's scheduled handler (boilerplate)               |
| `src/layouts/Layout.astro`        | Page shell with the EmDash head/body hooks                               |
| `src/lib/projects.ts`             | Tag splitting, status classes, password-gate signing                     |
| `src/pages/index.astro`           | Home: hero, Selected Work grid, About                                    |
| `src/pages/projects/[slug].astro` | Project detail and the server-side password gate                         |
| `src/components/`                 | `Header`, `Hero`, `ProjectCard`, `Footer`                                |
| `src/styles/global.css`           | Design tokens and base styles                                            |
| `seed/projects/*.md`              | Original project write-ups, the source for the seed                      |
| `scripts/build-seed.mjs`          | Builds `seed/seed.json` (schema + content) from those markdown files     |
| `emdash-env.d.ts`                 | Generated collection types (regenerated on dev server start)             |

## Content model

One collection, `projects`. Fields (slug: type):

- `title`: string, required
- `tagline`: text, required. Shows on cards and under the project title.
- `description`: text. SEO description.
- `category`: select, one of Gaming Tool, Web Design, Podcast, Documentary, Dev Tool, Branding
- `tags`: string, comma-separated. Use `splitTags()` from `src/lib/projects.ts`.
- `project_status`: select, one of Live, In Progress, Concept. Named so it doesn't clash with
  EmDash's own `status` (draft/published).
- `url`: url. Live site link, rendered only if it's http(s).
- `featured`: boolean
- `order`: integer. The home grid sorts by it ascending (1 = first).
- `accent`: string, a hex color for the card glow and project hero
- `protected`: boolean, and `access_password`: string. See Password gate.
- `content`: Portable Text. Render with `<PortableText>` from `emdash/ui`.

There are no image fields, pages collection, taxonomies or menus. Hero and About copy are
written into `Hero.astro` and `index.astro`, not stored in the CMS.

Edit content in the admin. The seed only applies to an empty database on first setup, so
changing `seed/projects/*.md` does nothing to a live site.

## Pages

| Path               | What it shows                                                           |
| ------------------ | ----------------------------------------------------------------------- |
| `/`                | Hero, "Selected Work" grid of published projects, About with stat panel |
| `/projects/[slug]` | Category and status, title, tagline, tags, Visit site button, body      |

Unknown slugs redirect to `/404`. URLs are `/projects/...` (not the template's `/work/...`); keep
them stable.

## Password gate

A project with `protected` on is checked on the server. The content is never rendered until the
visitor posts the right password, which sets an HttpOnly cookie signed with
`EMDASH_ENCRYPTION_KEY` and scoped to that project's path. The signature includes the password,
so changing it relocks everyone. A protected project with no password stays locked.

Locked and unlocked responses must stay `Cache-Control: private, no-store` with
`Astro.cache.set(false)`. Don't move the check to the client.

## Caching

Workers Cache serves `/` and `/projects/[slug]` (10 min fresh, 1 h stale-while-revalidate, set in
`routeRules`). Rules when touching these routes:

- Pass content-query hints with `Astro.cache.set(cacheHint)` so publishing purges the page.
- Call `Astro.cache.set(false)` for anything visitor-specific, and for redirects and errors (a
  cached 404 redirect would hide a newly published project).
- EmDash already skips the cache for signed-in admins.

Cache misses use roughly 50 to 130 ms of CPU against the free plan's 10 ms limit, so keep
per-request work small.

## Design

Dark, technical, with one cyan accent. These come from `src/styles/global.css`, not the EmDash
template; the template's `tokens.css`, `theme.css` and `Base.astro` aren't used here.

- Tokens: `--bg #080810`, `--surface`, `--surface-2`, `--border`, `--text`, `--muted`,
  `--accent #00d9ff`, `--accent-glow`, radii `--radius-sm/md/lg`, `--transition`.
- Type: Space Grotesk for headings and UI labels (`--font-head`), Inter for body
  (`--font-body`), loaded from Google Fonts in `global.css`.
- Each project has its own `accent` that tints its card glow and hero glow. Keep the site accent
  cyan and let project accents carry any other color.
- Layout lives in `.container` (see `global.css`). Cards are rounded surfaces with a hairline
  border. The home grid is `repeat(auto-fill, minmax(320px, 1fr))`.

Copy rules for this site: no em dashes in new copy, no invented stats or testimonials, no
generic CTAs, and every link must go somewhere real.

## EmDash reference

Agent skills are in `.agents/skills/` (`building-emdash-site`, `creating-plugins`,
`emdash-cli`). They describe the stock template in places. Where they disagree with this file
about schema, pages or design, this file wins.

- No `getStaticPaths()` for CMS content; everything is server-rendered.
- `entry.id` is the slug (use in URLs); `entry.data.id` is the database ULID.
- Booleans come back from the database as 0/1; treat them as truthy/falsy.
- Live docs: the EmDash docs MCP server at `https://docs.emdashcms.com/mcp`. It isn't configured
  in this repo; see https://docs.emdashcms.com/docs-mcp to add it.
