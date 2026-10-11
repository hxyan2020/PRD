import { COUNTRY_TO_REGION } from "./types";

/**
 * Best-effort Google Trends overlay.
 * The unofficial endpoint is rate-limited; callers must keep snapshot data as source of truth.
 */
export async function fetchTrendsByCountry(keyword: string): Promise<Record<string, number> | null> {
  const geos = Object.keys(COUNTRY_TO_REGION);
  try {
    const url = `https://trends.google.com/trends/api/explore?hl=en-US&tz=0&req=${encodeURIComponent(
      JSON.stringify({
        comparisonItem: [{ keyword, geo: "", time: "today 12-m" }],
        category: 0,
        property: "",
      }),
    )}`;
    const res = await fetch(url, {
      headers: { "user-agent": "OriginRadar/0.1" },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (!text.includes("widgets")) return null;
    // Explore tokens vary; without a stable token we cannot hydrate comparedgeo.
    // Keep the hook so a later API key / SerpAPI / DataForSEO adapter can drop in.
    void geos;
    return null;
  } catch {
    return null;
  }
}
