import { EscalationManager } from "@/components/EscalationManager";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { redirect } from "next/navigation";

export default async function EscalationPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "escalation.read")) redirect("/admin");

  const routes = getDb()
    .prepare(
      `SELECT r.*,
              pt.name AS primary_team,
              st.name AS secondary_team,
              lc.name AS lark_channel
       FROM escalation_routes r
       JOIN teams pt ON pt.id = r.primary_team_id
       LEFT JOIN teams st ON st.id = r.secondary_team_id
       LEFT JOIN lark_channels lc ON lc.id = r.lark_channel_id
       ORDER BY r.severity DESC, r.name`
    )
    .all() as React.ComponentProps<typeof EscalationManager>["routes"];
  const teams = getDb()
    .prepare(`SELECT id, name FROM teams ORDER BY name`)
    .all() as React.ComponentProps<typeof EscalationManager>["teams"];
  const channels = getDb()
    .prepare(`SELECT id, name FROM lark_channels ORDER BY name`)
    .all() as React.ComponentProps<typeof EscalationManager>["channels"];
  const domains = getDb()
    .prepare(`SELECT code, name FROM risk_domains ORDER BY name`)
    .all() as React.ComponentProps<typeof EscalationManager>["domains"];

  return (
    <div>
      <AdminPageHeader pageKey="escalation" />
      <EscalationManager
        routes={routes}
        teams={teams}
        channels={channels}
        domains={domains}
        canManage={hasPermission(user.role_code, "escalation.manage")}
      />
    </div>
  );
}
