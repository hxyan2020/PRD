import { describe, expect, it } from "vitest";
import {
  FINAL_METHODOLOGY,
  PHASES,
  TEST_MODES,
} from "@/lib/data/lp-quality-testing";

describe("final LP quote-quality methodology", () => {
  it("defines four complementary test modes", () => {
    expect(TEST_MODES).toHaveLength(4);
    expect(TEST_MODES.map((m) => m.modeEn)).toEqual([
      "LP Demo / UAT",
      "Historical backtest",
      "Live quote shadow",
      "Small live fills",
    ]);
  });

  it("states the combined new-product pipeline", () => {
    expect(FINAL_METHODOLOGY.pipelineEn).toContain("LP UAT");
    expect(FINAL_METHODOLOGY.pipelineEn).toContain("historical backtest");
    expect(FINAL_METHODOLOGY.pipelineEn).toContain("live quote shadow");
    expect(FINAL_METHODOLOGY.pipelineEn).toContain("small live");
    expect(FINAL_METHODOLOGY.pipelineZh).toContain("影子测试");
    expect(FINAL_METHODOLOGY.pipelineShortEn).toMatch(/reuse|skip|shadow/i);
  });

  it("lists caveats that separate UAT/backtest from live proof", () => {
    expect(FINAL_METHODOLOGY.caveatsEn.length).toBeGreaterThanOrEqual(4);
    expect(FINAL_METHODOLOGY.caveatsEn.join(" ")).toMatch(/last look/i);
    expect(FINAL_METHODOLOGY.caveatsZh.join(" ")).toMatch(/生产流动性/);
  });

  it("phases follow diligence → UAT → backtest → shadow → live", () => {
    expect(PHASES.map((p) => p.phaseEn)).toEqual([
      "0. Desk due diligence",
      "1. LP Demo / UAT",
      "2. Historical broker backtest",
      "3. Live quote shadow",
      "4. Small live fills + go-live",
    ]);
  });
});
