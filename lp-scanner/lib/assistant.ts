import {
  FINAL_METHODOLOGY,
  GUIDE_SOURCES,
  TEST_MODES,
} from "@/lib/data/lp-quality-testing";
import { localizedLpLists, labelVantageBadge } from "@/lib/i18n/lp-display";
import { isZh } from "@/lib/i18n/locale";
import { resolveProduct } from "@/lib/products";
import { REGION_META, regionLabel, resolveOptimalRegions } from "@/lib/regions";
import { findLp } from "@/lib/research";
import { rankLpsForProduct } from "@/lib/rank";
import type { Locale, LpRecord } from "@/lib/types";

export type ChatSource = { title: string; url: string };

export type ChatSection = {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type ChatAnswer = {
  intent:
    | "methodology"
    | "product"
    | "lp"
    | "compare"
    | "region"
    | "vantage"
    | "clarify"
    | "general";
  /** Short paraphrase so the user sees the question was understood. */
  understoodAs: string;
  sections: ChatSection[];
  sources: ChatSource[];
  disclaimer?: string;
};

const PRODUCT_RE =
  /\b(xauusd|xagusd|eurusd|gbpusd|usdjpy|audusd|nzdusd|usdcad|usdchf|us30|nas100|uk100|ger40|btcusd|ethusd|solusd|oil|brent|wti|黄金|白银|比特币|加密)\b/i;

const METHOD_RE =
  /test|testing|methodology|uat|demo|backtest|shadow|slippage|last.?look|fill.?rate|reject|latency|tca|best.?execution|poc|quote.?quality|执行质量|方法论|回测|影子|滑点|拒单|延迟|小额|实盘|uat|测试|报价质量|成交率/i;

const COMPARE_RE = /\b(vs|versus|compare|comparison|对比|比较|哪个更好|which.*(better|best))\b/i;
const REGION_RE = /region|optimal|flag|覆盖|区域|地区|旗|新加坡|英国|欧盟|asia|uk|eu|sg|au/i;
const VANTAGE_RE = /vantage.*(use|used|lp)|used by vantage|在用|已接入|仓库有哪些/i;

function uniqSources(sources: ChatSource[]): ChatSource[] {
  const seen = new Set<string>();
  const out: ChatSource[] = [];
  for (const s of sources) {
    if (!s.url || seen.has(s.url)) continue;
    seen.add(s.url);
    out.push(s);
  }
  return out.slice(0, 6);
}

function guideSources(...titles: string[]): ChatSource[] {
  const picked = GUIDE_SOURCES.filter((s) =>
    titles.some((t) => s.title.toLowerCase().includes(t.toLowerCase())),
  );
  return picked.length > 0 ? picked : GUIDE_SOURCES.slice(0, 3);
}

function internalSources(locale: Locale): ChatSource[] {
  return [
    {
      title: isZh(locale) ? "LP 测试 · 最终方法论" : "LP Testing · Final methodology",
      url: "/testing#methodology",
    },
    {
      title: isZh(locale) ? "知识库" : "Knowledge Base",
      url: "/knowledge",
    },
  ];
}

function findMentionedLps(text: string, lps: LpRecord[]): LpRecord[] {
  const trimmed = text.trim();
  if (!trimmed || /^[?？.\s]+$/.test(trimmed)) return [];

  const hits: LpRecord[] = [];
  const lower = trimmed.toLowerCase();
  for (const lp of lps) {
    const names = [lp.name, lp.slug, ...lp.aliases].map((n) => n.toLowerCase());
    if (names.some((n) => n.length >= 3 && lower.includes(n))) {
      hits.push(lp);
    }
  }
  // Direct match only when the query looks like a name token (avoid empty-normalize false positives)
  const token = trimmed.replace(/[?？]/g, "").trim();
  if (token.length >= 2) {
    const direct = findLp(lps, token);
    if (direct && !hits.some((h) => h.id === direct.id)) hits.unshift(direct);
  }
  return hits;
}

function extractProduct(question: string, selection: string): string | null {
  const blob = `${question} ${selection}`;
  const m = blob.match(PRODUCT_RE);
  if (m) {
    const raw = m[1];
    if (/黄金|gold|xau/i.test(raw)) return "XAUUSD";
    if (/白银|xag/i.test(raw)) return "XAGUSD";
    if (/比特币|btc/i.test(raw)) return "BTCUSD";
    if (/eth/i.test(raw)) return "ETHUSD";
    if (/加密|crypto/i.test(raw) && !/btc|eth/i.test(blob)) return "BTCUSD";
    if (/oil|brent|wti/i.test(raw)) return "USOIL";
    return raw.toUpperCase();
  }
  // Only accept resolveProduct when the query is a compact symbol-like token
  // (resolveProduct otherwise invents a profile for any free-text string).
  for (const part of [question, selection]) {
    const token = part.trim();
    if (!token || token.length > 12 || /\s/.test(token)) continue;
    if (!/^[A-Za-z0-9]{3,12}$/.test(token)) continue;
    const resolved = resolveProduct(token);
    if (resolved && /^[A-Z0-9]{3,12}$/.test(resolved.symbol) && resolved.symbol === token.toUpperCase().replace(/[\/\s-_]/g, "")) {
      return resolved.symbol;
    }
    // Known alias hit (e.g. GOLD → XAUUSD)
    if (resolved && token.toUpperCase().replace(/[\/\s-_]/g, "").length <= 8) {
      const compact = token.toUpperCase().replace(/[\/\s-_]/g, "");
      if (
        resolved.symbol === compact ||
        resolved.aliases.some((a) => a.toUpperCase().replace(/[\/\s-_]/g, "") === compact)
      ) {
        return resolved.symbol;
      }
    }
  }
  return null;
}

export function classifyIntent(
  question: string,
  selection: string,
  lps: LpRecord[],
): ChatAnswer["intent"] {
  if (!question.trim() || question.trim().length < 3 || /^[?？.\s]+$/.test(question.trim())) {
    return "clarify";
  }
  const blob = `${question}\n${selection}`;
  if (COMPARE_RE.test(blob) && findMentionedLps(blob, lps).length >= 1) return "compare";
  if (METHOD_RE.test(blob)) return "methodology";
  if (extractProduct(question, selection)) return "product";
  if (findMentionedLps(blob, lps).length >= 1) return "lp";
  if (REGION_RE.test(blob)) return "region";
  if (VANTAGE_RE.test(blob)) return "vantage";
  // Selection-only follow-ups that look like "what about this?"
  if (selection.trim() && /^(what|why|how|是否|怎么|为何|什么|能否)/i.test(question.trim())) {
    if (METHOD_RE.test(selection)) return "methodology";
    if (findMentionedLps(selection, lps).length) return "lp";
  }
  return "general";
}

function answerMethodology(locale: Locale, question: string, selection: string): ChatAnswer {
  const zh = isZh(locale);
  const focusShadow = /shadow|影子|production md|生产行情/i.test(question + selection);
  const focusUat = /uat|demo|接口/i.test(question + selection);
  const focusNewProduct = /new product|新商品|新品种|already.?connect|已接入/i.test(
    question + selection,
  );

  const bullets = zh
    ? TEST_MODES.map((m) => `${m.modeZh}（${m.providerZh}）：${m.testsZh}`)
    : TEST_MODES.map((m) => `${m.modeEn} (${m.providerEn}): ${m.testsEn}`);

  const caveats = zh ? FINAL_METHODOLOGY.caveatsZh : FINAL_METHODOLOGY.caveatsEn;

  const focusPara = focusNewProduct
    ? zh
      ? FINAL_METHODOLOGY.pipelineShortZh
      : FINAL_METHODOLOGY.pipelineShortEn
    : focusShadow
      ? zh
        ? "实时影子测试最适合比较不同 LP 的实际报价稳定性、断流与延迟；它不能单独证明 Fill/Last Look。"
        : "Live quote shadowing is best for comparing real quote stability, gaps and latency across LPs; it alone does not prove fills or last look."
      : focusUat
        ? zh
          ? "LP UAT 主要验证 FIX/API 连接与交易流程，不代表生产流动性或成交质量（机构级 LP 也不一定都提供 UAT）。"
          : "LP UAT mainly validates FIX/API connectivity and workflow — not production liquidity or fill quality (and not every institutional LP offers UAT)."
        : zh
          ? FINAL_METHODOLOGY.principleZh[0]
          : FINAL_METHODOLOGY.principleEn[0];

  return {
    intent: "methodology",
    understoodAs: zh
      ? "你在问 LP 报价/执行质量应如何测试（最终方法论）。"
      : "You are asking how to test LP quote/execution quality (final methodology).",
    sections: [
      {
        heading: zh ? "标准流水线" : "Canonical pipeline",
        paragraphs: [
          zh ? FINAL_METHODOLOGY.pipelineZh : FINAL_METHODOLOGY.pipelineEn,
          focusPara,
        ],
      },
      {
        heading: zh ? "四种测试方式" : "Four test modes",
        bullets,
      },
      {
        heading: zh ? "各方式局限" : "What each mode cannot prove",
        bullets: caveats,
      },
    ],
    sources: uniqSources([
      ...internalSources(locale),
      ...guideSources("Ripple", "Equidity", "AMTS", "Brokerage Atlas", "execution-quality"),
    ]),
    disclaimer: zh
      ? "公开资料用于方法框架；具体 UAT/生产差异以各 LP 合同与联调结果为准。"
      : "Public sources support the framework; confirm UAT vs production gaps with each LP’s contract and integration results.",
  };
}

function answerProduct(
  locale: Locale,
  lps: LpRecord[],
  product: string,
  question: string,
): ChatAnswer {
  const zh = isZh(locale);
  const ranked = rankLpsForProduct(lps, product, locale);
  const top = ranked.rankings.slice(0, 5);
  const bullets = top.map((r) => {
    const badge = labelVantageBadge(locale, r.lp.usedByVantage);
    const reason = r.reasons[0] ?? "";
    return zh
      ? `#${r.rank} ${r.lp.name}（${badge}）· 分 ${r.score} — ${reason}`
      : `#${r.rank} ${r.lp.name} (${badge}) · score ${r.score} — ${reason}`;
  });

  const sources: ChatSource[] = [
    { title: zh ? "产品扫描（应用内）" : "Product scan (in-app)", url: "/" },
    ...top
      .filter((r) => r.lp.website)
      .slice(0, 3)
      .map((r) => ({ title: r.lp.name, url: r.lp.website! })),
    ...guideSources("Equidity", "Luramic"),
  ];

  return {
    intent: "product",
    understoodAs: zh
      ? `你在问品种 ${ranked.product}（${ranked.assetClass}）应优先考虑哪些 LP。`
      : `You are asking which LPs fit product ${ranked.product} (${ranked.assetClass}).`,
    sections: [
      {
        heading: zh ? `推荐（${ranked.product}）` : `Recommendations (${ranked.product})`,
        paragraphs: [
          zh
            ? "以下按知识库能力分、覆盖与 Vantage 在用标记排序，属于桌面筛选而非实盘 TCA。"
            : "Ranked from KB capability, coverage and Vantage-used flags — desk screening, not live TCA.",
        ],
        bullets,
      },
      {
        heading: zh ? "建议下一步" : "Suggested next step",
        bullets: zh
          ? [
              "对短名单做生产行情影子测试（延迟/断流/稳定性）",
              "再做小额实盘验证 Fill / Slippage / Last Look",
              `问题原文：「${question.slice(0, 100)}」`,
            ]
          : [
              "Shadow production MD on the shortlist (latency / gaps / stability)",
              "Then small live fills for fill rate / slippage / last look",
              `Question: “${question.slice(0, 100)}”`,
            ],
      },
    ],
    sources: uniqSources(sources),
    disclaimer: zh
      ? "排名来自本仓库知识库启发式；上线前请按最终方法论补齐影子与小额实盘样本。"
      : "Ranking uses in-repo KB heuristics; complete shadow + small-live samples before go-live.",
  };
}

function answerLp(locale: Locale, lp: LpRecord, selection: string): ChatAnswer {
  const zh = isZh(locale);
  const lists = localizedLpLists(lp, locale);
  const optimal = resolveOptimalRegions(lp.slug, lp.optimalRegions);
  const regions = optimal.map((c) => `${REGION_META[c].flag} ${regionLabel(c, locale)}`);

  return {
    intent: "lp",
    understoodAs: zh
      ? `你在了解 ${lp.name} 的定位与适用场景。`
      : `You are asking about ${lp.name}’s profile and fit.`,
    sections: [
      {
        heading: lp.name,
        paragraphs: [
          zh ? lp.kbBodyZh.slice(0, 420) : lp.kbBodyEn.slice(0, 420),
        ],
      },
      {
        heading: zh ? "要点" : "Key facts",
        bullets: [
          zh
            ? `Vantage：${lp.usedByVantage ? "在用" : "候选"} · 类别 ${lp.category} · 时段 ${lp.hours}`
            : `Vantage: ${lp.usedByVantage ? "used" : "candidate"} · ${lp.category} · hours ${lp.hours}`,
          zh
            ? `成本 ${lp.costTier} · 定价质量 ${lp.pricingQuality}/5 · 延迟 ${lp.latencyProfile}`
            : `Cost ${lp.costTier} · pricing quality ${lp.pricingQuality}/5 · latency ${lp.latencyProfile}`,
          zh
            ? `擅长：${lists.bestFor.slice(0, 4).join("、")}`
            : `Best for: ${lists.bestFor.slice(0, 4).join(", ")}`,
          zh
            ? `最优区域：${regions.slice(0, 6).join(" ")}`
            : `Optimal regions: ${regions.slice(0, 6).join(" ")}`,
          zh
            ? `监管提示：${lp.regulation.join("、")}`
            : `Regulation notes: ${lp.regulation.join(", ")}`,
        ],
      },
      ...(selection.trim()
        ? [
            {
              heading: zh ? "与选中内容相关" : "Tied to your selection",
              paragraphs: [
                zh
                  ? `选中摘要：「${selection.slice(0, 160)}${selection.length > 160 ? "…" : ""}」——回答已结合该上下文。`
                  : `Selection: “${selection.slice(0, 160)}${selection.length > 160 ? "…" : ""}” — answer uses this context.`,
              ],
            },
          ]
        : []),
    ],
    sources: uniqSources([
      ...(lp.website ? [{ title: `${lp.name} (official)`, url: lp.website }] : []),
      ...internalSources(locale),
      ...guideSources("Equidity", "FxTrusts"),
    ]),
    disclaimer: zh
      ? "知识库为桌面研究摘要；商业条款与牌照实体请以官网/合同为准。"
      : "KB is a desk research summary; confirm commercials and contracting entity on the official site/contract.",
  };
}

function answerCompare(locale: Locale, lps: LpRecord[], mentioned: LpRecord[]): ChatAnswer {
  const zh = isZh(locale);
  const pair =
    mentioned.length >= 2
      ? mentioned.slice(0, 2)
      : [
          mentioned[0],
          ...lps
            .filter((x) => x.id !== mentioned[0].id && x.category === mentioned[0].category)
            .slice(0, 1),
        ].filter(Boolean);

  if (pair.length < 2) {
    return {
      intent: "clarify",
      understoodAs: zh ? "你想对比 LP，但只识别到一家。" : "You want a comparison, but only one LP was identified.",
      sections: [
        {
          paragraphs: [
            zh
              ? `已识别：${mentioned[0]?.name ?? "—"}。请再写明另一家名称（例如 “iSPrime vs Finalto”）。`
              : `Identified: ${mentioned[0]?.name ?? "—"}. Name the second LP (e.g. “iSPrime vs Finalto”).`,
          ],
        },
      ],
      sources: internalSources(locale),
    };
  }

  const [a, b] = pair as [LpRecord, LpRecord];
  const la = localizedLpLists(a, locale);
  const lb = localizedLpLists(b, locale);

  return {
    intent: "compare",
    understoodAs: zh
      ? `你在对比 ${a.name} 与 ${b.name}。`
      : `You are comparing ${a.name} and ${b.name}.`,
    sections: [
      {
        heading: zh ? "并排要点" : "Side-by-side",
        bullets: [
          zh
            ? `${a.name}：定价 ${a.pricingQuality}/5，成本 ${a.costTier}，时段 ${a.hours}，Vantage ${a.usedByVantage ? "在用" : "否"}`
            : `${a.name}: pricing ${a.pricingQuality}/5, cost ${a.costTier}, hours ${a.hours}, Vantage ${a.usedByVantage ? "used" : "no"}`,
          zh
            ? `${b.name}：定价 ${b.pricingQuality}/5，成本 ${b.costTier}，时段 ${b.hours}，Vantage ${b.usedByVantage ? "在用" : "否"}`
            : `${b.name}: pricing ${b.pricingQuality}/5, cost ${b.costTier}, hours ${b.hours}, Vantage ${b.usedByVantage ? "used" : "no"}`,
          zh
            ? `${a.name} 擅长：${la.bestFor.slice(0, 3).join("、")}`
            : `${a.name} best for: ${la.bestFor.slice(0, 3).join(", ")}`,
          zh
            ? `${b.name} 擅长：${lb.bestFor.slice(0, 3).join("、")}`
            : `${b.name} best for: ${lb.bestFor.slice(0, 3).join(", ")}`,
        ],
      },
      {
        heading: zh ? "如何裁定" : "How to decide",
        bullets: zh
          ? [
              "同品种做真实行情影子测试，比较稳定性与延迟",
              "再用小额实盘比较 Fill / Slippage / Last Look",
              "UAT 只能证明接口，不能代替上述两步",
            ]
          : [
              "Run live quote shadow on the same symbol for stability/latency",
              "Then small live fills for fill / slippage / last look",
              "UAT only proves connectivity — it does not replace those steps",
            ],
      },
    ],
    sources: uniqSources([
      ...(a.website ? [{ title: a.name, url: a.website }] : []),
      ...(b.website ? [{ title: b.name, url: b.website }] : []),
      ...internalSources(locale),
      ...guideSources("AMTS", "Equidity"),
    ]),
  };
}

function answerRegion(locale: Locale, lps: LpRecord[], question: string): ChatAnswer {
  const zh = isZh(locale);
  const codeMatch = question.match(/\b(UK|EU|US|SG|AU|AE|JP|HK|CY|ZA|DK|GI|CA|ASIA|GLOBAL)\b/i);
  const code = codeMatch?.[1]?.toUpperCase();

  const withRegions = lps.map((lp) => ({
    lp,
    regions: resolveOptimalRegions(lp.slug, lp.optimalRegions),
  }));
  const filtered = code
    ? withRegions.filter((x) => x.regions.includes(code as never))
    : withRegions.slice(0, 8);

  const bullets = filtered.slice(0, 10).map(({ lp, regions }) => {
    const chips = regions.map((c) => `${REGION_META[c].flag} ${regionLabel(c, locale)}`).join(" ");
    return `${lp.name}: ${chips}`;
  });

  return {
    intent: "region",
    understoodAs: zh
      ? code
        ? `你在问最优区域含 ${code} 的 LP。`
        : "你在问各 LP 的最优区域旗标。"
      : code
        ? `You are asking which LPs list optimal region ${code}.`
        : "You are asking about LP optimal region flags.",
    sections: [
      {
        heading: zh ? "最优区域（桌面适配，非牌照足迹）" : "Optimal regions (desk fit, not licence footprint)",
        bullets:
          bullets.length > 0
            ? bullets
            : [
                zh
                  ? `未找到最优区域含 ${code} 的 LP。`
                  : `No LPs found with optimal region ${code}.`,
              ],
      },
    ],
    sources: uniqSources([...internalSources(locale), ...guideSources("Equidity")]),
  };
}

function answerVantage(locale: Locale, lps: LpRecord[]): ChatAnswer {
  const zh = isZh(locale);
  const used = lps.filter((lp) => lp.usedByVantage);
  const trad = used.filter((lp) => lp.category !== "crypto");
  const crypto = used.filter((lp) => lp.category === "crypto");

  return {
    intent: "vantage",
    understoodAs: zh
      ? "你在问 Vantage 仓库中已标记在用的 LP。"
      : "You are asking which LPs are marked used by Vantage in the repository.",
    sections: [
      {
        heading: zh ? "传统 / 混合" : "Traditional / hybrid",
        bullets: trad.map((lp) => lp.name),
      },
      {
        heading: zh ? "加密" : "Crypto",
        bullets: crypto.map((lp) => lp.name),
      },
    ],
    sources: uniqSources([
      { title: zh ? "LP 仓库" : "LP Repository", url: "/repository" },
      ...internalSources(locale),
    ]),
  };
}

function answerClarify(locale: Locale, question: string): ChatAnswer {
  const zh = isZh(locale);
  return {
    intent: "clarify",
    understoodAs: zh
      ? "问题不够具体，需要你补充意图。"
      : "The question needs a clearer intent.",
    sections: [
      {
        paragraphs: [
          zh
            ? `收到：「${question.slice(0, 120) || "（空）"}」。你可以这样问：`
            : `Got: “${question.slice(0, 120) || "(empty)"}”. Try asking:`,
        ],
        bullets: zh
          ? [
              "“XAUUSD 推荐哪些 LP？”",
              "“iSPrime 适合什么？最优区域？”",
              "“新商品上线怎么测报价质量？”",
              "“Finalto vs CMC 怎么比？”",
            ]
          : [
              "“Which LPs for XAUUSD?”",
              "“What is iSPrime best for / optimal regions?”",
              "“How should we test quote quality for a new product?”",
              "“Compare Finalto vs CMC”",
            ],
      },
    ],
    sources: internalSources(locale),
  };
}

function answerGeneral(
  locale: Locale,
  lps: LpRecord[],
  question: string,
  selection: string,
): ChatAnswer {
  const zh = isZh(locale);
  const vantage = lps.filter((lp) => lp.usedByVantage).length;

  // If selection looks substantive, summarise how to use it
  if (selection.trim().length > 40) {
    return {
      intent: "general",
      understoodAs: zh
        ? "你结合选中文本在提问；我按 LP 研究语境回答。"
        : "You asked with a text selection; answering in the LP-research context.",
      sections: [
        {
          paragraphs: [
            zh
              ? `选中：「${selection.slice(0, 200)}${selection.length > 200 ? "…" : ""}」`
              : `Selection: “${selection.slice(0, 200)}${selection.length > 200 ? "…" : ""}”`,
            zh
              ? `问题：「${question}」。若这是测试/方法论问题，请明确说“怎么测”；若是某家 LP，直接写出名称；若是品种，写出如 XAUUSD。`
              : `Question: “${question}”. If this is about testing, say “how do we test”; if about an LP, name it; if about a product, give a symbol like XAUUSD.`,
          ],
        },
        {
          heading: zh ? "可立即使用的入口" : "Useful entry points",
          bullets: [
            zh ? "LP 测试 → 最终方法论" : "LP Testing → Final methodology",
            zh ? "首页扫描产品或 LP 名" : "Home: scan a product or LP name",
            zh ? "知识库查看完整画像" : "Knowledge Base for full profiles",
          ],
        },
      ],
      sources: uniqSources([...internalSources(locale), ...guideSources("Equidity", "AMTS")]),
    };
  }

  return {
    intent: "general",
    understoodAs: zh
      ? "你在问 LP Scanner 的一般用法。"
      : "You are asking a general LP Scanner question.",
    sections: [
      {
        paragraphs: [
          zh
            ? `仓库现有 ${lps.length} 家 LP（${vantage} 家标记 Vantage 在用）。问题：「${question.slice(0, 160)}」。`
            : `Repository holds ${lps.length} LPs (${vantage} marked used by Vantage). Question: “${question.slice(0, 160)}”.`,
        ],
        bullets: zh
          ? [
              "查品种：输入 XAUUSD / BTCUSD 等",
              "查 LP：输入 Finalto、iSPrime…",
              "查测试方法：问“报价质量怎么测”或打开 /testing",
            ]
          : [
              "Product: ask about XAUUSD / BTCUSD etc.",
              "LP: ask about Finalto, iSPrime…",
              "Testing: ask “how do we test quote quality” or open /testing",
            ],
      },
    ],
    sources: uniqSources([...internalSources(locale), ...guideSources("Equidity")]),
  };
}

/** Build a structured, sourced assistant answer from question + optional selection. */
export function buildChatAnswer(
  question: string,
  selection: string,
  lps: LpRecord[],
  locale: Locale,
): ChatAnswer {
  const q = question.trim();
  const sel = selection.trim();
  const intent = classifyIntent(q, sel, lps);
  const mentioned = findMentionedLps(`${q} ${sel}`, lps);
  const product = extractProduct(q, sel);

  switch (intent) {
    case "methodology":
      return answerMethodology(locale, q, sel);
    case "product":
      return answerProduct(locale, lps, product || q, q);
    case "compare":
      return answerCompare(locale, lps, mentioned);
    case "lp":
      return answerLp(locale, mentioned[0]!, sel);
    case "region":
      return answerRegion(locale, lps, `${q} ${sel}`);
    case "vantage":
      return answerVantage(locale, lps);
    case "clarify":
      return answerClarify(locale, q);
    default:
      return answerGeneral(locale, lps, q, sel);
  }
}

/** Flatten structured answer to plain text (API/log fallback). */
export function formatChatAnswerText(answer: ChatAnswer, locale: Locale): string {
  const zh = isZh(locale);
  const lines: string[] = [];
  lines.push(zh ? `理解：${answer.understoodAs}` : `Understood: ${answer.understoodAs}`);
  lines.push("");
  for (const s of answer.sections) {
    if (s.heading) lines.push(s.heading);
    for (const p of s.paragraphs ?? []) lines.push(p);
    for (const b of s.bullets ?? []) lines.push(`• ${b}`);
    lines.push("");
  }
  if (answer.sources.length) {
    lines.push(zh ? "来源：" : "Sources:");
    for (const src of answer.sources) lines.push(`- ${src.title}: ${src.url}`);
  }
  if (answer.disclaimer) {
    lines.push("");
    lines.push(answer.disclaimer);
  }
  return lines.join("\n").trim();
}

/** @deprecated Prefer buildChatAnswer; kept for simple string callers. */
export function answerChat(
  question: string,
  contextText: string,
  lps: LpRecord[],
  locale: Locale,
): string {
  return formatChatAnswerText(buildChatAnswer(question, contextText, lps, locale), locale);
}
