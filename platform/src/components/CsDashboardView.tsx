"use client";

import Link from "next/link";
import { Headphones, ScrollText, TableProperties } from "lucide-react";
import { Badge, StatCard, StatusBadge } from "@/components/ui";
import { useT } from "@/hooks/useUiLocale";
import type { CsCountBucket, CsDashboard, CsDashRow } from "@/lib/cs/analytics";
import type { CsOpsContract } from "@/lib/cs/ops-data";

function BucketList({ rows, empty }: { rows: CsCountBucket[]; empty: string }) {
  if (!rows.length) return <p className="text-sm text-[var(--muted)]">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <li key={row.key} className="text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate font-medium">{row.key}</span>
            <span className="tabular-nums text-[var(--muted)]">{row.count}</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-teal-600"
              style={{ width: `${Math.max(8, (row.count / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function RequestTable({ rows, empty }: { rows: CsDashRow[]; empty: string }) {
  const { t } = useT();
  if (!rows.length) return <p className="text-sm text-[var(--muted)]">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-[0.08em] text-[var(--muted)]">
            <th className="py-2 pr-3">{t("cs.dash.colId")}</th>
            <th className="py-2 pr-3">{t("cs.dash.colSubject")}</th>
            <th className="py-2 pr-3">{t("common.channel")}</th>
            <th className="py-2 pr-3">{t("cs.dash.colDesk")}</th>
            <th className="py-2 pr-3">{t("common.status")}</th>
            <th className="py-2">{t("cs.skill")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
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
              <td className="py-2 pr-3">{row.channel}</td>
              <td className="py-2 pr-3">{row.desk}</td>
              <td className="py-2 pr-3">
                <div className="flex flex-wrap items-center gap-1">
                  <StatusBadge value={row.status} />
                  {row.waiting ? <Badge className="bg-amber-50 text-amber-900 border-amber-200">WAITING</Badge> : null}
                </div>
              </td>
              <td className="py-2 font-mono text-xs">{row.skill_code || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CsDashboardView({ data, ops }: { data: CsDashboard; ops?: CsOpsContract }) {
  const { t } = useT();
  const s = data.summary;
  return (
    <div data-testid="cs-dashboard">
      <p className="mb-3 text-sm text-[var(--muted)]">
        <THint />
      </p>
      <div className="mb-4 flex flex-wrap gap-2">
        <Link className="btn" href="/admin/cs-desk">
          <Headphones className="mr-1 h-4 w-4" aria-hidden />
          {t("home.csDeskCta")}
        </Link>
        <Link className="btn" href="/admin/cs-log">
          <ScrollText className="mr-1 h-4 w-4" aria-hidden />
          {t("cs.log.open")}
        </Link>
        <Link className="btn" href="/admin/cs-data">
          <TableProperties className="mr-1 h-4 w-4" aria-hidden />
          {t("cs.data.open")}
        </Link>
      </div>
      {ops ? (
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4" data-testid="cs-dash-ops">
          <div className="panel p-3 text-sm">
            <div className="text-[10px] uppercase tracking-[0.08em] text-[var(--muted)]">{t("cs.data.cap")}</div>
            <div className="font-semibold tabular-nums">{ops.params.followup_cap}</div>
          </div>
          <div className="panel p-3 text-sm">
            <div className="text-[10px] uppercase tracking-[0.08em] text-[var(--muted)]">{t("cs.data.teams")}</div>
            <div className="font-semibold">{ops.teams.map((x) => x.name).join(" · ")}</div>
          </div>
          <div className="panel p-3 text-sm">
            <div className="text-[10px] uppercase tracking-[0.08em] text-[var(--muted)]">{t("cs.data.routes")}</div>
            <div className="font-mono text-xs">{ops.routes.map((r) => r.route_code).join(" · ")}</div>
          </div>
          <div className="panel p-3 text-sm">
            <div className="text-[10px] uppercase tracking-[0.08em] text-[var(--muted)]">{t("cs.data.mailboxes")}</div>
            <div className="font-mono text-xs break-all">{ops.params.mailbox_support}</div>
          </div>
        </div>
      ) : null}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        <StatCard label={t("cs.dash.total")} value={s.total} hint={t("cs.dash.totalHint")} />
        <StatCard label={t("cs.dash.openCount")} value={s.open} href="/admin/cs-desk" />
        <StatCard label={t("cs.dash.resolved")} value={s.resolved} href="/admin/cs-log" />
        <StatCard label={t("cs.dash.waiting")} value={s.waiting} tone={s.waiting ? "alert" : "default"} hint={t("cs.dash.waitingHint")} />
        <StatCard label={t("cs.dash.tr")} value={s.assigned_tr} hint={t("cs.dash.trHint")} />
        <StatCard label={t("cs.dash.risk")} value={s.escalated_risk} hint={t("cs.dash.riskHint")} />
        <StatCard label={t("cs.dash.cap3")} value={s.cap3} tone={s.cap3 ? "alert" : "default"} hint={t("cs.dash.cap3Hint")} />
        <StatCard label={t("cs.dash.idVerify")} value={s.id_verify} />
        <StatCard label={t("cs.dash.awaiting")} value={s.awaiting_client} />
        <StatCard label={t("cs.dash.pocReview")} value={s.poc_review} hint={t("cs.dash.pocHint")} />
        <StatCard label={t("cs.dash.aiReplied")} value={s.ai_replied} hint={t("cs.dash.aiHint")} />
        <StatCard label={t("cs.dash.csDesk")} value={s.cs_desk} />
        <StatCard label={t("cs.dash.trDesk")} value={s.tr_desk} />
      </div>
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        <section className="panel p-4">
          <h2 className="mb-3 text-sm font-semibold">{t("cs.dash.byChannel")}</h2>
          <BucketList rows={data.by_channel} empty={t("cs.dash.empty")} />
        </section>
        <section className="panel p-4">
          <h2 className="mb-3 text-sm font-semibold">{t("cs.dash.byStatus")}</h2>
          <BucketList rows={data.by_status} empty={t("cs.dash.empty")} />
        </section>
        <section className="panel p-4">
          <h2 className="mb-3 text-sm font-semibold">{t("cs.dash.bySkill")}</h2>
          <BucketList rows={data.by_skill} empty={t("cs.dash.empty")} />
        </section>
        <section className="panel p-4">
          <h2 className="mb-3 text-sm font-semibold">{t("cs.dash.byDesk")}</h2>
          <BucketList rows={data.by_desk} empty={t("cs.dash.empty")} />
        </section>
        <section className="panel p-4">
          <h2 className="mb-3 text-sm font-semibold">{t("cs.dash.byClarity")}</h2>
          <BucketList rows={data.by_clarity} empty={t("cs.dash.empty")} />
        </section>
        <section className="panel p-4">
          <h2 className="mb-3 text-sm font-semibold">{t("cs.dash.bySeverity")}</h2>
          <BucketList rows={data.by_severity} empty={t("cs.dash.empty")} />
        </section>
      </div>
      <section className="panel mb-4 p-4">
        <h2 className="mb-3 text-sm font-semibold">{t("cs.dash.waitingList")}</h2>
        <RequestTable rows={data.waiting} empty={t("cs.dash.waitingEmpty")} />
      </section>
      <section className="panel p-4">
        <h2 className="mb-3 text-sm font-semibold">{t("cs.dash.recent")}</h2>
        <RequestTable rows={data.recent} empty={t("cs.dash.empty")} />
      </section>
    </div>
  );
}

function THint() {
  const { t } = useT();
  return <>{t("cs.dash.hint")}</>;
}
