import { localizedLpLists } from "@/lib/i18n/lp-display";
import { isZh } from "@/lib/i18n/locale";
import type { ScoreBand } from "@/lib/quality-research";
import type { Locale, LpRecord, RankedLp } from "@/lib/types";

export type LpRealDatum = {
  key: string;
  label: string;
  value: string;
  /** Field comes from the LP’s own repository / public profile. */
  fromLp: boolean;
};

export type QualityLpCard = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  website?: string;
  score: number;
  band: ScoreBand;
  bandLabel: string;
  usedByVantage: boolean;
  offersProduct: boolean;
  rank?: number;
  summary: string;
  realData: LpRealDatum[];
  liveFindings: string[];
  pros: string[];
  cons: string[];
  sources: { title: string; url: string }[];
};

type CardScore = {
  slug: string;
  score: number;
  band: ScoreBand;
  bandLabel: string;
  offersProduct: boolean;
};

/** Build collapsible per-LP quality cards from real LP repository fields. */
export function buildQualityLpCards(args: {
  locale: Locale;
  product?: string;
  lps: LpRecord[];
  rankings?: RankedLp[];
  scores: CardScore[];
  liveBySlug?: Record<string, string[]>;
  scoreKey?: keyof LpRecord["scoreHints"];
}): QualityLpCard[] {
  const {
    locale,
    product,
    lps,
    rankings,
    scores,
    liveBySlug = {},
    scoreKey = "fxMajors",
  } = args;
  const zh = isZh(locale);
  const tw = locale === "zh-TW";
  const symbol = product?.toUpperCase();
  const rankById = new Map((rankings ?? []).map((r) => [r.lp.id, r]));
  const scoreBySlug = new Map(scores.map((s) => [s.slug, s]));

  const ordered =
    rankings && rankings.length ? rankings.map((r) => r.lp) : lps;

  return ordered.map((lp) => {
    const ranked = rankById.get(lp.id);
    const scored = scoreBySlug.get(lp.slug);
    const score = scored?.score ?? 0;
    const band = scored?.band ?? "red";
    const bandLabel = scored?.bandLabel ?? band;
    const lists = localizedLpLists(lp, locale);
    const live = liveBySlug[lp.slug] ?? ranked?.liveNotes.slice(0, 3) ?? [];

    const realData: LpRealDatum[] = [
      {
        key: "products",
        label: tw ? "產品表（LP 倉庫）" : zh ? "产品表（LP 仓库）" : "Product list (LP repo)",
        value: lp.products.slice(0, 8).join(", ") || "—",
        fromLp: true,
      },
      {
        key: "pricing",
        label: tw ? "定價質量" : zh ? "定价质量" : "Pricing quality",
        value: `${lp.pricingQuality}/5`,
        fromLp: true,
      },
      {
        key: "cost",
        label: tw ? "成本檔" : zh ? "成本档" : "Cost tier",
        value: lp.costTier,
        fromLp: true,
      },
      {
        key: "latency",
        label: tw ? "延遲檔" : zh ? "延迟档" : "Latency profile",
        value: lp.latencyProfile,
        fromLp: true,
      },
      {
        key: "hours",
        label: tw ? "時段" : zh ? "时段" : "Hours",
        value: lp.hours,
        fromLp: true,
      },
      {
        key: "regulation",
        label: tw ? "監管標籤" : zh ? "监管标签" : "Regulation tags",
        value: lp.regulation.join(", ") || "—",
        fromLp: true,
      },
      {
        key: "regions",
        label: tw ? "區域" : zh ? "区域" : "Regions",
        value: lists.regions.join(", ") || "—",
        fromLp: true,
      },
      {
        key: "hint",
        label: tw ? "品種能力提示" : zh ? "品种能力提示" : "Family capability hint",
        value: `${lp.scoreHints[scoreKey] ?? 50}/100`,
        fromLp: true,
      },
    ];

    const summary = tw
      ? `${lp.name} 對 ${symbol ?? "標的"} 代理分 ${score}/100（${bandLabel}）。數據來自該 LP 倉庫實檔${lp.website ? "與官網" : ""}。`
      : zh
        ? `${lp.name} 对 ${symbol ?? "标的"} 代理分 ${score}/100（${bandLabel}）。数据来自该 LP 仓库实档${lp.website ? "与官网" : ""}。`
        : `${lp.name} scores ${score}/100 (${bandLabel}) on ${symbol ?? "this product"} from its repository profile${lp.website ? " and website" : ""}.`;

    const sources = [
      ...(lp.website ? [{ title: lp.name, url: lp.website }] : []),
      {
        title: tw ? "本應用 LP倉庫" : zh ? "本应用 LP仓库" : "In-app LP Repository",
        url: "/repository",
      },
    ];

    return {
      id: lp.id,
      name: lp.name,
      slug: lp.slug,
      logoUrl: lp.logoUrl,
      website: lp.website,
      score,
      band,
      bandLabel,
      usedByVantage: lp.usedByVantage,
      offersProduct: scored?.offersProduct ?? ranked?.offersProduct ?? true,
      rank: ranked?.rank,
      summary,
      realData,
      liveFindings: live,
      pros: lists.strengths.slice(0, 4),
      cons: lists.weaknesses.slice(0, 4),
      sources,
    };
  });
}
