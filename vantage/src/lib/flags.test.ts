import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { flagCode, flagSrc } from "./flags";

describe("flagCode", () => {
  it("maps entity countries and jurisdictions to ISO codes", () => {
    assert.equal(flagCode("United States"), "us");
    assert.equal(flagCode("China"), "cn");
    assert.equal(flagCode("United Kingdom"), "gb");
    assert.equal(flagCode("European Union"), "eu");
    assert.equal(flagCode("Hong Kong"), "hk");
    assert.equal(flagCode("Global"), "global");
    assert.equal(flagCode("United Arab Emirates"), "ae");
    assert.equal(flagCode("British Virgin Islands"), "vg");
  });

  it("skips non-country placeholders", () => {
    assert.equal(flagCode("n/a"), null);
    assert.equal(flagCode("Beijing"), null);
  });

  it("returns an image data URI for known countries", () => {
    const src = flagSrc("China");
    assert.ok(src?.startsWith("data:image/png;base64,"));
    assert.ok((flagSrc("Global") ?? "").startsWith("data:image/svg+xml"));
    assert.equal(flagSrc("n/a"), null);
  });
});
