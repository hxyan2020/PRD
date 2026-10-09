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

  it("preserves interpolation placeholders in every locale", () => {
    const varRe = /\{([a-zA-Z]+)\}/g;
    for (const [key, enValue] of Object.entries(MESSAGES.en)) {
      const enVars = new Set([...enValue.matchAll(varRe)].map((m) => m[1]));
      if (enVars.size === 0) continue;
      for (const locale of LOCALES) {
        if (locale.code === "en") continue;
        const value = MESSAGES[locale.code][key as keyof typeof MESSAGES.en] ?? "";
        const locVars = new Set([...value.matchAll(varRe)].map((m) => m[1]));
        expect(locVars, `${locale.code}.${key}`).toEqual(enVars);
      }
    }
  });

  it("rejects corrupted machine-translation artifacts", () => {
    const junk =
      /_ _ [A-Z0-9_]+ _ _|ZZ?[A-Z]*PH\d+Z*|ZPH\d+ZZ|(?<!\{)\bPH[0-9]\b|\bARROW\b|\^PH\d|butterphone|ZVSZZ|SOZVS/;
    for (const locale of LOCALES) {
      if (locale.code === "en") continue;
      for (const [key, value] of Object.entries(MESSAGES[locale.code])) {
        expect(junk.test(value), `${locale.code}.${key}: ${value}`).toBe(false);
        const words = value.split(/\s+/).filter(Boolean);
        if (words.length >= 3) {
          for (let i = 0; i < words.length - 2; i++) {
            if (words[i].length > 1 && words[i] === words[i + 1] && words[i] === words[i + 2]) {
              throw new Error(`${locale.code}.${key} has repeated token: ${value}`);
            }
          }
        }
      }
    }
  });
});
