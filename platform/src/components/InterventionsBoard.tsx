"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Badge, SeverityBadge, StatusBadge } from "@/components/ui";
import { decideInterventionAction } from "@/app/admin/interventions/actions";

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
  alert_title: string;
  alert_severity: string;
  product_hint: string;
  analysis_id: number;
};

// #region agent log
function agentLog(hypothesisId: string, location: string, message: string, data: Record<string, unknown> = {}) {
  fetch("/api/agent-debug", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hypothesisId, location, message, data, timestamp: Date.now(), runId: "post-fix" }),
  }).catch(() => {});
}
// #endregion

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

export function InterventionsBoard({ interventions }: { interventions: Intervention[] }) {
  const router = useRouter();
  const [note, setNote] = useState<Record<number, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const noteRef = useRef(note);
  noteRef.current = note;

  // #region agent log
  useEffect(() => {
    const pendingRows = interventions.filter((x) => x.status === "PENDING");
    const approveBtns = typeof document !== "undefined"
      ? document.querySelectorAll('[data-testid^="approve-"]').length
      : -1;
    const parseOutcomes = interventions.map((i) => {
      const detail = parseSkillDetail(i.skill_detail);
      return {
        id: i.id,
        status: i.status,
        parseOk: true as const,
        isObject: !!i.skill_detail,
        hasDescription: typeof detail.description === "string",
      };
    });
    agentLog("A", "InterventionsBoard.tsx:hydrate", "component mounted (client hydrate)", {
      count: interventions.length,
      pendingCount: pendingRows.length,
      pendingIds: pendingRows.map((p) => p.id),
      approveBtnCount: approveBtns,
      parseOutcomes,
    });
    agentLog("D", "InterventionsBoard.tsx:hydrate:hmr", "post-hydrate interactive probe", {
      hasBoardAttr: !!document.querySelector('[data-board-hydrated="1"]'),
      firstApproveDisabled: (document.querySelector('[data-testid^="approve-"]') as HTMLButtonElement | null)?.disabled ?? null,
      formCount: document.querySelectorAll("form[data-intervention-form]").length,
    });
  }, [interventions]);
  // #endregion

  async function decide(id: number, decision: "APPROVED" | "REJECTED") {
    // #region agent log
    agentLog("B", "InterventionsBoard.tsx:decide:entry", "decide() entered", {
      id,
      decision,
      noteLen: (noteRef.current[id] || "").length,
      busyId,
      via: "client",
    });
    // #endregion
    setMsg(null);
    setBusyId(id);
    try {
      const fd = new FormData();
      fd.set("id", String(id));
      fd.set("decision", decision);
      fd.set("note", noteRef.current[id] || "");
      // #region agent log
      agentLog("E", "InterventionsBoard.tsx:decide:beforeAction", "about to call server action", {
        id,
        decision,
      });
      // #endregion
      const result = await decideInterventionAction(fd);
      // #region agent log
      agentLog("E", "InterventionsBoard.tsx:decide:afterAction", "server action completed", {
        ok: result?.ok,
        error: result && "error" in result ? result.error : undefined,
        status: result && "status" in result ? result.status : undefined,
      });
      // #endregion
      if (!result?.ok) {
        setMsg(("error" in result && result.error) || "Failed");
        return;
      }
      setMsg(`${decision} intervention #${id}`);
      startTransition(() => router.refresh());
    } catch (e) {
      // #region agent log
      agentLog("E", "InterventionsBoard.tsx:decide:catch", "decide() threw", {
        error: (e as Error).message,
      });
      // #endregion
      setMsg((e as Error).message || "Network error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4" data-board-hydrated="1">
      {msg && (
        <div role="status" className="text-sm bg-teal-50 border border-teal-200 text-teal-900 rounded-lg px-3 py-2">
          {msg}
        </div>
      )}
      {interventions.map((i) => {
        const detail = parseSkillDetail(i.skill_detail);
        return (
          <article key={i.id} className="panel p-4" data-intervention-id={i.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap gap-2 items-center">
                  <StatusBadge value={i.status} />
                  <SeverityBadge value={i.alert_severity} />
                  <Badge className="bg-slate-100 text-slate-700 border-slate-200">{i.product_hint}</Badge>
                  <Badge className="bg-teal-50 text-teal-900 border-teal-200">{i.mode}</Badge>
                </div>
                <h2 className="mt-2 font-semibold text-lg">
                  {i.action_code} · {i.alert_title}
                </h2>
                <div className="text-xs text-[var(--muted)] mt-1">
                  #{i.id} · {i.analysis_code} · {i.indicator_monitor_id} · step {i.step_index + 1} · requested{" "}
                  {i.requested_at}
                </div>
                <p className="text-sm mt-2 text-slate-700">{detail.description || i.summary}</p>
              </div>
              <a className="btn" href={`/admin/ai-analyses/${i.analysis_id}`}>
                Evidence
              </a>
            </div>

            {i.status === "PENDING" ? (
              <form
                data-intervention-form={i.id}
                className="mt-3 grid md:grid-cols-[1fr_auto_auto] gap-2 items-end"
                action={decideInterventionAction}
                onSubmit={(ev) => {
                  // Prefer client path when React handlers are alive; prevents full-page POST.
                  const submitter = (ev.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
                  const decision = (submitter?.value || "") as "APPROVED" | "REJECTED";
                  if (decision === "APPROVED" || decision === "REJECTED") {
                    ev.preventDefault();
                    // #region agent log
                    agentLog("C", "InterventionsBoard.tsx:form:onSubmit", "form onSubmit intercepted by React", {
                      id: i.id,
                      decision,
                      pending,
                    });
                    // #endregion
                    void decide(i.id, decision);
                  }
                }}
              >
                <div>
                  <label className="label">Decision note</label>
                  <input type="hidden" name="id" value={i.id} />
                  <input
                    className="input"
                    name="note"
                    value={note[i.id] || ""}
                    onChange={(e) => setNote({ ...note, [i.id]: e.target.value })}
                    placeholder="Why approve / reject…"
                  />
                </div>
                <button
                  type="submit"
                  name="decision"
                  value="APPROVED"
                  className="btn btn-primary"
                  disabled={busyId === i.id || pending}
                  data-testid={`approve-${i.id}`}
                >
                  {busyId === i.id ? "Working…" : "Approve & execute"}
                </button>
                <button
                  type="submit"
                  name="decision"
                  value="REJECTED"
                  className="btn"
                  disabled={busyId === i.id || pending}
                  data-testid={`reject-${i.id}`}
                >
                  Reject
                </button>
              </form>
            ) : (
              <div className="mt-3 text-sm text-[var(--muted)]">
                Decided by {i.decided_by_name ?? "—"} at {i.decided_at}
                {i.decision_note ? ` — ${i.decision_note}` : ""}
              </div>
            )}
          </article>
        );
      })}
      {!interventions.length && (
        <div className="panel p-6 text-sm text-[var(--muted)]">
          No interventions queued. Run detectors or AI analyses that produce human-gated skill steps.
        </div>
      )}
    </div>
  );
}
