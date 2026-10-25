import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { DiscoveryL2RcaLab } from "@/components/DiscoveryL2RcaLab";

export default async function L2RcaPage() {
  const user = await getCurrentUser();
  if (
    !user ||
    !(
      hasPermission(user.role_code, "monitor.read") ||
      hasPermission(user.role_code, "ai.read") ||
      hasPermission(user.role_code, "skills.read")
    )
  ) {
    redirect("/admin");
  }

  return (
    <div className="space-y-4">
      <AdminPageHeader pageKey="l2-rca" />
      <DiscoveryL2RcaLab />
    </div>
  );
}
