"use client";

import { useEffect, useRef, useState } from "react";
import { LpLogo } from "@/components/LpLogo";
import { QualityLpCardList } from "@/components/QualityLpCardList";
import { QualityStepBody } from "@/components/QualityStepBody";
import { QuotingStrategyPanel } from "@/components/QuotingStrategyPanel";
import { useI18n } from "@/lib/i18n/context";
import { isZh } from "@/lib/i18n/locale";
import type { QualityLpCard } from "@/lib/quality-lp-cards";
import type { QuotingStrategy } from "@/lib/quoting-strategy";
import {
  scoreBandLabel,
  type QualityReport,
  type QualityStep,
  type ScoreBand,
} from "@/lib/quality-research";
import type { Locale } from "@/lib/types";

type Props = {
  mode: "product" | "lp";
  query: string;
  lpId?: string;
  /** When running LP mode from a product scan, keep product context for RYG scores. */
  product?: string;
  autoStart?: boolean;
  onClose?: () => void;
};

function bandClass(band: ScoreBand): string {
  if (band === "green") return "bg-emerald-100 text-emerald-800 border-emerald-300";
  if (band === "yellow") return "bg-amber-soft text-amber border-amber/40";
  return "bg-rose-100 text-rose-800 border-rose-300";
}

function bandTextClass(band: ScoreBand): string {
  if (band === "green") return "text-emerald-700";
  if (band === "yellow") return "text-amber";
  return "text-rose-700";
}

type UiStep = QualityStep & { uiStatus: "pending" | "running" | "done" | "warn" };

export function QualityResearchRunner({
  mode,
  query,
  lpId,
  product,
  autoStart,
  onClose,
}: Props) {
  const { t, locale } = useI18n();
  const [running, setRunning] = useState(false);
  const [liveMsg, setLiveMsg] = useState("");
  const [steps, setSteps] = useState<UiStep[]>([]);
  const [lpCards, setLpCards] = useState<QualityLpCard[]>([]);
  const [strategy, setStrategy] = useState<QuotingStrategy | null>(null);
  const [report, setReport] = useState<QualityReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stepsOpen, setStepsOpen] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [steps, liveMsg, lpCards.length, strategy]);

  useEffect(() => {
    if (autoStart && !started.current) {
      started.current = true;
      void run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  async function run() {
    if (running) return;
    setRunning(true);
    setError(null);
    setReport(null);
    setSteps([]);
    setLpCards([]);
    setStrategy(null);
    setStepsOpen(true);
    setLiveMsg(isZh(locale) ? "启动实时质量研究…" : "Starting live quality research…");

    const params = new URLSearchParams({
      mode,
      locale,
      q: query,
    });
    if (lpId) params.set("lpId", lpId);
    if (product) params.set("product", product);

    try {
      const res = await fetch(`/api/quality/stream?${params.toString()}`);
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const chunk of parts) {
          const lines = chunk.split("\n");
          let event = "message";
          let data = "";
          for (const line of lines) {
            if (line.startsWith("event:")) event = line.slice(6).trim();
            if (line.startsWith("data:")) data += line.slice(5).trim();
          }
          if (!data) continue;
          const payload = JSON.parse(data) as Record<string, unknown>;
          handleEvent(event, payload, locale);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "stream failed");
    } finally {
      setRunning(false);
      setLiveMsg("");
    }
  }

  function handleEvent(event: string, payload: Record<string, unknown>, loc: Locale) {
    if (event === "status") {
      setLiveMsg(String(payload.message ?? ""));
      return;
    }
    if (event === "step_start") {
      const index = Number(payload.index);
      const title = String(payload.title ?? "");
      const action = String(payload.action ?? "");
      const id = String(payload.id ?? index);
      setLiveMsg(
        isZh(loc)
          ? `步骤 ${index}: ${title} — 执行中…`
          : `Step ${index}: ${title} — running…`,
      );
      setSteps((prev) => {
        const next = prev.filter((s) => s.id !== id);
        next.push({
          id,
          index,
          title,
          action,
          result: "",
          details: [],
          status: "running",
          pros: [],
          cons: [],
          uiStatus: "running",
        });
        return next.sort((a, b) => a.index - b.index);
      });
      return;
    }
    if (event === "step_done") {
      const step = payload as unknown as QualityStep;
      const uiStatus: UiStep["uiStatus"] = step.status === "warn" ? "warn" : "done";
      setSteps((prev) => {
        const others = prev.filter((s) => s.id !== step.id);
        return [...others, { ...step, uiStatus }].sort((a, b) => a.index - b.index);
      });
      return;
    }
    if (event === "lp_card") {
      const card = payload as unknown as QualityLpCard;
      setLpCards((prev) => {
        if (prev.some((c) => c.id === card.id)) return prev;
        return [...prev, card];
      });
      return;
    }
    if (event === "strategy") {
      setStrategy(payload as unknown as QuotingStrategy);
      return;
    }
    if (event === "complete") {
      const full = payload.report as QualityReport;
      setReport(full);
      if (full.lpCards?.length) setLpCards(full.lpCards);
      if (full.quotingStrategy) setStrategy(full.quotingStrategy);
      // After a product multi-LP run, collapse the long shared step log so strategy + LP cards lead.
      if (full.mode === "product") setStepsOpen(false);
      setLiveMsg(isZh(loc) ? "研究完成" : "Research complete");
      return;
    }
    if (event === "error") {
      setError(String(payload.message ?? "error"));
    }
  }

  async function downloadReport() {
    const res = await fetch("/api/quality", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        mode,
        query,
        lpId,
        product,
        locale,
        format: "html",
      }),
    });
    if (!res.ok) return;
    const html = await res.text();
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lp-quality-${(query || lpId || "report").replace(/\s+/g, "-").toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);

    // Also open printable window
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
    }
  }

  return (
    <section className="panel animate-rise overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-line bg-navy px-3 py-3 text-foam sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:px-5">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.18em] text-teal-soft">
            {t("quality.kicker")}
          </p>
          <h2 className="break-words font-display text-xl sm:text-2xl">
            {t("quality.title")} · {query || lpId}
          </h2>
          {liveMsg && <p className="mt-1 text-xs text-slate">{liveMsg}</p>}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <button
            type="button"
            disabled={running}
            onClick={() => void run()}
            className="touch-target col-span-2 rounded-lg bg-teal px-3 text-sm font-medium text-white disabled:opacity-50 sm:col-span-1"
          >
            {running ? t("quality.running") : report ? t("quality.rerun") : t("quality.start")}
          </button>
          <button
            type="button"
            disabled={!report && steps.length === 0}
            onClick={() => void downloadReport()}
            className="touch-target rounded-lg border border-slate/40 bg-white/10 px-3 text-sm hover:bg-white/20 disabled:opacity-40"
          >
            {t("quality.download")}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="touch-target rounded-lg border border-slate/40 px-3 text-sm hover:bg-white/10"
            >
              {t("quality.close")}
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="bg-amber-soft px-4 py-2 text-sm text-amber">{error}</p>
      )}

      <div className="space-y-3 px-3 py-4 sm:px-5">
        {steps.length === 0 && !running && (
          <p className="text-sm text-mist">{t("quality.idle")}</p>
        )}

        {(strategy || report?.quotingStrategy) && (
          <QuotingStrategyPanel strategy={strategy ?? report!.quotingStrategy!} />
        )}

        {(lpCards.length > 0 || (report?.lpCards?.length ?? 0) > 0) && (
          <QualityLpCardList cards={lpCards.length ? lpCards : report!.lpCards} />
        )}

        {steps.length > 0 && (
          <div className="rounded-xl border border-line bg-white/50">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 px-3 py-3 text-left sm:px-4"
              onClick={() => setStepsOpen((v) => !v)}
              aria-expanded={stepsOpen}
            >
              <span className="text-sm font-semibold text-navy">
                {t("quality.stepsLog")} ({steps.length})
              </span>
              <span className="text-xs text-teal">
                {stepsOpen ? t("quality.collapse") : t("quality.expand")}
              </span>
            </button>
            {stepsOpen && (
              <div className="space-y-3 border-t border-line px-3 py-3 sm:px-4">
                {steps.map((s) => (
                  <article
                    key={s.id}
                    className={`rounded-xl border px-3 py-3 sm:px-4 ${
                      s.uiStatus === "running"
                        ? "border-teal bg-teal-soft/40"
                        : s.uiStatus === "warn"
                          ? "border-amber/40 bg-amber-soft/40"
                          : "border-line bg-foam/80"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="min-w-0 flex-1 break-words font-semibold text-navy">
                        <span className="font-mono text-xs text-teal">{s.index}.</span> {s.title}
                      </h3>
                      <span
                        className={`chip ${
                          s.uiStatus === "running"
                            ? "bg-teal text-white"
                            : s.uiStatus === "warn"
                              ? "bg-amber-soft text-amber"
                              : "bg-teal-soft text-teal"
                        }`}
                      >
                        {s.uiStatus === "running"
                          ? t("quality.status.running")
                          : s.uiStatus === "warn"
                            ? t("quality.status.warn")
                            : t("quality.status.done")}
                      </span>
                    </div>
                    <QualityStepBody step={s} />
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {report?.dataBottleneck.hit && (
          <div
            className="rounded-xl border border-amber/40 bg-amber-soft/50 px-4 py-3"
            role="status"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-amber">
              {t("quality.bottleneck")}
            </p>
            <p className="mt-1 text-sm text-navy-2">{report.dataBottleneck.message}</p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-mist">
              {t("quality.bottleneck.gaps")}
            </p>
            <ul className="mt-1 list-disc pl-4 text-sm text-navy-2">
              {report.dataBottleneck.gaps.map((g, i) => (
                <li key={i}>{g}</li>
              ))}
            </ul>
          </div>
        )}

        {report && (
          <div
            className={`rounded-xl border px-4 py-4 ${
              report.overallBand === "green"
                ? "border-emerald-300 bg-emerald-50/80"
                : report.overallBand === "yellow"
                  ? "border-amber/40 bg-amber-soft/40"
                  : "border-rose-300 bg-rose-50/80"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-teal">
              {t("quality.verdict")}
              {report.product ? ` · ${report.product}` : ""}
            </p>
            {report.subjects.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {report.subjects.map((s) => (
                  <span
                    key={s.slug}
                    className={`inline-flex items-center gap-2 rounded-lg border bg-white/90 px-2 py-1 text-xs ${bandClass(s.band)}`}
                    title={s.reason}
                  >
                    <LpLogo lp={{ slug: s.slug, name: s.name, logoUrl: s.logoUrl }} size="sm" />
                    <span className="font-medium text-navy">{s.name}</span>
                    <span className="font-mono font-semibold">
                      {s.score}
                    </span>
                  </span>
                ))}
              </div>
            )}
            <p className={`mt-2 font-display text-2xl ${bandTextClass(report.overallBand)}`}>
              {t("quality.score")}: {report.overallScore}/100
              <span
                className={`ml-2 inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${bandClass(report.overallBand)}`}
              >
                {scoreBandLabel(report.overallBand, locale)}
              </span>
            </p>
            <p className="mt-1 text-xs text-mist">{t("quality.bands")}</p>
            <p className="mt-2 text-sm text-navy-2">{report.verdict}</p>
            {report.liveFindings?.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-teal">
                  {t("quality.evidence")}
                </p>
                <ul className="mt-1 list-disc pl-4 text-sm text-navy-2">
                  {report.liveFindings.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold text-teal">{t("quality.pros")}</p>
                <ul className="mt-1 list-disc pl-4 text-sm">
                  {report.summaryPros.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-amber">{t("quality.cons")}</p>
                <ul className="mt-1 list-disc pl-4 text-sm">
                  {report.summaryCons.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="mt-3 text-xs text-mist">{report.disclaimer}</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </section>
  );
}
