import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getDailyDashboard } from "@/lib/ai/daily";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { DailyDashboardView } from "@/components/DailyDashboardView";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "dashboard.read")) redirect("/admin");

  const data = getDailyDashboard();

  return (
    <div>
      <AdminPageHeader pageKey="dashboard" />
      <DailyDashboardView
        reportDate={data.report_date}
        cfd={data.cfd}
        crypto={data.crypto}
        summary={data.summary}
      />
    </div>
  );
}
