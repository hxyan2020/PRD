import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { DetectorsBoard } from "@/components/DetectorsBoard";

export default async function DetectorsPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "detectors.read")) redirect("/admin");

  const detectors = getDb().prepare(`SELECT * FROM detectors ORDER BY product, code`).all() as React.ComponentProps<
    typeof DetectorsBoard
  >["detectors"];
  const runs = getDb()
    .prepare(
      `SELECT r.*, d.code AS detector_code
       FROM detector_runs r
       JOIN detectors d ON d.id = r.detector_id
       ORDER BY r.id DESC LIMIT 50`
    )
    .all() as React.ComponentProps<typeof DetectorsBoard>["runs"];

  return (
    <div>
      <PageHeader
        title="Detectors"
        subtitle="First stage of the semi-automated spine — CFD and crypto exchange detectors feeding Monitor alarms and AI RCA."
      />
      <DetectorsBoard
        detectors={detectors}
        runs={runs}
        canOperate={hasPermission(user.role_code, "detectors.operate")}
      />
    </div>
  );
}
