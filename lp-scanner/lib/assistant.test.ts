import { describe, expect, it } from "vitest";
import { SEED_LPS } from "@/lib/data/seed-lps";
import { resolveOptimalRegions } from "@/lib/regions";
import { buildChatAnswer, classifyIntent } from "@/lib/assistant";

const lps = SEED_LPS.map((lp) => ({
  ...lp,
  optimalRegions: resolveOptimalRegions(lp.slug, lp.optimalRegions),
}));

describe("assistant intent + answers", () => {
  it("classifies methodology questions", () => {
    expect(classifyIntent("How should we test quote quality for a new product?", "", lps)).toBe(
      "methodology",
    );
    expect(classifyIntent("新商品报价质量怎么测？", "", lps)).toBe("methodology");
  });

  it("answers methodology with pipeline, modes and public sources", () => {
    const a = buildChatAnswer(
      "How do we combine LP UAT and broker backtest?",
      "",
      lps,
      "en",
    );
    expect(a.intent).toBe("methodology");
    expect(a.understoodAs.toLowerCase()).toMatch(/test|methodology|quality/);
    expect(a.sections.some((s) => s.bullets && s.bullets.length >= 4)).toBe(true);
    expect(a.sources.some((s) => s.url.startsWith("http"))).toBe(true);
    expect(a.sources.some((s) => s.url.includes("testing"))).toBe(true);
  });

  it("ranks product questions with LP names and sources", () => {
    const a = buildChatAnswer("Which LPs for XAUUSD?", "", lps, "en");
    expect(a.intent).toBe("product");
    expect(a.understoodAs).toMatch(/XAUUSD/);
    const blob = a.sections.flatMap((s) => s.bullets ?? []).join(" ");
    expect(blob).toMatch(/iSPrime|Finalto|CMC/i);
    expect(a.sources.length).toBeGreaterThan(0);
  });

  it("profiles a named LP with official site when available", () => {
    const a = buildChatAnswer("Tell me about iSPrime", "", lps, "en");
    expect(a.intent).toBe("lp");
    expect(a.sections[0]?.heading).toMatch(/iSPrime|IS Prime/i);
    expect(a.sources.some((s) => s.url.startsWith("http") || s.url.startsWith("/"))).toBe(true);
  });

  it("compares two LPs", () => {
    const a = buildChatAnswer("Compare Finalto vs CMC Markets", "", lps, "en");
    expect(a.intent).toBe("compare");
    expect(a.understoodAs).toMatch(/Finalto/);
    expect(a.understoodAs).toMatch(/CMC/);
  });

  it("clarifies vague questions instead of dumping noise", () => {
    const a = buildChatAnswer("??", "", lps, "en");
    expect(a.intent).toBe("clarify");
    expect(a.sections[0]?.bullets?.length).toBeGreaterThan(0);
  });

  it("returns zh structured methodology", () => {
    const a = buildChatAnswer("已接入 LP 新增商品还要做完整 UAT 吗？", "", lps, "zh-CN");
    expect(a.intent).toBe("methodology");
    expect(a.understoodAs).toMatch(/方法论|测试/);
    const text = JSON.stringify(a.sections);
    expect(text).toMatch(/影子|小额|UAT/);
    expect(a.sources.some((s) => /Equidity|Ripple|AMTS|methodology/i.test(s.title))).toBe(true);
  });
});
