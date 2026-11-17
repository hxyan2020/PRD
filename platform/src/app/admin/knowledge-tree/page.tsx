import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { KnowledgeTreeBoard } from "@/components/KnowledgeTreeBoard";
import { listRagDocuments } from "@/lib/ai/rag";
import { seedSkillsIfEmpty } from "@/lib/ai/skills";
import { isStaticExport } from "@/lib/static-export";

export default async function KnowledgeTreePage() {
  const user = await getCurrentUser();
  if (!isStaticExport() && (!user || !hasPermission(user.role_code, "rag.read"))) redirect("/admin");
  const db = getDb();
  seedSkillsIfEmpty(db);
  const docs = listRagDocuments(db).map((d) => {
    let tags: string[] = [];
    try {
      const parsed = JSON.parse(d.tags_json || "[]") as unknown;
      if (Array.isArray(parsed)) tags = parsed.map(String);
    } catch {
      tags = [];
    }
    return {
      doc_key: d.doc_key,
      title: d.title,
      category: d.category,
      product_scope: d.product_scope,
      tags,
    };
  });

  return (
    <div>
      <AdminPageHeader pageKey="knowledge-tree" />
      <KnowledgeTreeBoard docs={docs} />
    </div>
  );
}
