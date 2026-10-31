import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { IndicatorsScenariosBoard } from "@/components/IndicatorsScenariosBoard";
import {
  forexDemoPack,
  listIndicatorCatalog,
  listLinkedScenarioSummary,
  listScenarioCatalog,
  listSkillScenarioSummary,
} from "@/lib/docs/indicators-scenarios";
import { EnZh } from "@/components/EnZh";

export default async function IndicatorsScenariosPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "admin.access")) redirect("/admin");

  const forex = forexDemoPack();
  const indicators = listIndicatorCatalog();
  const scenarios = listScenarioCatalog();
  const skills = listSkillScenarioSummary();
  const linked = listLinkedScenarioSummary();

  return (
    <div>
      <AdminPageHeader
        pageKey="indicators-scenarios"
        actions={
          <>
            <Link className="btn" href="/admin/docs/simulated-data">
              <EnZh en="SQL / seed tables" zh="SQL／種子表" />
            </Link>
            <Link className="btn btn-primary" href="/admin/monitor-2">
              <EnZh en="Monitor 2.0" zh="Monitor 2.0" />
            </Link>
          </>
        }
      />
      <p className="text-sm text-[var(--muted)] mb-4">
        <EnZh
          en="Admin · Pricing · Dealing catalogue of Monitor 2.0 indicators and risk scenarios. Canonical forex walkthrough is INC-1028 (LP-A · XAUUSD)."
          zh="管理／定價／交易（Dealing）用的 Monitor 2.0 指標與風險情境目錄。標準外匯走查為 INC-1028（LP-A · XAUUSD）。"
        />
      </p>
      <IndicatorsScenariosBoard
        forex={forex}
        indicators={indicators}
        scenarios={scenarios}
        skills={skills}
        linked={linked}
      />
    </div>
  );
}
