import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { navHref, parseDeskNav, parseView, queryHref, storyDeskHref } from "./queryNav";

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
    assert.equal(parseView("collection"), "collection");
  });
});

describe("parseDeskNav", () => {
  it("merges briefing category chips into the same nav ids as the header", () => {
    assert.equal(parseDeskNav(null, null), "briefing");
    assert.equal(parseDeskNav(null, "listing"), "listing");
    assert.equal(parseDeskNav(null, "product"), "product");
    assert.equal(parseDeskNav(null, "regulation"), "regulation");
    assert.equal(parseDeskNav(null, "risk_tools"), "risk-tools");
    assert.equal(parseDeskNav("regulation", "listing"), "regulation");
    assert.equal(parseDeskNav("entities", null), "entities");
    assert.equal(parseDeskNav("collection", null), "collection");
  });
});

describe("navHref", () => {
  it("keeps listings and features on the briefing file", () => {
    assert.equal(navHref("listing"), "?category=listing");
    assert.equal(navHref("product", "banks"), "?category=product&sector=banks");
    assert.equal(navHref("regulation"), "?view=regulation");
    assert.equal(navHref("briefing"), "?");
    assert.equal(navHref("collection"), "?view=collection");
  });
});

describe("storyDeskHref", () => {
  it("opens the matching category or view with the story focused", () => {
    assert.equal(
      storyDeskHref({ id: "abc", category: "listing" }, "banks"),
      "?category=listing&sector=banks&story=abc",
    );
    assert.equal(
      storyDeskHref({ id: "def", category: "product" }, "crypto"),
      "?category=product&sector=crypto&story=def",
    );
    assert.equal(
      storyDeskHref({ id: "ghi", category: "regulation" }, "brokers"),
      "?view=regulation&sector=brokers&story=ghi",
    );
    assert.equal(
      storyDeskHref({ id: "jkl", category: "risk_tools" }, "banks"),
      "?view=risk-tools&sector=banks&story=jkl",
    );
  });
});
