import ingestJson from "../public/data/source-ingest.json";
import { DATA_SOURCES, type DataSource } from "./data-sources";
import {
  DAILY_SCAN_CRON_UTC,
  DAILY_SCAN_LOCAL_TIME,
  DAILY_SCAN_SOURCE,
  DAILY_SCAN_TIMEZONE,
  DAILY_SCAN_TIMEZONE_IANA,
} from "./daily-scan";

export type SourceIngestRow = {
  lastSourcedAt: string;
  ok: boolean;
  status?: number | null;
  error?: string | null;
};

export type SourceIngestFile = {
  schedule: {
    localTime: string;
    timezone: string;
    timezoneIana: string;
    cronUtc: string;
  };
  scannedAt: string;
  source: string;
  ideasTotal?: number;
  sources: Record<string, SourceIngestRow>;
};

const INGEST = ingestJson as SourceIngestFile;

export function readSourceIngest(): SourceIngestFile {
  return {
    schedule: {
      localTime: INGEST.schedule?.localTime ?? DAILY_SCAN_LOCAL_TIME,
      timezone: INGEST.schedule?.timezone ?? DAILY_SCAN_TIMEZONE,
      timezoneIana: INGEST.schedule?.timezoneIana ?? DAILY_SCAN_TIMEZONE_IANA,
      cronUtc: INGEST.schedule?.cronUtc ?? DAILY_SCAN_CRON_UTC,
    },
    scannedAt: INGEST.scannedAt ?? "",
    source: INGEST.source ?? DAILY_SCAN_SOURCE,
    ideasTotal: INGEST.ideasTotal ?? 0,
    sources: INGEST.sources ?? {},
  };
}

/** Merge the latest daily ingest timestamps onto the static source registry. */
export function applySourceIngest(
  sources: DataSource[] = DATA_SOURCES,
  ingest: SourceIngestFile = readSourceIngest(),
): DataSource[] {
  return sources.map((source) => {
    const row = ingest.sources[source.id];
    if (!row?.lastSourcedAt) return source;
    return {
      ...source,
      lastSourcedAt: row.lastSourcedAt,
    };
  });
}

export function liveDataSources(): DataSource[] {
  return applySourceIngest(DATA_SOURCES);
}
