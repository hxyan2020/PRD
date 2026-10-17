import fs from "node:fs";
import path from "node:path";
import { listIdeas } from "../lib/db";
import { runScan } from "../lib/scanner";

const result = runScan({ source: "cli-seed" });

const outDir = path.join(process.cwd(), "public", "data");
const outFile = path.join(outDir, "ideas.json");
const ideas = listIdeas();
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  outFile,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      total: ideas.length,
      ideas,
    },
    null,
    2,
  ) + "\n",
);

console.log(JSON.stringify({ ...result, snapshot: outFile, snapshotTotal: ideas.length }, null, 2));
