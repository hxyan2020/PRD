import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildImpact } from "../src/lib/classify";
import { clusterNewsItems } from "../src/lib/clusterNews";
import { repairNewsItems } from "../src/lib/repairNews";
import type { Briefing } from "../src/lib/types";
import { attachChinese } from "./localize";

const FILE = path.resolve(__dirname, "../data/latest.json");

async function main() {
  const briefing = JSON.parse(await readFile(FILE, "utf8")) as Briefing;
  const previous = structuredClone(briefing);
  briefing.items = clusterNewsItems(repairNewsItems(briefing.items));
  briefing.meta.itemCount = briefing.items.length;
  for (const item of briefing.items) {
    item.captionZh ??= "";
    item.keyPointsZh ??= [];
    if (item.impact) {
      item.impact = buildImpact(item.impact.sectors, item.impact.assets);
    }
  }
  await attachChinese(briefing.items, previous);
  await writeFile(FILE, JSON.stringify(briefing, null, 2));
  const done = briefing.items.filter((item) => item.captionZh).length;
  console.log(`Translated captions: ${done}/${briefing.items.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
