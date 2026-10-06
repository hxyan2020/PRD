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
    { href: "/admin/cs-desk", en: "CS / TR Desk", zh: "CS／TR 台" },
    { href: "/cs", en: "Client portal", zh: "客戶入口" },
    { href: "/admin/messenger", en: "Messenger", zh: "Messenger" },
    { href: "/admin/alerts", en: "Realtime Alert & Tracker", zh: "即時警報與追蹤" },
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
            ? "白話說明左側每一頁，以及 24/7 CS／TR：公開 /cs 入口、C1／表單／信箱、自動信件直到客戶回覆、專用技能。"
            : "Plain-English how-to for every left-nav page, plus 24/7 CS/TR: public /cs portal, C1/form/mailbox, auto-email until the client replies, dedicated skills."}
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
