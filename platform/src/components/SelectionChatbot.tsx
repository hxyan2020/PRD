"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Sparkles, Send, X } from "lucide-react";
import { useUiLocale } from "@/hooks/useUiLocale";
import { isPublicSnapshot } from "@/lib/static-export";
import { answerDeskChat, type DeskChatMessage, type DeskChatSource } from "@/lib/ai/desk-chat";
import { cn } from "@/lib/utils";

type Fab = { x: number; y: number; text: string };

type UiMsg = DeskChatMessage & { sources?: DeskChatSource[]; suggestions?: string[] };

function inEditable(node: Node | null) {
  let el: HTMLElement | null = node instanceof HTMLElement ? node : node?.parentElement || null;
  while (el) {
    const tag = el.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable) return true;
    if (el.dataset?.deskChat) return true;
    el = el.parentElement;
  }
  return false;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function SelectionChatbot() {
  const pathname = usePathname() || "/admin";
  const { locale } = useUiLocale();
  const zh = locale === "zh-Hant";
  const [fab, setFab] = useState<Fab | null>(null);
  const [open, setOpen] = useState(false);
  const [selection, setSelection] = useState("");
  const [messages, setMessages] = useState<UiMsg[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const pending = useRef<Fab | null>(null);

  const capture = useCallback(() => {
    if (open) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) {
      setFab(null);
      return;
    }
    const text = sel.toString().replace(/\s+/g, " ").trim();
    if (text.length < 4 || text.length > 2000) {
      setFab(null);
      return;
    }
    if (inEditable(sel.anchorNode)) {
      setFab(null);
      return;
    }
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    if (!rect.width && !rect.height) {
      setFab(null);
      return;
    }
    const vw = window.innerWidth;
    const vh = window.visualViewport?.height ?? window.innerHeight;
    const size = 44;
    const pad = 8;
    const bottomReserve = 88;
    let x = rect.right + 6;
    let y = rect.bottom + 8;
    if (y + size > vh - bottomReserve) y = rect.top - size - 8;
    const next: Fab = {
      text,
      x: clamp(x, pad, vw - size - pad),
      y: clamp(y, pad, vh - size - bottomReserve),
    };
    pending.current = next;
    setFab(next);
  }, [open]);

  useEffect(() => {
    function onPointerUp() {
      window.setTimeout(capture, 10);
    }
    document.addEventListener("mouseup", onPointerUp);
    document.addEventListener("touchend", onPointerUp, { passive: true });
    document.addEventListener("selectionchange", capture);
    return () => {
      document.removeEventListener("mouseup", onPointerUp);
      document.removeEventListener("touchend", onPointerUp);
      document.removeEventListener("selectionchange", capture);
    };
  }, [capture]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function ask(question: string, sel = selection, opts?: { reset?: boolean; hideUser?: boolean }) {
    const q = question.trim();
    if (!q) return;
    if (busy && !opts?.reset) return;
    const userMsg: UiMsg = { role: "user", content: q };
    const base = opts?.reset ? [] : messages;
    const nextHistory = [...base, userMsg];
    if (opts?.hideUser) {
      setMessages(base);
    } else {
      setMessages(nextHistory);
    }
    setDraft("");
    setBusy(true);

    const fallback = () =>
      answerDeskChat({
        selection: sel,
        question: q,
        pagePath: pathname,
        locale,
        history: nextHistory,
      });

    try {
      if (!isPublicSnapshot()) {
        const res = await fetch("/api/ai-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            selection: sel,
            question: q,
            pagePath: pathname,
            locale,
            messages: nextHistory,
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as { reply: string; sources?: DeskChatSource[]; suggestions?: string[] };
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: data.reply, sources: data.sources, suggestions: data.suggestions },
          ]);
          setBusy(false);
          return;
        }
      }
    } catch {
      /* client fallback */
    }

    const local = fallback();
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: local.reply, sources: local.sources, suggestions: local.suggestions },
    ]);
    setBusy(false);
  }

  function openChat(text: string) {
    setSelection(text);
    setOpen(true);
    setFab(null);
    const first = zh ? `請解釋這段：${text}` : `Explain this: ${text}`;
    void ask(first, text, { reset: true, hideUser: true });
  }

  function onFabClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const text = pending.current?.text || fab?.text;
    if (text) openChat(text);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void ask(draft);
  }

  function close() {
    setOpen(false);
    setBusy(false);
  }

  return (
    <div data-desk-chat="1">
      {fab && !open ? (
        <button
          type="button"
          className="fixed z-[70] h-11 w-11 rounded-full bg-teal-700 text-white shadow-lg border border-teal-800 inline-flex items-center justify-center hover:bg-teal-800"
          style={{ left: fab.x, top: fab.y }}
          aria-label={zh ? "用 AI 解釋劃選文字" : "Explain selection with AI"}
          onMouseDown={(e) => e.preventDefault()}
          onClick={onFabClick}
        >
          <Sparkles className="h-5 w-5" aria-hidden />
        </button>
      ) : null}

      {open ? (
        <div className="fixed z-[80] inset-0">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/35 sm:bg-slate-900/10"
            aria-label={zh ? "關閉" : "Close"}
            onClick={close}
          />
          <div className="absolute inset-x-0 bottom-0 sm:inset-x-auto sm:right-3 sm:bottom-3 sm:w-[min(100vw-1.5rem,420px)]">
          <section className="flex flex-col bg-white border border-[var(--line)] shadow-2xl rounded-t-2xl sm:rounded-2xl max-h-[min(72dvh,640px)] min-h-[min(46dvh,360px)] pb-[max(0.5rem,var(--safe-bottom))]">
            <div className="sm:hidden mx-auto mt-2 h-1 w-10 rounded-full bg-slate-200" aria-hidden />
            <header className="flex items-start justify-between gap-2 px-3 py-2.5 border-b border-[var(--line)]">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-sm font-semibold">
                  <Sparkles className="h-4 w-4 text-teal-700" aria-hidden />
                  {zh ? "CRMP 劃選助理" : "CRMP desk assistant"}
                </div>
                <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                  {zh ? "後台用途／已建功能 · 外匯 CFD 與加密交易所風控" : "Admin purpose & build · FX CFD and crypto-exchange RM"}
                </p>
                {selection ? (
                  <p className="mt-1 text-[11px] text-[var(--muted)] line-clamp-2 break-word">
                    {zh ? "針對：" : "About: "}
                    {selection}
                  </p>
                ) : null}
              </div>
              <button type="button" className="btn !min-h-9 !px-2" onClick={close} aria-label={zh ? "關閉" : "Close"}>
                <X className="h-4 w-4" />
              </button>
            </header>

            <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3 text-sm">
              {messages.map((m, i) => (
                <div key={`${m.role}-${i}`} className={cn("max-w-[95%]", m.role === "user" ? "ml-auto" : "")}>
                  <div
                    className={cn(
                      "rounded-xl px-3 py-2 whitespace-pre-wrap break-word",
                      m.role === "user" ? "bg-teal-700 text-white" : "bg-slate-50 border border-[var(--line)]"
                    )}
                  >
                    {m.content}
                  </div>
                  {m.sources?.length ? (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {m.sources.map((s) =>
                        s.href ? (
                          <Link key={`${s.href}-${s.title}`} href={s.href} className="btn text-[11px] !min-h-8 !px-2">
                            {s.title}
                          </Link>
                        ) : (
                          <span key={s.title} className="text-[11px] text-[var(--muted)]">
                            {s.title}
                          </span>
                        )
                      )}
                    </div>
                  ) : null}
                  {m.suggestions?.length ? (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {m.suggestions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          className="btn text-[11px] !min-h-8 !px-2"
                          onClick={() => void ask(s)}
                          disabled={busy}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
              {busy ? (
                <div className="text-xs text-[var(--muted)]">{zh ? "正在解釋…" : "Explaining…"}</div>
              ) : null}
            </div>

            <form onSubmit={onSubmit} className="border-t border-[var(--line)] p-2.5 flex gap-2">
              <input
                className="input flex-1 min-h-11"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={zh ? "繼續追問…" : "Ask a follow-up…"}
                aria-label={zh ? "訊息" : "Message"}
              />
              <button type="submit" className="btn btn-primary !px-3" disabled={busy || !draft.trim()}>
                <Send className="h-4 w-4" aria-hidden />
                <span className="sr-only">{zh ? "送出" : "Send"}</span>
              </button>
            </form>
          </section>
          </div>
        </div>
      ) : null}
    </div>
  );
}
