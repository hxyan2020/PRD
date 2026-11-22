import type { TreeNode } from "@/lib/kb/types";

export type VizNode = {
  id: string;
  parentId: string | null;
  kind: string;
  titleZh: string;
  titleEn: string;
  slug: string;
  status: string;
  childCount: number;
  depth: number;
  x: number;
  y: number;
  r: number;
  /** Index among siblings for compact mobile labels (1-based). */
  index?: number;
  /** Angle from focus/hub center — used to place labels outward. */
  angle?: number;
};

export type VizEdge = {
  id: string;
  from: string;
  to: string;
  kind: "parent" | "tag";
};

/** Layout root folders on a ring; expand selected folder's children on an outer ring. */
export function layoutKnowledgeGraph(
  tree: TreeNode[],
  opts: {
    width: number;
    height: number;
    focusId: string | null;
    locale: "zh-CN" | "en";
    maxChildren?: number;
    hubTitleZh?: string;
    hubTitleEn?: string;
    /** Narrow screens: push children farther out to reduce label collisions. */
    compact?: boolean;
  },
): { nodes: VizNode[]; edges: VizEdge[]; focus: TreeNode | null } {
  const { width, height, focusId } = opts;
  const compact = !!opts.compact;
  const hubZh = opts.hubTitleZh ?? "定价";
  const hubEn = opts.hubTitleEn ?? "Pricing";
  const maxChildren = opts.maxChildren ?? (compact ? 16 : 48);
  const cx = width / 2;
  const cy = height / 2;
  const nodes: VizNode[] = [];
  const edges: VizEdge[] = [];
  const pad = compact ? 28 : 40;

  function find(nodesIn: TreeNode[], id: string | null): TreeNode | null {
    if (!id) return null;
    for (const n of nodesIn) {
      if (n.id === id) return n;
      const f = find(n.children, id);
      if (f) return f;
    }
    return null;
  }

  const focus = find(tree, focusId) ?? tree[0] ?? null;
  const roots = tree;

  // When a single root folder (e.g. VE product tree), treat it as the focus ring
  // and keep hub + children — avoid drawing a useless solitary root on top of kids.
  const singleRoot = roots.length === 1;

  const rootR = Math.min(width, height) * (compact ? 0.28 : 0.34);
  if (!singleRoot) {
    roots.forEach((root, i) => {
      const angle = -Math.PI / 2 + (i / Math.max(roots.length, 1)) * Math.PI * 2;
      const x = cx + Math.cos(angle) * rootR;
      const y = cy + Math.sin(angle) * rootR * (compact ? 0.78 : 0.85);
      nodes.push({
        id: root.id,
        parentId: null,
        kind: root.kind,
        titleZh: root.titleZh,
        titleEn: root.titleEn,
        slug: root.slug,
        status: root.status,
        childCount: root.children.length,
        depth: 0,
        x: clamp(x, pad, width - pad),
        y: clamp(y, pad, height - pad),
        r: compact ? 22 : root.kind === "folder" ? 28 : 18,
        index: i + 1,
        angle,
      });
    });
  }

  nodes.push({
    id: "__hub__",
    parentId: null,
    kind: "hub",
    titleZh: hubZh,
    titleEn: hubEn,
    slug: "",
    status: "published",
    childCount: roots.length,
    depth: -1,
    x: cx,
    y: cy,
    r: compact ? 28 : 36,
  });

  if (!singleRoot) {
    for (const root of roots) {
      edges.push({ id: `hub-${root.id}`, from: "__hub__", to: root.id, kind: "parent" });
    }
  }

  if (focus) {
    const kids = focus.children.slice(0, maxChildren);
    const n = Math.max(kids.length, 1);
    // Spread children on a ring sized for readable gaps on small screens.
    const minGap = compact ? 52 : 44;
    const neededR = (n * minGap) / (2 * Math.PI);
    const childR = Math.min(
      Math.min(width, height) * (compact ? 0.4 : 0.36),
      Math.max(compact ? 110 : 90, neededR),
    );

    // Anchor ring around hub on single-root / mobile for clearer composition.
    const focusViz = nodes.find((v) => v.id === focus.id);
    const useHubAnchor = singleRoot || compact || !focusViz || focusViz.r < 1;
    const fx = useHubAnchor ? cx : focusViz.x;
    const fy = useHubAnchor ? cy : focusViz.y;

    kids.forEach((child, i) => {
      const angle = -Math.PI / 2 + (i / n) * Math.PI * 2;
      const x = fx + Math.cos(angle) * childR;
      const y = fy + Math.sin(angle) * childR * (compact ? 0.92 : 0.9);
      nodes.push({
        id: child.id,
        parentId: useHubAnchor ? "__hub__" : focus.id,
        kind: child.kind,
        titleZh: child.titleZh,
        titleEn: child.titleEn,
        slug: child.slug,
        status: child.status,
        childCount: child.children.length,
        depth: 1,
        x: clamp(x, pad, width - pad),
        y: clamp(y, pad + 8, height - pad),
        r: compact ? (child.kind === "folder" ? 14 : 12) : child.kind === "folder" ? 16 : 11,
        index: i + 1,
        angle,
      });
      edges.push({
        id: `${useHubAnchor ? "hub" : focus.id}-${child.id}`,
        from: useHubAnchor ? "__hub__" : focus.id,
        to: child.id,
        kind: "parent",
      });
    });

    // Tag co-occurrence among siblings — skip on compact to reduce clutter.
    if (!compact) {
      const tagMap = new Map<string, string[]>();
      for (const child of kids) {
        for (const tag of child.tags.slice(0, 4)) {
          const list = tagMap.get(tag) ?? [];
          list.push(child.id);
          tagMap.set(tag, list);
        }
      }
      let tagEdgeCount = 0;
      for (const [, ids] of tagMap) {
        if (ids.length < 2 || tagEdgeCount > 40) continue;
        for (let i = 0; i < Math.min(ids.length - 1, 3); i++) {
          edges.push({
            id: `tag-${ids[i]}-${ids[i + 1]}`,
            from: ids[i]!,
            to: ids[i + 1]!,
            kind: "tag",
          });
          tagEdgeCount++;
        }
      }
    }
  }

  // Hide near-zero radius placeholder root under hub
  const visible = nodes.filter((n) => n.r >= 1 || n.id === "__hub__");
  return { nodes: visible, edges, focus };
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export function flattenTree(tree: TreeNode[]): TreeNode[] {
  const out: TreeNode[] = [];
  function walk(n: TreeNode) {
    out.push(n);
    n.children.forEach(walk);
  }
  tree.forEach(walk);
  return out;
}

/** Short graph label — aggressive truncate for narrow canvases. */
export function shortGraphLabel(
  title: string,
  opts?: { max?: number; compact?: boolean },
): string {
  const max = opts?.max ?? (opts?.compact ? 6 : 12);
  const t = title.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(1, max - 1))}…`;
}
