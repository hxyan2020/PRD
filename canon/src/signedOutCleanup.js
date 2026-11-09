import { parseAlbum, saveAlbum } from "./album.js";
import { saveExtraTracks } from "./beyond.js";
import { parseCollection, saveCollection } from "./collections.js";
import { parseRecommendLog, saveRecommendLog } from "./recommendLog.js";
import { saveViewedIds } from "./viewed.js";

export function emptyCollection() {
  return parseCollection(null);
}

export function emptyRecommendLog() {
  return parseRecommendLog(null);
}

export function emptyAlbum() {
  return parseAlbum(null);
}

/** Drop personal listening records when the user signs out. */
export function clearSignedOutRecords(storage) {
  const collection = emptyCollection();
  const recommendLog = emptyRecommendLog();
  const album = emptyAlbum();
  const viewedIds = [];
  const extras = {};
  saveCollection(collection, storage);
  saveRecommendLog(recommendLog, storage);
  saveAlbum(album, storage);
  saveViewedIds(viewedIds, storage);
  saveExtraTracks(extras, storage);
  return { collection, recommendLog, album, viewedIds, extras };
}
