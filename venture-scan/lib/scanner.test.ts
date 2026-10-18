import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { countIdeas, getIdeaBySlug, listIdeas, resetDbForTests, upsertIdea } from "./db";
import { SEED_IDEAS } from "./seed-ideas";
import { ensureSeeded, runScan } from "./scanner";

describe("runScan", () => {
  let tmp: string;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "venture-scan-"));
    process.env.VENTURE_SCAN_DB = path.join(tmp, "test.sqlite");
    resetDbForTests();
  });

  afterEach(() => {
    resetDbForTests();
    delete process.env.VENTURE_SCAN_DB;
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("inserts seed ideas with required fields", () => {
    const first = runScan({ source: "test" });
    expect(first.inserted).toBeGreaterThan(0);
    expect(first.total).toBe(first.inserted);

    const ideas = listIdeas();
    expect(ideas.length).toBe(first.total);

    const sample = ideas[0];
    expect(sample.name).toBeTruthy();
    expect(sample.description).toBeTruthy();
    expect(sample.businessModel).toBeTruthy();
    expect(sample.teamCountry).toBeTruthy();
    expect(sample.teamSize).toBeGreaterThan(0);
    expect(sample.industry).toBeTruthy();
    expect(sample.sector).toBeTruthy();
    expect(typeof sample.fundraisingSecured).toBe("boolean");
    expect(sample.website).toMatch(/^https?:\/\//);
    expect(sample.social.length).toBeGreaterThan(0);
    expect(sample.goForward.summary).toBeTruthy();
  });

  it("updates on rescan instead of duplicating", () => {
    const first = runScan({ source: "test" });
    const second = runScan({ source: "test-rescan" });
    expect(second.inserted).toBe(0);
    expect(second.updated).toBe(first.total);
    expect(second.total).toBe(first.total);
  });

  it("can look up by slug", () => {
    runScan({ source: "test" });
    const idea = getIdeaBySlug("reef-credit-exchange");
    expect(idea?.name).toBe("ReefCredit Exchange");
    expect(idea?.goForward.strategy).toBe("franchise_local");
  });

  it("ensureSeeded syncs the full sourced catalog into SQLite", () => {
    ensureSeeded();
    expect(countIdeas()).toBe(SEED_IDEAS.length);
    expect(listIdeas().some((i) => i.slug === "resend-email-api")).toBe(true);
    expect(listIdeas().some((i) => /spotify/i.test(i.website))).toBe(false);

    // Simulate a stale DB missing newer sourced ideas.
    const onlyOne = SEED_IDEAS[0];
    resetDbForTests();
    process.env.VENTURE_SCAN_DB = path.join(tmp, "stale.sqlite");
    upsertIdea(onlyOne);
    expect(countIdeas()).toBe(1);
    ensureSeeded();
    expect(countIdeas()).toBe(SEED_IDEAS.length);
  });
});
