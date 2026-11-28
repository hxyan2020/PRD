import { describe, expect, it } from "vitest";
import { chineseClaimCaption, localizeClaimCaption } from "./claim-locale";

describe("chineseClaimCaption", () => {
  it("translates known English ancestor-simulation captions", () => {
    const zh = chineseClaimCaption(
      "If civilizations run many ancestor simulations, odds favor us being in one",
    );
    expect(zh).toMatch(/祖先模拟|模拟/);
    expect(zh).not.toMatch(/If civilizations/i);
  });

  it("maps Chalmers / Matrix style claims", () => {
    expect(
      chineseClaimCaption(
        "David Chalmers argues virtual realities can be genuine realities, reframing simulation from skeptical threat to metaphysical possibility",
      ),
    ).toMatch(/查默斯|虚拟现实/);
    expect(
      chineseClaimCaption("Bostrom's argument linked to the Matrix metaphor as cultural evidence"),
    ).toMatch(/黑客帝国|博斯特罗姆/);
  });

  it("keeps already-Chinese captions", () => {
    expect(chineseClaimCaption("假设我们生活在模拟宇宙中")).toBe(
      "假设我们生活在模拟宇宙中",
    );
  });
});

describe("localizeClaimCaption", () => {
  it("only rewrites for Chinese UI", () => {
    const en =
      "With many simulations, almost all observers are simulated";
    expect(localizeClaimCaption(en, "zh")).toMatch(/模拟|观察者/);
    expect(localizeClaimCaption(en, "en")).toBe("");
    expect(localizeClaimCaption(en, "fr")).toBe("");
  });
});
