"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useT } from "@/hooks/useUiLocale";

export function IndicatorThresholdEditor({
  indicatorId,
  monitorId,
  warn,
  breach,
  unit,
  canOperate,
}: {
  indicatorId: number;
  monitorId: string;
  warn: number | null;
  breach: number | null;
  unit: string | null;
  canOperate: boolean;
}) {
  const router = useRouter();
  const { t } = useT();
  const [warnVal, setWarnVal] = useState(warn == null ? "" : String(warn));
  const [breachVal, setBreachVal] = useState(breach == null ? "" : String(breach));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setWarnVal(warn == null ? "" : String(warn));
    setBreachVal(breach == null ? "" : String(breach));
  }, [warn, breach]);

  const dirty =
    Number(warnVal) !== Number(warn ?? NaN) || Number(breachVal) !== Number(breach ?? NaN);

  async function save() {
    const w = Number(warnVal);
    const b = Number(breachVal);
    if (!Number.isFinite(w) || !Number.isFinite(b)) {
      setMsg(t("m2.thresholdInvalid"));
      return;
    }
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/monitor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_thresholds",
        indicator_id: indicatorId,
        threshold_warn: w,
        threshold_breach: b,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error || t("common.actionFailed"));
      return;
    }
    setMsg(t("common.updated"));
    router.refresh();
  }

  const unitLabel = unit ? ` ${unit}` : "";

  if (!canOperate) {
    return (
      <div className="text-sm min-w-[8rem]">
        <div className="font-semibold tabular-nums">
          {warn}
          {unitLabel} / {breach}
          {unitLabel}
        </div>
        <div className="text-[11px] text-[var(--muted)] mt-0.5 leading-snug">
          {t("m2.thresholdHint")}
        </div>
      </div>
    );
  }

  return (
    <div
      className="text-sm min-w-[10.5rem] space-y-1.5"
      data-testid={`threshold-editor-${monitorId}`}
    >
      <label className="flex items-center gap-1.5">
        <span className="text-[11px] font-semibold text-amber-800 w-12 shrink-0">
          {t("common.warn")}
        </span>
        <input
          type="number"
          step="any"
          className="input h-8 w-24 tabular-nums text-sm px-2"
          value={warnVal}
          onChange={(e) => {
            setWarnVal(e.target.value);
            setMsg(null);
          }}
          aria-label={`${monitorId} ${t("common.warn")}`}
          data-testid={`threshold-warn-${monitorId}`}
        />
        {unit ? <span className="text-[11px] text-[var(--muted)]">{unit}</span> : null}
      </label>
      <label className="flex items-center gap-1.5">
        <span className="text-[11px] font-semibold text-rose-800 w-12 shrink-0">
          {t("common.breach")}
        </span>
        <input
          type="number"
          step="any"
          className="input h-8 w-24 tabular-nums text-sm px-2"
          value={breachVal}
          onChange={(e) => {
            setBreachVal(e.target.value);
            setMsg(null);
          }}
          aria-label={`${monitorId} ${t("common.breach")}`}
          data-testid={`threshold-breach-${monitorId}`}
        />
        {unit ? <span className="text-[11px] text-[var(--muted)]">{unit}</span> : null}
      </label>
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          className="btn btn-primary h-7 px-2 text-xs"
          disabled={busy || !dirty}
          onClick={save}
          data-testid={`threshold-save-${monitorId}`}
        >
          {busy ? t("common.working") : t("common.save")}
        </button>
        {msg ? <span className="text-[11px] text-teal-800">{msg}</span> : null}
      </div>
    </div>
  );
}
