import { describe, expect, it } from "vitest";
import { buildBody, buildCaption } from "@/lib/summarize";
import type { EvidenceCandidate } from "@/lib/types";

const candidate: EvidenceCandidate = {
  title: "Simulation hypothesis — Wikipedia",
  summary:
    "The simulation hypothesis proposes that all of reality, including the Earth and the universe, could be an artificial simulation.",
  categorySlugs: ["philosophy-metaphysics"],
  source: {
    url: "https://en.wikipedia.org/wiki/Simulation_hypothesis",
    publisher: "Wikipedia",
    language: "en",
  },
};

describe("summarize", () => {
  it("builds an informative caption instead of raw wiki title", () => {
    const caption = buildCaption(candidate);
    expect(caption.toLowerCase()).not.toBe("simulation hypothesis — wikipedia");
    expect(caption.length).toBeGreaterThan(40);
    expect(caption.toLowerCase()).toContain("simulation");
  });

  it("fills what/where/when/how/why", () => {
    const body = buildBody(candidate);
    expect(body.what.length).toBeGreaterThan(20);
    expect(body.where.toLowerCase()).toContain("wikipedia");
    expect(body.when.length).toBeGreaterThan(10);
    expect(body.how.length).toBeGreaterThan(10);
    expect(body.why.toLowerCase()).toContain("simulation");
  });
});
