import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import type { Game } from "../types/game";
import type { ChatMessage } from "../types/chat";
import {
  gameAssistantWelcome,
  handleGameAssistantMessage,
} from "../lib/chatEngine";
import { useI18n } from "../i18n";

function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, lineIdx) => {
        const chunks = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <span key={lineIdx}>
            {lineIdx > 0 ? <br /> : null}
            {chunks.map((chunk, i) =>
              chunk.startsWith("**") && chunk.endsWith("**") ? (
                <strong key={i}>{chunk.slice(2, -2)}</strong>
              ) : (
                <span key={i}>{chunk}</span>
              ),
            )}
          </span>
        );
      })}
    </>
  );
}

export function GameAssistant({ game }: { game: Game }) {
  const { t } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([gameAssistantWelcome(game, t)]);
    setInput("");
  }, [game.id, game.name, t]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: "user",
      content: trimmed,
    };
    const replies = handleGameAssistantMessage(game, trimmed, t);
    setMessages((prev) => [...prev, userMsg, ...replies]);
    setInput("");
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    send(input);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  const lastQuick =
    [...messages]
      .reverse()
      .find((m) => m.role === "assistant" && m.quickReplies?.length)?.quickReplies ??
    [];

  return (
    <div className="panel game-assistant">
      <div className="game-assistant-head">
        <h2>{t("detail.assistant.title")}</h2>
        <p>{t("detail.assistant.sub", { name: game.name })}</p>
      </div>

      <div className="game-assistant-shell">
        <div className="chat-messages game-assistant-messages" aria-live="polite">
          {messages.map((m) => (
            <div key={m.id} className={`chat-bubble chat-${m.role}`}>
              <div className="chat-bubble-text">
                <RichText text={m.content} />
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {lastQuick.length ? (
          <div className="chat-quick" aria-label={t("detail.assistant.suggestions")}>
            {lastQuick.map((q) => (
              <button key={q} type="button" onClick={() => send(q)}>
                {q}
              </button>
            ))}
          </div>
        ) : null}

        <form className="chat-composer" onSubmit={onSubmit}>
          <label className="sr-only" htmlFor="game-assistant-input">
            {t("detail.assistant.inputLabel", { name: game.name })}
          </label>
          <textarea
            id="game-assistant-input"
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t("detail.assistant.placeholder", { name: game.name })}
          />
          <button className="btn btn-primary" type="submit" disabled={!input.trim()}>
            {t("detail.assistant.send")}
          </button>
        </form>

        <p className="chat-scope-note">
          {t("detail.assistant.scopeNote")}{" "}
          <Link to="/guide">{t("detail.assistant.guideLink")}</Link>
        </p>
      </div>
    </div>
  );
}
