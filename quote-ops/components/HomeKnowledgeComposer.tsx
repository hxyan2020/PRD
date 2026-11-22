"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import type { KbKind, KbNode } from "@/lib/kb/types";
import { useProduct } from "@/lib/product/context";

type Suggestion = {
  parentId: string;
  parentTitle: string;
  score: number;
  reasonZh: string;
  reasonEn: string;
  beforeTitle: string;
  afterTitle: string;
};

const KINDS: KbKind[] = ["custom", "article", "risk", "skill", "pipeline", "database", "folder"];

const SNIPPETS = {
  zh: {
    h2: "\n\n## 小节标题\n\n",
    list: "\n\n- 要点一\n- 要点二\n- 要点三\n\n",
    table: "\n\n| 列 A | 列 B | 列 C |\n| --- | --- | --- |\n| 内容 | 内容 | 内容 |\n\n",
  },
  en: {
    h2: "\n\n## Section\n\n",
    list: "\n\n- Point one\n- Point two\n- Point three\n\n",
    table: "\n\n| Col A | Col B | Col C |\n| --- | --- | --- |\n| cell | cell | cell |\n\n",
  },
};

/** Homepage composer: create / append rich knowledge with AI placement. */
export function HomeKnowledgeComposer() {
  const { locale, t } = useI18n();
  const { product, def } = useProduct();
  const [isAdmin, setIsAdmin] = useState(false);
  const [nodes, setNodes] = useState<KbNode[]>([]);
  const [mode, setMode] = useState<"create" | "append">("create");
  const [titleZh, setTitleZh] = useState("");
  const [summaryZh, setSummaryZh] = useState("");
  const [bodyZh, setBodyZh] = useState("");
  const [kind, setKind] = useState<KbKind>("custom");
  const [parentId, setParentId] = useState("folder-custom");
  const [appendTargetId, setAppendTargetId] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [pickedSuggest, setPickedSuggest] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);

  const loadNodes = useCallback(async () => {
    const [meRes, listRes] = await Promise.all([
      fetch("/api/me"),
      fetch(`/api/kb?sort=title&order=asc&product=${product}`),
    ]);
    const me = (await meRes.json()) as { isAdmin?: boolean };
    setIsAdmin(!!me.isAdmin);
    const list = (await listRes.json()) as { nodes: KbNode[] };
    setNodes(list.nodes || []);
    const foldersOnly = (list.nodes || []).filter((n) => n.kind === "folder");
    const pages = (list.nodes || []).filter((n) => n.kind !== "folder");
    const defaultParent =
      product === "v-exchange-perp"
        ? foldersOnly.find((f) => f.id === "folder-v-exchange")?.id || foldersOnly[0]?.id || "folder-v-exchange"
        : foldersOnly.find((f) => f.id === "folder-custom")?.id || "folder-custom";
    setParentId(defaultParent);
    setAppendTargetId(pages[0]?.id || "");
  }, [product]);

  useEffect(() => {
    void loadNodes();
  }, [loadNodes]);

  const folders = useMemo(() => nodes.filter((n) => n.kind === "folder"), [nodes]);
  const pages = useMemo(() => nodes.filter((n) => n.kind !== "folder"), [nodes]);

  const snippets = locale === "zh-CN" ? SNIPPETS.zh : SNIPPETS.en;

  function insertSnippet(s: string) {
    setBodyZh((b) => `${b}${s}`);
  }

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setMsg(null);
    try {
      for (const file of Array.from(files)) {
        const dataUrl = await readFile(file);
        const res = await fetch("/api/kb/media", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name: file.name,
            mime: file.type || "application/octet-stream",
            dataUrl,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `upload ${res.status}`);
        const media = data.media as { dataUrl: string; name: string; kind: string };
        const md =
          media.kind === "image"
            ? `\n\n![${media.name}](${media.dataUrl})\n\n`
            : media.kind === "video"
              ? `\n\n<video src="${media.dataUrl}" controls></video>\n\n`
              : `\n\n[${media.name}](${media.dataUrl})\n\n`;
        setBodyZh((b) => b + md);
      }
      setMsg(t("媒体已插入正文", "Media inserted into body"));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function suggestPlacement() {
    if (!titleZh.trim() && !bodyZh.trim()) {
      setMsg(t("请先填写标题或正文再推荐位置", "Add a title or body before suggesting placement"));
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/kb", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "suggest",
          titleZh: titleZh || bodyZh.slice(0, 40),
          bodyZh,
          tags: tags.split(/[,，]/).map((s) => s.trim()).filter(Boolean),
          kind,
        }),
      });
      const data = (await res.json()) as { suggestions: Suggestion[] };
      setSuggestions(data.suggestions || []);
      if (data.suggestions?.[0]) {
        setParentId(data.suggestions[0].parentId);
        setPickedSuggest(data.suggestions[0].parentId);
        setMode("create");
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "suggest failed");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    setBusy(true);
    setMsg(null);
    setCreatedSlug(null);
    try {
      const tagList = tags.split(/[,，]/).map((s) => s.trim()).filter(Boolean);
      if (mode === "append") {
        const target = appendTargetId;
        if (!target) throw new Error(t("请选择要追加的页面", "Pick a page to append to"));
        if (!bodyZh.trim()) throw new Error(t("追加内容不能为空", "Append body cannot be empty"));
        const res = await fetch(`/api/kb/${target}`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            action: "append",
            appendZh: bodyZh,
            appendEn: bodyZh,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        setMsg(t("已追加到已有知识页", "Appended to existing page"));
        setCreatedSlug(data.node?.slug ?? null);
        setBodyZh("");
      } else {
        if (!titleZh.trim()) throw new Error(t("请填写标题", "Title required"));
        const productTags =
          product === "v-exchange-perp"
            ? Array.from(new Set([...tagList, "v-exchange-perp", "perpetual", "永续"]))
            : Array.from(new Set([...tagList, "cfd-broker"]));
        const res = await fetch("/api/kb", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            titleZh,
            summaryZh,
            bodyZh,
            kind,
            parentId,
            tags: productTags,
            status,
            payload: { product },
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        setMsg(t("已形成新知识节点", "Created new knowledge node"));
        setCreatedSlug(data.node?.slug ?? null);
        setTitleZh("");
        setSummaryZh("");
        setBodyZh("");
        setTags("");
        setSuggestions([]);
      }
      await loadNodes();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "save failed");
    } finally {
      setBusy(false);
    }
  }

  if (!isAdmin) return null;

  const picked = suggestions.find((s) => s.parentId === pickedSuggest) ?? suggestions[0];

  return (
    <section className="rounded-2xl border border-copper/30 bg-white/95 p-4 sm:p-6 animate-rise">
      <div className="flex flex-wrap items-start gap-2">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-copper">
            {t("管理员 · 新建知识", "Admin · Compose knowledge")}
          </p>
          <h2 className="mt-1 font-display text-2xl text-ink">
            {t("写入任意内容形成知识节点", "Turn any content into a knowledge node")}
          </h2>
          <p className="mt-1 text-xs text-copper">
            {t(`写入产品线：${def.shortZh}`, `Writing into: ${def.shortEn}`)}
          </p>
          <p className="mt-1 max-w-3xl text-sm text-mist">
            {t(
              "支持长文、标题、列表、表格，以及图片 / 视频 / 文件。可新建到选定分类，或追加到已有页面；也可一键让 AI 推荐插入位置并给出前后对比。",
              "Long text, headings, lists, tables, plus images / videos / files. Create under a folder or append to an existing page; or let AI suggest placement with before/after preview.",
            )}
          </p>
        </div>
        <Link href="/admin" className="ml-auto text-xs text-sea hover:underline">
          {t("完整管理台", "Full admin")} →
        </Link>
      </div>

      <div className="mt-4 grid w-full grid-cols-2 gap-1 rounded-lg border border-line bg-paper p-0.5 text-xs sm:inline-flex sm:w-fit">
        <button
          type="button"
          className={`min-h-10 rounded-md px-3 py-2 touch-manipulation sm:min-h-0 sm:py-1.5 ${
            mode === "create" ? "bg-ink text-paper" : "text-mist"
          }`}
          onClick={() => setMode("create")}
        >
          {t("新建到节点", "Create under node")}
        </button>
        <button
          type="button"
          className={`min-h-10 rounded-md px-3 py-2 touch-manipulation sm:min-h-0 sm:py-1.5 ${
            mode === "append" ? "bg-ink text-paper" : "text-mist"
          }`}
          onClick={() => setMode("append")}
        >
          {t("追加到已有页面", "Append to page")}
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {mode === "create" ? (
          <>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-[11px] uppercase tracking-wide text-mist">
                {t("标题（必填）", "Title (required)")}
              </span>
              <input
                className="field"
                value={titleZh}
                onChange={(e) => setTitleZh(e.target.value)}
                placeholder={t("例如：XAUUSD 开盘保护值班要点", "e.g. XAUUSD open-protection duty notes")}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-[11px] uppercase tracking-wide text-mist">
                {t("摘要", "Summary")}
              </span>
              <input
                className="field"
                value={summaryZh}
                onChange={(e) => setSummaryZh(e.target.value)}
                placeholder={t("一句话说明用途", "One-line purpose")}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] uppercase tracking-wide text-mist">
                {t("父节点（分类）", "Parent folder")}
              </span>
              <select
                className="field"
                value={parentId}
                onChange={(e) => {
                  setParentId(e.target.value);
                  setPickedSuggest(e.target.value);
                }}
              >
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {locale === "zh-CN" ? f.titleZh : f.titleEn || f.titleZh}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] uppercase tracking-wide text-mist">
                {t("类型 / 状态", "Kind / status")}
              </span>
              <div className="flex gap-2">
                <select className="field" value={kind} onChange={(e) => setKind(e.target.value as KbKind)}>
                  {KINDS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
                <select
                  className="field"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "draft" | "published")}
                >
                  <option value="draft">draft</option>
                  <option value="published">
                    {t("published（自动生成缺失语言）", "published (auto-fill missing locale)")}
                  </option>
                </select>
              </div>
            </label>
          </>
        ) : (
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-[11px] uppercase tracking-wide text-mist">
              {t("追加到哪个知识页", "Append to which page")}
            </span>
            <select
              className="field"
              value={appendTargetId}
              onChange={(e) => setAppendTargetId(e.target.value)}
            >
              {pages.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.kind}] {locale === "zh-CN" ? p.titleZh : p.titleEn || p.titleZh}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <label className="mt-3 block">
        <span className="mb-1 block text-[11px] uppercase tracking-wide text-mist">
          {t(
            "正文（任意长度 · Markdown：标题/列表/表格；可插入媒体）",
            "Body (any length · Markdown headings/lists/tables; attach media)",
          )}
        </span>
        <textarea
          className="field min-h-[160px] font-mono text-sm leading-relaxed sm:min-h-[220px] sm:text-xs"
          value={bodyZh}
          onChange={(e) => setBodyZh(e.target.value)}
          placeholder={t(
            "在此粘贴或撰写长文…\n可用下方按钮插入列表/表格，或上传图片视频文件。",
            "Paste or write long content…\nUse buttons below for lists/tables, or upload media.",
          )}
        />
      </label>

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          className="min-h-10 rounded-md border border-line bg-paper px-3 py-2 text-xs touch-manipulation sm:min-h-0 sm:px-2.5 sm:py-1.5 sm:text-[11px]"
          onClick={() => insertSnippet(snippets.h2)}
        >
          {t("+ 标题", "+ Heading")}
        </button>
        <button
          type="button"
          className="min-h-10 rounded-md border border-line bg-paper px-3 py-2 text-xs touch-manipulation sm:min-h-0 sm:px-2.5 sm:py-1.5 sm:text-[11px]"
          onClick={() => insertSnippet(snippets.list)}
        >
          {t("+ 列表", "+ List")}
        </button>
        <button
          type="button"
          className="min-h-10 rounded-md border border-line bg-paper px-3 py-2 text-xs touch-manipulation sm:min-h-0 sm:px-2.5 sm:py-1.5 sm:text-[11px]"
          onClick={() => insertSnippet(snippets.table)}
        >
          {t("+ 表格", "+ Table")}
        </button>
        <label className="inline-flex min-h-10 cursor-pointer items-center rounded-md border border-line bg-paper px-3 py-2 text-xs touch-manipulation sm:min-h-0 sm:px-2.5 sm:py-1.5 sm:text-[11px]">
          {t("+ 图片/视频/文件", "+ Image/video/file")}
          <input
            type="file"
            className="hidden"
            multiple
            accept="image/*,video/*,.pdf,.txt,.md,.csv,.json,.xlsx,.doc,.docx"
            onChange={(e) => void onFiles(e.target.files)}
          />
        </label>
        {mode === "create" && (
          <label className="block w-full min-w-0 sm:ml-auto sm:max-w-xs sm:flex-1">
            <span className="sr-only">tags</span>
            <input
              className="field py-2 text-sm sm:py-1.5 sm:text-xs"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder={t("标签，逗号分隔", "Tags, comma-separated")}
            />
          </label>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {mode === "create" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void suggestPlacement()}
            className="min-h-11 rounded-lg border border-sea/40 bg-sea-soft/50 px-4 py-2.5 text-sm text-sea touch-manipulation disabled:opacity-50"
          >
            {t("AI 推荐插入位置", "AI suggest placement")}
          </button>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => void save()}
          className="min-h-11 rounded-lg bg-ink px-5 py-2.5 text-sm text-paper touch-manipulation disabled:opacity-50"
        >
          {busy
            ? "…"
            : mode === "append"
              ? t("追加写入", "Append now")
              : t("形成新知识", "Create knowledge")}
        </button>
        {createdSlug && (
          <Link href={`/kb/${createdSlug}`} className="self-center text-sm text-sea hover:underline">
            {t("打开刚写入的页面", "Open the page")} →
          </Link>
        )}
      </div>

      {suggestions.length > 0 && mode === "create" && (
        <div className="mt-4 rounded-xl border border-sea/30 bg-sea-soft/20 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-sea">
            {t("AI 推荐位置 · 前后对比（点击采用）", "AI placement · before/after (click to apply)")}
          </h3>
          <ul className="mt-3 space-y-2">
            {suggestions.map((s, idx) => (
              <li key={s.parentId}>
                <button
                  type="button"
                  onClick={() => {
                    setParentId(s.parentId);
                    setPickedSuggest(s.parentId);
                  }}
                  className={`w-full rounded-lg border px-3 py-2.5 text-left transition ${
                    (pickedSuggest ?? suggestions[0]?.parentId) === s.parentId
                      ? "border-sea bg-white shadow-sm"
                      : "border-line/70 bg-white/70 hover:border-sea/40"
                  }`}
                >
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-mono text-[10px] text-mist">#{idx + 1}</span>
                    <span className="font-medium text-ink">{s.parentTitle}</span>
                    <span className="font-mono text-[11px] text-sea">score {s.score}</span>
                  </div>
                  <p className="mt-1 text-xs text-mist">
                    {locale === "zh-CN" ? s.reasonZh : s.reasonEn}
                  </p>
                  <div className="mt-2 grid gap-1 rounded-md bg-paper/80 px-2 py-2 font-mono text-[11px] text-ink-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                    <span className="truncate">
                      <span className="text-mist">{t("前", "Before")} · </span>
                      {s.beforeTitle}
                    </span>
                    <span className="hidden text-center text-copper sm:inline">→ {t("新知识", "NEW")} →</span>
                    <span className="truncate sm:text-right">
                      <span className="text-mist">{t("后", "After")} · </span>
                      {s.afterTitle}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
          {picked && (
            <p className="mt-3 text-xs text-sea">
              {t("当前采用：", "Selected: ")}
              <strong>{picked.parentTitle}</strong>
              {" · "}
              {t("将插入在", "will sit between")} 「{picked.beforeTitle}」 {t("与", "and")} 「
              {picked.afterTitle}」 {t("之间", "")}
            </p>
          )}
        </div>
      )}

      {msg && <p className="mt-3 text-sm text-sea">{msg}</p>}
    </section>
  );
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
