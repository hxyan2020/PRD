import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { NoiseReductionLab } from "@/components/NoiseReductionLab";

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

  return (
    <div className="space-y-4">
      <AdminPageHeader pageKey="noise-reduction" />
      <NoiseReductionLab />
    </div>
  );
}
