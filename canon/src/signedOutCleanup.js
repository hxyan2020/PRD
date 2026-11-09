import { parseCollection, saveCollection } from "./collections.js";
import { parseRecommendLog, saveRecommendLog } from "./recommendLog.js";

export function emptyCollection() {
  return parseCollection(null);
}

export function emptyRecommendLog() {
  return parseRecommendLog(null);
}

/** Drop personal Collections and recommended records when the user signs out. */
export function clearSignedOutRecords(storage) {
  const collection = emptyCollection();
  const recommendLog = emptyRecommendLog();
  saveCollection(collection, storage);
  saveRecommendLog(recommendLog, storage);
  return { collection, recommendLog };
}
