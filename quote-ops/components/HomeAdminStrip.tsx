"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatTs } from "@/lib/kb/format";
import { useI18n } from "@/lib/i18n/context";
import type { KbKind, KbNode } from "@/lib/kb/types";

type SortKey = "updated" | "created" | "title" | "sort";

const KINDS: Array<KbKind | "all"> = [
  "all",
  "folder",
  "article",
  "risk",
  "skill",
  "pipeline",
  "database",
  "custom",
];

/** Admin keyword search / retrieve / sort panel on the home page. */
export function HomeAdminStrip() {
  const { locale, t } = useI18n();
  const [isAdmin, setIsAdmin] = useState(false);
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState("");
  const [sort, setSort] = useState<SortKey>("updated");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [kind, setKind] = useState<KbKind | "all">("all");
  const [status, setStatus] = useState<"all" | "published" | "draft">("all");
  const [nodes, setNodes] = useState<KbNode[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [limit, setLimit] = useState(12);

  useEffect(() => {
    void fetch("/api/me")
      .then((r) => r.json())
      .then((d: { isAdmin?: boolean }) => setIsAdmin(!!d.isAdmin));
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    const tmr = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams({
        q,
        sort,
        order,
      });
      if (kind !== "all") params.set("kind", kind);
      if (status !== "all") params.set("status", status);
      void fetch(`/api/kb?${params.toString()}`)
        .then((r) => r.json())
        .then((d: { nodes: KbNode[] }) => {
          const list = d.nodes || [];
          setTotal(list.length);
          setNodes(list.slice(0, limit));
        })
        .finally(() => setLoading(false));
    }, 180);
    return () => clearTimeout(tmr);
  }, [isAdmin, q, sort, order, kind, status, limit]);

  const emptyHint = useMemo(() => {
    if (loading) return t("检索中…", "Searching…");
    if (q.trim()) return t("无匹配结果，试试更短关键字", "No matches — try a shorter keyword");
    return t("输入关键字开始检索知识库", "Type a keyword to search the KB");
  }, [loading, q, t]);

  function runSearch(e?: React.FormEvent) {
    e?.preventDefault();
    setQ(draft.trim());
    setLimit(12);
  }

  function toggleSort(next: SortKey) {
    if (sort === next) {
      setOrder((o) => (o === "desc" ? "asc" : "desc"));
    } else {
      setSort(next);
      setOrder(next === "title" || next === "sort" ? "asc" : "desc");
    }
  }

  if (!isAdmin) return null;

  return (
    <section className="rounded-2xl border border-ink/15 bg-white/90 p-4 shadow-sm sm:p-6 animate-rise">
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-sea">
            {t("管理员", "Admin")}
          </p>
          <h2 className="font-display text-2xl text-ink">
            {t("关键字查询 · 检索 · 排序", "Keyword search · retrieve · sort")}
          </h2>
          <p className="mt-1 text-sm text-mist">
            {t(
              "按标题 / 摘要 / 正文 / 标签检索全部知识节点，支持类型与状态筛选。",
              "Search all knowledge nodes by title / summary / body / tags; filter by kind and status.",
            )}
          </p>
        </div>
        <Link href="/admin" className="ml-auto text-xs text-sea hover:underline">
          {t("完整管理台", "Full admin")} →
        </Link>
      </div>

      <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={runSearch}>
        <input
          className="field min-w-0 flex-1 text-base"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t(
            "例如：旧价、Markout、Quote Tick、强平…",
            "e.g. stale, markout, quote tick, stop-out…",
          )}
          aria-label={t("关键字", "Keyword")}
        />
        <button
          type="submit"
          className="rounded-lg bg-ink px-5 py-2.5 text-sm text-paper disabled:opacity-60"
          disabled={loading}
        >
          {t("检索", "Search")}
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        <select
          className="field w-auto"
          value={kind}
          onChange={(e) => setKind(e.target.value as KbKind | "all")}
        >
          {KINDS.map((k) => (
            <option key={k} value={k}>
              {k === "all" ? t("全部类型", "All kinds") : k}
            </option>
          ))}
        </select>
        <select
          className="field w-auto"
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
        >
          <option value="all">{t("全部状态", "All status")}</option>
          <option value="published">published</option>
          <option value="draft">draft</option>
        </select>
        <div className="flex overflow-hidden rounded-lg border border-line text-xs">
          {(
            [
              ["updated", t("最近更改", "Updated")],
              ["created", t("创建时间", "Created")],
              ["title", t("标题", "Title")],
              ["sort", t("目录序", "Order")],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleSort(key)}
              className={`px-3 py-2 ${
                sort === key ? "bg-ink text-paper" : "bg-white text-mist hover:bg-paper"
              }`}
            >
              {label}
              {sort === key ? (order === "desc" ? " ↓" : " ↑") : ""}
            </button>
          ))}
        </div>
        <span className="self-center font-mono text-[11px] text-mist">
          {loading ? "…" : `${nodes.length}/${total}`}
        </span>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-line bg-paper/80 text-[11px] uppercase tracking-wide text-mist">
            <tr>
              <th className="px-3 py-2">
                <button type="button" onClick={() => toggleSort("title")}>
                  {t("标题", "Title")}
                </button>
              </th>
              <th className="px-3 py-2">{t("类型", "Kind")}</th>
              <th className="px-3 py-2">
                <button type="button" onClick={() => toggleSort("updated")}>
                  {t("最近更改", "Updated")}
                </button>
              </th>
              <th className="px-3 py-2">
                <button type="button" onClick={() => toggleSort("created")}>
                  {t("创建", "Created")}
                </button>
              </th>
              <th className="px-3 py-2">{t("操作", "Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {nodes.map((n) => {
              const title = locale === "zh-CN" ? n.titleZh : n.titleEn || n.titleZh;
              const summary = locale === "zh-CN" ? n.summaryZh : n.summaryEn || n.summaryZh;
              return (
                <tr key={n.id} className="border-b border-line/60 align-top hover:bg-sea-soft/20">
                  <td className="px-3 py-2.5">
                    <Link href={`/kb/${n.slug}`} className="font-medium text-ink hover:text-sea">
                      <Highlight text={title} needle={q} />
                    </Link>
                    {summary && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-mist">
                        <Highlight text={summary} needle={q} />
                      </p>
                    )}
                    {n.tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {n.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="rounded border border-line bg-paper px-1.5 py-0.5 text-[10px] text-mist"
                          >
                            <Highlight text={tag} needle={q} />
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs text-mist">
                    {n.kind}
                    <div className="text-[10px]">{n.status}</div>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-mist">
                    {formatTs(n.updatedAt, locale)}
                    <div className="text-[10px]">{n.updatedBy || "—"}</div>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-mist">
                    {formatTs(n.createdAt, locale)}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      <Link
                        href={`/kb/${n.slug}`}
                        className="rounded border border-line px-2 py-1 text-[11px]"
                      >
                        {t("打开", "Open")}
                      </Link>
                      <Link
                        href={`/admin`}
                        className="rounded border border-sea/40 px-2 py-1 text-[11px] text-sea"
                      >
                        {t("编辑", "Edit")}
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {nodes.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-mist">{emptyHint}</p>
        )}
      </div>

      {total > nodes.length && (
        <button
          type="button"
          className="mt-3 w-full rounded-lg border border-line bg-paper py-2 text-xs text-ink-2"
          onClick={() => setLimit((n) => n + 12)}
        >
          {t(`显示更多（还有 ${total - nodes.length}）`, `Show more (${total - nodes.length} left)`)}
        </button>
      )}
    </section>
  );
}

function Highlight({ text, needle }: { text: string; needle: string }) {
  const q = needle.trim();
  if (!q) return <>{text}</>;
  const lower = text.toLowerCase();
  const idx = lower.indexOf(q.toLowerCase());
  if (idx < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-amber-100 px-0.5 text-ink">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}
