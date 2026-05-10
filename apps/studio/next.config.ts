import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Studio never needs to be indexed
  headers: async () => [
    {
      source: "/(.*)",
      headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
    },
  ],
};

export default nextConfig;
