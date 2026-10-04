import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { AdminPageHeader } from "@/components/AdminPageHeader";
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
      <AdminPageHeader pageKey="ai-admin" />
      <div className="mb-4 text-sm">
        <Link className="underline" href="/admin/docs/tsd?lang=en">
          TSD §8 — AI Admin management page specification
        </Link>
        {" · "}
        <Link className="underline" href="/admin/docs/tsd?lang=zh-Hant">
          TSD §8 — AI 管理頁規格
        </Link>
      </div>
      <AiAdminConsole
        initial={{
          overview: getAiAdminOverview() as React.ComponentProps<typeof AiAdminConsole>["initial"]["overview"],
          params: listAiParams() as React.ComponentProps<typeof AiAdminConsole>["initial"]["params"],
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
