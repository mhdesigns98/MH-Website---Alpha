# Deploying MH Designs

The site runs on [EmDash](https://github.com/emdash-cms/emdash), a CMS built on Astro, as a
Cloudflare Worker on the **personal** Cloudflare account (wrangler profile `personal`, pinned
by `account_id` in `wrangler.jsonc`). Content lives in D1, media in R2.

## Local development

```bash
npm install
npm run dev
```

- Site: http://localhost:4321
- Admin: http://localhost:4321/_emdash/admin

`.env` must contain `EMDASH_ENCRYPTION_KEY` (generate one with `npx emdash secrets generate`).
The first time, the admin opens a setup screen. Pick **Sample content** to load the projects
from `seed/seed.json`.

## Editing content

Add and edit projects in the admin, not in files. Fields map to the old frontmatter:
title, tagline (shows on cards), description (SEO), category, tags (comma-separated),
status, live URL, featured, sort order (1 = first), accent color, and password protection.

To lock a project, turn on **Password protected** and set a **Password**. The check runs on
the server, so locked content is never sent to the browser. Changing the password signs out
everyone who unlocked it before.

`seed/projects/*.md` and `scripts/build-seed.mjs` only seed an empty database. Run
`npm run seed:build` after changing them.

## Deploying

```bash
cd ~/Projects/personal/MH-Website---Alpha
npx wrangler auth activate personal .   # once per checkout
npx wrangler whoami                      # must show the personal account
npm run deploy
```

First deploy only: create the database and bucket, then upload the key.

```bash
npx wrangler d1 create mh-website        # copy database_id into wrangler.jsonc
npx wrangler r2 bucket create mh-website-media
npx wrangler secret put EMDASH_ENCRYPTION_KEY
```

Before the first visit, apply the database migrations from here. Left to the first request,
they run out of time partway and leave a lock that makes every page take 5 to 20 seconds:

```bash
T=$(npx wrangler auth token --json | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).token))")
CLOUDFLARE_API_TOKEN="$T" npx emdash migrate --from-config \
  --account-id=838eca9efa4f66d164c7ff79a7f37263 --d1=<database_id>
```

If it reports a held lock, rerun with `--status`, then add `--take-over-lock=<id>` and
`--expected-target-fingerprint=<fingerprint>` from that output.

Then open `/_emdash/admin` on the live site right away (until then anyone can claim it), choose
**Sample content**, and create the admin account with a passkey.

## Caching

Workers Cache (`"cache"` in `wrangler.jsonc`) serves the homepage and project pages without
running the Worker. Pages stay fresh for 10 minutes, and publishing in the admin purges them.
Locked projects, redirects, errors and signed-in admins are never cached. The cache is per
Cloudflare location, so the first visitor in each region still runs the Worker.

Local dev keeps its database under `.wrangler/state`, keyed by `database_id`. Changing that id
gives local dev a fresh database that needs the setup screen again.

Free plan notes: sandboxed marketplace plugins need Workers Paid, so `worker_loaders` stays
commented out. Each request gets 10ms of CPU on the free plan.
