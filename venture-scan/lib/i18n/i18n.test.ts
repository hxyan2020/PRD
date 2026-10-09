import { describe, expect, it } from "vitest";
import { LOCALES } from "./locales";
import { MESSAGES, translate } from "./messages";

describe("i18n", () => {
  it("covers major locales with national flag codes", () => {
    expect(LOCALES.length).toBeGreaterThanOrEqual(12);
    for (const locale of LOCALES) {
      expect(locale.flagCode).toMatch(/^[a-z]{2}$/);
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

  it("translates at least 95% of keys per locale (≤8 intentional English cognates)", () => {
    const enKeys = Object.keys(MESSAGES.en) as (keyof typeof MESSAGES.en)[];
    const maxStillEn = 8;
    for (const locale of LOCALES) {
      if (locale.code === "en") continue;
      const dict = MESSAGES[locale.code];
      const stillEn = enKeys.filter((k) => dict[k] === MESSAGES.en[k]).length;
      const coverage = Math.round(((enKeys.length - stillEn) / enKeys.length) * 100);
      expect(stillEn).toBeLessThanOrEqual(maxStillEn);
      expect(coverage).toBeGreaterThanOrEqual(95);
    }
  });
});
