import { describe, expect, it } from "vitest";
import { categoryName } from "@/lib/i18n/category-labels";

describe("categoryName", () => {
  it("localizes philosophy category into Chinese", () => {
    expect(categoryName("philosophy-metaphysics", "zh")).toBe("哲学与形而上学");
    expect(categoryName("public-discourse", "zh")).toBe("公共讨论");
    expect(categoryName("thought-experiments", "zh")).toBe("思想实验");
  });

  it("falls back to English when locale missing a string", () => {
    expect(categoryName("philosophy-metaphysics", "en")).toBe(
      "Philosophy & Metaphysics",
    );
  });
});
