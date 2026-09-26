"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { Entity, RiskTool } from "@/lib/types";
import { useDeskAccount } from "./DeskAccountProvider";
import { NewsCard } from "./NewsCard";

export function CollectionView({
  entities,
  tools,
}: {
  entities: Entity[];
  tools: RiskTool[];
}) {
  const { t } = useLocale();
  const { session, items } = useDeskAccount();

  if (!session) {
    return (
      <p className="rounded-xl border border-dashed border-line px-4 py-10 text-center text-muted">
        {t("collectionNeedLogin")}
      </p>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <section className="rounded-xl border border-line bg-panel-2 p-3 md:p-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-gold">{t("navCollection")}</p>
        <h2 className="font-serif text-lg md:text-2xl">{t("collectionTitle")}</h2>
        <p className="mt-1 hidden max-w-3xl text-sm text-muted md:block">{t("collectionLede")}</p>
      </section>
      <p className="font-mono text-xs uppercase tracking-wide text-gold">
        {t("showingSaved", { n: items.length })}
      </p>
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line px-4 py-10 text-center text-muted">
          {t("emptyCollection")}
        </p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <NewsCard key={item.id} item={item} entities={entities} tools={tools} action="remove" />
          ))}
        </div>
      )}
    </div>
  );
}
