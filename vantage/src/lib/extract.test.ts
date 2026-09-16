import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isIncompletePoint, isIncompleteZh, keyPoints, stripHtml } from "./extract";
import { repairNewsItem } from "./repairNews";

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

  it("does not split on month or U.S. abbreviations", () => {
    const points = keyPoints(
      "Bitcoin loses touch with the Dollar Index",
      "Your day-ahead look for Sept. 16 covers bitcoin, the Dollar Index, and U.S. stocks ahead of the Fed.",
    );
    assert.equal(points.length, 1);
    assert.match(points[0], /Sept\. 16/);
    assert.match(points[0], /U\.S\. stocks/);
  });

  it("keeps Oct. 27 and U.S. Senate in one sentence", () => {
    const euro = keyPoints(
      "ECB seeks online merchants for 2027 digital euro pilot",
      "Euro-area online and mobile merchants can apply until Oct. 27 to test beta digital euro payments in a 12-month pilot.",
    );
    assert.equal(euro.length, 1);
    assert.match(euro[0], /Oct\. 27/);
    const stocks = keyPoints(
      "Crypto stocks sink",
      "Coinbase, Circle and Galaxy lead a broad crypto stock selloff after the U.S. Senate failed to advance a long-awaited market structure bill.",
    );
    assert.equal(stocks.length, 1);
    assert.match(stocks[0], /U\.S\. Senate/);
  });

  it("drops Finextra author stubs and uses the caption instead", () => {
    const points = keyPoints(
      "Why institutions are saying yes to stablecoins",
      "Author: A finextra community member.",
    );
    assert.deepEqual(points, ["Why institutions are saying yes to stablecoins."]);
  });

  it("flags cut-off daybook fragments", () => {
    assert.equal(isIncompletePoint("Your day-ahead look for Sept."), true);
    assert.equal(isIncompletePoint("The 12-month test will put a beta version of the central bank currency through payments."), false);
  });

  it("rejects stub Chinese without flagging a normal sentence period", () => {
    assert.equal(isIncompleteZh("您未来的一天寻找9月"), true);
    assert.equal(isIncompleteZh("27 ，在为期12个月的试点中测试测试版数字欧元支付。"), true);
    assert.equal(isIncompleteZh("比特币与美元指数失去联系，美国股市领先于美联储。"), false);
  });
});

describe("repairNewsItem", () => {
  it("replaces a cut-off key point with the full caption", () => {
    const repaired = repairNewsItem({
      id: "x",
      caption: "Bitcoin loses touch with the Dollar Index, U.S. stocks ahead of the Fed",
      captionZh: "比特币与美元指数失去联系，美联储之前的美国股市",
      category: "product",
      sectors: ["crypto"],
      keyPoints: ["Your day-ahead look for Sept."],
      keyPointsZh: ["您未来的一天寻找9月"],
      sources: [],
      publishedAt: "2026-09-16T11:16:51.000Z",
      entities: [],
      jurisdictions: ["United States"],
      impact: null,
      riskTools: [],
    });
    assert.equal(repaired.keyPoints.length, 1);
    assert.match(repaired.keyPoints[0], /Dollar Index/);
    assert.equal(repaired.keyPointsZh[0], "");
  });

  it("joins a Sept. fragment with the following date line", () => {
    const repaired = repairNewsItem({
      id: "y",
      caption: "Portage closes Fund IV",
      captionZh: "",
      category: "product",
      sectors: ["banks"],
      keyPoints: [
        "This Milestone Marks a Decade of Investing in the Future of Financial Technologies & Services TORONTO, Sept.",
        "16, 2026 /PRNewswire/ -- Portage announced the final close of Portage Ventures IV.",
      ],
      keyPointsZh: [],
      sources: [],
      publishedAt: "2026-09-16T12:00:00.000Z",
      entities: [],
      jurisdictions: ["Canada"],
      impact: null,
      riskTools: [],
    });
    assert.equal(repaired.keyPoints.length, 1);
    assert.match(repaired.keyPoints[0], /Sept\. 16, 2026/);
    assert.match(repaired.keyPoints[0], /Ventures IV/);
  });

  it("joins an Oct. split and drops Finextra author stubs", () => {
    const euro = repairNewsItem({
      id: "z",
      caption: "ECB seeks online merchants for 2027 digital euro pilot",
      captionZh: "欧洲央行寻求2027年数字欧元试点的在线商家",
      category: "regulation",
      sectors: ["crypto"],
      keyPoints: [
        "Euro-area online and mobile merchants can apply until Oct.",
        "27 to test beta digital euro payments in a 12-month pilot.",
      ],
      keyPointsZh: ["欧元区在线和移动商家可在10月前申请。", "27 ，在为期12个月的试点中测试测试版数字欧元支付。"],
      sources: [],
      publishedAt: "2026-09-16T08:36:44.000Z",
      entities: [],
      jurisdictions: ["European Union"],
      impact: null,
      riskTools: [],
    });
    assert.equal(euro.keyPoints.length, 1);
    assert.match(euro.keyPoints[0], /Oct\. 27/);
    assert.equal(euro.keyPointsZh[0], "");
  });
});
