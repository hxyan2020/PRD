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
});
