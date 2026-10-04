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

  return (
    <div>
      <AdminPageHeader
        pageKey="messenger"
        actions={
          <div className="flex flex-wrap gap-2">
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
        <T k="msg.larkDemoHint" />{" "}
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
