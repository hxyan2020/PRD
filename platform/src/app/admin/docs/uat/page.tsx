import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { UatChecklistBoard } from "@/components/UatChecklistBoard";
import { PageHeader, Badge } from "@/components/ui";
import { VantageMark } from "@/components/VantageLogo";
import { OwnerBadge } from "@/components/OwnerBadge";
import { resolveDocLocale } from "@/lib/docs";
import { getUiLocale } from "@/lib/i18n-server";
import { uatSummary } from "@/lib/docs/uat-cases";
import { readSearchParams } from "@/lib/static-export";

export default async function UatPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "admin.access")) redirect("/admin");
  const sp = await readSearchParams(searchParams);
  const ui = await getUiLocale();
  const lang = sp.lang ? resolveDocLocale(sp.lang) : ui;
  const zh = lang === "zh-Hant";
  const summary = uatSummary();

  return (
    <div>
      <PageHeader
        title={zh ? "UAT 驗收清單（風險負責人）" : "UAT Checklist (Risk Owner)"}
        subtitle={
          zh
            ? `共 ${summary.count} 案 · 建議時窗約 ${Math.ceil(summary.windowEndMin / 60)} 小時 · 白話步驟涵蓋每個管理頁與 Messenger 迴路。`
            : `${summary.count} sequenced cases · ~${Math.ceil(summary.windowEndMin / 60)}h suggested window · plain-English steps covering every admin screen and the messenger loop.`
        }
        actions={
          <>
            <Link className="btn" href="/admin/docs/user-guide">
              {zh ? "使用手冊" : "User Guide"}
            </Link>
            <Link className="btn" href="/admin/messenger">
              Messenger
            </Link>
            <Link className="btn btn-primary" href="/admin/alerts">
              {zh ? "即時警報與追蹤" : "Realtime Alert & Tracker"}
            </Link>
          </>
        }
      />

      <div className="panel p-3 sm:p-4 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap gap-2 items-center">
          <VantageMark className="h-8 w-8" />
          <Badge className="bg-teal-50 text-teal-900 border-teal-200">CRMP-UAT-001</Badge>
          <OwnerBadge />
          <Badge className="bg-rose-50 text-rose-900 border-rose-200">
            Critical × {summary.bySev.Critical}
          </Badge>
          <Badge className="bg-orange-50 text-orange-900 border-orange-200">
            High × {summary.bySev.High}
          </Badge>
        </div>
        <div className="action-row">
          <Link className={`btn ${lang === "en" ? "btn-primary" : ""}`} href="/admin/docs/uat?lang=en">
            English
          </Link>
          <Link
            className={`btn ${lang === "zh-Hant" ? "btn-primary" : ""}`}
            href="/admin/docs/uat?lang=zh-Hant"
          >
            繁體中文
          </Link>
        </div>
      </div>

      <UatChecklistBoard lang={lang} />
    </div>
  );
}
