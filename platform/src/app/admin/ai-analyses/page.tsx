import { redirect } from "next/navigation";
import { isStaticExport } from "@/lib/static-export";
import { ClientRedirect } from "@/components/ClientRedirect";

/** AI Analyses list is merged into Realtime Alert & Tracker. Keep this URL as a bookmark. */
export default function AiAnalysesPage() {
  if (isStaticExport()) return <ClientRedirect href="/admin/alerts" />;
  redirect("/admin/alerts");
}
