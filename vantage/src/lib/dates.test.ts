import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractEmbeddedDate, extractUrlDate, parseLooseDate } from "./dates";

describe("parseLooseDate", () => {
  it("parses FCA-style timestamps", () => {
    const date = parseLooseDate("Wednesday, September 16, 2026 - 11:00");
    assert.ok(date);
    assert.equal(date.toISOString(), "2026-09-16T11:00:00.000Z");
  });

  it("parses ISO timestamps", () => {
    const date = parseLooseDate("2026-09-16T08:00:00.000Z");
    assert.ok(date);
    assert.equal(date.toISOString(), "2026-09-16T08:00:00.000Z");
  });

  it("parses SEBI pubDates with a comma and +0530 offset", () => {
    const date = parseLooseDate("16 Sep, 2026 +0530");
    assert.ok(date);
    assert.equal(date.toISOString(), "2026-09-15T18:30:00.000Z");
  });

  it("parses day-month timestamps with an explicit time", () => {
    const date = parseLooseDate("16 Sep 2026 20:00:02 +0530");
    assert.ok(date);
    assert.equal(date.toISOString(), "2026-09-16T14:30:02.000Z");
  });
});

describe("extractEmbeddedDate", () => {
  it("reads ISO datetime attributes from HTML descriptions", () => {
    const date = extractEmbeddedDate(
      '<time datetime="2026-09-10T10:25:31+02:00">10 September 2026</time>',
    );
    assert.ok(date);
    assert.equal(date.toISOString(), "2026-09-10T08:25:31.000Z");
  });
});

describe("extractUrlDate", () => {
  it("reads year/month/day paths", () => {
    const date = extractUrlDate(
      "https://www.cssf.lu/en/2026/09/15/warning-concerning-fraud/",
    );
    assert.ok(date);
    assert.equal(date.toISOString(), "2026-09-15T00:00:00.000Z");
  });

  it("uses lastBuildDate when the URL only has year/month", () => {
    const built = new Date("2026-09-16T11:33:58.000Z");
    const date = extractUrlDate(
      "https://www.cssf.lu/en/2026/09/warning-concerning-fraud/",
      built,
    );
    assert.ok(date);
    assert.equal(date.toISOString(), built.toISOString());
  });

  it("reads SEBI month-year slugs", () => {
    const built = new Date("2026-09-16T14:00:00.000Z");
    const date = extractUrlDate(
      "https://www.sebi.gov.in/enforcement/orders/sep-2026/example_104528.html",
      built,
    );
    assert.ok(date);
    assert.equal(date.toISOString(), built.toISOString());
  });
});
