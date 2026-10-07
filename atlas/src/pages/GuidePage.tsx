import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { Footer } from "../components/Footer";
import { loadCollection } from "../lib/collection";
import type { Game } from "../types/game";
import type { ChatMessage, ChatState } from "../types/chat";
import {
  handleUserMessage,
  initialChatState,
  phaseAfterWelcome,
  welcomeMessage,
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

function RecCards({ games }: { games: Game[] }) {
  if (!games.length) return null;
  return (
    <div className="chat-recs">
      {games.map((g) => (
        <Link key={g.id} to={`/game/${g.slug}`} className="chat-rec-card">
          <div className="chat-rec-img">
            <img src={g.images[0]} alt="" loading="lazy" />
          </div>
          <div>
            <div className="pill">{g.category}</div>
            <h4>{g.name}</h4>
            <p>
              {g.originCountry} · {g.creationYear}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function GuidePage() {
  const [games, setGames] = useState<Game[]>([]);
  const [state, setState] = useState<ChatState>(() => initialChatState());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [ready, setReady] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { t } = useI18n();

  useEffect(() => {
    loadCollection().then((data) => {
      setGames(data.games);
      setMessages([welcomeMessage()]);
      setState((s) => ({ ...s, phase: phaseAfterWelcome() }));
      setReady(true);
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || !ready) return;
    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: "user",
      content: trimmed,
    };
    const result = handleUserMessage(games, state, trimmed);
    setMessages((prev) => [...prev, userMsg, ...result.replies]);
    setState(result.state);
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
    <>
      <section className="section chat-page">
        <div className="container chat-layout">
          <div className="section-head chat-head">
            <h2>{t("guide.title")}</h2>
            <p>{t("guide.sub")}</p>
          </div>

          <div className="chat-shell">
            <div className="chat-messages" aria-live="polite">
              {messages.map((m) => (
                <div key={m.id} className={`chat-bubble chat-${m.role}`}>
                  <div className="chat-bubble-text">
                    <RichText text={m.content} />
                  </div>
                  {m.recommendations ? <RecCards games={m.recommendations} /> : null}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {lastQuick.length ? (
              <div className="chat-quick" aria-label="Suggested replies">
                {lastQuick.map((q) => (
                  <button key={q} type="button" onClick={() => send(q)}>
                    {q}
                  </button>
                ))}
              </div>
            ) : null}

            <form className="chat-composer" onSubmit={onSubmit}>
              <label className="sr-only" htmlFor="chat-input">
                {t("guide.inputLabel")}
              </label>
              <textarea
                id="chat-input"
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={t("guide.placeholder")}
                disabled={!ready}
              />
              <button
                className="btn btn-primary"
                type="submit"
                disabled={!ready || !input.trim()}
              >
                {t("guide.send")}
              </button>
            </form>
            <p className="chat-scope-note">{t("guide.scope")}</p>
          </div>
        </div>
      </section>
      <Footer total={games.length || undefined} />
    </>
  );
}
