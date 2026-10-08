const STORAGE_KEY = "seen.unlocks.v1";

export interface UnlockRecord {
  itemId: string;
  unlockedAt: string;
  method: "scan" | "manual";
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
    if (opts.photoDataUrl && !map[itemId].photoDataUrl) {
      map[itemId].photoDataUrl = opts.photoDataUrl;
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

export function permanentLink(shareId: string): string {
  const base = `${window.location.origin}${import.meta.env.BASE_URL}`;
  const useHash = import.meta.env.BASE_URL !== "/";
  return useHash ? `${base}#/u/${shareId}` : `${base}u/${shareId}`;
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
