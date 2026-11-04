/** Build month labels for a 0–100 Google Trends sparkline ending on the catalog snapshot date. */
export function sparklineMonthLabels(count: number, asOf: string): string[] {
  if (count < 1) return [];
  const end = new Date(`${asOf}T00:00:00Z`);
  if (Number.isNaN(end.getTime())) return [];
  const labels: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - i, 1));
    labels.push(
      d.toLocaleString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" }),
    );
  }
  return labels;
}
