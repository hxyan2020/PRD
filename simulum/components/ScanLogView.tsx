"use client";

import { useI18n } from "@/lib/i18n/context";

type Run = {
  id: string;
  startedAt: string;
  finishedAt: string;
  candidates: number;
  merged: number;
  inserted: number;
  sourcesScanned: number;
  relevantSourced: number;
  source: string;
  notes: string;
  scheduleLabel: string;
};

export function ScanLogView({
  runs,
  schedule,
}: {
  runs: Run[];
  schedule: {
    label: string;
    localTime: string;
    timezone: string;
    cronUtc: string;
  };
}) {
  const { t, locale } = useI18n();

  return (
    <section className="pt-2 sm:pt-8">
      <p className="hud-label">{t("scanLog.schedule")}</p>
      <h1 className="mt-2 font-display text-[2rem] font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
        {t("scanLog.title")}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft sm:text-base">
        {t("scanLog.blurb")}
      </p>
      <p className="mt-4 break-words font-mono text-[11px] leading-relaxed text-mist sm:text-xs">
        {schedule.label} · cron UTC `{schedule.cronUtc}` · {schedule.localTime}{" "}
        {schedule.timezone}
      </p>

      {runs.length === 0 ? (
        <p className="mt-10 text-mist">{t("scanLog.empty")}</p>
      ) : (
        <ul className="mt-6 divide-y divide-line border-y border-line sm:mt-8">
          {runs.map((run) => (
            <li key={run.id} className="py-4 sm:py-5">
              <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between sm:gap-2">
                <p className="font-mono text-sm text-ink">
                  {new Date(run.finishedAt).toLocaleString(locale, {
                    timeZone: "Asia/Singapore",
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}{" "}
                  (Asia/Singapore)
                </p>
                <p className="font-mono text-[11px] uppercase tracking-wider text-mist">
                  {run.scheduleLabel || run.source}
                </p>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4">
                <div className="mech-frame bg-signal-soft p-3">
                  <dt className="font-mono text-[10px] uppercase tracking-wider text-signal">
                    {t("scanLog.sourcesScanned")}
                  </dt>
                  <dd className="mt-1 font-display text-2xl tabular-nums text-ink sm:text-3xl">
                    {run.sourcesScanned}
                  </dd>
                </div>
                <div className="mech-frame bg-ember-soft p-3">
                  <dt className="font-mono text-[10px] uppercase tracking-wider text-ember">
                    {t("scanLog.relevant")}
                  </dt>
                  <dd className="mt-1 font-display text-2xl tabular-nums text-ink sm:text-3xl">
                    {run.relevantSourced}
                  </dd>
                </div>
                <div className="border border-line/80 bg-panel/40 p-3">
                  <dt className="font-mono text-[10px] uppercase tracking-wider text-mist">
                    {t("scanLog.inserted")}
                  </dt>
                  <dd className="mt-1 font-mono text-lg tabular-nums text-ink">
                    {run.inserted}
                  </dd>
                </div>
                <div className="border border-line/80 bg-panel/40 p-3">
                  <dt className="font-mono text-[10px] uppercase tracking-wider text-mist">
                    {t("scanLog.merged")}
                  </dt>
                  <dd className="mt-1 font-mono text-lg tabular-nums text-ink">
                    {run.merged}
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
