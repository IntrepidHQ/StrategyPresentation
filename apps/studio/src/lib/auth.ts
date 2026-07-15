// ============================================================
//  SP Studio — Server-side auth
//  apps/studio/src/lib/auth.ts
//
//  Two accepted credentials, both checked server-side only:
//   1. sp_studio_session HttpOnly cookie (set by POST /api/login)
//   2. x-studio-passphrase header (scripts/CLI, e.g. scripts/seed-dev.ts)
//  The passphrase must never be exposed via NEXT_PUBLIC_* env vars.
// ============================================================

import { timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

export const SESSION_COOKIE = "sp_studio_session";

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function isStudioAuthorized(req: NextRequest): boolean {
  const expected = process.env.STUDIO_PASSPHRASE;
  if (!expected) return false;

  const header = req.headers.get("x-studio-passphrase");
  if (header && safeEqual(header, expected)) return true;

  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  return Boolean(cookie && safeEqual(cookie, expected));
}
