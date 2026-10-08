import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { Footer } from "../components/Footer";
import { OriginCountry } from "../components/OriginCountry";
import { GameImage } from "../components/GameImage";
import { loadCollection } from "../lib/collection";
import {
  ludusBackdropDataUri,
  primaryCoverSrc,
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
        const cover = primaryCoverSrc(g.images);
        const backdrop = ludusBackdropDataUri(g.category, g.id || g.slug);
        return (
          <Link key={g.id} to={`/game/${g.slug}`} className="chat-rec-card">
            <div className="chat-rec-img" aria-hidden="true">
              {cover ? (
                <GameImage
                  src={cover}
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

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function GuidePage() {
  const [rawGames, setRawGames] = useState<Game[]>([]);
  const [contentI18n, setContentI18n] = useState<ContentI18nCatalog | null>(null);
  const [state, setState] = useState<ChatState>(() => initialChatState());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<"idle" | "thinking" | "typing">("idle");
  const [thinkStep, setThinkStep] = useState(0);
  const [typedContent, setTypedContent] = useState("");
  const [typingMsg, setTypingMsg] = useState<ChatMessage | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pendingRef = useRef<PendingReply | null>(null);
  const timersRef = useRef<number[]>([]);
  const { t, locale } = useI18n();

  const thinkSteps = useMemo(
    () => [
      t("guide.think.step1"),
      t("guide.think.step2"),
      t("guide.think.step3"),
    ],
    [t],
  );

  const games = useMemo(
    () => rawGames.map((g) => localizeGame(g, locale, contentI18n, t)),
    [rawGames, locale, contentI18n, t],
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
    setThinkStep(0);
    setTypingMsg(null);
    setTypedContent("");
    setMessages([welcomeMessage(t)]);
    setState({ ...initialChatState(), phase: phaseAfterWelcome() });
    setInput("");
  }, [locale, ready, t]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status, typedContent, thinkStep]);

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
    setThinkStep(0);
    setStatus("idle");
    pendingRef.current = null;
  }

  function commitReply(msg: ChatMessage, rest: ChatMessage[], nextState: ChatState) {
    setMessages((prev) => [...prev, { ...msg, content: msg.content }]);
    setTypingMsg(null);
    setTypedContent("");
    setThinkStep(0);
    if (rest.length) {
      schedule(() => finishBatch({ replies: rest, nextState }), 220);
    } else {
      setState(nextState);
      setStatus("idle");
      pendingRef.current = null;
    }
  }

  function typeReply(msg: ChatMessage, rest: ChatMessage[], nextState: ChatState) {
    setStatus("typing");
    setTypingMsg(msg);
    setTypedContent("");
    const full = msg.content;
    if (prefersReducedMotion()) {
      commitReply(msg, rest, nextState);
      return;
    }
    let i = 0;
    const step = () => {
      // Type ~1–3 characters so short replies still feel written out.
      const chunk = full.length > 280 ? 3 : full.length > 120 ? 2 : 1;
      i = Math.min(full.length, i + chunk);
      setTypedContent(full.slice(0, i));
      if (i < full.length) {
        const ch = full[i - 1] ?? "";
        const pause =
          ch === "\n" ? 90 : /[.!?]/.test(ch) ? 70 : /[,;:]/.test(ch) ? 40 : 22;
        schedule(step, pause);
        return;
      }
      commitReply(msg, rest, nextState);
    };
    schedule(step, 50);
  }

  function runThinkingThenType(
    first: ChatMessage,
    rest: ChatMessage[],
    nextState: ChatState,
  ) {
    setStatus("thinking");
    setThinkStep(0);
    if (prefersReducedMotion()) {
      typeReply(first, rest, nextState);
      return;
    }
    const stepMs = 700;
    thinkSteps.forEach((_, idx) => {
      schedule(() => setThinkStep(idx), idx * stepMs);
    });
    schedule(
      () => typeReply(first, rest, nextState),
      thinkSteps.length * stepMs + 280,
    );
  }

  function deliverReplies(replies: ChatMessage[], nextState: ChatState) {
    if (!replies.length) {
      setState(nextState);
      setStatus("idle");
      return;
    }
    const [first, ...rest] = replies;
    pendingRef.current = { replies, nextState };
    runThinkingThenType(first, rest, nextState);
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

  const logoSrc = `${import.meta.env.BASE_URL}logo-cat.png`;

  return (
    <>
      <section className="section chat-page">
        <div className="container chat-layout">
          <div className="chat-app" role="region" aria-label={t("guide.title")}>
            <header className="chat-app-header">
              <div className="chat-app-identity">
                <span className="chat-avatar" aria-hidden="true">
                  <img src={logoSrc} alt="" width={44} height={44} />
                  <span className="chat-online-dot" />
                </span>
                <div className="chat-app-titles">
                  <h2>{t("guide.botName")}</h2>
                  <p>{t("guide.botStatus")}</p>
                </div>
              </div>
              <p className="chat-app-blurb">{t("guide.sub")}</p>
            </header>

            <div className="chat-messages" aria-live="polite">
              {messages.map((m) => (
                <div key={m.id} className={`chat-row chat-row-${m.role}`}>
                  {m.role === "assistant" ? (
                    <span className="chat-avatar chat-avatar-sm" aria-hidden="true">
                      <img src={logoSrc} alt="" width={32} height={32} />
                    </span>
                  ) : null}
                  <div className={`chat-bubble chat-${m.role}`}>
                    <div className="chat-bubble-meta">
                      {m.role === "assistant" ? t("guide.botName") : t("guide.you")}
                    </div>
                    <div className="chat-bubble-text">
                      <RichText text={m.content} />
                    </div>
                    {m.recommendations ? <RecCards games={m.recommendations} /> : null}
                  </div>
                </div>
              ))}
              {status === "thinking" ? (
                <div className="chat-row chat-row-assistant">
                  <span className="chat-avatar chat-avatar-sm" aria-hidden="true">
                    <img src={logoSrc} alt="" width={32} height={32} />
                  </span>
                  <div
                    className="chat-think"
                    role="status"
                    aria-label={t("guide.thinkingLabel")}
                  >
                    <div className="chat-think-head">
                      <span className="chat-status-dots" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                      </span>
                      <strong>{t("guide.thinking")}</strong>
                    </div>
                    <ol className="chat-think-steps">
                      {thinkSteps.map((step, idx) => (
                        <li
                          key={step}
                          className={
                            idx < thinkStep
                              ? "is-done"
                              : idx === thinkStep
                                ? "is-active"
                                : "is-pending"
                          }
                        >
                          <span className="chat-think-mark" aria-hidden="true" />
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              ) : null}
              {status === "typing" && typingMsg ? (
                <div className="chat-row chat-row-assistant">
                  <span className="chat-avatar chat-avatar-sm" aria-hidden="true">
                    <img src={logoSrc} alt="" width={32} height={32} />
                  </span>
                  <div className="chat-bubble chat-assistant chat-bubble-typing">
                    <div className="chat-bubble-meta">{t("guide.botName")}</div>
                    <div className="chat-bubble-text">
                      <RichText text={typedContent} />
                      <span className="chat-caret" aria-hidden="true">
                        |
                      </span>
                    </div>
                    <div className="chat-status chat-status-inline" role="status">
                      <span className="chat-status-dots" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                      </span>
                      {t("guide.typing")}
                    </div>
                  </div>
                </div>
              ) : null}
              <div ref={bottomRef} />
            </div>

            <div className="chat-dock">
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
                  className="btn btn-primary chat-send"
                  type="submit"
                  disabled={!ready || status !== "idle" || !input.trim()}
                >
                  {t("guide.send")}
                </button>
              </form>
              <p className="chat-scope-note">{t("guide.scope")}</p>
            </div>
          </div>
        </div>
      </section>
      <Footer total={games.length || undefined} />
    </>
  );
}
