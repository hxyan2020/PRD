const STORAGE_KEY = "seen.unlocks.v1";

export interface UnlockRecord {
  itemId: string;
  unlockedAt: string;
  method: "scan" | "manual" | "contribute";
  /** Data URL of the user's uploaded sighting photo */
  photoDataUrl?: string | null;
  /** Freeform field note */
  note?: string;
  /** Stable share id for permanent link */
  shareId: string;
}

function readAll(): Record<string, UnlockRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, UnlockRecord>;
    // migrate older records missing shareId
    let dirty = false;
    for (const [id, rec] of Object.entries(parsed)) {
      if (!rec.shareId) {
        rec.shareId = makeShareId(id);
        dirty = true;
      }
    }
    if (dirty) writeAll(parsed);
    return parsed;
  } catch {
    return {};
  }
}

function writeAll(map: Record<string, UnlockRecord>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

function makeShareId(itemId: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  const slug = itemId.replace(/[^a-z0-9]+/gi, "-").slice(0, 24);
  return `${slug}-${rand}`;
}

export function isUnlocked(itemId: string): boolean {
  return Boolean(readAll()[itemId]);
}

export function getUnlock(itemId: string): UnlockRecord | undefined {
  return readAll()[itemId];
}

export function getUnlockByShareId(shareId: string): UnlockRecord | undefined {
  return Object.values(readAll()).find((r) => r.shareId === shareId);
}

export function getUnlocks(): UnlockRecord[] {
  return Object.values(readAll()).sort((a, b) =>
    b.unlockedAt.localeCompare(a.unlockedAt),
  );
}

export function unlockCount(): number {
  return Object.keys(readAll()).length;
}

export function unlockItem(
  itemId: string,
  opts: {
    method?: UnlockRecord["method"];
    photoDataUrl?: string | null;
    note?: string;
  } = {},
): UnlockRecord {
  const map = readAll();
  if (map[itemId]) {
    let dirty = false;
    if (opts.photoDataUrl) {
      map[itemId].photoDataUrl = opts.photoDataUrl;
      dirty = true;
    }
    if (opts.note != null && opts.note !== "") {
      map[itemId].note = opts.note;
      dirty = true;
    }
    if (dirty) {
      writeAll(map);
      window.dispatchEvent(new CustomEvent("seen:unlocks"));
    }
    return map[itemId];
  }
  const rec: UnlockRecord = {
    itemId,
    unlockedAt: new Date().toISOString(),
    method: opts.method ?? "scan",
    photoDataUrl: opts.photoDataUrl ?? null,
    note: opts.note ?? "",
    shareId: makeShareId(itemId),
  };
  map[itemId] = rec;
  writeAll(map);
  window.dispatchEvent(new CustomEvent("seen:unlocks"));
  return rec;
}

export function updateUnlockNote(itemId: string, note: string): UnlockRecord | null {
  const map = readAll();
  if (!map[itemId]) return null;
  map[itemId].note = note;
  writeAll(map);
  window.dispatchEvent(new CustomEvent("seen:unlocks"));
  return map[itemId];
}

export function updateUnlockPhoto(
  itemId: string,
  photoDataUrl: string | null,
): UnlockRecord | null {
  const map = readAll();
  if (!map[itemId]) return null;
  map[itemId].photoDataUrl = photoDataUrl;
  writeAll(map);
  window.dispatchEvent(new CustomEvent("seen:unlocks"));
  return map[itemId];
}

/** Canonical public site on GitHub Pages */
export const PUBLIC_SITE_URL = "https://hxyan2020.github.io/PRD/brand-atlas/";

/**
 * Permanent unlock link — always points at the published GitHub Pages URL
 * so it stays shareable outside localhost.
 * Example: https://hxyan2020.github.io/PRD/brand-atlas/#/u/cars-toyota-abc123
 */
export function permanentLink(shareId: string): string {
  const base = PUBLIC_SITE_URL.replace(/\/?$/, "/");
  return `${base}#/u/${encodeURIComponent(shareId)}`;
}

export function subscribeUnlocks(cb: () => void): () => void {
  const handler = () => cb();
  window.addEventListener("seen:unlocks", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("seen:unlocks", handler);
    window.removeEventListener("storage", handler);
  };
}

export function formatPct(n: number): string {
  return `${n.toFixed(2)}%`;
}

/** Display ISO timestamp as explicit UTC, e.g. 2026-10-08 14:30:00 UTC */
export function formatUtc(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;
}
