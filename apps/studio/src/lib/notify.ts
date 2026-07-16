// ============================================================
//  SP → Brainztem email bridge (server-side only)
//  apps/studio/src/lib/notify.ts
//
//  Brainztem owns the Resend key and the verified brainztem.com
//  sending domain, so SP never holds mail credentials. Every
//  landing-form event POSTs there: relax@brainztem.com gets the
//  lead alert, and on a claim the prospect gets their deck link
//  FROM relax@brainztem.com. Fail-soft by design — mail trouble
//  must never break the form.
//
//  Env: BRAINZTEM_NOTIFY_URL (default prod bridge)
//       BRAINZTEM_NOTIFY_SECRET (shared with brainztem's
//       SP_BRIDGE_SECRET — set on both Vercel projects)
// ============================================================

export type NotifyPayload = {
  kind: "claim" | "scan";
  domain: string;
  email?: string;
  scanId?: string;
  deckUrl?: string;
};

export type NotifyResult = { ok: boolean; notified: boolean; prospectEmailed: boolean; errors?: string[] };

export async function notifyBrainztem(payload: NotifyPayload): Promise<NotifyResult | null> {
  const secret = process.env.BRAINZTEM_NOTIFY_SECRET;
  const url = process.env.BRAINZTEM_NOTIFY_URL ?? "https://brainztem.com/api/notify/sp-lead";
  if (!secret) return null; // unconfigured (e.g. bare local dev) — silently skip
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-sp-bridge-secret": secret },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json().catch(() => null)) as NotifyResult | null;
    if (!res.ok || !data?.ok) {
      console.error(`[notify] bridge ${res.status}: ${JSON.stringify(data?.errors ?? [])}`);
    }
    return data;
  } catch (e) {
    console.error(`[notify] bridge unreachable: ${e instanceof Error ? e.message : e}`);
    return null;
  }
}

/** Absolute deck URL for emails (never a relative path). */
export function absoluteDeckUrl(params: { source: "scan" | "sample"; scanId?: string | null; template?: string }): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.strategypresentation.com";
  const q = new URLSearchParams({ source: params.source, template: params.template ?? "signal" });
  if (params.source === "scan" && params.scanId) q.set("id", params.scanId);
  return `${base}/api/demo/deck?${q.toString()}`;
}
