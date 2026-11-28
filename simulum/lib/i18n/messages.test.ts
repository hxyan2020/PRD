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

  it("localizes scan log title across all locales", () => {
    const en = t("en", "scanLog.title");
    for (const loc of LOCALES) {
      const value = t(loc.code, "scanLog.title");
      expect(value.length).toBeGreaterThan(2);
      if (loc.code !== "en") expect(value).not.toBe(en);
    }
  });
});

