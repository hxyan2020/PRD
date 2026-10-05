import { AlertTrackerBoard } from "@/components/AlertTrackerBoard";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { listAlertTrackerPacks } from "@/lib/alert-tracker";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { redirect } from "next/navigation";
import { readSearchParams } from "@/lib/static-export";

export default async function AlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ monitor_id?: string }>;
}) {
  const user = await getCurrentUser();
  const canRead =
    !!user &&
    (hasPermission(user.role_code, "monitor.operate") ||
      hasPermission(user.role_code, "monitor.read") ||
      hasPermission(user.role_code, "ai.read"));
  if (!canRead) redirect("/admin");

  const sp = await readSearchParams(searchParams);
  const monitorId = (sp.monitor_id || "").trim();
  const packs = listAlertTrackerPacks(200);

  return (
    <div>
      <AdminPageHeader pageKey="alerts" />
      <AlertTrackerBoard
        packs={packs}
        canOperate={hasPermission(user.role_code, "monitor.operate")}
        canOperateAi={hasPermission(user.role_code, "ai.operate")}
        initialMonitorId={monitorId}
      />
    </div>
  );
}
