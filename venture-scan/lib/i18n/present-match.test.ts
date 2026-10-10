import { describe, expect, it } from "vitest";
import { catalogIdeas } from "../catalog";
import { scoreIdeaAgainstProfile } from "../match";
import type { UserProfile } from "../types";
import { translate, type MessageKey } from "./messages";
import { presentMatch } from "./present-match";
import { localizeIdea } from "./localize-idea";

const profile: UserProfile = {
  id: "test",
  displayName: "Tester",
  skills: ["产品", "AI", "风控"],
  major: "金融、风控、会计、商业管理",
  currentBusiness: "AI读书笔记",
  interestedDomains: ["电商", "教育", "活动"],
  preferredMarkets: ["China", "Southeast Asia"],
  notes: "",
  updatedAt: new Date().toISOString(),
};

describe("presentMatch", () => {
  it("rebuilds zh-CN dimension labels and explanation sentences", () => {
    const idea = catalogIdeas().find((i) => i.slug === "dlocal-crossborder");
    expect(idea).toBeTruthy();
    const match = scoreIdeaAgainstProfile(idea!, profile);
    const view = localizeIdea(idea!, "zh-CN");
    const t = (key: MessageKey, vars?: Record<string, string | number>) =>
      translate("zh-CN", key, vars);
    const presented = presentMatch(match, view, profile, t, "zh-CN");

    const all = [...presented.matched, ...presented.gaps];
    expect(all.length).toBe(5);
    for (const point of all) {
      expect(point.dimension).toMatch(/技能|专业 \/ 背景|当前业务|兴趣领域|目标市场/);
      expect(point.detail).not.toMatch(
        /Your skills|Your current work|Your background|Your interests|Your preferred markets|align with how|does not yet map/i,
      );
    }
    for (const gap of presented.gaps) {
      expect(gap.closeGap).not.toMatch(/^Ship a 1-week|^Spend 3 hours|^Draft a local/i);
      expect(gap.closeGap.length).toBeGreaterThan(8);
    }

    const joined = all.map((p) => p.detail).join("\n");
    expect(joined).toMatch(/新兴市场收款|金融科技|跨境支付|AI读书笔记/);
    expect(t("today.scoreMatch", { score: match.score })).toBe(`${match.score}% 匹配`);
  });
});
