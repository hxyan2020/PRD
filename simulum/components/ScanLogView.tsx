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
    <section className="pt-4 sm:pt-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-signal">
        {t("scanLog.schedule")}
      </p>
      <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">{t("scanLog.title")}</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">{t("scanLog.blurb")}</p>
      <p className="mt-4 font-mono text-xs text-mist">
        {schedule.label} · cron UTC `{schedule.cronUtc}` · {schedule.localTime}{" "}
        {schedule.timezone}
      </p>

      {runs.length === 0 ? (
        <p className="mt-10 text-mist">{t("scanLog.empty")}</p>
      ) : (
        <ul className="mt-8 divide-y divide-line/70 border-y border-line/70">
          {runs.map((run) => (
            <li key={run.id} className="py-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
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
              <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-wider text-mist">
                    {t("scanLog.sourcesScanned")}
                  </dt>
                  <dd className="mt-1 font-mono text-lg tabular-nums text-ink">
                    {run.sourcesScanned}
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-wider text-mist">
                    {t("scanLog.relevant")}
                  </dt>
                  <dd className="mt-1 font-mono text-lg tabular-nums text-ink">
                    {run.relevantSourced}
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-wider text-mist">
                    {t("scanLog.inserted")}
                  </dt>
                  <dd className="mt-1 font-mono text-lg tabular-nums text-ink">
                    {run.inserted}
                  </dd>
                </div>
                <div>
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
