import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { DiscoveryL2RcaLab } from "@/components/DiscoveryL2RcaLab";
import { getDb } from "@/lib/db";
import { loadForexPackLiveSpine } from "@/lib/demo/forex-pack-live";

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

  const liveSpine = loadForexPackLiveSpine(getDb());

  return (
    <div className="space-y-4">
      <AdminPageHeader pageKey="l2-rca" />
      <DiscoveryL2RcaLab liveMonitors={liveSpine.monitors} liveSpine={liveSpine} />
    </div>
  );
}
