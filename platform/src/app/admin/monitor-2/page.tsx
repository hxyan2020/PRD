import { MonitorHub } from "@/components/MonitorHub";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { redirect } from "next/navigation";

export default async function Monitor2Page() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "monitor.read")) redirect("/admin");

  const db = getDb();
  const indicators = db
    .prepare(`SELECT * FROM monitor_indicators ORDER BY status DESC, name`)
    .all() as React.ComponentProps<typeof MonitorHub>["indicators"];
  const alerts = db
    .prepare(
      `SELECT a.*, i.name AS indicator_name, i.monitor_id
       FROM monitor_alerts a
       JOIN monitor_indicators i ON i.id = a.indicator_id
       ORDER BY a.created_at DESC`
    )
    .all() as React.ComponentProps<typeof MonitorHub>["alerts"];
  const tickets = db
    .prepare(
      `SELECT t.*, u.name AS assignee_name
       FROM monitor_tickets t
       LEFT JOIN users u ON u.id = t.assignee_user_id
       ORDER BY t.updated_at DESC`
    )
    .all() as React.ComponentProps<typeof MonitorHub>["tickets"];
  const setting = db
    .prepare(`SELECT value FROM platform_settings WHERE key = 'monitor2.base_url'`)
    .get() as { value: string } | undefined;

  return (
    <div>
      <PageHeader
        title="Monitor 2.0 Integration Hub"
        subtitle="Existing indicator monitoring platform — warnings, alerts and ticket tracking. CRMP syncs and escalates from here."
      />
      <MonitorHub
        indicators={indicators}
        alerts={alerts}
        tickets={tickets}
        baseUrl={setting?.value ?? ""}
        canOperate={hasPermission(user.role_code, "monitor.operate")}
      />
    </div>
  );
}
