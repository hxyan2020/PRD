import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { listInterventions } from "@/lib/ai/intervention";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { InterventionsBoard } from "@/components/InterventionsBoard";

export default async function InterventionsPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "intervene.operate")) redirect("/admin");

  const interventions = listInterventions() as React.ComponentProps<typeof InterventionsBoard>["interventions"];

  return (
    <div>
      <AdminPageHeader pageKey="interventions" />
      <InterventionsBoard interventions={interventions} />
    </div>
  );
}
