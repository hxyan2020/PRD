import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getCsLog } from "@/lib/cs/analytics";
import { CsLogView } from "@/components/CsLogView";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { isStaticExport } from "@/lib/static-export";

export default async function CsLogPage() {
  const user = await getCurrentUser();
  const staticMode = isStaticExport();
  if (!staticMode && (!user || !(hasPermission(user.role_code, "cs.read") || hasPermission(user.role_code, "lark.read")))) {
    redirect("/admin");
  }
  const data = getCsLog();
  return (
    <div>
      <AdminPageHeader pageKey="cs-log" />
      <CsLogView data={data} />
    </div>
  );
}
