import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  DAILY_SCAN_CRON_UTC,
  DAILY_SCAN_LOCAL_TIME,
  DAILY_SCAN_TIMEZONE,
  dailyScanSchedule,
} from "./daily-scan";
import { applySourceIngest, liveDataSources, readSourceIngest } from "./source-ingest";
import { DATA_SOURCES } from "./data-sources";

describe("daily scan schedule", () => {
  it("locks 07:00 UTC+8 to the GitHub Actions UTC cron", () => {
    const schedule = dailyScanSchedule();
    expect(schedule.localTime).toBe("07:00");
    expect(schedule.timezone).toBe("UTC+8");
    expect(schedule.cronUtc).toBe("0 23 * * *");
    expect(DAILY_SCAN_LOCAL_TIME).toBe("07:00");
    expect(DAILY_SCAN_TIMEZONE).toBe("UTC+8");
    expect(DAILY_SCAN_CRON_UTC).toBe("0 23 * * *");
  });

  it("ships a workflow cron matching the schedule constant", () => {
    const yml = readFileSync(
      path.join(process.cwd(), "..", ".github/workflows/venture-scan-daily.yml"),
      "utf8",
    );
    expect(yml).toContain(`cron: "${DAILY_SCAN_CRON_UTC}"`);
    expect(yml).toContain("npm run scan:daily");
    expect(yml).toContain("07:00");
  });

  it("applies ingest timestamps onto live data sources", () => {
    const stamped = "2026-10-18T23:00:00.000Z";
    const merged = applySourceIngest(DATA_SOURCES, {
      schedule: {
        localTime: DAILY_SCAN_LOCAL_TIME,
        timezone: DAILY_SCAN_TIMEZONE,
        timezoneIana: "Asia/Shanghai",
        cronUtc: DAILY_SCAN_CRON_UTC,
      },
      scannedAt: stamped,
      source: "daily-0700-utc8",
      sources: {
        techcrunch: { lastSourcedAt: stamped, ok: true, status: 200, error: null },
      },
    });
    expect(merged.find((s) => s.id === "techcrunch")?.lastSourcedAt).toBe(stamped);
    expect(liveDataSources().length).toBe(DATA_SOURCES.length);
    expect(readSourceIngest().schedule.cronUtc).toBe(DAILY_SCAN_CRON_UTC);
  });
});
