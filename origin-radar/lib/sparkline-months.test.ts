import { describe, expect, it } from "vitest";
import { sparklineMonthLabels } from "./sparkline-months";

describe("sparklineMonthLabels", () => {
  it("returns 12 months ending on the snapshot month", () => {
    const labels = sparklineMonthLabels(12, "2026-09-05");
    expect(labels).toHaveLength(12);
    expect(labels[0]).toBe("Oct 25");
    expect(labels[11]).toBe("Sep 26");
  });
});
