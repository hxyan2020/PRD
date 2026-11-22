"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { flattenTree, layoutKnowledgeGraph, type VizNode } from "@/lib/kb/layout";
import type { TreeNode } from "@/lib/kb/types";

const KIND_COLOR: Record<string, string> = {
  hub: "#0c1520",
  folder: "#0e7490",
  article: "#b45309",
  risk: "#b91c1c",
  skill: "#047857",
  pipeline: "#1d4ed8",
  database: "#7c2d12",
  custom: "#4b5563",
};

export function KnowledgeTree() {
  const { locale, t } = useI18n();
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(true);
  const [lastSync, setLastSync] = useState<string>("");
  const [filter, setFilter] = useState("");
  const [size, setSize] = useState({ w: 900, h: 560 });
  const [hoverId, setHoverId] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const stampRef = useRef("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/kb?mode=tree", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { tree: TreeNode[] };
      const flat = flattenTree(data.tree);
      const stamp = flat
        .map((n) => `${n.id}:${n.updatedAt}:${n.parentId}:${n.children.length}`)
        .join("|");
      if (stamp !== stampRef.current) {
        stampRef.current = stamp;
        setTree(data.tree);
        setActive((prev) => prev ?? data.tree[0]?.id ?? null);
        setLastSync(new Date().toISOString());
      } else {
        setLastSync(new Date().toISOString());
      }
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(() => void load(), 4000);
    return () => window.clearInterval(id);
  }, [live, load]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (!cr) return;
      setSize({
        w: Math.max(320, Math.floor(cr.width)),
        h: Math.max(360, Math.min(640, Math.floor(cr.width * 0.62))),
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const expandId = useMemo(() => {
    if (!active) return tree[0]?.id ?? null;
    function find(nodesIn: TreeNode[], id: string): TreeNode | null {
      for (const n of nodesIn) {
        if (n.id === id) return n;
        const f = find(n.children, id);
        if (f) return f;
      }
      return null;
    }
    const node = find(tree, active);
    if (!node) return tree[0]?.id ?? null;
    if (node.children.length > 0 || !node.parentId) return node.id;
    return node.parentId;
  }, [active, tree]);

  const { nodes, edges, focus } = useMemo(
    () =>
      layoutKnowledgeGraph(tree, {
        width: size.w,
        height: size.h,
        focusId: expandId,
        locale,
        maxChildren: filter.trim() ? 80 : 36,
      }),
    [tree, size, expandId, locale, filter],
  );

  const selectedNode = useMemo(() => {
    function find(nodesIn: TreeNode[], id: string | null): TreeNode | null {
      if (!id) return null;
      for (const n of nodesIn) {
        if (n.id === id) return n;
        const f = find(n.children, id);
        if (f) return f;
      }
      return null;
    }
    return find(tree, active) ?? focus;
  }, [tree, active, focus]);

  const filteredNodes = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return nodes;
    const hit = new Set<string>();
    for (const n of nodes) {
      const blob = `${n.titleZh} ${n.titleEn} ${n.kind} ${n.slug}`.toLowerCase();
      if (blob.includes(q) || n.id === "__hub__" || n.kind === "folder" || n.depth === 0) {
        hit.add(n.id);
      }
    }
    // keep parents of hits
    for (const n of nodes) {
      if (hit.has(n.id) && n.parentId) hit.add(n.parentId);
    }
    hit.add("__hub__");
    return nodes.filter((n) => hit.has(n.id));
  }, [nodes, filter]);

  const filteredIdSet = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);
  const visibleEdges = edges.filter((e) => filteredIdSet.has(e.from) && filteredIdSet.has(e.to));
  const nodeMap = useMemo(() => new Map(filteredNodes.map((n) => [n.id, n])), [filteredNodes]);

  const stats = useMemo(() => {
    const all = flattenTree(tree);
    return {
      nodes: all.length,
      folders: all.filter((n) => n.kind === "folder").length,
      edges: edges.filter((e) => e.kind === "parent").length,
      tagEdges: edges.filter((e) => e.kind === "tag").length,
    };
  }, [tree, edges]);

  function label(n: VizNode) {
    if (n.id === "__hub__") return "QuoteOps";
    const raw = locale === "zh-CN" ? n.titleZh : n.titleEn || n.titleZh;
    return raw.length > 14 ? `${raw.slice(0, 13)}…` : raw;
  }

  function onNodeClick(n: VizNode) {
    if (n.id === "__hub__") return;
    setActive(n.id);
  }

  return (
    <div className="space-y-5 animate-rise">
      <header className="border-b border-line/80 pb-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-sea">
          {t("知识图谱 · 动态可视化", "Knowledge map · live visualisation")}
        </p>
        <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">
          {t("动态知识树", "Live knowledge tree")}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-mist">
          {t(
            "中心为 QuoteOps；外环为分类文件夹；选中分类后展开子节点。实线=从属，虚线=标签关联。开启实时刷新可在管理员增删改后自动更新。",
            "Center hub, outer ring = folders; select a folder to expand children. Solid = parent link, dashed = tag relation. Live refresh updates after admin edits.",
          )}
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <input
          className="field max-w-xs"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={t("过滤节点标题/类型…", "Filter title/kind…")}
        />
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-line bg-white px-3 py-2 text-xs"
        >
          {t("立即刷新", "Refresh now")}
        </button>
        <label className="flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-xs">
          <input type="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} />
          {t("实时更新 (4s)", "Live update (4s)")}
        </label>
        <span className="font-mono text-[11px] text-mist">
          {stats.nodes} nodes · {stats.folders} folders · {stats.edges} edges
          {stats.tagEdges ? ` · ${stats.tagEdges} tag-links` : ""}
        </span>
        {lastSync && (
          <span className="text-[11px] text-mist">
            sync {new Date(lastSync).toLocaleTimeString(locale === "zh-CN" ? "zh-CN" : "en-SG", {
              timeZone: "Asia/Singapore",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}{" "}
            SGT
          </span>
        )}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.75fr)]">
        <div ref={wrapRef} className="overflow-hidden rounded-2xl border border-line bg-ink shadow-sm">
          <svg
            width="100%"
            height={size.h}
            viewBox={`0 0 ${size.w} ${size.h}`}
            className="block touch-pan-y"
            role="img"
            aria-label={t("知识关系图", "Knowledge relation graph")}
          >
            <defs>
              <radialGradient id="vizGlow" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor="#0e7490" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#0c1520" stopOpacity="0" />
              </radialGradient>
              <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#5eead4" opacity="0.5" />
              </marker>
            </defs>
            <rect width={size.w} height={size.h} fill="url(#vizGlow)" />

            {visibleEdges.map((e) => {
              const a = nodeMap.get(e.from);
              const b = nodeMap.get(e.to);
              if (!a || !b) return null;
              const hot = hoverId === e.from || hoverId === e.to || active === e.from || active === e.to;
              return (
                <line
                  key={e.id}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={e.kind === "tag" ? "#f59e0b" : "#5eead4"}
                  strokeOpacity={hot ? 0.85 : e.kind === "tag" ? 0.25 : 0.35}
                  strokeWidth={hot ? 2.2 : e.kind === "tag" ? 1 : 1.4}
                  strokeDasharray={e.kind === "tag" ? "4 4" : undefined}
                  className="transition-all duration-300"
                />
              );
            })}

            {filteredNodes.map((n) => {
              const selected = active === n.id;
              const hovered = hoverId === n.id;
              const fill = KIND_COLOR[n.kind] || "#64748b";
              const r = selected ? n.r + 4 : hovered ? n.r + 2 : n.r;
              return (
                <g
                  key={n.id}
                  transform={`translate(${n.x},${n.y})`}
                  className="cursor-pointer"
                  onClick={() => onNodeClick(n)}
                  onMouseEnter={() => setHoverId(n.id)}
                  onMouseLeave={() => setHoverId(null)}
                >
                  {(selected || hovered) && (
                    <circle r={r + 8} fill={fill} opacity={0.15} className="animate-pulse-line" />
                  )}
                  <circle
                    r={r}
                    fill={fill}
                    stroke={selected ? "#fff" : "rgba(255,255,255,0.35)"}
                    strokeWidth={selected ? 2.5 : 1}
                    className="transition-all duration-300"
                  />
                  {n.childCount > 0 && n.kind === "folder" && (
                    <text
                      y={4}
                      textAnchor="middle"
                      fill="#ecfeff"
                      fontSize="10"
                      fontFamily="var(--font-mono), monospace"
                    >
                      {n.childCount}
                    </text>
                  )}
                  <text
                    y={r + 14}
                    textAnchor="middle"
                    fill={selected ? "#fff" : "rgba(255,255,255,0.82)"}
                    fontSize={n.depth <= 0 ? 11 : 9}
                    fontFamily="var(--font-sans), sans-serif"
                  >
                    {label(n)}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="flex flex-wrap gap-3 border-t border-white/10 px-3 py-2 text-[10px] text-paper/60">
            {Object.entries(KIND_COLOR)
              .filter(([k]) => k !== "hub")
              .map(([k, c]) => (
                <span key={k} className="inline-flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-full" style={{ background: c }} />
                  {k}
                </span>
              ))}
            <span className="inline-flex items-center gap-1">
              <span className="h-px w-4 bg-teal-300" /> {t("从属", "parent")}
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-px w-4 border-t border-dashed border-amber-400" /> {t("标签关联", "tag link")}
            </span>
          </div>
        </div>

        <aside className="rounded-2xl border border-line bg-white/90 p-4 sm:p-5">
          {selectedNode ? (
            <>
              <p className="font-mono text-[11px] uppercase tracking-wider text-sea">
                {selectedNode.kind}
                {focus && focus.id !== selectedNode.id
                  ? ` · ${t("展开", "expand")}: ${locale === "zh-CN" ? focus.titleZh : focus.titleEn || focus.titleZh}`
                  : ""}
              </p>
              <h2 className="mt-1 font-display text-2xl text-ink">
                {locale === "zh-CN" ? selectedNode.titleZh : selectedNode.titleEn || selectedNode.titleZh}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-mist">
                {locale === "zh-CN"
                  ? selectedNode.summaryZh || selectedNode.bodyZh.slice(0, 240)
                  : selectedNode.summaryEn ||
                    selectedNode.bodyEn.slice(0, 240) ||
                    selectedNode.summaryZh}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-mist">
                <span className="rounded border border-line px-2 py-1">
                  {(focus?.children.length ?? 0)} {t("可见子节点", "visible children")}
                </span>
                <span className="rounded border border-line px-2 py-1">{selectedNode.status}</span>
                <span className="rounded border border-line px-2 py-1">
                  upd {selectedNode.updatedAt.slice(0, 10)}
                </span>
              </div>

              <div className="mt-4 max-h-56 overflow-auto rounded-xl border border-line/70">
                <ul className="divide-y divide-line/60 text-sm">
                  {(focus?.children ?? []).slice(0, 40).map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-sea-soft/30 ${
                          active === c.id ? "bg-sea-soft/40" : ""
                        }`}
                        onClick={() => setActive(c.id)}
                      >
                        <span className="truncate font-medium text-ink">
                          {locale === "zh-CN" ? c.titleZh : c.titleEn || c.titleZh}
                        </span>
                        <span className="shrink-0 font-mono text-[10px] text-mist">{c.kind}</span>
                      </button>
                    </li>
                  ))}
                  {(focus?.children.length ?? 0) === 0 && (
                    <li className="px-3 py-4 text-mist">{t("无子节点", "No children")}</li>
                  )}
                </ul>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {selectedNode.kind !== "folder" && (
                  <Link
                    href={`/kb/${selectedNode.slug}`}
                    className="rounded-lg bg-ink px-3 py-2 text-xs text-paper"
                  >
                    {t("打开知识页", "Open page")}
                  </Link>
                )}
                <Link href="/admin" className="rounded-lg border border-line px-3 py-2 text-xs text-mist">
                  {t("管理节点", "Manage nodes")}
                </Link>
              </div>

              <div className="mt-5">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-mist">
                  {t("根分类", "Root folders")}
                </h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {tree.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setActive(r.id)}
                      className={`rounded-md border px-2 py-1 text-xs ${
                        expandId === r.id
                          ? "border-sea bg-sea-soft text-sea"
                          : "border-line bg-paper text-ink-2"
                      }`}
                    >
                      {(locale === "zh-CN" ? r.titleZh : r.titleEn || r.titleZh).slice(0, 18)}
                      <span className="ml-1 text-mist">{r.children.length}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-mist">{t("加载中或暂无节点", "Loading or empty")}</p>
          )}
        </aside>
      </div>
    </div>
  );
}
