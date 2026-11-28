import { describe, expect, it } from "vitest";
import { LOCALES } from "@/lib/i18n/locales";
import {
  assertAllLocalesHaveKeys,
  findUntranslatedKeys,
  t,
} from "@/lib/i18n/messages";
import { presentEvidence } from "@/lib/i18n/present";
import type { Evidence, LocaleCode } from "@/lib/types";

describe("i18n messages", () => {
  it("covers every locale key", () => {
    expect(assertAllLocalesHaveKeys()).toEqual([]);
  });

  it("has no English leftovers outside en", () => {
    expect(findUntranslatedKeys()).toEqual({});
  });

  it("returns localized jump CTA for major languages", () => {
    expect(t("en", "hero.jump")).toContain("catalogue");
    expect(t("zh", "hero.jump")).toContain("目录");
    expect(t("fr", "hero.jump").length).toBeGreaterThan(3);
    expect(LOCALES.length).toBeGreaterThanOrEqual(20);
  });

  it("uses Are We Simulated? as the English brand name", () => {
    expect(t("en", "brand.name")).toBe("Are We Simulated?");
    expect(t("zh", "brand.name")).not.toBe(t("en", "brand.name"));
    expect(t("zh", "brand.name").length).toBeGreaterThan(3);
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

describe("cross-locale evidence presentation", () => {
  function japaneseSource(): Evidence {
    const now = new Date().toISOString();
    return {
      id: "1",
      slug: "ja-sim",
      title: "シミュレーション仮説",
      caption: "日本語のキャプション",
      summary: "日本語の要約",
      detail: "",
      body: {
        what: "日本語 what",
        where: "日本語 where",
        when: "日本語 when",
        how: "日本語 how",
        why: "日本語 why",
      },
      images: [],
      ratings: {
        overall: 1,
        credibility: { score: 1, max: 5, label: "", rationale: "", evidence: [] },
        recency: { score: 1, max: 5, label: "", rationale: "", evidence: [] },
        multiSources: { score: 1, max: 5, label: "", rationale: "", evidence: [] },
        crossReferenced: {
          score: 1,
          max: 5,
          label: "",
          rationale: "",
          evidence: [],
        },
        multiWitness: { score: 1, max: 5, label: "", rationale: "", evidence: [] },
        scientificallySupported: {
          score: 0,
          max: 5,
          label: "",
          rationale: "",
          evidence: [],
        },
      },
      translations: {
        ja: {
          caption: "日本語のキャプション",
          body: {
            what: "日本語 what",
            where: "日本語 where",
            when: "日本語 when",
            how: "日本語 how",
            why: "日本語 why",
          },
        },
        en: {
          caption: "English pack caption",
          body: {
            what: "English what",
            where: "English where",
            when: "English when",
            how: "English how",
            why: "English why",
          },
        },
      },
      fingerprint: "fp",
      language: "ja",
      languages: ["ja"],
      sourceCount: 1,
      firstSeenAt: now,
      lastSeenAt: now,
      status: "published",
      categories: [],
      sources: [
        {
          id: "s",
          evidenceId: "1",
          url: "https://ja.wikipedia.org/wiki/x",
          title: "シミュレーション仮説",
          snippet: "日本語",
          language: "ja",
          publisher: "Wikipedia",
          imageUrl: "",
          fetchedAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };
  }

  it("presents every UI locale without leaking Japanese source text", () => {
    const evidence = japaneseSource();
    for (const loc of LOCALES) {
      const view = presentEvidence(evidence, loc.code as LocaleCode);
      expect(view.available).toBe(true);
      expect(view.caption.length).toBeGreaterThan(4);
      if (loc.code !== "ja") {
        expect(view.caption).not.toMatch(/シミュレーション|日本語のキャプション/);
        expect(view.body.what).not.toMatch(/日本語 what/);
      } else {
        expect(view.caption).toContain("日本語");
      }
    }
  });
});
