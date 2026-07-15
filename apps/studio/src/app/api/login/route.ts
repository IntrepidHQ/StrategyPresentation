// ============================================================
//  SP Studio — Login
//  apps/studio/src/app/api/login/route.ts
//
//  Verifies the passphrase server-side and sets the session as
//  an HttpOnly cookie so client JS never touches the secret.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { passphrase?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const expected = process.env.STUDIO_PASSPHRASE;
  if (!expected || body.passphrase !== expected) {
    return NextResponse.json({ ok: false, error: "Incorrect passphrase" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, expected, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return res;
}
