"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import type { TreeNode } from "@/lib/kb/types";

export function KnowledgeTree() {
  const { locale, t } = useI18n();
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [active, setActive] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/kb?mode=tree");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { tree: TreeNode[] };
        setTree(data.tree);
        const init: Record<string, boolean> = {};
        for (const n of data.tree) init[n.id] = true;
        setOpen(init);
        setActive(data.tree[0]?.id ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "failed");
      }
    })();
  }, []);

  const flatLinks = useMemo(() => {
    const edges: { from: string; to: string; label: string }[] = [];
    function walk(n: TreeNode) {
      for (const c of n.children) {
        edges.push({ from: n.id, to: c.id, label: c.kind });
        walk(c);
      }
    }
    for (const r of tree) walk(r);
    return edges;
  }, [tree]);

  const activeNode = useMemo(() => {
    function find(nodes: TreeNode[]): TreeNode | null {
      for (const n of nodes) {
        if (n.id === active) return n;
        const f = find(n.children);
        if (f) return f;
      }
      return null;
    }
    return find(tree);
  }, [tree, active]);

  function renderBranch(nodes: TreeNode[], depth = 0): React.ReactNode {
    return nodes.map((n) => {
      const title = locale === "zh-CN" ? n.titleZh : n.titleEn || n.titleZh;
      const hasKids = n.children.length > 0;
      const isOpen = open[n.id] ?? depth < 1;
      return (
        <div key={n.id} id={n.id} className="scroll-mt-24">
          <div
            className={`flex items-start gap-2 rounded-lg px-2 py-1.5 ${
              active === n.id ? "bg-sea-soft/60" : "hover:bg-white/70"
            }`}
            style={{ paddingLeft: 8 + depth * 14 }}
          >
            {hasKids ? (
              <button
                type="button"
                className="mt-0.5 w-5 font-mono text-xs text-mist"
                onClick={() => setOpen((o) => ({ ...o, [n.id]: !isOpen }))}
              >
                {isOpen ? "▾" : "▸"}
              </button>
            ) : (
              <span className="mt-0.5 w-5 text-center text-[10px] text-line">•</span>
            )}
            <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setActive(n.id)}>
              <div className="truncate text-sm font-medium text-ink">{title}</div>
              <div className="font-mono text-[10px] uppercase tracking-wide text-mist">
                {n.kind} · {n.children.length ? `${n.children.length} ${t("子节点", "children")}` : n.status}
              </div>
            </button>
            {n.kind !== "folder" && (
              <Link href={`/kb/${n.slug}`} className="shrink-0 text-xs text-sea hover:underline">
                {t("打开", "Open")}
              </Link>
            )}
          </div>
          {hasKids && isOpen && renderBranch(n.children, depth + 1)}
        </div>
      );
    });
  }

  return (
    <div className="space-y-5 animate-rise">
      <header className="border-b border-line/80 pb-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-sea">
          {t("知识图谱", "Knowledge map")}
        </p>
        <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">
          {t("动态知识树", "Live knowledge tree")}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-mist">
          {t(
            "观察分类节点与子知识的从属关系。点击节点查看摘要；管理员可在「管理」中增删改。",
            "Inspect folder hierarchy and child pages. Select a node for summary; admins edit in Admin.",
          )}
        </p>
      </header>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="rounded-2xl border border-line bg-white/85 p-3 sm:p-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-mist">
            {t("树结构", "Tree")} · {flatLinks.length} {t("条边", "edges")}
          </div>
          <div className="max-h-[70vh] overflow-auto">{renderBranch(tree)}</div>
        </div>

        <div className="rounded-2xl border border-line bg-ink p-5 text-paper">
          {activeNode ? (
            <>
              <p className="font-mono text-[11px] uppercase tracking-wider text-sea-soft/80">
                {activeNode.kind}
              </p>
              <h2 className="mt-2 font-display text-2xl">
                {locale === "zh-CN" ? activeNode.titleZh : activeNode.titleEn || activeNode.titleZh}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-paper/75">
                {locale === "zh-CN"
                  ? activeNode.summaryZh || activeNode.bodyZh.slice(0, 280)
                  : activeNode.summaryEn || activeNode.bodyEn.slice(0, 280) || activeNode.summaryZh}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-paper/60">
                <span>created {activeNode.createdAt.slice(0, 10)}</span>
                <span>updated {activeNode.updatedAt.slice(0, 10)}</span>
                <span>{activeNode.updatedBy || "—"}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {activeNode.tags.slice(0, 8).map((tag) => (
                  <span key={tag} className="rounded border border-white/15 px-2 py-0.5 text-[11px]">
                    {tag}
                  </span>
                ))}
              </div>
              {activeNode.kind !== "folder" && (
                <Link
                  href={`/kb/${activeNode.slug}`}
                  className="mt-6 inline-flex rounded-lg bg-copper px-4 py-2 text-sm text-white"
                >
                  {t("阅读全文", "Read page")}
                </Link>
              )}
              {activeNode.children.length > 0 && (
                <div className="mt-6 border-t border-white/10 pt-4">
                  <h3 className="text-xs uppercase tracking-wide text-paper/50">
                    {t("子节点", "Children")}
                  </h3>
                  <ul className="mt-2 space-y-1 text-sm text-paper/80">
                    {activeNode.children.slice(0, 12).map((c) => (
                      <li key={c.id}>
                        <button type="button" className="hover:text-sea-soft" onClick={() => setActive(c.id)}>
                          {locale === "zh-CN" ? c.titleZh : c.titleEn || c.titleZh}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-paper/60">{t("选择左侧节点", "Select a node")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
