import { useEffect, useState } from "react";
import { loadCatalog, clearCatalogCache } from "../lib/catalog";
import {
  mergeCatalogWithPacks,
  subscribeResourcePacks,
} from "../lib/resourcePacks";
import type { Catalog } from "../types/catalog";

export function useCatalog() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [packVersion, setPackVersion] = useState(0);

  useEffect(() => subscribeResourcePacks(() => setPackVersion((v) => v + 1)), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadCatalog()
      .then((base) => {
        if (cancelled) return;
        setCatalog(mergeCatalogWithPacks(base));
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
  }, [packVersion]);

  const refresh = () => {
    clearCatalogCache();
    setPackVersion((v) => v + 1);
  };

  return { catalog, error, loading, refresh, packVersion };
}
