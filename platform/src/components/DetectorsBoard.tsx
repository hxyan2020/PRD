"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, StatusBadge, SeverityBadge } from "@/components/ui";
import { bumpNavBadge } from "@/lib/nav-badges";

type Detector = {
  id: number;
  code: string;
  name: string;
  description: string;
  product: string;
  domain_code: string;
  monitor_id: string;
  warn_threshold: number;
  breach_threshold: number;
  comparator: string;
  enabled: number;
  last_run_at: string | null;
  last_status: string;
  last_value: number | null;
};

type Run = {
  id: number;
  detector_code: string;
  observed_value: number;
  status: string;
  severity: string;
  created_at: string;
  alert_id: number | null;
  analysis_id: number | null;
};

export function DetectorsBoard({
  detectors,
  runs,
  canOperate,
}: {
  detectors: Detector[];
  runs: Run[];
  canOperate: boolean;
}) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function runAll() {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/detectors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ raiseAlarms: true }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error || "Failed");
      return;
    }
    const alarms = (data.results || []).filter((r: { status: string }) => r.status !== "HEALTHY").length;
    setMsg(`Ran ${data.results?.length ?? 0} detectors · ${alarms} warn/breach (alarms auto → AI RCA)`);
    if (alarms > 0) {
      bumpNavBadge("/admin/detectors", alarms);
      bumpNavBadge("/admin/alerts", alarms);
      bumpNavBadge("/admin/ai-analyses", alarms);
    }
    router.refresh();
  }

  async function toggle(d: Detector) {
    await fetch("/api/detectors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle", id: d.id, enabled: !d.enabled }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="panel p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">Detector engine</h3>
          <p className="text-sm text-[var(--muted)] mt-1">
            Samples CFD + crypto indicators, evaluates thresholds, raises Monitor alarms, and triggers the AI spine.
          </p>
        </div>
        {canOperate && (
          <button type="button" className="btn btn-primary" disabled={busy} onClick={runAll}>
            {busy ? "Running…" : "Run all detectors"}
          </button>
        )}
      </div>
      {msg && (
        <div role="status" className="text-sm bg-teal-50 border border-teal-200 text-teal-900 rounded-lg px-3 py-2">
          {msg}
        </div>
      )}

      <div className="panel table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Detector</th>
              <th>Product</th>
              <th>Monitor</th>
              <th>Thresholds</th>
              <th>Last</th>
              <th>Status</th>
              {canOperate && <th />}
            </tr>
          </thead>
          <tbody>
            {detectors.map((d) => (
              <tr key={d.id}>
                <td>
                  <div className="font-semibold">{d.name}</div>
                  <div className="text-xs text-[var(--muted)]">{d.code}</div>
                  <div className="text-sm mt-1">{d.description}</div>
                </td>
                <td>
                  <Badge className="bg-orange-50 text-orange-900 border-orange-200">{d.product}</Badge>
                </td>
                <td className="text-sm">{d.monitor_id}</td>
                <td className="text-sm tabular-nums">
                  {d.comparator} warn {d.warn_threshold} / breach {d.breach_threshold}
                </td>
                <td className="text-sm">
                  <div className="tabular-nums">{d.last_value ?? "—"}</div>
                  <div className="text-xs text-[var(--muted)]">{d.last_run_at ?? "never"}</div>
                </td>
                <td>
                  <StatusBadge value={d.last_status} />
                </td>
                {canOperate && (
                  <td>
                    <button type="button" className="btn" onClick={() => toggle(d)}>
                      {d.enabled ? "Disable" : "Enable"}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel p-4">
        <h3 className="font-semibold">Recent detector runs</h3>
        <div className="table-wrap mt-3">
          <table className="data">
            <thead>
              <tr>
                <th>When</th>
                <th>Detector</th>
                <th>Observed</th>
                <th>Status</th>
                <th>Alert / Analysis</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id}>
                  <td className="text-sm whitespace-nowrap">{r.created_at}</td>
                  <td>{r.detector_code}</td>
                  <td className="tabular-nums">{r.observed_value}</td>
                  <td>
                    <SeverityBadge value={r.severity} />
                  </td>
                  <td className="text-xs">
                    alert {r.alert_id ?? "—"} · analysis {r.analysis_id ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
