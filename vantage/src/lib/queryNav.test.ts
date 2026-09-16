import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseView, queryHref } from "./queryNav";

describe("queryHref", () => {
  it("builds host-relative query strings without a leading path", () => {
    assert.equal(queryHref({ category: "product" }), "?category=product");
    assert.equal(
      queryHref({ view: "entities", sector: "banks" }),
      "?view=entities&sector=banks",
    );
  });

  it("drops default briefing/all values so the home URL stays at the current file", () => {
    assert.equal(queryHref({ view: "briefing", category: "all" }), "?");
    assert.equal(queryHref({ view: "sources", status: "all" }), "?view=sources");
  });
});

describe("parseView", () => {
  it("defaults unknown views to the daily briefing", () => {
    assert.equal(parseView(null), "briefing");
    assert.equal(parseView("product"), "briefing");
    assert.equal(parseView("risk-tools"), "risk-tools");
  });
});
