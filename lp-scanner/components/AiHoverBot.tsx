"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import type { ChatSection, ChatSource } from "@/lib/assistant";

type Msg =
  | { role: "user"; text: string }
  | {
      role: "assistant";
      text: string;
      understoodAs?: string;
      sections?: ChatSection[];
      sources?: ChatSource[];
      disclaimer?: string | null;
    };

function AssistantBubble({
  msg,
  sourcesLabel,
}: {
  msg: Extract<Msg, { role: "assistant" }>;
  sourcesLabel: string;
}) {
  const structured = msg.sections && msg.sections.length > 0;

  return (
    <div className="mr-3 space-y-2 rounded-xl bg-slate/60 px-3 py-2 text-navy sm:mr-4">
      {msg.understoodAs && (
        <p className="text-xs font-medium text-teal">{msg.understoodAs}</p>
      )}
      {structured ? (
        msg.sections!.map((s, i) => (
          <div key={i} className="space-y-1">
            {s.heading && <p className="text-sm font-semibold text-navy">{s.heading}</p>}
            {(s.paragraphs ?? []).map((p, j) => (
              <p key={j} className="text-sm leading-relaxed text-navy-2">
                {p}
              </p>
            ))}
            {(s.bullets ?? []).length > 0 && (
              <ul className="list-disc space-y-1 pl-4 text-sm leading-relaxed text-navy-2">
                {s.bullets!.map((b, j) => (
                  <li key={j}>{b}</li>
                ))}
              </ul>
            )}
          </div>
        ))
      ) : (
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
      )}
      {msg.sources && msg.sources.length > 0 && (
        <div className="border-t border-line/70 pt-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-mist">
            {sourcesLabel}
          </p>
          <ul className="mt-1 space-y-1">
            {msg.sources.map((s) => (
              <li key={s.url}>
                <a
                  href={s.url}
                  target={s.url.startsWith("http") ? "_blank" : undefined}
                  rel={s.url.startsWith("http") ? "noreferrer" : undefined}
                  className="text-xs text-teal underline decoration-teal/30 hover:decoration-teal"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {msg.disclaimer && (
        <p className="text-[11px] leading-snug text-mist">{msg.disclaimer}</p>
      )}
    </div>
  );
}

export function AiHoverBot() {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [selection, setSelection] = useState("");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [fabPos, setFabPos] = useState<{ x: number; y: number } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function captureSelection() {
      const text = window.getSelection()?.toString().trim() ?? "";
      if (!text) return;
      setSelection(text);
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const rect = sel.getRangeAt(0).getBoundingClientRect();
        const x = Math.min(Math.max(8, rect.right + 8), window.innerWidth - 72);
        const y = Math.min(Math.max(72, rect.top - 8), window.innerHeight - 120);
        setFabPos({ x, y });
      }
    }
    document.addEventListener("mouseup", captureSelection);
    document.addEventListener("touchend", captureSelection, { passive: true });
    return () => {
      document.removeEventListener("mouseup", captureSelection);
      document.removeEventListener("touchend", captureSelection);
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function send(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    setBusy(true);
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q, selection, locale }),
      });
      const data = (await res.json()) as {
        answer?: string;
        understoodAs?: string;
        sections?: ChatSection[];
        sources?: ChatSource[];
        disclaimer?: string | null;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || "chat failed");
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: data.answer || "…",
          understoodAs: data.understoodAs,
          sections: data.sections,
          sources: data.sources,
          disclaimer: data.disclaimer,
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: locale === "zh-CN" ? "请求失败，请稍后重试。" : "Request failed, try again.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {fabPos && !open && selection && (
        <button
          type="button"
          className="fixed z-50 animate-float rounded-full bg-teal px-3 py-2 text-xs font-semibold text-white shadow-panel"
          style={{ left: fabPos.x, top: fabPos.y }}
          onClick={() => setOpen(true)}
        >
          {t("ai.open")}
        </button>
      )}

      <button
        type="button"
        aria-label={t("ai.open")}
        className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-navy text-foam shadow-panel transition hover:bg-teal sm:bottom-5 sm:right-5"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="font-display text-xl">AI</span>
      </button>

      {open && (
        <div className="panel fixed inset-x-3 bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.5rem))] z-50 flex h-[min(72vh,560px)] w-auto flex-col overflow-hidden animate-rise sm:inset-x-auto sm:bottom-24 sm:right-5 sm:h-[min(70vh,520px)] sm:w-[min(92vw,420px)]">
          <div className="flex items-start justify-between gap-2 border-b border-line bg-navy px-4 py-3 text-foam">
            <div className="min-w-0">
              <p className="font-display text-xl">{t("ai.title")}</p>
              <p className="mt-1 text-xs text-slate">{t("ai.hint")}</p>
            </div>
            <button
              type="button"
              className="touch-target shrink-0 rounded-lg px-2 text-sm text-slate hover:text-white"
              onClick={() => setOpen(false)}
              aria-label={t("quality.close")}
            >
              ✕
            </button>
          </div>
          {selection && (
            <div className="border-b border-line bg-teal-soft/50 px-4 py-2 text-xs text-navy">
              <span className="font-semibold">{t("ai.selection")}: </span>
              {selection.slice(0, 160)}
              {selection.length > 160 ? "…" : ""}
            </div>
          )}
          <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-3 text-sm">
            {messages.length === 0 && <p className="text-mist">{t("ai.hint")}</p>}
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div
                  key={i}
                  className="ml-4 rounded-xl bg-navy px-3 py-2 text-foam sm:ml-6"
                >
                  {m.text}
                </div>
              ) : (
                <AssistantBubble key={i} msg={m} sourcesLabel={t("ai.sources")} />
              ),
            )}
            {busy && (
              <p className="text-xs text-mist">
                {locale === "zh-CN" ? "正在理解问题…" : "Understanding your question…"}
              </p>
            )}
            <div ref={endRef} />
          </div>
          <form
            className="flex gap-2 border-t border-line p-3 safe-bottom"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <input
              className="min-w-0 flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-teal"
              placeholder={t("ai.placeholder")}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={busy}
            />
            <button
              type="submit"
              disabled={busy}
              className="touch-target shrink-0 rounded-lg bg-teal px-3 text-sm font-medium text-white disabled:opacity-60"
            >
              {t("ai.send")}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
