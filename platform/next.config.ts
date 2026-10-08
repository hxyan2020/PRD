import type { NextConfig } from "next";

const isPages = process.env.NEXT_PUBLIC_STATIC_EXPORT === "1";
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || "/PRD/crmp-plus").replace(/\/$/, "");

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  images: { unoptimized: true },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
  ...(isPages
    ? {
        output: "export" as const,
        trailingSlash: true,
        basePath,
        assetPrefix: basePath,
        eslint: { ignoreDuringBuilds: true },
        typescript: { ignoreBuildErrors: true },
        // One worker avoids SQLite seed races (UNIQUE) across prerender workers.
        experimental: { cpus: 1 },
      }
    : {}),
};

export default nextConfig;
