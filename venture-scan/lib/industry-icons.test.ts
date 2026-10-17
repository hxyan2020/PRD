import { describe, expect, it } from "vitest";
import { industryIconId } from "./industry-icons";

describe("industryIconId", () => {
  it("maps known industries to stable icon ids", () => {
    expect(industryIconId("")).toBe("all");
    expect(industryIconId("DevTools")).toBe("devtools");
    expect(industryIconId("FinTech")).toBe("fintech");
    expect(industryIconId("Climate Tech")).toBe("climate");
    expect(industryIconId("E-commerce")).toBe("ecommerce");
  });

  it("falls back for unknown industries", () => {
    expect(industryIconId("Something New")).toBe("generic");
  });
});
