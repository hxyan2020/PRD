import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["node:sqlite"],
  outputFileTracingExcludes: {
    "*": ["./data/**", "./public/sourced/**"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async rewrites() {
    return [{ source: "/sourced/:path*", destination: "/api/sourced/:path*" }];
  },
};

export default nextConfig;
