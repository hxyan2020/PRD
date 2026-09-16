import { ClientOnly } from "@/components/ClientOnly";
import { SourcesView } from "@/components/SourcesView";
import { loadBriefing } from "@/lib/loadData";

export default async function SourcesPage() {
  const briefing = await loadBriefing();

  if (!briefing) {
    return <p className="text-muted">No source health yet. Run `npm run scan`.</p>;
  }

  return (
    <ClientOnly>
      <SourcesView sources={briefing.sources} />
    </ClientOnly>
  );
}
