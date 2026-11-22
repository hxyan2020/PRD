import { buildCorpusAsync } from "@/lib/corpus";
import {
  DEFAULT_PRODUCT,
  PRODUCTS,
  inferProductFromQuery,
  type ProductId,
} from "@/lib/kb/products";
import type { KnowledgeChunk } from "@/lib/types";

export type Locale = "zh-CN" | "en";

export type RagHit = {
  chunk: KnowledgeChunk;
  score: number;
  snippet: string;
};

export type RagAnswer = {
  understoodAs: string;
  summary: string;
  sections: { heading: string; paragraphs?: string[]; bullets?: string[] }[];
  hits: RagHit[];
  suggestedSkills: { slug: string; title: string }[];
  suggestedRisks: { id: number; title: string }[];
  product: ProductId;
  productHint?: ProductId | null;
};

const STOP = new Set([
  "the", "a", "an", "and", "or", "of", "to", "in", "for", "on", "is", "are", "be", "with",
  "how", "what", "when", "which", "this", "that", "的", "了", "和", "是", "在", "与", "及",
  "一个", "什么", "如何", "怎么",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[#/→\-_:.,;()[\]{}'"!?]/g, " ")
    .split(/\s+/)
    .flatMap((t) => {
      if (/[\u4e00-\u9fff]/.test(t)) {
        const chars = [...t];
        const grams: string[] = [t];
        for (let i = 0; i < chars.length - 1; i++) grams.push(chars[i] + chars[i + 1]);
        return grams;
      }
      return [t];
    })
    .filter((t) => t.length >= 2 && !STOP.has(t));
}

function chunkText(chunk: KnowledgeChunk, locale: Locale): string {
  const title = locale === "zh-CN" ? chunk.titleZh : chunk.title;
  const body = locale === "zh-CN" ? chunk.bodyZh : chunk.body;
  return `${title}\n${body}\n${chunk.tags.join(" ")}`;
}

function scoreChunk(queryTokens: string[], chunk: KnowledgeChunk, locale: Locale): number {
  if (queryTokens.length === 0) return 0;
  const text = chunkText(chunk, locale);
  const lower = text.toLowerCase();
  const docTokens = tokenize(text);
  const tf = new Map<string, number>();
  for (const t of docTokens) tf.set(t, (tf.get(t) ?? 0) + 1);

  let score = 0;
  for (const q of queryTokens) {
    const c = tf.get(q) ?? 0;
    if (c > 0) score += 1 + Math.log(1 + c);
    if (lower.includes(q)) score += 0.35;
  }

  const qjoin = queryTokens.join(" ");
  if (/stale|旧价|ttl|quote.?age/.test(qjoin) && chunk.kind === "skill") score += 1.5;
  if (/pipeline|lp|pe|mt|链路|流程|聚合/.test(qjoin) && chunk.kind === "pipeline") score += 1.2;
  if (/database|db|库|clickhouse|host|访问|地址/.test(qjoin) && chunk.kind === "database")
    score += 1.2;
  if (/skill|排查|rca|playbook|技能|手册/.test(qjoin) && chunk.kind === "skill") score += 1.0;
  if (/risk|套利|攻击|abuse|场景|latency|markout/.test(qjoin) && chunk.kind === "risk") score += 0.8;

  const title = (locale === "zh-CN" ? chunk.titleZh : chunk.title).toLowerCase();
  for (const q of queryTokens) {
    if (title.includes(q)) score += 1.8;
  }
  return score;
}

function snippetFrom(chunk: KnowledgeChunk, locale: Locale, max = 220): string {
  const body = locale === "zh-CN" ? chunk.bodyZh : chunk.body;
  const flat = body.replace(/\s+/g, " ").trim();
  return flat.length <= max ? flat : `${flat.slice(0, max)}…`;
}

function detectLocale(question: string, preferred?: Locale): Locale {
  if (preferred) return preferred;
  return /[\u4e00-\u9fff]/.test(question) ? "zh-CN" : "en";
}

export async function retrieve(
  question: string,
  localePref?: Locale,
  limit = 8,
  product: ProductId = DEFAULT_PRODUCT,
): Promise<RagHit[]> {
  const locale = detectLocale(question, localePref);
  const tokens = tokenize(question);
  const corpus = await buildCorpusAsync(product);
  return corpus
    .map((chunk) => ({
      chunk,
      score: scoreChunk(tokens, chunk, locale),
      snippet: snippetFrom(chunk, locale),
    }))
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export async function answerQuestion(
  question: string,
  localePref?: Locale,
  productPref?: ProductId,
): Promise<RagAnswer> {
  const locale = detectLocale(question, localePref);
  const zh = locale === "zh-CN";
  const q = question.trim();
  const inferred = inferProductFromQuery(q);
  const product = productPref ?? inferred ?? DEFAULT_PRODUCT;
  const productHint =
    productPref && inferred && inferred !== productPref ? inferred : null;
  const hits = await retrieve(q, locale, 8, product);
  const productDef = PRODUCTS[product];

  const riskHits = hits.filter((h) => h.chunk.kind === "risk").slice(0, 5);
  const skillHits = hits.filter((h) => h.chunk.kind === "skill").slice(0, 4);

  const suggestedRisks = riskHits.map((h) => {
    const m = h.chunk.id.match(/risk-(\d+)/) || h.chunk.title.match(/#(\d+)/);
    const id = m ? Number(m[1]) : 0;
    return { id, title: zh ? h.chunk.titleZh : h.chunk.title };
  });

  const suggestedSkills = skillHits.map((h) => {
    const slug = h.chunk.href.split("/").pop() ?? h.chunk.id;
    return { slug, title: zh ? h.chunk.titleZh : h.chunk.title };
  });

  const top = hits[0];
  const sections: RagAnswer["sections"] = [];

  if (!top) {
    const emptyHint =
      product === "v-exchange-perp"
        ? zh
          ? "请尝试：Funding 偏差、Mark vs Index、Index Fallback、DB 接仓、ADL、强平对账等关键词。"
          : "Try Funding drift, Mark vs Index, Index Fallback, DB takeover, ADL, liquidation recon."
        : zh
          ? "请尝试：旧价 RCA、LP→PE→MT、Quote Tick 库、Latency Arbitrage、强平 RCA 等关键词。"
          : "Try keywords like stale quote RCA, LP→PE→MT, quote tick store, latency arb, stop-out RCA.";
    return {
      understoodAs: zh ? `未检索到与「${q}」匹配的语料。` : `No corpus match for “${q}”.`,
      summary: emptyHint,
      sections: productHint
        ? [
            {
              heading: zh ? "产品线提示" : "Product hint",
              paragraphs: [
                zh
                  ? `当前检索范围是「${productDef.shortZh}」。问题更像「${PRODUCTS[productHint].shortZh}」——可切换产品线后再问。`
                  : `Scoped to “${productDef.shortEn}”. Query looks more like “${PRODUCTS[productHint].shortEn}” — switch product line and retry.`,
              ],
            },
          ]
        : [],
      hits: [],
      suggestedSkills: [],
      suggestedRisks: [],
      product,
      productHint,
    };
  }

  sections.push({
    heading: zh ? "检索摘要" : "Retrieved summary",
    paragraphs: [top.snippet],
    bullets: hits.slice(0, 5).map(
      (h) => `${zh ? h.chunk.titleZh : h.chunk.title} · score ${h.score.toFixed(2)}`,
    ),
  });

  if (suggestedSkills.length) {
    sections.push({
      heading: zh ? "建议 Skills" : "Suggested skills",
      bullets: suggestedSkills.map((s) => `${s.title} (/kb/${s.slug})`),
    });
  }

  if (suggestedRisks.length) {
    sections.push({
      heading: zh ? "相关风险场景" : "Related risk scenarios",
      bullets: suggestedRisks.map((r) => (r.id ? `#${r.id} ${r.title}` : r.title)),
    });
  }

  if (productHint) {
    sections.unshift({
      heading: zh ? "产品线提示" : "Product hint",
      paragraphs: [
        zh
          ? `当前范围「${productDef.shortZh}」。关键词更像「${PRODUCTS[productHint].shortZh}」——两产品线语料已隔离，切换后再检索更准。`
          : `Scoped to “${productDef.shortEn}”. Tokens look more like “${PRODUCTS[productHint].shortEn}” — corpora are isolated; switch product line for better hits.`,
      ],
    });
  }

  if (product === "cfd-broker" && /旧价|stale|quote.?age|ttl/i.test(q)) {
    sections.push({
      heading: zh ? "处置原则" : "Disposition principle",
      paragraphs: [
        zh
          ? "先证明成交时 Quote 是否失效，再谈客户分类。正向 Markout 本身不等于 Abuse。"
          : "Prove whether the quote was invalid at fill before classifying the client. Positive markout alone is not Abuse.",
      ],
    });
  }

  if (product === "cfd-broker" && /数据库|database|host|访问地址|clickhouse|grafana/i.test(q)) {
    sections.push({
      heading: zh ? "访问说明" : "Access note",
      paragraphs: [
        zh
          ? "当前库地址均为 *.placeholder.internal，请替换为 Vantage 资产清单；切勿把真实密钥写入知识库。"
          : "Hosts are *.placeholder.internal — replace from Vantage inventory; never commit real secrets into the KB.",
      ],
    });
  }

  if (product === "v-exchange-perp") {
    sections.push({
      heading: zh ? "永续风控原则" : "Perp risk principle",
      paragraphs: [
        zh
          ? "AI 只读：不得改生产参数、切价格源、停盘、注资、强平、ADL、强制成交或改账本。历史阈值须标注 [OBS]/[DESIGN]/[TBC]。"
          : "AI is read-only: no prod param changes, source switches, halt, funding inject, liquidation, ADL, force trade, or ledger edits. Label historic thresholds [OBS]/[DESIGN]/[TBC].",
      ],
    });
  }

  return {
    understoodAs: zh
      ? `你在问：${q}。已在「${productDef.shortZh}」知识库检索。`
      : `You asked: ${q}. Retrieved within “${productDef.shortEn}” corpus.`,
    summary: zh
      ? `最相关：${top.chunk.titleZh}（${top.chunk.kind}）。共 ${hits.length} 条命中 · ${productDef.brandZh}。`
      : `Top hit: ${top.chunk.title} (${top.chunk.kind}). ${hits.length} hits · ${productDef.brandEn}.`,
    sections,
    hits,
    suggestedSkills,
    suggestedRisks,
    product,
    productHint,
  };
}
