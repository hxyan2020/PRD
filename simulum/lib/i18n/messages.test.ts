import { describe, expect, it } from "vitest";
import { LOCALES } from "@/lib/i18n/locales";
import { assertAllLocalesHaveKeys, t } from "@/lib/i18n/messages";

describe("i18n messages", () => {
  it("covers every locale key", () => {
    expect(assertAllLocalesHaveKeys()).toEqual([]);
  });

  it("returns localized jump CTA for major languages", () => {
    expect(t("en", "hero.jump")).toContain("catalogue");
    expect(t("zh", "hero.jump")).toContain("目录");
    expect(t("fr", "hero.jump").length).toBeGreaterThan(3);
    expect(LOCALES.length).toBeGreaterThanOrEqual(12);
  });
});
