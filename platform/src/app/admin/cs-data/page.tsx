import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getCsOpsContract } from "@/lib/cs/ops-data";
import { CsOpsDataView } from "@/components/CsOpsDataView";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { isStaticExport } from "@/lib/static-export";

export default async function CsOpsDataPage() {
  const user = await getCurrentUser();
  const staticMode = isStaticExport();
  if (!staticMode && (!user || !(hasPermission(user.role_code, "cs.read") || hasPermission(user.role_code, "lark.read")))) {
    redirect("/admin");
  }
  const data = getCsOpsContract();
  return (
    <div>
      <AdminPageHeader pageKey="cs-data" />
      <CsOpsDataView data={data} />
    </div>
  );
}
