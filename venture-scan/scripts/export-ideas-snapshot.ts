/**
 * Persist the full sourced catalog into SQLite, then write a JSON snapshot
 * for static hosts (GitHub Pages) that cannot open the DB at runtime.
 * Includes archived historical ideas so search can still find them.
 */
import fs from "node:fs";
import path from "node:path";
import { isActiveIdea, isArchivedIdea } from "../lib/archived-ideas";
import { countIdeas, listIdeas } from "../lib/db";
import { ensureSeeded, runScan } from "../lib/scanner";

const outDir = path.join(process.cwd(), "public", "data");
const outFile = path.join(outDir, "ideas.json");

ensureSeeded();
// Always refresh payloads so the snapshot matches the current catalog.
runScan({ source: "snapshot-export", replace: true });

const ideas = listIdeas();
const active = ideas.filter(isActiveIdea).length;
const archived = ideas.filter(isArchivedIdea).length;
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  outFile,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      total: ideas.length,
      active,
      archived,
      ideas,
    },
    null,
    2,
  ) + "\n",
);

console.log(
  JSON.stringify(
    {
      dbCount: countIdeas(),
      snapshot: outFile,
      total: ideas.length,
      active,
      archived,
    },
    null,
    2,
  ),
);
