"use client";

import { parseSector } from "@/lib/filters";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/messages";
import { navHref, parseDeskNav, useQueryParams, type DeskNavId } from "@/lib/queryNav";
import { QueryLink } from "./QueryLink";

export type NavCounts = {
  all: number;
  listing: number;
  product: number;
  regulation: number;
  risk_tools: number;
};

const NAV: Array<{
  id: DeskNavId;
  label: MessageKey;
  short: MessageKey;
  countKey?: keyof NavCounts;
}> = [
  { id: "briefing", label: "navBriefing", short: "navBriefingShort", countKey: "all" },
  { id: "listing", label: "listings", short: "navListingsShort", countKey: "listing" },
  { id: "product", label: "features", short: "navFeaturesShort", countKey: "product" },
  { id: "regulation", label: "navRegulation", short: "navRegulationShort", countKey: "regulation" },
  { id: "risk-tools", label: "navRisk", short: "navRiskShort", countKey: "risk_tools" },
  { id: "entities", label: "navEntities", short: "navEntitiesShort" },
  { id: "sources", label: "navSources", short: "navSourcesShort" },
];

export function NavLinks({ counts }: { counts?: NavCounts }) {
  const params = useQueryParams();
  const active = parseDeskNav(params.get("view"), params.get("category"));
  const sector = parseSector(params.get("sector") ?? undefined);
  const { t } = useLocale();

  return (
    <nav className="flex w-full flex-wrap gap-1.5 md:gap-2">
      {NAV.map((item) => {
        const href = navHref(item.id, item.id === "entities" || item.id === "sources" ? undefined : sector);
        const count = item.countKey ? counts?.[item.countKey] : undefined;
        return (
          <QueryLink
            key={item.id}
            href={href}
            className={`inline-flex min-h-10 items-center justify-center rounded-full border px-2 text-[13px] transition md:min-h-0 md:px-3 md:py-2 md:text-sm ${
              active === item.id
                ? "border-gold bg-gold/10 text-gold"
                : "border-line text-muted hover:border-gold/40 hover:text-paper"
            }`}
          >
            <span className="md:hidden">{t(item.short)}</span>
            <span className="hidden md:inline">{t(item.label)}</span>
            {count != null ? (
              <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-gold/15 px-1.5 font-mono text-[11px] tabular-nums text-gold md:text-xs">
                {count}
              </span>
            ) : null}
          </QueryLink>
        );
      })}
    </nav>
  );
}
