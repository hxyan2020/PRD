import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { RiskLogDashboard } from "@/components/RiskLogDashboard";
import { getRiskLogDashboard } from "@/lib/ai/risk-log";
import { listAlertTrackerPacks } from "@/lib/alert-tracker";

export default async function RiskLogPage() {
  const user = await getCurrentUser();
  if (
    !user ||
    !(
      hasPermission(user.role_code, "monitor.read") ||
      hasPermission(user.role_code, "audit.read") ||
      hasPermission(user.role_code, "dashboard.read")
    )
  ) {
    redirect("/admin");
  }

  const data = getRiskLogDashboard() as React.ComponentProps<typeof RiskLogDashboard>["data"];
  const closedPacks = listAlertTrackerPacks({ limit: 200, order: "recent", status: "closed" });

  return (
    <div>
      <AdminPageHeader pageKey="risk-log" />
      <RiskLogDashboard data={data} closedPacks={closedPacks} />
    </div>
  );
}
