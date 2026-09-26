import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeScanWindow, inWindow } from "./window";

describe("computeScanWindow", () => {
  it("uses the last 24 hours on a mid-week day", () => {
    const now = new Date("2026-09-16T12:00:00.000Z");
    const window = computeScanWindow(now);
    assert.equal(window.kind, "daily");
    assert.equal(window.label, "Last 24 hours");
    assert.equal(window.start.toISOString(), "2026-09-15T12:00:00.000Z");
    assert.equal(window.end.toISOString(), "2026-09-16T12:00:00.000Z");
  });

  it("covers Friday through Monday when no Friday scan exists", () => {
    const monday = new Date("2026-09-14T08:00:00.000Z");
    const window = computeScanWindow(monday);
    assert.equal(window.kind, "weekend");
    assert.equal(window.start.toISOString(), "2026-09-11T00:00:00.000Z");
    assert.equal(window.end.toISOString(), "2026-09-14T08:00:00.000Z");
  });

  it("uses last Friday scan time for the Monday report", () => {
    const monday = new Date("2026-09-14T08:00:00.000Z");
    const window = computeScanWindow(monday, "2026-09-11T06:15:00.000Z");
    assert.equal(window.kind, "weekend");
    assert.equal(window.start.toISOString(), "2026-09-11T06:15:00.000Z");
  });

  it("includes items on the window boundary", () => {
    const window = computeScanWindow(new Date("2026-09-16T12:00:00.000Z"));
    assert.equal(inWindow(new Date("2026-09-15T12:00:00.000Z"), window), true);
    assert.equal(inWindow(new Date("2026-09-15T11:59:59.000Z"), window), false);
  });
});
