import type { NextConfig } from "next";

const pages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  basePath: pages ? "/PRD" : "",
  assetPrefix: pages ? "/PRD" : "",
};

export default nextConfig;
