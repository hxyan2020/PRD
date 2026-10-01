import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { listMessengerThreads, syncNewAlertsToMessenger } from "@/lib/messenger/demo";
import { DemoMessenger } from "@/components/DemoMessenger";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import Link from "next/link";
import { actionLabel } from "@/lib/i18n";
import { getUiLocale } from "@/lib/i18n-server";

export default async function MessengerDemoPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "lark.read")) redirect("/admin");
  const locale = await getUiLocale();

  syncNewAlertsToMessenger(10);
  const threads = listMessengerThreads() as React.ComponentProps<typeof DemoMessenger>["initialThreads"];

  return (
    <div>
      <AdminPageHeader
        pageKey="messenger"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link className="btn" href="/admin/docs/urls">
              {actionLabel("/admin/docs/urls", locale)}
            </Link>
            <Link className="btn" href="/admin/lark">
              {actionLabel("/admin/lark", locale)}
            </Link>
            <Link className="btn" href="/admin/escalation">
              {actionLabel("/admin/escalation", locale)}
            </Link>
          </div>
        }
      />
      <DemoMessenger initialThreads={threads} />
    </div>
  );
}
