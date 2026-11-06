import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { AiAccessSecurityBoard } from "@/components/AiAccessSecurityBoard";
import {
  AI_ACCESS_BLOCKLIST,
  AI_ALLOWED_CAPABILITIES,
  AI_SERVICE_ROLE_FORBIDDEN_PERMISSIONS,
  blocklistStats,
} from "@/lib/security/ai-access-blocklist";

export default async function AiAccessSecurityPage() {
  const user = await getCurrentUser();
  if (
    !user ||
    !(
      hasPermission(user.role_code, "audit.read") ||
      hasPermission(user.role_code, "settings.manage") ||
      hasPermission(user.role_code, "users.read") ||
      hasPermission(user.role_code, "ai.admin")
    )
  ) {
    redirect("/admin");
  }

  return (
    <div>
      <PageHeader
        title="AI Access Blocklist"
        subtitle="Pages, functions, fields and data that must remain human-authorised only — blocked from AI agents for security."
      />
      <AiAccessSecurityBoard
        items={AI_ACCESS_BLOCKLIST}
        allowed={[...AI_ALLOWED_CAPABILITIES]}
        forbiddenPermissions={[...AI_SERVICE_ROLE_FORBIDDEN_PERMISSIONS]}
        stats={blocklistStats()}
      />
    </div>
  );
}
