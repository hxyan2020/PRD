"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui";
import { useT, useUiLocale } from "@/hooks/useUiLocale";
import { isPublicSnapshot } from "@/lib/static-export";
import {
  applyImprovementTurn,
  classifyImproveIntent,
  type ImprovementChatMessage,
  type ImprovementItem,
  type ImprovementReview,
} from "@/lib/ai/improvement-model";
import { cn } from "@/lib/utils";

const STORAGE_PREFIX = "crmp.imp.";

function kindClass(kind: string) {
  switch (kind) {
    case "DATA_SOURCE":
      return "bg-sky-50 text-sky-900 border-sky-200";
    case "INDICATOR_HEALTH":
      return "bg-amber-50 text-amber-900 border-amber-200";
    case "REASONING_GAP":
      return "bg-violet-50 text-violet-900 border-violet-200";
    case "SKILL_PATTERN":
      return "bg-teal-50 text-teal-900 border-teal-200";
    case "THRESHOLD":
      return "bg-orange-50 text-orange-900 border-orange-200";
    case "RESPONSE_TIME":
      return "bg-rose-50 text-rose-900 border-rose-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function statusClass(status: string) {
  if (status === "SATISFIED" || status === "ACCEPTED") return "bg-emerald-50 text-emerald-900 border-emerald-200";
  if (status === "CHALLENGED") return "bg-rose-50 text-rose-900 border-rose-200";
  if (status === "SUPERSEDED") return "bg-slate-100 text-slate-600 border-slate-200";
  return "bg-amber-50 text-amber-900 border-amber-200";
}

function ItemCard({ item, t }: { item: ImprovementItem; t: (k: string, vars?: Record<string, string | number>) => string }) {
  return (
    <li className="rounded-xl border border-[var(--line)] p-3 min-w-0">
      <div className="flex flex-wrap gap-1.5 items-center">
        <Badge className={kindClass(item.kind)}>{t(`imp.kind.${item.kind}`)}</Badge>
        <Badge
          className={
            item.priority === "HIGH"
              ? "bg-rose-50 text-rose-900 border-rose-200"
              : item.priority === "MEDIUM"
                ? "bg-amber-50 text-amber-900 border-amber-200"
                : "bg-slate-100 text-slate-700 border-slate-200"
          }
        >
          {item.priority}
        </Badge>
        <Badge className={statusClass(item.status)}>{item.status}</Badge>
        <span className="text-[11px] text-[var(--muted)]">{item.id}</span>
      </div>
      <div className="mt-1.5 font-semibold text-sm">{item.title}</div>
      {item.from && item.to ? (
        <div className="mt-1 text-xs text-teal-800 font-semibold">
          {item.from} → {item.to}
        </div>
      ) : null}
      <p className="mt-1 text-sm text-slate-700 leading-relaxed">{item.recommendation}</p>
      <p className="mt-1 text-xs text-[var(--muted)] leading-relaxed">{item.rationale}</p>
    </li>
  );
}

export function AiImprovementPanel({
  analysisId,
  initial,
  compact,
}: {
  analysisId: number;
  initial?: ImprovementReview | null;
  compact?: boolean;
}) {
  const { t } = useT();
  const { locale } = useUiLocale();
  const [review, setReview] = useState<ImprovementReview | null>(initial || null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [factMode, setFactMode] = useState(false);
  const [openChat, setOpenChat] = useState(!compact);
  const listRef = useRef<HTMLDivElement>(null);
  const storageKey = `${STORAGE_PREFIX}${analysisId}`;

  useEffect(() => {
    setReview(initial || null);
  }, [initial, analysisId]);

  useEffect(() => {
    if (!isPublicSnapshot() || typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const saved = JSON.parse(raw) as ImprovementReview;
      if (saved?.review_id) setReview(saved);
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  useEffect(() => {
    if (!review || !isPublicSnapshot() || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(review));
    } catch {
      /* ignore */
    }
  }, [review, storageKey]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [review?.chat, busy, openChat]);

  const chips = useMemo(
    () => [
      { id: "pull", label: t("imp.pull"), message: t("imp.chip.pull") },
      { id: "fact", label: t("imp.addFact"), message: "" },
      { id: "challenge", label: t("imp.challenge"), message: t("imp.chip.challenge") },
      { id: "regenerate", label: t("imp.regenerate"), message: t("imp.chip.regenerate") },
      { id: "accept", label: t("imp.satisfactory"), message: t("imp.chip.accept") },
    ],
    [t]
  );

  async function send(raw: string) {
    const text = raw.trim();
    if (!text || busy) return;
    setBusy(true);
    setFactMode(false);
    setDraft("");
    setOpenChat(true);

    const optimistic = review
      ? applyImprovementTurn(review, text, locale === "zh-Hant" ? "zh-Hant" : "en")
      : null;
    if (optimistic) setReview(optimistic.review);

    const fallback = () => {
      if (optimistic) {
        setReview(optimistic.review);
        return;
      }
    };

    try {
      if (!isPublicSnapshot()) {
        const res = await fetch("/api/ai-improve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: classifyImproveIntent(text),
            analysis_id: analysisId,
            message: text,
            locale,
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as { review?: ImprovementReview; current?: ImprovementReview };
          setReview(data.current || data.review || optimistic?.review || null);
          setBusy(false);
          return;
        }
      }
    } catch {
      /* client fallback */
    }
    fallback();
    setBusy(false);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = factMode && draft.trim() ? `${t("imp.chip.factPrefix")}${draft.trim()}` : draft;
    void send(text);
  }

  if (!review) {
    return (
      <section className="panel p-4 border-dashed">
        <h2 className="font-[family-name:var(--font-display)] text-lg">{t("imp.title")}</h2>
        <p className="text-sm text-[var(--muted)] mt-2">{t("imp.missing")}</p>
      </section>
    );
  }

  const chat: ImprovementChatMessage[] = review.chat || [];
  const high = review.items.filter((i) => i.priority === "HIGH").length;

  return (
    <section className="panel p-3 sm:p-4 border-violet-200" data-testid={`imp-panel-${analysisId}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">{t("imp.kicker")}</div>
          <h2 className="font-[family-name:var(--font-display)] text-lg">{t("imp.title")}</h2>
          <p className="text-sm text-[var(--muted)] mt-1 max-w-3xl">{review.summary}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className={statusClass(review.status)}>{review.status}</Badge>
          <Badge className="bg-violet-50 text-violet-900 border-violet-200">{review.review_id}</Badge>
          <Badge className="bg-slate-100 text-slate-700 border-slate-200">
            {t("imp.itemCount", { n: review.items.length, high })}
          </Badge>
        </div>
      </div>

      <ul className={cn("mt-3 gap-2", compact ? "space-y-1.5" : "grid grid-cols-1 md:grid-cols-2")}>
        {review.items.map((item) =>
          compact ? (
            <li key={item.id} className="rounded-lg border border-[var(--line)] px-2.5 py-2 text-sm">
              <div className="flex flex-wrap gap-1.5 items-center">
                <Badge className={kindClass(item.kind)}>{t(`imp.kind.${item.kind}`)}</Badge>
                {item.from && item.to ? (
                  <span className="text-xs font-semibold text-teal-800">
                    {item.from} → {item.to}
                  </span>
                ) : null}
              </div>
              <div className="mt-1">{item.recommendation}</div>
            </li>
          ) : (
            <ItemCard key={item.id} item={item} t={t} />
          )
        )}
      </ul>

      {review.facts.length ? (
        <div className="mt-3 rounded-xl border border-dashed border-violet-200 bg-violet-50/40 px-3 py-2">
          <div className="text-[11px] uppercase tracking-[0.08em] text-violet-800">{t("imp.facts")}</div>
          <ul className="mt-1 space-y-1 text-sm">
            {review.facts.map((f) => (
              <li key={f.id}>
                <span className="font-semibold">{f.id}</span> · {f.text}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-3">
        <button
          type="button"
          className="text-sm font-semibold text-violet-800 underline"
          onClick={() => setOpenChat((v) => !v)}
        >
          {openChat ? t("imp.hideChat") : t("imp.showChat")}
        </button>
      </div>

      {openChat ? (
        <div className="mt-3 rounded-xl border border-[var(--line)] bg-slate-50/80 overflow-hidden" data-desk-chat>
          <div ref={listRef} className="max-h-56 overflow-y-auto p-3 space-y-2 text-sm">
            {chat.length === 0 ? (
              <p className="text-[var(--muted)]">{t("imp.chatHint")}</p>
            ) : (
              chat.map((m, i) => (
                <div
                  key={`${m.at}-${i}`}
                  className={cn(
                    "rounded-lg px-3 py-2 whitespace-pre-wrap",
                    m.role === "user" ? "bg-white border border-[var(--line)] ml-6" : "bg-violet-50 border border-violet-100 mr-6"
                  )}
                >
                  {m.content}
                </div>
              ))
            )}
            {busy ? <p className="text-xs text-[var(--muted)]">{t("imp.thinking")}</p> : null}
          </div>
          <div className="border-t border-[var(--line)] bg-white p-2 space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {chips.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="btn text-xs py-1 px-2"
                  disabled={busy}
                  onClick={() => {
                    if (c.id === "fact") {
                      setFactMode(true);
                      setOpenChat(true);
                      return;
                    }
                    void send(c.message);
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <form onSubmit={onSubmit} className="flex gap-2">
              <input
                className="flex-1 min-w-0 rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={factMode ? t("imp.factPlaceholder") : t("imp.chatPlaceholder")}
                disabled={busy}
                aria-label={t("imp.chatPlaceholder")}
              />
              <button type="submit" className="btn btn-primary" disabled={busy || !draft.trim()}>
                {t("imp.send")}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
