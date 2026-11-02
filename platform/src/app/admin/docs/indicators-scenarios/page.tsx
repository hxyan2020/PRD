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
import { markdownToHtml, readDocMarkdown } from "@/lib/docs";
import { EnZh } from "@/components/EnZh";

export default async function IndicatorsScenariosPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "admin.access")) redirect("/admin");

  const forex = forexDemoPack();
  const indicators = listIndicatorCatalog();
  const scenarios = listScenarioCatalog();
  const skills = listSkillScenarioSummary();
  const linked = listLinkedScenarioSummary();
  const handbookHtmlEn = markdownToHtml(readDocMarkdown("INDICATORS_SCENARIOS", "en"));
  const handbookHtmlZh = markdownToHtml(readDocMarkdown("INDICATORS_SCENARIOS", "zh-Hant"));

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
          en={`Admin · Pricing · Dealing catalogue — ${indicators.length} indicators, ${scenarios.length} domain scenarios, skills & linked timelines. Open Full handbook for the complete EN/繁中 tables. Canonical forex walkthrough: INC-1028 (LP-A · XAUUSD).`}
          zh={`管理／定價／交易目錄 — ${indicators.length} 項指標、${scenarios.length} 項領域情境、技能與連結時間鏈。開啟「完整手冊」可看 EN／繁中完整表。標準外匯走查：INC-1028（LP-A · XAUUSD）。`}
        />
      </p>
      <IndicatorsScenariosBoard
        forex={forex}
        indicators={indicators}
        scenarios={scenarios}
        skills={skills}
        linked={linked}
        handbookHtmlEn={handbookHtmlEn}
        handbookHtmlZh={handbookHtmlZh}
      />
    </div>
  );
}
