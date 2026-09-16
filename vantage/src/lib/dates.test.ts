import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseLooseDate } from "./dates";

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
});
