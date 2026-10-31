import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { IndicatorAggregationBoard } from "@/components/IndicatorAggregationBoard";
import { SimSpinePackStrip } from "@/components/SimSpinePackStrip";
import { getAggregationBoardPack } from "@/lib/indicator-aggregation";
import { getDb } from "@/lib/db";
import { loadForexPackLiveSpine } from "@/lib/demo/forex-pack-live";

export default async function IndicatorAggregationPage() {
  const user = await getCurrentUser();
  if (
    !user ||
    !(
      hasPermission(user.role_code, "monitor.read") ||
      hasPermission(user.role_code, "skills.read") ||
      hasPermission(user.role_code, "ai.read")
    )
  ) {
    redirect("/admin");
  }

  const pack = getAggregationBoardPack();
  const liveSpine = loadForexPackLiveSpine(getDb());
  const canOperate =
    hasPermission(user.role_code, "monitor.operate") ||
    hasPermission(user.role_code, "ai.operate") ||
    hasPermission(user.role_code, "skills.manage") ||
    hasPermission(user.role_code, "ai.admin") ||
    hasPermission(user.role_code, "ai.approve");

  return (
    <div className="space-y-4">
      <AdminPageHeader pageKey="indicator-aggregation" />
      <SimSpinePackStrip
        monitors={liveSpine.monitors}
        spine={liveSpine}
        context="compact"
        showDeskLinks={false}
      />
      <IndicatorAggregationBoard
        definitions={pack.definitions}
        initialSessions={pack.sessions}
        canOperate={canOperate}
      />
    </div>
  );
}
