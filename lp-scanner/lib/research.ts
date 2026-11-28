import { SEED_LPS, slugifyName } from "@/lib/data/seed-lps";
import { localizedLpLists } from "@/lib/i18n/lp-display";
import type { Locale, LpRecord, LpResearchResult } from "@/lib/types";
import { isZh } from "@/lib/i18n/locale";

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "");
}

export function findLp(lps: LpRecord[], query: string): LpRecord | undefined {
  const n = normalize(query);
  if (!n) return undefined;
  return lps.find(
    (lp) =>
      normalize(lp.name) === n ||
      normalize(lp.slug) === n ||
      lp.aliases.some((a) => normalize(a) === n) ||
      (n.length >= 3 && (normalize(lp.name).includes(n) || n.includes(normalize(lp.name)))),
  );
}

async function fetchLiveSnippets(query: string): Promise<{ title: string; url: string; blurb: string }[]> {
  const findings: { title: string; url: string; blurb: string }[] = [];
  try {
    const wikiTitle = encodeURIComponent(query.trim());
    const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${wikiTitle}`;
    const res = await fetch(wikiUrl, {
      headers: { Accept: "application/json", "User-Agent": "LPScanner/1.0" },
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = (await res.json()) as {
        title?: string;
        extract?: string;
        content_urls?: { desktop?: { page?: string } };
        type?: string;
      };
      if (data.type !== "disambiguation" && data.extract) {
        findings.push({
          title: data.title || query,
          url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${wikiTitle}`,
          blurb: data.extract.slice(0, 400),
        });
      }
    }
  } catch {
    // network optional
  }

  // DuckDuckGo instant answer (best effort)
  try {
    const ddg = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query + " liquidity provider FX CFD")}&format=json&no_redirect=1&no_html=1`,
      { signal: AbortSignal.timeout(4000) },
    );
    if (ddg.ok) {
      const data = (await ddg.json()) as {
        AbstractText?: string;
        AbstractURL?: string;
        Heading?: string;
        RelatedTopics?: { Text?: string; FirstURL?: string }[];
      };
      if (data.AbstractText) {
        findings.push({
          title: data.Heading || `${query} overview`,
          url: data.AbstractURL || "https://duckduckgo.com",
          blurb: data.AbstractText.slice(0, 400),
        });
      }
      for (const t of data.RelatedTopics?.slice(0, 2) ?? []) {
        if (t.Text && t.FirstURL) {
          findings.push({ title: t.Text.slice(0, 80), url: t.FirstURL, blurb: t.Text.slice(0, 220) });
        }
      }
    }
  } catch {
    // optional
  }

  return findings;
}

export async function researchLp(
  lps: LpRecord[],
  query: string,
  locale: Locale = "en",
): Promise<LpResearchResult> {
  const matched = findLp(lps, query);
  const live = await fetchLiveSnippets(matched?.name || query);
  const competitors = lps
    .filter((lp) => lp.id !== matched?.id)
    .filter((lp) =>
      matched
        ? lp.category === matched.category ||
          lp.assetClasses.some((a) => matched.assetClasses.includes(a))
        : lp.usedByVantage,
    )
    .slice(0, 5)
    .map((lp) => ({
      name: lp.name,
      relation: lp.usedByVantage
        ? isZh(locale)
          ? "Vantage 在用"
          : "Used by Vantage"
        : isZh(locale)
          ? "仓库候选"
          : "Repo candidate",
      edge: matched
        ? isZh(locale)
          ? `对比 ${matched.name}：定价 ${lp.pricingQuality}/5，成本 ${lp.costTier}，时段 ${lp.hours}`
          : `vs ${matched.name}: pricing ${lp.pricingQuality}/5, cost ${lp.costTier}, hours ${lp.hours}`
        : isZh(locale)
          ? `已知画像：${lp.bestFor[0] || lp.category}`
          : `Known profile: ${lp.bestFor[0] || lp.category}`,
    }));

  if (matched) {
    return {
      query,
      matched,
      isNew: false,
      summary:
        isZh(locale)
          ? `${matched.name}：${matched.kbBodyZh.slice(0, 280)}`
          : `${matched.name}: ${matched.kbBodyEn.slice(0, 280)}`,
      goodFor: localizedLpLists(matched, locale).bestFor,
      recommendedProducts: matched.products.slice(0, 8),
      competitorComparison: competitors,
      liveFindings: [
        ...(isZh(locale)
          ? [
              `静态知识库已收录，Vantage 使用标记：${matched.usedByVantage ? "是" : "否"}`,
              `区域：${localizedLpLists(matched, locale).regions.join("、")}；监管：${matched.regulation.join("、")}`,
            ]
          : [
              `In KB. Vantage-used: ${matched.usedByVantage ? "yes" : "no"}`,
              `Regions: ${matched.regions.join(", ")}; regulation: ${matched.regulation.join(", ")}`,
            ]),
        ...live.map((f) => f.blurb),
      ],
      sources: [
        ...(matched.website ? [{ title: matched.name, url: matched.website }] : []),
        ...live.map((f) => ({ title: f.title, url: f.url })),
      ],
      researchedAt: new Date().toISOString(),
    };
  }

  // Unknown LP — draft profile from live snippets + heuristics
  const qLower = query.toLowerCase();
  const looksCrypto = /bit|coin|crypto|swap|okx|gate|mexc|kucoin|deribit/.test(qLower);
  return {
    query,
    isNew: true,
    summary:
      isZh(locale)
        ? `${query} 尚未在仓库中。以下基于实时公开检索与启发式分类（${looksCrypto ? "偏加密" : "偏传统/未知"}）。请人工核验后决定是否入库。`
        : `${query} is not yet in the repository. Draft below combines live public research and heuristics (${looksCrypto ? "crypto-leaning" : "traditional/unknown"}). Verify before adding.`,
    goodFor: looksCrypto
      ? isZh(locale)
        ? ["加密对冲", "24/7 品种", "山寨币广度"]
        : ["crypto hedging", "24/7 products", "alt breadth"]
      : isZh(locale)
        ? ["需核验的外汇/CFD 流动性", "可能的 PoP/技术中枢"]
        : ["FX/CFD liquidity pending verification", "possible PoP or tech hub"],
    recommendedProducts: looksCrypto
      ? ["BTCUSD", "ETHUSD", "SOLUSD"]
      : ["EURUSD", "XAUUSD", "US30"],
    competitorComparison: competitors,
    liveFindings:
      live.length > 0
        ? live.map((f) => f.blurb)
        : [
            isZh(locale)
              ? "实时检索未返回摘要；建议核验官网、牌照与 FIX/API 文档后再入库。"
              : "Live lookup returned no abstract; verify website, licences and FIX/API docs before adding.",
          ],
    sources: live.map((f) => ({ title: f.title, url: f.url })),
    researchedAt: new Date().toISOString(),
  };
}

export function draftLpFromResearch(query: string, research: LpResearchResult): LpRecord {
  const looksCrypto = /bit|coin|crypto|okx|gate|mexc|kucoin|bybit|binance/.test(query.toLowerCase());
  const now = new Date().toISOString();
  const slug = slugifyName(query) || `lp-${Date.now()}`;
  return {
    id: slug,
    slug,
    name: query.trim(),
    aliases: [],
    category: looksCrypto ? "crypto" : "traditional",
    usedByVantage: false,
    regions: ["Global"],
    hours: looksCrypto ? "24/7" : "24/5",
    assetClasses: looksCrypto ? ["crypto"] : ["fx", "metals", "indices"],
    products: research.recommendedProducts,
    costTier: "negotiated",
    pricingQuality: 3,
    latencyProfile: "medium",
    regulation: ["Unverified"],
    strengths: research.goodFor,
    weaknesses:
      research.liveFindings.length === 0
        ? ["Insufficient public data — needs desk due diligence"]
        : ["Auto-drafted from live research — verify commercials"],
    bestFor: research.goodFor,
    notes: research.summary,
    kbBodyEn: `${research.summary}\n\nLive findings:\n- ${research.liveFindings.join("\n- ")}`,
    kbBodyZh: `${research.summary}\n\n实时发现：\n- ${research.liveFindings.join("\n- ")}`,
    scoreHints: looksCrypto
      ? { gold: 10, fxMajors: 10, indices: 10, oil: 10, crypto: 70, asia: 60 }
      : { gold: 55, fxMajors: 60, indices: 55, oil: 50, crypto: 20, asia: 55 },
    updatedAt: now,
  };
}

export { SEED_LPS };
