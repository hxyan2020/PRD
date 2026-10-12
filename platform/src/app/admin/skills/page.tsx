import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { listLinkedScenarios, listSkillScenarios, seedSkillsIfEmpty } from "@/lib/ai/skills";
import { PageHeader } from "@/components/ui";
import { SkillsScenariosBoard } from "@/components/SkillsScenariosBoard";

export default async function SkillsPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "skills.read")) redirect("/admin");

  const db = getDb();
  seedSkillsIfEmpty(db);
  const skills = listSkillScenarios(db);
  const chains = listLinkedScenarios(db);

  return (
    <div>
      <PageHeader
        title="AI Skills & Risk Scenarios"
        subtitle="Indicator thresholds (and why), fault areas, escalation paths, BU correction actions, past detections — plus multi-indicator timeline chains."
      />
      <SkillsScenariosBoard skills={skills} chains={chains} />
    </div>
  );
}
