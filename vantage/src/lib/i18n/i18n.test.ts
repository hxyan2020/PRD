import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { looksChinese, parseLocale } from "./locale";
import { translate } from "./messages";
import { entityName, sourceName } from "./catalog";

describe("locale", () => {
  it("parses stored locale values", () => {
    assert.equal(parseLocale("zh"), "zh");
    assert.equal(parseLocale("en"), "en");
    assert.equal(parseLocale("de"), "en");
  });

  it("detects Chinese copy", () => {
    assert.equal(looksChinese("每日简报"), true);
    assert.equal(looksChinese("Daily briefing"), false);
  });
});

describe("messages", () => {
  it("returns Chinese chrome strings", () => {
    assert.equal(translate("zh", "navBriefing"), "每日简报");
    assert.equal(translate("zh", "features"), "功能");
    assert.equal(translate("en", "features"), "Features");
  });

  it("interpolates counts", () => {
    assert.equal(translate("zh", "showingStories", { n: 45 }), "显示 45 条新闻");
  });
});

describe("catalog", () => {
  it("uses Chinese entity and source names", () => {
    assert.equal(entityName("icbc", "Industrial and Commercial Bank of China", "zh"), "中国工商银行");
    assert.equal(entityName("icbc", "Industrial and Commercial Bank of China", "en"), "Industrial and Commercial Bank of China");
    assert.equal(sourceName("gn-features", "Google News — Product / feature launches", "zh"), "谷歌新闻 — 产品 / 功能上线");
  });
});
