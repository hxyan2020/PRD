"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";
import { parseView, queryHref, useQueryParams } from "@/lib/queryNav";
import type { MessageKey } from "@/lib/i18n/messages";
import { QueryLink } from "./QueryLink";

const NAV: Array<{ view: "briefing" | "entities" | "regulation" | "risk-tools" | "sources"; label: MessageKey }> = [
  { view: "briefing", label: "navBriefing" },
  { view: "entities", label: "navEntities" },
  { view: "regulation", label: "navRegulation" },
  { view: "risk-tools", label: "navRisk" },
  { view: "sources", label: "navSources" },
];

export function NavLinks() {
  const params = useQueryParams();
  const active = parseView(params.get("view"));
  const { t } = useLocale();

  return (
    <nav className="flex flex-wrap gap-2">
      {NAV.map((item) => {
        const href = queryHref({ view: item.view });
        return (
          <QueryLink
            key={item.view}
            href={href}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${
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
