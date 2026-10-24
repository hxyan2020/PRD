import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { catalogActiveIdeas } from "./catalog";
import { ideaPhotoCount, photosForIdea } from "./idea-photos";

describe("idea photo albums", () => {
  it("ships 1–9 local photos for every active catalog idea", () => {
    const ideas = catalogActiveIdeas();
    expect(ideas.length).toBeGreaterThan(20);
    for (const idea of ideas) {
      const photos = photosForIdea(idea.slug, 9);
      expect(photos.length, idea.slug).toBeGreaterThanOrEqual(1);
      expect(photos.length, idea.slug).toBeLessThanOrEqual(9);
      expect(ideaPhotoCount(idea.slug)).toBe(photos.length);
      for (const photo of photos) {
        expect(photo.imagePath).toMatch(/^\/idea-photos\//);
        const abs = join(process.cwd(), "public", photo.imagePath.replace(/^\//, ""));
        expect(existsSync(abs), abs).toBe(true);
        expect(photo.sourceLabel.length).toBeGreaterThan(0);
        expect(photo.kind, idea.slug).not.toBe("wikipedia");
        expect((photo.sourceLabel || "").toLowerCase(), idea.slug).not.toContain("wikipedia");
        expect((photo.sourceUrl || "").toLowerCase(), idea.slug).not.toContain("wikipedia.org");
      }
    }
  });

  it("surfaces sourced photos on Ideas ledger rows", () => {
    const row = readFileSync(join(process.cwd(), "components/IdeaLedgerRow.tsx"), "utf8");
    const strip = readFileSync(join(process.cwd(), "components/IdeaLedgerPhotos.tsx"), "utf8");
    expect(row).toContain("IdeaLedgerPhotos");
    expect(strip).toContain("photosForIdea");
    expect(strip).toContain("idea-ledger-photos");
    expect(strip).toContain("ledger.photos");
  });
});
