import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { DocArticlePage } from "@/components/DocArticlePage";
import { Badge } from "@/components/ui";
import { resolveDocLocale } from "@/lib/docs";
import { getUiLocale } from "@/lib/i18n-server";
import { readSearchParams } from "@/lib/static-export";

export default async function TsdPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "admin.access")) redirect("/admin");
  const sp = await readSearchParams(searchParams);
  const ui = await getUiLocale();
  const lang = sp.lang ? resolveDocLocale(sp.lang) : ui;
  const zh = lang === "zh-Hant";

  const cards = [
    { label: zh ? "文件版次" : "Document version", value: "v1.2" },
    { label: zh ? "章節" : "Sections", value: "16" },
    { label: zh ? "核心模組" : "Core modules", value: zh ? "挑戰者 · Messenger · 市場情報" : "Challenger · Messenger · Market Intel" },
    { label: zh ? "技術棧" : "Stack", value: "Next.js 15 + SQLite" },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4">
        {cards.map((c) => (
          <div key={c.label} className="panel p-3 sm:p-4">
            <div className="text-[10px] sm:text-xs uppercase tracking-[0.08em] text-[var(--muted)]">{c.label}</div>
            <div className="mt-1 font-semibold text-sm sm:text-base break-word">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="panel p-3 sm:p-4 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap gap-2 items-center">
          <Badge className="bg-indigo-50 text-indigo-900 border-indigo-200">CRMP-TSD-001</Badge>
          <Badge className="bg-slate-100 text-slate-700 border-slate-200">
            {zh ? "原型／活規格" : "Prototype / living spec"}
          </Badge>
        </div>
        <div className="action-row">
          <Link className="btn" href="/admin/docs/prd">
            PRD
          </Link>
          <Link className="btn" href="/admin/docs/uat">
            UAT
          </Link>
          <Link className="btn btn-primary" href="/admin/docs/user-guide">
            {zh ? "使用手冊" : "User Guide"}
          </Link>
        </div>
      </div>

      <DocArticlePage docId="TSD" langParam={sp.lang} />
    </div>
  );
}
