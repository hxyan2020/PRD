import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { RagManager } from "@/components/RagManager";
import { listRagDocuments } from "@/lib/ai/rag";

export default async function RagPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "rag.read")) redirect("/admin");

  const docs = listRagDocuments(getDb()) as React.ComponentProps<typeof RagManager>["initialDocs"];
  const categories = (
    getDb().prepare(`SELECT DISTINCT category FROM rag_documents ORDER BY category`).all() as Array<{
      category: string;
    }>
  ).map((c) => c.category);

  return (
    <div>
      <PageHeader
        title="RAG Knowledge Base"
        subtitle="Internal static business corpus for Vantage Markets — policies, products, entities, platforms. Used when AI cannot match a skill with certainty."
      />
      <RagManager
        initialDocs={docs}
        categories={categories}
        canManage={hasPermission(user.role_code, "rag.manage")}
      />
    </div>
  );
}
