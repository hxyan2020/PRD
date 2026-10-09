import { describe, expect, it } from "vitest";
import { SEED_IDEAS } from "./seed-ideas";
import { answerIdeaQuestion, detectIdeaIntent } from "./idea-qa";

const idea = SEED_IDEAS[0];

describe("idea Q&A", () => {
  it("detects common intents", () => {
    expect(detectIdeaIntent("Have they raised funding?")).toBe("funding");
    expect(detectIdeaIntent("Where is the team based?")).toBe("location");
    expect(detectIdeaIntent("What's the business model?")).toBe("model");
    expect(detectIdeaIntent("Where did this data come from?")).toBe("sources");
    expect(detectIdeaIntent("Hi")).toBe("off_track");
  });

  it("answers with citations that include official and wire sources", () => {
    const reply = answerIdeaQuestion(idea, "Have they raised funding?");
    expect(reply.intent).toBe("funding");
    expect(reply.answer.toLowerCase()).toMatch(/fund|series|raised|secur/);
    expect(reply.citations.length).toBeGreaterThanOrEqual(2);
    expect(reply.citations.some((c) => c.url === idea.website)).toBe(true);
    expect(reply.citations.some((c) => c.kind === "wire" || c.kind === "primary")).toBe(true);
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
});
