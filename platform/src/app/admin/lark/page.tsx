import { LarkManager } from "@/components/LarkManager";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ActionLabel } from "@/components/ActionLabel";
import { isStaticExport } from "@/lib/static-export";
import { listLarkCards, syncLarkCardsFromThreads } from "@/lib/lark/cards";
import { syncNewAlertsToMessenger } from "@/lib/messenger/demo";

export default async function LarkPage() {
  const user = await getCurrentUser();
  const staticMode = isStaticExport();
  if (!staticMode && (!user || !hasPermission(user.role_code, "lark.read"))) redirect("/admin");

  if (!staticMode) {
    try {
      syncNewAlertsToMessenger(10);
      syncLarkCardsFromThreads();
    } catch {
      /* seed */
    }
  } else {
    try {
      syncLarkCardsFromThreads();
    } catch {
      /* snapshot */
    }
  }

  const channels = getDb()
    .prepare(`SELECT * FROM lark_channels ORDER BY name`)
    .all() as React.ComponentProps<typeof LarkManager>["channels"];
  const settings = getDb()
    .prepare(`SELECT key, value, description FROM platform_settings WHERE key LIKE 'lark.%'`)
    .all() as React.ComponentProps<typeof LarkManager>["settings"];
  const cards = listLarkCards();

  const canAct =
    staticMode ||
    (!!user &&
      (hasPermission(user.role_code, "lark.manage") ||
        hasPermission(user.role_code, "escalation.manage") ||
        hasPermission(user.role_code, "risk.intervene") ||
        hasPermission(user.role_code, "intervene.operate") ||
        hasPermission(user.role_code, "ai.operate") ||
        hasPermission(user.role_code, "lark.read")));

  return (
    <div>
      <AdminPageHeader
        pageKey="lark"
        actions={
          <Link className="btn" href="/admin/messenger">
            <ActionLabel href="/admin/messenger" />
          </Link>
        }
      />
      <LarkManager
        channels={channels}
        settings={settings}
        cards={cards}
        canManage={staticMode || (!!user && hasPermission(user.role_code, "lark.manage"))}
        canAct={canAct}
        staticMode={staticMode}
      />
    </div>
  );
}
