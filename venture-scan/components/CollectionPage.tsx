"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listUserCollection, removeFromCollection } from "@/lib/client-api";
import { useI18n } from "@/lib/i18n/context";
import { localizeIdea } from "@/lib/i18n/localize-idea";
import type { CollectionItem } from "@/lib/types";

export function CollectionPage() {
  const { t, locale } = useI18n();
  const [items, setItems] = useState<CollectionItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needLogin, setNeedLogin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await listUserCollection();
        if (data.status === 401) {
          if (!cancelled) setNeedLogin(true);
          return;
        }
        if (data.error) throw new Error(data.error);
        if (!cancelled) setItems(data.items ?? []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function remove(slug: string) {
    const result = await removeFromCollection(slug);
    if (result.error) return;
    setItems((prev) => (prev ? prev.filter((i) => i.ideaSlug !== slug) : prev));
  }

  if (needLogin) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-4xl text-foam">{t("collection.title")}</h1>
        <p className="mt-4 text-sm text-mist">{t("collection.needLogin")}</p>
        <div className="mt-6 flex gap-3">
          <Link href="/account" className="btn-primary">
            {t("nav.register")}
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-copper sm:px-6">{error}</div>;
  }

  if (!items) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-mist sm:px-6">
        {t("collection.loading")}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-celadon">
        {t("collection.kicker")}
      </p>
      <h1 className="mt-3 font-display text-4xl text-foam">{t("collection.title")}</h1>
      <p className="mt-3 text-sm text-mist">{t("collection.body")}</p>

      {items.length === 0 ? (
        <p className="mt-10 text-sm text-mist">{t("collection.empty")}</p>
      ) : (
        <ul className="mt-10 divide-y divide-black/10 border-t border-black/10">
          {items.map((item) => {
            const view = localizeIdea(item.idea, locale);
            return (
            <li key={item.id} className="py-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <Link
                    href={`/ideas/${item.ideaSlug}`}
                    className="font-display text-2xl text-foam hover:text-black"
                  >
                    {view.name}
                  </Link>
                  <p className="mt-1 text-xs text-mist">
                    {view.industry} · {view.sector}
                    {item.match ? ` · ${t("ledger.match", { score: item.match.score })}` : ""}
                  </p>
                  {item.match?.matched[0] ? (
                    <p className="mt-2 text-xs text-celadon">
                      {t("today.matched")} · {item.match.matched[0].dimension}:{" "}
                      {item.match.matched[0].detail}
                    </p>
                  ) : null}
                  {item.match?.gaps[0] ? (
                    <p className="mt-1 text-xs text-mist">
                      {t("today.gaps")} · {item.match.gaps[0].dimension}:{" "}
                      {item.match.gaps[0].closeGap}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="btn-ghost shrink-0 self-start"
                  onClick={() => void remove(item.ideaSlug)}
                >
                  {t("collection.remove")}
                </button>
              </div>
            </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
