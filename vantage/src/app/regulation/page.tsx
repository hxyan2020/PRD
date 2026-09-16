import { BriefingBoard } from "@/components/BriefingBoard";
import { loadBriefing, loadEntities, loadRiskTools } from "@/lib/loadData";

export default async function RegulationPage() {
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
        forceCategory="regulation"
      />
    </div>
  );
}
