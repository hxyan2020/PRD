export function parseLooseDate(value: string): Date | null {
  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct;

  const fca = value.match(
    /([A-Za-z]+ \d{1,2}, \d{4})\s*[-–]\s*(\d{1,2}:\d{2})/,
  );
  if (fca) {
    const parsed = new Date(`${fca[1]} ${fca[2]} UTC`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  const dayMonth = value.match(/(\d{1,2} [A-Za-z]+ \d{4})(?:\s+(\d{1,2}:\d{2}))?/);
  if (dayMonth) {
    const parsed = new Date(`${dayMonth[1]} ${dayMonth[2] ?? "00:00"} UTC`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return null;
}
