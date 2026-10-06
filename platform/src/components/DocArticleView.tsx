"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PageHeader, Badge } from "@/components/ui";
import { VantageMark } from "@/components/VantageLogo";
import { OwnerBadge } from "@/components/OwnerBadge";
import { useUiLocale } from "@/hooks/useUiLocale";
import type { DocId, DocLocale } from "@/lib/docs";
import { markdownToHtml } from "@/lib/docs-markdown";
import { fetchDocOverlay, resetDocOverlay, saveDocOverlay } from "@/lib/docs/edit-client";
import { isPublicSnapshot } from "@/lib/static-export";
import { DocEditBar } from "@/components/DocEditBar";

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
    enSub: "Each item: current prototype, files/APIs, what to build, effort, owners, done-when, and skip risk.",
    zhSub: "每一項含現行原型、檔案／API、要做什麼、工期、人力、完成標準與不做的風險。",
    href: "/admin/docs/roadmap",
  },
  OPEN_ISSUES: {
    code: "CRMP-OI-001",
    enTitle: "Open Issues",
    zhTitle: "開放議題",
    enSub: "20 issues with CS/TR catalogue v1.5 on OI-19/20 — prototype ticks vs production remaining.",
    zhSub: "20 項含 CS／TR 目錄 v1.5（OI-19／20）— 原型已勾 vs 正式仍開放。",
    href: "/admin/docs/open-issues",
  },
  PROGRESS: {
    code: "CRMP-PT-001",
    enTitle: "Progress Tracker",
    zhTitle: "進度追蹤",
    enSub: "X = open issues (columns), Y = timeline now → end-2027; status colours; responsible BU on every column.",
    zhSub: "X＝開放議題（欄）、Y＝時間軸現在→2027 年底；狀態色塊；每欄標示負責 BU。",
    href: "/admin/docs/progress",
  },
};

export function DocArticleView({
  docId,
  markdownEn,
  markdownZh,
}: {
  docId: DocId;
  markdownEn: string;
  markdownZh: string;
}) {
  const { locale, setLocale } = useUiLocale();
  const lang: DocLocale = locale === "zh-Hant" ? "zh-Hant" : "en";
  const zh = lang === "zh-Hant";
  const meta = META[docId];
  const seed = lang === "zh-Hant" ? markdownZh : markdownEn;
  const [md, setMd] = useState(seed);
  const [draft, setDraft] = useState(seed);
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const localOnly = isPublicSnapshot();

  useEffect(() => {
    let live = true;
    setEditing(false);
    setMsg(null);
    fetchDocOverlay(docId, lang).then((overlay) => {
      if (!live) return;
      const next = overlay ?? seed;
      setMd(next);
      setDraft(next);
    });
    return () => {
      live = false;
    };
  }, [docId, lang, seed]);

  const html = useMemo(() => markdownToHtml(editing ? draft : md), [editing, draft, md]);

  async function save() {
    setBusy(true);
    const result = await saveDocOverlay(docId, lang, draft);
    setBusy(false);
    if (!result.ok) {
      setMsg(result.error || (zh ? "儲存失敗" : "Save failed"));
      return;
    }
    setMd(draft);
    setEditing(false);
    setMsg(
      result.localOnly
        ? zh
          ? "已儲存在這個瀏覽器"
          : "Saved in this browser"
        : zh
          ? "已儲存"
          : "Saved"
    );
  }

  async function reset() {
    if (!window.confirm(zh ? "還原此語系為種子稿？" : "Reset this language to the seed draft?")) return;
    setBusy(true);
    await resetDocOverlay(docId, lang);
    setBusy(false);
    setMd(seed);
    setDraft(seed);
    setEditing(false);
    setMsg(zh ? "已還原種子稿" : "Restored seed draft");
  }

  return (
    <div>
      <PageHeader
        title={zh ? meta.zhTitle : meta.enTitle}
        subtitle={zh ? meta.zhSub : meta.enSub}
      />

      <div className="panel p-3 sm:p-4 mb-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap gap-2 items-center">
          <VantageMark className="h-8 w-8" />
          <Badge className="bg-teal-50 text-teal-900 border-teal-200">{meta.code}</Badge>
          <Badge className="bg-slate-100 text-slate-700 border-slate-200">v1.5</Badge>
          <OwnerBadge />
          <Link className="btn" href="/admin/docs/urls">
            {zh ? "全部網址" : "All URLs"}
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

      <div className="panel p-3 sm:p-4 mb-4">
        <DocEditBar
          zh={zh}
          editing={editing}
          busy={busy}
          dirty={editing && draft !== md}
          localOnly={localOnly}
          message={msg}
          onEdit={() => {
            setDraft(md);
            setTab("write");
            setEditing(true);
            setMsg(null);
          }}
          onCancel={() => {
            setDraft(md);
            setEditing(false);
          }}
          onSave={() => void save()}
          onReset={() => void reset()}
        />
      </div>

      {editing ? (
        <div className="space-y-3">
          <div className="action-row">
            <button type="button" className={`btn ${tab === "write" ? "btn-primary" : ""}`} onClick={() => setTab("write")}>
              {zh ? "編輯 Markdown" : "Write Markdown"}
            </button>
            <button type="button" className={`btn ${tab === "preview" ? "btn-primary" : ""}`} onClick={() => setTab("preview")}>
              {zh ? "預覽" : "Preview"}
            </button>
          </div>
          {tab === "write" ? (
            <textarea
              className="input w-full min-h-[min(70dvh,720px)] font-mono text-sm leading-relaxed"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              spellCheck={false}
              aria-label={zh ? "文件 Markdown" : "Document Markdown"}
            />
          ) : (
            <article
              className="panel p-3 sm:p-6 max-w-5xl overflow-x-auto break-word"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}
        </div>
      ) : (
        <article
          className="panel p-3 sm:p-6 max-w-5xl overflow-x-auto break-word"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  );
}
