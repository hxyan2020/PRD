"use client";

import { Globe } from "lucide-react";
import { Badge } from "@/components/ui";
import { useT } from "@/hooks/useUiLocale";
import { severityClass } from "@/lib/utils";

const REGION_ISO: Record<string, string[]> = {
  "united states": ["us"],
  usa: ["us"],
  us: ["us"],
  america: ["us"],
  eurozone: ["eu"],
  "euro zone": ["eu"],
  "euro area": ["eu"],
  europe: ["eu"],
  eu: ["eu"],
  "united kingdom": ["gb"],
  uk: ["gb"],
  britain: ["gb"],
  china: ["cn"],
  japan: ["jp"],
  australia: ["au"],
  canada: ["ca"],
  switzerland: ["ch"],
  "hong kong": ["hk"],
  "middle east": ["sa", "ye"],
  "saudi arabia": ["sa"],
  yemen: ["ye"],
  opec: ["sa"],
  global: [],
  worldwide: [],
};

function partsOf(geography: string): string[] {
  return geography
    .split(/\s*(?:\/|,|&|;|\+)\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function codesFor(part: string): string[] | "globe" {
  const key = part.toLowerCase();
  if (key === "global" || key === "worldwide" || key === "world") return "globe";
  if (REGION_ISO[key]) return REGION_ISO[key].length ? REGION_ISO[key] : "globe";
  return [];
}

export function RegionFlag({ geography }: { geography: string }) {
  const { t } = useT();
  const labelKey = `mi.geo.${geography}`;
  const label = t(labelKey);
  const shown = label === labelKey ? geography : label;
  const flags = partsOf(geography).flatMap((part) => {
    const codes = codesFor(part);
    if (codes === "globe") return [{ kind: "globe" as const, key: part }];
    return codes.map((code) => ({ kind: "flag" as const, key: `${part}-${code}`, code }));
  });
  const unique = flags.filter((f, i, arr) => arr.findIndex((x) => x.key === f.key) === i);

  return (
    <span className="inline-flex items-center gap-1.5" data-testid="mi-region">
      {unique.map((f) =>
        f.kind === "globe" ? (
          <Globe key={f.key} className="h-3.5 w-3.5 text-slate-500 shrink-0" aria-hidden />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={f.key}
            src={`https://flagcdn.com/h20/${f.code}.png`}
            srcSet={`https://flagcdn.com/h40/${f.code}.png 2x`}
            alt=""
            width={18}
            height={13}
            className="rounded-[2px] border border-black/10 object-cover shrink-0"
          />
        )
      )}
      <span>{shown}</span>
    </span>
  );
}

export function IntelImpactBadge({ severity }: { severity: string }) {
  const { t } = useT();
  const key = `mi.impact.${severity}`;
  const label = t(key);
  return <Badge className={severityClass(severity)}>{label === key ? severity : label}</Badge>;
}
