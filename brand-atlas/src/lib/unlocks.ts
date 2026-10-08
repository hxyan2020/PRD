const STORAGE_KEY = "seen.unlocks.v1";

export interface UnlockRecord {
  itemId: string;
  unlockedAt: string;
  method: "scan" | "manual";
}

function readAll(): Record<string, UnlockRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, UnlockRecord>;
  } catch {
    return {};
  }
}

function writeAll(map: Record<string, UnlockRecord>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function isUnlocked(itemId: string): boolean {
  return Boolean(readAll()[itemId]);
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
  method: UnlockRecord["method"] = "scan",
): UnlockRecord {
  const map = readAll();
  if (map[itemId]) return map[itemId];
  const rec: UnlockRecord = {
    itemId,
    unlockedAt: new Date().toISOString(),
    method,
  };
  map[itemId] = rec;
  writeAll(map);
  window.dispatchEvent(new CustomEvent("seen:unlocks"));
  return rec;
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
