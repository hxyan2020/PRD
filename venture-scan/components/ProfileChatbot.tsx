"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { IndustryIcon } from "@/components/IndustryIcon";
import { ProfileBubbleField } from "@/components/ProfileBubbleField";
import { SectorLabel } from "@/components/SectorLabel";
import { authMe, matchProfile } from "@/lib/client-api";
import { useI18n } from "@/lib/i18n/context";
import { localizeIdea } from "@/lib/i18n/localize-idea";
import { presentMatch } from "@/lib/i18n/present-match";
import {
  BUSINESS_BUBBLES,
  DOMAIN_BUBBLES,
  MAJOR_BUBBLES,
  MARKET_BUBBLES,
  SKILL_BUBBLES,
} from "@/lib/profile-options";
import {
  clearProfileStorage,
  emptyProfile,
  isProfileReady,
  loadProfileFromStorage,
  parseListInput,
  saveProfileToStorage,
} from "@/lib/profile";
import type { IdeaMatch, StartupIdea, UserProfile } from "@/lib/types";

type Ranked = { idea: StartupIdea; match: IdeaMatch };

type ProfileChatbotProps = {
  onProfileSaved?: () => void;
};

export function ProfileChatbot({ onProfileSaved }: ProfileChatbotProps = {}) {
  const { t, locale } = useI18n();
  const [profile, setProfile] = useState<UserProfile>(() => emptyProfile());
  const [hydrated, setHydrated] = useState(false);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [loginPrompt, setLoginPrompt] = useState(false);
  const [ranking, setRanking] = useState(false);
  const [ranked, setRanked] = useState<Ranked[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [skillsDraft, setSkillsDraft] = useState("");
  const [majorDraft, setMajorDraft] = useState("");
  const [businessDraft, setBusinessDraft] = useState("");
  const [domainsDraft, setDomainsDraft] = useState("");
  const [marketsDraft, setMarketsDraft] = useState("");

  const locked = loggedIn === false;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const me = await authMe();
      if (cancelled) return;
      setLoggedIn(Boolean(me));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const saved = loadProfileFromStorage();
    if (saved) {
      setProfile(saved);
      setNameDraft(saved.displayName);
      if (isProfileReady(saved)) void runMatch(saved);
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const topMatches = useMemo(() => ranked.slice(0, 5), [ranked]);
  const ready = isProfileReady(profile);

  function requireLogin() {
    setLoginPrompt(true);
    if (typeof document !== "undefined") {
      requestAnimationFrame(() => {
        document.getElementById("profile-login-gate")?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      });
    }
  }

  function updateProfile(next: UserProfile) {
    setProfile(next);
    if (loggedIn) {
      saveProfileToStorage(next);
    }
  }

  function toggleInList(list: string[], label: string, multi: boolean): string[] {
    const exists = list.some((x) => x.toLowerCase() === label.toLowerCase());
    if (!multi) return exists ? [] : [label];
    if (exists) return list.filter((x) => x.toLowerCase() !== label.toLowerCase());
    return [...list, label];
  }

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

  async function saveAndMatch() {
    if (locked) {
      requireLogin();
      return;
    }
    if (!isProfileReady(profile)) {
      setError(t("match.needMore"));
      return;
    }
    const next = {
      ...profile,
      displayName: nameDraft.trim() || profile.displayName,
      updatedAt: new Date().toISOString(),
    };
    saveProfileToStorage(next);
    setProfile(next);
    await runMatch(next);
    onProfileSaved?.();
  }

  function resetForm() {
    if (locked) {
      requireLogin();
      return;
    }
    clearProfileStorage();
    const fresh = emptyProfile();
    setProfile(fresh);
    setNameDraft("");
    setSkillsDraft("");
    setMajorDraft("");
    setBusinessDraft("");
    setDomainsDraft("");
    setMarketsDraft("");
    setRanked([]);
    setError(null);
    setLoginPrompt(false);
  }

  if (!hydrated || loggedIn === null) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-mist sm:px-6">
        {t("match.loading")}
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-5 px-4 py-6 sm:gap-8 sm:px-6 sm:py-10 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="rounded-2xl border border-black/10 bg-ink-2/60 shadow-panel">
        <div className="border-b border-black/10 px-4 py-4 sm:px-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-celadon">
            {t("match.kicker")}
          </p>
          <h1 className="mt-1 font-display text-2xl text-foam sm:text-3xl">{t("match.title")}</h1>
          <p className="mt-2 text-sm text-mist">{t("match.body")}</p>
        </div>

        <div className="space-y-8 px-4 py-5 sm:px-5 sm:py-6">
          {loginPrompt ? (
            <div
              id="profile-login-gate"
              role="status"
              className="rounded-xl border border-copper/25 bg-copper/10 px-4 py-3 text-sm text-foam"
            >
              <p className="font-medium">{t("match.loginTitle")}</p>
              <p className="mt-1 text-mist">{t("match.loginBody")}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/account?mode=login" className="btn-primary btn-block-mobile">
                  {t("auth.login")}
                </Link>
                <Link href="/account" className="btn-ghost btn-block-mobile">
                  {t("nav.register")}
                </Link>
              </div>
            </div>
          ) : null}

          <fieldset className="space-y-3">
            <legend className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist">
              {t("match.name")}
            </legend>
            <input
              className="field"
              value={nameDraft}
              placeholder={t("match.namePlaceholder")}
              autoComplete="nickname"
              onFocus={() => {
                if (locked) requireLogin();
              }}
              onChange={(e) => {
                if (locked) {
                  requireLogin();
                  return;
                }
                setNameDraft(e.target.value);
                updateProfile({ ...profile, displayName: e.target.value });
              }}
              onKeyDown={(e) => {
                if (locked && e.key !== "Tab") {
                  e.preventDefault();
                  requireLogin();
                }
              }}
            />
          </fieldset>

          <ProfileBubbleField
            label={t("match.skills")}
            hint={t("match.skillsHint")}
            bubbles={SKILL_BUBBLES}
            selected={profile.skills}
            draft={skillsDraft}
            onDraftChange={setSkillsDraft}
            multi
            locked={locked}
            onLockedAttempt={requireLogin}
            placeholder={t("match.skillsPlaceholder")}
            actionLabel={t("match.add")}
            onToggleBubble={(label) =>
              updateProfile({
                ...profile,
                skills: toggleInList(profile.skills, label, true),
              })
            }
            onAddCustom={() => {
              const added = parseListInput(skillsDraft);
              if (!added.length) return;
              const next = [...profile.skills];
              for (const item of added) {
                if (!next.some((x) => x.toLowerCase() === item.toLowerCase())) next.push(item);
              }
              updateProfile({ ...profile, skills: next });
              setSkillsDraft("");
            }}
          />

          <ProfileBubbleField
            label={t("match.major")}
            hint={t("match.majorHint")}
            bubbles={MAJOR_BUBBLES}
            selected={profile.major ? [profile.major] : []}
            draft={majorDraft}
            onDraftChange={setMajorDraft}
            multi={false}
            locked={locked}
            onLockedAttempt={requireLogin}
            placeholder={t("match.majorPlaceholder")}
            actionLabel={t("match.set")}
            onToggleBubble={(label) =>
              updateProfile({
                ...profile,
                major: profile.major.toLowerCase() === label.toLowerCase() ? "" : label,
              })
            }
            onAddCustom={() => {
              const value = majorDraft.trim();
              if (!value) return;
              updateProfile({ ...profile, major: value });
              setMajorDraft("");
            }}
          />

          <ProfileBubbleField
            label={t("match.business")}
            hint={t("match.businessHint")}
            bubbles={BUSINESS_BUBBLES}
            selected={profile.currentBusiness ? [profile.currentBusiness] : []}
            draft={businessDraft}
            onDraftChange={setBusinessDraft}
            multi={false}
            locked={locked}
            onLockedAttempt={requireLogin}
            placeholder={t("match.businessPlaceholder")}
            actionLabel={t("match.set")}
            onToggleBubble={(label) =>
              updateProfile({
                ...profile,
                currentBusiness:
                  profile.currentBusiness.toLowerCase() === label.toLowerCase() ? "" : label,
              })
            }
            onAddCustom={() => {
              const value = businessDraft.trim();
              if (!value) return;
              updateProfile({ ...profile, currentBusiness: value });
              setBusinessDraft("");
            }}
          />

          <ProfileBubbleField
            label={t("match.domains")}
            hint={t("match.domainsHint")}
            bubbles={DOMAIN_BUBBLES}
            selected={profile.interestedDomains}
            draft={domainsDraft}
            onDraftChange={setDomainsDraft}
            multi
            locked={locked}
            onLockedAttempt={requireLogin}
            placeholder={t("match.domainsPlaceholder")}
            actionLabel={t("match.add")}
            onToggleBubble={(label) =>
              updateProfile({
                ...profile,
                interestedDomains: toggleInList(profile.interestedDomains, label, true),
              })
            }
            onAddCustom={() => {
              const added = parseListInput(domainsDraft);
              if (!added.length) return;
              const next = [...profile.interestedDomains];
              for (const item of added) {
                if (!next.some((x) => x.toLowerCase() === item.toLowerCase())) next.push(item);
              }
              updateProfile({ ...profile, interestedDomains: next });
              setDomainsDraft("");
            }}
          />

          <ProfileBubbleField
            label={t("match.markets")}
            hint={t("match.marketsHint")}
            bubbles={MARKET_BUBBLES}
            selected={profile.preferredMarkets}
            draft={marketsDraft}
            onDraftChange={setMarketsDraft}
            multi
            locked={locked}
            onLockedAttempt={requireLogin}
            placeholder={t("match.marketsPlaceholder")}
            actionLabel={t("match.add")}
            onToggleBubble={(label) =>
              updateProfile({
                ...profile,
                preferredMarkets: toggleInList(profile.preferredMarkets, label, true),
              })
            }
            onAddCustom={() => {
              const added = parseListInput(marketsDraft);
              if (!added.length) return;
              const next = [...profile.preferredMarkets];
              for (const item of added) {
                if (!next.some((x) => x.toLowerCase() === item.toLowerCase())) next.push(item);
              }
              updateProfile({ ...profile, preferredMarkets: next });
              setMarketsDraft("");
            }}
          />
        </div>

        <div className="sticky bottom-0 border-t border-black/10 bg-ink-2/95 px-4 py-3 backdrop-blur sm:static sm:bg-transparent sm:px-5 sm:py-4 sm:backdrop-blur-none">
          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
            <button
              type="button"
              className="btn-primary btn-block-mobile"
              disabled={ranking}
              onClick={() => void saveAndMatch()}
            >
              {ranking ? t("match.scoring") : t("match.saveMatch")}
            </button>
            {ready ? (
              <button
                type="button"
                className="btn-ghost btn-block-mobile"
                onClick={() => void runMatch(profile)}
                disabled={locked || ranking}
              >
                {t("match.rematch")}
              </button>
            ) : null}
            <button type="button" className="btn-ghost btn-block-mobile" onClick={resetForm}>
              {t("match.rebuild")}
            </button>
            <Link href="/ideas" className="btn-ghost btn-block-mobile">
              {t("match.viewLedger")}
            </Link>
          </div>
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
                profile.interestedDomains.length ? profile.interestedDomains.join(", ") : "—"
              }
            />
            <ProfileRow
              label={t("match.markets")}
              value={
                profile.preferredMarkets.length ? profile.preferredMarkets.join(", ") : "—"
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

          {!ready && !ranked.length ? (
            <p className="mt-4 text-sm text-mist">{t("match.finishHint")}</p>
          ) : null}

          <ul className="mt-4 divide-y divide-black/10">
            {topMatches.map(({ idea, match }) => {
              const view = localizeIdea(idea, locale);
              const presented = presentMatch(match, view, profile, t, locale);
              return (
                <li key={idea.id} className="py-3">
                  <Link href={`/ideas/${idea.slug}`} scroll className="group block">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-xl text-foam group-hover:text-black">
                          {view.name}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-mist">
                          <span className="inline-flex min-w-0 max-w-full items-center gap-1.5">
                            <IndustryIcon
                              industry={idea.industry}
                              className="shrink-0 text-celadon"
                            />
                            <span className="truncate">{view.industry}</span>
                          </span>
                          <SectorLabel sector={idea.sector} label={view.sector} />
                        </div>
                      </div>
                      <ScorePill score={presented.score} />
                    </div>
                    {presented.matched[0] ? (
                      <p className="mt-2 text-xs text-celadon/90">
                        {t("today.matched")} · {presented.matched[0].dimension}:{" "}
                        {presented.matched[0].detail}
                      </p>
                    ) : null}
                    {presented.gaps[0] ? (
                      <p className="mt-1 text-xs text-mist">
                        {t("today.gaps")} · {presented.gaps[0].dimension}:{" "}
                        {presented.gaps[0].closeGap}
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
    score >= 70
      ? "border-celadon/40 bg-celadon/15 text-celadon"
      : score >= 40
        ? "border-copper/40 bg-copper/15 text-copper"
        : "border-black/15 bg-black/[0.04] text-mist";
  return (
    <span className={`shrink-0 rounded-full border px-2.5 py-1 font-mono text-xs ${tone}`}>
      {score}%
    </span>
  );
}
