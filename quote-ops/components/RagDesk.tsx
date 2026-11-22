"use client";

import Link from "next/link";
import { useState } from "react";
import { HomeAdminStrip } from "@/components/HomeAdminStrip";
import { HomeKnowledgeComposer } from "@/components/HomeKnowledgeComposer";
import { LarkImportPanel } from "@/components/LarkImportPanel";
import { useI18n } from "@/lib/i18n/context";
import type { RagAnswer } from "@/lib/rag";

const EXAMPLES_ZH = [
  "旧价成交怎么排查？",
  "LP 到 PE 到 MT 全流程",
  "Quote Tick 库访问地址",
  "Latency Arbitrage 如何检测",
  "强平漏洞 RCA 步骤",
  "如何区分 Healthy 和 Abusive",
];

const EXAMPLES_EN = [
  "How to RCA a stale quote fill?",
  "LP → PE → MT pricing flow",
  "Quote tick store access host",
  "Detect latency arbitrage",
  "Stop-out gap RCA steps",
  "Healthy vs Abusive with markout",
];

export function RagDesk() {
  const { locale, t } = useI18n();
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<RagAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function ask(text?: string) {
    const question = (text ?? q).trim();
    if (!question) return;
    setQ(question);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/rag", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question, locale }),
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

  const examples = locale === "zh-CN" ? EXAMPLES_ZH : EXAMPLES_EN;

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl border border-ink/10 bg-ink text-paper animate-rise">
        <div className="grid-noise absolute inset-0 opacity-40" />
        <div className="relative px-4 py-8 sm:px-10 sm:py-14">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-sea-soft/80 sm:text-xs">
            CFD Broker · Pricing Squad
          </p>
          <h1 className="font-display text-3xl leading-tight sm:text-5xl">QuoteOps</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-paper/75 sm:mt-4 sm:text-lg">
            {t(
              "交互式 RAG 知识库与 Skill 库：86 风险场景、LP→PE→MT 报价链路、数据架构占位、报价问题排查与修复流程。",
              "Interactive RAG KB + skill library: 86 risk scenarios, LP→PE→MT pipeline, data architecture placeholders, pricing RCA playbooks.",
            )}
          </p>
          <form
            className="mt-6 flex max-w-3xl flex-col gap-2 sm:mt-8 sm:flex-row sm:gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              void ask();
            }}
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("输入报价问题、风险场景或排查关键词…", "Ask about pricing RCA, risks, or skills…")}
              className="min-h-12 flex-1 rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-base text-paper outline-none ring-sea placeholder:text-paper/40 focus:ring-2 sm:text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="min-h-12 rounded-lg bg-copper px-5 py-3 text-sm font-medium text-white touch-manipulation transition hover:bg-copper/90 disabled:opacity-60"
            >
              {loading ? t("检索中…", "Retrieving…") : t("检索回答", "Ask RAG")}
            </button>
          </form>
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
        {[
          {
            href: "/tree",
            title: t("知识树", "Knowledge tree"),
            body: t("动态节点关系，便于观察分类与从属", "Live node relations across the catalog"),
          },
          {
            href: "/pipeline",
            title: t("报价全流程", "Quote pipeline"),
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
        ].map((card, i) => (
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
