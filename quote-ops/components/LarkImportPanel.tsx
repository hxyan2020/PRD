"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import type { KbNode } from "@/lib/kb/types";

type Props = {
  /** Pre-selected parent folder id */
  defaultParentId?: string;
  /** Called after a successful import */
  onImported?: (node: KbNode) => void;
  /** Hide the admin gate (parent already gated) */
  assumeAdmin?: boolean;
};

export function LarkImportPanel({ defaultParentId, onImported, assumeAdmin }: Props) {
  const { locale, t } = useI18n();
  const [isAdmin, setIsAdmin] = useState(!!assumeAdmin);
  const [folders, setFolders] = useState<KbNode[]>([]);
  const [url, setUrl] = useState("");
  const [titleZh, setTitleZh] = useState("");
  const [paste, setPaste] = useState("");
  const [parentId, setParentId] = useState(defaultParentId || "folder-custom");
  const [publish, setPublish] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!assumeAdmin) {
      const me = (await (await fetch("/api/me")).json()) as { isAdmin?: boolean };
      setIsAdmin(!!me.isAdmin);
      if (!me.isAdmin) return;
    }
    const list = (await (await fetch("/api/kb?sort=title&order=asc")).json()) as {
      nodes: KbNode[];
    };
    const fs = (list.nodes || []).filter((n) => n.kind === "folder");
    setFolders(fs);
    if (defaultParentId) setParentId(defaultParentId);
    else if (fs.find((f) => f.id === "folder-custom")) setParentId("folder-custom");
    else if (fs[0]) setParentId(fs[0].id);
  }, [assumeAdmin, defaultParentId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (defaultParentId) setParentId(defaultParentId);
  }, [defaultParentId]);

  const urlOk = useMemo(() => {
    try {
      const u = new URL(url.trim());
      return /lark|feishu/i.test(u.hostname);
    } catch {
      return false;
    }
  }, [url]);

  async function importDoc() {
    if (!isAdmin || !urlOk) return;
    setBusy(true);
    setMsg(null);
    setErr(null);
    setCreatedSlug(null);
    try {
      const res = await fetch("/api/kb/import-lark", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          pastedContent: paste,
          titleZh: titleZh || undefined,
          parentId,
          publish,
        }),
      });
      const data = (await res.json()) as {
        node?: KbNode;
        fetchStatus?: string;
        message?: string;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(
          data.message ||
            (data.error === "fetch_failed_paste_required"
              ? t(
                  "无法直接读取私有文档，请粘贴正文后重试",
                  "Cannot read private doc — paste the body and retry",
                )
              : data.error || `HTTP ${res.status}`),
        );
      }
      const node = data.node!;
      setMsg(
        t(
          `已生成知识节点「${node.titleZh}」${publish ? "（已发布）" : "（草稿）"}`,
          `Created knowledge node “${node.titleEn || node.titleZh}”${publish ? " (published)" : " (draft)"}`,
        ),
      );
      setCreatedSlug(node.slug);
      setUrl("");
      setPaste("");
      setTitleZh("");
      onImported?.(node);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "import failed");
    } finally {
      setBusy(false);
    }
  }

  if (!isAdmin) return null;

  return (
    <section className="rounded-2xl border border-copper/30 bg-copper-soft/20 p-4 sm:p-5 animate-rise">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-copper">
        {t("管理员 · Lark / 飞书", "Admin · Lark / Feishu")}
      </p>
      <h2 className="mt-1 font-display text-xl text-ink sm:text-2xl">
        {t("粘贴文档链接形成知识节点", "Paste a doc link to create a knowledge node")}
      </h2>
      <p className="mt-1 text-sm text-mist">
        {t(
          "支持 feishu.cn / larksuite.com 链接。公开文档可自动抓取；私有文档请同时粘贴正文。",
          "Supports feishu.cn / larksuite.com links. Public docs can be fetched; for private docs, paste the body too.",
        )}
      </p>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-[11px] uppercase tracking-wide text-mist">
            {t("文档链接", "Doc URL")}
          </span>
          <input
            className="field"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://xxx.feishu.cn/docx/... 或 https://xxx.larksuite.com/docx/..."
            inputMode="url"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] uppercase tracking-wide text-mist">
            {t("标题（可选）", "Title (optional)")}
          </span>
          <input
            className="field"
            value={titleZh}
            onChange={(e) => setTitleZh(e.target.value)}
            placeholder={t("留空则自动命名", "Auto-named if empty")}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] uppercase tracking-wide text-mist">
            {t("写入分类", "Parent folder")}
          </span>
          <select className="field" value={parentId} onChange={(e) => setParentId(e.target.value)}>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {locale === "zh-CN" ? f.titleZh : f.titleEn || f.titleZh}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-2 block">
        <span className="mb-1 block text-[11px] uppercase tracking-wide text-mist">
          {t("粘贴文档正文（私有文档必填）", "Paste doc body (required for private docs)")}
        </span>
        <textarea
          className="field min-h-[120px] font-mono text-sm sm:text-xs"
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          placeholder={t(
            "从飞书/Lark 全选复制正文粘贴到这里…",
            "Select-all copy from Lark/Feishu and paste here…",
          )}
        />
      </label>

      <label className="mt-2 flex items-center gap-2 text-xs text-ink-2">
        <input
          type="checkbox"
          checked={publish}
          onChange={(e) => setPublish(e.target.checked)}
        />
        {t("导入后直接发布（自动补齐双语）", "Publish on import (auto-fill bilingual)")}
      </label>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          disabled={busy || !urlOk}
          onClick={() => void importDoc()}
          className="min-h-11 rounded-lg bg-copper px-5 py-2.5 text-sm text-white touch-manipulation disabled:opacity-50"
        >
          {busy ? t("导入中…", "Importing…") : t("生成知识节点", "Create knowledge node")}
        </button>
        {createdSlug && (
          <Link href={`/kb/${createdSlug}`} className="text-sm text-sea hover:underline">
            {t("打开刚导入的页面", "Open imported page")} →
          </Link>
        )}
      </div>

      {msg && <p className="mt-2 text-sm text-sea">{msg}</p>}
      {err && <p className="mt-2 text-sm text-danger">{err}</p>}
    </section>
  );
}
