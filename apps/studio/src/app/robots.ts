import type { MetadataRoute } from "next";

// Crawl policy for the MARKETING host (strategypresentation.com). The studio
// subdomain + vercel.app previews are noindexed via host-conditional
// X-Robots-Tag headers in next.config, which overrides this allow — so one
// static robots file serves both audiences correctly.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/studio", "/login"],
      },
    ],
    sitemap: "https://www.strategypresentation.com/sitemap.xml",
  };
}
