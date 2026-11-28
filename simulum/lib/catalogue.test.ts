import { describe, expect, it } from "vitest";
import { ingestCandidate, ingestCandidates } from "@/lib/catalogue";
import { countUniqueEvidence, listEvidence, listCategories } from "@/lib/db";
import type { EvidenceCandidate } from "@/lib/types";

const base: EvidenceCandidate = {
  title: "Unique lattice discreteness cosmic-ray cutoff claim",
  summary:
    "A lab-facing claim that discrete spacetime lattices leave anisotropic cosmic-ray signatures.",
  language: "en",
  categorySlugs: ["experimental-claims", "physics-cosmology"],
  source: {
    url: "https://en.wikipedia.org/wiki/Cosmic_ray",
    title: "Cosmic ray",
    publisher: "Wikipedia",
    language: "en",
  },
};

describe("catalogue ingest", () => {
  it("inserts new evidence and merges near-duplicates", async () => {
    const first = await ingestCandidate(base);
    expect(first.action).toBe("inserted");

    const dup: EvidenceCandidate = {
      ...base,
      title: "Unique lattice discreteness cosmic ray cutoff claim",
      summary:
        "Lab-facing claim that discrete spacetime lattice leaves anisotropic cosmic ray signatures.",
      source: {
        url: "https://en.wikipedia.org/wiki/Ultra-high-energy_cosmic_ray",
        title: "UHECR",
        publisher: "Wikipedia",
        language: "en",
      },
      categorySlugs: ["experimental-claims", "mathematical-structure"],
    };

    const second = await ingestCandidate(dup);
    expect(second.action).toBe("merged");

    const items = await listEvidence({ limit: 200 });
    const hit = items.find((e) => e.slug.includes("lattice") || e.title.includes("lattice"));
    expect(hit).toBeTruthy();
    expect(hit!.sourceCount).toBeGreaterThanOrEqual(2);
    expect(hit!.categories.map((c) => c.slug)).toEqual(
      expect.arrayContaining([
        "experimental-claims",
        "physics-cosmology",
        "mathematical-structure",
      ]),
    );
  });

  it("seeds unique count and multi-category catalogue", async () => {
    await ingestCandidates(
      [
        {
          title: "Seed A holographic bound surface area",
          summary: "Information scales with boundary area not volume.",
          categorySlugs: ["physics-cosmology", "computation-information"],
          source: {
            url: "https://en.wikipedia.org/wiki/Holographic_principle",
            publisher: "Wikipedia",
          },
        },
        {
          title: "Seed B holographic principle surface information",
          summary: "Universe information content scales with surface area like a hologram.",
          categorySlugs: ["mathematical-structure"],
          source: {
            url: "https://en.wikipedia.org/wiki/Black_hole_thermodynamics",
            publisher: "Wikipedia",
          },
        },
      ],
      "test-seed",
    );

    const total = await countUniqueEvidence();
    expect(total).toBeGreaterThan(0);
    const cats = await listCategories();
    expect(cats.length).toBeGreaterThanOrEqual(10);
  });
});
