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

  it("uses English claim text for Chinese UI when no zh pack exists", () => {
    const ev = sample({
      language: "en",
      title: "Ancestor simulations imply we are simulated",
      caption: "Ancestor simulations imply we are simulated",
      slug: "ancestor-simulations-reality-analogy",
      translations: {
        en: {
          caption:
            "If civilizations run many ancestor simulations, odds favor us being in one",
          body: {
            what: "A probability argument about ancestor simulations.",
            where: "Sourced from Wikipedia.",
            when: "Indexed from the source publication.",
            how: "Argued through theory.",
            why: "Posted as simulation evidence.",
          },
        },
      },
    });
    const zh = presentEvidence(ev, "zh");
    expect(zh.caption).toMatch(/ancestor simulations/i);
    expect(zh.caption).not.toMatch(/模拟主张/);
    expect(zh.caption).not.toMatch(/eality|nalogy|-minds/i);
    expect(zh.body.what).toMatch(/本目录|选择的语言/);
  });

  it("localizes generic Wikipedia English packs into Chinese", () => {
    const ev = sample({
      language: "it",
      title: "Theia (pianeta ipotetico)",
      caption: "Theia (pianeta ipotetico): frammenti",
      slug: "theia-pianeta-ipotetico",
      translations: {
        en: {
          caption: "Simulation-hypothesis claim via Wikipedia (Theia (pianeta ipotetico))",
          body: {
            what: "Simulation-hypothesis claim via Wikipedia.",
            where: "Sourced from Wikipedia.",
            when: "Indexed from the source publication.",
            how: "Argued through theory.",
            why: "Posted as simulation evidence.",
          },
        },
        it: {
          caption: "Theia (pianeta ipotetico): frammenti",
          body: {
            what: "Frammenti di Theia.",
            where: "Da Wikipedia.",
            when: "Indicizzato dalla fonte.",
            how: "Tramite teoria.",
            why: "Pubblicato come prova.",
          },
        },
      },
    });
    const zh = presentEvidence(ev, "zh");
    expect(zh.caption).toMatch(/维基百科.*模拟假说/);
    expect(zh.caption).toMatch(/Theia \(pianeta ipotetico\)/);
    expect(zh.caption).not.toMatch(/^Simulation-hypothesis/i);
    expect(zh.caption).not.toMatch(/模拟主张\s*·/);
    expect(zh.caption).not.toMatch(/^Wikipedia/);
  });

  it("rejects stored slug-tail Chinese captions", () => {
    const ev = sample({
      language: "en",
      title: "Chalmers Reality+",
      caption: "Chalmers argues virtual realities can be genuine realities",
      slug: "chalmers-reality",
      translations: {
        en: {
          caption: "Chalmers argues virtual realities can be genuine realities",
          body: {
            what: "A claim about virtual realities.",
            where: "Sourced from Wikipedia.",
            when: "Indexed from the source publication.",
            how: "Argued through theory.",
            why: "Posted as simulation evidence.",
          },
        },
        zh: {
          caption: "模拟主张 · eality",
          body: {
            what: "「模拟主张 · eality」。本目录仅以您选择的语言呈现摘要。",
            where: "来源：Wikipedia。",
            when: "时间依据来源发布与目录首次/最近收录时间戳。",
            how: "「模拟主张 · eality」通过理论提出。",
            why: "收录「模拟主张 · eality」是因其被当作证据。",
          },
        },
      },
    });
    const zh = presentEvidence(ev, "zh");
    expect(zh.caption).not.toMatch(/eality/);
    expect(zh.caption).not.toMatch(/模拟主张\s*·/);
    expect(zh.caption).toMatch(/Chalmers|virtual realities/i);
  });

  it("prefers a same-locale source title for Chinese UI", () => {
    const ev = sample({
      language: "en",
      title: "Simulation universe",
      caption: "Simulation universe English claim",
      sources: [
        {
          id: "s1",
          evidenceId: "e1",
          url: "https://zh.wikipedia.org/wiki/%E6%A8%A1%E6%8B%9F%E5%AE%87%E5%AE%99",
          title: "模拟宇宙 — 维基百科",
          snippet: "模拟宇宙假设",
          language: "zh",
          publisher: "Wikipedia",
          imageUrl: "",
          fetchedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      translations: {
        en: {
          caption: "If civilizations run ancestor simulations we are probably in one",
          body: {
            what: "A probability argument.",
            where: "Sourced from Wikipedia.",
            when: "Indexed from the source publication.",
            how: "Argued through theory.",
            why: "Posted as simulation evidence.",
          },
        },
      },
    });
    const zh = presentEvidence(ev, "zh");
    expect(zh.caption).toMatch(/模拟宇宙/);
    expect(zh.caption).not.toMatch(/Simulation universe/i);
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
