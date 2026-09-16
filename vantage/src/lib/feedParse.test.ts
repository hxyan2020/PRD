import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  looksLikeHtml,
  parseFeedItemDate,
  sanitizeFeedXml,
} from "./feedParse";

describe("sanitizeFeedXml", () => {
  it("strips Drupal theme comments before the XML declaration", () => {
    const raw = `<!-- THEME DEBUG -->\n<?xml version="1.0"?><rss version="2.0"><channel/></rss>`;
    assert.equal(
      sanitizeFeedXml(raw),
      `<?xml version="1.0"?><rss version="2.0"><channel/></rss>`,
    );
  });
});

describe("looksLikeHtml", () => {
  it("detects Cloudflare / HubSpot challenge pages", () => {
    assert.equal(
      looksLikeHtml("<!DOCTYPE html><html lang='en'><title>Just a moment...</title>"),
      true,
    );
  });

  it("does not treat RSS as HTML", () => {
    assert.equal(
      looksLikeHtml('<?xml version="1.0"?><rss version="2.0"><channel/></rss>'),
      false,
    );
  });
});

describe("parseFeedItemDate", () => {
  it("falls back to a datetime attribute in the description", () => {
    const date = parseFeedItemDate({
      content:
        '<time datetime="2026-09-10T10:25:31+02:00">10 September 2026</time>',
    });
    assert.ok(date);
    assert.equal(date.toISOString(), "2026-09-10T08:25:31.000Z");
  });

  it("falls back to a year/month URL plus lastBuildDate", () => {
    const built = new Date("2026-09-16T11:33:58.000Z");
    const date = parseFeedItemDate(
      { link: "https://www.cssf.lu/en/2026/09/cssf-approvals/" },
      built,
    );
    assert.ok(date);
    assert.equal(date.toISOString(), built.toISOString());
  });
});
