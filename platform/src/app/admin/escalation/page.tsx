import { EscalationManager } from "@/components/EscalationManager";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { redirect } from "next/navigation";

export default async function EscalationPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "escalation.read")) redirect("/admin");

  const db = getDb();
  const routes = db
    .prepare(
      `SELECT r.*,
              pt.name AS primary_team,
              st.name AS secondary_team,
              lc.name AS lark_channel
       FROM escalation_routes r
       JOIN teams pt ON pt.id = r.primary_team_id
       LEFT JOIN teams st ON st.id = r.secondary_team_id
       LEFT JOIN lark_channels lc ON lc.id = r.lark_channel_id
       ORDER BY CASE WHEN COALESCE(r.is_default, 0) = 1 THEN 0 ELSE 1 END, r.severity DESC, r.name`
    )
    .all() as React.ComponentProps<typeof EscalationManager>["routes"];
  const teams = db
    .prepare(`SELECT id, name FROM teams ORDER BY name`)
    .all() as React.ComponentProps<typeof EscalationManager>["teams"];
  const channels = db
    .prepare(`SELECT id, name FROM lark_channels ORDER BY name`)
    .all() as React.ComponentProps<typeof EscalationManager>["channels"];
  const domains = db
    .prepare(`SELECT code, name FROM risk_domains ORDER BY name`)
    .all() as React.ComponentProps<typeof EscalationManager>["domains"];
  const defaultSlaRow = db
    .prepare(`SELECT value FROM platform_settings WHERE key = 'escalation.default_sla_minutes'`)
    .get() as { value: string } | undefined;

  return (
    <div>
      <AdminPageHeader pageKey="escalation" />
      <EscalationManager
        routes={routes}
        teams={teams}
        channels={channels}
        domains={domains}
        canManage={hasPermission(user.role_code, "escalation.manage")}
        defaultSlaMinutes={Number(defaultSlaRow?.value) || 30}
      />
    </div>
  );
}
