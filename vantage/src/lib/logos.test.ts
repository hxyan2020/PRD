import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { logoHref, toolLogoId, vendorLogoId } from "./logos";

describe("logo ids", () => {
  it("slugs vendor names the same way downloaded files are named", () => {
    assert.equal(vendorLogoId("BlackRock"), "vendor-blackrock");
    assert.equal(vendorLogoId("Moody's"), "vendor-moody-s");
    assert.equal(vendorLogoId("Qontigo / Deutsche Börse"), "vendor-qontigo-deutsche-b-rse");
    assert.equal(toolLogoId("aladdin"), "tool-aladdin");
  });

  it("uses a host-relative logo path that works at the site root and nested views", () => {
    assert.equal(logoHref("icbc", "/"), "./logos/icbc.png");
    assert.equal(logoHref("icbc", "/gh/hxyan2020/PRD@gh-pages/"), "./logos/icbc.png");
    assert.equal(logoHref("icbc", "/entities/"), "../logos/icbc.png");
    assert.equal(logoHref("icbc", "/risk-tools/"), "../logos/icbc.png");
  });
});
