"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PlatformLogo } from "@/components/PlatformLogo";
import { withBase } from "@/lib/base-path";
import {
  IDEA_QA_SUGGESTIONS,
  answerIdeaQuestion,
  type IdeaQaCitation,
  type IdeaQaReply,
} from "@/lib/idea-qa";
import { useI18n } from "@/lib/i18n/context";
import type { StartupIdea } from "@/lib/types";

type ChatRole = "bot" | "user";
type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  citations?: IdeaQaCitation[];
};

export function IdeaChatbot({ idea }: { idea: StartupIdea }) {
  const { t } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [ready, setReady] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        role: "bot",
        text: t("ideaChat.welcome", { name: idea.name }),
        citations: [
          {
            id: "ingest",
            label: `VentureScan ingest · ${idea.source}`,
            url: "/sources",
            detail: `Last scanned ${new Date(idea.scannedAt).toISOString().replace(".000Z", "Z")}`,
            kind: "primary",
          },
          {
            id: "official",
            label: `${idea.name} website`,
            url: idea.website,
            detail: "Official company site",
            kind: "official",
          },
        ],
      },
    ]);
    setReady(true);
  }, [idea.id, idea.name, idea.source, idea.scannedAt, idea.website, t]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function ask(question: string) {
    const q = question.trim();
    if (!q) return;

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", text: q };
    const reply: IdeaQaReply = answerIdeaQuestion(idea, q);
    const botMsg: ChatMessage = {
      id: `b-${Date.now()}`,
      role: "bot",
      text: reply.answer,
      citations: reply.citations,
    };
    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput("");
    queueMicrotask(() => inputRef.current?.focus());
  }

  if (!ready) {
    return (
      <div className="rounded-2xl border border-black/10 bg-ink-2/60 p-5 text-sm text-mist">
        {t("ideaChat.loading")}
      </div>
    );
  }

  return (
    <section className="mt-12 rounded-2xl border border-black/10 bg-ink-2/60 shadow-panel">
      <div className="border-b border-black/10 px-4 py-4 sm:px-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-celadon">
          {t("ideaChat.kicker")}
        </p>
        <h2 className="mt-1 font-display text-2xl text-foam sm:text-3xl">
          {t("ideaChat.title", { name: idea.name })}
        </h2>
        <p className="mt-2 text-sm text-mist">{t("ideaChat.body")}</p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-black/10 px-4 py-3 sm:px-5">
        {IDEA_QA_SUGGESTIONS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="rounded-full border border-black/12 bg-black/[0.04] px-3 py-1.5 text-left text-xs text-mist hover:border-celadon/40 hover:text-foam"
            onClick={() => ask(prompt)}
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="max-h-[28rem] space-y-3 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[95%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
              m.role === "bot" ? "bg-black/[0.04] text-foam" : "ml-auto bg-celadon/20 text-foam"
            }`}
          >
            <p className="whitespace-pre-wrap">{m.text}</p>
            {m.role === "bot" && m.citations?.length ? (
              <CitationsList citations={m.citations} heading={t("ideaChat.sources")} />
            ) : null}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form
        className="flex gap-2 border-t border-black/10 px-4 py-3 sm:px-5 sm:py-4"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <input
          ref={inputRef}
          className="field"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("ideaChat.placeholder", { name: idea.name })}
          aria-label={t("ideaChat.placeholder", { name: idea.name })}
          autoComplete="off"
          enterKeyHint="send"
        />
        <button type="submit" className="btn-primary shrink-0">
          {t("ideaChat.send")}
        </button>
      </form>
    </section>
  );
}

function CitationsList({
  citations,
  heading,
}: {
  citations: IdeaQaCitation[];
  heading: string;
}) {
  return (
    <div className="mt-3 rounded-xl border border-black/10 bg-black/[0.03] p-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-celadon">{heading}</p>
      <ul className="mt-2 space-y-2">
        {citations.map((c) => (
          <li key={`${c.id}-${c.url}`} className="flex items-start gap-2 text-xs">
            {c.kind === "wire" ? (
              <PlatformLogo sourceId={c.id} name={c.label} className="h-7 w-7 rounded-lg" />
            ) : (
              <span
                className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-black/12 bg-black/[0.05] font-mono text-[10px] text-mist"
                aria-hidden
              >
                {c.kind === "official" ? "◎" : "≡"}
              </span>
            )}
            <span className="min-w-0">
              {c.url.startsWith("/") ? (
                <Link href={c.url} className="text-celadon underline-offset-2 hover:underline">
                  {c.label}
                </Link>
              ) : (
                <a
                  href={c.url.startsWith("http") ? c.url : withBase(c.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-celadon underline-offset-2 hover:underline"
                >
                  {c.label}
                </a>
              )}
              {c.detail ? <span className="mt-0.5 block text-mist/80">{c.detail}</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
