import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { AiAnalysesBoard } from "@/components/AiAnalysesBoard";

export default async function AiAnalysesPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "ai.read")) redirect("/admin");

  const analyses = getDb()
    .prepare(
      `SELECT a.*, m.alert_id AS monitor_alert_id, m.title AS alert_title, m.severity,
              s.code AS skill_code
       FROM ai_analyses a
       JOIN monitor_alerts m ON m.id = a.alert_id
       LEFT JOIN ai_skills s ON s.id = a.skill_id
       ORDER BY a.id DESC
       LIMIT 100`
    )
    .all() as React.ComponentProps<typeof AiAnalysesBoard>["analyses"];

  return (
    <div>
      <AdminPageHeader pageKey="ai-analyses" />
      <AiAnalysesBoard analyses={analyses} canOperate={hasPermission(user.role_code, "ai.operate")} />
    </div>
  );
}
