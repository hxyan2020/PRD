import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { listMessengerInbox, syncNewAlertsToMessenger } from "@/lib/messenger/demo";
import { DemoMessenger } from "@/components/DemoMessenger";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import Link from "next/link";
import { ActionLabel } from "@/components/ActionLabel";
import { T } from "@/components/T";
import { isStaticExport, PUBLIC_MESSENGER_URL } from "@/lib/static-export";

export default async function MessengerDemoPage() {
  const user = await getCurrentUser();
  if (!isStaticExport() && (!user || !hasPermission(user.role_code, "lark.read"))) redirect("/admin");
  const staticMode = isStaticExport();

  if (!staticMode) syncNewAlertsToMessenger(10);
  const inbox = listMessengerInbox();
  const threads = inbox.threads as React.ComponentProps<typeof DemoMessenger>["initialThreads"];

  const roleCode = user?.role_code || (staticMode ? "PUBLIC_GUEST" : "VIEWER");
  const canIntervene = staticMode || (!!user && hasPermission(user.role_code, "intervene.operate"));
  const canSoftControl =
    staticMode ||
    canIntervene ||
    (!!user && (hasPermission(user.role_code, "monitor.operate") || hasPermission(user.role_code, "lark.manage")));
  const canEscalate =
    staticMode ||
    canIntervene ||
    (!!user &&
      (hasPermission(user.role_code, "escalation.manage") ||
        hasPermission(user.role_code, "risk.intervene") ||
        ["RISK_OWNER", "RISK_ANALYST", "OPS_LEAD", "SUPER_ADMIN"].includes(user.role_code)));
  const canTriage = staticMode || canIntervene || (!!user && hasPermission(user.role_code, "ai.operate"));

  return (
    <div className="messenger-page">
      <div className="shrink-0">
        <AdminPageHeader
          pageKey="messenger"
          actions={
            <div className="hidden sm:flex flex-wrap gap-2">
              <Link className="btn" href="/admin/docs/urls">
                <ActionLabel href="/admin/docs/urls" />
              </Link>
              <Link className="btn" href="/admin/lark">
                <ActionLabel href="/admin/lark" />
              </Link>
              <Link className="btn" href="/admin/escalation">
                <ActionLabel href="/admin/escalation" />
              </Link>
            </div>
          }
        />
        <p className="mb-3 text-sm text-[var(--muted)]">
          <span className="sm:hidden">
            <T k="msg.larkDemoHintShort" />
          </span>
          <span className="hidden sm:inline">
            <T k="msg.larkDemoHint" />{" "}
          </span>
          <a className="text-teal-800 underline break-all hidden sm:inline" href={PUBLIC_MESSENGER_URL}>
            {PUBLIC_MESSENGER_URL}
          </a>
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <DemoMessenger
          initialThreads={threads}
          initialCatalog={inbox.catalog as React.ComponentProps<typeof DemoMessenger>["initialCatalog"]}
          staticMode={staticMode}
          caps={{
            roleCode,
            canEvidence: true,
            canEscalate,
            canTriage,
            canIntervene,
            canSoftControl,
          }}
        />
      </div>
    </div>
  );
}
