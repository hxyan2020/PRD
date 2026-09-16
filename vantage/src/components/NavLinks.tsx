"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";
import { parseView, queryHref, useQueryParams } from "@/lib/queryNav";
import type { MessageKey } from "@/lib/i18n/messages";
import { QueryLink } from "./QueryLink";

const NAV: Array<{ view: "briefing" | "entities" | "regulation" | "risk-tools" | "sources"; label: MessageKey }> = [
  { view: "briefing", label: "navBriefing" },
  { view: "regulation", label: "navRegulation" },
  { view: "risk-tools", label: "navRisk" },
  { view: "entities", label: "navEntities" },
  { view: "sources", label: "navSources" },
];

export function NavLinks() {
  const params = useQueryParams();
  const active = parseView(params.get("view"));
  const { t } = useLocale();

  return (
    <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
      {NAV.map((item) => {
        const href = queryHref({ view: item.view });
        return (
          <QueryLink
            key={item.view}
            href={href}
            className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-2 text-sm transition ${
              active === item.view
                ? "border-gold bg-gold/10 text-gold"
                : "border-line text-muted hover:border-gold/40 hover:text-paper"
            }`}
          >
            {t(item.label)}
          </QueryLink>
        );
      })}
    </nav>
  );
}
