import Link from "next/link";
import { PageHeader, Badge } from "@/components/ui";
import { markdownToHtml, readDocMarkdown, resolveDocLocale, type DocId, type DocLocale } from "@/lib/docs";

const META: Record<
  DocId,
  { code: string; enTitle: string; zhTitle: string; enSub: string; zhSub: string; href: string }
> = {
  TSD: {
    code: "CRMP-TSD-001",
    enTitle: "Technical Specification Design (TSD)",
    zhTitle: "技術規格設計（TSD）",
    enSub: "Architecture, data model, AI Admin, second-AI challenger, APIs.",
    zhSub: "架構、資料模型、AI Admin、第二 AI 挑戰者、API。",
    href: "/admin/docs/tsd",
  },
  PRD: {
    code: "CRMP-PRD-001",
    enTitle: "Product Requirements Document (PRD)",
    zhTitle: "產品需求文件（PRD）",
    enSub: "Goals, personas, scope, acceptance criteria for the CRMP prototype.",
    zhSub: "CRMP 原型之目標、角色、範圍與驗收標準。",
    href: "/admin/docs/prd",
  },
  USER_GUIDE: {
    code: "CRMP-UG-001",
    enTitle: "User Guide",
    zhTitle: "使用手冊",
    enSub: "Operator handbook for Risk, Ops, AI and System admins.",
    zhSub: "風險、營運、AI 與系統管理員操作手冊。",
    href: "/admin/docs/user-guide",
  },
  UAT: {
    code: "CRMP-UAT-001",
    enTitle: "UAT Checklist (Risk Owner)",
    zhTitle: "UAT 驗收清單（風險負責人）",
    enSub: "Sequenced test cases with owner, dependency, severity and pass thresholds.",
    zhSub: "依序測試案例：負責人、依賴、嚴重度與通過門檻。",
    href: "/admin/docs/uat",
  },
  ECOSYSTEM: {
    code: "CRMP-ECO-001",
    enTitle: "Vantage Ecosystem Adoption Evaluation",
    zhTitle: "Vantage 生態導入評估",
    enSub: "Foundations, people, budget bands, timeline phases, risks and precautions.",
    zhSub: "基礎建設、人力、預算帶、時程階段、風險與注意事項。",
    href: "/admin/docs/ecosystem",
  },
  ROADMAP: {
    code: "CRMP-RM-001",
    enTitle: "Platform Improvement Roadmap",
    zhTitle: "平台改進路線圖",
    enSub: "Prioritised improvements with effort, people, dependencies and severity.",
    zhSub: "依優先序的改進項目：工期、人力、依賴與嚴重度。",
    href: "/admin/docs/roadmap",
  },
};

export function DocArticlePage({
  docId,
  langParam,
}: {
  docId: DocId;
  langParam?: string | null;
}) {
  const lang: DocLocale = resolveDocLocale(langParam);
  const meta = META[docId];
  const html = markdownToHtml(readDocMarkdown(docId, lang));

  return (
    <div>
      <PageHeader
        title={lang === "zh-Hant" ? meta.zhTitle : meta.enTitle}
        subtitle={lang === "zh-Hant" ? meta.zhSub : meta.enSub}
      />

      <div className="panel p-3 sm:p-4 mb-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap gap-2 items-center">
          <Badge className="bg-teal-50 text-teal-900 border-teal-200">{meta.code}</Badge>
          <Badge className="bg-slate-100 text-slate-700 border-slate-200">v1.0</Badge>
          <Link className="btn" href="/admin/docs/urls">
            {lang === "zh-Hant" ? "全部網址" : "All URLs"}
          </Link>
        </div>
        <div className="action-row">
          <Link className={`btn ${lang === "en" ? "btn-primary" : ""}`} href={`${meta.href}?lang=en`}>
            English
          </Link>
          <Link
            className={`btn ${lang === "zh-Hant" ? "btn-primary" : ""}`}
            href={`${meta.href}?lang=zh-Hant`}
          >
            繁體中文
          </Link>
        </div>
      </div>

      <article
        className="panel p-3 sm:p-6 max-w-5xl overflow-x-auto break-word"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
