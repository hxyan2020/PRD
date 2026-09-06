import { publicUrl } from "./urls.js";

/** ISO / regional flag-icon codes for catalog country names. Arrays are multi-flag names. */
export const COUNTRY_FLAG_CODES = {
  albania: "al",
  algeria: "dz",
  argentina: "ar",
  armenia: "am",
  australia: "au",
  austria: "at",
  "austria-hungary": ["at", "hu"],
  azerbaijan: "az",
  barbados: "bb",
  belgium: "be",
  brazil: "br",
  bulgaria: "bg",
  canada: "ca",
  chile: "cl",
  china: "cn",
  colombia: "co",
  croatia: "hr",
  cuba: "cu",
  cyprus: "cy",
  "czech republic": "cz",
  czechia: "cz",
  "democratic republic of the congo": "cd",
  denmark: "dk",
  england: "gb-eng",
  "english people": "gb",
  finland: "fi",
  france: "fr",
  georgia: "ge",
  germany: "de",
  ghana: "gh",
  greece: "gr",
  hungary: "hu",
  india: "in",
  iran: "ir",
  ireland: "ie",
  israel: "il",
  italy: "it",
  jamaica: "jm",
  japan: "jp",
  "kingdom of denmark": "dk",
  "kingdom of the netherlands": "nl",
  korea: "kr",
  kosovo: "xk",
  mali: "ml",
  malta: "mt",
  mexico: "mx",
  moldova: "md",
  netherlands: "nl",
  holland: "nl",
  "new zealand": "nz",
  nigeria: "ng",
  norway: "no",
  panama: "pa",
  philippines: "ph",
  portugal: "pt",
  "puerto rico": "pr",
  romania: "ro",
  russia: "ru",
  "san marino": "sm",
  scotland: "gb-sct",
  serbia: "rs",
  slovenia: "si",
  "south africa": "za",
  "south korea": "kr",
  "soviet union": "su",
  spain: "es",
  sweden: "se",
  "the bahamas": "bs",
  bahamas: "bs",
  "trinidad and tobago": "tt",
  turkey: "tr",
  ukraine: "ua",
  "united kingdom": "gb",
  britain: "gb",
  uk: "gb",
  "united states": "us",
  usa: "us",
  america: "us",
  us: "us",
  vietnam: "vn",
  "west germany": "de",
  yugoslavia: "yu",
  brasil: "br",
};

const PLACEHOLDERS = new Set(["", "—", "-", "n/a", "na", "not listed", "unknown"]);

export function normalizeCountryKey(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[–—−]/g, "-")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isPlaceholderCountry(value) {
  return PLACEHOLDERS.has(normalizeCountryKey(value));
}

export function splitReleaseCountries(value) {
  return String(value || "")
    .split(/\s*·\s*|\s*;\s*|\s*,\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function codesForCountryName(name) {
  const key = normalizeCountryKey(name);
  if (!key || PLACEHOLDERS.has(key)) return [];
  const mapped = COUNTRY_FLAG_CODES[key];
  if (!mapped) return [];
  return Array.isArray(mapped) ? mapped : [mapped];
}

export function flagCodesForReleaseCountry(value) {
  if (isPlaceholderCountry(value)) return [];
  const seen = new Set();
  const codes = [];
  for (const part of splitReleaseCountries(value)) {
    for (const code of codesForCountryName(part)) {
      if (seen.has(code)) continue;
      seen.add(code);
      codes.push(code);
    }
  }
  return codes;
}

export function countryFlagUrl(code) {
  return publicUrl(`flags/${code}.svg`);
}

export function uniqueFlagCodes(codes) {
  return [...new Set((codes || []).filter(Boolean))];
}
