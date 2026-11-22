"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/context";

type Msg = { role: "user" | "assistant"; text: string };

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
    function onUp() {
      const text = window.getSelection()?.toString().trim() ?? "";
      if (text) {
        setSelection(text);
        const range = window.getSelection()?.getRangeAt(0);
        if (range) {
          const rect = range.getBoundingClientRect();
          setFabPos({ x: Math.min(rect.right + 8, window.innerWidth - 56), y: Math.max(rect.top - 8, 72) });
        }
      }
    }
    document.addEventListener("mouseup", onUp);
    return () => document.removeEventListener("mouseup", onUp);
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
      const data = (await res.json()) as { answer?: string };
      setMessages((m) => [...m, { role: "assistant", text: data.answer || "…" }]);
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
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-navy text-foam shadow-panel transition hover:bg-teal"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="font-display text-xl">AI</span>
      </button>

      {open && (
        <div className="panel fixed bottom-24 right-5 z-50 flex h-[min(70vh,520px)] w-[min(92vw,380px)] flex-col overflow-hidden animate-rise">
          <div className="border-b border-line bg-navy px-4 py-3 text-foam">
            <p className="font-display text-xl">{t("ai.title")}</p>
            <p className="mt-1 text-xs text-slate">{t("ai.hint")}</p>
          </div>
          {selection && (
            <div className="border-b border-line bg-teal-soft/50 px-4 py-2 text-xs text-navy">
              <span className="font-semibold">{t("ai.selection")}: </span>
              {selection.slice(0, 160)}
              {selection.length > 160 ? "…" : ""}
            </div>
          )}
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm">
            {messages.length === 0 && (
              <p className="text-mist">{t("ai.hint")}</p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`rounded-xl px-3 py-2 ${
                  m.role === "user" ? "ml-6 bg-navy text-foam" : "mr-4 bg-slate/60 text-navy"
                }`}
              >
                {m.text}
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <form
            className="flex gap-2 border-t border-line p-3"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <input
              className="flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-teal"
              placeholder={t("ai.placeholder")}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-teal px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {t("ai.send")}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
