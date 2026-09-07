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
import { AUTH } from "../src/auth-messages.js";
import { BEYOND } from "../src/beyond-messages.js";
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
assert.equal(t("en", "menu"), "Menu");
assert.equal(t("en", "listenNav"), "For you");
assert.equal(t("en", "prefsNav"), "Preferences");
assert.equal(t("en", "profileNav"), "My profile");
assert.equal(t("en", "aboutNav"), "About");
assert.equal(t("en", "termsNav"), "Terms of use");
assert.equal(t("zh", "aboutNav"), "关于");
assert.equal(t("zh", "termsNav"), "使用条款");
assert.equal(t("zh", "listenNav"), "为你推荐");
assert.equal(t("zh", "prefsNav"), "偏好");
assert.equal(t("zh", "profileNav"), "我的资料");
assert.equal(t("zh", "archiveNav"), "一千首");
assert.equal(t("zh", "menu"), "菜单");
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
assert.deepEqual(parseRoute("#collections"), { page: "collections", trackId: "" });
assert.deepEqual(parseRoute("#log"), { page: "log", trackId: "" });
assert.deepEqual(parseRoute("#history"), { page: "log", trackId: "" });
assert.deepEqual(parseRoute("#recommend-log"), { page: "log", trackId: "" });
assert.deepEqual(parseRoute("#collections&t=Q1"), { page: "collections", trackId: "Q1" });
assert.deepEqual(parseRoute("#log&t=ext-1"), { page: "log", trackId: "ext-1" });
assert.deepEqual(parseRoute("#listen"), { page: "home", trackId: "" });
assert.deepEqual(parseRoute("#for-you"), { page: "home", trackId: "" });
assert.deepEqual(parseRoute("#beyond"), { page: "home", trackId: "" });
assert.deepEqual(parseRoute("#prefs"), { page: "prefs", trackId: "" });
assert.deepEqual(parseRoute("#preferences"), { page: "prefs", trackId: "" });
assert.deepEqual(parseRoute("#profile"), { page: "profile", trackId: "" });
assert.deepEqual(parseRoute("#account"), { page: "profile", trackId: "" });
assert.deepEqual(parseRoute("#me"), { page: "profile", trackId: "" });
assert.equal(routeHash("profile"), "profile");
assert.deepEqual(parseRoute("#listen&t=Q1"), { page: "home", trackId: "Q1" });
assert.deepEqual(parseRoute("#archive"), { page: "archive", trackId: "" });
assert.deepEqual(parseRoute("#catalog"), { page: "archive", trackId: "" });
assert.deepEqual(parseRoute("#archive&t=Q1"), { page: "archive", trackId: "Q1" });
assert.equal(routeHash("home"), "");
assert.equal(routeHash("prefs"), "prefs");
assert.equal(routeHash("archive"), "archive");
assert.equal(routeHash("archive", "Q1"), "archive&t=Q1");
assert.equal(routeHash("home", "Q1"), "t=Q1");
assert.equal(routeHash("collections"), "collections");
assert.equal(routeHash("log", "Q1"), "log&t=Q1");

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

const lyricsKeys = Object.keys(LYRICS.en).sort();
assert.ok(lyricsKeys.includes("lyrics"));
assert.ok(lyricsKeys.includes("lyricsShow"));
for (const locale of LANGUAGE_IDS) {
  assert.deepEqual(Object.keys(LYRICS[locale]).sort(), lyricsKeys, `${locale} lyrics copy keys`);
  assert.match(t(locale, "lyrics"), /./);
}

const authKeys = Object.keys(AUTH.en).sort();
assert.ok(authKeys.includes("profileNav"));
assert.ok(authKeys.includes("profileReset"));
assert.ok(authKeys.includes("profileSignOut"));
for (const locale of LANGUAGE_IDS) {
  assert.deepEqual(Object.keys(AUTH[locale]).sort(), authKeys, `${locale} auth copy keys`);
  assert.match(t(locale, "profileTitle"), /./);
}
assert.equal(t("en", "profileNav"), "My profile");
assert.match(t("en", "aboutDataBody"), /optional Canon profile/);
assert.match(t("en", "terms5Body"), /My profile/);
assert.match(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../src/SitePages.jsx"), "utf8"),
  /\["profile", "profileNav"\]/,
);
const lyricsPanel = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../src/LyricsPanel.jsx"), "utf8");
assert.match(lyricsPanel, /if \(!open \|\| !trackKey\) return null/);
assert.doesNotMatch(lyricsPanel, /lyricsShow/);
assert.doesNotMatch(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../src/DailyRecommend.jsx"), "utf8"),
  /lyrics-toggle/
);

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
assert.match(html, /logo\.png/);
assert.match(html, /rel="preload"/);
assert.match(html, /color-scheme/);
assert.match(html, /class="boot"/);
assert.match(html, /Opening the archive/);
assert.match(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../src/BootScreen.jsx"), "utf8"), /boot-mark/);

console.log("i18n tests ok");
