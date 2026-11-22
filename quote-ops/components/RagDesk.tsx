"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { HomeAdminStrip } from "@/components/HomeAdminStrip";
import { HomeKnowledgeComposer } from "@/components/HomeKnowledgeComposer";
import { LarkImportPanel } from "@/components/LarkImportPanel";
import { ProductSwitcher } from "@/components/ProductSwitcher";
import { useI18n } from "@/lib/i18n/context";
import {
  PRODUCTS,
  queryConflictsWithProduct,
  type ProductId,
} from "@/lib/kb/products";
import { useProduct } from "@/lib/product/context";
import type { RagAnswer } from "@/lib/rag";

const EXAMPLES: Record<ProductId, { zh: string[]; en: string[] }> = {
  "cfd-broker": {
    zh: [
      "旧价成交怎么排查？",
      "LP 到 PE 到 MT 全流程",
      "定价 Tick 库访问地址",
      "Latency Arbitrage 如何检测",
      "Stop-out 漏洞 RCA 步骤",
      "如何区分 Healthy 和 Abusive",
    ],
    en: [
      "How to RCA a stale quote fill?",
      "LP → PE → MT pricing flow",
      "Quote tick store access host",
      "Detect latency arbitrage",
      "Stop-out gap RCA steps",
      "Healthy vs Abusive with markout",
    ],
  },
  "v-exchange-perp": {
    zh: [
      "外部 Funding 偏差超过 0.1% 怎么查？",
      "Mark Price 与 Index 偏离排查",
      "永续合约 Index 与友商偏离",
      "DB 接仓失败 / ADL 异常",
      "资金费率为正是什么意思？",
      "周末黄金 Index 异常案例",
    ],
    en: [
      "Investigate external Funding drift >0.1%",
      "Mark vs Index divergence RCA",
      "Perp Index vs peer exchange drift",
      "DB takeover / ADL failure",
      "What does positive funding mean?",
      "Weekend gold Index incident",
    ],
  },
};

export function RagDesk() {
  const { locale, t } = useI18n();
  const { product, setProduct, def } = useProduct();
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<RagAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoSwitched, setAutoSwitched] = useState<ProductId | null>(null);
  const skipProductReset = useRef(false);

  const typedConflict = useMemo(
    () => queryConflictsWithProduct(q, product),
    [q, product],
  );

  useEffect(() => {
    if (skipProductReset.current) {
      skipProductReset.current = false;
      return;
    }
    setAnswer(null);
    setAutoSwitched(null);
    setError(null);
  }, [product]);

  async function ask(text?: string, productOverride?: ProductId) {
    const question = (text ?? q).trim();
    if (!question) return;

    const conflict = queryConflictsWithProduct(question, productOverride ?? product);
    const scope = productOverride ?? (conflict ?? product);
    if (scope !== product) {
      skipProductReset.current = true;
      setProduct(scope);
      setAutoSwitched(scope);
    } else {
      setAutoSwitched(null);
    }

    setQ(question);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/rag", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question, locale, product: scope }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as RagAnswer;
      setAnswer(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "request failed");
    } finally {
      setLoading(false);
    }
  }

  const examples = locale === "zh-CN" ? EXAMPLES[product].zh : EXAMPLES[product].en;
  const isPerp = product === "v-exchange-perp";

  return (
    <div className="space-y-8">
      <section
        className={`relative overflow-hidden rounded-2xl border border-ink/10 text-paper animate-rise ${
          isPerp ? "bg-[#0a1f1c]" : "bg-ink"
        }`}
      >
        <div className="grid-noise absolute inset-0 opacity-40" />
        <div
          className={`pointer-events-none absolute inset-0 opacity-50 ${
            isPerp
              ? "bg-[radial-gradient(ellipse_at_20%_20%,rgba(45,212,191,0.22),transparent_55%)]"
              : "bg-[radial-gradient(ellipse_at_80%_10%,rgba(180,120,60,0.2),transparent_50%)]"
          }`}
        />
        <div className="relative px-4 py-8 sm:px-10 sm:py-14">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="hidden sm:block">
              <ProductSwitcher variant="dark" />
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper/50">
              {isPerp ? "XAUUSD · Perp Exchange" : "CFD · Pricing Squad"}
            </span>
          </div>
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-sea-soft/80 sm:text-xs">
            {locale === "zh-CN" ? def.brandZh : def.brandEn}
          </p>
          <h1 className="font-display text-3xl leading-tight sm:text-5xl">
            {locale === "zh-CN" ? def.titleZh : def.titleEn}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-paper/75 sm:mt-4 sm:text-lg">
            {locale === "zh-CN" ? def.taglineZh : def.taglineEn}
          </p>
          <p className="mt-2 max-w-2xl text-xs text-paper/45">
            {t(
              "两条产品线知识库完全隔离：CFD Pricing ≠ V Exchange 永续。键入时按关键词提示切换；提交时若明显跨线会自动切到正确库再检索。",
              "Two isolated corpora: CFD Pricing ≠ V Exchange Knowledge Base. Typing shows switch hints; submit auto-routes clear cross-product queries.",
            )}
          </p>

          <div
            className={`mt-5 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] ${
              isPerp
                ? "border-teal-400/40 bg-teal-500/15 text-teal-100"
                : "border-copper/40 bg-copper/20 text-amber-100"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${isPerp ? "bg-teal-300" : "bg-amber-300"}`}
            />
            {locale === "zh-CN" ? def.scopeZh : def.scopeEn}
          </div>

          <form
            className="mt-4 flex max-w-3xl flex-col gap-2 sm:mt-6 sm:flex-row sm:gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              void ask();
            }}
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={
                isPerp
                  ? t(
                      "输入永续告警、Funding / Mark / Index、接仓排查关键词…",
                      "Ask perp alerts, Funding / Mark / Index, takeover RCA…",
                    )
                  : t(
                      "输入 CFD 定价问题、风险场景或排查关键词…",
                      "Ask CFD pricing RCA, risks, or skills…",
                    )
              }
              className={`min-h-12 flex-1 rounded-lg border bg-white/10 px-4 py-3 text-base text-paper outline-none placeholder:text-paper/40 focus:ring-2 sm:text-sm ${
                typedConflict
                  ? "border-amber-300/50 ring-1 ring-amber-300/40 focus:ring-amber-300"
                  : "border-white/15 ring-sea focus:ring-sea"
              }`}
            />
            <button
              type="submit"
              disabled={loading}
              className={`min-h-12 rounded-lg px-5 py-3 text-sm font-medium text-white touch-manipulation transition disabled:opacity-60 ${
                isPerp ? "bg-teal-600 hover:bg-teal-500" : "bg-copper hover:bg-copper/90"
              }`}
            >
              {loading ? t("检索中…", "Retrieving…") : t("检索回答", "Ask RAG")}
            </button>
          </form>

          {typedConflict && (
            <div className="mt-3 max-w-3xl rounded-lg border border-amber-300/40 bg-amber-400/10 px-3 py-2.5 text-xs text-amber-50">
              <p>
                {t(
                  `当前在「${def.switchZh}」，但关键词更像「${PRODUCTS[typedConflict].switchZh}」——两库不互通。`,
                  `You are in “${def.switchEn}”, but tokens look like “${PRODUCTS[typedConflict].switchEn}” — corpora do not mix.`,
                )}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setProduct(typedConflict);
                  }}
                  className="rounded-md border border-amber-200/40 bg-black/20 px-2.5 py-1.5 touch-manipulation hover:bg-black/30"
                >
                  {t(
                    `仅切换到 ${PRODUCTS[typedConflict].switchZh}`,
                    `Switch only to ${PRODUCTS[typedConflict].switchEn}`,
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => void ask(q, typedConflict)}
                  className="rounded-md bg-amber-200 px-2.5 py-1.5 font-medium text-ink touch-manipulation hover:bg-amber-100"
                >
                  {t(
                    `切换到 ${PRODUCTS[typedConflict].switchZh} 并检索`,
                    `Switch to ${PRODUCTS[typedConflict].switchEn} & search`,
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="chip-scroll mt-4 sm:flex-wrap">
            {examples.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => void ask(ex)}
                className="shrink-0 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs text-paper/80 touch-manipulation hover:bg-white/10"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </section>

      <HomeKnowledgeComposer />
      <LarkImportPanel />
      <HomeAdminStrip />

      {error && (
        <p className="rounded-lg border border-danger/30 bg-red-50 px-4 py-3 text-sm text-danger">{error}</p>
      )}

      {answer && (
        <section className="animate-rise space-y-4 rounded-2xl border border-line bg-white/80 p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-md border px-2 py-0.5 text-[10px] uppercase tracking-wide ${
                answer.product === "v-exchange-perp"
                  ? "border-teal-600/30 bg-teal-50 text-teal-800"
                  : "border-copper/30 bg-copper-soft/40 text-copper"
              }`}
            >
              {locale === "zh-CN"
                ? PRODUCTS[answer.product].switchZh
                : PRODUCTS[answer.product].switchEn}
            </span>
            {autoSwitched && (
              <span className="rounded-md border border-amber-300/50 bg-amber-50 px-2 py-0.5 text-[10px] text-amber-800">
                {t(
                  `已按关键词自动切换至 ${PRODUCTS[autoSwitched].switchZh}`,
                  `Auto-switched to ${PRODUCTS[autoSwitched].switchEn} from query tokens`,
                )}
              </span>
            )}
            {answer.productHint && (
              <button
                type="button"
                onClick={() => void ask(q, answer.productHint!)}
                className="text-xs text-amber-700 underline"
              >
                {t(
                  `改在 ${PRODUCTS[answer.productHint].switchZh} 重检索`,
                  `Re-search in ${PRODUCTS[answer.productHint].switchEn}`,
                )}
              </button>
            )}
          </div>
          <p className="text-sm text-mist">{answer.understoodAs}</p>
          <h2 className="font-display text-2xl text-ink">{answer.summary}</h2>
          {answer.sections.map((sec) => (
            <div key={sec.heading} className="border-t border-line/70 pt-4">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-sea">{sec.heading}</h3>
              {sec.paragraphs?.map((p) => (
                <p key={p.slice(0, 40)} className="mb-2 text-sm leading-relaxed text-ink-2">
                  {p}
                </p>
              ))}
              {sec.bullets && (
                <ul className="space-y-1.5 text-sm text-ink-2">
                  {sec.bullets.map((b) => (
                    <li key={b} className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-copper" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          <div className="flex flex-wrap gap-2 border-t border-line/70 pt-4">
            {answer.suggestedSkills.map((s) => (
              <Link
                key={s.slug}
                href={`/kb/${s.slug}`}
                className="rounded-md border border-sea/30 bg-sea-soft/40 px-3 py-1.5 text-xs text-sea hover:bg-sea-soft"
              >
                Skill · {s.title}
              </Link>
            ))}
            {answer.suggestedRisks.map((r) => (
              <Link
                key={r.id}
                href={r.id ? `/risks/${r.id}` : "/risks"}
                className="rounded-md border border-line bg-paper px-3 py-1.5 text-xs text-ink-2 hover:border-ink/30"
              >
                #{r.id} {r.title}
              </Link>
            ))}
            {answer.hits[0] && (
              <Link
                href={answer.hits[0].chunk.href}
                className="rounded-md border border-copper/30 bg-copper-soft/50 px-3 py-1.5 text-xs text-copper"
              >
                {t("打开最相关文档", "Open top document")}
              </Link>
            )}
            <Link
              href="/admin"
              className="rounded-md border border-line bg-white px-3 py-1.5 text-xs text-mist hover:border-ink/30"
            >
              {t("管理员编辑知识", "Admin edit KB")}
            </Link>
            <Link
              href="/tree"
              className="rounded-md border border-line bg-white px-3 py-1.5 text-xs text-mist hover:border-ink/30"
            >
              {t("知识树", "Knowledge tree")}
            </Link>
          </div>
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(isPerp
          ? [
              {
                href: "/tree",
                title: t("永续知识树", "Perp knowledge tree"),
                body: t("告警 / 定价 / Runbook / DB 做市分区", "Alarms / pricing / runbooks / DB MM"),
              },
              {
                href: "/kb/ve-alarm-catalog",
                title: t("告警目录", "Alarm catalog"),
                body: t("阈值、频率、配置冲突标注", "Thresholds, cadence, config conflicts"),
              },
              {
                href: "/kb/ve-pricing-engine",
                title: t("定价引擎", "Pricing engine"),
                body: t("Index / Premium / Funding / Mark", "Index / Premium / Funding / Mark"),
              },
              {
                href: "/kb/ve-principles",
                title: t("风控原则", "Risk principles"),
                body: t("证据分级 · AI 只读限制", "Evidence grades · AI read-only limits"),
              },
            ]
          : [
              {
                href: "/tree",
                title: t("CFD 知识树", "CFD knowledge tree"),
                body: t("动态节点关系，便于观察分类与从属", "Live node relations across the catalog"),
              },
              {
                href: "/pipeline",
                title: t("定价全流程", "Pricing pipeline"),
                body: t("LP → Ingest → PE → 分发 → MT → 对冲 → RCA", "LP → Ingest → PE → Fan-out → MT → Hedge → RCA"),
              },
              {
                href: "/risks",
                title: t("86 风险场景", "86 risk scenarios"),
                body: t("H/T/A/M 分类 · 频率 · 严重度 · 检测与防控", "H/T/A/M · frequency · severity · detect & prevent"),
              },
              {
                href: "/admin",
                title: t("管理台", "Admin"),
                body: t("新增 / 编辑 / 删除 / 检索排序 / 发布双语", "Create / edit / delete / search-sort / bilingual publish"),
              },
            ]
        ).map((card, i) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-xl border border-line bg-white/70 p-5 transition hover:border-sea/40 hover:bg-white animate-rise"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <h3 className="font-display text-xl text-ink group-hover:text-sea">{card.title}</h3>
            <p className="mt-2 text-sm text-mist">{card.body}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
