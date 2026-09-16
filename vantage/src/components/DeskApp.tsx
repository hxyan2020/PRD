"use client";

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
      return <p className="text-muted">No source health yet. Run `npm run scan`.</p>;
    }
    return <SourcesView sources={briefing.sources} />;
  }

  if (view === "risk-tools") {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="font-serif text-3xl">Risk detection, monitoring, management</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted">
            Catalog of major internal and external risk, surveillance, and
            compliance tools used by banks, brokers, and crypto venues. The
            briefing below is the latest-scan slice tagged as risk-tool news.
          </p>
        </div>
        <RiskCatalog tools={tools} items={briefing?.items ?? []} />
        {briefing && (
          <BriefingBoard
            briefing={briefing}
            entities={entities}
            tools={tools}
            title="Risk-tool developments"
            hideCategoryFilters
            forceCategory="risk_tools"
          />
        )}
      </div>
    );
  }

  if (view === "regulation") {
    if (!briefing) {
      return <p className="text-muted">Run a scan to populate the regulation desk.</p>;
    }
    return (
      <div className="space-y-5">
        <p className="max-w-3xl text-sm text-muted">
          Regulatory discussion and rule changes across the United States,
          Europe, the United Kingdom, Singapore, Japan, Hong Kong, China, and
          other major jurisdictions. Each item includes a potential-impact note
          for sector and assets.
        </p>
        <BriefingBoard
          briefing={briefing}
          entities={entities}
          tools={tools}
          title="Regulatory watch"
          hideCategoryFilters
          forceCategory="regulation"
        />
      </div>
    );
  }

  if (!briefing) {
    return (
      <div className="rounded-xl border border-dashed border-line p-8 text-muted">
        No scan has been written yet. From `vantage/`, run `npm run scan` and
        refresh this page.
      </div>
    );
  }

  return (
    <BriefingBoard briefing={briefing} entities={entities} tools={tools} />
  );
}
