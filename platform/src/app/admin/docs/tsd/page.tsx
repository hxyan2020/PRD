import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { markdownToHtml, readTsdMarkdown, type DocLocale } from "@/lib/docs";
import { PageHeader, Badge } from "@/components/ui";

export default async function TsdPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "admin.access")) redirect("/admin");

  const sp = await searchParams;
  const lang: DocLocale = sp.lang === "zh-Hant" || sp.lang === "zh" ? "zh-Hant" : "en";
  const md = readTsdMarkdown(lang);
  const html = markdownToHtml(md);

  return (
    <div>
      <PageHeader
        title={lang === "zh-Hant" ? "技術規格設計（TSD）" : "Technical Specification Design (TSD)"}
        subtitle={
          lang === "zh-Hant"
            ? "含完整 §8 AI Admin 管理頁規格：介面分頁、API、資料模型、RBAC、Maker/Checker。"
            : "Includes full §8 AI Admin management page specs: UI tabs, API, data model, RBAC, maker/checker."
        }
      />

      <div className="panel p-4 mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 items-center">
          <Badge className="bg-teal-50 text-teal-900 border-teal-200">CRMP-TSD-001</Badge>
          <Badge className="bg-slate-100 text-slate-700 border-slate-200">v1.1</Badge>
          <Link className="btn btn-primary" href="/admin/ai-admin">
            {lang === "zh-Hant" ? "開啟 AI Admin" : "Open AI Admin"}
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className={`btn ${lang === "en" ? "btn-primary" : ""}`} href="/admin/docs/tsd?lang=en">
            English
          </Link>
          <Link
            className={`btn ${lang === "zh-Hant" ? "btn-primary" : ""}`}
            href="/admin/docs/tsd?lang=zh-Hant"
          >
            繁體中文
          </Link>
        </div>
      </div>

      <article
        className="panel p-6 max-w-5xl prose-crmp"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
