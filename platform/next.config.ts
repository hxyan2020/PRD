import type { NextConfig } from "next";

const isPages = process.env.NEXT_PUBLIC_STATIC_EXPORT === "1";
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || "/PRD/crmp-admin").replace(/\/$/, "");

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  images: { unoptimized: true },
  ...(isPages
    ? {
        output: "export" as const,
        trailingSlash: true,
        basePath,
        assetPrefix: basePath,
        eslint: { ignoreDuringBuilds: true },
        typescript: { ignoreBuildErrors: true },
      }
    : {}),
};

export default nextConfig;
