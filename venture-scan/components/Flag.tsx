"use client";

import { withBase } from "@/lib/base-path";

type FlagProps = {
  /** ISO 3166-1 alpha-2 country code, e.g. "us", "cn", "tw" */
  code: string;
  title?: string;
  className?: string;
  size?: "sm" | "md";
};

const SIZE = {
  sm: { w: 18, h: 13, className: "h-[13px] w-[18px]" },
  md: { w: 22, h: 16, className: "h-4 w-[22px]" },
} as const;

/** National flags from self-hosted SVGs under /flags/{code}.svg */
export function Flag({ code, title, className, size = "md" }: FlagProps) {
  const cc = code.trim().toLowerCase();
  const dims = SIZE[size];
  if (!/^[a-z]{2}$/.test(cc)) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-[2px] bg-black/[0.05] text-[9px] text-mist ${dims.className} ${className ?? ""}`}
        title={title}
        aria-hidden
      >
        ··
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- local static SVGs
    <img
      src={withBase(`/flags/${cc}.svg`)}
      width={dims.w}
      height={dims.h}
      alt=""
      title={title}
      aria-hidden
      loading="lazy"
      decoding="async"
      className={`inline-block shrink-0 rounded-[2px] object-cover shadow-[0_0_0_1px_rgba(255,255,255,0.14)] ${dims.className} ${className ?? ""}`}
    />
  );
}
