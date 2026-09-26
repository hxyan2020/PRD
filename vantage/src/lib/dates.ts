const MONTHS: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

function asDate(value: string): Date | null {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function fromParts(
  year: number,
  monthIndex: number,
  day: number,
  hours = 0,
  minutes = 0,
  seconds = 0,
): Date | null {
  if (monthIndex < 0 || monthIndex > 11 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, monthIndex, day, hours, minutes, seconds));
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseOffset(value?: string): number | null {
  if (!value) return 0;
  const match = value.match(/^([+-])(\d{2}):?(\d{2})$/);
  if (!match) return null;
  const minutes = Number(match[2]) * 60 + Number(match[3]);
  return match[1] === "+" ? -minutes : minutes;
}

export function parseLooseDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const direct = asDate(trimmed);
  if (direct) return direct;

  const isoish = trimmed.match(
    /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?)(Z|[+-]\d{2}:?\d{2})?/,
  );
  if (isoish) {
    const parsed = asDate(`${isoish[1]}${isoish[2] ?? "Z"}`);
    if (parsed) return parsed;
  }

  const fca = trimmed.match(
    /([A-Za-z]+ \d{1,2}, \d{4})\s*[-–]\s*(\d{1,2}:\d{2})/,
  );
  if (fca) {
    const parsed = asDate(`${fca[1]} ${fca[2]} UTC`);
    if (parsed) return parsed;
  }

  // SEBI / EU: "16 Sep, 2026 +0530" or "16 Sep 2026 20:00:02 +0530"
  const dayMonth = trimmed.match(
    /(\d{1,2})\s+([A-Za-z]{3,9}),?\s+(\d{4})(?:\s+(\d{1,2}:\d{2}(?::\d{2})?))?(?:\s+([+-]\d{2}:?\d{2}))?/,
  );
  if (dayMonth) {
    const month = MONTHS[dayMonth[2].toLowerCase()];
    if (month !== undefined) {
      const [hours, minutes, seconds] = (dayMonth[4] ?? "00:00:00")
        .split(":")
        .map((part) => Number(part));
      const date = fromParts(
        Number(dayMonth[3]),
        month,
        Number(dayMonth[1]),
        hours || 0,
        minutes || 0,
        seconds || 0,
      );
      if (date) {
        const offset = parseOffset(dayMonth[5]);
        if (offset !== null) {
          date.setUTCMinutes(date.getUTCMinutes() + offset);
        }
        return date;
      }
    }
  }

  return null;
}

export function extractEmbeddedDate(text: string): Date | null {
  if (!text) return null;

  const datetimeAttr = text.match(/datetime\s*=\s*["']([^"']+)["']/i);
  if (datetimeAttr) {
    const parsed = parseLooseDate(datetimeAttr[1]);
    if (parsed) return parsed;
  }

  const iso = text.match(
    /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})/,
  );
  if (iso) {
    const parsed = parseLooseDate(iso[0]);
    if (parsed) return parsed;
  }

  return parseLooseDate(text);
}

export function extractUrlDate(
  url: string,
  lastBuildDate: Date | null = null,
): Date | null {
  if (!url) return null;

  const withDay = url.match(/\/(20\d{2})\/(\d{1,2})\/(\d{1,2})(?:\/|$|\?)/);
  if (withDay) {
    return fromParts(
      Number(withDay[1]),
      Number(withDay[2]) - 1,
      Number(withDay[3]),
    );
  }

  const monthOnly = url.match(/\/(20\d{2})\/(\d{1,2})(?:\/|$|\?)/);
  if (monthOnly) {
    const year = Number(monthOnly[1]);
    const month = Number(monthOnly[2]) - 1;
    if (
      lastBuildDate &&
      lastBuildDate.getUTCFullYear() === year &&
      lastBuildDate.getUTCMonth() === month
    ) {
      return lastBuildDate;
    }
    return fromParts(year, month, 1);
  }

  const namedMonth = url.match(
    /\/(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*-?(20\d{2})(?:\/|$|\?|_)/i,
  );
  if (namedMonth) {
    const month = MONTHS[namedMonth[1].toLowerCase()];
    const year = Number(namedMonth[2]);
    if (month !== undefined) {
      if (
        lastBuildDate &&
        lastBuildDate.getUTCFullYear() === year &&
        lastBuildDate.getUTCMonth() === month
      ) {
        return lastBuildDate;
      }
      return fromParts(year, month, 1);
    }
  }

  return null;
}
