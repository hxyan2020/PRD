"use client";

import {
  GUIDE_INTRO,
  GUIDE_SECTIONS,
  GUIDE_SOURCES,
  METRICS,
  PHASES,
  SCORECARD_HINTS,
} from "@/lib/data/lp-quality-testing";
import { useI18n } from "@/lib/i18n/context";

export function TestingGuide() {
  const { t, locale } = useI18n();
  const zh = locale === "zh-CN";

  return (
    <div className="space-y-8">
      <header className="panel relative overflow-hidden px-5 py-8 sm:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 overflow-hidden">
          <div className="h-full w-1/3 bg-teal/70 animate-scan" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">
          {t("nav.testing")}
        </p>
        <h1 className="mt-2 max-w-3xl font-display text-3xl leading-tight text-navy sm:text-5xl">
          {zh ? GUIDE_INTRO.titleZh : GUIDE_INTRO.titleEn}
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-mist sm:text-base">
          {zh ? GUIDE_INTRO.leadZh : GUIDE_INTRO.leadEn}
        </p>
        <p className="mt-3 text-xs text-mist">
          {t("testing.updated")} {GUIDE_INTRO.updatedAt} · {t("testing.researchNote")}
        </p>
      </header>

      <nav className="panel flex flex-wrap gap-2 px-4 py-3 text-sm">
        {GUIDE_SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="rounded-lg border border-line bg-white px-3 py-1.5 text-navy-2 hover:border-teal hover:text-teal"
          >
            {zh ? s.titleZh : s.titleEn}
          </a>
        ))}
        <a
          href="#metrics"
          className="rounded-lg border border-line bg-white px-3 py-1.5 text-navy-2 hover:border-teal hover:text-teal"
        >
          {t("testing.metrics")}
        </a>
        <a
          href="#phases"
          className="rounded-lg border border-line bg-white px-3 py-1.5 text-navy-2 hover:border-teal hover:text-teal"
        >
          {t("testing.phases")}
        </a>
        <a
          href="#scorecard"
          className="rounded-lg border border-line bg-white px-3 py-1.5 text-navy-2 hover:border-teal hover:text-teal"
        >
          {t("testing.scorecard")}
        </a>
      </nav>

      <div className="space-y-5">
        {GUIDE_SECTIONS.map((s) => (
          <section key={s.id} id={s.id} className="panel scroll-mt-24 p-5 sm:p-6">
            <h2 className="font-display text-2xl text-navy">
              {zh ? s.titleZh : s.titleEn}
            </h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-navy-2">
              {(zh ? s.bodyZh : s.bodyEn).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section id="metrics" className="panel scroll-mt-24 overflow-hidden">
        <div className="border-b border-line px-5 py-4">
          <h2 className="font-display text-2xl text-navy">{t("testing.metrics")}</h2>
          <p className="mt-1 text-sm text-mist">{t("testing.metricsSub")}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate/50 text-xs uppercase tracking-wide text-mist">
              <tr>
                <th className="px-4 py-3">{t("testing.col.metric")}</th>
                <th className="px-4 py-3">{t("testing.col.what")}</th>
                <th className="px-4 py-3">{t("testing.col.how")}</th>
                <th className="px-4 py-3">{t("testing.col.target")}</th>
              </tr>
            </thead>
            <tbody>
              {METRICS.map((m) => (
                <tr key={m.metricEn} className="border-t border-line/70 align-top">
                  <td className="px-4 py-3 font-semibold text-navy">
                    {zh ? m.metricZh : m.metricEn}
                  </td>
                  <td className="px-4 py-3 text-navy-2">{zh ? m.whatZh : m.whatEn}</td>
                  <td className="px-4 py-3 text-navy-2">{zh ? m.howZh : m.howEn}</td>
                  <td className="px-4 py-3 text-mist">{zh ? m.targetZh : m.targetEn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="phases" className="panel scroll-mt-24 p-5 sm:p-6">
        <h2 className="font-display text-2xl text-navy">{t("testing.phases")}</h2>
        <p className="mt-1 text-sm text-mist">{t("testing.phasesSub")}</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {PHASES.map((p) => (
            <article key={p.phaseEn} className="rounded-xl border border-line bg-foam/70 p-4">
              <h3 className="font-display text-xl text-navy">
                {zh ? p.phaseZh : p.phaseEn}
              </h3>
              <p className="mt-1 text-sm text-teal">
                {zh ? p.goalZh : p.goalEn}
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-navy-2">
                {(zh ? p.actionsZh : p.actionsEn).map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section id="scorecard" className="panel scroll-mt-24 p-5 sm:p-6">
        <h2 className="font-display text-2xl text-navy">
          {zh ? SCORECARD_HINTS.titleZh : SCORECARD_HINTS.titleEn}
        </h2>
        <p className="mt-2 text-sm text-mist">{t("testing.scorecardSub")}</p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-navy-2">
          {(zh ? SCORECARD_HINTS.itemsZh : SCORECARD_HINTS.itemsEn).map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      </section>

      <section className="panel p-5 sm:p-6">
        <h2 className="font-display text-2xl text-navy">{t("testing.sources")}</h2>
        <p className="mt-1 text-sm text-mist">{t("testing.sourcesSub")}</p>
        <ul className="mt-4 space-y-2 text-sm">
          {GUIDE_SOURCES.map((s) => (
            <li key={s.url}>
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="text-teal underline decoration-teal/30 hover:decoration-teal"
              >
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
