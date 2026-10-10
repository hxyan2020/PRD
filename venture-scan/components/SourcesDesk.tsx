"use client";

import { useMemo, useState } from "react";
import {
  DATA_SOURCES,
  allCoveredCountries,
  sourceHealth,
  sourcesSummary,
  type DataSource,
  type SourceHealth,
} from "@/lib/data-sources";
import { Flag } from "@/components/Flag";
import { PlatformLogo } from "@/components/PlatformLogo";
import { relativeTime } from "@/lib/format";
import { countryToFlagCode } from "@/lib/flag-codes";
import { useI18n } from "@/lib/i18n/context";
import {
  localizeCountry,
  localizeRegion,
  localizeSource,
} from "@/lib/i18n/localize-source";

const HEALTH_ORDER: SourceHealth[] = ["healthy", "degraded", "stale", "offline"];

export function SourcesDesk() {
  const { t, locale } = useI18n();
  const kindLabel = (kind: DataSource["kind"]) => t(`sourceKind.${kind}`);
  const [region, setRegion] = useState("all");
  const [health, setHealth] = useState<"all" | SourceHealth>("all");
  const [q, setQ] = useState("");
  const now = useMemo(() => Date.now(), []);
  const summary = useMemo(() => sourcesSummary(now), [now]);
  const countries = useMemo(() => {
    const list = allCoveredCountries();
    return [...list].sort((a, b) =>
      localizeCountry(a, locale).localeCompare(localizeCountry(b, locale), locale),
    );
  }, [locale]);
  const regions = useMemo(
    () =>
      [...new Set(DATA_SOURCES.map((s) => s.region))].sort((a, b) =>
        localizeRegion(a, locale).localeCompare(localizeRegion(b, locale), locale),
      ),
    [locale],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return DATA_SOURCES.filter((source) => {
      const h = sourceHealth(source, now);
      if (health !== "all" && h !== health) return false;
      if (region !== "all" && source.region !== region) return false;
      if (!needle) return true;
      const view = localizeSource(source, locale);
      const hay = [
        source.name,
        source.language,
        view.language,
        source.languageNative ?? "",
        source.region,
        view.region,
        source.description,
        view.description,
        source.kind,
        ...source.countries,
        ...view.countries,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    }).sort((a, b) => {
      const ha = HEALTH_ORDER.indexOf(sourceHealth(a, now));
      const hb = HEALTH_ORDER.indexOf(sourceHealth(b, now));
      if (ha !== hb) return ha - hb;
      return b.lastSourcedAt.localeCompare(a.lastSourcedAt);
    });
  }, [q, region, health, now, locale]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="max-w-3xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-celadon sm:text-[11px]">
          {t("sources.kicker")}
        </p>
        <h1 className="mt-3 font-display text-4xl text-foam sm:text-5xl">
          {t("sources.title")}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-mist sm:text-base">
          {t("sources.body")}
        </p>
      </header>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label={t("sources.statSources")} value={String(summary.total)} />
        <Stat
          label={t("sources.statCountries")}
          value={String(summary.countries.length)}
        />
        <Stat
          label={t("sources.statLanguages")}
          value={String(summary.languages.length)}
        />
        <Stat
          label={t("sources.statHealthy")}
          value={`${summary.healthCounts.healthy}/${summary.total}`}
        />
      </div>

      <section className="mt-10">
        <h2 className="font-display text-2xl text-foam">{t("sources.coverage")}</h2>
        <p className="mt-2 text-sm text-mist">{t("sources.coverageBody")}</p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {countries.map((country) => {
            const label = localizeCountry(country, locale);
            return (
              <li
                key={country}
                className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 bg-black/[0.03] px-2.5 py-1.5 text-xs text-foam"
              >
                <Flag code={countryToFlagCode(country) ?? ""} title={label} size="sm" />
                {label}
              </li>
            );
          })}
        </ul>
      </section>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          className="field sm:min-w-[220px] sm:flex-1"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("sources.search")}
          aria-label={t("sources.search")}
        />
        <select
          className="field sm:w-auto"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          aria-label={t("sources.allRegions")}
        >
          <option value="all">{t("sources.allRegions")}</option>
          {regions.map((r) => (
            <option key={r} value={r}>
              {localizeRegion(r, locale)}
            </option>
          ))}
        </select>
        <select
          className="field sm:w-auto"
          value={health}
          onChange={(e) => setHealth(e.target.value as "all" | SourceHealth)}
          aria-label={t("sources.allHealth")}
        >
          <option value="all">{t("sources.allHealth")}</option>
          {HEALTH_ORDER.map((h) => (
            <option key={h} value={h}>
              {t(`sources.health.${h}`)}
            </option>
          ))}
        </select>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-mist">
          {t("sources.shown", { count: filtered.length })}
        </p>
      </div>

      <ul className="mt-6 space-y-3">
        {filtered.map((source) => {
          const status = sourceHealth(source, now);
          const view = localizeSource(source, locale);
          return (
            <li
              key={source.id}
              className="rounded-2xl border border-black/10 bg-ink-2/50 p-4 sm:p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <PlatformLogo sourceId={source.id} name={source.name} />
                    <h3 className="font-display text-xl text-foam">{source.name}</h3>
                    <HealthBadge health={status} label={t(`sources.health.${status}`)} />
                    <span className="rounded-md border border-black/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-mist">
                      {kindLabel(source.kind)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-mist">
                    {view.description}
                  </p>
                  <dl className="mt-3 grid gap-2 text-xs text-mist sm:grid-cols-2">
                    <div>
                      <dt className="font-mono uppercase tracking-[0.14em] text-mist/70">
                        {t("sources.language")}
                      </dt>
                      <dd className="mt-0.5 text-foam">
                        {view.language}
                        {source.languageNative ? ` · ${source.languageNative}` : ""}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-mono uppercase tracking-[0.14em] text-mist/70">
                        {t("sources.region")}
                      </dt>
                      <dd className="mt-0.5 text-foam">{view.region}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="font-mono uppercase tracking-[0.14em] text-mist/70">
                        {t("sources.countries")}
                      </dt>
                      <dd className="mt-1 flex flex-wrap gap-1.5">
                        {source.countries.map((c, i) => {
                          const label = view.countries[i] ?? localizeCountry(c, locale);
                          return (
                            <span
                              key={c}
                              className="inline-flex items-center gap-1.5 rounded-md bg-black/[0.04] px-2 py-1 text-foam"
                            >
                              <Flag code={countryToFlagCode(c) ?? ""} title={label} size="sm" />
                              <span>{label}</span>
                            </span>
                          );
                        })}
                      </dd>
                    </div>
                  </dl>
                  {view.notes ? (
                    <p className="mt-3 text-xs text-copper">{view.notes}</p>
                  ) : null}
                </div>
                <div className="shrink-0 rounded-xl border border-black/8 bg-black/[0.03] px-3 py-2 sm:min-w-[160px] sm:text-right">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-mist">
                    {t("sources.lastSourced")}
                  </p>
                  <p className="mt-1 text-sm text-foam">
                    {relativeTime(source.lastSourcedAt, now, t)}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] text-mist/70">
                    {new Date(source.lastSourcedAt).toISOString().replace(".000Z", "Z")}
                  </p>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex text-xs text-celadon underline-offset-2 hover:underline"
                  >
                    {t("sources.visit")}
                  </a>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {filtered.length === 0 ? (
        <p className="mt-8 text-sm text-mist">{t("sources.empty")}</p>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-black/[0.03] px-3 py-3 sm:px-4 sm:py-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-mist">{label}</p>
      <p className="mt-1 font-display text-2xl text-foam sm:text-3xl">{value}</p>
    </div>
  );
}

function HealthBadge({ health, label }: { health: SourceHealth; label: string }) {
  const tones: Record<SourceHealth, string> = {
    healthy: "border-celadon/50 bg-celadon/20 text-ink",
    degraded: "border-copper/40 bg-copper/10 text-copper",
    stale: "border-amber-700/30 bg-amber-500/10 text-amber-900",
    offline: "border-red-700/30 bg-red-500/10 text-red-800",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] ${tones[health]}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          health === "healthy"
            ? "bg-celadon"
            : health === "degraded"
              ? "bg-copper"
              : health === "stale"
                ? "bg-amber-300"
                : "bg-red-300"
        }`}
        aria-hidden
      />
      {label}
    </span>
  );
}
