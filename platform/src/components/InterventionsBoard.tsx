"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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

export function InterventionsBoard({ interventions }: { interventions: Intervention[] }) {
  const router = useRouter();
  const [note, setNote] = useState<Record<number, string>>({});
  const [msg, setMsg] = useState<string | null>(null);

  async function decide(id: number, decision: "APPROVED" | "REJECTED") {
    setMsg(null);
    const res = await fetch("/api/interventions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, decision, note: note[id] || "" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "Failed");
      return;
    }
    setMsg(`${decision} intervention #${id}`);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {msg && (
        <div role="status" className="text-sm bg-teal-50 border border-teal-200 text-teal-900 rounded-lg px-3 py-2">
          {msg}
        </div>
      )}
      {interventions.map((i) => {
        const detail = JSON.parse(i.skill_detail || "{}") as { description?: string; params?: Record<string, unknown> };
        return (
          <article key={i.id} className="panel p-4">
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
                <button type="button" className="btn btn-primary" onClick={() => decide(i.id, "APPROVED")}>
                  Approve & execute
                </button>
                <button type="button" className="btn" onClick={() => decide(i.id, "REJECTED")}>
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
