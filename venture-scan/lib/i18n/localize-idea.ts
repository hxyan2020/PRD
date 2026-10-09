import type { LocaleCode } from "./locales";
import type { StartupIdea } from "../types";
import packEn from "./idea-packs/en.json";
import packZhCN from "./idea-packs/zh-CN.json";
import packZhTW from "./idea-packs/zh-TW.json";
import packJa from "./idea-packs/ja.json";
import packKo from "./idea-packs/ko.json";
import packEs from "./idea-packs/es.json";
import packFr from "./idea-packs/fr.json";
import packDe from "./idea-packs/de.json";
import packPtBR from "./idea-packs/pt-BR.json";
import packAr from "./idea-packs/ar.json";
import packHi from "./idea-packs/hi.json";
import packId from "./idea-packs/id.json";
import packRu from "./idea-packs/ru.json";
import packIt from "./idea-packs/it.json";
import packTr from "./idea-packs/tr.json";
import packVi from "./idea-packs/vi.json";
import packTh from "./idea-packs/th.json";
import packNl from "./idea-packs/nl.json";

export type IdeaContentFields = {
  name: string;
  description: string;
  businessModel: string;
  industry: string;
  sector: string;
  fundingRoundNote: string;
  goForwardSummary: string;
};

export type IdeaContentPack = Record<string, IdeaContentFields>;

const IDEA_PACKS: Record<LocaleCode, IdeaContentPack> = {
  en: packEn as IdeaContentPack,
  "zh-CN": packZhCN as IdeaContentPack,
  "zh-TW": packZhTW as IdeaContentPack,
  ja: packJa as IdeaContentPack,
  ko: packKo as IdeaContentPack,
  es: packEs as IdeaContentPack,
  fr: packFr as IdeaContentPack,
  de: packDe as IdeaContentPack,
  "pt-BR": packPtBR as IdeaContentPack,
  ar: packAr as IdeaContentPack,
  hi: packHi as IdeaContentPack,
  id: packId as IdeaContentPack,
  ru: packRu as IdeaContentPack,
  it: packIt as IdeaContentPack,
  tr: packTr as IdeaContentPack,
  vi: packVi as IdeaContentPack,
  th: packTh as IdeaContentPack,
  nl: packNl as IdeaContentPack,
};

function fieldsFor(slug: string, locale: LocaleCode): IdeaContentFields | null {
  const pack = IDEA_PACKS[locale] ?? IDEA_PACKS.en;
  return pack[slug] ?? IDEA_PACKS.en[slug] ?? null;
}

/** Return idea copy localized for display. Keep English source for filter value matching. */
export function localizeIdea(idea: StartupIdea, locale: LocaleCode): StartupIdea {
  if (locale === "en") return idea;
  const f = fieldsFor(idea.slug, locale);
  if (!f) return idea;
  return {
    ...idea,
    name: f.name || idea.name,
    description: f.description || idea.description,
    businessModel: f.businessModel || idea.businessModel,
    industry: f.industry || idea.industry,
    sector: f.sector || idea.sector,
    fundingRoundNote: f.fundingRoundNote || idea.fundingRoundNote,
    goForward: {
      ...idea.goForward,
      summary: f.goForwardSummary || idea.goForward.summary,
    },
  };
}

/** Translate a filter option label; `englishValue` stays the select option value. */
export function localizeIdeaFieldLabel(
  kind: "industry" | "sector",
  englishValue: string,
  locale: LocaleCode,
): string {
  if (locale === "en" || !englishValue) return englishValue;
  const pack = IDEA_PACKS[locale] ?? IDEA_PACKS.en;
  for (const [slug, enFields] of Object.entries(IDEA_PACKS.en)) {
    if (enFields[kind] === englishValue) {
      const localized = pack[slug]?.[kind];
      if (localized) return localized;
      break;
    }
  }
  return englishValue;
}

export function ideaPackCoverage(locale: LocaleCode): { total: number; translated: number } {
  const enSlugs = Object.keys(IDEA_PACKS.en);
  if (locale === "en") return { total: enSlugs.length, translated: enSlugs.length };
  const pack = IDEA_PACKS[locale] ?? {};
  let translated = 0;
  for (const slug of enSlugs) {
    const en = IDEA_PACKS.en[slug];
    const loc = pack[slug];
    if (loc && loc.description && loc.description !== en.description) translated += 1;
  }
  return { total: enSlugs.length, translated };
}
