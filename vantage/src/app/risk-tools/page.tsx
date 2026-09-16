import { BriefingBoard } from "@/components/BriefingBoard";
import { ClientOnly } from "@/components/ClientOnly";
import { RiskCatalog } from "@/components/RiskCatalog";
import { loadBriefing, loadEntities, loadRiskTools } from "@/lib/loadData";

export default async function RiskToolsPage() {
  const [briefing, catalog, tools] = await Promise.all([
    loadBriefing(),
    loadEntities(),
    loadRiskTools(),
  ]);

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
        <ClientOnly>
          <BriefingBoard
            briefing={briefing}
            entities={catalog.all}
            tools={tools}
            title="Risk-tool developments"
            hideCategoryFilters
            forceCategory="risk_tools"
          />
        </ClientOnly>
      )}
    </div>
  );
}
