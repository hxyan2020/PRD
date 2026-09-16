"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";
import { parseView, useQueryParams } from "@/lib/queryNav";
import type { Briefing, CatalogMeta, Entity, RiskTool } from "@/lib/types";
import { BriefingBoard } from "./BriefingBoard";
import { EntitiesView } from "./EntitiesView";
import { RiskCatalog } from "./RiskCatalog";
import { SourcesView } from "./SourcesView";

export function DeskApp({
  briefing,
  entities,
  tools,
  meta,
}: {
  briefing: Briefing | null;
  entities: Entity[];
  tools: RiskTool[];
  meta: CatalogMeta;
}) {
  const params = useQueryParams();
  const view = parseView(params.get("view"));
  const { t } = useLocale();

  if (view === "entities") {
    return (
      <EntitiesView
        entities={entities}
        items={briefing?.items ?? []}
        meta={meta}
      />
    );
  }

  if (view === "sources") {
    if (!briefing) {
      return <p className="text-muted">{t("noSources")}</p>;
    }
    return <SourcesView sources={briefing.sources} />;
  }

  if (view === "risk-tools") {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="font-serif text-xl md:text-3xl">{t("riskTitle")}</h2>
          <p className="mt-2 hidden max-w-3xl text-sm text-muted md:block">{t("riskLede")}</p>
        </div>
        <RiskCatalog tools={tools} items={briefing?.items ?? []} />
        {briefing && (
          <BriefingBoard
            briefing={briefing}
            entities={entities}
            tools={tools}
            titleKey="riskDevelopments"
            hideCategoryFilters
            forceCategory="risk_tools"
          />
        )}
      </div>
    );
  }

  if (view === "regulation") {
    if (!briefing) {
      return <p className="text-muted">{t("noRegulation")}</p>;
    }
    return (
      <div className="space-y-5">
        <p className="hidden max-w-3xl text-sm text-muted md:block">{t("regulationLede")}</p>
        <BriefingBoard
          briefing={briefing}
          entities={entities}
          tools={tools}
          titleKey="regulatoryWatch"
          hideCategoryFilters
          forceCategory="regulation"
        />
      </div>
    );
  }

  if (!briefing) {
    return (
      <div className="rounded-xl border border-dashed border-line p-8 text-muted">
        {t("noScan")}
      </div>
    );
  }

  return (
    <BriefingBoard briefing={briefing} entities={entities} tools={tools} />
  );
}
