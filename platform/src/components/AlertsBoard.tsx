"use client";

import { useRouter } from "next/navigation";
import { SeverityBadge, StatusBadge, Badge } from "@/components/ui";

type Alert = {
  id: number;
  alert_id: string;
  severity: string;
  title: string;
  message: string;
  observed_value: number | null;
  status: string;
  monitor20_ticket_id: string | null;
  created_at: string;
  indicator_name: string;
  monitor_id: string;
  domain_code: string;
  product: string;
};

export function AlertsBoard({ alerts, canOperate }: { alerts: Alert[]; canOperate: boolean }) {
  const router = useRouter();

  async function ack(id: number) {
    await fetch("/api/monitor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "ack_alert", alert_id: id }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {alerts.map((a) => (
        <article key={a.id} className="panel p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap gap-2 items-center">
                <SeverityBadge value={a.severity} />
                <StatusBadge value={a.status} />
                <Badge className="bg-slate-100 text-slate-700 border-slate-200">{a.product}</Badge>
                <Badge className="bg-teal-50 text-teal-900 border-teal-200">{a.domain_code}</Badge>
              </div>
              <h2 className="mt-2 font-semibold text-lg">{a.title}</h2>
              <p className="text-sm text-[var(--muted)] mt-1">{a.message}</p>
              <div className="text-xs text-[var(--muted)] mt-2">
                {a.alert_id} · {a.monitor_id} · {a.indicator_name} · observed {a.observed_value} ·{" "}
                ticket {a.monitor20_ticket_id} · {a.created_at}
              </div>
            </div>
            {canOperate && a.status === "OPEN" && (
              <button className="btn btn-primary" onClick={() => ack(a.id)}>
                Acknowledge
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
