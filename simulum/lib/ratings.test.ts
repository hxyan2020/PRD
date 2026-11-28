import { describe, expect, it } from "vitest";
import { rateEvidence } from "@/lib/ratings";

describe("rateEvidence", () => {
  it("backs every dimension with concrete evidence and stays low without anchors", () => {
    const now = new Date().toISOString();
    const weak = rateEvidence({
      sourceCount: 1,
      languages: ["en"],
      sources: [
        {
          publisher: "Wikipedia",
          url: "https://en.wikipedia.org/wiki/Simulation_hypothesis",
          language: "en",
        },
      ],
      categorySlugs: ["public-discourse"],
      lastSeenAt: now,
      firstSeenAt: now,
      hasArxiv: false,
      hasWikipedia: true,
      imageCount: 0,
    });

    expect(weak.multiSources.score).toBe(1);
    expect(weak.multiSources.evidence[0]).toContain("wikipedia.org");
    expect(weak.scientificallySupported.score).toBe(0);
    expect(weak.credibility.evidence).toContain("host:wikipedia.org");
    expect(weak.recency.score).toBe(5);
  });

  it("raises science and credibility when arXiv + experimental category are present", () => {
    const now = new Date().toISOString();
    const strong = rateEvidence({
      sourceCount: 3,
      languages: ["en", "zh"],
      sources: [
        {
          publisher: "arXiv",
          url: "https://arxiv.org/abs/1210.1847",
          language: "en",
        },
        {
          publisher: "Wikipedia",
          url: "https://en.wikipedia.org/wiki/Holographic_principle",
          language: "en",
        },
        {
          publisher: "Wikipedia",
          url: "https://zh.wikipedia.org/wiki/模拟宇宙",
          language: "zh",
        },
      ],
      categorySlugs: ["experimental-claims", "physics-cosmology"],
      lastSeenAt: now,
      firstSeenAt: now,
      hasArxiv: true,
      hasWikipedia: true,
      imageCount: 1,
    });

    expect(strong.multiSources.score).toBe(3);
    expect(strong.scientificallySupported.score).toBeGreaterThanOrEqual(3);
    expect(strong.scientificallySupported.evidence.some((e) => e.includes("arxiv.org"))).toBe(
      true,
    );
    expect(strong.crossReferenced.score).toBeGreaterThanOrEqual(2);
    expect(strong.multiWitness.score).toBeGreaterThanOrEqual(2);
    expect(strong.credibility.score).toBeGreaterThanOrEqual(3);
    expect(strong.overall).toBeGreaterThan(weakOverall());
  });
});

function weakOverall(): number {
  const now = new Date().toISOString();
  return rateEvidence({
    sourceCount: 1,
    languages: ["en"],
    sources: [
      {
        publisher: "Wikipedia",
        url: "https://en.wikipedia.org/wiki/Simulation_hypothesis",
        language: "en",
      },
    ],
    categorySlugs: ["public-discourse"],
    lastSeenAt: now,
    firstSeenAt: now,
    hasArxiv: false,
    hasWikipedia: true,
    imageCount: 0,
  }).overall;
}
