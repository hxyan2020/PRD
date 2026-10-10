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

/** Common idea team cities → display labels for CJK locales. */
const CITY_ZH_CN: Record<string, string> = {
  Algiers: "阿尔及尔",
  Amsterdam: "阿姆斯特丹",
  Beijing: "北京",
  Bengaluru: "班加罗尔",
  Berlin: "柏林",
  Bogotá: "波哥大",
  Bogota: "波哥大",
  Boston: "波士顿",
  "Buenos Aires": "布宜诺斯艾利斯",
  "Cape Town": "开普敦",
  Chennai: "金奈",
  Copenhagen: "哥本哈根",
  Dubai: "迪拜",
  Gothenburg: "哥德堡",
  Guangzhou: "广州",
  Helsinki: "赫尔辛基",
  "Ho Chi Minh City": "胡志明市",
  Jakarta: "雅加达",
  Lagos: "拉各斯",
  London: "伦敦",
  Melbourne: "墨尔本",
  "Mexico City": "墨西哥城",
  Montevideo: "蒙得维的亚",
  Munich: "慕尼黑",
  Nairobi: "内罗毕",
  "New York": "纽约",
  Noida: "诺伊达",
  Ottawa: "渥太华",
  Paris: "巴黎",
  "San Francisco": "旧金山",
  "San Mateo": "圣马特奥",
  "São Paulo": "圣保罗",
  "Sao Paulo": "圣保罗",
  Seoul: "首尔",
  Singapore: "新加坡",
  Stockholm: "斯德哥尔摩",
  Sydney: "悉尼",
  Tallinn: "塔林",
  "Tel Aviv": "特拉维夫",
  Tokyo: "东京",
  Toronto: "多伦多",
  Wellington: "惠灵顿",
};

const CITY_ZH_TW: Record<string, string> = {
  ...CITY_ZH_CN,
  Algiers: "阿爾及爾",
  Amsterdam: "阿姆斯特丹",
  Beijing: "北京",
  Bengaluru: "班加羅爾",
  Berlin: "柏林",
  Boston: "波士頓",
  "Buenos Aires": "布宜諾斯艾利斯",
  "Cape Town": "開普敦",
  Chennai: "清奈",
  Copenhagen: "哥本哈根",
  Dubai: "杜拜",
  Gothenburg: "哥特堡",
  Guangzhou: "廣州",
  Helsinki: "赫爾辛基",
  "Ho Chi Minh City": "胡志明市",
  Jakarta: "雅加達",
  Lagos: "拉哥斯",
  London: "倫敦",
  Melbourne: "墨爾本",
  "Mexico City": "墨西哥城",
  Montevideo: "蒙特維多",
  Munich: "慕尼黑",
  Nairobi: "奈洛比",
  "New York": "紐約",
  Ottawa: "渥太華",
  Paris: "巴黎",
  "San Francisco": "舊金山",
  "San Mateo": "聖马特奧",
  "São Paulo": "聖保羅",
  "Sao Paulo": "聖保羅",
  Seoul: "首爾",
  Singapore: "新加坡",
  Stockholm: "斯德哥爾摩",
  Sydney: "雪梨",
  Tallinn: "塔林",
  "Tel Aviv": "特拉維夫",
  Tokyo: "東京",
  Toronto: "多倫多",
  Wellington: "威靈頓",
};

export function localizeCity(city: string, locale: LocaleCode): string {
  if (!city || locale === "en") return city;
  if (locale === "zh-CN") return CITY_ZH_CN[city] ?? city;
  if (locale === "zh-TW") return CITY_ZH_TW[city] ?? CITY_ZH_CN[city] ?? city;
  return city;
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
