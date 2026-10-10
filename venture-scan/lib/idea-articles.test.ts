import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DATA_SOURCES } from "./data-sources";
import {
  articleCardsForIdea,
  articleCitationsForIdea,
  ideaArticleManifestSize,
} from "./idea-articles";
import { FEATURED_SEED_IDEAS } from "./seed-ideas";

describe("idea articles", () => {
  it("ships at least one specific article with a local image for every featured seed idea", () => {
    expect(ideaArticleManifestSize()).toBeGreaterThanOrEqual(FEATURED_SEED_IDEAS.length);

    for (const idea of FEATURED_SEED_IDEAS) {
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
    const idea = FEATURED_SEED_IDEAS[0];
    const citations = articleCitationsForIdea(idea.slug, 3);
    expect(citations.length).toBeGreaterThan(0);
    for (const c of citations) {
      expect(c.kind).toBe("wire");
      expect(c.url).toMatch(/^https?:\/\//);
    }
  });

  it("keeps reef / blue-economy articles on-topic (no Erco Colombia solar mismatch)", () => {
    const cards = articleCardsForIdea("reef-credit-exchange", 6);
    expect(cards.length).toBeGreaterThan(0);
    for (const card of cards) {
      const blob = `${card.title} ${card.excerpt}`.toLowerCase();
      expect(blob.includes("erco")).toBe(false);
      expect(blob.includes("colombia")).toBe(false);
      expect(
        /ocean|reef|coral|seagrass|marine|biodiversity|carbon|blue/.test(blob),
        card.title,
      ).toBe(true);
    }
  });

  it("keeps sample idea articles aligned with their sectors", () => {
    const expectations: Record<string, RegExp> = {
      "nightshift-nursing-ai": /hospital|clinician|doctor|health|nurs|medical|ambient|scribe/i,
      "farmstack-coldchain": /cold|refrigerat|perishable|spoilage|solar cooling/i,
      "bushfire-mesh-sensors": /wildfire|bushfire|fire/i,
      "iron-dome-devsecops": /security|cyber|devops|supply chain|cloud/i,
    };
    for (const [slug, re] of Object.entries(expectations)) {
      const cards = articleCardsForIdea(slug, 6);
      expect(cards.length, slug).toBeGreaterThan(0);
      for (const card of cards) {
        expect(`${card.title} ${card.excerpt}`, `${slug}: ${card.title}`).toMatch(re);
      }
    }
  });
});
