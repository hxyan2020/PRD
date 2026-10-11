import { useCallback, useEffect, useMemo, useState } from "react";
import { loadCatalog, clearCatalogCache } from "../lib/catalog";
import {
  contributionItems,
  subscribeContributions,
} from "../lib/contributions";
import {
  mergeCatalogWithPacks,
  subscribeResourcePacks,
} from "../lib/resourcePacks";
import type { Catalog } from "../types/catalog";

/**
 * Live catalogue = base JSON + resource packs + user contributions.
 * Pack/contribution events remesh synchronously so shelf stats update immediately.
 */
export function useCatalog() {
  const [base, setBase] = useState<Catalog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadTick, setReloadTick] = useState(0);
  const [layerTick, setLayerTick] = useState(0);

  useEffect(() => {
    const bumpLayers = () => setLayerTick((v) => v + 1);
    const unsubPacks = subscribeResourcePacks(bumpLayers);
    const unsubContrib = subscribeContributions(bumpLayers);
    return () => {
      unsubPacks();
      unsubContrib();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadCatalog()
      .then((data) => {
        if (cancelled) return;
        setBase(data);
        setError(null);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load catalogue");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadTick]);

  const catalog = useMemo(() => {
    if (!base) return null;
    // layerTick forces recomputation after localStorage pack/contribution writes
    void layerTick;
    return mergeCatalogWithPacks(base, contributionItems());
  }, [base, layerTick]);

  const refresh = useCallback(() => {
    clearCatalogCache();
    setLayerTick((v) => v + 1);
    setReloadTick((v) => v + 1);
  }, []);

  return {
    catalog,
    error,
    loading,
    refresh,
    packVersion: layerTick,
  };
}
