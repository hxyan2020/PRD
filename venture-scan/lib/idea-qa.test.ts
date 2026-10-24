import { describe, expect, it } from "vitest";
import { SEED_IDEAS } from "./seed-ideas";
import { answerIdeaQuestion, detectIdeaIntent } from "./idea-qa";
import { translate } from "./i18n/messages";
import { localizeIdea } from "./i18n/localize-idea";

const idea = SEED_IDEAS[0];

describe("idea Q&A", () => {
  it("detects common intents", () => {
    expect(detectIdeaIntent("Have they raised funding?")).toBe("funding");
    expect(detectIdeaIntent("Where is the team based?")).toBe("location");
    expect(detectIdeaIntent("What's the business model?")).toBe("model");
    expect(detectIdeaIntent("Where did this data come from?")).toBe("sources");
    expect(detectIdeaIntent("Hi")).toBe("off_track");
    expect(detectIdeaIntent("他们融资了吗？")).toBe("funding");
    expect(detectIdeaIntent("如何推进这个机会？")).toBe("go_forward");
  });

  it("answers with citations that include official and article wire links", () => {
    const reply = answerIdeaQuestion(idea, "Have they raised funding?");
    expect(reply.intent).toBe("funding");
    expect(reply.answer.toLowerCase()).toMatch(/fund|series|raised|secur/);
    expect(reply.citations.length).toBeGreaterThanOrEqual(2);
    expect(reply.citations.some((c) => c.url === idea.website)).toBe(true);
    const wires = reply.citations.filter((c) => c.kind === "wire");
    expect(wires.length).toBeGreaterThan(0);
    for (const c of wires) {
      // Prefer deep article URLs over bare desk homepages.
      const path = new URL(c.url).pathname.replace(/\/+$/, "");
      expect(path.length).toBeGreaterThan(1);
    }
    for (const c of reply.citations) {
      expect(c.label).toBeTruthy();
      expect(c.url).toBeTruthy();
    }
  });

  it("surfaces go-forward guidance with sources", () => {
    const reply = answerIdeaQuestion(idea, "How could I go forward with this?");
    expect(reply.intent).toBe("go_forward");
    expect(reply.answer).toContain(idea.goForward.summary.slice(0, 24));
    expect(reply.citations.some((c) => /VentureScan ingest/i.test(c.label))).toBe(true);
  });

  it("answers in the selected locale", () => {
    const view = localizeIdea(idea, "zh-CN");
    const t = (key: Parameters<typeof translate>[1], vars?: Record<string, string | number>) =>
      translate("zh-CN", key, vars);
    const reply = answerIdeaQuestion(view, t("ideaChat.suggest.goForward"), t);
    expect(reply.intent).toBe("go_forward");
    expect(reply.answer).toContain("建议前进路径");
    expect(reply.answer).not.toMatch(/Suggested go-forward play/);
    expect(reply.citations.some((c) => c.detail === "官方网站")).toBe(true);
    expect(reply.citations.some((c) => /VentureScan 采集/.test(c.label))).toBe(true);
  });
});
