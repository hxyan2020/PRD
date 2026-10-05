import { AlertTrackerBoard } from "@/components/AlertTrackerBoard";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { listAlertTrackerPacks } from "@/lib/alert-tracker";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { redirect } from "next/navigation";

export default async function AlertsPage() {
  const user = await getCurrentUser();
  const canRead =
    !!user &&
    (hasPermission(user.role_code, "monitor.operate") ||
      hasPermission(user.role_code, "monitor.read") ||
      hasPermission(user.role_code, "ai.read"));
  if (!canRead) redirect("/admin");

  const packs = listAlertTrackerPacks(80);

  return (
    <div>
      <AdminPageHeader pageKey="alerts" />
      <AlertTrackerBoard
        packs={packs}
        canOperate={hasPermission(user.role_code, "monitor.operate")}
        canOperateAi={hasPermission(user.role_code, "ai.operate")}
      />
    </div>
  );
}
