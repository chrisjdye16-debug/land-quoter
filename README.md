# Land Quoter

Fast dirt-import quotes for land developers. One static HTML file. Zero backend, zero build, zero config.

## What it does

Enter acreage, current and target elevation, shrinkage %, your cost per CY, and your sell price.
Get a live quote: imported (loose) cubic yards, total cost, total sell, profit, margin.

Optionally save quotes to your browser's local storage (no account, no server).

## How the math works

```
compacted CY = (acreage × 43560 × elevation_diff) / 27
imported CY  = compacted_CY / (1 − shrinkage / 100)
```

## Smoke test (200 ac, 427.26 ft → 439 ft, 20% shrinkage)

- Compacted (in-place) volume: **3,788,107 CY**
- Imported (loose, with 20% shrinkage): **4,735,135 CY**

## Run locally

Just open `index.html` in a browser. There is no build step.

```bash
open index.html
# or, if you prefer a server:
python3 -m http.server 8000   # then visit http://localhost:8000
```

## Deploy

See [DEPLOY.md](./DEPLOY.md). Drag the folder onto Netlify (or any static host) — done.

## File layout

```
index.html      # the entire app: markup, CSS, JS in one file
netlify.toml    # publish dir = repo root, no build command
```
