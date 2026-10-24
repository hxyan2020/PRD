import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildImpact } from "../src/lib/classify";
import { repairNewsItems } from "../src/lib/repairNews";
import type { Briefing, Entity } from "../src/lib/types";
import { attachChinese } from "./localize";

const DATA = path.resolve(__dirname, "../data");
const FILE = path.join(DATA, "latest.json");

async function loadNames(): Promise<Record<string, string>> {
  const files = ["banks.json", "brokers.json", "exchanges.json"];
  const names: Record<string, string> = {};
  for (const file of files) {
    const rows = JSON.parse(await readFile(path.join(DATA, file), "utf8")) as Entity[];
    for (const row of rows) names[row.id] = row.name;
  }
  return names;
}

async function main() {
  const briefing = JSON.parse(await readFile(FILE, "utf8")) as Briefing;
  const previous = structuredClone(briefing);
  briefing.items = repairNewsItems(briefing.items, await loadNames());
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
