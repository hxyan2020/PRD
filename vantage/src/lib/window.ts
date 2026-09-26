import type { WindowKind } from "./types";

export interface ScanWindow {
  kind: WindowKind;
  label: string;
  start: Date;
  end: Date;
}

const FRIDAY = 5;
const MONDAY = 1;
const MS_HOUR = 60 * 60 * 1000;
const MS_DAY = 24 * MS_HOUR;

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function utcFridayOfWeekend(monday: Date): Date {
  const friday = startOfUtcDay(monday);
  friday.setUTCDate(friday.getUTCDate() - 3);
  return friday;
}

/**
 * Daily window is the last 24 hours.
 * Monday reports cover since last Friday's scan (or Friday 00:00 UTC if unknown),
 * so the weekend is not dropped.
 */
export function computeScanWindow(
  now: Date = new Date(),
  lastFridayScanAt?: string | null,
): ScanWindow {
  const end = new Date(now);

  if (end.getUTCDay() === MONDAY) {
    let start: Date;
    if (lastFridayScanAt) {
      const parsed = new Date(lastFridayScanAt);
      if (!Number.isNaN(parsed.getTime()) && parsed.getUTCDay() === FRIDAY) {
        start = parsed;
      } else if (!Number.isNaN(parsed.getTime()) && parsed < end) {
        const friday = utcFridayOfWeekend(end);
        start = parsed < friday ? parsed : friday;
      } else {
        start = utcFridayOfWeekend(end);
      }
    } else {
      start = utcFridayOfWeekend(end);
    }

    return {
      kind: "weekend",
      label: "Friday–Monday weekend window",
      start,
      end,
    };
  }

  return {
    kind: "daily",
    label: "Last 24 hours",
    start: new Date(end.getTime() - MS_DAY),
    end,
  };
}

export function inWindow(publishedAt: Date, window: ScanWindow): boolean {
  return publishedAt >= window.start && publishedAt <= window.end;
}

export function previousFridayScan(generatedAt?: string | null): string | null {
  if (!generatedAt) return null;
  const date = new Date(generatedAt);
  if (Number.isNaN(date.getTime())) return null;
  return date.getUTCDay() === FRIDAY ? date.toISOString() : null;
}
