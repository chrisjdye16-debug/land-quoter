# Land Quoter

Estimating + CRM for land developers. Next.js + Postgres. Deploys to Netlify in ~5 minutes.

**To deploy:** see [DEPLOY.md](./DEPLOY.md).

## What's in v1

- **CRM**: Leads → Projects → Estimates, all persisted (versioned per project)
- **Dirt import/export estimator**:
  - Inputs: acreage, target elevation, shrinkage %, $/CY material, $/CY haul
  - Outputs: neat (compacted) volume, loose (imported) volume, total cost
  - Uses TIN-weighted average elevation when shots have x/y coords; plain mean otherwise
- **Topo data input — two methods, no API key needed:**
  1. **Paste CSV** — fuzzy header detection (`pointId, northing, easting, elevation` or just bare elevations)
  2. **Manual entry** — single-shot form
- **Other estimate types stubbed for later:** clearing, grading, utilities, paving, other

## Smoke test (200 ac, 427.26 → 439)

- Neat fill: **3,788,107 CY**
- With 20% shrinkage: **4,735,133 CY** imported

## Local development

```bash
cp .env.example .env
# edit .env, paste your Neon (or any Postgres) URL
npm install
npx prisma db push
npm run dev          # http://localhost:3000
```

## File layout

```
prisma/schema.prisma   # DB schema
src/lib/dirt.ts        # volume calc + TIN
src/lib/csvShots.ts    # CSV parser
src/app/               # pages + API routes
netlify.toml           # Netlify build config
```

## DB tools

- `npm run db:studio` — Prisma Studio GUI for browsing/editing data
- `npm run db:push` — apply schema changes to your Postgres
