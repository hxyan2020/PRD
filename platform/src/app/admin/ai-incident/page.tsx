import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { AiIncidentWorkspace } from "@/components/AiIncidentWorkspace";

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

  return (
    <div className="space-y-4">
      <AdminPageHeader pageKey="ai-incident" />
      <AiIncidentWorkspace />
    </div>
  );
}
