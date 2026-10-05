"use client";

import { useState } from "react";
import { brandInitials, brandTint, faviconUrlForSource } from "@/lib/market-intel/source-brand";
import { cn } from "@/lib/utils";

export function SourceBrandMark({
  sourceKey,
  name,
  url,
}: {
  sourceKey: string;
  name: string;
  url: string | null | undefined;
}) {
  const [failed, setFailed] = useState(false);
  const initials = brandInitials(name);
  const tint = brandTint(sourceKey);
  const src = faviconUrlForSource(sourceKey, url);

  return (
    <span
      className={cn(
        "relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border overflow-hidden",
        failed ? tint : "bg-white border-[var(--line)]"
      )}
      data-testid={`source-logo-${sourceKey}`}
      title={name}
    >
      {!failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          width={28}
          height={28}
          className="h-7 w-7 object-contain"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-[11px] font-bold tracking-tight">{initials}</span>
      )}
    </span>
  );
}
