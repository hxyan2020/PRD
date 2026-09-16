"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

export type DeskView =
  | "briefing"
  | "entities"
  | "regulation"
  | "risk-tools"
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
    value === "sources"
  ) {
    return value;
  }
  return "briefing";
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
