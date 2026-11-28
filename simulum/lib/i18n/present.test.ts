import { describe, expect, it } from "vitest";
import {
  isBoilerplateWhat,
  presentEvidence,
  scrubBoilerplateCaption,
} from "@/lib/i18n/present";
import type { Evidence } from "@/lib/types";

function sample(overrides: Partial<Evidence> = {}): Evidence {
  const now = new Date().toISOString();
  return {
    id: "1",
    slug: "ja-simulation",
    title: "シミュレーション仮説",
    caption: "シミュレーション仮説についての日本語の要約。",
    summary: "宇宙がシミュレーションであるという日本語の主張。",
    detail: "",
    body: {
      what: "日本語の本文 what",
      where: "日本語の本文 where",
      when: "日本語の本文 when",
      how: "日本語の本文 how",
      why: "日本語の本文 why",
    },
    images: [],
    ratings: {
      overall: 1,
      credibility: { score: 1, max: 5, label: "c", rationale: "", evidence: [] },
      recency: { score: 1, max: 5, label: "r", rationale: "", evidence: [] },
      multiSources: { score: 1, max: 5, label: "m", rationale: "", evidence: [] },
      crossReferenced: { score: 1, max: 5, label: "x", rationale: "", evidence: [] },
      multiWitness: { score: 1, max: 5, label: "w", rationale: "", evidence: [] },
      scientificallySupported: {
        score: 0,
        max: 5,
        label: "s",
        rationale: "",
        evidence: [],
      },
    },
    translations: {
      ja: {
        caption: "シミュレーション仮説についての日本語の要約。",
        body: {
          what: "日本語の本文 what",
          where: "日本語の本文 where",
          when: "日本語の本文 when",
          how: "日本語の本文 how",
          why: "日本語の本文 why",
        },
      },
      en: {
        caption:
          "Documented claim about simulated reality: シミュレーション仮説 (originally discussed in ja).",
        body: {
          what: "A publicly discussed claim connected to the simulation hypothesis, originally written in ja: シミュレーション仮説.",
          where: "Sourced from Wikipedia (ja).",
          when: "Indexed from the source publication.",
          how: "The source argues through theory or narrative.",
          why: "People posted it as evidence of a simulated universe.",
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
        id: "s1",
        evidenceId: "1",
        url: "https://ja.wikipedia.org/wiki/x",
        title: "シミュレーション仮説",
        snippet: "日本語スニペット",
        language: "ja",
        publisher: "Wikipedia",
        imageUrl: "",
        fetchedAt: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("presentEvidence", () => {
  it("shows Japanese text only when the UI locale is Japanese", () => {
    const ja = presentEvidence(sample(), "ja");
    expect(ja.available).toBe(true);
    expect(ja.caption).toContain("シミュレーション");
    expect(ja.presentation).toBe("stored");
  });

  it("scrubs English boilerplate and does not leak Japanese into English UI", () => {
    const en = presentEvidence(sample(), "en");
    expect(en.available).toBe(true);
    expect(en.caption).not.toMatch(/Documented claim about simulated reality/i);
    expect(en.caption).not.toMatch(/originally discussed in/i);
    expect(en.caption).not.toMatch(/シミュレーション|日本語/);
    expect(en.body.what).not.toMatch(/^A publicly discussed claim connected/i);
    expect(en.body.what).not.toMatch(/シミュレーション|日本語/);
    expect(en.body.where).not.toMatch(/\(ja\)/);
    expect(en.presentation).toBe("stored");
  });

  it("synthesizes French-only copy for French viewers of a Japanese source", () => {
    const fr = presentEvidence(sample(), "fr");
    expect(fr.available).toBe(true);
    expect(fr.presentation).toBe("synthesized");
    expect(fr.caption).not.toMatch(/シミュレーション/);
    expect(fr.caption).not.toMatch(/Documented claim/i);
    expect(fr.body.what).toMatch(/langue sélectionnée/i);
    expect(fr.body.what).not.toMatch(/シミュレーション|日本語の本文/);
  });

  it("never leaves a locale without presentable text", () => {
    const bare = sample({ translations: {} });
    for (const locale of ["zh", "ar", "hi", "uk"] as const) {
      const view = presentEvidence(bare, locale);
      expect(view.available).toBe(true);
      expect(view.caption.length).toBeGreaterThan(4);
      expect(view.caption).not.toMatch(/シミュレーション仮説/);
      expect(view.caption).not.toMatch(/Documented claim/i);
    }
  });
});

describe("boilerplate scrubbers", () => {
  it("removes legacy caption prefixes", () => {
    expect(
      scrubBoilerplateCaption(
        "Documented claim about simulated reality: Hypothèse de la simulation (originally discussed in fr).",
        "Hypothèse de la simulation",
      ),
    ).toBe("Hypothèse de la simulation");
  });

  it("detects legacy what blurbs", () => {
    expect(
      isBoilerplateWhat(
        "A publicly discussed claim connected to the simulation hypothesis, originally written in es: Simulación.",
      ),
    ).toBe(true);
  });
});
