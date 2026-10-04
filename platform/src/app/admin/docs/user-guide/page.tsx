import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { DocArticlePage } from "@/components/DocArticlePage";
import { Badge } from "@/components/ui";
import { resolveDocLocale } from "@/lib/docs";
import { getUiLocale } from "@/lib/i18n-server";
import { readSearchParams } from "@/lib/static-export";

export default async function UserGuidePage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "admin.access")) redirect("/admin");
  const sp = await readSearchParams(searchParams);
  const ui = await getUiLocale();
  const lang = sp.lang ? resolveDocLocale(sp.lang) : ui;
  const zh = lang === "zh-Hant";

  const quick = [
    { href: "/admin/messenger", en: "Messenger", zh: "Messenger" },
    { href: "/admin/ai-analyses", en: "AI Analyses", zh: "AI 分析" },
    { href: "/admin/ai-admin", en: "AI Admin", zh: "AI 管理" },
    { href: "/admin/market-intel", en: "Market Intel", zh: "市場情報" },
    { href: "/admin/docs/uat", en: "UAT", zh: "UAT" },
    { href: "/admin/docs/urls", en: "All URLs", zh: "全部網址" },
  ];

  return (
    <div>
      <div className="panel p-3 sm:p-4 mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap gap-2 items-center">
          <Badge className="bg-teal-50 text-teal-900 border-teal-200">CRMP-UG-001</Badge>
          <Badge className="bg-slate-100 text-slate-700 border-slate-200">
            {zh ? "操作手冊 · 英／繁中" : "Operator handbook · EN / 繁中"}
          </Badge>
        </div>
        <p className="text-sm text-[var(--muted)]">
          {zh
            ? "依角色說明登入、警報分流、雙 AI、Demo Messenger、Maker/Checker 與安全習慣。"
            : "Role-based walkthrough for login, alert triage, dual-AI, Demo Messenger, maker/checker, and safety habits."}
        </p>
        <div className="action-row">
          {quick.map((q) => (
            <Link key={q.href} className="btn" href={q.href}>
              {zh ? q.zh : q.en}
            </Link>
          ))}
        </div>
      </div>

      <DocArticlePage docId="USER_GUIDE" langParam={sp.lang} />
    </div>
  );
}
