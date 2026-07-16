import type { MetadataRoute } from "next";
import { getAllPosts } from "../content/blog";

// Only the genuinely public marketing surface. The deck API and studio are
// deliberately absent — decks are per-client documents (noindex'd in their
// own HTML), and the studio is gated.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.strategypresentation.com";
  const posts = getAllPosts();
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    {
      url: `${base}/blog`,
      changeFrequency: "weekly",
      priority: 0.8,
      lastModified: posts[0] ? new Date(`${posts[0].date}T12:00:00Z`) : undefined,
    },
    ...posts.map((p) => ({
      url: `${base}/blog/${p.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
      lastModified: new Date(`${p.date}T12:00:00Z`),
    })),
  ];
}
