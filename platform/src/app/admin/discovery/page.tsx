import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { DiscoverySuggestionBoard } from "@/components/DiscoverySuggestionBoard";
import { ForexDeskPackLinks } from "@/components/ForexDeskPackLinks";
import { EnZh } from "@/components/EnZh";
import {
  discoveryPendingCount,
  listDiscoveryCandidates,
  listDiscoveryScans,
  seedDiscoveryIfEmpty,
} from "@/lib/ai/discovery";
import { getDiscoveryAiStatus } from "@/lib/ai/discovery-analyse";
import { RISK_DISCOVERY_NOTEBOOK } from "@/lib/ai/discovery-links";
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
      <AdminPageHeader
        pageKey="discovery"
        actions={
          <>
            <a
              className="btn btn-primary"
              href={RISK_DISCOVERY_NOTEBOOK.colab}
              target="_blank"
              rel="noreferrer"
              data-testid="discovery-header-notebook-colab"
            >
              <EnZh en="Jupyter notebook" zh="Jupyter 筆記本" />
            </a>
            <a
              className="btn"
              href={RISK_DISCOVERY_NOTEBOOK.ipynb}
              target="_blank"
              rel="noreferrer"
              data-testid="discovery-header-notebook-ipynb"
            >
              <EnZh en=".ipynb" zh=".ipynb" />
            </a>
          </>
        }
      />
      <div className="mb-3">
        <ForexDeskPackLinks mode="banner" />
      </div>
      <DiscoverySuggestionBoard
        initial={{
          candidates: listDiscoveryCandidates(undefined, 100) as React.ComponentProps<
            typeof DiscoverySuggestionBoard
          >["initial"]["candidates"],
          scans: listDiscoveryScans(40) as React.ComponentProps<
            typeof DiscoverySuggestionBoard
          >["initial"]["scans"],
          pending_count: discoveryPendingCount(),
          settings,
          ai_status: getDiscoveryAiStatus(),
          roles: {
            can_operate: canOperate,
            can_review: canReview,
            user_id: user.id,
            role_code: user.role_code,
            user_name: user.name,
          },
        }}
      />
    </div>
  );
}
