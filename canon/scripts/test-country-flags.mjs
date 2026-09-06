import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  codesForCountryName,
  countryFlagUrl,
  flagCodesForReleaseCountry,
  isPlaceholderCountry,
  normalizeCountryKey,
  splitReleaseCountries,
} from "../src/country-flags.js";
import { displayEraLabel, displayGenre, displayReleaseCountry } from "../src/display-labels.js";

assert.equal(normalizeCountryKey("Austria–Hungary"), "austria-hungary");
assert.equal(isPlaceholderCountry("Not listed"), true);
assert.equal(isPlaceholderCountry("—"), true);
assert.equal(isPlaceholderCountry("Serbia"), false);
assert.deepEqual(splitReleaseCountries("Canada · United States"), ["Canada", "United States"]);
assert.deepEqual(codesForCountryName("Serbia"), ["rs"]);
assert.deepEqual(codesForCountryName("United States"), ["us"]);
assert.deepEqual(codesForCountryName("United Kingdom"), ["gb"]);
assert.deepEqual(codesForCountryName("South Korea"), ["kr"]);
assert.deepEqual(codesForCountryName("Austria–Hungary"), ["at", "hu"]);
assert.deepEqual(codesForCountryName("Kingdom of the Netherlands"), ["nl"]);
assert.deepEqual(codesForCountryName("England"), ["gb-eng"]);
assert.deepEqual(codesForCountryName("Scotland"), ["gb-sct"]);
assert.deepEqual(codesForCountryName("Not listed"), []);
assert.deepEqual(flagCodesForReleaseCountry("Serbia"), ["rs"]);
assert.deepEqual(flagCodesForReleaseCountry("Canada · United States"), ["ca", "us"]);
assert.deepEqual(flagCodesForReleaseCountry("United States · Canada"), ["us", "ca"]);
assert.deepEqual(flagCodesForReleaseCountry("Not listed"), []);
assert.deepEqual(flagCodesForReleaseCountry("—"), []);
assert.equal(countryFlagUrl("rs"), "/flags/rs.svg");

const root = dirname(fileURLToPath(import.meta.url));
const flagsDir = join(root, "../public/flags");
const catalog = JSON.parse(readFileSync(join(root, "../public/catalog.json"), "utf8"));
const missing = [];
const codes = new Set();
for (const track of catalog.tracks) {
  const value = track.releaseCountry;
  if (isPlaceholderCountry(value)) continue;
  const mapped = flagCodesForReleaseCountry(value);
  if (!mapped.length) missing.push(`${track.name}: ${value}`);
  for (const code of mapped) codes.add(code);
}
assert.equal(missing.length, 0, `unmapped release countries:\n${missing.slice(0, 20).join("\n")}`);
for (const code of [...codes].sort()) {
  const file = join(flagsDir, `${code}.svg`);
  assert.ok(existsSync(file), `missing flag ${code}.svg`);
  assert.match(readFileSync(file, "utf8"), /<svg[\s>]/i);
}

assert.equal(displayReleaseCountry("United States · Canada", "zh"), "美国 · 加拿大");
assert.equal(displayReleaseCountry("United States · Canada", "en"), "United States · Canada");
assert.equal(displayReleaseCountry("United Kingdom", "zh"), "英国");
assert.equal(displayReleaseCountry("South Korea", "zh"), "韩国");
assert.equal(displayReleaseCountry("France", "fr"), "France");
assert.equal(
  displayReleaseCountry("Not listed", "zh", (key) => (key === "notListed" ? "未列出" : key)),
  "未列出",
);
assert.equal(displayGenre("alternative pop", "zh"), "另类流行");
assert.equal(displayGenre("pop music", "zh"), "流行音乐");
assert.equal(displayGenre("alternative pop", "en"), "alternative pop");
assert.equal(displayGenre("hip-hop", "zh"), "嘻哈");
assert.equal(displayGenre("acid jazz", "zh"), "迷幻酸爵士");
assert.equal(displayGenre("techno", "zh"), "科技舞曲");
assert.equal(displayGenre("UK drill · trap music · UK rap", "zh"), "英国钻乐 · 陷阱说唱 · 英国说唱");
assert.equal(displayEraLabel("2010s", (key) => key, "zh"), "2010年代");
assert.equal(displayEraLabel("2010s", (key) => key, "fr"), "années 2010");
assert.equal(displayEraLabel("2010s", (key) => key, "en"), "2010s");
assert.equal(displayEraLabel("Unknown era", (key) => (key === "unknownEra" ? "未知年代" : key), "zh"), "未知年代");

const leftoverLatin = [];
for (const genre of [...new Set(catalog.tracks.map((track) => track.genre).filter(Boolean))]) {
  const label = displayGenre(genre, "zh");
  if (/[A-Za-z]{3,}/.test(label)) leftoverLatin.push(`${genre} → ${label}`);
}
assert.equal(leftoverLatin.length, 0, `untranslated genre labels:\n${leftoverLatin.slice(0, 20).join("\n")}`);
