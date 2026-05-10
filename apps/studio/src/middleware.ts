import { NextRequest, NextResponse } from "next/server";

const RESERVED_SUBDOMAINS = new Set([
  "www",
  "studio",
  "develop",
  "preview",
  "saunders", // legacy — handled by apps/studio/vercel.json rewrite
]);

const APEX_HOSTS = new Set([
  "strategypresentation.com",
  "strategypresentation.local",
  "localhost",
  "localhost:3001",
]);

const PUBLIC_PATHS = ["/login", "/api/webhook", "/api/checkout-webhook"];

function getClientSlug(host: string): string | null {
  const bare = host.split(":")[0];
  if (APEX_HOSTS.has(host) || APEX_HOSTS.has(bare)) return null;
  if (!bare.endsWith(".strategypresentation.com")) return null;
  const sub = bare.slice(0, -".strategypresentation.com".length);
  if (RESERVED_SUBDOMAINS.has(sub)) return null;
  return sub;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get("host") ?? "";

  // 1. Subdomain rewrites for client strategies
  const slug = getClientSlug(host);
  if (
    slug &&
    !pathname.startsWith("/strategies/") &&
    !pathname.startsWith("/_next/") &&
    !pathname.startsWith("/api/")
  ) {
    const url = req.nextUrl.clone();
    url.pathname = `/strategies/${slug}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  // 2. Public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 3. /strategies/[slug] is publicly readable (gated by gate.js inside the HTML)
  if (pathname.startsWith("/strategies/")) {
    return NextResponse.next();
  }

  // 4. API routes — handled per-route via x-studio-passphrase
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // 5. Studio pages — session cookie required
  const session = req.cookies.get("sp_studio_session");
  if (!session || session.value !== process.env.STUDIO_PASSPHRASE) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
