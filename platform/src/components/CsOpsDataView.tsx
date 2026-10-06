"use client";

import Link from "next/link";
import { Building2, Database, GitBranch, Headphones, Settings, Users } from "lucide-react";
import { Badge } from "@/components/ui";
import { useT } from "@/hooks/useUiLocale";
import { phrase } from "@/lib/i18n";
import type { CsOpsContract } from "@/lib/cs/ops-data";

export function CsOpsDataView({ data }: { data: CsOpsContract }) {
  const { t, locale } = useT();
  const p = data.params;
  return (
    <div className="space-y-4" data-testid="cs-ops-data">
      <p className="text-sm text-[var(--muted)]">{t("cs.data.hint")}</p>
      <div className="flex flex-wrap gap-2">
        <Link className="btn" href="/admin/departments">
          <Building2 className="mr-1 h-4 w-4" aria-hidden />
          {t("cs.data.linkOrg")}
        </Link>
        <Link className="btn" href="/admin/escalation">
          <GitBranch className="mr-1 h-4 w-4" aria-hidden />
          {t("cs.data.linkEsc")}
        </Link>
        <Link className="btn" href="/admin/settings#settings-cs">
          <Settings className="mr-1 h-4 w-4" aria-hidden />
          {t("cs.data.linkSettings")}
        </Link>
        <Link className="btn" href="/admin/data-sources">
          <Database className="mr-1 h-4 w-4" aria-hidden />
          {t("cs.data.linkSources")}
        </Link>
        <Link className="btn" href="/admin/lark">
          {t("cs.data.linkLark")}
        </Link>
        <Link className="btn" href="/admin/cs-desk">
          <Headphones className="mr-1 h-4 w-4" aria-hidden />
          {t("home.csDeskCta")}
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <div className="panel p-3">
          <div className="text-[10px] uppercase tracking-[0.08em] text-[var(--muted)]">{t("cs.data.cap")}</div>
          <div className="mt-1 font-semibold tabular-nums">{p.followup_cap}</div>
        </div>
        <div className="panel p-3">
          <div className="text-[10px] uppercase tracking-[0.08em] text-[var(--muted)]">{t("cs.data.waitSla")}</div>
          <div className="mt-1 font-semibold tabular-nums">{p.wait_sla_minutes}m</div>
        </div>
        <div className="panel p-3">
          <div className="text-[10px] uppercase tracking-[0.08em] text-[var(--muted)]">{t("cs.data.kycSla")}</div>
          <div className="mt-1 font-semibold tabular-nums">{p.id_verify_sla_minutes}m</div>
        </div>
        <div className="panel p-3">
          <div className="text-[10px] uppercase tracking-[0.08em] text-[var(--muted)]">{t("cs.data.trSla")}</div>
          <div className="mt-1 font-semibold tabular-nums">{p.tr_sla_minutes}m</div>
        </div>
        <div className="panel p-3">
          <div className="text-[10px] uppercase tracking-[0.08em] text-[var(--muted)]">{t("cs.data.riskSla")}</div>
          <div className="mt-1 font-semibold tabular-nums">{p.risk_sla_minutes}m</div>
        </div>
        <div className="panel p-3">
          <div className="text-[10px] uppercase tracking-[0.08em] text-[var(--muted)]">{t("cs.data.token")}</div>
          <div className="mt-1 font-mono text-xs break-all">{p.intake_token}</div>
        </div>
        <div className="panel p-3">
          <div className="text-[10px] uppercase tracking-[0.08em] text-[var(--muted)]">{t("cs.data.autoMax")}</div>
          <div className="mt-1 font-semibold">{p.auto_reply_max_severity}</div>
        </div>
        <div className="panel p-3">
          <div className="text-[10px] uppercase tracking-[0.08em] text-[var(--muted)]">{t("cs.data.sensitive")}</div>
          <div className="mt-1 font-mono text-xs break-all">{p.sensitive_categories}</div>
        </div>
      </div>

      <section className="panel p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Building2 className="h-4 w-4" aria-hidden />
          {t("cs.data.bus")}
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {data.bus.map((bu) => (
            <div key={bu.code} className="rounded-lg border border-[var(--line)] p-3">
              <div className="font-semibold">{phrase(bu.name, locale)}</div>
              <div className="font-mono text-[11px] text-[var(--muted)]">{bu.code}</div>
              {bu.mandate ? <p className="mt-2 text-sm text-[var(--muted)]">{phrase(bu.mandate, locale)}</p> : null}
              <p className="mt-2 text-xs text-[var(--muted)]">
                {bu.team_count} {t("cs.data.teams")} · {bu.user_count} {t("cs.data.people")}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="panel p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Users className="h-4 w-4" aria-hidden />
          {t("cs.data.teams")}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-[0.08em] text-[var(--muted)]">
                <th className="py-2 pr-3">{t("cs.data.team")}</th>
                <th className="py-2 pr-3">{t("cs.data.bu")}</th>
                <th className="py-2 pr-3">{t("cs.data.lark")}</th>
                <th className="py-2 pr-3">{t("cs.data.rota")}</th>
                <th className="py-2">{t("cs.data.pocs")}</th>
              </tr>
            </thead>
            <tbody>
              {data.teams.map((team) => (
                <tr key={team.name} className="border-t border-slate-100 align-top">
                  <td className="py-2 pr-3">
                    <div className="font-medium">{phrase(team.name, locale)}</div>
                    {team.mission ? <div className="text-xs text-[var(--muted)]">{phrase(team.mission, locale)}</div> : null}
                  </td>
                  <td className="py-2 pr-3 font-mono text-xs">{team.department_code}</td>
                  <td className="py-2 pr-3 font-mono text-xs">{team.lark_chat_id || "—"}</td>
                  <td className="py-2 pr-3 text-xs">{team.on_call_rotation || "—"}</td>
                  <td className="py-2 text-xs">
                    {team.members.length
                      ? team.members.map((m) => (
                          <div key={m.email}>
                            {m.name} · {m.role_code}
                          </div>
                        ))
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <GitBranch className="h-4 w-4" aria-hidden />
          {t("cs.data.routes")}
        </h2>
        <div className="grid gap-3 lg:grid-cols-2">
          {data.routes.map((route) => (
            <div key={route.route_code} className="rounded-lg border border-[var(--line)] p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-semibold">{route.route_code}</span>
                <Badge className="bg-teal-50 text-teal-900 border-teal-200">{phrase(route.name, locale)}</Badge>
                {route.sla_minutes != null ? <span className="text-xs text-[var(--muted)]">{route.sla_minutes}m</span> : null}
              </div>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {route.domain_code} · {route.severity} · {route.primary_team || "—"}
                {route.secondary_team ? ` → ${route.secondary_team}` : ""}
                {route.lark_channel ? ` · ${route.lark_channel}` : ""}
              </p>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
                {route.hops.map((hop) => (
                  <li key={hop.step}>
                    {phrase(hop.team, locale)} · {hop.poc_role} · {hop.sla_minutes}m
                  </li>
                ))}
              </ol>
              {route.skills.length ? (
                <p className="mt-2 font-mono text-[11px] text-[var(--muted)]">{route.skills.join(" · ")}</p>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="panel p-4">
          <h2 className="mb-3 text-sm font-semibold">{t("cs.data.mailboxes")}</h2>
          <ul className="space-y-1 text-sm">
            <li>
              <span className="text-[var(--muted)]">{t("cs.data.support")}: </span>
              <span className="font-mono">{p.mailbox_support}</span>
            </li>
            <li>
              <span className="text-[var(--muted)]">{t("cs.data.complaints")}: </span>
              <span className="font-mono">{p.mailbox_complaints}</span>
            </li>
          </ul>
          <h3 className="mt-4 mb-2 text-sm font-semibold">{t("cs.data.lark")}</h3>
          <ul className="space-y-1 text-sm">
            {data.lark.map((ch) => (
              <li key={ch.chat_id}>
                <span className="font-medium">{phrase(ch.name, locale)}</span>
                <span className="ml-2 font-mono text-xs text-[var(--muted)]">{ch.chat_id}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="panel p-4">
          <h2 className="mb-3 text-sm font-semibold">{t("cs.data.sources")}</h2>
          <ul className="space-y-2 text-sm">
            {data.sources.map((src) => (
              <li key={src.name}>
                <div className="font-medium">{phrase(src.name, locale)}</div>
                <div className="text-xs text-[var(--muted)]">
                  {src.owner_department} · {src.category}
                  {src.url ? ` · ${src.url}` : ""}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
