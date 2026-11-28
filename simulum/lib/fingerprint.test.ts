import { describe, expect, it } from "vitest";
import {
  MERGE_THRESHOLD,
  fingerprintOf,
  normalizeText,
  similarityScore,
  tokenize,
} from "@/lib/fingerprint";

describe("fingerprint", () => {
  it("normalizes noise and case", () => {
    expect(normalizeText("  Hello, WORLD!!  ")).toBe("hello world");
  });

  it("matches near-duplicate titles as mergeable", () => {
    const a = "Bostrom's trilemma: we are almost certainly simulated";
    const b = "Bostrom trilemma we are almost certainly living in a simulation";
    const score = similarityScore(
      a,
      "Nick Bostrom ancestor simulations argument",
      b,
      "Nick Bostrom ancestor simulation argument for simulated observers",
    );
    expect(score).toBeGreaterThanOrEqual(MERGE_THRESHOLD);
    expect(fingerprintOf(a, "x").length).toBeGreaterThan(3);
  });

  it("keeps unrelated claims distinct", () => {
    const score = similarityScore(
      "Maya: the world as illusion",
      "Indic traditions describe phenomenal reality as maya",
      "Beane lattice simulation bounds",
      "Lattice QCD cosmic ray cutoffs for discrete spacetime",
    );
    expect(score).toBeLessThan(MERGE_THRESHOLD);
  });

  it("tokenizes meaningfully", () => {
    const tokens = tokenize("The simulation hypothesis of the universe");
    expect(tokens).toContain("hypothesis");
    expect(tokens).not.toContain("the");
  });
});
