import { LarkManager } from "@/components/LarkManager";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { redirect } from "next/navigation";

export default async function LarkPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "lark.read")) redirect("/admin");

  const channels = getDb()
    .prepare(`SELECT * FROM lark_channels ORDER BY name`)
    .all() as React.ComponentProps<typeof LarkManager>["channels"];
  const settings = getDb()
    .prepare(`SELECT key, value, description FROM platform_settings WHERE key LIKE 'lark.%'`)
    .all() as React.ComponentProps<typeof LarkManager>["settings"];

  return (
    <div>
      <AdminPageHeader pageKey="lark" />
      <LarkManager
        channels={channels}
        settings={settings}
        canManage={hasPermission(user.role_code, "lark.manage")}
      />
    </div>
  );
}
