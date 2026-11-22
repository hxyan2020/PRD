"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatTs } from "@/lib/kb/format";
import { useI18n } from "@/lib/i18n/context";
import type { KbKind, KbNode } from "@/lib/kb/types";

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

const emptyForm = {
  titleZh: "",
  titleEn: "",
  summaryZh: "",
  summaryEn: "",
  bodyZh: "",
  bodyEn: "",
  kind: "custom" as KbKind,
  parentId: "folder-custom",
  tags: "",
  status: "draft" as "draft" | "published",
  mode: "create" as "create" | "append",
  appendTargetId: "",
};

export function AdminDesk() {
  const { locale, t } = useI18n();
  const [nodes, setNodes] = useState<KbNode[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"updated" | "created" | "title" | "sort">("updated");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [larkUrl, setLarkUrl] = useState("");
  const [larkPaste, setLarkPaste] = useState("");
  const [larkTitle, setLarkTitle] = useState("");

  const load = useCallback(async () => {
    const [meRes, listRes] = await Promise.all([
      fetch("/api/me"),
      fetch(`/api/kb?q=${encodeURIComponent(q)}&sort=${sort}&order=${order}`),
    ]);
    const me = (await meRes.json()) as { isAdmin?: boolean };
    setIsAdmin(!!me.isAdmin);
    const list = (await listRes.json()) as { nodes: KbNode[] };
    setNodes(list.nodes);
  }, [q, sort, order]);

  useEffect(() => {
    void load();
  }, [load]);

  const folders = useMemo(() => nodes.filter((n) => n.kind === "folder"), [nodes]);

  async function importLark() {
    if (!larkUrl.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/kb/import-lark", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          url: larkUrl.trim(),
          pastedContent: larkPaste,
          titleZh: larkTitle || undefined,
          parentId: form.parentId || "folder-custom",
          publish: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || `HTTP ${res.status}`);
      setMsg(
        t(
          `已从 Lark 导入为草稿：${data.node.titleZh}`,
          `Imported from Lark as draft: ${data.node.titleEn || data.node.titleZh}`,
        ),
      );
      setLarkUrl("");
      setLarkPaste("");
      setLarkTitle("");
      startEdit(data.node);
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "lark import failed");
    } finally {
      setBusy(false);
    }
  }

  async function suggest() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/kb", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "suggest",
          titleZh: form.titleZh,
          titleEn: form.titleEn,
          bodyZh: form.bodyZh,
          tags: form.tags.split(/[,，]/).map((s) => s.trim()).filter(Boolean),
          kind: form.kind,
        }),
      });
      const data = (await res.json()) as { suggestions: Suggestion[] };
      setSuggestions(data.suggestions || []);
      if (data.suggestions?.[0]) {
        setForm((f) => ({ ...f, parentId: data.suggestions[0]!.parentId }));
      }
    } finally {
      setBusy(false);
    }
  }

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        const dataUrl = await readFile(file);
        const res = await fetch("/api/kb/media", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            nodeId: editingId || undefined,
            name: file.name,
            mime: file.type || "application/octet-stream",
            dataUrl,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `upload ${res.status}`);
        }
        const { media } = (await res.json()) as {
          media: { dataUrl: string; name: string; kind: string };
        };
        const md =
          media.kind === "image"
            ? `\n\n![${media.name}](${media.dataUrl})\n\n`
            : media.kind === "video"
              ? `\n\n<video src="${media.dataUrl}" controls></video>\n\n`
              : `\n\n[${media.name}](${media.dataUrl})\n\n`;
        setForm((f) => ({ ...f, bodyZh: f.bodyZh + md, bodyEn: f.bodyEn + md }));
      }
      setMsg(t("媒体已插入正文（Markdown）", "Media inserted into body (Markdown)"));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!isAdmin) return;
    setBusy(true);
    setMsg(null);
    try {
      const tags = form.tags.split(/[,，]/).map((s) => s.trim()).filter(Boolean);
      if (form.mode === "append") {
        const target = form.appendTargetId || editingId;
        if (!target) throw new Error(t("请选择要追加的页面", "Pick a page to append"));
        const res = await fetch(`/api/kb/${target}`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            action: "append",
            appendZh: form.bodyZh,
            appendEn: form.bodyEn || form.bodyZh,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setMsg(t("已追加到已有知识页", "Appended to existing page"));
      } else if (editingId) {
        const res = await fetch(`/api/kb/${editingId}`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            titleZh: form.titleZh,
            titleEn: form.titleEn,
            summaryZh: form.summaryZh,
            summaryEn: form.summaryEn,
            bodyZh: form.bodyZh,
            bodyEn: form.bodyEn,
            kind: form.kind,
            parentId: form.parentId,
            tags,
            status: form.status,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setMsg(t("已保存", "Saved"));
      } else {
        const res = await fetch("/api/kb", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            titleZh: form.titleZh,
            titleEn: form.titleEn,
            summaryZh: form.summaryZh,
            summaryEn: form.summaryEn,
            bodyZh: form.bodyZh,
            bodyEn: form.bodyEn,
            kind: form.kind,
            parentId: form.parentId,
            tags,
            status: form.status,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setMsg(t("已新建", "Created"));
        setForm(emptyForm);
      }
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "save failed");
    } finally {
      setBusy(false);
    }
  }

  async function publish(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/kb/${id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "publish" }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setMsg(t("已发布并自动镜像缺失语言", "Published with bilingual mirror"));
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "publish failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm(t("确认删除该知识节点？", "Delete this knowledge node?"))) return;
    const res = await fetch(`/api/kb/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setMsg(err.error || `HTTP ${res.status}`);
      return;
    }
    if (editingId === id) {
      setEditingId(null);
      setForm(emptyForm);
    }
    await load();
  }

  function startEdit(n: KbNode) {
    setEditingId(n.id);
    setForm({
      titleZh: n.titleZh,
      titleEn: n.titleEn,
      summaryZh: n.summaryZh,
      summaryEn: n.summaryEn,
      bodyZh: n.bodyZh,
      bodyEn: n.bodyEn,
      kind: n.kind,
      parentId: n.parentId || "folder-custom",
      tags: n.tags.join(", "),
      status: n.status,
      mode: "create",
      appendTargetId: "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!isAdmin) {
    return (
      <div className="rounded-2xl border border-line bg-white/85 p-8 text-center animate-rise">
        <h1 className="font-display text-2xl">{t("仅管理员可编辑", "Admin only")}</h1>
        <p className="mt-2 text-sm text-mist">
          {t(
            "其他角色可浏览知识树与页面，但不能新增/修改/删除。",
            "Other roles can browse the tree and pages but cannot create/edit/delete.",
          )}
        </p>
        <Link href="/tree" className="mt-4 inline-block text-sm text-sea hover:underline">
          {t("查看知识树", "View knowledge tree")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-rise">
      <header className="border-b border-line/80 pb-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-sea">Admin CMS</p>
        <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">
          {t("知识库管理", "Knowledge admin")}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-mist">
          {t(
            "支持关键字检索与排序；可新建或追加到已有页面；支持文字/表格/列表/图片/视频/文件；发布时自动补齐中英对照。",
            "Search & sort; create or append; text/tables/lists/images/videos/files; publish fills bilingual gaps.",
          )}
        </p>
      </header>

      <section className="rounded-2xl border border-copper/30 bg-copper-soft/25 p-4 sm:p-5">
        <h2 className="font-display text-lg text-ink">
          {t("从 Lark / 飞书文档导入", "Import from Lark / Feishu")}
        </h2>
        <p className="mt-1 text-xs text-mist">
          {t(
            "粘贴文档链接。若文档为私有（常见），请同时粘贴正文内容，系统会生成知识节点草稿。",
            "Paste the doc link. For private docs (common), also paste the body — we create a draft node.",
          )}
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <input
            className="field"
            placeholder="https://....feishu.cn/docx/..."
            value={larkUrl}
            onChange={(e) => setLarkUrl(e.target.value)}
          />
          <input
            className="field"
            placeholder={t("可选：中文标题", "Optional ZH title")}
            value={larkTitle}
            onChange={(e) => setLarkTitle(e.target.value)}
          />
        </div>
        <textarea
          className="field mt-2 min-h-[100px]"
          placeholder={t("粘贴文档正文（私有文档必填）", "Paste doc body (required for private docs)")}
          value={larkPaste}
          onChange={(e) => setLarkPaste(e.target.value)}
        />
        <button
          type="button"
          disabled={busy || !larkUrl.trim()}
          onClick={() => void importLark()}
          className="mt-2 rounded-lg bg-copper px-4 py-2 text-xs text-white disabled:opacity-50"
        >
          {t("生成知识节点", "Create knowledge node")}
        </button>
      </section>

      <section className="rounded-2xl border border-line bg-white/90 p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <h2 className="font-display text-xl text-ink">
            {editingId ? t("编辑知识", "Edit knowledge") : t("新增知识", "New knowledge")}
          </h2>
          <div className="ml-auto flex gap-1 rounded-md border border-line p-0.5 text-xs">
            <button
              type="button"
              className={`rounded px-2 py-1 ${form.mode === "create" ? "bg-ink text-paper" : "text-mist"}`}
              onClick={() => setForm((f) => ({ ...f, mode: "create" }))}
            >
              {t("新建页面", "New page")}
            </button>
            <button
              type="button"
              className={`rounded px-2 py-1 ${form.mode === "append" ? "bg-ink text-paper" : "text-mist"}`}
              onClick={() => setForm((f) => ({ ...f, mode: "append" }))}
            >
              {t("追加到已有", "Append")}
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("中文标题", "Title (ZH)")}>
            <input
              className="field"
              value={form.titleZh}
              onChange={(e) => setForm({ ...form, titleZh: e.target.value })}
            />
          </Field>
          <Field label={t("英文标题", "Title (EN)")}>
            <input
              className="field"
              value={form.titleEn}
              onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
            />
          </Field>
          <Field label={t("中文摘要", "Summary (ZH)")}>
            <textarea
              className="field min-h-[72px]"
              value={form.summaryZh}
              onChange={(e) => setForm({ ...form, summaryZh: e.target.value })}
            />
          </Field>
          <Field label={t("英文摘要", "Summary (EN)")}>
            <textarea
              className="field min-h-[72px]"
              value={form.summaryEn}
              onChange={(e) => setForm({ ...form, summaryEn: e.target.value })}
            />
          </Field>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Field label={t("类型", "Kind")}>
            <select
              className="field"
              value={form.kind}
              onChange={(e) => setForm({ ...form, kind: e.target.value as KbKind })}
            >
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("父节点", "Parent")}>
            <select
              className="field"
              value={form.mode === "append" ? form.appendTargetId : form.parentId}
              onChange={(e) =>
                form.mode === "append"
                  ? setForm({ ...form, appendTargetId: e.target.value })
                  : setForm({ ...form, parentId: e.target.value })
              }
            >
              {(form.mode === "append" ? nodes.filter((n) => n.kind !== "folder") : folders).map((n) => (
                <option key={n.id} value={n.id}>
                  {locale === "zh-CN" ? n.titleZh : n.titleEn || n.titleZh}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("状态", "Status")}>
            <select
              className="field"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as "draft" | "published" })}
            >
              <option value="draft">draft</option>
              <option value="published">published</option>
            </select>
          </Field>
        </div>

        <Field label={t("标签（逗号分隔）", "Tags (comma-separated)")} className="mt-3">
          <input
            className="field"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
          />
        </Field>

        <Field
          label={t(
            "正文 Markdown（支持标题/列表/表格；可插入图片视频文件）",
            "Body Markdown (headings/lists/tables; attach media)",
          )}
          className="mt-3"
        >
          <textarea
            className="field min-h-[220px] font-mono text-xs leading-relaxed"
            value={form.bodyZh}
            onChange={(e) => setForm({ ...form, bodyZh: e.target.value })}
            placeholder={"## 标题\n\n| 列A | 列B |\n| --- | --- |\n| 1 | 2 |\n\n- 列表项"}
          />
        </Field>
        <Field label={t("英文正文（可留空，发布时自动镜像）", "Body EN (optional; mirrored on publish)")} className="mt-3">
          <textarea
            className="field min-h-[120px] font-mono text-xs"
            value={form.bodyEn}
            onChange={(e) => setForm({ ...form, bodyEn: e.target.value })}
          />
        </Field>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className="cursor-pointer rounded-lg border border-line bg-paper px-3 py-2 text-xs">
            {t("上传图片/视频/文件", "Upload image/video/file")}
            <input
              type="file"
              className="hidden"
              multiple
              accept="image/*,video/*,.pdf,.txt,.md,.csv,.json"
              onChange={(e) => void onFiles(e.target.files)}
            />
          </label>
          <button
            type="button"
            disabled={busy || !form.titleZh}
            onClick={() => void suggest()}
            className="rounded-lg border border-sea/40 bg-sea-soft/40 px-3 py-2 text-xs text-sea disabled:opacity-50"
          >
            {t("AI 推荐插入位置", "AI suggest insert")}
          </button>
          <button
            type="button"
            disabled={busy || (form.mode === "create" && !form.titleZh)}
            onClick={() => void save()}
            className="rounded-lg bg-ink px-4 py-2 text-xs text-paper disabled:opacity-50"
          >
            {busy ? "…" : form.mode === "append" ? t("追加", "Append") : t("保存", "Save")}
          </button>
          {editingId && (
            <button
              type="button"
              className="rounded-lg border border-line px-3 py-2 text-xs text-mist"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
            >
              {t("取消编辑", "Cancel edit")}
            </button>
          )}
        </div>

        {suggestions.length > 0 && (
          <div className="mt-4 rounded-xl border border-sea/30 bg-sea-soft/20 p-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-sea">
              {t("推荐位置 · 前后对比", "Suggested placement · before/after")}
            </h3>
            <ul className="mt-2 space-y-2 text-sm">
              {suggestions.map((s) => (
                <li key={s.parentId} className="rounded-lg border border-line bg-white px-3 py-2">
                  <button
                    type="button"
                    className="text-left"
                    onClick={() => setForm((f) => ({ ...f, parentId: s.parentId }))}
                  >
                    <div className="font-medium text-ink">
                      {s.parentTitle} · score {s.score}
                    </div>
                    <div className="text-xs text-mist">
                      {locale === "zh-CN" ? s.reasonZh : s.reasonEn}
                    </div>
                    <div className="mt-1 font-mono text-[11px] text-mist">
                      before: {s.beforeTitle} → after: {s.afterTitle}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {msg && <p className="mt-3 text-sm text-sea">{msg}</p>}
      </section>

      <section className="rounded-2xl border border-line bg-white/90 p-4 sm:p-6">
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[180px] flex-1">
            <label className="mb-1 block text-[11px] uppercase tracking-wide text-mist">
              {t("关键字检索", "Keyword search")}
            </label>
            <input
              className="field"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("标题 / 正文 / 标签…", "title / body / tags…")}
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] uppercase tracking-wide text-mist">
              {t("排序", "Sort")}
            </label>
            <select
              className="field"
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
            >
              <option value="updated">{t("最近更改", "Updated")}</option>
              <option value="created">{t("创建时间", "Created")}</option>
              <option value="title">{t("标题", "Title")}</option>
              <option value="sort">{t("目录序", "Sort order")}</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] uppercase tracking-wide text-mist">
              {t("方向", "Order")}
            </label>
            <select
              className="field"
              value={order}
              onChange={(e) => setOrder(e.target.value as typeof order)}
            >
              <option value="desc">desc</option>
              <option value="asc">asc</option>
            </select>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line text-[11px] uppercase tracking-wide text-mist">
              <tr>
                <th className="px-2 py-2">{t("标题", "Title")}</th>
                <th className="px-2 py-2">{t("类型", "Kind")}</th>
                <th className="px-2 py-2">{t("创建", "Created")}</th>
                <th className="px-2 py-2">{t("更改", "Updated")}</th>
                <th className="px-2 py-2">{t("操作", "Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {nodes.map((n) => (
                <tr key={n.id} className="border-b border-line/60 align-top hover:bg-sea-soft/15">
                  <td className="px-2 py-2.5">
                    <Link href={`/kb/${n.slug}`} className="font-medium text-ink hover:text-sea">
                      {locale === "zh-CN" ? n.titleZh : n.titleEn || n.titleZh}
                    </Link>
                    <div className="text-[11px] text-mist">
                      {n.status} · {n.updatedBy || "—"}
                    </div>
                  </td>
                  <td className="px-2 py-2.5 font-mono text-xs text-mist">{n.kind}</td>
                  <td className="px-2 py-2.5 text-xs text-mist">
                    {formatTs(n.createdAt, locale)}
                  </td>
                  <td className="px-2 py-2.5 text-xs text-mist">
                    {formatTs(n.updatedAt, locale)}
                  </td>
                  <td className="px-2 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        className="rounded border border-line px-2 py-1 text-[11px]"
                        onClick={() => startEdit(n)}
                      >
                        {t("编辑", "Edit")}
                      </button>
                      <button
                        type="button"
                        className="rounded border border-sea/40 px-2 py-1 text-[11px] text-sea"
                        onClick={() => void publish(n.id)}
                      >
                        {t("发布", "Publish")}
                      </button>
                      <button
                        type="button"
                        className="rounded border border-danger/30 px-2 py-1 text-[11px] text-danger"
                        onClick={() => void remove(n.id)}
                      >
                        {t("删除", "Delete")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-[11px] uppercase tracking-wide text-mist">{label}</span>
      {children}
    </label>
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
