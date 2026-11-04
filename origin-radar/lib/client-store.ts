import { todayKey, type DeskActionKind } from "./desk";
import type { SourcedProduct } from "./storefront-types";

const LISTINGS_KEY = "origin-radar.listings.v1";
const DESK_KEY = "origin-radar.desk.v1";
const EVENT = "origin-radar-store";

export type DeskSnapshot = { collected: string[]; discarded: string[] };

type DeskPersist = {
  collected: string[];
  discarded: { slug: string; day: string }[];
};

function canUseStore(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function emitStore(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeStore(fn: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => fn();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function readListings(): SourcedProduct[] {
  if (!canUseStore()) return [];
  try {
    const raw = window.localStorage.getItem(LISTINGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SourcedProduct[] | Record<string, SourcedProduct>;
    return Array.isArray(parsed) ? parsed : Object.values(parsed);
  } catch {
    return [];
  }
}

export function listingSlugMap(): Record<string, string> {
  return Object.fromEntries(readListings().map((p) => [p.signalSlug, p.id]));
}

export function getLocalListing(id: string): SourcedProduct | undefined {
  return readListings().find((p) => p.id === id || p.signalSlug === id);
}

export function saveListing(product: SourcedProduct): SourcedProduct {
  const rest = readListings().filter((p) => p.signalSlug !== product.signalSlug && p.id !== product.id);
  const saved = { ...product, updatedAt: new Date().toISOString() };
  window.localStorage.setItem(LISTINGS_KEY, JSON.stringify([saved, ...rest]));
  emitStore();
  return saved;
}

function readDeskPersist(): DeskPersist {
  if (!canUseStore()) return { collected: [], discarded: [] };
  try {
    const raw = window.localStorage.getItem(DESK_KEY);
    if (!raw) return { collected: [], discarded: [] };
    return JSON.parse(raw) as DeskPersist;
  } catch {
    return { collected: [], discarded: [] };
  }
}

export function readDesk(day = todayKey()): DeskSnapshot {
  const persist = readDeskPersist();
  return {
    collected: persist.collected,
    discarded: persist.discarded.filter((d) => d.day === day).map((d) => d.slug),
  };
}

export function applyDeskAction(slug: string, action: DeskActionKind, day = todayKey()): DeskSnapshot {
  const persist = readDeskPersist();
  let collected = persist.collected.filter((s) => s !== slug);
  let discarded = persist.discarded.filter((d) => d.slug !== slug);
  if (action === "collect") collected = [...collected, slug];
  if (action === "discard") discarded = [...discarded, { slug, day }];
  const next: DeskPersist = { collected, discarded };
  window.localStorage.setItem(DESK_KEY, JSON.stringify(next));
  emitStore();
  return readDesk(day);
}

export { EVENT as STORE_EVENT };
