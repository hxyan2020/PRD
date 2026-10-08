import { useEffect, useState } from "react";
import { loadCatalog } from "../lib/catalog";
import type { Catalog } from "../types/catalog";

export function useCatalog() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadCatalog()
      .then((c) => {
        if (!cancelled) {
          setCatalog(c);
          setLoading(false);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load catalogue");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { catalog, error, loading };
}
