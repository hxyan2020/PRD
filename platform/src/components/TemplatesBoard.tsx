"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui";
import { SKILL_TEMPLATES, type SkillTemplate } from "@/lib/docs/skill-templates";
import { KNOWLEDGE_TREE_TEMPLATES, type KtTemplate } from "@/lib/docs/knowledge-tree-templates";
import { useUiLocale } from "@/hooks/useUiLocale";

type Tab = "skills" | "knowledge_tree";

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function CopyBlock({
  label,
  text,
  zh,
}: {
  label: string;
  text: string;
  zh: boolean;
}) {
  const [ok, setOk] = useState<string | null>(null);
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-[var(--muted)]">{label}</span>
        <button
          type="button"
          className="btn text-[11px] !min-h-7 !px-2"
          onClick={() => {
            void copyText(text).then((pass) => {
              setOk(pass ? (zh ? "已複製" : "Copied") : zh ? "複製失敗" : "Copy failed");
              setTimeout(() => setOk(null), 1600);
            });
          }}
        >
          {zh ? "複製" : "Copy"}
        </button>
        {ok ? <span className="text-[11px] text-teal-800">{ok}</span> : null}
      </div>
      <pre className="text-[11px] leading-relaxed bg-slate-950 text-slate-100 rounded-lg p-3 overflow-x-auto max-h-80 whitespace-pre-wrap">
        {text}
      </pre>
    </div>
  );
}

function SkillCard({ t, zh }: { t: SkillTemplate; zh: boolean }) {
  return (
    <article className="panel p-3 sm:p-4 space-y-3" id={t.id}>
      <div className="flex flex-wrap gap-2 items-start justify-between">
        <div>
          <h3 className="font-semibold text-[var(--ink)]">{zh ? t.title_zh : t.title_en}</h3>
          <p className="text-sm text-[var(--muted)] mt-1">{zh ? t.blurb_zh : t.blurb_en}</p>
          <div className="text-[11px] text-[var(--muted)] mt-1">{t.id}</div>
        </div>
        <Badge className="bg-orange-50 text-orange-950 border-orange-200">{t.kind}</Badge>
      </div>
      <div className="text-xs text-[var(--muted)]">
        <span className="font-medium">{zh ? "貼上位置：" : "Paste into: "}</span>
        {t.files.join(" · ")}
      </div>
      <CopyBlock label={zh ? "技能本體 (TypeScript)" : "Skill body (TypeScript)"} text={t.body_ts} zh={zh} />
      {t.zh_ts ? <CopyBlock label={zh ? "繁中覆寫 stub" : "ZH overlay stub"} text={t.zh_ts} zh={zh} /> : null}
      {t.route_ts ? <CopyBlock label={zh ? "升級路線綁定" : "Escalation route bind"} text={t.route_ts} zh={zh} /> : null}
      {t.rag_bind_ts ? <CopyBlock label={zh ? "RAG 綁定" : "RAG bind"} text={t.rag_bind_ts} zh={zh} /> : null}
    </article>
  );
}

function KtCard({ t, zh }: { t: KtTemplate; zh: boolean }) {
  const checks = zh ? t.checklist_zh : t.checklist_en;
  return (
    <article className="panel p-3 sm:p-4 space-y-3" id={t.id}>
      <div className="flex flex-wrap gap-2 items-start justify-between">
        <div>
          <h3 className="font-semibold text-[var(--ink)]">{zh ? t.title_zh : t.title_en}</h3>
          <p className="text-sm text-[var(--muted)] mt-1">{zh ? t.blurb_zh : t.blurb_en}</p>
          <div className="text-[11px] text-[var(--muted)] mt-1">{t.id}</div>
        </div>
        <Badge className="bg-teal-50 text-teal-900 border-teal-200">{t.kind}</Badge>
      </div>
      <div className="text-xs text-[var(--muted)]">
        <span className="font-medium">{zh ? "貼上位置：" : "Paste into: "}</span>
        {t.files.join(" · ")}
      </div>
      {checks?.length ? (
        <ul className="list-disc pl-5 text-sm space-y-0.5">
          {checks.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      ) : null}
      <CopyBlock label={zh ? "範本 (TypeScript)" : "Template (TypeScript)"} text={t.body_ts} zh={zh} />
    </article>
  );
}

export function TemplatesBoard() {
  const { locale } = useUiLocale();
  const zh = locale === "zh-Hant";
  const [tab, setTab] = useState<Tab>("skills");
  const [q, setQ] = useState("");

  const skillRows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return SKILL_TEMPLATES.filter((t) => {
      if (!needle) return true;
      return `${t.id} ${t.kind} ${t.title_en} ${t.title_zh} ${t.blurb_en}`.toLowerCase().includes(needle);
    });
  }, [q]);

  const ktRows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return KNOWLEDGE_TREE_TEMPLATES.filter((t) => {
      if (!needle) return true;
      return `${t.id} ${t.kind} ${t.title_en} ${t.title_zh} ${t.blurb_en}`.toLowerCase().includes(needle);
    });
  }, [q]);

  return (
    <div className="space-y-4">
      <div className="panel p-3 sm:p-4 space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          <Badge className="bg-teal-50 text-teal-900 border-teal-200">CRMP-TPL-001</Badge>
          <Badge className="bg-cyan-50 text-cyan-900 border-cyan-200">v1.0</Badge>
          <Badge className="bg-orange-50 text-orange-950 border-orange-200">
            {zh ? `技能範本 ${SKILL_TEMPLATES.length}` : `Skill templates ${SKILL_TEMPLATES.length}`}
          </Badge>
          <Badge className="bg-teal-50 text-teal-900 border-teal-200">
            {zh ? `知識樹範本 ${KNOWLEDGE_TREE_TEMPLATES.length}` : `KT templates ${KNOWLEDGE_TREE_TEMPLATES.length}`}
          </Badge>
        </div>
        <p className="text-sm text-[var(--muted)] max-w-4xl">
          {zh
            ? "複製 TypeScript 範本以新增 AI 技能或知識樹節點（RAG 葉、技能↔RAG 邊、領域主幹、連結鏈）。填滿 YOUR_* 後接到 catalog／rag-corpus／skill-rag-map，重啟後即可在 Skills 與 Knowledge Tree 看到。"
            : "Copy TypeScript templates to author new AI skills or Knowledge Tree nodes (RAG leaf, skill↔RAG edge, domain trunk, chain). Fill YOUR_* placeholders, wire catalog / rag-corpus / skill-rag-map, restart to see them on Skills and Knowledge Tree."}
        </p>
        <div className="flex flex-wrap gap-2 items-center">
          <button
            type="button"
            className={`btn text-xs !min-h-8 ${tab === "skills" ? "btn-primary" : ""}`}
            onClick={() => setTab("skills")}
          >
            {zh ? "技能範本" : "Skill templates"}
          </button>
          <button
            type="button"
            className={`btn text-xs !min-h-8 ${tab === "knowledge_tree" ? "btn-primary" : ""}`}
            onClick={() => setTab("knowledge_tree")}
          >
            {zh ? "知識樹範本" : "Knowledge Tree templates"}
          </button>
          <input
            className="input text-sm min-w-[12rem] flex-1"
            placeholder={zh ? "搜尋範本…" : "Search templates…"}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {tab === "skills" ? (
        <div className="space-y-4">
          {skillRows.map((t) => (
            <SkillCard key={t.id} t={t} zh={zh} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {ktRows.map((t) => (
            <KtCard key={t.id} t={t} zh={zh} />
          ))}
        </div>
      )}
    </div>
  );
}
