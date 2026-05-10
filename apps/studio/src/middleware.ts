// ============================================================
//  SP Studio — Middleware (localhost guard)
//  apps/studio/src/middleware.ts
//
//  The studio is never deployed publicly, but as a second layer
//  of protection, all non-API routes check a session cookie set
//  by the /login page. API routes check x-studio-passphrase header.
// ============================================================

import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/api/webhook"]; // webhook must be public for WCS to call

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // API routes: header auth (handled per-route)
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Page routes: session cookie check
  const session = req.cookies.get("sp_studio_session");
  if (!session || session.value !== process.env.STUDIO_PASSPHRASE) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
