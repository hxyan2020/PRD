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

console.log("country flag tests ok");
