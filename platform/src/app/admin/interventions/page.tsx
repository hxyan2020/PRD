import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { listInterventions } from "@/lib/ai/intervention";
import { PageHeader } from "@/components/ui";
import { InterventionsBoard } from "@/components/InterventionsBoard";

export default async function InterventionsPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "intervene.operate")) redirect("/admin");

  const interventions = listInterventions() as React.ComponentProps<typeof InterventionsBoard>["interventions"];

  return (
    <div>
      <PageHeader
        title="Human Intervention"
        subtitle="Approve or reject AI/skill actions awaiting human gates. Decisions are logged to the spine and audit trail."
      />
      <InterventionsBoard interventions={interventions} />
    </div>
  );
}
