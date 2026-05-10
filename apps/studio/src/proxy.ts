// ============================================================
//  SP Studio - Proxy Guard
//  apps/studio/src/proxy.ts
//
//  The studio is never deployed publicly, but as a second layer
//  of protection, all non-API routes check a session cookie set
//  by the /login page. API routes check x-studio-passphrase header.
// ============================================================

import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/api/webhook"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const session = req.cookies.get("sp_studio_session");
  if (!session || session.value !== process.env.STUDIO_PASSPHRASE) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
