# Deploy to Netlify (5 minutes)

The app needs **one thing** in the cloud: a Postgres database to store leads/projects/estimates.
No API keys, no third-party services beyond the database.

## Step 1 — Create a free Postgres database (Neon)

1. Go to **https://neon.tech** → Sign up (free, no credit card)
2. "Create project" → name it whatever (e.g. "land-quoter")
3. After it provisions, copy the **connection string** shown on the dashboard. It looks like:
   ```
   postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

This URL **is** your database — there's nothing else to configure.

## Step 2 — Push the code to GitHub

Unzip the project, then in Terminal:

```bash
cd land-quoter
git init
git add .
git commit -m "initial"
gh repo create land-quoter --private --source=. --push
```

(If you don't have `gh` installed, just create a private repo on github.com and follow their "push existing repo" instructions.)

## Step 3 — Deploy on Netlify

1. Go to **https://app.netlify.com/start** → Import from Git → pick the `land-quoter` repo
2. Build settings auto-detect from `netlify.toml`. Just click through.
3. **Site settings → Environment variables → Add a single variable:**
   - Key: `DATABASE_URL`
   - Value: the Neon URL from Step 1
4. **Deploys → Trigger deploy → Deploy site.** First build takes ~2 min and runs `prisma db push` automatically to create your tables.
5. When it's done, click the URL Netlify gives you. App is live.

## Local development

```bash
cp .env.example .env
# paste your Neon URL into .env
npm install
npx prisma db push
npm run dev          # http://localhost:3000
```

You can use the same Neon DB for local and prod, or create a separate Neon project for staging.

## Notes

- **No API key needed.** Everything works with manual entry + CSV paste for topo shots.
- **Free tier:** Neon free = 0.5 GB storage (plenty), Netlify free = 100 GB bandwidth/mo, 300 build minutes/mo. You won't hit either with normal use.
- **Custom domain:** Netlify → Domain settings → Add custom domain. Point your DNS at Netlify, done.
