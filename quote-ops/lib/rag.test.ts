import { describe, expect, it } from "vitest";
import { RISK_SCENARIOS } from "@/lib/data/risks";
import { SKILLS } from "@/lib/data/skills";
import { buildCorpusAsync } from "@/lib/corpus";
import { answerQuestion, retrieve } from "@/lib/rag";
import { ensureKbSeeded, listNodes } from "@/lib/kb/repo";

describe("kb seed", () => {
  it("seeds 86 risks and skills into editable nodes", async () => {
    await ensureKbSeeded();
    expect(RISK_SCENARIOS).toHaveLength(86);
    const nodes = await listNodes();
    expect(nodes.filter((n) => n.kind === "risk")).toHaveLength(86);
    expect(nodes.filter((n) => n.kind === "skill").length).toBe(SKILLS.length);
    expect(nodes.some((n) => n.kind === "pipeline")).toBe(true);
    expect(nodes.some((n) => n.kind === "database")).toBe(true);
  });
});

describe("rag retrieve", () => {
  it("ranks stale quote queries toward pricing skills/risks", async () => {
    const corpus = await buildCorpusAsync("cfd-broker");
    expect(corpus.length).toBeGreaterThan(50);
    const hits = await retrieve("旧价成交 Quote Age RCA", "zh-CN", 6, "cfd-broker");
    expect(hits.length).toBeGreaterThan(0);
    const blob = hits.map((h) => h.chunk.id + h.chunk.titleZh).join(" ");
    expect(/stale|旧价|risk-17|sk-stale/i.test(blob)).toBe(true);
  });

  it("answers pipeline questions with pipeline chunks", async () => {
    const a = await answerQuestion("LP 到 PE 到 MT 报价流程", "zh-CN", "cfd-broker");
    expect(a.hits.some((h) => h.chunk.kind === "pipeline")).toBe(true);
    expect(a.summary.length).toBeGreaterThan(5);
    expect(a.product).toBe("cfd-broker");
  });

  it("surfaces database placeholders for host questions", async () => {
    const a = await answerQuestion("Quote Tick 库访问地址 host", "zh-CN", "cfd-broker");
    expect(a.hits.some((h) => h.chunk.kind === "database")).toBe(true);
  });

  it("keeps V Exchange perpetual corpus separate from CFD", async () => {
    await ensureKbSeeded();
    const veNodes = await listNodes({ product: "v-exchange-perp" });
    expect(veNodes.some((n) => n.id === "folder-v-exchange")).toBe(true);
    expect(veNodes.some((n) => n.slug === "ve-alarm-catalog")).toBe(true);
    expect(veNodes.every((n) => !n.id.startsWith("risk-"))).toBe(true);

    const cfd = await buildCorpusAsync("cfd-broker");
    const ve = await buildCorpusAsync("v-exchange-perp");
    expect(cfd.every((c) => c.product === "cfd-broker")).toBe(true);
    expect(ve.every((c) => c.product === "v-exchange-perp")).toBe(true);
    expect(ve.some((c) => /funding|资金费率|mark/i.test(c.titleZh + c.bodyZh))).toBe(true);

    const a = await answerQuestion("外部 Funding 偏差超过 0.1%", "zh-CN", "v-exchange-perp");
    expect(a.product).toBe("v-exchange-perp");
    expect(a.hits.length).toBeGreaterThan(0);
    expect(a.hits.every((h) => h.chunk.product === "v-exchange-perp")).toBe(true);
  });
});
