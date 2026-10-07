import type { LocaleCode } from "../i18n/languages";
import type { Game, GameVariation } from "../types/game";
import { preferCompleteText } from "./textPreview";

export type ArchetypeI18n = {
  title: string;
  descTemplate: string;
  steps: string[];
  req: string[];
  participants: string;
};

export type CuratedI18n = {
  name?: string;
  description: string;
  howToPlay: string[];
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

/**
 * Overlay localized catalog fields onto a game.
 * English returns the game unchanged. Matrix games use archetype templates;
 * curated seeds use per-id overlays.
 */
export function localizeGame(
  game: Game,
  locale: LocaleCode,
  catalog?: ContentI18nCatalog | null,
): Game {
  if (locale === "en") return game;
  const pack = packFor(catalog ?? catalogCache, locale);
  if (!pack) return game;

  const category = localizeCategory(game.category, locale, catalog ?? catalogCache);
  const originCountry = localizeCountry(game.originCountry, locale, pack);
  const civilization = localizeCivilization(game.civilization, locale, pack);

  if (game.archetypeKey && pack.archetypes[game.archetypeKey]) {
    const arch = pack.archetypes[game.archetypeKey];
    const countryForTemplate =
      pack.countries[game.originCountry] ?? game.originCountry;
    const description = preferCompleteText(
      fillTemplate(arch.descTemplate, {
        country: countryForTemplate,
        civ: civilization,
      }),
      game.description,
    );
    const name = `${arch.title} — ${countryForTemplate}`;
    const howToPlay = arch.steps.map((step, i) =>
      preferCompleteText(step, game.howToPlay[i] ?? step),
    );
    const requirements = arch.req.map((r, i) =>
      preferCompleteText(r, game.requirements[i] ?? r),
    );
    return {
      ...game,
      name,
      originCountry,
      civilization,
      category,
      description,
      howToPlay,
      requirements,
      idealParticipants: arch.participants || game.idealParticipants,
    };
  }

  const curated = pack.curated[game.id];
  if (!curated) {
    return {
      ...game,
      originCountry,
      civilization,
      category,
    };
  }

  let variations: GameVariation[] = game.variations;
  if (curated.variationNotes && curated.variationNotes.length > 0) {
    variations = game.variations.map((v, i) => ({
      ...v,
      notes: preferCompleteText(
        curated.variationNotes![i] ?? v.notes,
        v.notes,
      ),
      originCountry: localizeCountry(v.originCountry, locale, pack),
    }));
  } else {
    variations = game.variations.map((v) => ({
      ...v,
      originCountry: localizeCountry(v.originCountry, locale, pack),
    }));
  }

  return {
    ...game,
    name: curated.name ?? game.name,
    originCountry,
    civilization,
    category,
    description: preferCompleteText(curated.description, game.description),
    howToPlay: curated.howToPlay.map((step, i) =>
      preferCompleteText(step, game.howToPlay[i] ?? step),
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
): Game[] {
  if (locale === "en") return games;
  const cat = catalog ?? catalogCache;
  if (!cat) return games;
  return games.map((g) => localizeGame(g, locale, cat));
}
