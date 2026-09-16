import { FLAG_SRC } from "./flagSrc";

const COUNTRY_CODES: Record<string, string> = {
  "united states": "us",
  usa: "us",
  us: "us",
  "u.s.": "us",
  "u.s.a.": "us",
  "united kingdom": "gb",
  uk: "gb",
  britain: "gb",
  "great britain": "gb",
  "european union": "eu",
  eu: "eu",
  europe: "eu",
  china: "cn",
  japan: "jp",
  "hong kong": "hk",
  singapore: "sg",
  france: "fr",
  germany: "de",
  spain: "es",
  canada: "ca",
  switzerland: "ch",
  italy: "it",
  netherlands: "nl",
  australia: "au",
  india: "in",
  russia: "ru",
  "south korea": "kr",
  korea: "kr",
  "south africa": "za",
  israel: "il",
  cyprus: "cy",
  denmark: "dk",
  sweden: "se",
  poland: "pl",
  austria: "at",
  thailand: "th",
  mexico: "mx",
  philippines: "ph",
  lithuania: "lt",
  estonia: "ee",
  luxembourg: "lu",
  malta: "mt",
  bermuda: "bm",
  "cayman islands": "ky",
  seychelles: "sc",
  panama: "pa",
  "british virgin islands": "vg",
  gibraltar: "gi",
  "saint vincent and the grenadines": "vc",
  "united arab emirates": "ae",
  uae: "ae",
  global: "global",
  worldwide: "global",
};

export function flagCode(place: string): string | null {
  const key = place.trim().toLowerCase();
  if (!key || key === "n/a" || key === "na" || key === "不适用") return null;
  return COUNTRY_CODES[key] ?? null;
}

export function flagSrc(place: string): string | null {
  const code = flagCode(place);
  if (!code) return null;
  return FLAG_SRC[code] ?? null;
}

export function isCountryLabel(place: string): boolean {
  return flagCode(place) !== null || Boolean(place.trim());
}
