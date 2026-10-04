"use client";

import Link from "next/link";
import { PageHeader, Badge } from "@/components/ui";
import { useUiLocale } from "@/hooks/useUiLocale";
import type { DocId, DocLocale } from "@/lib/docs";

const META: Record<
  DocId,
  { code: string; enTitle: string; zhTitle: string; enSub: string; zhSub: string; href: string }
> = {
  TSD: {
    code: "CRMP-TSD-001",
    enTitle: "Technical Specification Design (TSD)",
    zhTitle: "技術規格設計（TSD）",
    enSub: "Architecture, data model, full admin surface map, AI Admin, messenger, APIs.",
    zhSub: "架構、資料模型、完整管理介面地圖、AI Admin、Messenger、API。",
    href: "/admin/docs/tsd",
  },
  PRD: {
    code: "CRMP-PRD-001",
    enTitle: "Product Requirements Document (PRD)",
    zhTitle: "產品需求文件（PRD）",
    enSub: "Goals, personas, and a feature catalogue for every admin screen.",
    zhSub: "目標、角色，以及涵蓋每一管理畫面的功能目錄。",
    href: "/admin/docs/prd",
  },
  USER_GUIDE: {
    code: "CRMP-UG-001",
    enTitle: "User Guide",
    zhTitle: "使用手冊",
    enSub: "Plain-English how-to for every left-nav page, login, unread badges and messenger.",
    zhSub: "左側每一頁、登入、未讀徽章與 Messenger 的白話操作說明。",
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

export function DocArticleView({
  docId,
  htmlEn,
  htmlZh,
}: {
  docId: DocId;
  htmlEn: string;
  htmlZh: string;
}) {
  const { locale, setLocale } = useUiLocale();
  const lang: DocLocale = locale === "zh-Hant" ? "zh-Hant" : "en";
  const meta = META[docId];
  const html = lang === "zh-Hant" ? htmlZh : htmlEn;

  return (
    <div>
      <PageHeader
        title={lang === "zh-Hant" ? meta.zhTitle : meta.enTitle}
        subtitle={lang === "zh-Hant" ? meta.zhSub : meta.enSub}
      />

      <div className="panel p-3 sm:p-4 mb-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap gap-2 items-center">
          <Badge className="bg-teal-50 text-teal-900 border-teal-200">{meta.code}</Badge>
          <Badge className="bg-slate-100 text-slate-700 border-slate-200">v1.5</Badge>
          <Badge className="bg-orange-50 text-orange-900 border-orange-200">
            {lang === "zh-Hant" ? "負責人 YAN Haixiang" : "Owner YAN Haixiang"}
          </Badge>
          <Link className="btn" href="/admin/docs/urls">
            {lang === "zh-Hant" ? "全部網址" : "All URLs"}
          </Link>
        </div>
        <div className="action-row">
          <button
            type="button"
            className={`btn ${lang === "en" ? "btn-primary" : ""}`}
            onClick={() => setLocale("en")}
          >
            English
          </button>
          <button
            type="button"
            className={`btn ${lang === "zh-Hant" ? "btn-primary" : ""}`}
            onClick={() => setLocale("zh-Hant")}
          >
            繁體中文
          </button>
        </div>
      </div>

      <article
        className="panel p-3 sm:p-6 max-w-5xl overflow-x-auto break-word"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
