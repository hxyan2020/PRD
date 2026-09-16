import { ClientOnly } from "@/components/ClientOnly";
import { DeskApp } from "@/components/DeskApp";
import { loadBriefing, loadEntities, loadRiskTools } from "@/lib/loadData";

export async function DeskPage() {
  const [briefing, catalog, tools] = await Promise.all([
    loadBriefing(),
    loadEntities(),
    loadRiskTools(),
  ]);

  return (
    <ClientOnly>
      <DeskApp
        briefing={briefing}
        entities={catalog.all}
        tools={tools}
        meta={catalog.meta}
      />
    </ClientOnly>
  );
}
