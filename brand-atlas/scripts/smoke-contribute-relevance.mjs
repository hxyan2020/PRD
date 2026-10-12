#!/usr/bin/env node
/**
 * Smoke: category relevance accepts a known tree name and rejects a car name for trees.
 */
const WIKI = "https://en.wikipedia.org/w/api.php";

async function wiki(params) {
  const url = new URL(WIKI);
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`wiki ${res.status}`);
  return res.json();
}

async function extractFor(query) {
  const os = await wiki({ action: "opensearch", search: query, limit: "3" });
  const title = os[1]?.[0];
  if (!title) return { title: null, extract: "" };
  const data = await wiki({
    action: "query",
    prop: "extracts",
    exintro: "1",
    explaintext: "1",
    redirects: "1",
    titles: title,
  });
  const page = Object.values(data.query?.pages ?? {})[0];
  return { title: page?.title ?? title, extract: page?.extract ?? "" };
}

function hits(hay, needles) {
  const h = hay.toLowerCase();
  return needles.some((n) => h.includes(n));
}

const treeAccept = ["tree", "trees", "conifer", "deciduous", "woody", "forest"];
const treeReject = ["automobile", "car manufacturer", "cigarette"];
const carAccept = ["automobile", "car", "vehicle", "automotive", "manufacturer"];

const ginkgo = await extractFor("Ginkgo tree");
const toyotaOnTrees = await extractFor("Toyota automobile manufacturer");

const ginkgoOk =
  hits(`${ginkgo.title} ${ginkgo.extract}`, treeAccept) &&
  !hits(`${ginkgo.title} ${ginkgo.extract}`, treeReject);
const toyotaAsTree =
  hits(`${toyotaOnTrees.title} ${toyotaOnTrees.extract}`, treeAccept) &&
  !hits(`${toyotaOnTrees.title} ${toyotaOnTrees.extract}`, carAccept);

console.log("ginkgo", ginkgo.title, "ok?", ginkgoOk);
console.log("toyota-for-trees should fail relevance", {
  title: toyotaOnTrees.title,
  looksLikeTreeOnly: toyotaAsTree,
  hasCarHints: hits(`${toyotaOnTrees.title} ${toyotaOnTrees.extract}`, carAccept),
});

if (!ginkgoOk) {
  console.error("FAIL: Ginkgo should validate as a tree");
  process.exit(1);
}
if (toyotaAsTree) {
  console.error("FAIL: Toyota should not pass as tree-only");
  process.exit(1);
}
console.log("OK contribute relevance smoke");
