"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getProduct, getProducts } from "@/lib/catalog";
import { listingSlugMap, readDesk, subscribeStore } from "@/lib/client-store";
import { dailyQueue, todayKey } from "@/lib/desk";
import { tryApiJson } from "@/lib/try-api";
import { QueueDesk } from "./QueueDesk";

export function QueuePageClient() {
  const day = todayKey();
  const all = useMemo(() => getProducts(), []);
  const [collectedSlugs, setCollectedSlugs] = useState<string[]>([]);
  const [discardedSlugs, setDiscardedSlugs] = useState<string[]>([]);
  const [sourced, setSourced] = useState<Record<string, string>>({});

  const hydrate = useCallback(async () => {
    const desk = await tryApiJson<{ collected: string[]; discarded: string[] }>("/api/desk");
    if (desk.ok) {
      setCollectedSlugs(desk.data.collected);
      setDiscardedSlugs(desk.data.discarded);
    } else {
      const snap = readDesk(day);
      setCollectedSlugs(snap.collected);
      setDiscardedSlugs(snap.discarded);
    }
    const sf = await tryApiJson<{ slugs?: Record<string, string> }>("/api/storefront");
    setSourced({ ...listingSlugMap(), ...(sf.ok ? sf.data.slugs ?? {} : {}) });
  }, [day]);

  useEffect(() => {
    void hydrate();
    return subscribeStore(() => {
      void hydrate();
    });
  }, [hydrate]);

  const discardedSet = new Set(discardedSlugs);
  const review = dailyQueue(all, discardedSet);
  const collected = collectedSlugs.map((slug) => getProduct(slug)).filter((p): p is NonNullable<typeof p> => Boolean(p));
  const discarded = discardedSlugs.map((slug) => getProduct(slug)).filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <QueueDesk day={day} review={review} collected={collected} discarded={discarded} sourced={sourced} />
  );
}
