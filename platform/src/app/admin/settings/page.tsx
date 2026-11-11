import { SettingsManager } from "@/components/SettingsManager";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "settings.manage")) redirect("/admin");

  const settings = getDb()
    .prepare(`SELECT * FROM platform_settings ORDER BY key`)
    .all() as React.ComponentProps<typeof SettingsManager>["settings"];

  return (
    <div>
      <AdminPageHeader pageKey="settings" />
      <SettingsManager settings={settings} />
    </div>
  );
}
