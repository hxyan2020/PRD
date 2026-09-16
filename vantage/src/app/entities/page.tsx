import { EntityDirectory } from "@/components/EntityDirectory";
import { loadBriefing, loadEntities } from "@/lib/loadData";

export default async function EntitiesPage() {
  const [catalog, briefing] = await Promise.all([loadEntities(), loadBriefing()]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-3xl">Monitored entities</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          The desk watches the top 50 banks by assets, a global top 50 of
          brokers and wealth platforms, and the top 50 crypto exchanges by
          CoinGecko trust score. Window hits count stories from the latest scan
          that mention the entity.
        </p>
      </div>
      <EntityDirectory
        entities={catalog.all}
        items={briefing?.items ?? []}
        rankingNote={{
          banks: catalog.meta.banks.ranking + ` (as of ${catalog.meta.banks.asOf}).`,
          brokers:
            catalog.meta.brokers.ranking + ` (as of ${catalog.meta.brokers.asOf}).`,
          crypto:
            catalog.meta.exchanges.ranking + ` (as of ${catalog.meta.exchanges.asOf}).`,
        }}
      />
    </div>
  );
}
