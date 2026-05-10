# Vercel Setup Guide
## strategypresentation.com + SP Studio

---

## Overview

Two things live on Vercel:

1. **The Studio app** (`apps/studio`) — runs the Next.js API routes and serves the local editor. Deployed to `studio.strategypresentation.com` (password-protected, for Hans only).
2. **Client strategy files** — individual static HTML files deployed via the Vercel Deploy API to `[slug].strategypresentation.com`. These are **not** Next.js routes — they're separate file deployments.

---

## Step 1: Create the Vercel Project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the `IntrepidHQ/StrategyPresentation` GitHub repo
3. **Framework:** Next.js
4. **Root Directory:** `apps/studio`
5. **Build Command:** `npm run build` (default is fine)
6. **Output Directory:** `.next` (default)
7. Click **Deploy**

---

## Step 2: Configure the Domain

### Primary domain
In Vercel project → **Settings → Domains**, add:
```
strategypresentation.com
www.strategypresentation.com
```

### Wildcard subdomain (critical for client strategies)
Add a wildcard record:
```
*.strategypresentation.com
```

**DNS records to add at your registrar:**
```
Type    Name    Value
A       @       76.76.21.21     (Vercel's IP)
CNAME   www     cname.vercel-dns.com
CNAME   *       cname.vercel-dns.com    ← wildcard for all subdomains
```

> Note: Wildcard SSL is handled automatically by Vercel once the CNAME is verified.

### Studio subdomain
Vercel will serve the Next.js app at the root domain. To also have it at `studio.strategypresentation.com`, add that domain in Vercel settings. You'll use this URL to run the webhook endpoint publicly so WCS can reach it.

---

## Step 3: Environment Variables in Vercel

Go to: **Project → Settings → Environment Variables**

Add all of these, scoped to **Production** and **Preview**:

| Variable | Value | Notes |
|----------|-------|-------|
| `ANTHROPIC_API_KEY` | `sk-ant-...` | From PasswordN |
| `SUPABASE_URL` | `https://xxx.supabase.co` | Supabase project settings |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | **Not** the anon key |
| `SP_WEBHOOK_SECRET` | 64-char hex | Same value in WCS + SP |
| `VERCEL_TOKEN` | From Vercel account settings | Deploy API access |
| `VERCEL_PROJECT_ID` | `prj_xxx` | From project settings → General |
| `VERCEL_TEAM_ID` | `team_xxx` | Only if using a team account |
| `STUDIO_PASSPHRASE` | `HansStudio2026` | Set something strong |
| `NEXT_PUBLIC_STUDIO_PASSPHRASE` | Same as above | Exposed to browser |

> `NEXT_PUBLIC_*` variables are embedded in the browser bundle. Only use this for the passphrase since the studio is localhost-only in practice. If you ever deploy the studio publicly, remove `NEXT_PUBLIC_STUDIO_PASSPHRASE` and use cookie auth only.

---

## Step 4: Production vs Preview Branches

| Branch | URL | Purpose |
|--------|-----|---------|
| `main` | `strategypresentation.com` | Production — live client strategies |
| `develop` | `develop.strategypresentation.com` | Preview — test new studio features |

Set this up in **Project → Settings → Git**:
- Production branch: `main`
- Preview branches: all other branches (Vercel default)

**Workflow:**
- Build features on `develop` branch → test at `develop.strategypresentation.com`
- Merge to `main` → auto-deploys to production
- Client strategy HTML files are deployed via API (not Git) — they land on production regardless of branch

---

## Step 5: Deploy API Token

The studio's `/api/publish` route calls the Vercel Deploy API. You need a token with deploy permissions.

1. Go to [vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Create a token named `sp-studio-deploy`
3. Scope: **Full Account** (needed to create deployments and assign aliases)
4. Copy the token → add to Vercel env vars as `VERCEL_TOKEN`
5. Also add to `apps/studio/.env.local` for local testing

---

## Step 6: Find Your Project ID

1. Go to Vercel → your `strategypresentation` project
2. **Settings → General** → scroll to **Project ID**
3. Copy and add as `VERCEL_PROJECT_ID` env var

---

## Step 7: Webhook URL for WCS

Once deployed, the webhook endpoint lives at:
```
https://studio.strategypresentation.com/api/webhook
```

Set this in WCS as:
```
SP_WEBHOOK_URL=https://studio.strategypresentation.com/api/webhook
```

Along with the shared secret:
```
SP_WEBHOOK_SECRET=<same 64-char hex as in SP>
```

---

## Step 8: Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste the contents of `supabase/schema.sql` → **Run**
3. Go to **Project Settings → API**:
   - Copy **Project URL** → `SUPABASE_URL`
   - Copy **service_role** key (NOT `anon`) → `SUPABASE_SERVICE_ROLE_KEY`

---

## How Client Strategy Deployments Work

When Hans clicks Publish in the studio:

1. Studio calls `POST /api/publish` with the strategy ID
2. Server fetches the current HTML from Supabase
3. Calls Vercel Deploy API: uploads the HTML as a file, creates a deployment
4. Assigns the alias `[slug].strategypresentation.com` to that deployment
5. The strategy is now live at `https://[slug].strategypresentation.com`

Each client strategy is an **independent static deployment** — not a route in the Next.js app. This means:
- Strategies are fast (no server-side rendering)
- Strategies survive studio outages
- Each can be rolled back independently
- The wildcard subdomain catches all of them

---

## Testing the Webhook Locally

To test the WCS → SP trigger without deploying:

```bash
# In one terminal: start studio
cd apps/studio && npm run dev

# In another terminal: simulate a WCS webhook (dev bypass mode)
curl -X POST http://localhost:3001/api/webhook \
  -H "Content-Type: application/json" \
  -H "X-WCS-Dev-Bypass: true" \
  -H "X-WCS-Timestamp: $(date +%s)" \
  -H "X-WCS-Signature: sha256=dev" \
  -d @scripts/test-payload.json
```

Then open http://localhost:3001 to see the new strategy in the dashboard.
