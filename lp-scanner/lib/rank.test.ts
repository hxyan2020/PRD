import { describe, expect, it } from "vitest";
import { SEED_LPS } from "@/lib/data/seed-lps";
import { rankLpsForProduct } from "@/lib/rank";

describe("rankLpsForProduct", () => {
  it("ranks gold specialists highly for XAUUSD", () => {
    const result = rankLpsForProduct(SEED_LPS, "XAUUSD", "en");
    expect(result.product).toBe("XAUUSD");
    expect(result.rankings.length).toBeGreaterThan(3);
    const topNames = result.rankings.slice(0, 3).map((r) => r.lp.name);
    expect(topNames.some((n) => n === "iSPrime" || n === "Finalto")).toBe(true);
    expect(result.rankings.every((r) => r.offersProduct || r.score > 35)).toBe(true);
  });

  it("prefers crypto exchanges for BTCUSD", () => {
    const result = rankLpsForProduct(SEED_LPS, "BTCUSD", "en");
    const top = result.rankings[0];
    expect(top.lp.category).toBe("crypto");
    expect(["Binance", "Bybit", "OKX"]).toContain(top.lp.name);
  });
});
