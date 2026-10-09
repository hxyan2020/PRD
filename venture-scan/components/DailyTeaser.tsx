"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchDaily } from "@/lib/client-api";
import { useI18n } from "@/lib/i18n/context";
import { isProfileReady, loadProfileFromStorage } from "@/lib/profile";

export function DailyTeaser() {
  const { t } = useI18n();
  const [ready, setReady] = useState(false);
  const [title, setTitle] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    const profile = loadProfileFromStorage();
    if (!profile || !isProfileReady(profile)) {
      setReady(false);
      return;
    }
    setReady(true);
    let cancelled = false;
    void (async () => {
      try {
        const daily = await fetchDaily(profile);
        if (!daily || cancelled) return;
        setTitle(daily.idea.name);
        setScore(daily.match.score);
      } catch {
        // Teaser is optional.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-6 sm:px-6">
      <div className="flex flex-col gap-3 border-y border-white/10 py-5 sm:flex-row sm:items-center sm:justify-between sm:py-6">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-celadon">
            {t("teaser.kicker")}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-mist">
            {ready && title ? (
              <span>
                {t("teaser.ready", {
                  title: `${title}${score != null ? ` · ${score}%` : ""}`,
                })}
              </span>
            ) : (
              t("teaser.needProfile")
            )}
          </p>
        </div>
        <Link href={ready ? "/today" : "/match"} className="btn-ghost btn-block-mobile shrink-0">
          {ready ? t("teaser.open") : t("teaser.build")}
        </Link>
      </div>
    </section>
  );
}
