import type { MetadataRoute } from "next";

// Only the genuinely public marketing surface. The deck API and studio are
// deliberately absent — decks are per-client documents (noindex'd in their
// own HTML), and the studio is gated.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.strategypresentation.com";
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
  ];
}
