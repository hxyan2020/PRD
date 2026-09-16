"use client";

import { useMemo, useState } from "react";
import { formatDateTime } from "@/lib/format";
import type { SourceHealth as Health, SourceStatus } from "@/lib/types";

const STATUS_CLASS: Record<Health, string> = {
  healthy: "text-ok",
  degraded: "text-warn",
  down: "text-down",
};

export function SourceHealth({ sources }: { sources: SourceStatus[] }) {
  const [status, setStatus] = useState<"all" | Health>("all");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    return sources.filter((source) => {
      if (status !== "all" && source.status !== status) return false;
      if (!query.trim()) return true;
      const hay = `${source.name} ${source.kind} ${source.jurisdictions.join(" ")}`.toLowerCase();
      return hay.includes(query.trim().toLowerCase());
    });
  }, [query, sources, status]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["all", "healthy", "degraded", "down"] as const).map((entry) => (
          <button
            key={entry}
            type="button"
            onClick={() => setStatus(entry)}
            className={`rounded-full border px-3 py-1.5 text-sm ${
              status === entry ? "border-gold text-gold" : "border-line text-muted"
            }`}
          >
            {entry}
          </button>
        ))}
      </div>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search source, kind, or jurisdiction"
        className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-gold/50"
      />
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
