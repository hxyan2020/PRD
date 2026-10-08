"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Headphones, LayoutDashboard, TableProperties } from "lucide-react";
import { Badge, StatusBadge } from "@/components/ui";
import { useT } from "@/hooks/useUiLocale";
import { CS_AUDIT_ACTIONS, type CsLog } from "@/lib/cs/analytics-shared";
import { phrase } from "@/lib/i18n";

export function CsLogView({ data }: { data: CsLog }) {
  const { t, locale } = useT();
  const [action, setAction] = useState("ALL");
  const [q, setQ] = useState("");
  const events = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return data.events.filter((row) => {
      if (action !== "ALL" && row.action !== action) return false;
      if (!needle) return true;
      const blob = `${row.action} ${row.actor} ${row.request_id} ${JSON.stringify(row.details)}`.toLowerCase();
      return blob.includes(needle);
    });
  }, [data.events, action, q]);

  return (
    <div data-testid="cs-log">
      <p className="mb-3 text-sm text-[var(--muted)]">{t("cs.log.hint")}</p>
      <div className="mb-4 action-row">
        <Link className="btn" href="/admin/cs-desk">
          <Headphones className="mr-1 h-4 w-4" aria-hidden />
          {t("home.csDeskCta")}
        </Link>
        <Link className="btn" href="/admin/cs-dashboard">
          <LayoutDashboard className="mr-1 h-4 w-4" aria-hidden />
          {t("cs.dash.open")}
        </Link>
        <Link className="btn" href="/admin/cs-data">
          <TableProperties className="mr-1 h-4 w-4" aria-hidden />
          {t("cs.data.open")}
        </Link>
      </div>
      <div className="panel mb-4 p-3 sm:p-4">
        <div className="mb-3 chip-scroller">
          <button
            type="button"
            className={`btn ${action === "ALL" ? "btn-primary" : ""}`}
            onClick={() => setAction("ALL")}
          >
            {t("common.all")}
          </button>
          {CS_AUDIT_ACTIONS.map((code) => (
            <button
              key={code}
              type="button"
              className={`btn ${action === code ? "btn-primary" : ""}`}
              onClick={() => setAction(code)}
            >
              {phrase(code, locale)}
            </button>
          ))}
        </div>
        <input
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          placeholder={t("cs.log.searchPh")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          data-testid="cs-log-filter"
        />
      </div>
      <section className="panel mb-4 p-4">
        <h2 className="mb-3 text-sm font-semibold">
          {t("cs.log.timeline")} · {events.length}
        </h2>
        {!events.length ? (
          <p className="text-sm text-[var(--muted)]">{t("cs.log.empty")}</p>
        ) : (
          <ol className="space-y-3">
            {events.map((row) => (
              <li key={row.id} className="rounded-xl border border-slate-100 bg-white/80 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-teal-50 text-teal-900 border-teal-200">{phrase(row.action, locale)}</Badge>
                  <span className="font-mono text-xs">{row.request_id}</span>
                  <span className="text-xs text-[var(--muted)]">{row.at}</span>
                </div>
                <div className="mt-1 text-sm">
                  <span className="text-[var(--muted)]">{t("common.actor")}: </span>
                  {row.actor}
                </div>
                {Object.keys(row.details).filter((k) => k !== "plane").length ? (
                  <pre className="mt-2 overflow-x-auto text-xs text-[var(--muted)]">
                    {JSON.stringify(
                      Object.fromEntries(Object.entries(row.details).filter(([k]) => k !== "plane")),
                      null,
                      2
                    )}
                  </pre>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </section>
      <section className="panel p-4">
        <h2 className="mb-3 text-sm font-semibold">{t("cs.log.resolved")}</h2>
        {!data.resolved.length ? (
          <p className="text-sm text-[var(--muted)]">{t("cs.log.resolvedEmpty")}</p>
        ) : (
          <>
            <ul className="space-y-2 sm:hidden" data-testid="cs-log-resolved-mobile">
              {data.resolved.map((row) => (
                <li key={row.id} className="rounded-xl border border-[var(--line)] p-3 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Link className="font-mono text-xs text-teal-800 underline" href="/admin/cs-desk">
                      {row.request_id}
                    </Link>
                    <StatusBadge value={row.status} />
                  </div>
                  <div className="font-medium break-word">{row.subject}</div>
                  <div className="text-xs text-[var(--muted)] break-word">
                    {row.client_name} · {row.desk}
                    {row.skill_code ? ` · ${row.skill_code}` : ""}
                  </div>
                </li>
              ))}
            </ul>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-[0.08em] text-[var(--muted)]">
                    <th className="py-2 pr-3">{t("cs.dash.colId")}</th>
                    <th className="py-2 pr-3">{t("cs.dash.colSubject")}</th>
                    <th className="py-2 pr-3">{t("cs.dash.colDesk")}</th>
                    <th className="py-2 pr-3">{t("common.status")}</th>
                    <th className="py-2">{t("cs.skill")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.resolved.map((row) => (
                    <tr key={row.id} className="border-t border-slate-100">
                      <td className="py-2 pr-3 font-mono text-xs">
                        <Link className="text-teal-800 underline" href="/admin/cs-desk">
                          {row.request_id}
                        </Link>
                      </td>
                      <td className="py-2 pr-3">
                        <div className="font-medium">{row.subject}</div>
                        <div className="text-xs text-[var(--muted)]">{row.client_name}</div>
                      </td>
                      <td className="py-2 pr-3">{row.desk}</td>
                      <td className="py-2 pr-3">
                        <StatusBadge value={row.status} />
                      </td>
                      <td className="py-2 font-mono text-xs">{row.skill_code || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
