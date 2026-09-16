import type { NextConfig } from "next";

const pages = process.env.GITHUB_PAGES === "true";
const basePath =
  process.env.PUBLIC_BASE_PATH || (pages ? "/PRD" : "");
const assetPrefix =
  process.env.PUBLIC_ASSET_PREFIX || basePath;

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  basePath,
  assetPrefix,
};

export default nextConfig;
