"use client";

import { formatDateTime, healthLabel, sourceKindLabel } from "@/lib/format";
import { sourceName } from "@/lib/i18n/catalog";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { navigateQuery, queryHref, useQueryParams } from "@/lib/queryNav";
import type { SourceHealth as Health, SourceStatus } from "@/lib/types";
import { CountryLabelList } from "./CountryLabel";
import { QueryLink } from "./QueryLink";

const STATUS_CLASS: Record<Health, string> = {
  healthy: "text-ok",
  degraded: "text-warn",
  down: "text-down",
};

function isHealth(value: string | null): value is Health {
  return value === "healthy" || value === "degraded" || value === "down";
}

export function SourcesView({ sources }: { sources: SourceStatus[] }) {
  const params = useQueryParams();
  const { locale, t } = useLocale();
  const status = isHealth(params.get("status")) ? params.get("status") : "all";
  const query = (params.get("q") ?? "").trim().toLowerCase();

  const rows = sources.filter((source) => {
    if (status !== "all" && source.status !== status) return false;
    if (!query) return true;
    const zh = sourceName(source.id, source.name, "zh");
    const hay = `${source.name} ${zh} ${source.kind} ${source.jurisdictions.join(" ")}`.toLowerCase();
    return hay.includes(query);
  });

  function href(nextStatus: string, nextQuery = params.get("q") ?? "") {
    return queryHref({
      view: "sources",
      status: nextStatus,
      q: nextQuery,
    });
  }

  return (
    <div className="space-y-4 md:space-y-5">
      <div>
        <h2 className="font-serif text-xl md:text-3xl">{t("sourcesTitle")}</h2>
        <p className="mt-2 hidden max-w-3xl text-sm text-muted md:block">{t("sourcesLede")}</p>
      </div>
      <p className="font-mono text-xs uppercase tracking-wide text-gold">
        {t("showingSources", { n: rows.length })}
        {status && status !== "all" ? ` · ${healthLabel(status, locale)}` : ""}
      </p>
      <div className="flex w-full gap-1.5 md:gap-2">
        {(["all", "healthy", "degraded", "down"] as const).map((entry) => (
          <QueryLink
            key={entry}
            href={href(entry)}
            className={`inline-flex min-h-10 flex-1 items-center justify-center rounded-full border px-2 text-[13px] md:min-h-0 md:flex-none md:px-3 md:py-2 md:text-sm ${
              status === entry ? "border-gold text-gold" : "border-line text-muted"
            }`}
          >
            {entry === "all" ? t("all") : healthLabel(entry, locale)}
          </QueryLink>
        ))}
      </div>
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          const value = String(new FormData(event.currentTarget).get("q") ?? "");
          navigateQuery(href(status ?? "all", value));
        }}
      >
        <input
          name="q"
          defaultValue={params.get("q") ?? ""}
          placeholder={t("searchSources")}
          className="min-w-0 w-full rounded-lg border border-line bg-panel px-3 py-2.5 text-sm outline-none focus:border-gold/50"
        />
        <button type="submit" className="min-h-10 shrink-0 rounded-lg border border-gold px-3 text-sm text-gold sm:min-h-0">
          {t("search")}
        </button>
      </form>
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-panel-2 font-mono text-[11px] uppercase tracking-wide text-muted">
            <tr>
              <th className="px-3 py-2">{t("source")}</th>
              <th className="hidden px-3 py-2 md:table-cell">{t("kind")}</th>
              <th className="hidden px-3 py-2 lg:table-cell">{t("jurisdictions")}</th>
              <th className="hidden px-3 py-2 lg:table-cell">{t("lastSourced")}</th>
              <th className="px-3 py-2">{t("status")}</th>
              <th className="hidden px-3 py-2 md:table-cell">{t("latency")}</th>
              <th className="px-3 py-2">{t("inWindow")}</th>
              <th className="hidden px-3 py-2 md:table-cell">{t("error")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((source) => (
              <tr key={source.id} className="border-t border-line align-top">
                <td className="px-3 py-2">
                  <div>{sourceName(source.id, source.name, locale)}</div>
                  <a
                    href={source.homepage}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-gold underline decoration-gold/30"
                  >
                    {t("homepage")}
                  </a>
                  <span className="text-muted"> · </span>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-muted underline"
                  >
                    {t("feed")}
                  </a>
                </td>
                <td className="hidden px-3 py-2 text-muted md:table-cell">{sourceKindLabel(source.kind, locale)}</td>
                <td className="hidden px-3 py-2 text-muted lg:table-cell">
                  <CountryLabelList names={source.jurisdictions} />
                </td>
                <td className="hidden px-3 py-2 font-mono text-xs lg:table-cell">
                  {formatDateTime(source.lastSourced, locale)}
                </td>
                <td className={`px-3 py-2 font-mono uppercase ${STATUS_CLASS[source.status]}`}>
                  {healthLabel(source.status, locale)}
                </td>
                <td className="hidden px-3 py-2 font-mono text-xs md:table-cell">
                  {source.latencyMs != null ? `${source.latencyMs} ms` : "—"}
                </td>
                <td className="px-3 py-2 font-mono">
                  {source.itemsInWindow}
                  <span className="text-muted">/{source.itemsFetched}</span>
                </td>
                <td className="hidden max-w-xs px-3 py-2 text-xs text-muted md:table-cell">{source.error ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
