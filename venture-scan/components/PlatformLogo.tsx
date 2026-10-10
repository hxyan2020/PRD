"use client";

import { withBase } from "@/lib/base-path";

type PlatformLogoProps = {
  sourceId: string;
  name: string;
  /** Prefer png; fall back handled via onError to svg monogram path */
  className?: string;
};

export function PlatformLogo({ sourceId, name, className }: PlatformLogoProps) {
  const png = withBase(`/logos/${sourceId}.png`);
  const svg = withBase(`/logos/${sourceId}.svg`);
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <span
      className={`relative inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/12 bg-white/90 ${className ?? ""}`}
      title={name}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={png}
        alt=""
        width={36}
        height={36}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-contain p-1"
        onError={(e) => {
          const img = e.currentTarget;
          if (img.dataset.fallback === "1") {
            img.style.display = "none";
            const sib = img.nextElementSibling as HTMLElement | null;
            if (sib) sib.hidden = false;
            return;
          }
          img.dataset.fallback = "1";
          img.src = svg;
        }}
      />
      <span
        hidden
        className="font-display text-sm text-ink"
        aria-hidden
      >
        {initial}
      </span>
    </span>
  );
}
