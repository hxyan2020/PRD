import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { NoiseReductionLab } from "@/components/NoiseReductionLab";
import { getDb } from "@/lib/db";
import { loadForexPackLiveSpine } from "@/lib/demo/forex-pack-live";

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

  const liveSpine = loadForexPackLiveSpine(getDb());

  return (
    <div className="space-y-4">
      <AdminPageHeader pageKey="noise-reduction" />
      <NoiseReductionLab liveMonitors={liveSpine.monitors} liveSpine={liveSpine} />
    </div>
  );
}
