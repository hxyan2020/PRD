import { ScanLogView } from "@/components/ScanLogView";
import { listScanRuns } from "@/lib/db";
import {
  DAILY_SCAN_CRON_UTC,
  DAILY_SCAN_LABEL,
  DAILY_SCAN_LOCAL_TIME,
  DAILY_SCAN_TIMEZONE,
  ensureSeeded,
} from "@/lib/scanner";

export const dynamic = "force-dynamic";

export default async function ScanLogPage() {
  await ensureSeeded();
  const runs = await listScanRuns(90);

  return (
    <ScanLogView
      runs={runs}
      schedule={{
        label: DAILY_SCAN_LABEL,
        localTime: DAILY_SCAN_LOCAL_TIME,
        timezone: DAILY_SCAN_TIMEZONE,
        cronUtc: DAILY_SCAN_CRON_UTC,
      }}
    />
  );
}
