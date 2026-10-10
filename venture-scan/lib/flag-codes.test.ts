import { describe, expect, it } from "vitest";
import { LOCALES } from "./i18n/locales";
import { countryToFlagCode } from "./flag-codes";

describe("flag codes", () => {
  it("maps seed and source countries to ISO codes", () => {
    for (const country of [
      "United States",
      "China",
      "Taiwan",
      "Hong Kong",
      "South Korea",
      "United Arab Emirates",
      "Vietnam",
      "Turkey",
    ]) {
      expect(countryToFlagCode(country)).toMatch(/^[a-z]{2}$/);
    }
  });

  it("gives every UI locale a valid flag code", () => {
    const codes = new Set(LOCALES.map((l) => l.flagCode));
    expect(codes.size).toBe(LOCALES.length);
    for (const locale of LOCALES) {
      expect(locale.flagCode).toMatch(/^[a-z]{2}$/);
    }
  });
});
