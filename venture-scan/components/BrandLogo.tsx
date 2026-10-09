"use client";

import { withBase } from "@/lib/base-path";

type BrandLogoProps = {
  /** Pixel size of the square mark */
  size?: number;
  className?: string;
  /** Decorative only when paired with visible “VentureScan” text */
  decorative?: boolean;
};

export function BrandLogo({ size = 36, className, decorative = true }: BrandLogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={withBase("/logo.png")}
      alt={decorative ? "" : "VentureScan"}
      width={size}
      height={size}
      decoding="async"
      className={`shrink-0 rounded-[22%] ${className ?? ""}`}
      aria-hidden={decorative || undefined}
    />
  );
}
