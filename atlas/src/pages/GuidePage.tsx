import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { Footer } from "../components/Footer";
import { OriginCountry } from "../components/OriginCountry";
import { GameImage } from "../components/GameImage";
import { loadCollection } from "../lib/collection";
import {
  isPhotographicSrc,
  ludusBackdropDataUri,
} from "../lib/gameCardImage";
import type { Game } from "../types/game";
import type { ChatMessage, ChatState } from "../types/chat";
import {
  handleUserMessage,
  initialChatState,
  phaseAfterWelcome,
  welcomeMessage,
} from "../lib/chatEngine";
import { useI18n } from "../i18n";
import {
  loadContentI18n,
  localizeGame,
  type ContentI18nCatalog,
} from "../lib/localizeContent";

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
      {games.map((g) => {
        const photo = g.images.find(isPhotographicSrc);
        const backdrop = ludusBackdropDataUri(g.category, g.id || g.slug);
        return (
          <Link key={g.id} to={`/game/${g.slug}`} className="chat-rec-card">
            <div className="chat-rec-img" aria-hidden="true">
              {photo ? (
                <GameImage
                  src={photo}
                  alt=""
                  loading="lazy"
                  label={{
                    name: g.name,
                    category: g.category,
                    originCountry: g.originCountry,
                  }}
                />
              ) : (
                <img src={backdrop} alt="" loading="lazy" />
              )}
            </div>
            <div>
              <div className="pill">{g.category}</div>
              <h4>{g.name}</h4>
              <p>
                <OriginCountry
                  country={g.originCountry}
                  countryKey={g.originCountryKey}
                />{" "}
                · {g.creationYear}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

type PendingReply = {
  replies: ChatMessage[];
  nextState: ChatState;
};

export function GuidePage() {
  const [rawGames, setRawGames] = useState<Game[]>([]);
  const [contentI18n, setContentI18n] = useState<ContentI18nCatalog | null>(null);
  const [state, setState] = useState<ChatState>(() => initialChatState());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<"idle" | "thinking" | "typing">("idle");
  const [typedContent, setTypedContent] = useState("");
  const [typingMsg, setTypingMsg] = useState<ChatMessage | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pendingRef = useRef<PendingReply | null>(null);
  const timersRef = useRef<number[]>([]);
  const { t, locale } = useI18n();

  const games = useMemo(
    () => rawGames.map((g) => localizeGame(g, locale, contentI18n)),
    [rawGames, locale, contentI18n],
  );

  useEffect(() => {
    Promise.all([loadCollection(), loadContentI18n().catch(() => null)]).then(
      ([data, i18n]) => {
        setRawGames(data.games);
        setContentI18n(i18n);
        setReady(true);
      },
    );
  }, []);

  // Re-init welcome when locale changes (or after catalog first loads).
  useEffect(() => {
    if (!ready) return;
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
    pendingRef.current = null;
    setStatus("idle");
    setTypingMsg(null);
    setTypedContent("");
    setMessages([welcomeMessage(t)]);
    setState({ ...initialChatState(), phase: phaseAfterWelcome() });
    setInput("");
  }, [locale, ready, t]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status, typedContent]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  function clearTimers() {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }

  function schedule(fn: () => void, ms: number) {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
  }

  function finishBatch(batch: PendingReply) {
    setMessages((prev) => [...prev, ...batch.replies]);
    setState(batch.nextState);
    setTypingMsg(null);
    setTypedContent("");
    setStatus("idle");
    pendingRef.current = null;
  }

  function typeReply(msg: ChatMessage, rest: ChatMessage[], nextState: ChatState) {
    setStatus("typing");
    setTypingMsg(msg);
    setTypedContent("");
    const full = msg.content;
    let i = 0;
    const step = () => {
      i = Math.min(full.length, i + Math.max(1, Math.round(full.length / 48)));
      setTypedContent(full.slice(0, i));
      if (i < full.length) {
        schedule(step, 18 + (i % 5));
        return;
      }
      // Commit typed message, then reveal remaining replies (e.g. recs already in msg).
      setMessages((prev) => [...prev, { ...msg, content: full }]);
      setTypingMsg(null);
      setTypedContent("");
      if (rest.length) {
        schedule(() => finishBatch({ replies: rest, nextState }), 220);
      } else {
        setState(nextState);
        setStatus("idle");
        pendingRef.current = null;
      }
    };
    schedule(step, 40);
  }

  function deliverReplies(replies: ChatMessage[], nextState: ChatState) {
    if (!replies.length) {
      setState(nextState);
      setStatus("idle");
      return;
    }
    const [first, ...rest] = replies;
    pendingRef.current = { replies, nextState };
    setStatus("thinking");
    const thinkMs = 450 + Math.min(900, first.content.length * 4);
    schedule(() => typeReply(first, rest, nextState), thinkMs);
  }

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || !ready || status !== "idle") return;
    clearTimers();
    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: "user",
      content: trimmed,
    };
    const result = handleUserMessage(games, state, trimmed, t);
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    deliverReplies(result.replies, result.state);
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
    status === "idle"
      ? [...messages]
          .reverse()
          .find((m) => m.role === "assistant" && m.quickReplies?.length)
          ?.quickReplies ?? []
      : [];

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
              {status === "thinking" ? (
                <div className="chat-status" role="status">
                  <span className="chat-status-dots" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </span>
                  {t("guide.thinking")}
                </div>
              ) : null}
              {status === "typing" && typingMsg ? (
                <div className="chat-bubble chat-assistant chat-bubble-typing">
                  <div className="chat-bubble-text">
                    <RichText text={typedContent} />
                    <span className="chat-caret" aria-hidden="true">
                      |
                    </span>
                  </div>
                  <div className="chat-status" role="status">
                    {t("guide.typing")}
                  </div>
                </div>
              ) : null}
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
                disabled={!ready || status !== "idle"}
              />
              <button
                className="btn btn-primary"
                type="submit"
                disabled={!ready || status !== "idle" || !input.trim()}
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
