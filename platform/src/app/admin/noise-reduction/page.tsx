import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { NoiseReductionLab } from "@/components/NoiseReductionLab";
import { getDb } from "@/lib/db";
import { FOREX_INCIDENT_1028 } from "@/lib/demo/forex-incident-1028";

export default async function NoiseReductionPage() {
  const user = await getCurrentUser();
  if (
    !user ||
    !(
      hasPermission(user.role_code, "monitor.read") ||
      hasPermission(user.role_code, "ai.read") ||
      hasPermission(user.role_code, "lark.read")
    )
  ) {
    redirect("/admin");
  }

  const monitors = FOREX_INCIDENT_1028.monitors;
  const placeholders = monitors.map(() => "?").join(",");
  const liveMonitors = getDb()
    .prepare(
      `SELECT monitor_id, name, status, last_value, threshold_warn, threshold_breach, unit
       FROM monitor_indicators
       WHERE monitor_id IN (${placeholders})
       ORDER BY monitor_id`
    )
    .all(...monitors) as Array<{
    monitor_id: string;
    name: string;
    status: string;
    last_value: number | null;
    threshold_warn: number | null;
    threshold_breach: number | null;
    unit: string | null;
  }>;

  return (
    <div className="space-y-4">
      <AdminPageHeader pageKey="noise-reduction" />
      <NoiseReductionLab liveMonitors={liveMonitors} />
    </div>
  );
}
