import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { DocArticlePage } from "@/components/DocArticlePage";
import { Badge } from "@/components/ui";
import { resolveDocLocale } from "@/lib/docs";

export default async function PrdPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "admin.access")) redirect("/admin");
  const sp = await searchParams;
  const lang = resolveDocLocale(sp.lang);
  const zh = lang === "zh-Hant";

  const cards = [
    { label: zh ? "P0 需求" : "P0 requirements", value: "10" },
    { label: zh ? "P1 需求" : "P1 requirements", value: "6" },
    { label: zh ? "產品範圍" : "Product scope", value: "CFD + Crypto" },
    { label: zh ? "驗收入口" : "Acceptance", value: "UAT-01…20" },
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
          <Badge className="bg-teal-50 text-teal-900 border-teal-200">CRMP-PRD-001</Badge>
          <Badge className="bg-slate-100 text-slate-700 border-slate-200">
            {zh ? "原型／可示範" : "Prototype / demo-ready"}
          </Badge>
        </div>
        <div className="action-row">
          <Link className="btn" href="/admin/docs/tsd">
            TSD
          </Link>
          <Link className="btn" href="/admin/docs/uat">
            UAT
          </Link>
          <Link className="btn btn-primary" href="/admin/docs/user-guide">
            {zh ? "使用手冊" : "User Guide"}
          </Link>
        </div>
      </div>

      <DocArticlePage docId="PRD" langParam={sp.lang} />
    </div>
  );
}
