"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge, SeverityBadge, StatusBadge } from "@/components/ui";

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
    body: JSON.stringify({ hypothesisId, location, message, data, timestamp: Date.now() }),
  }).catch(() => {});
}
// #endregion

export function InterventionsBoard({ interventions }: { interventions: Intervention[] }) {
  const router = useRouter();
  const [note, setNote] = useState<Record<number, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  // #region agent log
  useEffect(() => {
    const pending = interventions.filter((x) => x.status === "PENDING");
    const approveBtns = typeof document !== "undefined"
      ? document.querySelectorAll('[data-testid^="approve-"]').length
      : -1;
    const parseOutcomes = interventions.map((i) => {
      try {
        JSON.parse(i.skill_detail || "{}");
        return { id: i.id, status: i.status, parseOk: true as const };
      } catch (e) {
        return { id: i.id, status: i.status, parseOk: false as const, err: (e as Error).message };
      }
    });
    agentLog("A", "InterventionsBoard.tsx:hydrate", "component mounted (client hydrate)", {
      count: interventions.length,
      pendingCount: pending.length,
      pendingIds: pending.map((p) => p.id),
      approveBtnCount: approveBtns,
      parseOutcomes,
    });
    agentLog("D", "InterventionsBoard.tsx:hydrate:hmr", "post-hydrate interactive probe", {
      hasBoardAttr: !!document.querySelector('[data-board-hydrated="1"]'),
      firstApproveDisabled: (document.querySelector('[data-testid^="approve-"]') as HTMLButtonElement | null)?.disabled ?? null,
    });
  }, [interventions]);
  // #endregion

  async function decide(id: number, decision: "APPROVED" | "REJECTED") {
    // #region agent log
    agentLog("B", "InterventionsBoard.tsx:decide:entry", "decide() entered", {
      id,
      decision,
      noteLen: (note[id] || "").length,
      busyId,
    });
    // #endregion
    setMsg(null);
    setBusyId(id);
    try {
      const body = { id, decision, note: note[id] || "" };
      // #region agent log
      agentLog("E", "InterventionsBoard.tsx:decide:beforeFetch", "about to fetch POST /api/interventions", {
        body,
      });
      // #endregion
      const res = await fetch("/api/interventions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      // #region agent log
      agentLog("E", "InterventionsBoard.tsx:decide:afterFetch", "fetch completed", {
        status: res.status,
        ok: res.ok,
        dataKeys: data && typeof data === "object" ? Object.keys(data) : [],
      });
      // #endregion
      if (!res.ok) {
        setMsg(data.error || `Failed (${res.status})`);
        return;
      }
      setMsg(`${decision} intervention #${id}`);
      router.refresh();
    } catch (e) {
      // #region agent log
      agentLog("E", "InterventionsBoard.tsx:decide:catch", "decide() threw before/during fetch", {
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
        let detail: { description?: string; params?: Record<string, unknown> } = {};
        try {
          detail = JSON.parse(i.skill_detail || "{}") as { description?: string; params?: Record<string, unknown> };
        } catch {
          detail = {};
        }
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
              <div className="mt-3 grid md:grid-cols-[1fr_auto_auto] gap-2 items-end">
                <div>
                  <label className="label">Decision note</label>
                  <input
                    className="input"
                    value={note[i.id] || ""}
                    onChange={(e) => setNote({ ...note, [i.id]: e.target.value })}
                    placeholder="Why approve / reject…"
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={busyId === i.id}
                  data-testid={`approve-${i.id}`}
                  onClick={(ev) => {
                    // #region agent log
                    agentLog("C", "InterventionsBoard.tsx:approve:onClick", "Approve button onClick fired", {
                      id: i.id,
                      disabled: busyId === i.id,
                      targetTag: (ev.target as HTMLElement)?.tagName,
                      currentTargetTag: (ev.currentTarget as HTMLElement)?.tagName,
                      defaultPrevented: ev.defaultPrevented,
                    });
                    // #endregion
                    void decide(i.id, "APPROVED");
                  }}
                >
                  {busyId === i.id ? "Working…" : "Approve & execute"}
                </button>
                <button
                  type="button"
                  className="btn"
                  disabled={busyId === i.id}
                  data-testid={`reject-${i.id}`}
                  onClick={(ev) => {
                    // #region agent log
                    agentLog("C", "InterventionsBoard.tsx:reject:onClick", "Reject button onClick fired", {
                      id: i.id,
                      disabled: busyId === i.id,
                      targetTag: (ev.target as HTMLElement)?.tagName,
                      defaultPrevented: ev.defaultPrevented,
                    });
                    // #endregion
                    void decide(i.id, "REJECTED");
                  }}
                >
                  Reject
                </button>
              </div>
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
