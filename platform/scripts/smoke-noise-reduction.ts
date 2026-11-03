/**
 * Smoke: noise-reduction prototype HTML present with EN+zh scenarios and embed hook.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const htmlPath = path.join(root, "public/prototypes/monitor2-noise-reduction.html");
assert.ok(fs.existsSync(htmlPath), "prototype HTML missing");
const html = fs.readFileSync(htmlPath, "utf8");

assert.match(html, /SCENARIO_EN/);
assert.match(html, /STAGE_EN/);
for (const key of ["cross", "spike", "duplicate", "benign", "unknown", "critical"]) {
  assert.match(html, new RegExp(`${key}:\\{title:`));
}
assert.match(html, /crmp-embed/);
assert.match(html, /embed['"]?\)?\s*===\s*['"]1['"]/);
assert.match(html, /繁中/);
assert.match(html, /降噪/);

const pagePath = path.join(root, "src/app/admin/noise-reduction/page.tsx");
assert.ok(fs.existsSync(pagePath), "admin page missing");
assert.match(fs.readFileSync(pagePath, "utf8"), /Desk12NoiseMethods/);

const packPath = path.join(root, "src/lib/demo/desk-12-pack.ts");
assert.ok(fs.existsSync(packPath), "desk-12 pack missing");
const pack = fs.readFileSync(packPath, "utf8");
for (const core of ["threshold_optimisation", "severity_optimisation", "persistence"]) {
  assert.match(pack, new RegExp(`id: "${core}"`));
  assert.match(pack, new RegExp(`core: true,[\\s\\S]{0,80}id: "${core}"|id: "${core}",[\\s\\S]{0,40}core: true`));
}
assert.match(pack, /NOISE_TECHNIQUE_CATALOGUE/);
assert.match(pack, /noiseCatalogueCoversCoreTrio/);

const methodsPath = path.join(root, "src/components/Desk12NoiseMethods.tsx");
assert.ok(fs.existsSync(methodsPath), "Desk12NoiseMethods missing");
assert.match(fs.readFileSync(methodsPath, "utf8"), /noise-coverage-matrix/);

console.log("ok: smoke Noise Reduction Lab", {
  htmlBytes: html.length,
  scenarios: ["cross", "spike", "duplicate", "benign", "unknown", "critical"],
  desk12Core: ["threshold_optimisation", "severity_optimisation", "persistence"],
});
