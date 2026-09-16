"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";
import { parseView, queryHref, useQueryParams } from "@/lib/queryNav";
import type { MessageKey } from "@/lib/i18n/messages";
import { QueryLink } from "./QueryLink";

const NAV: Array<{
  view: "briefing" | "entities" | "regulation" | "risk-tools" | "sources";
  label: MessageKey;
  short: MessageKey;
}> = [
  { view: "briefing", label: "navBriefing", short: "navBriefingShort" },
  { view: "regulation", label: "navRegulation", short: "navRegulationShort" },
  { view: "risk-tools", label: "navRisk", short: "navRiskShort" },
  { view: "entities", label: "navEntities", short: "navEntitiesShort" },
  { view: "sources", label: "navSources", short: "navSourcesShort" },
];

export function NavLinks() {
  const params = useQueryParams();
  const active = parseView(params.get("view"));
  const { t } = useLocale();

  return (
    <nav className="flex w-full gap-1.5 md:w-auto md:flex-wrap md:gap-2">
      {NAV.map((item) => {
        const href = queryHref({ view: item.view });
        return (
          <QueryLink
            key={item.view}
            href={href}
            className={`inline-flex min-h-10 flex-1 items-center justify-center rounded-full border px-1.5 text-[13px] transition md:min-h-0 md:flex-none md:px-3 md:py-2 md:text-sm ${
              active === item.view
                ? "border-gold bg-gold/10 text-gold"
                : "border-line text-muted hover:border-gold/40 hover:text-paper"
            }`}
          >
            <span className="md:hidden">{t(item.short)}</span>
            <span className="hidden md:inline">{t(item.label)}</span>
          </QueryLink>
        );
      })}
    </nav>
  );
}
