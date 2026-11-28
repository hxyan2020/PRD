import { describe, expect, it } from "vitest";
import { buildBody, buildCaption, englishFacingPack } from "@/lib/summarize";
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
    expect(caption).not.toMatch(/Documented claim/i);
  });

  it("fills what/where/when/how/why", () => {
    const body = buildBody(candidate);
    expect(body.what.length).toBeGreaterThan(20);
    expect(body.where.toLowerCase()).toContain("wikipedia");
    expect(body.when.length).toBeGreaterThan(10);
    expect(body.how.length).toBeGreaterThan(10);
    expect(body.why.toLowerCase()).toContain("simulation");
  });

  it("builds unique English-facing packs without shared boilerplate", () => {
    const es: EvidenceCandidate = {
      title: "Simulación: el universo como programa",
      summary:
        "En español, la hipótesis de simulación sostiene que la realidad observable podría ser un programa computacional.",
      language: "es",
      categorySlugs: ["philosophy-metaphysics"],
      source: {
        url: "https://es.wikipedia.org/wiki/Hip%C3%B3tesis_de_simulaci%C3%B3n",
        publisher: "Wikipedia",
        language: "es",
      },
    };
    const pack = englishFacingPack(es);
    expect(pack.caption).toMatch(/Simulation-hypothesis claim via Wikipedia/i);
    expect(pack.caption).not.toMatch(/Simulación|universo como programa/i);
    expect(pack.caption).not.toMatch(/Documented claim/i);
    expect(pack.caption).not.toMatch(/originally discussed/i);
    expect(pack.body.what).not.toMatch(/En español|hipótesis de simulación sostiene/i);
    expect(pack.body.what).not.toMatch(/^A publicly discussed claim connected/i);
    expect(pack.body.what.length).toBeGreaterThan(20);
    expect(pack.body.how).not.toMatch(/En español/i);
  });

  it("strips language labels from mixed copy", async () => {
    const { stripLanguageLabel } = await import("@/lib/summarize");
    expect(stripLanguageLabel("Japanese intro: ancestor simulations")).toBe(
      "Ancestor simulations",
    );
    expect(stripLanguageLabel("German discourse links Bostrom to the Matrix")).toBe(
      "Links Bostrom to the Matrix",
    );
    expect(stripLanguageLabel("Russian retelling of Bostrom")).toBe(
      "Of Bostrom",
    );
    expect(stripLanguageLabel("French-language discussion of Bostrom")).toMatch(
      /the discussion of Bostrom/i,
    );
    expect(stripLanguageLabel("Sourced from Wikipedia (zh).")).toBe(
      "Sourced from Wikipedia.",
    );
  });
});
