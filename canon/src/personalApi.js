import { normalizeEmail as normalizeAuthEmail } from "./auth.js";
import { parseAlbum } from "./album.js";
import { parseCollection } from "./collections.js";
import { parseRecommendLog } from "./recommendLog.js";

export function normalizeEmail(email) {
  return normalizeAuthEmail(email);
}

export function timingSafeEqualText(left, right) {
  const a = String(left || "");
  const b = String(right || "");
  const max = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < max; i += 1) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

export function normalizePersonalPayload(raw) {
  if (!raw || typeof raw !== "object") {
    return {
      collection: parseCollection(null),
      recommendLog: parseRecommendLog(null),
      album: parseAlbum(null),
      viewedIds: [],
      extras: {},
    };
  }
  const viewedSource = raw.viewedIds;
  let viewedIds = [];
  if (Array.isArray(viewedSource)) {
    viewedIds = [...new Set(viewedSource.map((id) => String(id || "")).filter(Boolean))];
  } else if (viewedSource && typeof viewedSource === "object" && Array.isArray(viewedSource.ids)) {
    viewedIds = [...new Set(viewedSource.ids.map((id) => String(id || "")).filter(Boolean))];
  }
  return {
    collection: parseCollection(raw.collection),
    recommendLog: parseRecommendLog(raw.recommendLog),
    album: parseAlbum(raw.album),
    viewedIds,
    extras:
      raw.extras && typeof raw.extras === "object" && !Array.isArray(raw.extras) ? { ...raw.extras } : {},
  };
}
