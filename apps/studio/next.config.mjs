import path from "node:path";

const nextConfig = {
  outputFileTracingRoot: path.join(process.cwd(), "../.."),
  async headers() {
    // The studio and preview deployments stay out of search engines;
    // the marketing host (which serves /home) is intentionally NOT
    // matched here so the landing page can be indexed.
    return [
      {
        source: "/(.*)",
        has: [{ type: "host", value: "studio.strategypresentation.com" }],
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/(.*)",
        has: [{ type: "host", value: "(?<sub>.*)\\.vercel\\.app" }],
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
