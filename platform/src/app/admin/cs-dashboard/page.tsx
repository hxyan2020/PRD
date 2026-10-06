import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getCsDashboard } from "@/lib/cs/analytics";
import { CsDashboardView } from "@/components/CsDashboardView";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { isStaticExport } from "@/lib/static-export";

export default async function CsDashboardPage() {
  const user = await getCurrentUser();
  const staticMode = isStaticExport();
  if (!staticMode && (!user || !(hasPermission(user.role_code, "cs.read") || hasPermission(user.role_code, "lark.read")))) {
    redirect("/admin");
  }
  const data = getCsDashboard();
  return (
    <div>
      <AdminPageHeader pageKey="cs-dashboard" />
      <CsDashboardView data={data} />
    </div>
  );
}
