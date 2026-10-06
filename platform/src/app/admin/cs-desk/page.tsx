import { redirect } from "next/navigation";
import type { ComponentProps } from "react";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { listCsInbox } from "@/lib/cs/desk";
import { getCsOpsContract } from "@/lib/cs/ops-data";
import { CsTrDesk } from "@/components/CsTrDesk";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { isStaticExport } from "@/lib/static-export";
import { T } from "@/components/T";

export default async function CsDeskPage() {
  const user = await getCurrentUser();
  const staticMode = isStaticExport();
  if (!staticMode && (!user || !(hasPermission(user.role_code, "cs.read") || hasPermission(user.role_code, "lark.read")))) {
    redirect("/admin");
  }
  const inbox = listCsInbox();
  const ops = getCsOpsContract();
  const canOperate =
    staticMode ||
    (!!user &&
      (hasPermission(user.role_code, "cs.operate") ||
        hasPermission(user.role_code, "*") ||
        hasPermission(user.role_code, "lark.manage")));

  return (
    <div>
      <AdminPageHeader pageKey="cs-desk" />
      <p className="mb-3 text-sm text-[var(--muted)]">
        <T k="cs.pageHint" />
      </p>
      <CsTrDesk
        initialRequests={inbox.requests as ComponentProps<typeof CsTrDesk>["initialRequests"]}
        initialChannels={inbox.channels as ComponentProps<typeof CsTrDesk>["initialChannels"]}
        initialCatalog={inbox.catalog as ComponentProps<typeof CsTrDesk>["initialCatalog"]}
        ops={ops}
        staticMode={staticMode}
        canOperate={canOperate}
      />
    </div>
  );
}
