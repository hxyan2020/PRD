"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, StatusBadge, SeverityBadge } from "@/components/ui";
import { bumpNavBadge } from "@/lib/nav-badges";
import { useT } from "@/hooks/useUiLocale";

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
  const { t } = useT();
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
      setMsg(data.error || t("common.failed"));
      return;
    }
    const alarms = (data.results || []).filter((r: { status: string }) => r.status !== "HEALTHY").length;
    setMsg(t("det.ran", { n: data.results?.length ?? 0, alarms }));
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
          <h3 className="font-semibold">{t("det.engine")}</h3>
          <p className="text-sm text-[var(--muted)] mt-1">{t("det.intro")}</p>
        </div>
        {canOperate && (
          <button type="button" className="btn btn-primary" disabled={busy} onClick={runAll}>
            {busy ? t("det.running") : t("det.runAll")}
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
              <th>{t("common.detector")}</th>
              <th>{t("common.product")}</th>
              <th>{t("common.monitor")}</th>
              <th>{t("common.thresholds")}</th>
              <th>{t("common.last")}</th>
              <th>{t("common.status")}</th>
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
                  {d.comparator} {t("common.warn")} {d.warn_threshold} / {t("common.breach")} {d.breach_threshold}
                </td>
                <td className="text-sm">
                  <div className="tabular-nums">{d.last_value ?? "—"}</div>
                  <div className="text-xs text-[var(--muted)]">{d.last_run_at ?? t("common.never")}</div>
                </td>
                <td>
                  <StatusBadge value={d.last_status} />
                </td>
                {canOperate && (
                  <td>
                    <button type="button" className="btn" onClick={() => toggle(d)}>
                      {d.enabled ? t("common.disable") : t("common.enable")}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel p-4">
        <h3 className="font-semibold">{t("det.recent")}</h3>
        <div className="table-wrap mt-3">
          <table className="data">
            <thead>
              <tr>
                <th>{t("common.when")}</th>
                <th>{t("common.detector")}</th>
                <th>{t("common.observed")}</th>
                <th>{t("common.status")}</th>
                <th>{t("det.alertAnalysis")}</th>
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
                    {t("det.alertLine", { alert: r.alert_id ?? "—", analysis: r.analysis_id ?? "—" })}
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
