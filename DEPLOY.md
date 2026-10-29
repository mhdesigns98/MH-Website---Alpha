# Deploying MH Designs

## Local Development

```bash
npm install
npm run dev
```

Opens at http://localhost:4321

---

## Deploying

The site is a static build served from Cloudflare as the Worker `mh-designs` on the
**personal** Cloudflare account (wrangler profile `personal`, pinned by `account_id` in
`wrangler.jsonc`). Live at https://mh-designs.mikehayesdesign.workers.dev.

```bash
npx wrangler auth activate personal .   # once per checkout
npx wrangler whoami                      # must show the personal account
npm run deploy
```

Pushing to GitHub doesn't deploy anything. Run `npm run deploy` after merging.

---

## Adding a New Project

1. Create a new file in `src/content/projects/your-project-name.md`
2. Copy the frontmatter from an existing project and update the fields
3. Write your project description below the `---` in markdown
4. Run `npm run deploy` to publish it

### Frontmatter fields:
- `title` — Project name
- `tagline` — One-line description (shows on cards)
- `description` — Longer description for SEO
- `category` — One of: Gaming Tool, Web Design, Podcast, Documentary, Dev Tool, Branding
- `tags` — Array of tech/skill tags
- `status` — Live, In Progress, or Concept
- `url` — Optional live URL
- `featured` — true/false
- `order` — Number controlling sort order (1 = first)
- `accent` — Hex color for the card's glow effect
