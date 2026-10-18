/**
 * Daily VentureScan ingest at 07:00 UTC+8:
 *  1. Probe every registered data source
 *  2. Refresh the startup-idea catalog snapshot
 *  3. Persist ingest timestamps for the Sources desk
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { DATA_SOURCES } from "../lib/data-sources";
import {
  DAILY_SCAN_CRON_UTC,
  DAILY_SCAN_LOCAL_TIME,
  DAILY_SCAN_SOURCE,
  DAILY_SCAN_TIMEZONE,
  DAILY_SCAN_TIMEZONE_IANA,
  dailyScanSchedule,
} from "../lib/daily-scan";
import { countIdeas, listIdeas } from "../lib/db";
import { ensureSeeded, runScan } from "../lib/scanner";
import type { SourceIngestFile, SourceIngestRow } from "../lib/source-ingest";

const root = path.join(import.meta.dirname, "..");
const outDir = path.join(root, "public", "data");
const ingestPath = path.join(outDir, "source-ingest.json");
const ideasPath = path.join(outDir, "ideas.json");

const UA =
  "Mozilla/5.0 (compatible; VentureScanDailyBot/1.0; +https://hxyan2020.github.io/PRD/venture-scan/)";

async function probeSource(url: string): Promise<Omit<SourceIngestRow, "lastSourcedAt">> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12_000);
  try {
    let res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: ctrl.signal,
      headers: { "user-agent": UA, accept: "*/*" },
    });
    // Some desks reject HEAD — fall back to a light GET.
    if (res.status === 405 || res.status === 403 || res.status === 501) {
      res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: ctrl.signal,
        headers: { "user-agent": UA, accept: "text/html,*/*" },
      });
    }
    const ok = res.ok || (res.status >= 200 && res.status < 400);
    return { ok, status: res.status, error: ok ? null : `HTTP ${res.status}` };
  } catch (err) {
    return {
      ok: false,
      status: null,
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const scannedAt = new Date().toISOString();
  const schedule = dailyScanSchedule();
  console.log(
    JSON.stringify(
      {
        phase: "start",
        schedule,
        cronUtc: DAILY_SCAN_CRON_UTC,
        scannedAt,
      },
      null,
      2,
    ),
  );

  const previous: SourceIngestFile | null = existsSync(ingestPath)
    ? (JSON.parse(readFileSync(ingestPath, "utf8")) as SourceIngestFile)
    : null;

  const sources: SourceIngestFile["sources"] = {};
  let okCount = 0;
  for (const source of DATA_SOURCES) {
    process.stdout.write(`probe ${source.id} … `);
    const result = await probeSource(source.url);
    const prevStamp =
      previous?.sources?.[source.id]?.lastSourcedAt ?? source.lastSourcedAt;
    sources[source.id] = {
      // Only advance “last sourced” when the desk responded — keep prior stamp on failure.
      lastSourcedAt: result.ok ? scannedAt : prevStamp,
      ok: result.ok,
      status: result.status ?? null,
      error: result.error ?? null,
    };
    if (result.ok) okCount += 1;
    console.log(result.ok ? `ok ${result.status}` : `FAIL ${result.error}`);
  }

  ensureSeeded();
  const scan = runScan({ source: DAILY_SCAN_SOURCE, replace: true });
  const ideas = listIdeas();
  const active = ideas.filter((i) => (i.status ?? "active") === "active").length;
  const archived = ideas.length - active;

  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    ideasPath,
    JSON.stringify(
      {
        generatedAt: scannedAt,
        total: ideas.length,
        active,
        archived,
        schedule,
        source: DAILY_SCAN_SOURCE,
        ideas,
      },
      null,
      2,
    ) + "\n",
  );

  const ingest: SourceIngestFile = {
    schedule: {
      localTime: DAILY_SCAN_LOCAL_TIME,
      timezone: DAILY_SCAN_TIMEZONE,
      timezoneIana: DAILY_SCAN_TIMEZONE_IANA,
      cronUtc: DAILY_SCAN_CRON_UTC,
    },
    scannedAt,
    source: DAILY_SCAN_SOURCE,
    ideasTotal: ideas.length,
    sources,
  };
  writeFileSync(ingestPath, JSON.stringify(ingest, null, 2) + "\n");

  console.log(
    JSON.stringify(
      {
        phase: "done",
        schedule: schedule.label,
        sourcesProbed: DATA_SOURCES.length,
        sourcesOk: okCount,
        ideas: ideas.length,
        dbCount: countIdeas(),
        inserted: scan.inserted,
        updated: scan.updated,
        ingestPath,
        ideasPath,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
