"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "@/hooks/useUiLocale";
import { bumpNavBadge } from "@/lib/nav-badges";

export function MonitorRunAllButton() {
  const router = useRouter();
  const { t } = useT();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function runAll() {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/monitor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "run_detectors", raiseAlarms: true }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error || t("common.actionFailed"));
      return;
    }
    const alarms = (data.results || []).filter((r: { status: string }) => r.status !== "HEALTHY").length;
    setMsg(t("det.ran", { n: data.results?.length ?? 0, alarms }));
    if (alarms > 0) {
      bumpNavBadge("/admin/monitor-2", alarms);
      bumpNavBadge("/admin/alerts", alarms);
    }
    router.refresh();
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        className="btn btn-primary"
        disabled={busy}
        onClick={runAll}
        data-testid="monitor-run-all"
      >
        {busy ? t("det.running") : t("m2.runAll")}
      </button>
      {msg ? <span className="text-xs text-teal-800">{msg}</span> : null}
    </div>
  );
}

export function IndicatorPauseToggle({
  indicatorId,
  monitorId,
  paused,
}: {
  indicatorId: number;
  monitorId: string;
  paused: boolean;
}) {
  const router = useRouter();
  const { t } = useT();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    await fetch("/api/monitor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "toggle_pause",
        indicator_id: indicatorId,
        paused: !paused,
      }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      className="btn h-7 px-2 text-xs"
      disabled={busy}
      onClick={toggle}
      data-testid={`indicator-pause-${monitorId}`}
      aria-pressed={paused}
    >
      {paused ? t("common.resume") : t("common.pause")}
    </button>
  );
}
