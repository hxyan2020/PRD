"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT, useUiLocale } from "@/hooks/useUiLocale";
import { bumpNavBadge } from "@/lib/nav-badges";
import { pagesReadOnlyHint, postDeskJson } from "@/lib/fetch-json";

export function MonitorRunAllButton() {
  const router = useRouter();
  const { t } = useT();
  const { locale } = useUiLocale();
  const zh = locale === "zh-Hant";
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function runAll() {
    setBusy(true);
    setMsg(null);
    const parsed = await postDeskJson<{
      error?: string;
      results?: Array<{ status: string }>;
    }>("/api/monitor", { action: "run_detectors", raiseAlarms: true });
    setBusy(false);
    if (parsed.apiUnavailable || parsed.skippedPublic || parsed.nonJson) {
      setMsg(pagesReadOnlyHint(zh));
      return;
    }
    if (!parsed.ok) {
      setMsg(parsed.data.error || t("common.actionFailed"));
      return;
    }
    const alarms = (parsed.data.results || []).filter((r) => r.status !== "HEALTHY").length;
    setMsg(t("det.ran", { n: parsed.data.results?.length ?? 0, alarms }));
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
    const parsed = await postDeskJson("/api/monitor", {
      action: "toggle_pause",
      indicator_id: indicatorId,
      paused: !paused,
    });
    setBusy(false);
    if (parsed.apiUnavailable || parsed.skippedPublic || parsed.nonJson) return;
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
