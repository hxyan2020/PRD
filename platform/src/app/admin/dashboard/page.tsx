import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getDailyDashboard } from "@/lib/ai/daily";
import { PageHeader } from "@/components/ui";
import { DailyDashboardView } from "@/components/DailyDashboardView";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "dashboard.read")) redirect("/admin");

  const data = getDailyDashboard();

  return (
    <div>
      <PageHeader
        title="Daily Performance Dashboard"
        subtitle="CFD + crypto exchange risk performance for the day — last stage of the semi-automated spine."
      />
      <DailyDashboardView
        reportDate={data.report_date}
        cfd={data.cfd}
        crypto={data.crypto}
        summary={data.summary}
      />
    </div>
  );
}
