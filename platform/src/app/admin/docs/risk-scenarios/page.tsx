import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { RiskScenariosBoard, type RiskScenarioLang } from "@/components/RiskScenariosBoard";
import { PageHeader, Badge } from "@/components/ui";
import { VantageMark } from "@/components/VantageLogo";
import { OwnerBadge } from "@/components/OwnerBadge";
import { getUiLocale } from "@/lib/i18n-server";
import { riskScenarioSummary, type RiskScenarioEdition } from "@/lib/docs/risk-scenario-rows";
import { ORIGINAL_CRMP_ADMIN_URL, PUBLIC_ADMIN_URL } from "@/lib/platform-site";
import { readSearchParams } from "@/lib/static-export";

function resolveRiskLang(raw: string | undefined, ui: "en" | "zh-Hant"): RiskScenarioLang {
  const v = (raw || "").toLowerCase();
  if (v === "both" || v === "bilingual" || v === "en+zh") return "both";
  if (v === "zh-hant" || v === "zh-tw" || v === "zh" || v === "zh_hant") return "zh-Hant";
  if (v === "en") return "en";
  return ui;
}

export default async function RiskScenariosDocPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; edition?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "admin.access")) redirect("/admin");
  const sp = await readSearchParams(searchParams);
  const ui = await getUiLocale();
  const lang = resolveRiskLang(sp.lang, ui);
  const zhChrome = lang === "zh-Hant";
  const edition: RiskScenarioEdition = sp.edition === "classic" ? "classic" : "plus";
  const summary = riskScenarioSummary(edition);
  const q = (nextLang: RiskScenarioLang) =>
    `/admin/docs/risk-scenarios?edition=${edition}&lang=${encodeURIComponent(nextLang)}`;

  return (
    <div>
      <PageHeader
        title={zhChrome ? "風險情境目錄" : lang === "both" ? "Risk scenarios / 風險情境" : "Risk scenarios"}
        subtitle={
          zhChrome
            ? `彙整技能／連結鏈／相關／擴充共 ${summary.total} 筆（後台 ${summary.byBucket.admin_system} · 報價 ${summary.byBucket.pricing} · 風險營運 ${summary.byBucket.risk_ops} · CS／TR ${summary.byBucket.cs_tr}）。每列皆有英文與繁中。`
            : lang === "both"
              ? `${summary.total} bilingual rows (admin ${summary.byBucket.admin_system} · pricing ${summary.byBucket.pricing} · risk ops ${summary.byBucket.risk_ops} · CS/TR ${summary.byBucket.cs_tr}). Each cell shows English then 繁中.`
              : `${summary.total} rows from skills, chains, correlations, and extras — full EN + 繁中 fields on every row. Switch language above.`
        }
        actions={
          <>
            <Link className="btn" href="/admin/skills">
              {zhChrome ? "AI 技能" : "AI Skills"}
            </Link>
            <Link className="btn" href="/admin/risk-domains">
              {zhChrome ? "風險領域" : "Risk Domains"}
            </Link>
            <Link className="btn" href="/admin/monitor-2">
              Monitor 2.0
            </Link>
            <Link className="btn" href="/admin/docs/urls">
              {zhChrome ? "網址目錄" : "URL Catalog"}
            </Link>
          </>
        }
      />

      <div className="panel p-3 sm:p-4 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap gap-2 items-center">
          <VantageMark className="h-8 w-8" />
          <Badge className="bg-teal-50 text-teal-900 border-teal-200">CRMP-RS-001</Badge>
          <Badge className="bg-cyan-50 text-cyan-900 border-cyan-200">v1.2</Badge>
          <OwnerBadge />
          <Badge className="bg-slate-100 text-slate-700 border-slate-200">
            {edition === "classic" ? (zhChrome ? "原版範圍" : "Classic scope") : "CRMP Plus"}
          </Badge>
          <Badge className="bg-violet-50 text-violet-900 border-violet-200">
            {lang === "both" ? "EN + 繁中" : lang === "zh-Hant" ? "繁體中文" : "English"}
          </Badge>
        </div>
        <div className="action-row flex flex-wrap gap-2">
          <Link className={`btn ${edition === "plus" ? "btn-primary" : ""}`} href={q(lang).replace(`edition=${edition}`, "edition=plus")}>
            Plus
          </Link>
          <Link
            className={`btn ${edition === "classic" ? "btn-primary" : ""}`}
            href={q(lang).replace(`edition=${edition}`, "edition=classic")}
          >
            {zhChrome ? "原版 Admin" : "Classic Admin"}
          </Link>
          <Link className={`btn ${lang === "en" ? "btn-primary" : ""}`} href={q("en")}>
            English
          </Link>
          <Link className={`btn ${lang === "zh-Hant" ? "btn-primary" : ""}`} href={q("zh-Hant")}>
            繁體中文
          </Link>
          <Link className={`btn ${lang === "both" ? "btn-primary" : ""}`} href={q("both")}>
            Both / 雙語
          </Link>
        </div>
      </div>

      <div className="panel p-3 sm:p-4 mb-4 text-sm text-[var(--muted)] space-y-1">
        <p>
          {zhChrome ? "公開網址（Plus）：" : "Public URL (Plus): "}
          <a className="text-teal-800 underline break-all" href={`${PUBLIC_ADMIN_URL}docs/risk-scenarios/`}>
            {PUBLIC_ADMIN_URL}docs/risk-scenarios/
          </a>
        </p>
        <p>
          {zhChrome
            ? "原版 CRMP Admin 凍結快照不含新頁；請用本頁 Classic Edition 檢視同等範圍（無 CS／TR）。原版首頁："
            : "Frozen original CRMP Admin snapshot has no new pages; use Classic Edition here for the same scope (no CS/TR). Original home: "}
          <a className="text-teal-800 underline break-all" href={ORIGINAL_CRMP_ADMIN_URL}>
            {ORIGINAL_CRMP_ADMIN_URL}
          </a>
        </p>
      </div>

      <RiskScenariosBoard initialEdition={edition} lang={lang} />
    </div>
  );
}
