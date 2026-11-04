"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    setMsg(null);
    let body: Record<string, unknown> = {};
    if (mode === "sync") body = { action: "sync_monitor2" };
    if (mode === "ack") body = { action: "ack_alert", alert_id: alertId };
    if (mode === "ticket") body = { action: "update_ticket", ticket_id: ticketId, status };
    const res = await fetch("/api/monitor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error || "Action failed");
      return;
    }
    setMsg(mode === "sync" ? data.message || "Synced" : "Updated");
    router.refresh();
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button type="button" className={`btn ${mode === "sync" ? "btn-primary" : ""}`} disabled={busy} onClick={run}>
        {busy ? "Working…" : label || (mode === "sync" ? "Sync now (prototype)" : mode === "ack" ? "Acknowledge" : "Update")}
      </button>
      {msg && <span className="text-xs text-teal-800">{msg}</span>}
    </div>
  );
}
