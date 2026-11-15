import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { listMessengerThreads, syncNewAlertsToMessenger } from "@/lib/messenger/demo";
import { DemoMessenger } from "@/components/DemoMessenger";
import { PageHeader } from "@/components/ui";
import Link from "next/link";

export default async function MessengerDemoPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "lark.read")) redirect("/admin");

  syncNewAlertsToMessenger(10);
  const threads = listMessengerThreads() as React.ComponentProps<typeof DemoMessenger>["initialThreads"];

  return (
    <div>
      <PageHeader
        title="Demo Messenger"
        subtitle="Prototype Lark-style inbox: alerts + AI reports with inline evidence, chatbot challenge, escalate, dismiss, close, and confirmed control actions into Vantage admin."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link className="btn" href="/admin/docs/urls">
              All URLs
            </Link>
            <Link className="btn" href="/admin/lark">
              Lark config
            </Link>
            <Link className="btn" href="/admin/escalation">
              Escalation routes
            </Link>
          </div>
        }
      />
      <DemoMessenger initialThreads={threads} />
    </div>
  );
}
