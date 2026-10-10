import { describe, expect, it } from "vitest";
import { assessAnswer, redirectMessageKey } from "./chat-guardrails";
import { translate } from "./i18n/messages";

describe("assessAnswer", () => {
  it("rejects greetings on the name step so Hi is not stored as a name", () => {
    expect(assessAnswer("name", "Hi").ok).toBe(false);
    expect(assessAnswer("name", "hello!").ok).toBe(false);
    expect(assessAnswer("name", "你好").ok).toBe(false);
  });

  it("accepts real names and name introductions", () => {
    expect(assessAnswer("name", "Alex")).toEqual({ ok: true });
    expect(assessAnswer("name", "I'm Maya").ok).toBe(true);
    expect(assessAnswer("name", "My name is Jordan Lee").ok).toBe(true);
  });

  it("keeps skills on track against chitchat and questions", () => {
    expect(assessAnswer("skills", "lol").ok).toBe(false);
    expect(assessAnswer("skills", "what can you do?").ok).toBe(false);
    expect(assessAnswer("skills", "product, sales, Python").ok).toBe(true);
    expect(assessAnswer("skills", "skip").ok).toBe(false);
  });

  it("allows skip only on markets", () => {
    expect(assessAnswer("markets", "skip").ok).toBe(true);
    expect(assessAnswer("markets", "Singapore, UAE")).toEqual({ ok: true });
    expect(assessAnswer("major", "skip").ok).toBe(false);
  });

  it("rejects thin meta replies and accepts substantive ones", () => {
    expect(assessAnswer("major", "ok").ok).toBe(false);
    expect(assessAnswer("business", "exploring climate startups").ok).toBe(true);
    expect(assessAnswer("domains", "health tech, climate").ok).toBe(true);
  });
});

describe("redirect replies", () => {
  it("uses a self-contained redirect so the step prompt is not repeated", () => {
    const assessment = assessAnswer("name", "hi");
    expect(assessment.ok).toBe(false);
    if (assessment.ok) return;
    const key = redirectMessageKey("name", assessment.kind);
    const redirect = translate("zh-CN", key);
    const prompt = translate("zh-CN", "match.step.name");
    expect(redirect).toBeTruthy();
    expect(redirect).not.toContain(prompt);
    // Redirect already re-asks; concatenating prompt would duplicate the ask.
    expect(`${redirect}\n\n${prompt}`).toContain(prompt);
    expect(redirect.split("怎么称呼你").length).toBeLessThanOrEqual(2);
  });
});
