import { describe, expect, it } from "vitest";
import { ensureKbSeeded, getTree } from "@/lib/kb/repo";
import { layoutKnowledgeGraph } from "@/lib/kb/layout";

describe("knowledge graph layout", () => {
  it("places hub, root folders, and focused children", async () => {
    await ensureKbSeeded();
    const tree = await getTree();
    expect(tree.length).toBeGreaterThan(0);
    const focusId = tree.find((n) => n.id === "folder-risks")?.id ?? tree[0]!.id;
    const { nodes, edges, focus } = layoutKnowledgeGraph(tree, {
      width: 900,
      height: 560,
      focusId,
      locale: "zh-CN",
      maxChildren: 20,
    });
    expect(nodes.some((n) => n.id === "__hub__")).toBe(true);
    expect(nodes.filter((n) => n.depth === 0).length).toBe(tree.length);
    expect(focus?.id).toBe(focusId);
    expect(edges.some((e) => e.kind === "parent")).toBe(true);
    expect(nodes.filter((n) => n.depth === 1).length).toBeGreaterThan(0);
  });

  it("spaces compact children farther apart for mobile", async () => {
    await ensureKbSeeded();
    const tree = await getTree("v-exchange-perp");
    expect(tree.length).toBe(1);
    const { nodes } = layoutKnowledgeGraph(tree, {
      width: 360,
      height: 360,
      focusId: tree[0]!.id,
      locale: "zh-CN",
      compact: true,
      maxChildren: 12,
      hubTitleZh: "V Exchange",
    });
    const kids = nodes.filter((n) => n.depth === 1);
    expect(kids.length).toBeGreaterThan(3);
    // pairwise min distance should be reasonably large on a 360px canvas
    let minDist = Infinity;
    for (let i = 0; i < kids.length; i++) {
      for (let j = i + 1; j < kids.length; j++) {
        const dx = kids[i]!.x - kids[j]!.x;
        const dy = kids[i]!.y - kids[j]!.y;
        minDist = Math.min(minDist, Math.hypot(dx, dy));
      }
    }
    expect(minDist).toBeGreaterThan(40);
    expect(kids.every((k) => typeof k.index === "number")).toBe(true);
  });
});
