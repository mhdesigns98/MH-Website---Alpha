# Deploying MH Designs

## Local Development

```bash
npm install
npm run dev
```

Opens at http://localhost:4321

---

## Deploying to Vercel (Recommended — Free)

1. Push this folder to a GitHub repo (github.com → New repository)
2. Go to vercel.com → Sign in with GitHub → "Add New Project"
3. Select your repo — Vercel auto-detects Astro, no config needed
4. Hit Deploy. Done.

Every time you push to GitHub, Vercel auto-redeploys.

---

## Deploying to Cloudflare Pages (Also Free)

1. Push to GitHub
2. Go to dash.cloudflare.com → Workers & Pages → Create → Pages → Connect to Git
3. Select your repo
4. Build settings:
   - Build command: `npm run build`
   - Build output: `dist`
5. Deploy.

---

## Adding a New Project

1. Create a new file in `src/content/projects/your-project-name.md`
2. Copy the frontmatter from an existing project and update the fields
3. Write your project description below the `---` in markdown
4. Push to GitHub — it deploys automatically

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
