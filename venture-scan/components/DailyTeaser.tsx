"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
        const res = await fetch("/api/daily", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile }),
        });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;
        setTitle(data.recommendation.idea.name);
        setScore(data.recommendation.match.score);
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
      <div className="flex flex-col gap-3 border-y border-white/10 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-celadon">
            {t("teaser.kicker")}
          </p>
          <p className="mt-1 text-sm text-mist">
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
        <Link href={ready ? "/today" : "/match"} className="btn-ghost shrink-0">
          {ready ? t("teaser.open") : t("teaser.build")}
        </Link>
      </div>
    </section>
  );
}
