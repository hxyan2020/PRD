import { dateTag, localeRoot } from "./i18n.js";
import { codesForCountryName, isPlaceholderCountry, splitReleaseCountries } from "./country-flags.js";
import { GENRE_PHRASES, GENRE_TERMS } from "./genre-labels.js";

const SPECIAL_REGIONS = {
  "gb-eng": {
    en: "England",
    zh: "英格兰",
    hi: "इंग्लैंड",
    es: "Inglaterra",
    fr: "Angleterre",
    ar: "إنجلترا",
    bn: "ইংল্যান্ড",
    pt: "Inglaterra",
  },
  "gb-sct": {
    en: "Scotland",
    zh: "苏格兰",
    hi: "स्कॉटलैंड",
    es: "Escocia",
    fr: "Écosse",
    ar: "اسكتلندا",
    bn: "স্কটল্যান্ড",
    pt: "Escócia",
  },
  su: {
    en: "Soviet Union",
    zh: "苏联",
    hi: "सोवियत संघ",
    es: "Unión Soviética",
    fr: "Union soviétique",
    ar: "الاتحاد السوفيتي",
    bn: "সোভিয়েত ইউনিয়ন",
    pt: "União Soviética",
  },
  yu: {
    en: "Yugoslavia",
    zh: "南斯拉夫",
    hi: "यूगोस्लाविया",
    es: "Yugoslavia",
    fr: "Yougoslavie",
    ar: "يوغوسلافيا",
    bn: "যুগোস্লাভিয়া",
    pt: "Iugoslávia",
  },
};

function displayNames(locale) {
  try {
    return new Intl.DisplayNames([dateTag(locale), locale, "en"], { type: "region" });
  } catch {
    return null;
  }
}

export function regionLabel(code, locale) {
  const root = localeRoot(locale);
  const special = SPECIAL_REGIONS[code];
  if (special) return special[root] || special.en;
  const iso = String(code || "").toUpperCase();
  if (!/^[A-Z]{2}$/.test(iso)) return "";
  try {
    return displayNames(locale)?.of(iso) || "";
  } catch {
    return "";
  }
}

export function displayCountryPart(name, locale) {
  const codes = codesForCountryName(name);
  if (!codes.length) return String(name || "").trim();
  const labels = [];
  const seen = new Set();
  for (const code of codes) {
    const label = regionLabel(code, locale) || name;
    if (seen.has(label)) continue;
    seen.add(label);
    labels.push(label);
  }
  return labels.join(" / ");
}

export function displayReleaseCountry(value, locale, translate) {
  if (isPlaceholderCountry(value)) return translate ? translate("notListed") : String(value || "");
  const parts = splitReleaseCountries(value);
  if (!parts.length) return String(value || "");
  return parts.map((part) => displayCountryPart(part, locale)).join(" · ");
}

export function displayGenre(name, locale) {
  const raw = String(name || "").trim();
  const root = localeRoot(locale);
  if (!raw || root === "en") return raw;
  const tight = root === "zh";
  let remaining = raw;
  let out = "";
  while (remaining) {
    const lower = remaining.toLowerCase();
    const sep = remaining.match(/^[\s\-/·]+/u)?.[0];
    if (sep) {
      if (sep.includes("·")) out += " · ";
      else if (!tight) out += sep.replace(/-/g, " ");
      remaining = remaining.slice(sep.length);
      continue;
    }
    let hit = null;
    for (const phrase of GENRE_PHRASES) {
      if (lower.startsWith(phrase.key) && phrase[root]) {
        hit = { len: phrase.key.length, text: phrase[root] };
        break;
      }
    }
    if (!hit) {
      const token = remaining.match(/^[\p{L}\p{N}&]+/u)?.[0] || remaining.match(/^[^\p{L}\p{N}&]+/u)?.[0] || remaining;
      const key = token.toLowerCase();
      const mapped = GENRE_TERMS[key]?.[root];
      hit = { len: token.length, text: mapped || token };
    }
    out += hit.text;
    remaining = remaining.slice(hit.len);
  }
  return out.replace(/\s{2,}/g, " ").trim() || raw;
}

const DECADE_LABEL = {
  zh: (year) => `${year}年代`,
  ja: (year) => `${year}年代`,
  hi: (year) => `${year} का दशक`,
  es: (year) => `años ${year}`,
  fr: (year) => `années ${year}`,
  ar: (year) => `عقد ${year}`,
  bn: (year) => `${year}-এর দশক`,
  pt: (year) => `década de ${year}`,
};

export function displayEraLabel(era, translate, locale) {
  if (era === "Unknown era") return translate("unknownEra");
  if (era === "Before 1600") return translate("before1600");
  const decade = String(era || "").match(/^(\d{4})s$/);
  if (!decade) return era;
  const format = DECADE_LABEL[localeRoot(locale)];
  return format ? format(decade[1]) : era;
}
