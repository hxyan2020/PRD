import { describe, expect, it } from "vitest";
import {
  DATA_SOURCES,
  allCoveredCountries,
  sourceHealth,
  sourcesSummary,
} from "./data-sources";

describe("data sources registry", () => {
  it("covers a wide set of countries and languages", () => {
    const countries = allCoveredCountries();
    expect(DATA_SOURCES.length).toBeGreaterThanOrEqual(25);
    expect(countries.length).toBeGreaterThanOrEqual(40);
    for (const required of [
      "United States",
      "China",
      "India",
      "Brazil",
      "Nigeria",
      "Japan",
      "Germany",
      "France",
      "Vietnam",
      "Turkey",
      "Australia",
      "Sweden",
    ]) {
      expect(countries).toContain(required);
    }
    const languages = new Set(DATA_SOURCES.map((s) => s.language));
    expect(languages.size).toBeGreaterThanOrEqual(10);
    expect(
      DATA_SOURCES.some((s) => /Chinese|中文|Korean|한국어|Arabic|العربية|Portuguese|Turkish|Vietnamese/i.test(
        `${s.language} ${s.languageNative ?? ""}`,
      )),
    ).toBe(true);
  });

  it("computes health from last sourced age", () => {
    const now = Date.parse("2026-10-09T12:00:00.000Z");
    const healthy = DATA_SOURCES.find((s) => s.id === "techcrunch")!;
    const degraded = DATA_SOURCES.find((s) => s.id === "startup-india")!;
    const offline = DATA_SOURCES.find((s) => s.id === "offline-probe")!;
    expect(sourceHealth(healthy, now)).toBe("healthy");
    expect(sourceHealth(degraded, now)).toBe("degraded");
    expect(sourceHealth(offline, now)).toBe("offline");
  });

  it("summarizes desk totals", () => {
    const summary = sourcesSummary(Date.parse("2026-10-09T12:00:00.000Z"));
    expect(summary.total).toBe(DATA_SOURCES.length);
    expect(summary.countries.length).toBeGreaterThan(30);
    expect(summary.healthCounts.healthy + summary.healthCounts.degraded + summary.healthCounts.stale + summary.healthCounts.offline).toBe(
      summary.total,
    );
    expect(summary.lastSourcedAt).toBeTruthy();
  });

  it("keeps unique source ids and required fields", () => {
    const ids = DATA_SOURCES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const source of DATA_SOURCES) {
      expect(source.name).toBeTruthy();
      expect(source.url).toMatch(/^https?:\/\//);
      expect(source.logoDomain).toMatch(/\./);
      expect(source.countries.length).toBeGreaterThan(0);
      expect(source.lastSourcedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
  });
});

describe("self-hosted brand assets", () => {
  it("ships a flag SVG for every covered country and locale", async () => {
    const { existsSync } = await import("node:fs");
    const { join } = await import("node:path");
    const { LOCALES } = await import("./i18n/locales");
    const { countryToFlagCode } = await import("./flag-codes");
    const root = join(process.cwd(), "public", "flags");
    for (const country of allCoveredCountries()) {
      const code = countryToFlagCode(country);
      expect(code).toBeTruthy();
      expect(existsSync(join(root, `${code}.svg`))).toBe(true);
    }
    for (const locale of LOCALES) {
      expect(existsSync(join(root, `${locale.flagCode}.svg`))).toBe(true);
    }
  });

  it("ships a platform logo for every data source", async () => {
    const { existsSync } = await import("node:fs");
    const { join } = await import("node:path");
    const root = join(process.cwd(), "public", "logos");
    for (const source of DATA_SOURCES) {
      const png = join(root, `${source.id}.png`);
      const svg = join(root, `${source.id}.svg`);
      expect(existsSync(png) || existsSync(svg)).toBe(true);
    }
  });
});
