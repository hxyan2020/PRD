import type { LocaleCode } from "../i18n/languages";
import type { MessageKey } from "../i18n/messages/en";
import type { Game, GameVariation } from "../types/game";
import { preferCompleteText } from "./textPreview";

export type ArchetypeI18n = {
  title: string;
  descTemplate: string;
  steps: string[];
  howToWin: string[];
  rulesNotToBreak: string[];
  req: string[];
  participants: string;
};

export type CuratedI18n = {
  name?: string;
  description: string;
  howToPlay: string[];
  howToWin: string[];
  rulesNotToBreak: string[];
  requirements: string[];
  idealParticipants: string;
  variationNotes?: string[];
};

export type LocaleContentPack = {
  archetypes: Record<string, ArchetypeI18n>;
  curated: Record<string, CuratedI18n>;
  categories: Record<string, string>;
  countries: Record<string, string>;
  civilizations: Record<string, string>;
};

export type ContentI18nCatalog = {
  meta: {
    generatedAt: string;
    locales: LocaleCode[];
  };
  locales: Partial<Record<LocaleCode, LocaleContentPack>>;
};

let catalogCache: ContentI18nCatalog | null = null;
let loadPromise: Promise<ContentI18nCatalog> | null = null;

function fillTemplate(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    vars[name] !== undefined ? vars[name] : `{${name}}`,
  );
}

/** Load catalog content overlays (English is the source; overlays apply at runtime). */
export async function loadContentI18n(): Promise<ContentI18nCatalog> {
  if (catalogCache) return catalogCache;
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    const res = await fetch(`${import.meta.env.BASE_URL}data/content-i18n.json`);
    if (!res.ok) {
      throw new Error(`Failed to load content-i18n (${res.status})`);
    }
    catalogCache = (await res.json()) as ContentI18nCatalog;
    return catalogCache;
  })();
  try {
    return await loadPromise;
  } finally {
    loadPromise = null;
  }
}

function packFor(
  catalog: ContentI18nCatalog | null,
  locale: LocaleCode,
): LocaleContentPack | null {
  if (!catalog || locale === "en") return null;
  return catalog.locales[locale] ?? null;
}

/** Translate a category label; English passthrough. */
export function localizeCategory(
  category: string,
  locale: LocaleCode,
  catalog?: ContentI18nCatalog | null,
): string {
  if (locale === "en") return category;
  const pack = packFor(catalog ?? catalogCache, locale);
  return pack?.categories[category] ?? category;
}

function localizeCountry(
  country: string,
  locale: LocaleCode,
  pack: LocaleContentPack | null,
): string {
  if (!pack || locale === "en") return country;
  return pack.countries[country] ?? country;
}

function localizeCivilization(
  civilization: string,
  locale: LocaleCode,
  pack: LocaleContentPack | null,
): string {
  if (!pack || locale === "en") return civilization;
  return pack.civilizations[civilization] ?? civilization;
}

/** Common matrix-era labels → MessageKey (UI dictionary). */
const ERA_MESSAGE_KEYS: Record<string, MessageKey> = {
  "ancient–present": "era.ancientPresent",
  "ancient-present": "era.ancientPresent",
  "centuries old": "era.centuriesOld",
  "prehistoric–present": "era.prehistoricPresent",
  "prehistoric-present": "era.prehistoricPresent",
  "oral antiquity": "era.oralAntiquity",
  "modern school spread; older flick roots": "era.modernSchoolFlick",
  "unknown antiquity": "era.unknownAntiquity",
  "pre-Columbian": "era.preColumbian",
  medieval: "era.medieval",
  "medieval–modern": "era.medievalModern",
};

type EraTranslator = (key: MessageKey) => string;

/**
 * Localize a creation-year / era label. Common catalog phrases use UI messages;
 * dated strings get light script-aware token swaps when a translator is provided.
 */
export function localizeCreationYear(
  year: string,
  locale: LocaleCode,
  t?: EraTranslator,
): string {
  if (!year || locale === "en") return year;
  const key = ERA_MESSAGE_KEYS[year];
  if (key && t) {
    const translated = t(key);
    if (translated && translated !== key) return translated;
  }
  if (!t) return year;

  // Light structural localization for dated phrases (c. 600 CE, 20th century, …)
  if (locale === "zh-Hans" || locale === "zh-Hant") {
    return year
      .replace(/\bc\.\s*/gi, "约 ")
      .replace(/\bBCE\b/g, "公元前")
      .replace(/\bCE\b/g, "公元")
      .replace(/\b(\d+)(st|nd|rd|th)\s+century\b/gi, "$1世纪")
      .replace(/\bcentury\b/gi, "世纪")
      .replace(/\bor earlier\b/gi, "或更早")
      .replace(/\bcenturies old\b/gi, locale === "zh-Hant" ? "數百年歷史" : "数百年历史")
      .replace(/\bdocumented\b/gi, locale === "zh-Hant" ? "有記載" : "有记载")
      .replace(/\bpopular\b/gi, locale === "zh-Hant" ? "流行" : "流行")
      .replace(/\bancestors?\b/gi, locale === "zh-Hant" ? "先祖形式" : "先祖形式")
      .replace(/\bmodern form later\b/gi, locale === "zh-Hant" ? "現代形制較晚" : "现代形制较晚")
      .replace(/\bearly centuries CE\b/gi, locale === "zh-Hant" ? "公元最初數世紀" : "公元最初数世纪");
  }
  if (locale === "ja") {
    return year
      .replace(/\bc\.\s*/gi, "約")
      .replace(/\bBCE\b/g, "紀元前")
      .replace(/\bCE\b/g, "紀元")
      .replace(/\b(\d+)(st|nd|rd|th)\s+century\b/gi, "$1世紀")
      .replace(/\bcentury\b/gi, "世紀")
      .replace(/\bor earlier\b/gi, "以前")
      .replace(/\bcenturies old\b/gi, "何世紀にもわたる");
  }
  if (locale === "ko") {
    return year
      .replace(/\bc\.\s*/gi, "약 ")
      .replace(/\bBCE\b/g, "기원전")
      .replace(/\bCE\b/g, "기원")
      .replace(/\b(\d+)(st|nd|rd|th)\s+century\b/gi, "$1세기")
      .replace(/\bcentury\b/gi, "세기")
      .replace(/\bor earlier\b/gi, "이전")
      .replace(/\bcenturies old\b/gi, "수 세기");
  }
  if (locale === "es" || locale === "pt" || locale === "it" || locale === "fr" || locale === "de") {
    const map: Record<string, [string, string, string]> = {
      es: ["c. ", "a. C.", "d. C."],
      pt: ["c. ", "a.C.", "d.C."],
      it: ["ca. ", "a.C.", "d.C."],
      fr: ["env. ", "av. J.-C.", "apr. J.-C."],
      de: ["ca. ", "v. Chr.", "n. Chr."],
    };
    const [c, bce, ce] = map[locale]!;
    return year
      .replace(/\bc\.\s*/gi, c)
      .replace(/\bBCE\b/g, bce)
      .replace(/\bCE\b/g, ce)
      .replace(/\bcenturies old\b/gi, locale === "de" ? "jahrhundertealt" : locale === "fr" ? "vieille de siècles" : "de siglos");
  }
  return year;
}

/**
 * Overlay localized catalog fields onto a game.
 * English returns the game unchanged. Matrix games use archetype templates;
 * curated seeds use per-id overlays.
 */
export function localizeGame(
  game: Game,
  locale: LocaleCode,
  catalog?: ContentI18nCatalog | null,
  t?: EraTranslator,
): Game {
  const originKey = game.originCountryKey ?? game.originCountry;
  const categoryKey = game.categoryKey ?? game.category;
  if (locale === "en") {
    return game.originCountryKey && game.categoryKey
      ? game
      : {
          ...game,
          originCountryKey: originKey,
          categoryKey,
          variations: game.variations.map((v) => ({
            ...v,
            originCountryKey: v.originCountryKey ?? v.originCountry,
            creationYear: v.creationYear,
          })),
        };
  }
  const pack = packFor(catalog ?? catalogCache, locale);
  if (!pack) return game;

  const category = localizeCategory(categoryKey, locale, catalog ?? catalogCache);
  const originCountry = localizeCountry(originKey, locale, pack);
  const civilization = localizeCivilization(game.civilization, locale, pack);
  const creationYear = localizeCreationYear(game.creationYear, locale, t);

  if (game.archetypeKey && pack.archetypes[game.archetypeKey]) {
    const arch = pack.archetypes[game.archetypeKey];
    const countryForTemplate = pack.countries[originKey] ?? originKey;
    const description = preferCompleteText(
      fillTemplate(arch.descTemplate, {
        country: countryForTemplate,
        civ: civilization,
      }),
      game.description,
    );
    const name = `${arch.title} — ${countryForTemplate}`;
    const howToPlay = arch.steps.map((step, i) =>
      preferCompleteText(
        fillTemplate(step, {
          country: countryForTemplate,
          civ: civilization,
        }),
        game.howToPlay[i] ?? step,
      ),
    );
    const howToWin = (arch.howToWin || []).map((step, i) =>
      preferCompleteText(
        fillTemplate(step, {
          country: countryForTemplate,
          civ: civilization,
        }),
        game.howToWin[i] ?? step,
      ),
    );
    const rulesNotToBreak = (arch.rulesNotToBreak || []).map((step, i) =>
      preferCompleteText(
        fillTemplate(step, {
          country: countryForTemplate,
          civ: civilization,
        }),
        game.rulesNotToBreak[i] ?? step,
      ),
    );
    const requirements = arch.req.map((r, i) =>
      preferCompleteText(r, game.requirements[i] ?? r),
    );
    return {
      ...game,
      name,
      originCountry,
      originCountryKey: originKey,
      civilization,
      category,
      categoryKey,
      creationYear,
      description,
      howToPlay,
      howToWin: howToWin.length ? howToWin : game.howToWin,
      rulesNotToBreak: rulesNotToBreak.length
        ? rulesNotToBreak
        : game.rulesNotToBreak,
      requirements,
      idealParticipants: arch.participants || game.idealParticipants,
    };
  }

  const curated = pack.curated[game.id];
  if (!curated) {
    return {
      ...game,
      originCountry,
      originCountryKey: originKey,
      civilization,
      category,
      categoryKey,
      creationYear,
      variations: game.variations.map((v) => {
        const key = v.originCountryKey ?? v.originCountry;
        return {
          ...v,
          originCountryKey: key,
          originCountry: localizeCountry(key, locale, pack),
          creationYear: localizeCreationYear(v.creationYear, locale, t),
        };
      }),
    };
  }

  let variations: GameVariation[] = game.variations.map((v, i) => {
    const key = v.originCountryKey ?? v.originCountry;
    return {
      ...v,
      originCountryKey: key,
      originCountry: localizeCountry(key, locale, pack),
      creationYear: localizeCreationYear(v.creationYear, locale, t),
      notes: curated.variationNotes?.[i]
        ? preferCompleteText(curated.variationNotes[i]!, v.notes)
        : v.notes,
    };
  });

  return {
    ...game,
    name: curated.name ?? game.name,
    originCountry,
    originCountryKey: originKey,
    civilization,
    category,
    categoryKey,
    creationYear,
    description: preferCompleteText(curated.description, game.description),
    howToPlay: curated.howToPlay.map((step, i) =>
      preferCompleteText(step, game.howToPlay[i] ?? step),
    ),
    howToWin: (curated.howToWin || []).map((step, i) =>
      preferCompleteText(step, game.howToWin[i] ?? step),
    ),
    rulesNotToBreak: (curated.rulesNotToBreak || []).map((step, i) =>
      preferCompleteText(step, game.rulesNotToBreak[i] ?? step),
    ),
    requirements: curated.requirements.map((r, i) =>
      preferCompleteText(r, game.requirements[i] ?? r),
    ),
    idealParticipants: curated.idealParticipants || game.idealParticipants,
    variations,
  };
}

/** Clear cache (tests / HMR). */
export function clearContentI18nCache() {
  catalogCache = null;
  loadPromise = null;
}

/** Localize an entire games list for the active locale. */
export function localizeGames(
  games: Game[],
  locale: LocaleCode,
  catalog?: ContentI18nCatalog | null,
  t?: EraTranslator,
): Game[] {
  if (locale === "en") return games;
  const cat = catalog ?? catalogCache;
  if (!cat) return games;
  return games.map((g) => localizeGame(g, locale, cat, t));
}
