/** Build / docs finish stamp — shown on admin home footer. */

/** ISO-8601 timestamp when the docs/admin parity pack was last finished. */
export const FINISHED_AT = "2026-10-05T21:36:32.000Z";

export function finishedAtLabel(locale: "en" | "zh-Hant" = "en") {
  const d = new Date(FINISHED_AT);
  const iso = Number.isNaN(d.getTime()) ? FINISHED_AT : d.toISOString();
  return locale === "zh-Hant" ? `文件對齊完成於 ${iso}` : `Docs parity finished at ${iso}`;
}
