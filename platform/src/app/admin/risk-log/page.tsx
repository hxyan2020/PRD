import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { RiskLogDashboard } from "@/components/RiskLogDashboard";
import { getRiskLogDashboard } from "@/lib/ai/risk-log";

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

  return (
    <div>
      <PageHeader
        title="Risk Log & Alerts Analytics"
        subtitle="Alerts by category, chronological records, human handling times, monetary loss vs prevented amounts, and loophole-prone areas across CFD + crypto."
      />
      <RiskLogDashboard data={data} />
    </div>
  );
}
