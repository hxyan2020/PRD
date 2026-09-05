import { formatCollectedAt } from "./collections.js";
import { formatStreams, primaryArtist } from "./format.js";
import { moodChipKey } from "./i18n.js";
import { MOOD_CHIPS } from "./recommend.js";

export function creditLabel(value, translate) {
  if (!value || value === "—") return translate("na");
  if (value === "Not listed") return translate("notListed");
  return value;
}

export function yearLabel(year, translate) {
  if (!year) return translate("yearUnknown");
  return String(year);
}

export function artistLabel(track, translate) {
  const name = primaryArtist(track);
  return name === "Unknown artist" ? translate("unknownArtist") : name;
}

export function playsLabel(n, translate) {
  const compact = formatStreams(n);
  if (compact === "Not published") return translate("notPublished");
  return translate("playsCount", { n: compact });
}

export function popularityLabel(n, translate) {
  if (n == null || n === 0) return translate("noPlayCount");
  return translate("playsOnSpotify", { n: n.toLocaleString("en-US") });
}

export function collectedStamp(iso, translate, locale) {
  const formatted = formatCollectedAt(iso, locale);
  if (!iso || formatted === "Date not recorded") {
    return translate("collectedOn", { date: translate("dateNotRecorded") });
  }
  return translate("collectedOn", { date: formatted });
}

export function moodLabel(chip, translate) {
  return translate(moodChipKey(chip));
}

export function resolveMoodValue(value, translate) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  for (const chip of MOOD_CHIPS) {
    if (raw.toLowerCase() === chip.toLowerCase()) return chip;
    if (raw === moodLabel(chip, translate)) return chip;
  }
  return raw;
}
