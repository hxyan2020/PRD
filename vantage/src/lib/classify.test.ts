import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifyCategory, inferImpact, inferJurisdictions } from "./classify";

describe("classifyCategory", () => {
  it("flags new instrument listings", () => {
    assert.equal(
      classifyCategory("Binance will list XYZUSDT perpetual contract", ["product"]),
      "listing",
    );
  });

  it("flags product feature releases", () => {
    assert.equal(
      classifyCategory("Interactive Brokers launches a new TWAP order type", [
        "listing",
      ]),
      "product",
    );
  });

  it("flags regulatory items", () => {
    assert.equal(
      classifyCategory("SEC issues enforcement action against a crypto exchange", [
        "product",
      ]),
      "regulation",
    );
  });

  it("flags risk-tool coverage", () => {
    assert.equal(
      classifyCategory("Bank deploys NICE Actimize for trade surveillance", [
        "product",
      ]),
      "risk_tools",
    );
  });
});

describe("regulatory impact", () => {
  it("names sectors and assets", () => {
    const impact = inferImpact(
      "ESMA MiCA guidance on USDT and other stablecoins for crypto-asset service providers",
      "regulation",
      ["crypto", "banks"],
    );
    assert.ok(impact);
    assert.ok(impact.assets.includes("stablecoins"));
    assert.ok(impact.sectors.includes("crypto"));
    assert.ok(impact.summaryZh.includes("稳定币"));
  });

  it("extracts US jurisdiction from SEC copy", () => {
    const jurisdictions = inferJurisdictions("The SEC adopted a new rule", []);
    assert.ok(jurisdictions.includes("United States"));
  });
});
