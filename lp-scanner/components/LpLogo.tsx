"use client";

import { useState } from "react";
import { lpInitials, lpLogoSrc } from "@/lib/logos";

type Props = {
  lp: { slug: string; name: string; logoUrl?: string; website?: string };
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZE = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-12 w-12 text-sm",
} as const;

export function LpLogo({ lp, size = "md", className = "" }: Props) {
  const [failed, setFailed] = useState(false);
  const box = SIZE[size];

  if (failed) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-lg bg-navy text-foam font-semibold ${box} ${className}`}
        aria-hidden
        title={lp.name}
      >
        {lpInitials(lp.name)}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={lpLogoSrc(lp)}
      alt=""
      title={lp.name}
      width={size === "lg" ? 48 : size === "sm" ? 28 : 36}
      height={size === "lg" ? 48 : size === "sm" ? 28 : 36}
      loading="lazy"
      decoding="async"
      className={`inline-block shrink-0 rounded-lg border border-line/70 bg-white object-contain p-0.5 ${box} ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
