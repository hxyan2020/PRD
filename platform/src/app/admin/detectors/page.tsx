import { redirect } from "next/navigation";
import { ClientRedirect } from "@/components/ClientRedirect";
import { isStaticExport } from "@/lib/static-export";

/** Detectors merged into Monitor 2.0 — keep URL for bookmarks. */
export default function DetectorsPage() {
  if (isStaticExport()) return <ClientRedirect href="/admin/monitor-2" />;
  redirect("/admin/monitor-2");
}
