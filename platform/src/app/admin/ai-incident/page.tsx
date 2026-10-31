import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { AiIncidentWorkspace } from "@/components/AiIncidentWorkspace";
import { getDb } from "@/lib/db";
import { loadForexPackLiveSpine } from "@/lib/demo/forex-pack-live";

export default async function AiIncidentPage() {
  const user = await getCurrentUser();
  if (
    !user ||
    !(
      hasPermission(user.role_code, "monitor.read") ||
      hasPermission(user.role_code, "lark.read") ||
      hasPermission(user.role_code, "ai.read")
    )
  ) {
    redirect("/admin");
  }

  const liveSpine = loadForexPackLiveSpine(getDb());

  return (
    <div className="space-y-4">
      <AdminPageHeader pageKey="ai-incident" />
      <AiIncidentWorkspace liveMonitors={liveSpine.monitors} liveSpine={liveSpine} />
    </div>
  );
}
