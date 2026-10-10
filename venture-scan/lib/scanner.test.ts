import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getIdeaBySlug, listIdeas, resetDbForTests } from "./db";
import { runScan } from "./scanner";

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
});
