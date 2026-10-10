"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { matchProfile } from "@/lib/client-api";
import {
  assessAnswer,
  redirectMessageKey,
  type ChatStepId,
} from "@/lib/chat-guardrails";
import { useI18n } from "@/lib/i18n/context";
import { localizeIdea } from "@/lib/i18n/localize-idea";
import type { MessageKey } from "@/lib/i18n/messages";
import {
  clearProfileStorage,
  emptyProfile,
  isProfileReady,
  loadProfileFromStorage,
  parseListInput,
  saveProfileToStorage,
} from "@/lib/profile";
import type { IdeaMatch, StartupIdea, UserProfile } from "@/lib/types";

type ChatRole = "bot" | "user";
type ChatMessage = { id: string; role: ChatRole; text: string };

type StepId = ChatStepId | "done";

const STEP_DEFS: { id: ChatStepId; promptKey: MessageKey }[] = [
  { id: "name", promptKey: "match.step.name" },
  { id: "skills", promptKey: "match.step.skills" },
  { id: "major", promptKey: "match.step.major" },
  { id: "business", promptKey: "match.step.business" },
  { id: "domains", promptKey: "match.step.domains" },
  { id: "markets", promptKey: "match.step.markets" },
];

type Ranked = { idea: StartupIdea; match: IdeaMatch };

type ProfileChatbotProps = {
  /** Called after a profile is newly completed (or rematch finishes) so Today can show the pick. */
  onProfileSaved?: () => void;
};

export function ProfileChatbot({ onProfileSaved }: ProfileChatbotProps = {}) {
  const { t, locale } = useI18n();
  const [profile, setProfile] = useState<UserProfile>(() => emptyProfile());
  const [stepIndex, setStepIndex] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [ranking, setRanking] = useState(false);
  const [ranked, setRanked] = useState<Ranked[]>([]);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const step = STEP_DEFS[stepIndex] ?? null;
  const complete = stepIndex >= STEP_DEFS.length;

  useEffect(() => {
    const saved = loadProfileFromStorage();
    if (saved && isProfileReady(saved)) {
      setProfile(saved);
      setStepIndex(STEP_DEFS.length);
      setMessages([
        {
          id: "welcome-saved",
          role: "bot",
          text: `Welcome back${saved.displayName ? `, ${saved.displayName}` : ""}. I loaded your profile and can rematch ideas anytime.`,
        },
        {
          id: "summary-saved",
          role: "bot",
          text: summarizeProfile(saved),
        },
      ]);
      void runMatch(saved);
    } else {
      setMessages([
        {
          id: "welcome",
          role: "bot",
          text: t(STEP_DEFS[0].promptKey),
        },
      ]);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, ranked, ranking]);

  const topMatches = useMemo(() => ranked.slice(0, 5), [ranked]);

  async function runMatch(next: UserProfile) {
    if (!isProfileReady(next)) {
      setRanked([]);
      return;
    }
    setRanking(true);
    setError(null);
    try {
      const data = await matchProfile(next);
      const rows: Ranked[] = data.ideas
        .filter((row) => row.match)
        .map((row) => ({ idea: row, match: row.match }))
        .sort((a, b) => b.match.score - a.match.score);
      setRanked(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Match failed");
      setRanked([]);
    } finally {
      setRanking(false);
    }
  }

  function applyAnswer(current: UserProfile, stepId: ChatStepId, answer: string): UserProfile {
    const text = answer.trim();
    switch (stepId) {
      case "name":
        return { ...current, displayName: extractDisplayName(text) };
      case "skills":
        return { ...current, skills: parseListInput(text) };
      case "major":
        return { ...current, major: text === "skip" ? "" : text };
      case "business":
        return { ...current, currentBusiness: text === "skip" ? "" : text };
      case "domains":
        return { ...current, interestedDomains: parseListInput(text) };
      case "markets":
        return {
          ...current,
          preferredMarkets: text.toLowerCase() === "skip" ? [] : parseListInput(text),
        };
      default:
        return current;
    }
  }

  async function submit() {
    const answer = input.trim();
    if (!answer || !step) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text: answer,
    };
    setInput("");
    setMessages((prev) => [...prev, userMsg]);

    const assessment = assessAnswer(step.id, answer);
    if (!assessment.ok) {
      const redirectKey = redirectMessageKey(step.id, assessment.kind);
      setMessages((prev) => [
        ...prev,
        {
          id: `b-redirect-${Date.now()}`,
          role: "bot",
          text: `${t(redirectKey)}\n\n${t(step.promptKey)}`,
        },
      ]);
      queueMicrotask(() => inputRef.current?.focus());
      return;
    }

    const nextProfile = applyAnswer(profile, step.id, answer);
    const nextIndex = stepIndex + 1;
    setProfile(nextProfile);
    setStepIndex(nextIndex);

    if (nextIndex < STEP_DEFS.length) {
      setMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          role: "bot",
          text: t(STEP_DEFS[nextIndex].promptKey),
        },
      ]);
      queueMicrotask(() => inputRef.current?.focus());
      return;
    }

    const finished: UserProfile = {
      ...nextProfile,
      updatedAt: new Date().toISOString(),
    };
    saveProfileToStorage(finished);
    setProfile(finished);
    setMessages((prev) => [
      ...prev,
      {
        id: `b-summary-${Date.now()}`,
        role: "bot",
        text: `Got it. ${summarizeProfile(finished)} I'll score every sourced idea against this profile.`,
      },
    ]);
    await runMatch(finished);
  }

  function resetChat() {
    clearProfileStorage();
    const fresh = emptyProfile();
    setProfile(fresh);
    setStepIndex(0);
    setRanked([]);
    setError(null);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: "bot",
        text: t(STEP_DEFS[0].promptKey),
      },
    ]);
    queueMicrotask(() => inputRef.current?.focus());
  }

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-mist sm:px-6">
        {t("match.loading")}
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-5 px-4 py-6 sm:gap-8 sm:px-6 sm:py-10 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="flex min-h-[65vh] flex-col rounded-2xl border border-black/10 bg-ink-2/60 shadow-panel sm:min-h-[70vh]">
        <div className="border-b border-black/10 px-4 py-4 sm:px-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-celadon">
            {t("match.kicker")}
          </p>
          <h1 className="mt-1 font-display text-2xl text-foam sm:text-3xl">{t("match.title")}</h1>
          <p className="mt-2 text-sm text-mist">{t("match.body")}</p>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                m.role === "bot"
                  ? "bg-black/[0.04] text-foam"
                  : "ml-auto bg-celadon/20 text-foam"
              }`}
            >
              {m.text}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="sticky bottom-0 border-t border-black/10 bg-ink-2/95 px-4 py-3 backdrop-blur sm:static sm:bg-transparent sm:px-5 sm:py-4 sm:backdrop-blur-none">
          {!complete ? (
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
            >
              <input
                ref={inputRef}
                className="field"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("match.placeholder")}
                aria-label={t("match.placeholder")}
                autoComplete="off"
                enterKeyHint="send"
              />
              <button type="submit" className="btn-primary shrink-0">
                {t("match.send")}
              </button>
            </form>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
              {onProfileSaved ? (
                <button
                  type="button"
                  className="btn-primary btn-block-mobile"
                  onClick={() => onProfileSaved()}
                >
                  {t("teaser.open")}
                </button>
              ) : (
                <Link href="/today" className="btn-primary btn-block-mobile">
                  {t("teaser.open")}
                </Link>
              )}
              <button
                type="button"
                className="btn-ghost btn-block-mobile"
                onClick={() => void runMatch(profile)}
              >
                {ranking ? t("match.scoring") : t("match.rematch")}
              </button>
              <button type="button" className="btn-ghost btn-block-mobile" onClick={resetChat}>
                {t("match.rebuild")}
              </button>
              <Link href="/#ideas" className="btn-ghost btn-block-mobile">
                {t("match.viewLedger")}
              </Link>
            </div>
          )}
          {error ? <p className="mt-2 text-xs text-copper">{error}</p> : null}
        </div>
      </section>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-black/10 bg-ink-2/60 p-4 sm:p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-mist">
            {t("match.profile")}
          </p>
          <dl className="mt-3 space-y-3 text-sm">
            <ProfileRow label={t("match.name")} value={profile.displayName || "—"} />
            <ProfileRow
              label={t("match.skills")}
              value={profile.skills.length ? profile.skills.join(", ") : "—"}
            />
            <ProfileRow label={t("match.major")} value={profile.major || "—"} />
            <ProfileRow label={t("match.business")} value={profile.currentBusiness || "—"} />
            <ProfileRow
              label={t("match.domains")}
              value={
                profile.interestedDomains.length
                  ? profile.interestedDomains.join(", ")
                  : "—"
              }
            />
            <ProfileRow
              label={t("match.markets")}
              value={
                profile.preferredMarkets.length
                  ? profile.preferredMarkets.join(", ")
                  : "—"
              }
            />
          </dl>
        </div>

        <div className="rounded-2xl border border-black/10 bg-ink-2/60 p-5">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-celadon">
                {t("match.scores")}
              </p>
              <h2 className="mt-1 font-display text-2xl text-foam">{t("match.topFits")}</h2>
            </div>
            <span className="font-mono text-[11px] text-mist">
              {ranking ? "…" : `${ranked.length || 0}`}
            </span>
          </div>

          {!complete && !ranked.length ? (
            <p className="mt-4 text-sm text-mist">{t("match.finishHint")}</p>
          ) : null}

          <ul className="mt-4 divide-y divide-black/10">
            {topMatches.map(({ idea, match }) => {
              const view = localizeIdea(idea, locale);
              return (
              <li key={idea.id} className="py-3">
                <Link href={`/ideas/${idea.slug}`} className="group block">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-xl text-foam group-hover:text-black">
                        {view.name}
                      </h3>
                      <p className="mt-1 text-xs text-mist">
                        {view.industry} · {view.sector}
                      </p>
                    </div>
                    <ScorePill score={match.score} />
                  </div>
                  {match.matched[0] ? (
                    <p className="mt-2 text-xs text-celadon/90">
                      Matched · {match.matched[0].dimension}: {match.matched[0].detail}
                    </p>
                  ) : null}
                  {match.gaps[0] ? (
                    <p className="mt-1 text-xs text-mist">
                      Gap · {match.gaps[0].dimension}: {match.gaps[0].closeGap}
                    </p>
                  ) : null}
                </Link>
              </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-mist">{label}</dt>
      <dd className="mt-0.5 text-foam">{value}</dd>
    </div>
  );
}

function ScorePill({ score }: { score: number }) {
  const tone =
    score >= 70 ? "border-celadon/40 bg-celadon/15 text-celadon" : score >= 40
      ? "border-copper/40 bg-copper/15 text-copper"
      : "border-black/15 bg-black/[0.04] text-mist";
  return (
    <span className={`shrink-0 rounded-full border px-2.5 py-1 font-mono text-xs ${tone}`}>
      {score}%
    </span>
  );
}

function summarizeProfile(p: UserProfile): string {
  const bits = [
    p.skills.length ? `skills in ${p.skills.join(", ")}` : null,
    p.major ? `background in ${p.major}` : null,
    p.currentBusiness ? `currently focused on ${p.currentBusiness}` : null,
    p.interestedDomains.length ? `interested in ${p.interestedDomains.join(", ")}` : null,
    p.preferredMarkets.length ? `markets: ${p.preferredMarkets.join(", ")}` : null,
  ].filter(Boolean);
  return bits.length ? `Profile locked: ${bits.join("; ")}.` : "Profile is still thin.";
}

function extractDisplayName(raw: string): string {
  const titled = raw.match(
    /(?:i'?m|i am|my name is|this is|call me|i'm called)\s+(.+)$/i,
  );
  if (titled?.[1]) return titled[1].trim().replace(/[!！.。]+$/, "");
  return raw.trim();
}
