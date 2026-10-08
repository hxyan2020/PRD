import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { TemplatesBoard } from "@/components/TemplatesBoard";
import { PageHeader, Badge } from "@/components/ui";
import { VantageMark } from "@/components/VantageLogo";
import { OwnerBadge } from "@/components/OwnerBadge";
import { getUiLocale } from "@/lib/i18n-server";
import { SKILL_TEMPLATES } from "@/lib/docs/skill-templates";
import { KNOWLEDGE_TREE_TEMPLATES } from "@/lib/docs/knowledge-tree-templates";

export default async function TemplatesDocPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "admin.access")) redirect("/admin");
  const ui = await getUiLocale();
  const zh = ui === "zh-Hant";

  return (
    <div>
      <PageHeader
        title={zh ? "技能與知識樹範本" : "Skill & Knowledge Tree templates"}
        subtitle={
          zh
            ? `${SKILL_TEMPLATES.length} 種技能範本 · ${KNOWLEDGE_TREE_TEMPLATES.length} 種知識樹節點範本 — 複製後填 YOUR_* 即可上架。風控組長可上線提示／技能（不必 AI BU）；先選公司 RAG 範本再綁葉（可含 Lark wiki）。`
            : `${SKILL_TEMPLATES.length} skill templates · ${KNOWLEDGE_TREE_TEMPLATES.length} Knowledge Tree node templates — copy, fill YOUR_*, ship. RC team lead ships prompts/skills (no AI BU approval); pick a company RAG template, then bind leaves (Lark wiki OK).`
        }
        actions={
          <>
            <Link className="btn" href="/admin/skills">
              {zh ? "AI 技能" : "AI Skills"}
            </Link>
            <Link className="btn" href="/admin/knowledge-tree">
              {zh ? "知識樹" : "Knowledge Tree"}
            </Link>
            <Link className="btn" href="/admin/rag">
              RAG
            </Link>
            <Link className="btn" href="/admin/docs/risk-scenarios">
              {zh ? "風險情境" : "Risk scenarios"}
            </Link>
          </>
        }
      />

      <div className="panel p-3 sm:p-4 mb-4 flex flex-wrap gap-2 items-center">
        <VantageMark className="h-8 w-8" />
        <Badge className="bg-teal-50 text-teal-900 border-teal-200">CRMP-TPL-001</Badge>
        <Badge className="bg-cyan-50 text-cyan-900 border-cyan-200">v1.0</Badge>
        <OwnerBadge />
      </div>

      <TemplatesBoard />
    </div>
  );
}
