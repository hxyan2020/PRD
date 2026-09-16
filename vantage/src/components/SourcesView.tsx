"use client";

import { formatDateTime } from "@/lib/format";
import { navigateQuery, queryHref, useQueryParams } from "@/lib/queryNav";
import type { SourceHealth as Health, SourceStatus } from "@/lib/types";
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
  const status = isHealth(params.get("status")) ? params.get("status") : "all";
  const query = (params.get("q") ?? "").trim().toLowerCase();

  const rows = sources.filter((source) => {
    if (status !== "all" && source.status !== status) return false;
    if (!query) return true;
    const hay = `${source.name} ${source.kind} ${source.jurisdictions.join(" ")}`.toLowerCase();
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
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-3xl">Data sources & health</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          Every feed used by the daily scanner, with last-sourced time, HTTP
          status, latency, items fetched, items inside the current window, and
          health: healthy (parsed with dated items), degraded (reachable but
          empty/unusable), or down (timeout, HTTP error, or parse failure).
        </p>
      </div>
      <p className="font-mono text-xs uppercase tracking-wide text-gold">
        Showing {rows.length} sources{status !== "all" ? ` · ${status}` : ""}
      </p>
      <div className="flex flex-wrap gap-2">
        {(["all", "healthy", "degraded", "down"] as const).map((entry) => (
          <QueryLink
            key={entry}
            href={href(entry)}
            className={`rounded-full border px-3 py-1.5 text-sm ${
              status === entry ? "border-gold text-gold" : "border-line text-muted"
            }`}
          >
            {entry}
          </QueryLink>
        ))}
      </div>
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const value = String(new FormData(event.currentTarget).get("q") ?? "");
          navigateQuery(href(status ?? "all", value));
        }}
      >
        <input
          name="q"
          defaultValue={params.get("q") ?? ""}
          placeholder="Search source, kind, or jurisdiction"
          className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-gold/50"
        />
        <button type="submit" className="rounded-lg border border-gold px-3 text-sm text-gold">
          Search
        </button>
      </form>
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-panel-2 font-mono text-[11px] uppercase tracking-wide text-muted">
            <tr>
              <th className="px-3 py-2">Source</th>
              <th className="px-3 py-2">Kind</th>
              <th className="px-3 py-2">Jurisdictions</th>
              <th className="px-3 py-2">Last sourced</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Latency</th>
              <th className="px-3 py-2">In window</th>
              <th className="px-3 py-2">Error</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((source) => (
              <tr key={source.id} className="border-t border-line align-top">
                <td className="px-3 py-2">
                  <div>{source.name}</div>
                  <a
                    href={source.homepage}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-gold underline decoration-gold/30"
                  >
                    homepage
                  </a>
                  <span className="text-muted"> · </span>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-muted underline"
                  >
                    feed
                  </a>
                </td>
                <td className="px-3 py-2 text-muted">{source.kind.replace("_", " ")}</td>
                <td className="px-3 py-2 text-muted">{source.jurisdictions.join(", ")}</td>
                <td className="px-3 py-2 font-mono text-xs">
                  {formatDateTime(source.lastSourced)}
                </td>
                <td className={`px-3 py-2 font-mono uppercase ${STATUS_CLASS[source.status]}`}>
                  {source.status}
                </td>
                <td className="px-3 py-2 font-mono text-xs">
                  {source.latencyMs != null ? `${source.latencyMs} ms` : "—"}
                </td>
                <td className="px-3 py-2 font-mono">
                  {source.itemsInWindow}
                  <span className="text-muted">/{source.itemsFetched}</span>
                </td>
                <td className="max-w-xs px-3 py-2 text-xs text-muted">{source.error ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
