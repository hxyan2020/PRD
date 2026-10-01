import { DataSourcesManager } from "@/components/DataSourcesManager";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { redirect } from "next/navigation";

export default async function DataSourcesPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "sources.read")) redirect("/admin");

  const sources = getDb()
    .prepare(`SELECT * FROM data_sources ORDER BY category, name`)
    .all() as React.ComponentProps<typeof DataSourcesManager>["initialSources"];
  const canManage = hasPermission(user.role_code, "sources.manage");

  return (
    <div>
      <PageHeader
        title="Data Sources Repository"
        subtitle="Canonical registry of internal platforms and external verification feeds used by detection, AI RCA and human review."
      />
      <DataSourcesManager initialSources={sources} canManage={canManage} />
    </div>
  );
}
