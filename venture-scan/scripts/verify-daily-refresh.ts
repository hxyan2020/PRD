/**
 * Assert daily-refresh artifacts are present and coherent after `scan:daily`.
 * Used by CI so a silent no-op cannot look like a successful refresh.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  DAILY_SCAN_CRON_UTC,
  DAILY_SCAN_LOCAL_TIME,
  DAILY_SCAN_SOURCE,
  DAILY_SCAN_TIMEZONE,
} from "../lib/daily-scan";
import type { SourceIngestFile } from "../lib/source-ingest";

const root = path.join(import.meta.dirname, "..");
const ideasPath = path.join(root, "public/data/ideas.json");
const ingestPath = path.join(root, "public/data/source-ingest.json");
/** Fail if the last scan is older than this (CI runs immediately after scan). */
const MAX_AGE_MS = 30 * 60 * 1000;

function fail(msg: string): never {
  console.error(`verify:daily FAILED — ${msg}`);
  process.exit(1);
}

if (!existsSync(ideasPath)) fail(`missing ${ideasPath}`);
if (!existsSync(ingestPath)) fail(`missing ${ingestPath}`);

const ideas = JSON.parse(readFileSync(ideasPath, "utf8")) as {
  generatedAt?: string;
  total?: number;
  active?: number;
  archived?: number;
  source?: string;
  schedule?: { cronUtc?: string; localTime?: string };
  ideas?: unknown[];
};

const ingest = JSON.parse(readFileSync(ingestPath, "utf8")) as SourceIngestFile;

if (!ingest.scannedAt) fail("source-ingest.json missing scannedAt");
if (!ideas.generatedAt) fail("ideas.json missing generatedAt");

const scannedMs = Date.parse(ingest.scannedAt);
if (Number.isNaN(scannedMs)) fail(`invalid scannedAt ${ingest.scannedAt}`);
const age = Date.now() - scannedMs;
if (age > MAX_AGE_MS) {
  fail(
    `ingest scannedAt is stale (${Math.round(age / 60000)}m old). Run npm run scan:daily first.`,
  );
}

if (ingest.schedule?.cronUtc !== DAILY_SCAN_CRON_UTC) {
  fail(`ingest cronUtc ${ingest.schedule?.cronUtc} ≠ ${DAILY_SCAN_CRON_UTC}`);
}
if (ingest.schedule?.localTime !== DAILY_SCAN_LOCAL_TIME) {
  fail(`ingest localTime ${ingest.schedule?.localTime} ≠ ${DAILY_SCAN_LOCAL_TIME}`);
}
if (ingest.schedule?.timezone !== DAILY_SCAN_TIMEZONE) {
  fail(`ingest timezone ${ingest.schedule?.timezone} ≠ ${DAILY_SCAN_TIMEZONE}`);
}
if (ingest.source !== DAILY_SCAN_SOURCE) {
  fail(`ingest source ${ingest.source} ≠ ${DAILY_SCAN_SOURCE}`);
}

const ideaCount = Array.isArray(ideas.ideas) ? ideas.ideas.length : 0;
if (ideaCount < 1) fail("ideas.json has no ideas");
if (ideas.total !== ideaCount) fail(`ideas.total ${ideas.total} ≠ ideas.length ${ideaCount}`);
if (ingest.ideasTotal !== ideaCount) {
  fail(`ingest.ideasTotal ${ingest.ideasTotal} ≠ ideas.length ${ideaCount}`);
}
if ((ideas.active ?? 0) + (ideas.archived ?? 0) !== ideaCount) {
  fail(
    `active (${ideas.active}) + archived (${ideas.archived}) ≠ total (${ideaCount})`,
  );
}

const sourceRows = Object.values(ingest.sources ?? {});
if (sourceRows.length < 1) fail("source-ingest has no sources");
const okCount = sourceRows.filter((s) => s.ok).length;
if (okCount < 1) fail("no data sources responded ok");

console.log(
  JSON.stringify(
    {
      ok: true,
      scannedAt: ingest.scannedAt,
      ageMinutes: Math.round(age / 60000),
      ideas: ideaCount,
      active: ideas.active,
      archived: ideas.archived,
      sourcesOk: okCount,
      sourcesTotal: sourceRows.length,
      cronUtc: ingest.schedule.cronUtc,
      localTime: `${ingest.schedule.localTime} ${ingest.schedule.timezone}`,
    },
    null,
    2,
  ),
);
