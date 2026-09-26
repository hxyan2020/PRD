"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

export type DeskView =
  | "briefing"
  | "entities"
  | "regulation"
  | "risk-tools"
  | "sources"
  | "collection";

export type DeskNavId =
  | "briefing"
  | "listing"
  | "product"
  | "regulation"
  | "risk-tools"
  | "collection"
  | "entities"
  | "sources";

const LISTENERS = new Set<() => void>();

function currentSearch(): string {
  return typeof window === "undefined" ? "" : window.location.search;
}

function emit(): void {
  for (const listener of LISTENERS) listener();
}

export function parseView(value: string | null | undefined): DeskView {
  if (
    value === "entities" ||
    value === "regulation" ||
    value === "risk-tools" ||
    value === "sources" ||
    value === "collection"
  ) {
    return value;
  }
  return "briefing";
}

export function parseDeskNav(
  view: string | null | undefined,
  category: string | null | undefined,
): DeskNavId {
  const parsed = parseView(view);
  if (parsed !== "briefing") return parsed;
  if (category === "listing" || category === "product") return category;
  if (category === "regulation") return "regulation";
  if (category === "risk_tools") return "risk-tools";
  return "briefing";
}

export function navHref(id: DeskNavId, sector?: string | null): string {
  if (id === "briefing") return queryHref({ sector });
  if (id === "listing") return queryHref({ category: "listing", sector });
  if (id === "product") return queryHref({ category: "product", sector });
  if (id === "regulation") return queryHref({ view: "regulation", sector });
  if (id === "risk-tools") return queryHref({ view: "risk-tools", sector });
  if (id === "collection") return queryHref({ view: "collection" });
  if (id === "entities") return queryHref({ view: "entities" });
  return queryHref({ view: "sources" });
}

export function queryHref(next: Record<string, string | undefined | null>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(next)) {
    if (value && value !== "all" && value !== "briefing") {
      params.set(key, value);
    }
  }
  const query = params.toString();
  return query ? `?${query}` : "?";
}

export function navigateQuery(href: string): void {
  if (typeof window === "undefined") return;
  window.history.pushState({}, "", href);
  emit();
}

function subscribe(listener: () => void): () => void {
  LISTENERS.add(listener);
  window.addEventListener("popstate", listener);
  return () => {
    LISTENERS.delete(listener);
    window.removeEventListener("popstate", listener);
  };
}

export function useQueryParams(): URLSearchParams {
  const search = useSyncExternalStore(subscribe, currentSearch, () => "");
  return new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
}

export function useHasMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
