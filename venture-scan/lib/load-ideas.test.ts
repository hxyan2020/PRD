import { describe, expect, it } from "vitest";
import { SEED_IDEAS } from "./seed-ideas";
import { loadIdeasForPage } from "./load-ideas";

describe("loadIdeasForPage", () => {
  it("returns the full sourced catalog in static mode", () => {
    process.env.NEXT_PUBLIC_STATIC = "1";
    const { ideas, meta } = loadIdeasForPage();
    expect(ideas.length).toBe(SEED_IDEAS.length);
    expect(ideas.some((i) => i.slug === "bytedance-creator-os")).toBe(true);
    expect(meta.industries.length).toBeGreaterThan(5);
    expect(meta.countries.length).toBeGreaterThan(5);
    delete process.env.NEXT_PUBLIC_STATIC;
  });
});
