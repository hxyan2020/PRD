import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { DocArticlePage } from "@/components/DocArticlePage";
import { Badge } from "@/components/ui";
import { resolveDocLocale } from "@/lib/docs";
import { getUiLocale } from "@/lib/i18n-server";
import { readSearchParams } from "@/lib/static-export";

export default async function AiUseManualPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "admin.access")) redirect("/admin");
  const sp = await readSearchParams(searchParams);
  const ui = await getUiLocale();
  const lang = sp.lang ? resolveDocLocale(sp.lang) : ui;
  const zh = lang === "zh-Hant";

  const quick = [
    { href: "/admin/alerts", en: "Realtime Alert", zh: "即時警報" },
    { href: "/admin/skills", en: "AI Skills", zh: "AI 技能" },
    { href: "/admin/ai-admin", en: "AI Admin", zh: "AI 管理" },
    { href: "/admin/security/ai-access", en: "AI Access Security", zh: "AI 存取安全" },
    { href: "/admin/cs-desk", en: "CS / TR Desk", zh: "CS／TR 台" },
    { href: "/admin/messenger", en: "Messenger", zh: "示範 Messenger" },
    { href: "/admin/docs/user-guide", en: "User Guide", zh: "使用手冊" },
    { href: "/admin/docs/roadmap", en: "Roadmap RM-03", zh: "路線圖 RM-03" },
  ];

  return (
    <div>
      <div className="panel p-3 sm:p-4 mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap gap-2 items-center">
          <Badge className="bg-teal-50 text-teal-900 border-teal-200">CRMP-AIU-001</Badge>
          <Badge className="bg-slate-100 text-slate-700 border-slate-200">
            {zh ? "AI 識字手冊 · 英／繁中" : "AI literacy handbook · EN / 繁中"}
          </Badge>
        </div>
        <p className="text-sm text-[var(--muted)]">
          {zh
            ? "給風險管理與 CS／TR 操作人員：AI 是什麼、本台怎麼用、LLM／技能／代理／MCP 等詞、哪裡會錯、怎麼偵測改正預防。圖解可切英／繁。"
            : "For Risk Management and CS/TR operators: what AI is, how this desk uses it, LLM / skill / agent / MCP terms, where it goes wrong, and how to detect, correct and prevent. Diagrams switch with EN / 繁中."}
        </p>
        <div className="action-row">
          {quick.map((q) => (
            <Link key={q.href} className="btn" href={q.href}>
              {zh ? q.zh : q.en}
            </Link>
          ))}
        </div>
      </div>

      <DocArticlePage docId="AI_USE" langParam={sp.lang} />
    </div>
  );
}
