import { describe, expect, it } from "vitest";
import { catalogIdeas } from "../catalog";
import { FEATURED_SEED_IDEAS } from "../seed-ideas";
import { LOCALES } from "./locales";
import { ideaPackCoverage, localizeIdea, localizeIdeaFieldLabel } from "./localize-idea";

describe("localizeIdea", () => {
  it("keeps English ideas unchanged for en", () => {
    const idea = FEATURED_SEED_IDEAS[0];
    expect(localizeIdea(idea, "en")).toBe(idea);
  });

  it("translates zh-CN idea copy for every featured seed idea", () => {
    for (const idea of FEATURED_SEED_IDEAS) {
      const view = localizeIdea(idea, "zh-CN");
      expect(view.description).not.toBe(idea.description);
      expect(view.description.length).toBeGreaterThan(10);
      expect(view.goForward.summary).not.toBe(idea.goForward.summary);
      expect(view.industry).not.toBe(idea.industry);
      // slug/id stay canonical
      expect(view.slug).toBe(idea.slug);
      expect(view.id).toBe(idea.id);
    }
  });

  it("covers all locales with translated descriptions for featured ideas", () => {
    const featuredSlugs = FEATURED_SEED_IDEAS.map((i) => i.slug);
    for (const locale of LOCALES) {
      if (locale.code === "en") continue;
      const { total, translated } = ideaPackCoverage(locale.code, featuredSlugs);
      expect(total).toBe(FEATURED_SEED_IDEAS.length);
      expect(translated).toBe(FEATURED_SEED_IDEAS.length);
    }
  });

  it("localizes expanded catalog ideas in zh-CN", () => {
    const idea = catalogIdeas().find((i) => i.slug === "dlocal-crossborder");
    expect(idea).toBeTruthy();
    const view = localizeIdea(idea!, "zh-CN");
    expect(view.name).toBe("新兴市场收款");
    expect(view.description).toContain("跨境支付");
    expect(view.industry).toBe("金融科技");
  });

  it("localizes industry filter labels while preserving English option values", () => {
    const label = localizeIdeaFieldLabel("industry", "Climate Tech", "zh-CN");
    expect(label).not.toBe("Climate Tech");
    expect(label.length).toBeGreaterThan(0);
  });
});
