import { BriefingBoard } from "@/components/BriefingBoard";
import { parseSector } from "@/lib/filters";
import { loadBriefing, loadEntities, loadRiskTools } from "@/lib/loadData";

export default async function RegulationPage({
  searchParams,
}: {
  searchParams: Promise<{ sector?: string; q?: string }>;
}) {
  const params = await searchParams;
  const [briefing, catalog, tools] = await Promise.all([
    loadBriefing(),
    loadEntities(),
    loadRiskTools(),
  ]);

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
        entities={catalog.all}
        tools={tools}
        title="Regulatory watch"
        basePath="/regulation"
        hideCategoryFilters
        activeCategory="regulation"
        activeSector={parseSector(params.sector)}
        query={params.q ?? ""}
      />
    </div>
  );
}
