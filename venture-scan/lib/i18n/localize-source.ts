import { countryToFlagCode } from "../flag-codes";
import type { DataSource } from "../data-sources";
import type { LocaleCode } from "./locales";
import packEn from "./source-packs/en.json";
import packZhCN from "./source-packs/zh-CN.json";
import packZhTW from "./source-packs/zh-TW.json";
import packJa from "./source-packs/ja.json";
import packKo from "./source-packs/ko.json";
import packEs from "./source-packs/es.json";
import packFr from "./source-packs/fr.json";
import packDe from "./source-packs/de.json";
import packPtBR from "./source-packs/pt-BR.json";
import packAr from "./source-packs/ar.json";
import packHi from "./source-packs/hi.json";
import packId from "./source-packs/id.json";
import packRu from "./source-packs/ru.json";
import packIt from "./source-packs/it.json";
import packTr from "./source-packs/tr.json";
import packVi from "./source-packs/vi.json";
import packTh from "./source-packs/th.json";
import packNl from "./source-packs/nl.json";

type SourceContent = { description: string; notes?: string };
type SourcePack = {
  regions: Record<string, string>;
  countries: Record<string, string>;
  sources: Record<string, SourceContent>;
};

const SOURCE_PACKS: Record<LocaleCode, SourcePack> = {
  en: packEn as SourcePack,
  "zh-CN": packZhCN as SourcePack,
  "zh-TW": packZhTW as SourcePack,
  ja: packJa as SourcePack,
  ko: packKo as SourcePack,
  es: packEs as SourcePack,
  fr: packFr as SourcePack,
  de: packDe as SourcePack,
  "pt-BR": packPtBR as SourcePack,
  ar: packAr as SourcePack,
  hi: packHi as SourcePack,
  id: packId as SourcePack,
  ru: packRu as SourcePack,
  it: packIt as SourcePack,
  tr: packTr as SourcePack,
  vi: packVi as SourcePack,
  th: packTh as SourcePack,
  nl: packNl as SourcePack,
};

/** English language labels used on DataSource.language → BCP-47. */
const LANGUAGE_TO_CODE: Record<string, string> = {
  English: "en",
  Chinese: "zh",
  French: "fr",
  German: "de",
  Korean: "ko",
  Portuguese: "pt",
  Turkish: "tr",
  Vietnamese: "vi",
  Arabic: "ar",
  Hindi: "hi",
  Japanese: "ja",
  Hebrew: "he",
  Spanish: "es",
  Swedish: "sv",
};

function displayName(
  locale: LocaleCode,
  type: "region" | "language",
  code: string,
): string | null {
  try {
    return new Intl.DisplayNames([locale], { type }).of(code) ?? null;
  } catch {
    return null;
  }
}

export function localizeCountry(country: string, locale: LocaleCode): string {
  if (!country) return country;
  if (locale === "en") return country;
  const pack = SOURCE_PACKS[locale] ?? SOURCE_PACKS.en;
  const fromPack = pack.countries?.[country] ?? SOURCE_PACKS.en.countries?.[country];
  if (fromPack) return fromPack;
  const iso = countryToFlagCode(country);
  if (!iso) return country;
  return displayName(locale, "region", iso.toUpperCase()) ?? country;
}

export function localizeLanguage(language: string, locale: LocaleCode): string {
  if (locale === "en" || !language) return language;
  return language
    .split(/\s*\/\s*/)
    .map((part) => {
      const code = LANGUAGE_TO_CODE[part.trim()];
      if (!code) return part.trim();
      return displayName(locale, "language", code) ?? part.trim();
    })
    .join(" / ");
}

export function localizeRegion(region: string, locale: LocaleCode): string {
  if (locale === "en" || !region) return region;
  const pack = SOURCE_PACKS[locale] ?? SOURCE_PACKS.en;
  return pack.regions[region] ?? SOURCE_PACKS.en.regions[region] ?? region;
}

export function localizeSource(source: DataSource, locale: LocaleCode): DataSource {
  if (locale === "en") return source;
  const pack = SOURCE_PACKS[locale] ?? SOURCE_PACKS.en;
  const content = pack.sources[source.id] ?? SOURCE_PACKS.en.sources[source.id];
  return {
    ...source,
    language: localizeLanguage(source.language, locale),
    region: localizeRegion(source.region, locale),
    countries: source.countries.map((c) => localizeCountry(c, locale)),
    description: content?.description || source.description,
    notes: content?.notes ?? source.notes,
  };
}
