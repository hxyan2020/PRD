import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { DocArticlePage } from "@/components/DocArticlePage";
import { Badge } from "@/components/ui";
import { resolveDocLocale } from "@/lib/docs";
import { getUiLocale } from "@/lib/i18n-server";

export default async function EcosystemPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "admin.access")) redirect("/admin");
  const sp = await searchParams;
  const ui = await getUiLocale();
  const lang = sp.lang ? resolveDocLocale(sp.lang) : ui;
  const zh = lang === "zh-Hant";

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4">
        <div className="panel p-3 sm:p-4">
          <div className="text-[10px] sm:text-xs uppercase tracking-[0.08em] text-[var(--muted)]">
            {zh ? "建置預算（A–C）" : "Build budget (A–C)"}
          </div>
          <div className="mt-1 font-semibold text-sm sm:text-base tabular-nums break-word">$730k–$1.3M</div>
        </div>
        <div className="panel p-3 sm:p-4">
          <div className="text-[10px] sm:text-xs uppercase tracking-[0.08em] text-[var(--muted)]">
            {zh ? "年營運（D）" : "Annual run (D)"}
          </div>
          <div className="mt-1 font-semibold text-sm sm:text-base tabular-nums">$150k–$300k</div>
        </div>
        <div className="panel p-3 sm:p-4">
          <div className="text-[10px] sm:text-xs uppercase tracking-[0.08em] text-[var(--muted)]">
            {zh ? "穩態人力" : "Steady-state team"}
          </div>
          <div className="mt-1 font-semibold text-sm sm:text-base">~7–11 FTE</div>
        </div>
        <div className="panel p-3 sm:p-4">
          <div className="text-[10px] sm:text-xs uppercase tracking-[0.08em] text-[var(--muted)]">
            {zh ? "交付階段" : "Delivery phases"}
          </div>
          <div className="mt-1 font-semibold text-sm sm:text-base">{zh ? "四階段" : "4 phases"}</div>
        </div>
      </div>

      <div className="panel p-3 sm:p-4 mb-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <Badge className="bg-teal-50 text-teal-900 border-teal-200">CRMP-ECO-001</Badge>
          <Badge className="bg-amber-50 text-amber-900 border-amber-200">
            {zh ? "規劃包（非報價）" : "Planning pack (not a quote)"}
          </Badge>
        </div>
        <div className="action-row">
          <Link className="btn" href="/admin/docs/uat">
            {zh ? "UAT 清單" : "UAT checklist"}
          </Link>
          <Link className="btn" href="/admin/docs/roadmap">
            {zh ? "路線圖" : "Roadmap"}
          </Link>
          <Link className="btn btn-primary" href="/admin/docs/urls">
            {zh ? "全部網址" : "All URLs"}
          </Link>
        </div>
      </div>

      <DocArticlePage docId="ECOSYSTEM" langParam={sp.lang} />
    </div>
  );
}
