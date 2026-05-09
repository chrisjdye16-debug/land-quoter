# Deploy

This is a static site — one HTML file. There is no build step, no database, no environment variables.

## Option 1 — Netlify drag-and-drop (60 seconds)

1. Go to **https://app.netlify.com/drop**
2. Drag the project folder onto the page
3. Done. Netlify gives you a URL like `https://something-cool-1234.netlify.app`

## Option 2 — Netlify from GitHub (recommended for ongoing changes)

1. Push the repo to GitHub.
2. Go to **https://app.netlify.com/start** → Import from Git → pick the repo.
3. Build settings auto-detect from `netlify.toml` (no build command, publish dir = `.`).
4. Click Deploy. Live in seconds.

## Option 3 — Any static host

Drop `index.html` (and `netlify.toml` if you want) onto Vercel, Cloudflare Pages, GitHub Pages, S3, or your own server. It's just one file.

## Local development

```bash
open index.html
# or, if you prefer a local server:
python3 -m http.server 8000   # http://localhost:8000
```

## Custom domain

Netlify → Domain settings → Add custom domain. Point your DNS at Netlify.
