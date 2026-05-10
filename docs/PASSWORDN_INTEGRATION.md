# PasswordN Integration
## How passwordn.com feeds secrets to SP Studio and WCS

---

## Current State (Phase 1)

Both apps read secrets from environment variables:
- Local dev: `apps/studio/.env.local`
- Production: Vercel environment variables UI

This is fine to start. PasswordN integration is Phase 2.

---

## Secrets That SP Studio Uses

| Key | Used By | Description |
|-----|---------|-------------|
| `ANTHROPIC_API_KEY` | `lib/anthropic.ts` | Claude API access |
| `SUPABASE_URL` | `lib/db.ts` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `lib/db.ts` | Supabase admin key |
| `VERCEL_TOKEN` | `lib/vercel-deploy.ts` | Deploy API token |
| `VERCEL_PROJECT_ID` | `lib/vercel-deploy.ts` | Which Vercel project |
| `SP_WEBHOOK_SECRET` | `lib/webhook-verify.ts` | HMAC shared secret with WCS |
| `STUDIO_PASSPHRASE` | middleware + all API routes | Local auth |

## Secrets That WCS Needs (to trigger SP)

| Key | Used By | Description |
|-----|---------|-------------|
| `SP_WEBHOOK_SECRET` | `lib/sp-webhook.ts` | Same HMAC secret as above |
| `SP_WEBHOOK_URL` | `lib/sp-webhook.ts` | `https://studio.strategypresentation.com/api/webhook` |

---

## Phase 2: PasswordN API Design

PasswordN should expose a simple authenticated secrets API:

```
GET  /api/secrets/:key          → { key, value, rotated_at }
POST /api/secrets/:key          → create/update secret
DELETE /api/secrets/:key        → delete secret
GET  /api/secrets               → list all key names (not values)
```

**Auth:** Bearer token per-app (each app gets its own PasswordN API key).

**Usage in SP Studio:**

```typescript
// lib/passwordn.ts
export async function getSecret(key: string): Promise<string> {
  const apiKey = process.env.PASSWORDN_API_KEY;
  const baseUrl = process.env.PASSWORDN_URL ?? "https://passwordn.com";

  const res = await fetch(`${baseUrl}/api/secrets/${key}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    // Don't cache — always get fresh value
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`PasswordN: failed to fetch ${key}`);
  const data = await res.json();
  return data.value;
}
```

**Startup secret loading:**

```typescript
// In the Next.js app startup or a cached singleton:
let cachedSecrets: Record<string, string> = {};

export async function loadSecrets(): Promise<void> {
  const keys = ["ANTHROPIC_API_KEY", "SP_WEBHOOK_SECRET", "SUPABASE_SERVICE_ROLE_KEY"];
  const results = await Promise.all(keys.map(k => getSecret(k)));
  keys.forEach((k, i) => { cachedSecrets[k] = results[i]; });
}

export function secret(key: string): string {
  return cachedSecrets[key] ?? process.env[key] ?? "";
}
```

---

## Secret Rotation Flow (Phase 2)

1. Hans opens PasswordN.com → rotates `SP_WEBHOOK_SECRET`
2. PasswordN generates new 64-char hex value
3. PasswordN pushes new value to both WCS and SP via a rotation webhook (or they pull on next request)
4. Both apps use the new secret within seconds
5. No Vercel env var update needed
6. No redeployment needed

This is the long-term vision: PasswordN as the single source of truth for all Hans's infrastructure secrets across all three products.

---

## PasswordN App Scope (separate project)

PasswordN.com should be built as a standalone Next.js app (separate GitHub repo) with:
- Supabase backend (secrets table with encryption at rest)
- Simple web UI for Hans to view/rotate secrets
- API endpoint for apps to fetch secrets by key
- Per-app API keys (so WCS and SP have separate access)
- Audit log of secret fetches and rotations
- Optional: webhook to notify apps of rotations

The secrets table should store values encrypted (Supabase Vault or application-level AES-256) — not plaintext.
