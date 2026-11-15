import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { DocArticlePage } from "@/components/DocArticlePage";
import { Badge } from "@/components/ui";
import { resolveDocLocale } from "@/lib/docs";

export default async function RoadmapPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "admin.access")) redirect("/admin");
  const sp = await searchParams;
  const lang = resolveDocLocale(sp.lang);
  const zh = lang === "zh-Hant";

  const cards = [
    { label: zh ? "待辦項目" : "Backlog items", value: "20" },
    { label: zh ? "Critical" : "Critical", value: "5" },
    { label: zh ? "建議波次" : "Delivery waves", value: "A → E" },
    { label: zh ? "部分完成" : "Partial / done", value: "RM-07 · RM-08" },
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
          <Badge className="bg-amber-50 text-amber-900 border-amber-200">CRMP-RM-001</Badge>
          <Badge className="bg-slate-100 text-slate-700 border-slate-200">
            {zh ? "原型之後 · 活待辦" : "Post-prototype · living backlog"}
          </Badge>
        </div>
        <div className="action-row">
          <Link className="btn" href="/admin/docs/ecosystem">
            {zh ? "生態評估" : "Ecosystem"}
          </Link>
          <Link className="btn" href="/admin/docs/prd">
            PRD
          </Link>
          <Link className="btn btn-primary" href="/admin/docs/uat">
            UAT
          </Link>
        </div>
      </div>

      <DocArticlePage docId="ROADMAP" langParam={sp.lang} />
    </div>
  );
}
