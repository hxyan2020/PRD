"use client";

import { useI18n } from "@/lib/i18n/context";
import {
  REGION_META,
  regionLabel,
  resolveOptimalRegions,
  type OptimalRegionCode,
} from "@/lib/regions";

type Props = {
  slug: string;
  optimalRegions?: OptimalRegionCode[] | string[];
  size?: "sm" | "md";
  className?: string;
  /** Show section label above chips */
  showLabel?: boolean;
};

export function RegionFlags({
  slug,
  optimalRegions,
  size = "md",
  className = "",
  showLabel = false,
}: Props) {
  const { t, locale } = useI18n();
  const codes = resolveOptimalRegions(slug, optimalRegions);
  const pad = size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-1 text-xs";

  return (
    <div className={className}>
      {showLabel && (
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-teal">
          {t("detail.optimalRegions")}
        </p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {codes.map((code) => {
          const meta = REGION_META[code];
          return (
            <span
              key={code}
              className={`inline-flex items-center gap-1 rounded-md border border-line/80 bg-white/90 font-medium text-navy-2 ${pad}`}
              title={regionLabel(code, locale)}
            >
              <span className="leading-none" aria-hidden>
                {meta.flag}
              </span>
              <span>{regionLabel(code, locale)}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
