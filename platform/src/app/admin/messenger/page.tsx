import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { listMessengerInbox, syncNewAlertsToMessenger } from "@/lib/messenger/demo";
import { DemoMessenger } from "@/components/DemoMessenger";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import Link from "next/link";
import { actionLabel, t } from "@/lib/i18n";
import { getUiLocale } from "@/lib/i18n-server";
import { isStaticExport, PUBLIC_MESSENGER_URL } from "@/lib/static-export";

export default async function MessengerDemoPage() {
  const user = await getCurrentUser();
  if (!isStaticExport() && (!user || !hasPermission(user.role_code, "lark.read"))) redirect("/admin");
  const locale = await getUiLocale();
  const staticMode = isStaticExport();

  if (!staticMode) syncNewAlertsToMessenger(10);
  const inbox = listMessengerInbox();
  const threads = inbox.threads as React.ComponentProps<typeof DemoMessenger>["initialThreads"];

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
      <p className="mb-3 text-sm text-[var(--muted)]">
        {t("msg.larkDemoHint", locale)}{" "}
        <a className="text-teal-800 underline break-all" href={PUBLIC_MESSENGER_URL}>
          {PUBLIC_MESSENGER_URL}
        </a>
      </p>
      <DemoMessenger
        initialThreads={threads}
        initialCatalog={inbox.catalog as React.ComponentProps<typeof DemoMessenger>["initialCatalog"]}
        staticMode={staticMode}
      />
    </div>
  );
}
