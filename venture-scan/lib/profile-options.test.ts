import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  BUSINESS_BUBBLES,
  DOMAIN_BUBBLES,
  MAJOR_BUBBLES,
  MARKET_BUBBLES,
  SKILL_BUBBLES,
} from "./profile-options";

describe("profile bubble options", () => {
  it("exposes icon-labeled bubbles for every match field", () => {
    for (const set of [
      SKILL_BUBBLES,
      MAJOR_BUBBLES,
      BUSINESS_BUBBLES,
      DOMAIN_BUBBLES,
      MARKET_BUBBLES,
    ]) {
      expect(set.length).toBeGreaterThanOrEqual(6);
      for (const bubble of set) {
        expect(bubble.id).toBeTruthy();
        expect(bubble.label).toBeTruthy();
        expect(bubble.icon).toBeTruthy();
      }
    }
  });

  it("wires bubbles, custom inputs, and a login gate on the Today matcher", () => {
    const chatbot = readFileSync(
      path.join(process.cwd(), "components/ProfileChatbot.tsx"),
      "utf8",
    );
    const field = readFileSync(
      path.join(process.cwd(), "components/ProfileBubbleField.tsx"),
      "utf8",
    );
    expect(chatbot).toContain("ProfileBubbleField");
    expect(chatbot).toContain("SKILL_BUBBLES");
    expect(chatbot).toContain("MAJOR_BUBBLES");
    expect(chatbot).toContain("BUSINESS_BUBBLES");
    expect(chatbot).toContain("DOMAIN_BUBBLES");
    expect(chatbot).toContain("MARKET_BUBBLES");
    expect(chatbot).toContain("match.loginTitle");
    expect(chatbot).toContain("authMe");
    expect(chatbot).toContain("requireLogin");
    expect(field).toContain("ProfileBubbleIcon");
    expect(field).toContain("onLockedAttempt");
    expect(field).toContain("locked");
  });
});
