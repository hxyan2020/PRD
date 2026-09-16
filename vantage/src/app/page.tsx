import { BriefingBoard } from "@/components/BriefingBoard";
import { loadBriefing, loadEntities, loadRiskTools } from "@/lib/loadData";

export default async function HomePage() {
  const [briefing, catalog, tools] = await Promise.all([
    loadBriefing(),
    loadEntities(),
    loadRiskTools(),
  ]);

  if (!briefing) {
    return (
      <div className="rounded-xl border border-dashed border-line p-8 text-muted">
        No scan has been written yet. From `vantage/`, run `npm run scan` and
        refresh this page.
      </div>
    );
  }

  return (
    <BriefingBoard
      briefing={briefing}
      entities={catalog.all}
      tools={tools}
    />
  );
}
