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
};

export type VizEdge = {
  id: string;
  from: string;
  to: string;
  kind: "parent" | "tag";
};

function titleOf(n: TreeNode, locale: "zh-CN" | "en") {
  return locale === "zh-CN" ? n.titleZh : n.titleEn || n.titleZh;
}

/** Layout root folders on a ring; expand selected folder's children on an inner ring. */
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
  },
): { nodes: VizNode[]; edges: VizEdge[]; focus: TreeNode | null } {
  const { width, height, focusId, locale } = opts;
  const hubZh = opts.hubTitleZh ?? "QuoteOps";
  const hubEn = opts.hubTitleEn ?? "QuoteOps";
  const maxChildren = opts.maxChildren ?? 48;
  const cx = width / 2;
  const cy = height / 2;
  const nodes: VizNode[] = [];
  const edges: VizEdge[] = [];

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

  // Root ring
  const rootR = Math.min(width, height) * 0.34;
  roots.forEach((root, i) => {
    const angle = -Math.PI / 2 + (i / Math.max(roots.length, 1)) * Math.PI * 2;
    const x = cx + Math.cos(angle) * rootR;
    const y = cy + Math.sin(angle) * rootR * 0.85;
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
      x,
      y,
      r: root.kind === "folder" ? 28 : 18,
    });
  });

  // Center hub
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
    r: 36,
  });
  for (const root of roots) {
    edges.push({ id: `hub-${root.id}`, from: "__hub__", to: root.id, kind: "parent" });
  }

  // Focus children around focus node (or around center if focus is hub-like)
  if (focus) {
    const focusViz = nodes.find((n) => n.id === focus.id);
    const fx = focusViz?.x ?? cx;
    const fy = focusViz?.y ?? cy;
    const kids = focus.children.slice(0, maxChildren);
    const childR = Math.min(160, 40 + kids.length * 4);
    kids.forEach((child, i) => {
      const angle = -Math.PI / 2 + (i / Math.max(kids.length, 1)) * Math.PI * 2;
      const x = fx + Math.cos(angle) * childR;
      const y = fy + Math.sin(angle) * childR * 0.9;
      // keep on canvas
      const px = Math.max(40, Math.min(width - 40, x));
      const py = Math.max(40, Math.min(height - 40, y));
      nodes.push({
        id: child.id,
        parentId: focus.id,
        kind: child.kind,
        titleZh: child.titleZh,
        titleEn: child.titleEn,
        slug: child.slug,
        status: child.status,
        childCount: child.children.length,
        depth: 1,
        x: px,
        y: py,
        r: child.kind === "folder" ? 16 : 11,
      });
      edges.push({
        id: `${focus.id}-${child.id}`,
        from: focus.id,
        to: child.id,
        kind: "parent",
      });
    });

    // Tag co-occurrence edges among visible siblings (light relation graph)
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

  void titleOf; // keep helper available for callers
  void locale;
  return { nodes, edges, focus };
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
