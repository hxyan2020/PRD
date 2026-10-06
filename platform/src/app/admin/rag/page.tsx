import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { RagManager } from "@/components/RagManager";
import { listRagDocuments } from "@/lib/ai/rag";
import { humanEscalateAdminItems } from "@/lib/security/ai-access-blocklist";
import { readSearchParams } from "@/lib/static-export";

export default async function RagPage({
  searchParams,
}: {
  searchParams: Promise<{ doc?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "rag.read")) redirect("/admin");

  const sp = await readSearchParams(searchParams);
  const highlightDocKey = (sp.doc || "").trim() || null;

  const docs = listRagDocuments(getDb()) as React.ComponentProps<typeof RagManager>["initialDocs"];
  const categories = (
    getDb().prepare(`SELECT DISTINCT category FROM rag_documents ORDER BY category`).all() as Array<{
      category: string;
    }>
  ).map((c) => c.category);

  return (
    <div>
      <AdminPageHeader pageKey="rag" />
      <RagManager
        initialDocs={docs}
        categories={categories}
        canManage={hasPermission(user.role_code, "rag.manage")}
        highlightDocKey={highlightDocKey}
        escalateItems={humanEscalateAdminItems()}
      />
    </div>
  );
}
