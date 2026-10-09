import { describe, expect, it } from "vitest";
import { LOCALES } from "./locales";
import { MESSAGES, translate } from "./messages";

describe("i18n", () => {
  it("covers major locales with flag icons", () => {
    expect(LOCALES.length).toBeGreaterThanOrEqual(12);
    for (const locale of LOCALES) {
      expect(locale.flag.length).toBeGreaterThan(0);
      expect(MESSAGES[locale.code]).toBeTruthy();
      expect(MESSAGES[locale.code]["nav.language"]).toBeTruthy();
      expect(MESSAGES[locale.code]["lang.pickerLabel"]).toBeTruthy();
    }
  });

  it("interpolates variables", () => {
    expect(translate("en", "hero.browse", { count: 12 })).toBe("Browse 12 ideas");
    expect(translate("zh-CN", "hero.browse", { count: 12 })).toContain("12");
  });

  it("falls back to English for missing keys via en baseline", () => {
    expect(translate("nl", "footer.chips")).toBeTruthy();
  });
});
