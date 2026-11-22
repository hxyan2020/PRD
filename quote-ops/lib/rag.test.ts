import { describe, expect, it } from "vitest";
import { buildCorpus } from "@/lib/corpus";
import { RISK_SCENARIOS } from "@/lib/data/risks";
import { SKILLS } from "@/lib/data/skills";
import { answerQuestion, retrieve } from "@/lib/rag";

describe("corpus", () => {
  it("includes all 86 risks and skills", () => {
    expect(RISK_SCENARIOS).toHaveLength(86);
    const corpus = buildCorpus();
    expect(corpus.filter((c) => c.kind === "risk")).toHaveLength(86);
    expect(corpus.filter((c) => c.kind === "skill").length).toBe(SKILLS.length);
    expect(corpus.some((c) => c.kind === "pipeline")).toBe(true);
    expect(corpus.some((c) => c.kind === "database")).toBe(true);
  });
});

describe("rag retrieve", () => {
  it("ranks stale quote queries toward pricing skills/risks", () => {
    const hits = retrieve("旧价成交 Quote Age RCA", "zh-CN", 6);
    expect(hits.length).toBeGreaterThan(0);
    const ids = hits.map((h) => h.chunk.id).join(" ");
    expect(/stale|skill-sk-stale|risk-17|旧价/i.test(ids + hits[0]!.chunk.titleZh)).toBe(true);
  });

  it("answers pipeline questions with pipeline chunks", () => {
    const a = answerQuestion("LP 到 PE 到 MT 报价流程", "zh-CN");
    expect(a.hits.some((h) => h.chunk.kind === "pipeline")).toBe(true);
    expect(a.summary.length).toBeGreaterThan(5);
  });

  it("surfaces database placeholders for host questions", () => {
    const a = answerQuestion("Quote Tick 库访问地址 host", "zh-CN");
    expect(a.hits.some((h) => h.chunk.kind === "database")).toBe(true);
    expect(a.sections.some((s) => /访问|Access/i.test(s.heading))).toBe(true);
  });
});
