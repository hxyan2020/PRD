import { LP_ZH } from "@/lib/data/lp-zh";
import type { Locale, LpRecord } from "@/lib/types";
import { t, type MessageKey } from "@/lib/i18n/messages";
import { isZh } from "@/lib/i18n/locale";

export type LocalizedLpLists = {
  bestFor: string[];
  strengths: string[];
  weaknesses: string[];
  regions: string[];
};

/** Pick EN/ZH list fields for an LP (falls back to English). */
export function localizedLpLists(lp: LpRecord, locale: Locale): LocalizedLpLists {
  const zh = isZh(locale) ? LP_ZH[lp.slug] : undefined;
  return {
    bestFor: (zh?.bestFor?.length ? zh.bestFor : lp.bestForZh?.length ? lp.bestForZh : lp.bestFor) ?? [],
    strengths:
      (zh?.strengths?.length ? zh.strengths : lp.strengthsZh?.length ? lp.strengthsZh : lp.strengths) ??
      [],
    weaknesses:
      (zh?.weaknesses?.length
        ? zh.weaknesses
        : lp.weaknessesZh?.length
          ? lp.weaknessesZh
          : lp.weaknesses) ?? [],
    regions: (zh?.regions?.length ? zh.regions : lp.regionsZh?.length ? lp.regionsZh : lp.regions) ?? [],
  };
}

export function labelCategory(locale: Locale, category: LpRecord["category"]): string {
  const key = `label.category.${category}` as MessageKey;
  return t(locale, key);
}

export function labelCost(locale: Locale, cost: LpRecord["costTier"]): string {
  return t(locale, `label.cost.${cost}` as MessageKey);
}

export function labelLatency(locale: Locale, latency: LpRecord["latencyProfile"]): string {
  return t(locale, `label.latency.${latency}` as MessageKey);
}

export function labelHours(locale: Locale, hours: LpRecord["hours"]): string {
  return t(locale, `label.hours.${hours}` as MessageKey);
}

export function labelVantageBadge(locale: Locale, used: boolean): string {
  return used ? t(locale, "label.vantage") : t(locale, "label.candidate");
}

/** Translate occasional descriptive product labels; leave tickers as-is. */
export function localizeProducts(products: string[], locale: Locale): string[] {
  if (!isZh(locale)) return products;
  const mapCn: Record<string, string> = {
    "long-tail alts": "长尾山寨币",
    "altcoin CFDs": "山寨币 CFD",
    "equity CFDs": "股票 CFD",
    bonds: "债券",
    "multi-LP aggregation": "多 LP 聚合",
    "majors FX": "主要货币对",
  };
  const mapTw: Record<string, string> = {
    "long-tail alts": "長尾山寨幣",
    "altcoin CFDs": "山寨幣 CFD",
    "equity CFDs": "股票 CFD",
    bonds: "債券",
    "multi-LP aggregation": "多 LP 聚合",
    "majors FX": "主要貨幣對",
  };
  const map = locale === "zh-TW" ? mapTw : mapCn;
  return products.map((p) => map[p] ?? p);
}

export function formatLpMeta(lp: LpRecord, locale: Locale): string {
  const lists = localizedLpLists(lp, locale);
  const cost = labelCost(locale, lp.costTier);
  const latency = labelLatency(locale, lp.latencyProfile);
  const hours = labelHours(locale, lp.hours);
  if (locale === "zh-TW") {
    return `${lists.regions.join(" · ")} · ${hours} · 成本 ${cost} · 定價 ${lp.pricingQuality}/5 · ${latency}`;
  }
  if (locale === "zh-CN") {
    return `${lists.regions.join(" · ")} · ${hours} · 成本 ${cost} · 定价 ${lp.pricingQuality}/5 · ${latency}`;
  }
  return `${lists.regions.join(" · ")} · ${hours} · cost ${cost} · pricing ${lp.pricingQuality}/5 · ${latency}`;
}

export function formatLpCompactMeta(lp: LpRecord, locale: Locale): string {
  return [
    labelCategory(locale, lp.category),
    labelHours(locale, lp.hours),
    labelCost(locale, lp.costTier),
    labelLatency(locale, lp.latencyProfile),
  ].join(" · ");
}
