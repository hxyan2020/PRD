import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { keyPoints, stripHtml } from "./extract";

describe("extract", () => {
  it("strips markup before taking key points", () => {
    const points = keyPoints(
      "Example listing",
      "<p>The venue listed ABC-USD for spot trading today. The pair opens at 14:00 UTC. Fees stay unchanged.</p>",
    );
    assert.ok(points.length >= 2);
    assert.equal(points.some((point) => point.includes("<p>")), false);
  });

  it("decodes basic HTML entities", () => {
    assert.equal(stripHtml("A &amp; B"), "A & B");
  });
});
