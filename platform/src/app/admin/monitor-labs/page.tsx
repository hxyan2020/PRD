import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { MonitorLabsBoard, type MonitorLabTab } from "@/components/MonitorLabsBoard";
import { readSearchParams } from "@/lib/static-export";

export default async function MonitorLabsPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const user = await getCurrentUser();
  if (
    !user ||
    !(
      hasPermission(user.role_code, "monitor.read") ||
      hasPermission(user.role_code, "ai.read") ||
      hasPermission(user.role_code, "lark.read") ||
      hasPermission(user.role_code, "skills.read")
    )
  ) {
    redirect("/admin");
  }

  const sp = await readSearchParams(searchParams);
  const raw = sp.tab;
  const initialTab: MonitorLabTab | undefined =
    raw === "ai-incident" || raw === "noise-reduction" || raw === "l2-rca" ? raw : undefined;

  return (
    <div className="space-y-4">
      <AdminPageHeader pageKey="monitor-labs" />
      <MonitorLabsBoard initialTab={initialTab} />
    </div>
  );
}
