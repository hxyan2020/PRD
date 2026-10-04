import type { NextConfig } from "next";

/** GitHub Pages project site is https://hxyan2020.github.io/PRD/ */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") || "";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  ...(basePath
    ? {
        basePath,
        assetPrefix: basePath,
      }
    : {}),
};

export default nextConfig;
