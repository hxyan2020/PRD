/**
 * Daily catalog refresh clock: 07:00 Asia/Shanghai (UTC+8) = 23:00 UTC.
 * GitHub Actions cron uses UTC only — keep these in lockstep.
 */
export const DAILY_SCAN_LOCAL_TIME = "07:00";
export const DAILY_SCAN_TIMEZONE = "UTC+8";
export const DAILY_SCAN_TIMEZONE_IANA = "Asia/Shanghai";
/** GitHub Actions `schedule.cron` (minute hour day month weekday) in UTC. */
export const DAILY_SCAN_CRON_UTC = "0 23 * * *";
export const DAILY_SCAN_SOURCE = "daily-0700-utc8";

export type DailyScanSchedule = {
  localTime: typeof DAILY_SCAN_LOCAL_TIME;
  timezone: typeof DAILY_SCAN_TIMEZONE;
  timezoneIana: typeof DAILY_SCAN_TIMEZONE_IANA;
  cronUtc: typeof DAILY_SCAN_CRON_UTC;
  label: string;
};

export function dailyScanSchedule(): DailyScanSchedule {
  return {
    localTime: DAILY_SCAN_LOCAL_TIME,
    timezone: DAILY_SCAN_TIMEZONE,
    timezoneIana: DAILY_SCAN_TIMEZONE_IANA,
    cronUtc: DAILY_SCAN_CRON_UTC,
    label: `Every day at ${DAILY_SCAN_LOCAL_TIME} ${DAILY_SCAN_TIMEZONE}`,
  };
}
