/**
 * Persist the full sourced catalog into SQLite, then write a JSON snapshot
 * for static hosts (GitHub Pages) that cannot open the DB at runtime.
 * Includes archived historical ideas so search can still find them.
 *
 * Preserves daily-scan schedule metadata from source-ingest.json so a later
 * `build:static` does not erase the 07:00 UTC+8 refresh stamp.
 */
import fs from "node:fs";
import path from "node:path";
import { isActiveIdea, isArchivedIdea } from "../lib/archived-ideas";
import {
  DAILY_SCAN_SOURCE,
  dailyScanSchedule,
} from "../lib/daily-scan";
import { countIdeas, listIdeas } from "../lib/db";
import { ensureSeeded } from "../lib/scanner";
import { readSourceIngest } from "../lib/source-ingest";

const outDir = path.join(process.cwd(), "public", "data");
const outFile = path.join(outDir, "ideas.json");

ensureSeeded();

const ideas = listIdeas();
const active = ideas.filter(isActiveIdea).length;
const archived = ideas.filter(isArchivedIdea).length;
const ingest = readSourceIngest();
const schedule = {
  localTime: ingest.schedule.localTime,
  timezone: ingest.schedule.timezone,
  timezoneIana: ingest.schedule.timezoneIana,
  cronUtc: ingest.schedule.cronUtc,
  label: dailyScanSchedule().label,
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  outFile,
  JSON.stringify(
    {
      generatedAt: ingest.scannedAt || new Date().toISOString(),
      total: ideas.length,
      active,
      archived,
      schedule,
      source: ingest.source || DAILY_SCAN_SOURCE,
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
      source: ingest.source || DAILY_SCAN_SOURCE,
      scannedAt: ingest.scannedAt,
    },
    null,
    2,
  ),
);
