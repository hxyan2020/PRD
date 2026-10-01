import { AlertsBoard } from "@/components/AlertsBoard";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { redirect } from "next/navigation";

export default async function AlertsPage() {
  const user = await getCurrentUser();
  if (!user || !(hasPermission(user.role_code, "monitor.operate") || hasPermission(user.role_code, "monitor.read"))) {
    redirect("/admin");
  }

  const alerts = getDb()
    .prepare(
      `SELECT a.*, i.name AS indicator_name, i.monitor_id, i.domain_code, i.product
       FROM monitor_alerts a
       JOIN monitor_indicators i ON i.id = a.indicator_id
       ORDER BY
         CASE a.severity WHEN 'CRITICAL' THEN 1 WHEN 'BREACH' THEN 2 WHEN 'WARN' THEN 3 ELSE 4 END,
         a.created_at DESC`
    )
    .all() as React.ComponentProps<typeof AlertsBoard>["alerts"];

  return (
    <div>
      <PageHeader
        title="Live Alerts"
        subtitle="Operational queue fed by Monitor 2.0. Ack here, escalate via routes, notify Lark."
      />
      <AlertsBoard alerts={alerts} canOperate={hasPermission(user.role_code, "monitor.operate")} />
    </div>
  );
}
