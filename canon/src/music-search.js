import { extrasFromItunes, marketForCountry } from "./beyond.js";
import {
  ALL_COUNTRIES,
  ALL_ERAS,
  ALL_GENRES,
  buildOutsideTerm,
  hasOutsideSearch,
  itunesSearchUrl,
  MUSIC_SEARCH_PATH,
} from "./search.js";

function filtersFrom(input) {
  if (typeof input === "string") return { query: input, genre: "", era: "", country: "" };
  return {
    query: String(input?.query || "").trim(),
    genre: String(input?.genre || "").trim(),
    era: String(input?.era || "").trim(),
    country: String(input?.country || "").trim(),
  };
}

export function outsideSearchParams(input) {
  const filters = filtersFrom(input);
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.genre && filters.genre !== ALL_GENRES) params.set("genre", filters.genre);
  if (filters.era && filters.era !== ALL_ERAS) params.set("era", filters.era);
  if (filters.country && filters.country !== ALL_COUNTRIES) params.set("country", filters.country);
  return params;
}

export async function searchOutsideMusic(input, { fetchFn = fetch } = {}) {
  const filters = filtersFrom(input);
  if (!hasOutsideSearch(filters)) return { ok: false, error: "short_query", tracks: [] };

  try {
    const response = await fetchFn(`${MUSIC_SEARCH_PATH}?${outsideSearchParams(filters)}`);
    if (response.ok) {
      const data = await response.json();
      if (data && Array.isArray(data.tracks)) {
        return { ok: true, source: data.source || "api", tracks: data.tracks };
      }
    }
  } catch {
    /* GitHack and local builds can fall back to a public catalog search. */
  }

  try {
    const term = buildOutsideTerm(filters);
    const market = marketForCountry(filters.country);
    const response = await fetchFn(itunesSearchUrl(term, 12, market));
    const payload = await response.json();
    return {
      ok: true,
      source: "itunes",
      tracks: extrasFromItunes(payload, {
        hints: {
          genre: filters.genre !== ALL_GENRES ? filters.genre : "",
          country: filters.country !== ALL_COUNTRIES ? filters.country : "",
        },
      }),
    };
  } catch {
    return { ok: false, error: "unavailable", tracks: [] };
  }
}

export async function searchMusicByName(query, options) {
  return searchOutsideMusic({ query }, options);
}
