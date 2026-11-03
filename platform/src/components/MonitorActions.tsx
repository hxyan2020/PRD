"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT, useUiLocale } from "@/hooks/useUiLocale";
import { pagesReadOnlyHint, postDeskJson } from "@/lib/fetch-json";

export function MonitorActions({
  mode,
  alertId,
  ticketId,
  status,
  label,
}: {
  mode: "sync" | "ack" | "ticket";
  alertId?: number;
  ticketId?: number;
  status?: string;
  label?: string;
}) {
  const router = useRouter();
  const { t } = useT();
  const { locale } = useUiLocale();
  const zh = locale === "zh-Hant";
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    setMsg(null);
    let body: Record<string, unknown> = {};
    if (mode === "sync") body = { action: "sync_monitor2" };
    if (mode === "ack") body = { action: "ack_alert", alert_id: alertId };
    if (mode === "ticket") body = { action: "update_ticket", ticket_id: ticketId, status };
    const parsed = await postDeskJson<{ error?: string; message?: string }>("/api/monitor", body);
    setBusy(false);
    if (parsed.apiUnavailable || parsed.skippedPublic || parsed.nonJson) {
      setMsg(pagesReadOnlyHint(zh));
      return;
    }
    if (!parsed.ok) {
      setMsg(parsed.data.error || t("common.actionFailed"));
      return;
    }
    setMsg(mode === "sync" ? parsed.data.message || t("common.synced") : t("common.updated"));
    router.refresh();
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button type="button" className={`btn ${mode === "sync" ? "btn-primary" : ""}`} disabled={busy} onClick={run}>
        {busy
          ? t("common.working")
          : label === "Progress"
            ? t("common.progress")
            : label === "Resolve"
              ? t("common.resolve")
              : label ||
                (mode === "sync" ? t("m2.syncNow") : mode === "ack" ? t("common.acknowledge") : t("common.updated"))}
      </button>
      {msg && <span className="text-xs text-teal-800">{msg}</span>}
    </div>
  );
}
