/**
 * Verifies unlock persistence survives localStorage quota pressure
 * (the failure mode behind Confirm selection doing nothing).
 */
import assert from "node:assert/strict";

const store = new Map();
const QUOTA = 2_000_000;

function measure() {
  let n = 0;
  for (const [k, v] of store) n += k.length + String(v).length;
  return n;
}

const localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => {
    const prev = store.has(k) ? store.get(k) : undefined;
    store.set(k, String(v));
    if (measure() > QUOTA) {
      if (prev === undefined) store.delete(k);
      else store.set(k, prev);
      const err = new Error("QuotaExceededError");
      err.name = "QuotaExceededError";
      throw err;
    }
  },
};

const KEY = "seen.unlocks.v1";

function isQuotaError(err) {
  return err && typeof err === "object" && err.name === "QuotaExceededError";
}

function writeAll(map) {
  localStorage.setItem(KEY, JSON.stringify(map));
}

function writeAllResilient(map) {
  try {
    writeAll(map);
    return;
  } catch (err) {
    if (!isQuotaError(err)) throw err;
  }
  const withPhotos = Object.values(map)
    .filter((r) => r.photoDataUrl)
    .sort((a, b) => a.unlockedAt.localeCompare(b.unlockedAt));
  for (const rec of withPhotos) {
    rec.photoDataUrl = null;
    try {
      writeAll(map);
      return;
    } catch (err) {
      if (!isQuotaError(err)) throw err;
    }
  }
  writeAll(map);
}

function unlockItem(itemId, opts = {}) {
  const raw = localStorage.getItem(KEY);
  const map = raw ? JSON.parse(raw) : {};
  const rec = {
    itemId,
    unlockedAt: new Date().toISOString(),
    method: opts.method ?? "scan",
    photoDataUrl: opts.photoDataUrl ?? null,
    note: "",
    shareId: `${itemId}-x`,
  };
  map[itemId] = rec;
  try {
    writeAllResilient(map);
  } catch {
    rec.photoDataUrl = null;
    writeAllResilient(map);
  }
  return rec;
}

// Fill with bulky prior unlocks (would blow quota on naive write)
for (let i = 0; i < 8; i++) {
  unlockItem(`fill__${i}`, {
    method: "scan",
    photoDataUrl: "data:image/jpeg;base64," + "A".repeat(180_000),
  });
}

assert.ok(JSON.parse(localStorage.getItem(KEY)).fill__0);

// Naive write of a huge Tanqueray photo would throw → Confirm appeared dead
const huge = "data:image/jpeg;base64," + "B".repeat(900_000);
assert.throws(() => {
  const raw = localStorage.getItem(KEY);
  const map = raw ? JSON.parse(raw) : {};
  map.liquor__tanqueray = {
    itemId: "liquor__tanqueray",
    unlockedAt: new Date().toISOString(),
    method: "scan",
    photoDataUrl: huge,
    note: "",
    shareId: "x",
  };
  writeAll(map);
}, /QuotaExceededError/);

const rec = unlockItem("liquor__tanqueray", {
  method: "scan",
  photoDataUrl: huge,
});

const saved = JSON.parse(localStorage.getItem(KEY));
assert.equal(Boolean(saved.liquor__tanqueray), true);
assert.equal(rec.itemId, "liquor__tanqueray");

console.log("ok: confirm unlock survives quota pressure");
console.log("  store bytes", measure());
console.log(
  "  tanqueray has photo?",
  Boolean(saved.liquor__tanqueray.photoDataUrl),
);
