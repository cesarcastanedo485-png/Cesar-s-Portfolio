# Deploy this portfolio

## Prerequisites

1. **Git**: `git init`, commit, push to GitHub/GitLab/Bitbucket.
2. **Production build**: locally run `npm run lint` and `npm run build`, or rely on [GitHub Actions](.github/workflows/ci.yml) after push.

If Windows reports **EPERM** / corrupted `node_modules`, see [README.md](README.md) (Defender exclusions, `reset-node-modules` script, or clone under `C:\dev\...`). CI on Ubuntu is the sanity check for a clean install.

## Vercel (recommended)

1. Sign in at [vercel.com](https://vercel.com) and **Import** your Git repository.
2. Framework preset: **Next.js**. Root directory: project root (where `package.json` lives).
3. Build command: `npm run build` (default). Output: Next handles this automatically.
4. Deploy. Note your production URL (e.g. `https://your-project.vercel.app`).

### After first deploy

1. Open **`content/portfolio.json`** and set **`site.canonicalBase`** to your real URL (with `https://`). This drives `metadataBase`, Open Graph `url`, and social cards.
2. Replace placeholder social links (`yourusername`, `yourprofile`, `yourhandle`) in the same file.
3. Optional: replace **`public/og.svg`** with a **1200×630** PNG (e.g. `public/og.png`) and set **`site.ogImage`** to `/og.png` for maximum compatibility with social previews.

### Custom domain

In Vercel → Project → **Settings → Domains**, add your domain and follow DNS instructions at your registrar. SSL is automatic.

### Assets

Ensure everything under **`public/`** (e.g. `public/games/*`) is committed so production serves icons and images.

`npm run build` runs **`verify:assets`** first: it reads **`content/portfolio.json`** and fails if any referenced `/path` is missing under **`public/`**. That stops broken hero images, audio, icons, and Godot demo folders from reaching production. Either commit the file or leave the field empty until the asset exists.

Rain / atmosphere video: tune **`rainVideoBlend`**, **`rainVideoKey`**, and luma fields in **`content/portfolio.json`**. Optional alpha check: **`/rain-alpha-check.html`** with `npm run dev`.
