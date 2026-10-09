"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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

type StepId =
  | "name"
  | "skills"
  | "major"
  | "business"
  | "domains"
  | "markets"
  | "done";

const STEPS: { id: StepId; prompt: string }[] = [
  {
    id: "name",
    prompt: "Hi — I'm the VentureScan matcher. What should I call you?",
  },
  {
    id: "skills",
    prompt:
      "What skills do you bring? List a few, separated by commas (e.g. product, sales, Python, supply chain).",
  },
  {
    id: "major",
    prompt: "What's your major or academic / professional background?",
  },
  {
    id: "business",
    prompt:
      "What is your current business, job, or venture focus? (If none yet, say what you're exploring.)",
  },
  {
    id: "domains",
    prompt:
      "Which domains interest you most? Comma-separated (e.g. health tech, climate, fintech, edtech).",
  },
  {
    id: "markets",
    prompt:
      "Any preferred markets or countries? Comma-separated, or type skip.",
  },
];

type Ranked = { idea: StartupIdea; match: IdeaMatch };

export function ProfileChatbot() {
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

  const step = STEPS[stepIndex] ?? null;
  const complete = stepIndex >= STEPS.length;

  useEffect(() => {
    const saved = loadProfileFromStorage();
    if (saved && isProfileReady(saved)) {
      setProfile(saved);
      setStepIndex(STEPS.length);
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
          text: STEPS[0].prompt,
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
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Match failed");
      const rows: Ranked[] = (data.ideas as (StartupIdea & { match: IdeaMatch })[])
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

  function applyAnswer(current: UserProfile, stepId: StepId, answer: string): UserProfile {
    const text = answer.trim();
    switch (stepId) {
      case "name":
        return { ...current, displayName: text === "skip" ? "" : text };
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

    const nextProfile = applyAnswer(profile, step.id, answer);
    const nextIndex = stepIndex + 1;
    setProfile(nextProfile);
    setStepIndex(nextIndex);

    if (nextIndex < STEPS.length) {
      setMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          role: "bot",
          text: STEPS[nextIndex].prompt,
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
        text: STEPS[0].prompt,
      },
    ]);
    queueMicrotask(() => inputRef.current?.focus());
  }

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-mist sm:px-6">
        Loading matcher…
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="flex min-h-[70vh] flex-col rounded-2xl border border-white/10 bg-ink-2/60 shadow-panel">
        <div className="border-b border-white/10 px-5 py-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-celadon">
            Profile chatbot
          </p>
          <h1 className="mt-1 font-display text-3xl text-foam">Build your match profile</h1>
          <p className="mt-2 text-sm text-mist">
            Skills, major, current business, interested domains — then we score each sourced idea.
          </p>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                m.role === "bot"
                  ? "bg-white/5 text-foam"
                  : "ml-auto bg-celadon/20 text-foam"
              }`}
            >
              {m.text}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-white/10 px-5 py-4">
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
                placeholder="Type your answer…"
                aria-label="Chat answer"
                autoComplete="off"
              />
              <button type="submit" className="btn-primary shrink-0">
                Send
              </button>
            </form>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-primary" onClick={() => void runMatch(profile)}>
                {ranking ? "Scoring…" : "Rematch ideas"}
              </button>
              <button type="button" className="btn-ghost" onClick={resetChat}>
                Rebuild profile
              </button>
              <Link href="/#ideas" className="btn-ghost">
                View ledger
              </Link>
            </div>
          )}
          {error ? <p className="mt-2 text-xs text-copper">{error}</p> : null}
        </div>
      </section>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-ink-2/60 p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-mist">
            Your profile
          </p>
          <dl className="mt-3 space-y-3 text-sm">
            <ProfileRow label="Name" value={profile.displayName || "—"} />
            <ProfileRow
              label="Skills"
              value={profile.skills.length ? profile.skills.join(", ") : "—"}
            />
            <ProfileRow label="Major" value={profile.major || "—"} />
            <ProfileRow label="Current business" value={profile.currentBusiness || "—"} />
            <ProfileRow
              label="Interested domains"
              value={
                profile.interestedDomains.length
                  ? profile.interestedDomains.join(", ")
                  : "—"
              }
            />
            <ProfileRow
              label="Preferred markets"
              value={
                profile.preferredMarkets.length
                  ? profile.preferredMarkets.join(", ")
                  : "—"
              }
            />
          </dl>
        </div>

        <div className="rounded-2xl border border-white/10 bg-ink-2/60 p-5">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-celadon">
                Matching scores
              </p>
              <h2 className="mt-1 font-display text-2xl text-foam">Top fits</h2>
            </div>
            <span className="font-mono text-[11px] text-mist">
              {ranking ? "…" : `${ranked.length || 0} scored`}
            </span>
          </div>

          {!complete && !ranked.length ? (
            <p className="mt-4 text-sm text-mist">
              Finish the chat and I'll rank every entrepreneurial idea against your profile.
            </p>
          ) : null}

          <ul className="mt-4 divide-y divide-white/10">
            {topMatches.map(({ idea, match }) => (
              <li key={idea.id} className="py-3">
                <Link href={`/ideas/${idea.slug}`} className="group block">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-xl text-foam group-hover:text-white">
                        {idea.name}
                      </h3>
                      <p className="mt-1 text-xs text-mist">
                        {idea.industry} · {idea.sector}
                      </p>
                    </div>
                    <ScorePill score={match.score} />
                  </div>
                  {match.matched[0] ? (
                    <p className="mt-2 text-xs text-celadon/90">{match.matched[0]}</p>
                  ) : null}
                  {match.gaps[0] ? (
                    <p className="mt-1 text-xs text-mist">{match.gaps[0]}</p>
                  ) : null}
                </Link>
              </li>
            ))}
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
      : "border-white/15 bg-white/5 text-mist";
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
