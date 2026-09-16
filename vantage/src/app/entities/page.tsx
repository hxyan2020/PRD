import { ClientOnly } from "@/components/ClientOnly";
import { EntitiesView } from "@/components/EntitiesView";
import { loadBriefing, loadEntities } from "@/lib/loadData";

export default async function EntitiesPage() {
  const [catalog, briefing] = await Promise.all([loadEntities(), loadBriefing()]);

  return (
    <ClientOnly>
      <EntitiesView
        entities={catalog.all}
        items={briefing?.items ?? []}
        meta={catalog.meta}
      />
    </ClientOnly>
  );
}
