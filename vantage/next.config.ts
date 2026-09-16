import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  // Relative prefix so one export works at a domain root and on jsDelivr.
  assetPrefix: ".",
};

export default nextConfig;
