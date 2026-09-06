import assert from "node:assert/strict";
import {
  LANGUAGE_IDS,
  LANGUAGES,
  applyDocumentLocale,
  dateTag,
  detectLocale,
  interpolate,
  languageFlagUrl,
  languageMeta,
  loadLocale,
  saveLocale,
  t,
} from "../src/i18n.js";
import { MESSAGES } from "../src/i18n-messages.js";
import { BEYOND } from "../src/beyond-messages.js";
import { HX } from "../src/hx-messages.js";
import { LEGAL } from "../src/legal-messages.js";
import { LYRICS } from "../src/lyrics-messages.js";
import { PORTRAITS } from "../src/portrait-messages.js";
import { parseRoute, routeHash } from "../src/pages.js";
import { recommendDaily, surprisePick } from "../src/recommend.js";
import { moodLabel, resolveMoodValue } from "../src/uiText.js";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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
assert.deepEqual(parseRoute("#hx-viewership"), { page: "hx-viewership", trackId: "" });
assert.deepEqual(parseRoute("#hx-monitor"), { page: "hx-monitor", trackId: "" });
assert.deepEqual(parseRoute("#collections"), { page: "collections", trackId: "" });
assert.deepEqual(parseRoute("#log"), { page: "log", trackId: "" });
assert.deepEqual(parseRoute("#history"), { page: "log", trackId: "" });
assert.deepEqual(parseRoute("#recommend-log"), { page: "log", trackId: "" });
assert.deepEqual(parseRoute("#collections&t=Q1"), { page: "collections", trackId: "Q1" });
assert.deepEqual(parseRoute("#log&t=ext-1"), { page: "log", trackId: "ext-1" });
assert.equal(routeHash("home", "Q1"), "t=Q1");
assert.equal(routeHash("collections"), "collections");
assert.equal(routeHash("log", "Q1"), "log&t=Q1");
assert.equal(routeHash("home"), "");

const legalKeys = Object.keys(LEGAL.en).sort();
assert.ok(legalKeys.includes("aboutTitle"));
assert.ok(legalKeys.includes("termsTitle"));
for (const locale of LANGUAGE_IDS) {
  assert.deepEqual(Object.keys(LEGAL[locale]).sort(), legalKeys, `${locale} legal copy keys`);
  assert.match(t(locale, "aboutTitle"), /./);
  assert.match(t(locale, "terms1Body"), /Spotify/);
}

const beyondKeys = Object.keys(BEYOND.en).sort();
assert.ok(beyondKeys.includes("beyondFind"));
for (const locale of LANGUAGE_IDS) {
  assert.deepEqual(Object.keys(BEYOND[locale]).sort(), beyondKeys, `${locale} beyond copy keys`);
  assert.match(t(locale, "beyondTitle"), /./);
}

const hxKeys = Object.keys(HX.en).sort();
assert.ok(hxKeys.includes("hx.monitor.title"));
for (const locale of LANGUAGE_IDS) {
  assert.deepEqual(Object.keys(HX[locale]).sort(), hxKeys, `${locale} HX copy keys`);
  assert.match(t(locale, "hx.views.title"), /./);
}

const lyricsKeys = Object.keys(LYRICS.en).sort();
assert.ok(lyricsKeys.includes("lyrics"));
for (const locale of LANGUAGE_IDS) {
  assert.deepEqual(Object.keys(LYRICS[locale]).sort(), lyricsKeys, `${locale} lyrics copy keys`);
  assert.match(t(locale, "lyrics"), /./);
}

const portraitKeys = Object.keys(PORTRAITS.en).sort();
assert.ok(portraitKeys.includes("songAnecdote"));
for (const locale of LANGUAGE_IDS) {
  assert.deepEqual(Object.keys(PORTRAITS[locale]).sort(), portraitKeys, `${locale} portrait copy keys`);
  assert.match(t(locale, "portraitsOf", { name: "Queen" }), /Queen/);
}
assert.match(t("en", "docTitle"), /1000 Music/);
assert.match(t("en", "lyricsMissing"), /Music/);
assert.equal(t("en", "emptyFilters").includes("recordings"), false);

const flagsDir = join(dirname(fileURLToPath(import.meta.url)), "../public/flags");
const expectedFlags = { en: "gb", zh: "cn", hi: "in", es: "es", fr: "fr", ar: "sa", bn: "bd", pt: "br" };
for (const lang of LANGUAGES) {
  assert.equal(lang.flag, expectedFlags[lang.id], `${lang.id} maps to a national flag icon`);
  assert.ok(lang.country, `${lang.id} has a country label`);
  assert.notEqual(lang.native, lang.flag.toUpperCase(), "dropdown labels are not ISO codes");
  const file = join(flagsDir, `${lang.flag}.svg`);
  assert.ok(existsSync(file), `${lang.flag}.svg is vendored`);
  assert.match(readFileSync(file, "utf8"), /<svg[\s>]/i);
  assert.equal(languageFlagUrl(lang.id), `/flags/${lang.flag}.svg`);
}
assert.equal(languageMeta("en").flag, "gb");
assert.equal(languageMeta("zh").flag, "cn");

const publicDir = join(dirname(fileURLToPath(import.meta.url)), "../public");
for (const file of ["logo.png", "favicon.svg", "favicon.png", "favicon.ico", "apple-touch-icon.png"]) {
  assert.ok(existsSync(join(publicDir, file)), `brand asset ${file}`);
}
assert.match(readFileSync(join(publicDir, "favicon.svg"), "utf8"), /image\/png;base64/);
const html = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../index.html"), "utf8");
assert.match(html, /favicon\.svg/);
assert.match(html, /apple-touch-icon\.png/);

console.log("i18n tests ok");
