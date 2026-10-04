import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getSkillByCode } from "@/lib/ai/skills";
import { SKILL_SCENARIOS } from "@/lib/ai/risk-scenarios-catalog";
import { SkillPlaybookView } from "@/components/SkillPlaybookView";
import { isStaticExport } from "@/lib/static-export";
import { AdminLink } from "@/components/AdminLink";
import { PageHeader } from "@/components/ui";

export function generateStaticParams() {
  const params = SKILL_SCENARIOS.map((s) => ({ code: s.code }));
  return params.length ? params : [{ code: "SKILL-MARGIN-SPIKE" }];
}

export default async function SkillDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const user = await getCurrentUser();
  if (!isStaticExport() && (!user || !hasPermission(user.role_code, "skills.read"))) redirect("/admin");
  const { code } = await params;
  const scenario = getSkillByCode(decodeURIComponent(code));

  if (!scenario) {
    return (
      <div>
        <PageHeader
          title="Skill not found"
          subtitle={code}
          actions={
            <AdminLink className="btn" href="/admin/skills">
              Back to skills
            </AdminLink>
          }
        />
      </div>
    );
  }

  return <SkillPlaybookView scenario={scenario} />;
}
