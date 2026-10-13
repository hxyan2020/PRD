import { AlertTrackerBoard } from "@/components/AlertTrackerBoard";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { listAlertTrackerPacks } from "@/lib/alert-tracker";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { AdminLink } from "@/components/AdminLink";
import { T } from "@/components/T";
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
  const packs = listAlertTrackerPacks({ limit: 200, order: "severity", status: "open" });

  return (
    <div>
      <AdminPageHeader
        pageKey="alerts"
        actions={
          <span data-testid="alerts-header-closed">
            <AdminLink className="btn btn-primary" href="/admin/risk-log">
              <T k="alerts.viewClosed" />
            </AdminLink>
          </span>
        }
      />
      <AlertTrackerBoard
        packs={packs}
        canOperate={hasPermission(user.role_code, "monitor.operate")}
        canOperateAi={hasPermission(user.role_code, "ai.operate")}
        initialMonitorId={monitorId}
      />
    </div>
  );
}
