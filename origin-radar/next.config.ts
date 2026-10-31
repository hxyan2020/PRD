import type { NextConfig } from "next";

const isStatic = process.env.STATIC_EXPORT === "1";
const basePath = process.env.BASE_PATH || "";

const nextConfig: NextConfig = {
  ...(isStatic ? { output: "export" as const, trailingSlash: true } : {}),
  ...(basePath ? { basePath } : {}),
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  // Factory listing JPEGs are vendored in /public/factory; skip the optimizer.
  images: { unoptimized: true },
  ...(!isStatic
    ? {
        serverExternalPackages: ["node:sqlite"],
        outputFileTracingExcludes: {
          "*": ["./data/**", "./public/sourced/**"],
        },
        async rewrites() {
          return [{ source: "/sourced/:path*", destination: "/api/sourced/:path*" }];
        },
      }
    : {}),
};

export default nextConfig;
