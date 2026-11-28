import { looksChinese } from "./locale";

export type SourceLang = "en" | "nl" | "de" | "fr" | "es" | "it" | "pt" | "zh";

const DISTINCTIVE: Partial<Record<Exclude<SourceLang, "zh">, string[]>> = {
  nl: [
    "kiest",
    "prijsbron",
    "vastrentende",
    "herbeoordeling",
    "betrouwbaarheid",
    "vervallen",
    "doorgeven",
    "caribisch",
    "beleidsbepalers",
    "driejaarlijkse",
    "deelnemers",
    "toezichthouder",
    "waarover",
    "kondigt",
    "verkrijgbare",
    "pensioentransitie",
    "pensioenprominent",
    "premiepensioeninstelling",
    "wijzigingen",
    "canadese",
  ],
  de: [
    "wahlt",
    "preisquelle",
    "festverzinsliche",
    "fuhrender",
    "mehrjahrige",
    "vereinbarung",
    "wertpapiere",
    "kanadische",
    "kanadischen",
    "ausserborslichen",
  ],
};

const WORDS: Record<Exclude<SourceLang, "zh">, string[]> = {
  nl: [
    "het",
    "een",
    "voor",
    "niet",
    "ook",
    "zijn",
    "deze",
    "worden",
    "naar",
    "geen",
    "hangt",
    "begrip",
    "vertrouwen",
    "toonaangevende",
    "leverancier",
    "overeenkomst",
    "genoegen",
    "concreet",
    "welke",
    "vandaag",
    "algemeen",
    "gezamenlijke",
    "uitdaging",
    "communicatie",
    "nederland",
  ],
  de: [
    "und",
    "der",
    "die",
    "das",
    "den",
    "dem",
    "eine",
    "einer",
    "nicht",
    "werden",
    "wird",
    "anbieter",
    "freut",
    "zugang",
    "finanzmarkt",
  ],
  fr: ["les", "des", "une", "dans", "pour", "cette", "sont"],
  es: ["los", "las", "una", "del", "para", "esta"],
  it: ["gli", "delle", "una", "sono", "della"],
  pt: ["uma", "para", "nao", "pelo", "pela"],
  en: [
    "the",
    "and",
    "of",
    "to",
    "in",
    "for",
    "with",
    "on",
    "is",
    "are",
    "that",
    "this",
    "from",
    "will",
    "has",
    "have",
    "its",
    "after",
    "into",
  ],
};

const FOREIGN_LEFTOVER =
  /\b(kiest|prijsbron|vastrentende|canadese|herbeoordeling|betrouwbaarheid|vervallen|wijzigingen|doorgeven|beleidsbepalers|caribisch|nederland|wahlt|preisquelle|festverzinsliche|kanadische|fuhrender|deelnemers|vertrouwen|hangt|begrip|toezichthouder|gezamenlijke|waarover|pensioen|kondigt|verkrijgbare|mehrjahrige|vereinbarung)\b/i;

function tokens(text: string): string[] {
  return (
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .match(/[a-z]{3,}/g) ?? []
  );
}

export function detectSourceLang(text: string): SourceLang {
  const value = text.trim();
  if (!value) return "en";
  const cjk = (value.match(/[\u3400-\u9fff]/g) ?? []).length;
  const latin = (value.match(/[A-Za-z]/g) ?? []).length;
  if (cjk >= 8 && cjk >= latin) return "zh";
  if (looksChinese(value) && latin < 8) return "zh";

  const found = tokens(value);
  const distinctiveHits: Partial<Record<Exclude<SourceLang, "zh">, number>> = {};
  for (const token of found) {
    (Object.keys(DISTINCTIVE) as Array<keyof typeof DISTINCTIVE>).forEach((lang) => {
      if (DISTINCTIVE[lang]?.includes(token)) {
        distinctiveHits[lang] = (distinctiveHits[lang] ?? 0) + 1;
      }
    });
  }
  const distinctiveWinner = (Object.entries(distinctiveHits) as Array<
    [Exclude<SourceLang, "zh">, number]
  >).sort((a, b) => b[1] - a[1])[0];
  if (distinctiveWinner && distinctiveWinner[1] >= 1 && distinctiveWinner[0] !== "en") {
    return distinctiveWinner[0];
  }

  const scores: Record<Exclude<SourceLang, "zh">, number> = {
    en: 0,
    nl: 0,
    de: 0,
    fr: 0,
    es: 0,
    it: 0,
    pt: 0,
  };
  for (const token of found) {
    (Object.keys(WORDS) as Array<Exclude<SourceLang, "zh">>).forEach((lang) => {
      if (WORDS[lang].includes(token)) scores[lang] += 1;
    });
  }

  let winner: Exclude<SourceLang, "zh"> = "en";
  let best = -1;
  (Object.keys(scores) as Array<Exclude<SourceLang, "zh">>).forEach((lang) => {
    if (scores[lang] > best) {
      winner = lang;
      best = scores[lang];
    }
  });
  if (winner !== "en" && best >= 3 && best > scores.en) return winner;
  const dutchParticles = (value.toLowerCase().match(/\b(de|het|een|van|voor|en|op|aan|bij|niet|ook|zijn|ze|zich)\b/g) ?? []).length;
  if (dutchParticles >= 3 && scores.en <= 1) return "nl";
  const germanParticles = (value.toLowerCase().match(/\b(der|die|das|und|den|dem|von|fur|für|mit|ist|im)\b/g) ?? []).length;
  if (germanParticles >= 3 && scores.en <= 1) return "de";
  return "en";
}

export function langPairToZh(lang: SourceLang): string {
  if (lang === "zh") return "zh-CN|zh-CN";
  return `${lang}|zh-CN`;
}

export function looksUntranslated(source: string, translated?: string): boolean {
  const value = translated?.trim() ?? "";
  if (!value) return true;
  if (value === source.trim()) return true;
  if (!looksChinese(value) && /[A-Za-z]{4,}/.test(source)) return true;
  if (FOREIGN_LEFTOVER.test(value)) return true;
  const lang = detectSourceLang(value);
  return lang !== "zh" && lang !== "en" && /[A-Za-z]{6,}/.test(value);
}
