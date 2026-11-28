import { describe, expect, it } from "vitest";
import { findRelatedEvidence } from "@/lib/related";
import type { Evidence } from "@/lib/types";

function stub(partial: Partial<Evidence> & Pick<Evidence, "id" | "slug" | "title">): Evidence {
  return {
    caption: partial.caption || partial.title,
    summary: partial.summary || partial.title,
    detail: "",
    body: {
      what: partial.summary || partial.title,
      where: "",
      when: "",
      how: "",
      why: "",
    },
    images: [],
    ratings: {
      overall: 1,
      credibility: { score: 1, max: 5, label: "c", rationale: "", evidence: [] },
      recency: { score: 1, max: 5, label: "r", rationale: "", evidence: [] },
      multiSources: { score: 1, max: 5, label: "m", rationale: "", evidence: [] },
      crossReferenced: { score: 1, max: 5, label: "x", rationale: "", evidence: [] },
      multiWitness: { score: 1, max: 5, label: "w", rationale: "", evidence: [] },
      scientificallySupported: { score: 1, max: 5, label: "s", rationale: "", evidence: [] },
    },
    translations: {},
    fingerprint: partial.slug,
    language: "en",
    languages: ["en"],
    sourceCount: 1,
    firstSeenAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
    status: "published",
    categories: partial.categories || [
      {
        id: "cat-philosophy",
        slug: "philosophy-metaphysics",
        name: "Philosophy",
        description: "",
        sortOrder: 1,
      },
    ],
    sources: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...partial,
  };
}

describe("related evidence", () => {
  it("scores same-category and similar content", () => {
    const current = stub({
      id: "1",
      slug: "bostrom",
      title: "Bostrom simulation argument",
      summary: "Ancestor simulations make simulated observers likely",
    });
    const catalogue = [
      current,
      stub({
        id: "2",
        slug: "musk",
        title: "Musk one in billions simulation claim",
        summary: "Public claim we almost certainly live in a simulation",
      }),
      stub({
        id: "3",
        slug: "lattice",
        title: "Lattice cosmic ray cutoff",
        summary: "Discrete spacetime cosmic ray anisotropy",
        categories: [
          {
            id: "cat-experimental",
            slug: "experimental-claims",
            name: "Experimental",
            description: "",
            sortOrder: 2,
          },
        ],
      }),
    ];
    const related = findRelatedEvidence(current, catalogue, 5);
    expect(related.some((r) => r.evidence.slug === "musk")).toBe(true);
    expect(related.every((r) => typeof r.similarity === "number")).toBe(true);
  });
});
