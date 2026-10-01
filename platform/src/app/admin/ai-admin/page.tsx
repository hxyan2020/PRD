import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { AiAdminConsole } from "@/components/AiAdminConsole";
import {
  getAiAdminOverview,
  listAiParams,
  listChangeRequests,
  listRagForAdmin,
  listSkillsForAdmin,
  listTrainingRuns,
} from "@/lib/ai/admin";

export default async function AiAdminPage() {
  const user = await getCurrentUser();
  if (
    !user ||
    !(
      hasPermission(user.role_code, "ai.admin") ||
      hasPermission(user.role_code, "skills.manage") ||
      hasPermission(user.role_code, "rag.manage") ||
      hasPermission(user.role_code, "ai.read")
    )
  ) {
    redirect("/admin");
  }

  const canPropose =
    hasPermission(user.role_code, "ai.propose") ||
    hasPermission(user.role_code, "skills.manage") ||
    hasPermission(user.role_code, "rag.manage") ||
    hasPermission(user.role_code, "settings.manage");
  const canApprove =
    hasPermission(user.role_code, "ai.approve") ||
    hasPermission(user.role_code, "skills.approve") ||
    hasPermission(user.role_code, "rag.approve");

  return (
    <div>
      <PageHeader
        title="AI Admin"
        subtitle="Configure AI parameters, training, accuracy history, skills and RAG — with maker/checker dual control before changes apply."
      />
      <AiAdminConsole
        initial={{
          overview: getAiAdminOverview(),
          params: listAiParams(),
          changes: listChangeRequests() as React.ComponentProps<typeof AiAdminConsole>["initial"]["changes"],
          training: listTrainingRuns() as React.ComponentProps<typeof AiAdminConsole>["initial"]["training"],
          skills: listSkillsForAdmin() as React.ComponentProps<typeof AiAdminConsole>["initial"]["skills"],
          rag: listRagForAdmin() as React.ComponentProps<typeof AiAdminConsole>["initial"]["rag"],
          roles: {
            can_propose: canPropose,
            can_approve: canApprove,
            can_manage_skills: hasPermission(user.role_code, "skills.manage"),
            can_manage_rag: hasPermission(user.role_code, "rag.manage"),
            user_id: user.id,
            role_code: user.role_code,
          },
        }}
      />
    </div>
  );
}
