import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { DiscoveryBoard } from "@/components/DiscoveryBoard";
import {
  discoveryPendingCount,
  listDiscoveryCandidates,
  listDiscoveryScans,
  seedDiscoveryIfEmpty,
} from "@/lib/ai/discovery";
import { getDb } from "@/lib/db";

export default async function DiscoveryPage() {
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

  seedDiscoveryIfEmpty();
  const settings = getDb()
    .prepare(`SELECT key, value FROM platform_settings WHERE key LIKE 'discovery.%'`)
    .all() as Array<{ key: string; value: string }>;

  const canReview =
    hasPermission(user.role_code, "ai.approve") ||
    hasPermission(user.role_code, "skills.approve") ||
    user.role_code === "RISK_OWNER" ||
    user.role_code === "SUPER_ADMIN";
  const canOperate =
    hasPermission(user.role_code, "monitor.operate") ||
    hasPermission(user.role_code, "detectors.operate") ||
    hasPermission(user.role_code, "ai.operate");

  return (
    <div>
      <AdminPageHeader pageKey="discovery" />
      <DiscoveryBoard
        initial={{
          candidates: listDiscoveryCandidates(undefined, 100) as React.ComponentProps<
            typeof DiscoveryBoard
          >["initial"]["candidates"],
          scans: listDiscoveryScans(40) as React.ComponentProps<typeof DiscoveryBoard>["initial"]["scans"],
          pending_count: discoveryPendingCount(),
          settings,
          roles: {
            can_operate: canOperate,
            can_review: canReview,
            user_id: user.id,
            role_code: user.role_code,
          },
        }}
      />
    </div>
  );
}
