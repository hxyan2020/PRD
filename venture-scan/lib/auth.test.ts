import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  hashPassword,
  parseSessionToken,
  signSessionToken,
  validateCredentials,
  verifyPassword,
} from "./auth";
import {
  getCollectionItem,
  listCollection,
  removeCollectionItem,
  upsertCollectionItem,
} from "./collections";
import { resetDbForTests } from "./db";
import { SEED_IDEAS } from "./seed-ideas";
import { scoreIdeaAgainstProfile } from "./match";
import { createUser, findUserByEmail } from "./users";

describe("auth helpers", () => {
  it("hashes and verifies passwords", () => {
    const stored = hashPassword("correct-horse");
    expect(verifyPassword("correct-horse", stored)).toBe(true);
    expect(verifyPassword("wrong-password", stored)).toBe(false);
  });

  it("signs and parses session tokens", () => {
    const token = signSessionToken("session-123");
    expect(parseSessionToken(token)).toBe("session-123");
    expect(parseSessionToken("session-123.deadbeef")).toBeNull();
  });

  it("validates credentials", () => {
    expect(validateCredentials("bad", "short")).toBeTruthy();
    expect(validateCredentials("a@b.co", "longenough")).toBeNull();
  });
});

describe("collections", () => {
  let tmp: string;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "vs-auth-"));
    process.env.VENTURE_SCAN_DB = path.join(tmp, "test.sqlite");
    resetDbForTests();
  });

  afterEach(() => {
    resetDbForTests();
    delete process.env.VENTURE_SCAN_DB;
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("stores idea and matching analysis for a user", () => {
    const user = createUser("collector@example.com", hashPassword("password123"));
    expect(findUserByEmail("collector@example.com")?.email).toBe("collector@example.com");

    const idea = SEED_IDEAS[0];
    const match = scoreIdeaAgainstProfile(idea, {
      id: "p1",
      displayName: "C",
      skills: ["climate", "markets"],
      major: "Finance",
      currentBusiness: "carbon consulting",
      interestedDomains: ["climate tech", "biodiversity"],
      preferredMarkets: ["Singapore"],
      notes: "",
      updatedAt: new Date().toISOString(),
    });

    const saved = upsertCollectionItem({
      userId: user.id,
      idea,
      match,
      profileSnapshot: null,
    });

    expect(saved.ideaSlug).toBe(idea.slug);
    expect(saved.match?.score).toBe(match.score);
    expect(listCollection(user.id)).toHaveLength(1);
    expect(getCollectionItem(user.id, idea.slug)?.match?.matched.length).toBeGreaterThan(0);
    expect(removeCollectionItem(user.id, idea.slug)).toBe(true);
    expect(listCollection(user.id)).toHaveLength(0);
  });
});
