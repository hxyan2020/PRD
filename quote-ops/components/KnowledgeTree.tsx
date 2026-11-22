"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import {
  flattenTree,
  layoutKnowledgeGraph,
  shortGraphLabel,
  type VizNode,
} from "@/lib/kb/layout";
import type { TreeNode } from "@/lib/kb/types";
import { useProduct } from "@/lib/product/context";

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
  const { product, def } = useProduct();
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(true);
  const [lastSync, setLastSync] = useState<string>("");
  const [filter, setFilter] = useState("");
  // Mobile-first: assume compact until ResizeObserver measures the canvas.
  const [size, setSize] = useState({ w: 360, h: 340 });
  const [compact, setCompact] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const stampRef = useRef("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/kb?mode=tree&product=${product}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { tree: TreeNode[] };
      const next = Array.isArray(data.tree) ? data.tree : [];
      const flat = flattenTree(next);
      const stamp =
        `${product}|` +
        flat.map((n) => `${n.id}:${n.updatedAt}:${n.parentId}:${n.children.length}`).join("|");
      const changed = stamp !== stampRef.current;
      stampRef.current = stamp;
      setTree(next);
      setActive((prev) => {
        if (!prev) return next[0]?.id ?? null;
        if (!changed) return prev;
        const stillThere = flat.some((n) => n.id === prev);
        return stillThere ? prev : next[0]?.id ?? null;
      });
      setLastSync(new Date().toISOString());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed");
    }
  }, [product]);

  useEffect(() => {
    stampRef.current = "";
    void load();
  }, [load]);

  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(() => void load(), 4000);
    return () => window.clearInterval(id);
  }, [live, load]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const sync = () => {
      if (mq.matches) setShowMap(true);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (!cr || cr.width < 40) return;
      const w = Math.max(280, Math.floor(cr.width));
      const isCompact = w < 640;
      setCompact(isCompact);
      setSize({
        w,
        h: isCompact
          ? Math.max(280, Math.min(360, Math.floor(w * 0.88)))
          : Math.max(360, Math.min(640, Math.floor(w * 0.62))),
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [showMap]);
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
        maxChildren: filter.trim() ? (compact ? 24 : 80) : compact ? 14 : 36,
        compact,
        hubTitleZh: product === "v-exchange-perp" ? "V Exchange" : "QuoteOps",
        hubTitleEn: product === "v-exchange-perp" ? "V Exchange" : "QuoteOps",
      }),
    [tree, size, expandId, locale, filter, product, compact],
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

  const childList = useMemo(() => {
    const kids = focus?.children ?? [];
    const q = filter.trim().toLowerCase();
    if (!q) return kids;
    return kids.filter((c) =>
      `${c.titleZh} ${c.titleEn} ${c.kind} ${c.slug}`.toLowerCase().includes(q),
    );
  }, [focus, filter]);

  function graphLabel(n: VizNode) {
    const raw = locale === "zh-CN" ? n.titleZh : n.titleEn || n.titleZh;
    const selected = active === n.id || hoverId === n.id;
    if (n.id === "__hub__") {
      if (compact) return product === "v-exchange-perp" ? "VE" : "QO";
      return shortGraphLabel(raw, { max: 12 });
    }
    if (compact && !selected) return String(n.index ?? "");
    return shortGraphLabel(raw, { max: compact ? (selected ? 10 : 6) : 12, compact });
  }

  function onNodeClick(n: VizNode) {
    if (n.id === "__hub__") return;
    setActive(n.id);
  }

  const isPerp = product === "v-exchange-perp";

  return (
    <div className="space-y-3 animate-rise sm:space-y-5">
      <header className="border-b border-line/80 pb-2.5 sm:pb-4">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-sea sm:text-[11px] sm:tracking-[0.2em]">
              {locale === "zh-CN" ? def.shortZh : def.shortEn} · {t("知识图谱", "Knowledge map")}
            </p>
            <h1 className="mt-1 font-display text-xl text-ink sm:mt-2 sm:text-4xl">
              {t("知识树", "Knowledge tree")}
            </h1>
          </div>
          <span className="shrink-0 font-mono text-[10px] text-mist sm:hidden">
            {stats.nodes} · {lastSync
              ? new Date(lastSync).toLocaleTimeString(locale === "zh-CN" ? "zh-CN" : "en-SG", {
                  timeZone: "Asia/Singapore",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—"}
          </span>
        </div>
        <p className="mt-1.5 hidden max-w-3xl text-sm leading-relaxed text-mist sm:mt-2 sm:block">
          {product === "v-exchange-perp"
            ? t(
                "中心为 V Exchange 永续；外环为告警/定价/SOP 等分类。与 CFD Broker 知识树隔离。",
                "Hub = V Exchange Perp; rings = alarms/pricing/SOP. Isolated from CFD Broker tree.",
              )
            : t(
                "中心为 QuoteOps；外环为分类文件夹；选中分类后展开子节点。实线=从属，虚线=标签关联。",
                "Center hub, outer ring = folders; select a folder to expand children.",
              )}
        </p>
      </header>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          className="field min-h-11 w-full sm:min-h-0 sm:max-w-xs"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={t("搜索节点…", "Search nodes…")}
          aria-label={t("过滤节点", "Filter nodes")}
        />
        <div className="flex gap-2 sm:flex-wrap">
          <button
            type="button"
            onClick={() => void load()}
            className="min-h-11 flex-1 rounded-lg border border-line bg-white px-3 py-2 text-xs touch-manipulation sm:min-h-0 sm:flex-none"
          >
            {t("刷新", "Refresh")}
          </button>
          <label className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-xs touch-manipulation sm:min-h-0 sm:flex-none">
            <input type="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} />
            {t("实时", "Live")}
          </label>
          <button
            type="button"
            onClick={() => setShowMap((v) => !v)}
            className={`min-h-11 flex-1 rounded-lg border px-3 py-2 text-xs touch-manipulation sm:hidden ${
              showMap
                ? isPerp
                  ? "border-teal-700 bg-teal-700 text-white"
                  : "border-ink bg-ink text-paper"
                : "border-line bg-white text-ink-2"
            }`}
            aria-pressed={showMap}
          >
            {showMap ? t("隐藏图谱", "Hide map") : t("关系图", "Map")}
          </button>
        </div>
        <span className="hidden font-mono text-[11px] text-mist sm:inline">
          {stats.nodes} nodes · {stats.folders} folders · {stats.edges} edges
          {stats.tagEdges ? ` · ${stats.tagEdges} tag-links` : ""}
          {lastSync
            ? ` · sync ${new Date(lastSync).toLocaleTimeString(locale === "zh-CN" ? "zh-CN" : "en-SG", {
                timeZone: "Asia/Singapore",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })} SGT`
            : ""}
        </span>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {/* Mobile-first: readable list is the primary surface */}
      <section className="rounded-2xl border border-line bg-white/95 p-3 sm:hidden">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="truncate text-xs font-medium text-ink">
            {focus
              ? locale === "zh-CN"
                ? focus.titleZh
                : focus.titleEn || focus.titleZh
              : t("节点列表", "Node list")}
          </p>
          <span className="shrink-0 font-mono text-[10px] text-mist">
            {childList.length} {t("篇", "nodes")}
          </span>
        </div>
        <ul className="max-h-[52vh] divide-y divide-line/70 overflow-auto overscroll-contain rounded-xl border border-line/70">
          {childList.map((c, i) => {
            const selected = active === c.id;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setActive(c.id)}
                  className={`flex w-full items-start gap-2.5 px-3 py-3.5 text-left touch-manipulation ${
                    selected ? (isPerp ? "bg-teal-50" : "bg-copper-soft/40") : "bg-white"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-mono text-white ${
                      selected ? (isPerp ? "bg-teal-700" : "bg-copper") : "bg-ink/70"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-medium leading-snug text-ink">
                      {locale === "zh-CN" ? c.titleZh : c.titleEn || c.titleZh}
                    </span>
                    <span className="mt-1 block truncate text-[11px] leading-snug text-mist">
                      {(locale === "zh-CN" ? c.summaryZh : c.summaryEn || c.summaryZh) || c.kind}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
          {childList.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-mist">{t("无匹配节点", "No matching nodes")}</li>
          )}
        </ul>
        {selectedNode && selectedNode.kind !== "folder" && (
          <Link
            href={`/kb/${selectedNode.slug}`}
            className={`mt-3 flex min-h-12 items-center justify-center rounded-lg px-3 text-sm font-medium text-paper touch-manipulation ${
              isPerp ? "bg-teal-700" : "bg-ink"
            }`}
          >
            {t("打开知识页", "Open page")}
          </Link>
        )}
      </section>

      <div
        className={`grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.75fr)] ${
          showMap ? "" : "hidden sm:grid"
        }`}
      >
        <div ref={wrapRef} className="overflow-hidden rounded-2xl border border-line bg-ink shadow-sm">          <svg
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
                  strokeOpacity={hot ? 0.9 : e.kind === "tag" ? 0.2 : 0.32}
                  strokeWidth={hot ? 2.2 : e.kind === "tag" ? 1 : 1.3}
                  strokeDasharray={e.kind === "tag" ? "4 4" : undefined}
                />
              );
            })}

            {filteredNodes.map((n) => {
              const selected = active === n.id;
              const hovered = hoverId === n.id;
              const fill = KIND_COLOR[n.kind] || "#64748b";
              const r = selected ? n.r + 3 : hovered ? n.r + 2 : n.r;
              // Compact: numbers inside dots only — never paint long titles on the ring.
              const insideOnly = compact && n.id !== "__hub__" && !selected && !hovered;
              const labelText = graphLabel(n);
              const angle = n.angle ?? -Math.PI / 2;
              const labelDist = r + (selected || hovered ? 16 : 12);
              const lx = compact && (selected || hovered) && n.depth === 1 ? Math.cos(angle) * labelDist : 0;
              const ly =
                compact && (selected || hovered) && n.depth === 1
                  ? Math.sin(angle) * labelDist
                  : r + (compact ? 11 : 14);
              const anchor =
                compact && (selected || hovered) && n.depth === 1
                  ? Math.abs(Math.cos(angle)) < 0.35
                    ? "middle"
                    : Math.cos(angle) > 0
                      ? "start"
                      : "end"
                  : "middle";

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
                    <circle r={r + 7} fill={fill} opacity={0.18} />
                  )}
                  <circle
                    r={r}
                    fill={fill}
                    stroke={selected ? "#fff" : "rgba(255,255,255,0.35)"}
                    strokeWidth={selected ? 2.4 : 1}
                  />
                  {(insideOnly || n.id === "__hub__") && (
                    <text
                      y={n.id === "__hub__" ? 4 : 3.5}
                      textAnchor="middle"
                      fill="#ecfeff"
                      fontSize={n.id === "__hub__" ? 11 : 10}
                      fontFamily="var(--font-mono), monospace"
                      fontWeight={n.id === "__hub__" ? 600 : 500}
                    >
                      {n.id === "__hub__" ? labelText : String(n.index ?? "")}
                    </text>
                  )}
                  {!insideOnly && n.id !== "__hub__" && (
                    <text
                      x={lx}
                      y={ly}
                      textAnchor={anchor}
                      fill={selected ? "#fff" : "rgba(255,255,255,0.92)"}
                      fontSize={selected ? 10 : 9}
                      fontFamily="var(--font-sans), sans-serif"
                      style={{ paintOrder: "stroke", stroke: "rgba(12,21,32,0.8)", strokeWidth: 3 }}
                    >
                      {labelText}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          <div className="flex gap-3 overflow-x-auto border-t border-white/10 px-3 py-2 text-[10px] text-paper/60 chip-scroll">
            {Object.entries(KIND_COLOR)
              .filter(([k]) => k !== "hub")
              .map(([k, c]) => (
                <span key={k} className="inline-flex shrink-0 items-center gap-1.5 py-0.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: c }} />
                  {k}
                </span>
              ))}
            {compact && (
              <span className="shrink-0 text-paper/45">
                {t("数字=上方列表序号", "Numbers match the list above")}
              </span>
            )}
          </div>
        </div>

        <aside className="hidden rounded-2xl border border-line bg-white/90 p-4 sm:block sm:p-5">
          {selectedNode ? (
            <>
              <p className="font-mono text-[11px] uppercase tracking-wider text-sea">
                {selectedNode.kind}
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
