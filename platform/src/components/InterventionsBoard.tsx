"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Badge, SeverityBadge, StatusBadge } from "@/components/ui";
import { AdminLink } from "@/components/AdminLink";
import { MonitorCode } from "@/components/MonitorCode";
import { Phrase } from "@/components/Phrase";
import { decideInterventionAction } from "@/app/admin/interventions/actions";
import { INTERVENTION_DEMO_SAMPLES } from "@/lib/ai/intervention-samples";
import { useT } from "@/hooks/useUiLocale";

type Intervention = {
  id: number;
  action_code: string;
  status: string;
  requested_at: string;
  decided_at: string | null;
  decision_note: string | null;
  analysis_code: string;
  indicator_monitor_id: string;
  mode: string;
  summary: string;
  skill_detail: string;
  step_index: number;
  decided_by_name: string | null;
  decided_by_email?: string | null;
  alert_title: string;
  alert_severity: string;
  product_hint: string;
  analysis_id: number;
  alert_id?: string | null;
  ticket_id?: string | null;
};

function parseSkillDetail(raw: string | null | undefined): {
  description?: string;
  params?: Record<string, unknown>;
} {
  try {
    const parsed = JSON.parse(raw || "{}") as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as { description?: string; params?: Record<string, unknown> };
    }
    return {};
  } catch {
    return {};
  }
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-[8.5rem]">
      <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">{label}</div>
      <div className="mt-0.5 text-sm font-medium text-slate-900 break-all">{children}</div>
    </div>
  );
}

export function InterventionsBoard({ interventions }: { interventions: Intervention[] }) {
  const router = useRouter();
  const { t } = useT();
  const [note, setNote] = useState<Record<number, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  const rows = useMemo(() => {
    if (interventions.length > 0) return interventions;
    return INTERVENTION_DEMO_SAMPLES as Intervention[];
  }, [interventions]);

  const usingFallback = interventions.length === 0;

  function makeAction(id: number, decision: "APPROVED" | "REJECTED") {
    return async (formData: FormData) => {
      if (usingFallback || id >= 9000) {
        setMsg(t("intv.sampleReadonly"));
        return;
      }
      formData.set("id", String(id));
      formData.set("decision", decision);
      if (!formData.get("note")) {
        formData.set("note", note[id] || "");
      }
      setMsg(null);
      setBusyId(id);
      try {
        const result = await decideInterventionAction(formData);
        if (!result?.ok) {
          setMsg(("error" in result && result.error) || t("common.failed"));
          return;
        }
        setMsg(
          t("intv.decidedStatus", {
            decision: decision === "APPROVED" ? t("intv.approved") : t("intv.rejected"),
            id,
          })
        );
        startTransition(() => router.refresh());
      } catch (e) {
        setMsg((e as Error).message || t("common.networkError"));
      } finally {
        setBusyId(null);
      }
    };
  }

  return (
    <div className="space-y-4">
      <div className="panel p-3 text-sm border-teal-200 bg-teal-50/40" data-testid="interventions-samples-banner">
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-teal-900">
          {t("intv.samplesTitle")}
        </div>
        <p className="mt-1 text-teal-950">{t("intv.samplesHint")}</p>
      </div>

      {msg && (
        <div role="status" className="text-sm bg-teal-50 border border-teal-200 text-teal-900 rounded-lg px-3 py-2">
          {msg}
        </div>
      )}

      {rows.map((i) => {
        const detail = parseSkillDetail(i.skill_detail);
        const actioner =
          i.status === "PENDING"
            ? t("intv.awaitingActioner")
            : i.decided_by_email || i.decided_by_name || "—";
        return (
          <article
            key={i.id}
            className="panel p-4"
            data-intervention-id={i.id}
            data-testid={`intervention-card-${i.id}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-2 items-center">
                  <StatusBadge value={i.status} />
                  <SeverityBadge value={i.alert_severity} />
                  <Badge className="bg-slate-100 text-slate-700 border-slate-200">{i.product_hint}</Badge>
                  <Badge className="bg-teal-50 text-teal-900 border-teal-200">{i.mode}</Badge>
                </div>
                <h2 className="mt-2 font-semibold text-lg">
                  {i.action_code} · <Phrase>{i.alert_title}</Phrase>
                </h2>
                <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-3 rounded-xl border border-[var(--line)] bg-slate-50/70 px-3 py-3">
                  <Meta label={t("intv.ticket")}>{i.ticket_id || "—"}</Meta>
                  <Meta label={t("intv.alertId")}>{i.alert_id || i.analysis_code}</Meta>
                  <Meta label={t("intv.timestamp")}>{i.requested_at}</Meta>
                  <Meta label={t("common.severity")}>
                    <SeverityBadge value={i.alert_severity} />
                  </Meta>
                  <Meta label={t("intv.actionPerformed")}>{i.action_code}</Meta>
                  <Meta label={t("intv.actioner")}>
                    {i.status === "PENDING" ? (
                      <span className="text-amber-900">{actioner}</span>
                    ) : (
                      <span data-testid={`actioner-email-${i.id}`}>
                        {i.decided_by_email || "—"}
                        {i.decided_by_name ? (
                          <span className="text-[var(--muted)] font-normal"> · {i.decided_by_name}</span>
                        ) : null}
                      </span>
                    )}
                  </Meta>
                  <Meta label={t("common.analysis")}>{i.analysis_code}</Meta>
                  <Meta label={t("common.indicator")}>
                    <MonitorCode id={i.indicator_monitor_id} tone="inline" />
                  </Meta>
                  <Meta label={t("intv.step")}>
                    {t("intv.stepRequested", { step: i.step_index + 1, at: i.requested_at })}
                  </Meta>
                </div>
                <p className="text-sm mt-3 text-slate-700">
                  <Phrase>{detail.description || i.summary}</Phrase>
                </p>
              </div>
              {!usingFallback && i.analysis_id < 9000 ? (
                <AdminLink className="btn shrink-0" href={`/admin/ai-analyses/${i.analysis_id}`}>
                  {t("common.evidence")}
                </AdminLink>
              ) : (
                <Badge className="bg-amber-50 text-amber-950 border-amber-200 shrink-0">
                  {t("intv.demoSample")}
                </Badge>
              )}
            </div>

            {i.status === "PENDING" ? (
              <form className="mt-3 grid md:grid-cols-[1fr_auto_auto] gap-2 items-end">
                <div>
                  <label className="label">{t("intv.note")}</label>
                  <input
                    className="input"
                    name="note"
                    value={note[i.id] || ""}
                    onChange={(e) => setNote({ ...note, [i.id]: e.target.value })}
                    placeholder={t("intv.notePh")}
                    disabled={usingFallback || i.id >= 9000}
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={busyId === i.id || usingFallback || i.id >= 9000}
                  data-testid={`approve-${i.id}`}
                  formAction={makeAction(i.id, "APPROVED")}
                >
                  {busyId === i.id ? t("common.working") : t("intv.approve")}
                </button>
                <button
                  type="submit"
                  className="btn"
                  disabled={busyId === i.id || usingFallback || i.id >= 9000}
                  data-testid={`reject-${i.id}`}
                  formAction={makeAction(i.id, "REJECTED")}
                >
                  {t("common.reject")}
                </button>
              </form>
            ) : (
              <div className="mt-3 text-sm text-[var(--muted)]">
                {t("intv.decided", {
                  who: i.decided_by_email
                    ? `${i.decided_by_name ?? "—"} <${i.decided_by_email}>`
                    : i.decided_by_name ?? "—",
                  at: i.decided_at ?? "—",
                })}
                {i.decision_note ? (
                  <>
                    {" — "}
                    <Phrase>{i.decision_note}</Phrase>
                  </>
                ) : null}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
