import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DATA_SOURCES } from "./data-sources";
import {
  articleCardsForIdea,
  articleCitationsForIdea,
  ideaArticleManifestSize,
} from "./idea-articles";
import { SEED_IDEAS } from "./seed-ideas";

describe("idea articles", () => {
  it("ships at least one specific article with a local image for every seed idea", () => {
    expect(ideaArticleManifestSize()).toBeGreaterThanOrEqual(SEED_IDEAS.length);

    for (const idea of SEED_IDEAS) {
      const cards = articleCardsForIdea(idea.slug, 6);
      expect(cards.length, idea.slug).toBeGreaterThan(0);
      for (const card of cards) {
        expect(card.url).toMatch(/^https?:\/\//);
        // Must be a deep article link, not a bare desk homepage.
        const hostPath = new URL(card.url).pathname.replace(/\/+$/, "");
        expect(hostPath.length, card.url).toBeGreaterThan(1);
        expect(card.imagePath).toMatch(/^\/idea-articles\//);
        const abs = join(process.cwd(), "public", card.imagePath.replace(/^\//, ""));
        expect(existsSync(abs), abs).toBe(true);
        expect(DATA_SOURCES.some((s) => s.id === card.sourceId), card.sourceId).toBe(true);
      }
    }
  });

  it("exposes article citations with article URLs for Q&A", () => {
    const idea = SEED_IDEAS[0];
    const citations = articleCitationsForIdea(idea.slug, 3);
    expect(citations.length).toBeGreaterThan(0);
    for (const c of citations) {
      expect(c.kind).toBe("wire");
      expect(c.url).toMatch(/^https?:\/\//);
    }
  });
});
