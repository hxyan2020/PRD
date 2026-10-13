"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Copy, ExternalLink } from "lucide-react";
import { Badge, SeverityBadge, StatusBadge } from "@/components/ui";
import { AdminLink } from "@/components/AdminLink";
import { MonitorCode } from "@/components/MonitorCode";
import { AlertTrackerFilters } from "@/components/AlertTrackerFilters";
import { publicAdminHref } from "@/lib/static-export";
import { bumpNavBadge } from "@/lib/nav-badges";
import { useT } from "@/hooks/useUiLocale";
import { cn } from "@/lib/utils";
import {
  DEFAULT_ALERT_FILTERS,
  filterAndSortAlerts,
  type AlertFilterState,
} from "@/lib/alert-filters";
import type { AlertTrackerPack, TrackerEvent, TrackerGate, TrackerPerson } from "@/lib/alert-tracker";
import { AiImprovementPanel } from "@/components/AiImprovementPanel";

function gateClass(code: TrackerGate["code"]) {
  switch (code) {
    case "CLOSED":
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    case "PENDING_RO":
      return "bg-rose-50 text-rose-800 border-rose-200";
    case "PENDING_ADMIN":
      return "bg-amber-50 text-amber-900 border-amber-200";
    default:
      return "bg-orange-50 text-orange-800 border-orange-200";
  }
}

function eventTitle(ev: TrackerEvent, t: (k: string, vars?: Record<string, string | number>) => string) {
  switch (ev.kind) {
    case "raised":
      return t("tracker.event.raised", { sev: ev.title });
    case "ack":
      return t("tracker.event.ack");
    case "ticket":
      return t("tracker.event.ticket", { title: ev.title });
    case "rca":
      return t("tracker.event.rca", { title: ev.title });
    case "intervention":
      return t("tracker.event.intervention", { title: ev.title });
    case "decided":
      return t("tracker.event.decided", { title: ev.title });
    case "ai_action":
      return t("tracker.event.aiAction", { title: ev.title });
    case "audit":
      return t("tracker.event.audit", { title: ev.title });
    default:
      return ev.title;
  }
}

function PersonLine({
  person,
  empty,
  phrase,
}: {
  person: TrackerPerson | null;
  empty: string;
  phrase: (text: string | null | undefined) => string;
}) {
  if (!person) return <span className="text-[var(--muted)]">{empty}</span>;
  return (
    <span>
      <span className="font-semibold">{person.name}</span>
      <span className="text-[var(--muted)]">
        {" "}
        · {phrase(person.role)}
        {person.team ? ` · ${phrase(person.team)}` : ""}
        {person.email ? ` · ${person.email}` : ""}
      </span>
    </span>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-white px-3 py-2.5">
      <div className="text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">{label}</div>
      <div className="mt-1 text-sm break-words">{children}</div>
    </div>
  );
}

function AlertTrackerFacts({
  pack,
  canOperate,
  copied,
  copyUrl,
  ack,
  displayUrl,
  t,
  phrase,
  gateLabel,
  openClose,
  ticketStatus,
}: {
  pack: AlertTrackerPack;
  canOperate: boolean;
  copied: boolean;
  copyUrl: (e: React.MouseEvent) => void;
  ack: (e: React.MouseEvent) => void;
  displayUrl: string;
  t: (k: string, vars?: Record<string, string | number>) => string;
  phrase: (text: string | null | undefined) => string;
  gateLabel: string;
  openClose: string;
  ticketStatus: string;
}) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <AdminLink className="btn btn-primary" href={pack.href}>
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          {pack.gate.code === "CLOSED" ? t("tracker.openClosed") : t("tracker.openAdmin")}
        </AdminLink>
        <button type="button" className="btn" onClick={copyUrl}>
          <Copy className="h-3.5 w-3.5" aria-hidden />
          {copied ? t("tracker.copied") : t("tracker.copyUrl")}
        </button>
        {pack.analysis ? (
          <AdminLink className="btn" href={pack.analysis.href}>
            {t("ai.openEvidence")}
          </AdminLink>
        ) : null}
        {canOperate && pack.alert_status === "OPEN" && (
          <button type="button" className="btn sm:hidden" onClick={ack}>
            {t("common.acknowledge")}
          </button>
        )}
      </div>
      <p className="text-xs text-[var(--muted)] break-all">
        {t("tracker.adminUrl")}: {displayUrl}
      </p>

      <div className="grid sm:grid-cols-2 gap-2">
        <Fact label={t("common.severity")}>
          <SeverityBadge value={pack.severity} />
          {pack.observed_value != null ? (
            <span className="ml-2 text-[var(--muted)]">
              {t("common.observed")} {pack.observed_value}
            </span>
          ) : null}
        </Fact>
        <Fact label={t("tracker.openClose")}>
          <div className="flex flex-wrap gap-1.5 items-center">
            <Badge className={gateClass(pack.gate.code === "CLOSED" ? "CLOSED" : "OPEN")}>{openClose}</Badge>
            {pack.gate.code === "CLOSED" ? (
              <Badge className={gateClass("CLOSED")}>{t("tracker.ticketClosed")}</Badge>
            ) : null}
            <StatusBadge value={pack.alert_status} />
            {pack.ticket_status ? <StatusBadge value={pack.ticket_status} /> : null}
            {pack.outcome ? <Badge className="bg-slate-100 text-slate-700 border-slate-200">{phrase(pack.outcome)}</Badge> : null}
          </div>
          <div className="mt-1 text-xs text-[var(--muted)]">
            {t("common.ticket")} {pack.ticket_id || "—"} · {ticketStatus}
          </div>
        </Fact>
        <Fact label={t("tracker.raisedTo")}>
          <PersonLine person={pack.poc} empty={t("tracker.noPoc")} phrase={phrase} />
          {pack.ticket_department ? (
            <div className="mt-1 text-xs text-[var(--muted)]">
              {t("common.department")} · {phrase(pack.ticket_department)}
            </div>
          ) : null}
        </Fact>
        <Fact label={t("tracker.pending")}>
          <Badge className={gateClass(pack.gate.code)}>{gateLabel}</Badge>
          <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
            {pack.gate.code === "PENDING_RO"
              ? t("tracker.gateDetail.PENDING_RO", { name: pack.ro?.name || t("tracker.roFallback") })
              : t(`tracker.gateDetail.${pack.gate.code}`)}
          </p>
          {pack.ro ? (
            <div className="mt-1.5 text-xs">
              {t("tracker.ro")}: <PersonLine person={pack.ro} empty="" phrase={phrase} />
            </div>
          ) : null}
        </Fact>
      </div>

      <Fact label={t("tracker.aiReport")}>
        {pack.analysis ? (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2 items-center">
              <Badge
                className={
                  pack.analysis.mode === "SKILL_MATCH"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-amber-50 text-amber-900 border-amber-200"
                }
              >
                {pack.analysis.mode}
              </Badge>
              <StatusBadge value={pack.analysis.status} />
              <Badge className="bg-slate-100 text-slate-700 border-slate-200">
                {t("common.confidence")} {(pack.analysis.confidence * 100).toFixed(0)}%
              </Badge>
              {pack.analysis.needs_human ? (
                <Badge className="bg-rose-50 text-rose-800 border-rose-200">{t("common.needsHuman")}</Badge>
              ) : null}
              {pack.analysis.challenged ? (
                <Badge
                  className={
                    pack.analysis.challenge_verdict === "AGREE"
                      ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                      : pack.analysis.challenge_verdict === "DISAGREE"
                        ? "bg-rose-50 text-rose-900 border-rose-200"
                        : "bg-amber-50 text-amber-900 border-amber-200"
                  }
                >
                  {t("ai.challenged", { verdict: pack.analysis.challenge_verdict || "challenged" })}
                </Badge>
              ) : pack.severity === "BREACH" || pack.severity === "CRITICAL" ? (
                <Badge className="bg-slate-100 text-slate-600 border-slate-200">{t("ai.pending2nd")}</Badge>
              ) : null}
            </div>
            <div className="text-xs text-[var(--muted)]">{pack.analysis.analysis_id}</div>
            <p className="text-sm text-slate-700 leading-relaxed">{pack.analysis.summary}</p>
            <AdminLink className="text-sm font-semibold text-teal-800 underline" href={pack.analysis.href}>
              {t("tracker.openRca")}
            </AdminLink>
          </div>
        ) : (
          <p className="text-[var(--muted)]">{t("tracker.noAnalysis")}</p>
        )}
      </Fact>

      {pack.analysis && pack.improvement ? (
        <AiImprovementPanel analysisId={pack.analysis.id} initial={pack.improvement} compact />
      ) : pack.analysis ? (
        <p className="text-xs text-[var(--muted)] px-1">{t("imp.pending")}</p>
      ) : null}

      <Fact label={t("tracker.finalSolution")}>
        {pack.final_solution ? (
          <div className="space-y-1.5">
            <p className="text-sm text-slate-800 leading-relaxed">{phrase(pack.final_solution.text)}</p>
            <div className="text-xs text-[var(--muted)]">
              {t("tracker.mandatedBy", { who: phrase(pack.final_solution.mandated_by) })}
            </div>
          </div>
        ) : (
          <p className="text-[var(--muted)]">{t("tracker.noSolution")}</p>
        )}
      </Fact>

      <Fact label={t("tracker.escalation")}>
        {pack.escalation ? (
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="font-semibold">{phrase(pack.escalation.route_name)}</div>
              {pack.escalation.route_code ? (
                <code className="text-xs text-[var(--muted)]">{pack.escalation.route_code}</code>
              ) : null}
              {pack.escalation.is_default || pack.escalation.match_kind === "default" ? (
                <Badge className="bg-amber-100 text-amber-950 border-amber-300">{t("tracker.defaultEsc")}</Badge>
              ) : null}
            </div>
            <div className="text-xs text-[var(--muted)]">
              {t("common.sla")} {pack.escalation.sla_minutes} {t("common.minutes")}
              {pack.escalation.requires_human ? ` · ${t("common.needsHuman")}` : ""}
            </div>
            <div className="text-sm">
              {t("tracker.primary")}: {phrase(pack.escalation.primary_team)}
              {pack.escalation.secondary_team ? ` → ${phrase(pack.escalation.secondary_team)}` : ""}
            </div>
            {pack.escalation.lark_channel ? (
              <div className="text-sm">
                {t("common.lark")}: {phrase(pack.escalation.lark_channel)}
              </div>
            ) : null}
            {pack.escalation.auto_actions.length ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {pack.escalation.auto_actions.map((a) => (
                  <Badge key={a} className="bg-slate-100 text-slate-700 border-slate-200">
                    {phrase(a)}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-[var(--muted)]">{t("tracker.noEscalation")}</p>
        )}
      </Fact>

      <div>
        <div className="text-[11px] uppercase tracking-[0.08em] text-[var(--muted)] mb-2">
          {t("tracker.actionLog")}
        </div>
        <ol className="space-y-0 border-l-2 border-teal-200 ml-2">
          {pack.timeline.map((ev, i) => (
            <li key={`${ev.at}-${ev.kind}-${i}`} className="relative pl-4 py-1.5">
              <span className="absolute -left-[7px] top-2.5 h-3 w-3 rounded-full bg-teal-600 ring-4 ring-slate-50" />
              <div className="text-sm">{phrase(eventTitle(ev, t))}</div>
              <div className="text-xs text-[var(--muted)]">
                {ev.at}
                {ev.actor ? ` · ${phrase(ev.actor)}` : ""}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}

export function AlertTrackerCard({
  pack,
  canOperate,
  compact = false,
  defaultOpen = false,
  highlighted = false,
}: {
  pack: AlertTrackerPack;
  canOperate: boolean;
  compact?: boolean;
  defaultOpen?: boolean;
  highlighted?: boolean;
}) {
  const router = useRouter();
  const { t, phrase } = useT();
  const [copied, setCopied] = useState(false);
  const [displayUrl, setDisplayUrl] = useState(pack.href);
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    setDisplayUrl(`${window.location.origin}${publicAdminHref(pack.href)}`);
  }, [pack.href]);

  useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);

  function adminUrl() {
    if (typeof window === "undefined") return pack.href;
    return `${window.location.origin}${publicAdminHref(pack.href)}`;
  }

  async function copyUrl(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(adminUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  async function ack(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    await fetch("/api/monitor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "ack_alert", alert_id: pack.id }),
    });
    router.refresh();
  }

  const gateLabel =
    pack.gate.code === "PENDING_RO"
      ? t("tracker.gate.PENDING_RO", { name: pack.ro?.name || t("tracker.roFallback") })
      : t(`tracker.gate.${pack.gate.code}`);
  const openClose =
    pack.gate.code === "CLOSED" ? t("tracker.closed") : t("tracker.open");
  const ticketStatus = pack.ticket_status ? phrase(pack.ticket_status) : t("common.none");

  const facts = (
    <AlertTrackerFacts
      pack={pack}
      canOperate={canOperate}
      copied={copied}
      copyUrl={copyUrl}
      ack={ack}
      displayUrl={displayUrl}
      t={t}
      phrase={phrase}
      gateLabel={gateLabel}
      openClose={openClose}
      ticketStatus={ticketStatus}
    />
  );

  if (compact) {
    return (
      <details
        id={`home-${pack.alert_id}`}
        className={cn(
          "group bg-white",
          highlighted && "ring-2 ring-inset ring-teal-600 bg-teal-50/50"
        )}
        open={open}
        onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
        data-testid={`home-alert-${pack.alert_id}`}
        data-dummy={highlighted ? "1" : undefined}
      >
        <summary className="flex cursor-pointer list-none items-start gap-3 px-3 py-3 hover:bg-slate-50 transition [&::-webkit-details-marker]:hidden">
          <div className="min-w-0 flex-1">
            <div className="font-medium">{phrase(pack.title)}</div>
            <div className="text-xs text-[var(--muted)] mt-0.5">
              {pack.alert_id} · <span>{phrase(pack.indicator_name)}</span>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {highlighted ? <Badge className="bg-teal-600 text-white border-teal-700">{t("tracker.dummyRun")}</Badge> : null}
              <SeverityBadge value={pack.severity} />
              <StatusBadge value={pack.alert_status} />
              <Badge className={gateClass(pack.gate.code)}>{gateLabel}</Badge>
            </div>
          </div>
          <ChevronDown
            className="h-4 w-4 mt-1 shrink-0 text-slate-400 transition group-open:rotate-180 group-open:text-teal-700"
            aria-hidden
          />
          <span className="sr-only">{t("tracker.expand")}</span>
        </summary>
        <div className="border-t border-[var(--line)] bg-slate-50/70 px-3 py-3 space-y-3">
          {pack.message ? <p className="text-sm text-slate-700 leading-relaxed">{phrase(pack.message)}</p> : null}
          {facts}
        </div>
      </details>
    );
  }

  return (
    <details
      id={pack.alert_id}
      className={cn(
        "group panel scroll-mt-24 overflow-hidden p-0",
        (defaultOpen || highlighted) && "ring-2 ring-teal-600/40 border-teal-300"
      )}
      open={open}
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
      data-dummy={highlighted ? "1" : undefined}
    >
      <summary className="flex cursor-pointer list-none items-start gap-3 p-3 sm:p-4 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2 items-center">
            <SeverityBadge value={pack.severity} />
            <StatusBadge value={pack.alert_status} />
            <Badge className={gateClass(pack.gate.code)}>{gateLabel}</Badge>
            {highlighted ? <Badge className="bg-teal-600 text-white border-teal-700">{t("tracker.dummyRun")}</Badge> : null}
            <Badge className="bg-slate-100 text-slate-700 border-slate-200">{phrase(pack.product)}</Badge>
            <Badge className="bg-teal-50 text-teal-900 border-teal-200">{phrase(pack.domain_code)}</Badge>
          </div>
          <h2 className="mt-2 font-semibold text-lg">{phrase(pack.title)}</h2>
          <p className="text-sm text-[var(--muted)] mt-1">{phrase(pack.message)}</p>
          <div className="text-xs text-[var(--muted)] mt-2 flex flex-wrap items-center gap-x-1 gap-y-1">
            <span>{pack.alert_id}</span>
            {pack.ticket_id ? <span>· {pack.ticket_id}</span> : null}
            <span>·</span>
            <MonitorCode id={pack.monitor_id} name={pack.indicator_name} tone="inline" />
            <span>· {phrase(pack.indicator_name)}</span>
            {pack.poc ? <span>· {t("tracker.poc")}: {pack.poc.name}</span> : <span>· {t("tracker.noPoc")}</span>}
            <span>· {pack.created_at}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-start gap-2">
          {canOperate && pack.alert_status === "OPEN" && (
            <button type="button" className="btn btn-primary hidden sm:inline-flex" onClick={ack}>
              {t("common.acknowledge")}
            </button>
          )}
          <ChevronDown
            className="mt-1 h-5 w-5 shrink-0 text-slate-400 transition group-open:rotate-180 group-open:text-teal-700"
            aria-hidden
          />
        </div>
        <span className="sr-only">{t("tracker.expand")}</span>
      </summary>

      <div className="border-t border-[var(--line)] bg-slate-50/70 px-3 py-3 sm:px-4 sm:py-4 space-y-3">{facts}</div>
    </details>
  );
}

export function AlertTrackerList({
  packs,
  canOperate,
  compact = false,
  openId,
  highlightIds,
}: {
  packs: AlertTrackerPack[];
  canOperate: boolean;
  compact?: boolean;
  openId?: string;
  highlightIds?: string[];
}) {
  const { t } = useT();
  if (!packs.length) {
    return <div className="panel p-6 text-sm text-[var(--muted)]">{t("tracker.empty")}</div>;
  }
  const highlighted = new Set(highlightIds || []);
  return (
    <div
      className={
        compact
          ? "overflow-hidden rounded-xl border border-[var(--line)] divide-y divide-[var(--line)] bg-white"
          : "space-y-3"
      }
    >
      {packs.map((pack) => (
        <AlertTrackerCard
          key={pack.id}
          pack={pack}
          canOperate={canOperate}
          compact={compact}
          defaultOpen={openId === pack.alert_id || highlighted.has(pack.alert_id)}
          highlighted={highlighted.has(pack.alert_id)}
        />
      ))}
    </div>
  );
}

export function AlertTrackerBoard({
  packs,
  canOperate,
  canOperateAi,
  initialMonitorId = "",
}: {
  packs: AlertTrackerPack[];
  canOperate: boolean;
  canOperateAi: boolean;
  initialMonitorId?: string;
}) {
  const router = useRouter();
  const { t } = useT();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [hash, setHash] = useState("");
  const [filters, setFilters] = useState<AlertFilterState>({
    ...DEFAULT_ALERT_FILTERS,
    monitorId: initialMonitorId,
  });

  useEffect(() => {
    setFilters((prev) => ({ ...prev, monitorId: initialMonitorId || prev.monitorId }));
  }, [initialMonitorId]);

  useEffect(() => {
    const apply = () => {
      const id = window.location.hash.replace(/^#/, "");
      setHash(id);
      if (id) {
        const el = document.getElementById(id);
        if (el instanceof HTMLDetailsElement) el.open = true;
        el?.scrollIntoView({ block: "start" });
      }
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  const visiblePacks = useMemo(() => filterAndSortAlerts(packs, filters), [packs, filters]);

  async function run(action: string, body: Record<string, unknown> = {}) {
    if (busy) return;
    setBusy(true);
    setMsg(t("ai.working"));
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...body }),
      });
      let data: Record<string, unknown> = {};
      try {
        data = (await res.json()) as Record<string, unknown>;
      } catch {
        setMsg(t("ai.badResponse", { status: res.status }));
        return;
      }
      if (!res.ok) {
        setMsg(String(data.error || t("common.failed")));
        return;
      }
      const analysis = (data.analysis || {}) as {
        analysis_id?: string;
        mode?: string;
        confidence?: number;
      };
      const challenge = (data.challenge || null) as { verdict?: string } | null;
      const pct = Math.round((analysis.confidence || 0) * 100);
      setMsg(
        action === "analyze_open"
          ? t("ai.ensured", { n: Number(data.count) || 0 })
          : action === "simulate_alarm"
            ? `${t("ai.alarmRaised", {
                id: analysis.analysis_id || "—",
                mode: analysis.mode || "—",
                pct,
              })}${challenge?.verdict ? ` · ${t("ai.challenged", { verdict: challenge.verdict })}` : ""}`
            : action === "backfill_challenges"
              ? t("ai.backfilled", { n: Number(data.count) || 0 })
              : t("ai.done")
      );
      router.refresh();
      if (action === "simulate_alarm") {
        bumpNavBadge("/admin/alerts", 1);
        bumpNavBadge("/admin/alerts", 1);
        const alertKey = data.monitor_alert_id as string | undefined;
        if (alertKey) {
          window.location.hash = alertKey;
        }
      } else if (action === "analyze_open" || action === "backfill_challenges") {
        bumpNavBadge("/admin/alerts", Number(data.count) || 1);
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t("common.failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {canOperateAi ? (
        <div className="panel p-4" data-testid="ai-pipeline-controls">
          <h3 className="font-semibold">{t("ai.pipeline")}</h3>
          <p className="text-sm text-[var(--muted)] mt-1">{t("ai.pipelineIntro")}</p>
          <p className="text-xs text-[var(--muted)] mt-1">{t("ai.pipelineRankNote")}</p>
          <div className="mt-3 action-row">
            <button
              type="button"
              className="btn btn-primary"
              data-testid="ai-btn-analyze-open"
              disabled={busy}
              onClick={() => run("analyze_open")}
            >
              {t("ai.analyzeOpen")}
            </button>
            <button
              type="button"
              className="btn"
              data-testid="ai-btn-backfill"
              disabled={busy}
              onClick={() => run("backfill_challenges")}
            >
              {t("ai.backfill")}
            </button>
          </div>
          <details className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--panel-2,#f8fafc)] px-3 py-2">
            <summary className="cursor-pointer text-sm font-medium select-none">{t("ai.demoSims")}</summary>
            <div className="mt-2 action-row">
              <button
                type="button"
                className="btn"
                data-testid="ai-btn-sim-copy"
                disabled={busy}
                onClick={() =>
                  run("simulate_alarm", {
                    monitor_id: "M2-COPY-009",
                    severity: "BREACH",
                    observed_value: 33,
                    title: "Simulated copy concentration breach",
                    message: "Top signal provider now at 33% of copy equity after viral strategy share.",
                  })
                }
              >
                {t("ai.simCopy")}
              </button>
              <button
                type="button"
                className="btn"
                data-testid="ai-btn-sim-eq"
                disabled={busy}
                onClick={() =>
                  run("simulate_alarm", {
                    monitor_id: "M2-EQ-001",
                    severity: "WARN",
                    observed_value: 3.8,
                    prefer_rag: true,
                    title: "Simulated equity drawdown warn",
                    message: "Company CFD book drawdown rising through US session after CPI volatility.",
                  })
                }
              >
                {t("ai.simEq")}
              </button>
              <button
                type="button"
                className="btn"
                data-testid="ai-btn-sim-crit"
                disabled={busy}
                onClick={() =>
                  run("simulate_alarm", {
                    monitor_id: "M2-MRG-014",
                    severity: "CRITICAL",
                    observed_value: 220,
                    title: "Simulated margin utilisation CRITICAL",
                    message: "Book-wide margin utilisation spiked; LP rejects rising. Requires dual-AI RCA.",
                  })
                }
              >
                {t("ai.simCrit")}
              </button>
            </div>
          </details>
          {msg && (
            <div
              role="status"
              data-testid="ai-action-status"
              className="mt-3 text-sm bg-teal-50 border border-teal-200 text-teal-900 rounded-lg px-3 py-2 sticky top-[72px] z-20"
            >
              {busy ? `${msg}…` : msg}
            </div>
          )}
        </div>
      ) : (
        <div className="panel p-4 text-sm text-[var(--muted)]" data-testid="ai-pipeline-locked">
          <p>{t("ai.pipelineLocked")}</p>
          <p className="mt-2 text-xs">{t("ai.pipelineRankNote")}</p>
        </div>
      )}

      <AlertTrackerFilters
        packs={packs}
        filters={filters}
        onChange={setFilters}
        resultCount={visiblePacks.length}
        showUnresolved={false}
        extra={
          <span data-testid="view-closed-alerts">
            <AdminLink className="btn btn-primary h-9" href="/admin/risk-log">
              {t("alerts.viewClosed")}
            </AdminLink>
          </span>
        }
      />

      {visiblePacks.length === 0 ? (
        <div className="panel p-6 text-sm text-[var(--muted)]" data-testid="alert-filters-empty">
          {packs.length === 0 ? t("tracker.emptyOpen") : t("alerts.noneMatch")}
          <div className="mt-3">
            <AdminLink className="btn btn-primary" href="/admin/risk-log">
              {t("alerts.viewClosed")}
            </AdminLink>
          </div>
        </div>
      ) : (
        <AlertTrackerList packs={visiblePacks} canOperate={canOperate} openId={hash} />
      )}
    </div>
  );
}
