import assert from "node:assert/strict";
import {
  LANGUAGE_IDS,
  applyDocumentLocale,
  dateTag,
  detectLocale,
  interpolate,
  loadLocale,
  saveLocale,
  t,
} from "../src/i18n.js";
import { MESSAGES } from "../src/i18n-messages.js";
import { LEGAL } from "../src/legal-messages.js";
import { parseRoute } from "../src/pages.js";
import { recommendDaily, surprisePick } from "../src/recommend.js";
import { moodLabel, resolveMoodValue } from "../src/uiText.js";

assert.equal(interpolate("Hello {name}", { name: "Canon" }), "Hello Canon");
assert.equal(interpolate("Hello {name}"), "Hello {name}");
assert.equal(detectLocale("zh", "en-US"), "zh");
assert.equal(detectLocale("", "zh-CN"), "zh");
assert.equal(detectLocale("", "pt-BR"), "pt");
assert.equal(detectLocale("", "de-DE"), "en");
assert.equal(dateTag("ar"), "ar");
assert.equal(dateTag("en"), "en-GB");

const enKeys = Object.keys(MESSAGES.en).sort();
assert.ok(enKeys.length > 80, "English UI dictionary is populated");
for (const locale of LANGUAGE_IDS) {
  assert.deepEqual(Object.keys(MESSAGES[locale]).sort(), enKeys, `${locale} is missing or extra keys`);
}

assert.equal(t("en", "collect"), "Collect");
assert.equal(t("zh", "collect"), "收藏");
assert.equal(t("ar", "listen"), "استمع");
assert.match(t("fr", "showing", { n: 12, total: 1000 }), /12/);

const memory = {
  data: new Map(),
  getItem(key) {
    return this.data.has(key) ? this.data.get(key) : null;
  },
  setItem(key, value) {
    this.data.set(key, String(value));
  },
};
saveLocale("hi", memory);
assert.equal(loadLocale(memory, "en-US"), "hi");

const doc = { documentElement: { lang: "en", dir: "ltr" }, title: "" };
applyDocumentLocale("ar", doc);
assert.equal(doc.documentElement.lang, "ar");
assert.equal(doc.documentElement.dir, "rtl");
assert.ok(doc.title.includes("Canon"));

const popular = recommendDaily([{ id: "a", name: "Blinding Lights", streams: 9, genre: "pop", releaseCountry: "Canada" }], {});
assert.equal(popular.reasonKey, "popular");
assert.match(popular.reason, /most streamed/);

const empty = surprisePick([]);
assert.equal(empty.reasonKey, "empty");

const zh = (key) => t("zh", key);
assert.equal(moodLabel("Joyful", zh), "欢快");
assert.equal(resolveMoodValue("忧郁", zh), "Melancholy");
assert.equal(resolveMoodValue("Joyful", zh), "Joyful");

assert.deepEqual(parseRoute(""), { page: "home", trackId: "" });
assert.deepEqual(parseRoute("#t=Q109612965"), { page: "home", trackId: "Q109612965" });
assert.deepEqual(parseRoute("#about"), { page: "about", trackId: "" });
assert.deepEqual(parseRoute("terms"), { page: "terms", trackId: "" });

const legalKeys = Object.keys(LEGAL.en).sort();
assert.ok(legalKeys.includes("aboutTitle"));
assert.ok(legalKeys.includes("termsTitle"));
for (const locale of LANGUAGE_IDS) {
  assert.deepEqual(Object.keys(LEGAL[locale]).sort(), legalKeys, `${locale} legal copy keys`);
  assert.match(t(locale, "aboutTitle"), /./);
  assert.match(t(locale, "terms1Body"), /Spotify/);
}

console.log("i18n tests ok");
