import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { detectSourceLang, looksUntranslated } from "./detectLang";
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

  it("detects Dutch and German source copy", () => {
    assert.equal(
      detectSourceLang("Caribisch Nederland: herbeoordeling betrouwbaarheid vervallen, wijzigingen wel direct doorgeven"),
      "nl",
    );
    assert.equal(
      detectSourceLang("Die Bank of Canada wählt den Reference Pricing Service als Preisquelle für kanadische festverzinsliche Wertpapiere"),
      "de",
    );
    assert.equal(detectSourceLang("Bitcoin loses touch with the Dollar Index"), "en");
  });

  it("flags leftover foreign words as untranslated Chinese", () => {
    assert.equal(
      looksUntranslated(
        "Bank of Canada kiest de CanDeal service",
        "加拿大银行kiest de CanDeal服务 ALS PRIJSBRON",
      ),
      true,
    );
    assert.equal(
      looksUntranslated(
        "Bitcoin loses touch with the Dollar Index",
        "比特币与美元指数失去联系，美国股市领先于美联储。",
      ),
      false,
    );
  });
});

describe("messages", () => {
  it("returns Chinese chrome strings", () => {
    assert.equal(translate("zh", "navBriefing"), "每日简报");
    assert.equal(translate("zh", "navSourcesShort"), "来源");
    assert.equal(translate("en", "navSourcesShort"), "Sources");
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
