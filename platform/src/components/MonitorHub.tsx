"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SeverityBadge, StatusBadge, DeptBadge } from "@/components/ui";

type Indicator = {
  id: number;
  monitor_id: string;
  name: string;
  domain_code: string;
  product: string;
  threshold_warn: number | null;
  threshold_breach: number | null;
  unit: string | null;
  status: string;
  last_value: number | null;
  ticket_open_count: number;
};

type Alert = {
  id: number;
  alert_id: string;
  severity: string;
  title: string;
  message: string;
  observed_value: number | null;
  status: string;
  monitor20_ticket_id: string | null;
  indicator_name: string;
  monitor_id: string;
};

type Ticket = {
  id: number;
  ticket_id: string;
  title: string;
  status: string;
  severity: string;
  department_code: string | null;
  assignee_name: string | null;
  lark_message_id: string | null;
};

export function MonitorHub({
  indicators,
  alerts,
  tickets,
  baseUrl,
  canOperate,
}: {
  indicators: Indicator[];
  alerts: Alert[];
  tickets: Ticket[];
  baseUrl: string;
  canOperate: boolean;
}) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [tab, setTab] = useState<"indicators" | "alerts" | "tickets">("indicators");

  async function sync() {
    const res = await fetch("/api/monitor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sync_monitor2" }),
    });
    const data = await res.json();
    setMsg(data.message || "Synced");
    router.refresh();
  }

  async function ack(alertId: number) {
    await fetch("/api/monitor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "ack_alert", alert_id: alertId }),
    });
    router.refresh();
  }

  async function advanceTicket(ticketId: number, status: string) {
    await fetch("/api/monitor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_ticket", ticket_id: ticketId, status }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="panel p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Upstream platform</div>
          <a href={baseUrl} className="font-semibold text-teal-800 break-all" target="_blank" rel="noreferrer">
            {baseUrl}
          </a>
          <p className="text-sm text-[var(--muted)] mt-1">
            Bi-directional sync of indicators, alerts and tickets. Human actions in CRMP write back acknowledgements.
          </p>
        </div>
        {canOperate && (
          <button className="btn btn-primary" onClick={sync}>
            Sync now (prototype)
          </button>
        )}
      </div>
      {msg && <div className="text-sm text-teal-900 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">{msg}</div>}

      <div className="flex gap-2">
        {(
          [
            ["indicators", "Indicators"],
            ["alerts", "Alerts"],
            ["tickets", "Tickets"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            className={`btn ${tab === key ? "btn-primary" : ""}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "indicators" && (
        <div className="panel table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Indicator</th>
                <th>Domain</th>
                <th>Product</th>
                <th>Last</th>
                <th>Warn / Breach</th>
                <th>Status</th>
                <th>Open tickets</th>
              </tr>
            </thead>
            <tbody>
              {indicators.map((i) => (
                <tr key={i.id}>
                  <td>
                    <div className="font-medium">{i.name}</div>
                    <div className="text-xs text-[var(--muted)]">{i.monitor_id}</div>
                  </td>
                  <td className="text-sm">{i.domain_code}</td>
                  <td>{i.product}</td>
                  <td className="tabular-nums">
                    {i.last_value}
                    {i.unit ? ` ${i.unit}` : ""}
                  </td>
                  <td className="text-sm tabular-nums">
                    {i.threshold_warn} / {i.threshold_breach}
                  </td>
                  <td>
                    <StatusBadge value={i.status} />
                  </td>
                  <td>{i.ticket_open_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "alerts" && (
        <div className="panel table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Alert</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Monitor ticket</th>
                {canOperate && <th />}
              </tr>
            </thead>
            <tbody>
              {alerts.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div className="font-medium">{a.title}</div>
                    <div className="text-xs text-[var(--muted)]">
                      {a.alert_id} · {a.monitor_id} · {a.indicator_name}
                    </div>
                    <div className="text-sm mt-1">{a.message}</div>
                  </td>
                  <td>
                    <SeverityBadge value={a.severity} />
                  </td>
                  <td>
                    <StatusBadge value={a.status} />
                  </td>
                  <td className="text-sm">{a.monitor20_ticket_id}</td>
                  {canOperate && (
                    <td>
                      {a.status === "OPEN" && (
                        <button className="btn" onClick={() => ack(a.id)}>
                          Acknowledge
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "tickets" && (
        <div className="panel table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Assignee</th>
                <th>Dept</th>
                <th>Lark msg</th>
                {canOperate && <th />}
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div className="font-medium">{t.title}</div>
                    <div className="text-xs text-[var(--muted)]">{t.ticket_id}</div>
                  </td>
                  <td>
                    <SeverityBadge value={t.severity} />
                  </td>
                  <td>
                    <StatusBadge value={t.status} />
                  </td>
                  <td>{t.assignee_name ?? "Unassigned"}</td>
                  <td>
                    <DeptBadge code={t.department_code} />
                  </td>
                  <td className="text-xs">{t.lark_message_id ?? "—"}</td>
                  {canOperate && (
                    <td className="space-x-1">
                      {t.status !== "RESOLVED" && (
                        <button className="btn" onClick={() => advanceTicket(t.id, "IN_PROGRESS")}>
                          Progress
                        </button>
                      )}
                      {t.status !== "RESOLVED" && (
                        <button className="btn" onClick={() => advanceTicket(t.id, "RESOLVED")}>
                          Resolve
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
