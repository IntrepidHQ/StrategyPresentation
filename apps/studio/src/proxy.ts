// ============================================================
//  SP Studio - Proxy Guard + host routing
//  apps/studio/src/proxy.ts
//
//  One Next app serves two audiences:
//   - Marketing hosts (strategypresentation.com, www) get the
//     public landing page: "/" rewrites to /home, and studio
//     pages redirect to the studio subdomain.
//   - Every other host (studio.strategypresentation.com,
//     localhost, previews) is the gated studio: non-API pages
//     require the HttpOnly session cookie set by POST /api/login;
//     API routes self-authenticate via isStudioAuthorized().
// ============================================================

import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/home",
  "/blog",        // public marketing blog (index + /blog/[slug])
  "/docs",        // public docs — how Strategy Presentation works
  "/privacy",     // public legal page — must not gate to /login (crawlable)
  "/terms",       // public legal page — must not gate to /login (crawlable)
  "/templates",   // template gallery thumbnails (public/)
  "/icon.svg",
  "/apple-icon.png", // iOS home-screen icon (special file in src/app/); favicon.ico
                     // bypasses this proxy entirely via the matcher below.
  "/api/webhook",
  // Crawler surface — robots + sitemap must never gate to /login (they were
  // 307ing there until 2026-07-15, so search engines could index nothing).
  "/robots.txt",
  "/sitemap.xml",
  // Chess piece point-cloud geometry for the landing hero (public/).
  "/chess-points.bin",
];

const MARKETING_HOSTS = new Set(["strategypresentation.com", "www.strategypresentation.com"]);
const STUDIO_ORIGIN = "https://studio.strategypresentation.com";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = (req.headers.get("host") ?? "").split(":")[0].toLowerCase();

  if (MARKETING_HOSTS.has(host)) {
    if (pathname === "/") {
      const url = req.nextUrl.clone();
      url.pathname = "/home";
      return NextResponse.rewrite(url);
    }
    // The studio never lives on the marketing domain.
    if (pathname === "/login" || pathname.startsWith("/studio")) {
      return NextResponse.redirect(new URL(pathname, STUDIO_ORIGIN));
    }
  }

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
