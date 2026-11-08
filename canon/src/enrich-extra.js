import {
  fallbackPersonAnecdote,
  fallbackSongAnecdote,
  isPlaceholderCredit,
  pickAnecdote,
  uniqueImages,
} from "./portraits.js";

const NATIONALITY = {
  american: "United States",
  british: "United Kingdom",
  english: "United Kingdom",
  scottish: "United Kingdom",
  welsh: "United Kingdom",
  irish: "Ireland",
  canadian: "Canada",
  french: "France",
  german: "Germany",
  italian: "Italy",
  spanish: "Spain",
  portuguese: "Portugal",
  dutch: "Netherlands",
  swedish: "Sweden",
  norwegian: "Norway",
  danish: "Denmark",
  finnish: "Finland",
  australian: "Australia",
  japanese: "Japan",
  korean: "South Korea",
  chinese: "China",
  indian: "India",
  brazilian: "Brazil",
  mexican: "Mexico",
  argentine: "Argentina",
  colombian: "Colombia",
  nigerian: "Nigeria",
  ghanaian: "Ghana",
  jamaican: "Jamaica",
  cuban: "Cuba",
  russian: "Russia",
  polish: "Poland",
  turkish: "Turkey",
  egyptian: "Egypt",
  southafrican: "South Africa",
};

const BAND_HINT = /\b(band|group|duo|trio|quartet|quintet|orchestra|choir|ensemble)\b/i;
const PERSON_HINT = /\b(singer|songwriter|rapper|musician|vocalist|artist)\b/i;

export function blankCredit(value) {
  return isPlaceholderCredit(value);
}

export function parseNationalityCountry(text) {
  const match = String(text || "").match(
    /\b(American|British|English|Scottish|Welsh|Irish|Canadian|French|German|Italian|Spanish|Portuguese|Dutch|Swedish|Norwegian|Danish|Finnish|Australian|Japanese|Korean|Chinese|Indian|Brazilian|Mexican|Argentine|Colombian|Nigerian|Ghanaian|Jamaican|Cuban|Russian|Polish|Turkish|Egyptian|South African)\b/i,
  );
  if (!match) return "";
  const key = match[1].toLowerCase().replace(/\s+/g, "");
  return NATIONALITY[key] || "";
}

export function parseWrittenBy(text) {
  const match = String(text || "").match(
    /\b(?:written(?:\s+and\s+produced)?|composed|penned|songwritten)\s+by\s+(?:vocalist\s+|singer\s+)?([^.,;(]+)/i,
  );
  const name = String(match?.[1] || "")
    .replace(/\s+/g, " ")
    .replace(/\b(and produced|and the band)\b.*$/i, "")
    .trim();
  return name.length >= 2 && name.length <= 80 ? name : "";
}

export function looksLikeBand(text) {
  return BAND_HINT.test(String(text || ""));
}

export function looksLikePerson(text) {
  return PERSON_HINT.test(String(text || "")) && !looksLikeBand(text);
}

function fillIfBlank(current, next) {
  const value = String(next || "").replace(/\s+/g, " ").trim();
  if (!value) return current;
  return blankCredit(current) ? value : current;
}

export function applyExtraFacts(track, facts = {}) {
  const next = { ...track };
  const blob = `${facts.description || ""} ${facts.extract || ""}`;
  const country = facts.country || parseNationalityCountry(blob);
  const writer = facts.writer || parseWrittenBy(blob);
  const performer = String(facts.performer || facts.artist || "").trim();
  const asBand = facts.asBand ?? (looksLikeBand(blob) || looksLikeBand(facts.description));

  if (performer) {
    if (asBand || looksLikeBand(performer)) {
      next.band = fillIfBlank(next.band, performer);
      if (blankCredit(next.singer) || next.singer === performer) next.singer = "—";
    } else if (looksLikePerson(blob) || !asBand) {
      next.singer = fillIfBlank(next.singer, performer);
      if (next.band === performer) next.band = "—";
    }
  }

  next.composer = fillIfBlank(next.composer, facts.composer || writer || performer);
  next.writer = fillIfBlank(next.writer, writer || facts.composer || performer);
  next.releaseCountry = fillIfBlank(next.releaseCountry, country);
  if (facts.year && !next.year) next.year = facts.year;
  if (facts.genre && (blankCredit(next.genre) || next.genre === "Spotify")) {
    next.genre = facts.genre;
    next.genres = [facts.genre];
  }
  if (facts.label && (blankCredit(next.musicCompany) || next.musicCompany === next.name)) {
    next.musicCompany = facts.label;
  }
  if (facts.wikipediaUrl && !next.wikipediaUrl) next.wikipediaUrl = facts.wikipediaUrl;
  if (facts.anecdote && !next.anecdote) next.anecdote = facts.anecdote;
  if (facts.whyShortlisted && !next.whyShortlisted) next.whyShortlisted = facts.whyShortlisted;
  if (facts.people && Object.keys(facts.people).length) {
    next.people = { ...(next.people || {}), ...facts.people };
  }
  next.enriched = true;
  return next;
}

function wikiApi(path) {
  return `https://en.wikipedia.org/w/api.php?${path}&format=json&origin=*`;
}

async function readJson(url, fetchFn) {
  try {
    const response = await fetchFn(url);
    if (!response?.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export function pickWikiTitle(hits, name, artist) {
  const want = String(name || "").toLowerCase();
  const who = String(artist || "").toLowerCase();
  const rows = hits || [];
  const scored = rows
    .map((row) => {
      const title = String(row?.title || "").toLowerCase();
      let score = 0;
      if (want && title === want) score += 8;
      if (want && title.includes(want.slice(0, 18))) score += 4;
      if (who && title.includes(who.slice(0, 18))) score += 3;
      if (/\bsong\b/i.test(row?.title || "")) score += 2;
      if (/\bband\b/i.test(row?.title || "")) score += 1;
      if (/\balbum\b/i.test(row?.title || "")) score -= 2;
      if (/disambiguation/i.test(row?.title || "")) score -= 8;
      return { title: row.title, score };
    })
    .sort((a, b) => b.score - a.score);
  return scored[0]?.score > 0 ? scored[0].title : rows[0]?.title || "";
}

function yearFromText(value) {
  const match = String(value || "").match(/\b(1[5-9]\d{2}|20[0-2]\d)\b/);
  return match ? Number(match[1]) : 0;
}

function claimIds(entity, prop) {
  return (entity?.claims?.[prop] || [])
    .map((claim) => claim?.mainsnak?.datavalue?.value?.id)
    .filter(Boolean);
}

function claimYear(entity) {
  const times = [...(entity?.claims?.P577 || []), ...(entity?.claims?.P571 || [])]
    .map((claim) => String(claim?.mainsnak?.datavalue?.value?.time || ""))
    .map((time) => yearFromText(time))
    .filter(Boolean);
  return times.length ? Math.min(...times) : 0;
}

async function wikiSearch(query, fetchFn) {
  const data = await readJson(
    wikiApi(`action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=6&srnamespace=0`),
    fetchFn,
  );
  return data?.query?.search || [];
}

async function wikiSummary(title, fetchFn) {
  if (!title) return null;
  const data = await readJson(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
    fetchFn,
  );
  if (!data || data.type === "disambiguation") return null;
  return data;
}

async function wikiMedia(title, fetchFn) {
  const data = await readJson(
    `https://en.wikipedia.org/api/rest_v1/page/media-list/${encodeURIComponent(title)}`,
    fetchFn,
  );
  const images = [];
  for (const item of data?.items || []) {
    if (item?.type && item.type !== "image") continue;
    const src =
      item?.srcset?.[item.srcset.length - 1]?.src ||
      item?.original?.source ||
      item?.thumbnail?.source ||
      "";
    const abs = String(src || "").startsWith("//") ? `https:${src}` : String(src || "");
    if (abs) images.push({ src: abs.split("?")[0], alt: String(item.title || title).replace(/^File:/i, "") });
  }
  return uniqueImages(images, 6);
}

async function wikidataEntities(ids, fetchFn) {
  const list = [...new Set((ids || []).filter(Boolean))];
  if (!list.length) return {};
  const data = await readJson(
    `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${list.join("|")}&props=claims|labels&languages=en&format=json&origin=*`,
    fetchFn,
  );
  return data?.entities || {};
}

function labelOf(entities, id) {
  return entities?.[id]?.labels?.en?.value || "";
}

function factsFromEntity(entity, entities) {
  const idsFor = (prop) => claimIds(entity, prop);
  return {
    year: claimYear(entity),
    country: idsFor("P495").map((id) => labelOf(entities, id)).find(Boolean) || "",
    genre: idsFor("P136").map((id) => labelOf(entities, id)).filter(Boolean).slice(0, 3).join(" · "),
    label: idsFor("P264").map((id) => labelOf(entities, id)).filter(Boolean).join(" · "),
    performer: idsFor("P175").map((id) => labelOf(entities, id)).find(Boolean) || "",
    composer: idsFor("P86").map((id) => labelOf(entities, id)).filter(Boolean).join(" · "),
    writer: idsFor("P676").map((id) => labelOf(entities, id)).filter(Boolean).join(" · "),
    asBand: idsFor("P31").some((id) => id === "Q215380" || id === "Q5741069" || id === "Q9212979"),
  };
}

function artistNameOf(track) {
  if (!blankCredit(track.band)) return track.band;
  if (!blankCredit(track.singer)) return track.singer;
  return "";
}

function portraitFromSummary(name, summary, images, kind) {
  const extract = String(summary?.extract || "");
  const anecdote = pickAnecdote(extract, fallbackPersonAnecdote(name, kind));
  const lead = summary?.originalimage?.source || summary?.thumbnail?.source || "";
  const all = uniqueImages(
    [{ src: lead ? String(lead).split("?")[0] : "", alt: name }, ...images],
    6,
  );
  return { anecdote, images: all };
}

export async function enrichExtraTrack(track, { fetchFn = fetch } = {}) {
  if (!track?.extra) return { track, people: track?.people || {} };
  if (track.enriched) return { track, people: track.people || {} };

  try {
  const artist = artistNameOf(track);
  const songHits = await wikiSearch(`${track.name} ${artist} song`.trim(), fetchFn);
  const songTitle = pickWikiTitle(songHits, track.name, artist);
  const song = await wikiSummary(songTitle, fetchFn);

  const artistHits = await wikiSearch(`${artist} music`.trim(), fetchFn);
  const artistTitle = pickWikiTitle(artistHits, artist, "") || artist;
  const artistPage = (await wikiSummary(artistTitle, fetchFn)) || (await wikiSummary(artist, fetchFn));

  if (!song && !artistPage) {
    const next = applyExtraFacts(track, { anecdote: fallbackSongAnecdote(track) });
    return { track: next, people: {} };
  }

  const qids = [song?.wikibase_item, artistPage?.wikibase_item].filter(Boolean);
  const seed = await wikidataEntities(qids, fetchFn);
  const related = [];
  for (const entity of Object.values(seed)) {
    for (const prop of ["P86", "P676", "P175", "P495", "P264", "P136", "P31"]) {
      related.push(...claimIds(entity, prop));
    }
  }
  const entities = { ...seed, ...(await wikidataEntities(related, fetchFn)) };
  const songWd = factsFromEntity(seed[song?.wikibase_item] || {}, entities);
  const artistWd = factsFromEntity(seed[artistPage?.wikibase_item] || {}, entities);

  const extract = String(song?.extract || artistPage?.extract || "");
  const description = String(song?.description || artistPage?.description || "");
  const asBand = artistWd.asBand || looksLikeBand(`${description} ${extract} ${artistPage?.description || ""}`);
  const people = {};
  if (artist && artistPage) {
    const images = await wikiMedia(artistPage.title || artistTitle, fetchFn);
    people[artist] = portraitFromSummary(artist, artistPage, images, asBand ? "band" : "singer");
  }

  const wikipediaUrl =
    song?.content_urls?.desktop?.page ||
    (song?.title ? `https://en.wikipedia.org/wiki/${encodeURIComponent(String(song.title).replace(/ /g, "_"))}` : "") ||
    artistPage?.content_urls?.desktop?.page ||
    "";

  const anecdote = pickAnecdote(extract, fallbackSongAnecdote({ ...track, band: asBand ? artist : track.band }));
  const who = asBand ? artist || track.band : artist || track.singer;
  const year = songWd.year || yearFromText(description) || yearFromText(extract) || track.year;
  const genre = songWd.genre || artistWd.genre || "";
  const whyShortlisted = who
    ? `${asBand ? "Recording by" : "Vocal track by"} ${who}${year ? `; ${year} studio recording` : ""}. Found outside the 1,000-work canon.`
    : "";

  const next = applyExtraFacts(track, {
    artist: artistWd.performer || artist,
    performer: artistWd.performer || artist,
    asBand,
    composer: songWd.composer,
    writer: songWd.writer || parseWrittenBy(extract),
    country: songWd.country || artistWd.country || parseNationalityCountry(`${description} ${extract}`),
    year,
    genre,
    label: songWd.label || artistWd.label,
    wikipediaUrl,
    anecdote,
    whyShortlisted,
    people,
    description,
    extract,
  });

  return { track: next, people: next.people || {} };
  } catch {
    return { track: applyExtraFacts(track, { anecdote: fallbackSongAnecdote(track) }), people: {} };
  }
}
