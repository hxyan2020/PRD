#!/usr/bin/env node
/**
 * Build the Canon catalog: 1000 influential recordings with live Spotify links.
 *
 * Sources:
 *  - Wikidata (notability via Wikipedia language editions + bibliographic claims)
 *  - Spotify oEmbed (validates track URLs and official album artwork)
 *  - kworb.net (published Spotify play counts)
 *  - Wikipedia REST summaries (shortlist rationale)
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hdCoverUrl } from "../src/cover.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_PATH = path.join(ROOT, "public", "catalog.json");
const UA =
  "CanonMusicArchive/1.0 (https://github.com/hxyan2020/PRD; educational catalog)";

const HUMAN_TYPES = new Set([
  "Q5",
  "Q15632617",
  "Q21070568",
  "Q215627",
  "Q82955",
]);
const GROUP_TYPES = new Set([
  "Q215380",
  "Q32178211",
  "Q5741069",
  "Q2088357",
  "Q42998",
  "Q131186",
  "Q216337",
  "Q16334295",
  "Q105756498",
  "Q13417114",
  "Q6581097",
  "Q106191640",
  "Q588980",
  "Q207628",
  "Q182592",
  "Q273120",
  "Q2460487",
  "Q12073537",
  "Q1685451",
]);
const NON_MUSIC_TYPES = new Set([
  "Q5398426",
  "Q15416",
  "Q11424",
  "Q2927074",
  "Q35127",
  "Q5",
  "Q4830453",
  "Q783794",
  "Q6881511",
  "Q43229",
  "Q891723",
  "Q13218391",
  "Q213441",
  "Q116213710",
  "Q7187",
]);
const MUSIC_TYPES = new Set([
  "Q7366",
  "Q134556",
  "Q105543609",
  "Q7302866",
  "Q55850593",
  "Q107434452",
  "Q207628",
  "Q2188189",
  "Q182659",
  "Q23691",
  "Q484692",
  "Q15729627",
  "Q202002",
  "Q7366",
  "Q1345569",
  "Q105543609",
  "Q1084",
  "Q2743",
  "Q8341",
  "Q11399",
]);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson(url, { timeout = 45000, headers = {} } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": UA, Accept: "application/json", ...headers },
    });
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status} for ${url}`);
      err.status = res.status;
      throw err;
    }
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

async function fetchText(url, { timeout = 45000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": UA, Accept: "text/html,application/json" },
    });
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status} for ${url}`);
      err.status = res.status;
      throw err;
    }
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

async function mapPool(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

function qidFromUri(uri) {
  return String(uri).split("/").pop();
}

function claimValues(entity, pid) {
  const claims = entity?.claims?.[pid] || [];
  const preferred = claims.filter((c) => c.rank === "preferred");
  const usable = (preferred.length ? preferred : claims).filter((c) => c.rank !== "deprecated");
  const out = [];
  for (const c of usable) {
    const snak = c.mainsnak;
    if (!snak?.datavalue) continue;
    const v = snak.datavalue.value;
    if (snak.datavalue.type === "wikibase-entityid") out.push(v.id);
    else if (snak.datavalue.type === "time") out.push(v);
    else if (snak.datavalue.type === "string") out.push(v);
    else if (typeof v === "string") out.push(v);
  }
  return out;
}

function yearFromTime(value) {
  if (!value?.time) return null;
  const m = String(value.time).match(/([+-]?\d{1,6})/);
  if (!m) return null;
  const y = Number(m[1]);
  if (!Number.isFinite(y) || y === 0) return null;
  return y;
}

function unique(arr) {
  return [...new Set(arr.filter(Boolean))];
}

function joinNames(arr) {
  return unique(arr).join(" · ");
}

function normalizeTitle(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/\bfeat\.?\b/g, " ")
    .replace(/\bft\.?\b/g, " ")
    .replace(/\(.*?\)/g, " ")
    .replace(/\[.*?\]/g, " ")
    .replace(/[-–—:,.'"’]/g, " ")
    .replace(/\b(remastered|remaster|radio edit|live|version|mono|stereo|deluxe|anniversary|from \w+)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isHuman(types) {
  return types.some((t) => HUMAN_TYPES.has(t));
}

function isGroup(types) {
  return types.some((t) => GROUP_TYPES.has(t));
}

function parseSparqlBindings(data, grouped = new Map()) {
  for (const b of data.results.bindings) {
    const qid = qidFromUri(b.item.value);
    const spotify = b.spotify.value.trim();
    if (!/^[0-9A-Za-z]{22}$/.test(spotify)) continue;
    const sitelinks = Number(b.sitelinks?.value || 0);
    const rec = grouped.get(qid) || {
      qid,
      name: b.itemLabel?.value || qid,
      description: b.desc?.value || "",
      sitelinks,
      enwiki: b.enwiki?.value || "",
      spotifyIds: [],
    };
    rec.sitelinks = Math.max(rec.sitelinks, sitelinks);
    if (b.enwiki?.value) rec.enwiki = b.enwiki.value;
    if (b.itemLabel?.value) rec.name = b.itemLabel.value;
    if (b.desc?.value) rec.description = b.desc.value;
    if (!rec.spotifyIds.includes(spotify)) rec.spotifyIds.push(spotify);
    grouped.set(qid, rec);
  }
  return grouped;
}

const SPARQL_TAIL = `
  OPTIONAL {
    ?article schema:about ?item ;
             schema:isPartOf <https://en.wikipedia.org/> ;
             schema:name ?enwiki.
  }
  SERVICE wikibase:label {
    bd:serviceParam wikibase:language "en,mul".
    ?item rdfs:label ?itemLabel.
    ?item schema:description ?desc.
  }
`;

async function runSparql(query) {
  const url =
    "https://query.wikidata.org/sparql?" +
    new URLSearchParams({ format: "json", query });
  return fetchJson(url, { timeout: 120000 });
}

async function sparqlCandidates() {
  const grouped = new Map();
  const queries = [
    `SELECT DISTINCT ?item ?itemLabel ?spotify ?sitelinks ?desc ?enwiki WHERE {
      ?item wdt:P2207 ?spotify.
      ?item wikibase:sitelinks ?sitelinks.
      FILTER(?sitelinks >= 3)
      ${SPARQL_TAIL}
    } ORDER BY DESC(?sitelinks) LIMIT 1800`,
    `SELECT DISTINCT ?item ?itemLabel ?spotify ?sitelinks ?desc ?enwiki WHERE {
      ?item wdt:P2207 ?spotify.
      ?item wdt:P86 ?composer.
      ?composer wikibase:sitelinks ?cs.
      FILTER(?cs >= 50)
      ?item wikibase:sitelinks ?sitelinks.
      FILTER(?sitelinks >= 1)
      ${SPARQL_TAIL}
    } LIMIT 300`,
  ];
  for (const [i, query] of queries.entries()) {
    console.log(`   Wikidata query ${i + 1}/${queries.length}…`);
    const data = await runSparql(query);
    parseSparqlBindings(data, grouped);
  }
  return [...grouped.values()].sort((a, b) => b.sitelinks - a.sitelinks);
}

async function wbGetEntities(ids, props = "claims|labels|descriptions") {
  const out = {};
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    const url =
      "https://www.wikidata.org/w/api.php?" +
      new URLSearchParams({
        action: "wbgetentities",
        ids: chunk.join("|"),
        props,
        languages: "en",
        format: "json",
      });
    let data;
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        data = await fetchJson(url);
        break;
      } catch (err) {
        if (attempt === 3) throw err;
        await sleep(400 * 2 ** attempt);
      }
    }
    Object.assign(out, data.entities || {});
    await sleep(80);
  }
  return out;
}

function labelOf(entities, qid) {
  return entities[qid]?.labels?.en?.value || "";
}

function inferArtist(description, extract) {
  const texts = [description, extract].filter(Boolean);
  const patterns = [
    /^(?:\d{4} )?(?:promotional )?(?:single|song|recording|track|audio track|vocal track|hymn|anthem|composition|music track) by (.+?)(?: featuring | feat\. |;|$)/i,
    /^(?:original )?song written, composed, and performed by (.+)$/i,
    /^(.+?) song$/i,
    /performed by (.+?)(?: for |$)/i,
    /^["“].+?["”] is a (?:song|single|recording|composition|hymn|anthem) by (?:the )?(?:[\w./-]+ ){0,6}?(?:singer-songwriter |singer |DJ |rapper |musician |band |rock band |pop group |girl group |boy band |group |duo |trio |orchestra |composer |pianist |violinist |producer )?(?:and record producer )?([^.,]+)/i,
  ];
  for (const text of texts) {
    for (const re of patterns) {
      const m = String(text).match(re);
      if (!m) continue;
      let name = m[1].replace(/\s+/g, " ").trim();
      name = name.replace(/\s+\((?:song|musician|band).*$/i, "").trim();
      if (name.length > 2 && name.length < 80) return name;
    }
  }
  return "";
}

function looksLikeGroup(name) {
  return /\b(band|orchestra|choir|quartet|trio|brothers|sisters|boys|girls|ensemble|symphony)\b/i.test(
    name
  );
}

async function oembedFor(spotifyId) {
  const url =
    "https://open.spotify.com/oembed?url=" +
    encodeURIComponent(`https://open.spotify.com/track/${spotifyId}`);
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const data = await fetchJson(url, { timeout: 20000 });
      if (!data?.thumbnail_url || !data?.title) return null;
      return {
        spotifyId,
        title: data.title,
        coverUrl: hdCoverUrl(data.thumbnail_url),
        iframeUrl: data.iframe_url || `https://open.spotify.com/embed/track/${spotifyId}`,
      };
    } catch (err) {
      if (err.status === 404) return null;
      if (err.status === 429 || err.status >= 500 || err.name === "AbortError") {
        await sleep(500 * 2 ** attempt);
        continue;
      }
      return null;
    }
  }
  return null;
}

async function wikipediaExtract(title) {
  if (!title) return "";
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  try {
    const data = await fetchJson(url, {
      timeout: 20000,
      headers: { Accept: "application/json" },
    });
    return (data.extract || "").trim();
  } catch {
    return "";
  }
}

function parseKworbTopSongs(html) {
  const map = new Map();
  const re =
    /<tr><td class="text"><div>(.*?)<\/div><\/td><td>([0-9,]+)<\/td>/g;
  let m;
  while ((m = re.exec(html))) {
    const raw = m[1].replace(/&amp;/g, "&").replace(/&quot;/g, '"');
    const streams = Number(m[2].replace(/,/g, ""));
    const idx = raw.indexOf(" - ");
    if (idx === -1) continue;
    const artist = raw.slice(0, idx);
    const title = raw.slice(idx + 3);
    map.set(`${normalizeTitle(artist)}|${normalizeTitle(title)}`, streams);
    map.set(normalizeTitle(title), streams);
  }
  return map;
}

function parseKworbArtistSongs(html) {
  const out = [];
  const re =
    /href="https:\/\/open\.spotify\.com\/track\/([0-9A-Za-z]{22})"[^>]*>(.*?)<\/a>[\s\S]*?<td>([0-9,]+)<\/td>/g;
  let m;
  while ((m = re.exec(html))) {
    out.push({
      id: m[1],
      title: m[2].replace(/&amp;/g, "&"),
      streams: Number(m[3].replace(/,/g, "")),
    });
  }
  return out;
}

function whyShortlisted(track) {
  const bits = [];
  if (track.extract) {
    const sentences = track.extract.split(/(?<=[.!?])\s+/).slice(0, 2).join(" ");
    bits.push(sentences);
  } else if (track.description) {
    bits.push(track.description.replace(/^./, (c) => c.toUpperCase()) + ".");
  }
  const extras = [];
  extras.push(
    `It is documented across ${track.sitelinks} Wikipedia language editions, a strong signal of worldwide cultural memory.`
  );
  if (track.year) extras.push(`First issued in ${track.year}.`);
  if (track.releaseCountry) extras.push(`Origin: ${track.releaseCountry}.`);
  if (track.genre) extras.push(`Filed here as ${track.genre}.`);
  if (track.awards.length) extras.push(`Recognitions include ${track.awards.slice(0, 3).join(", ")}.`);
  if (track.streams) {
    extras.push(
      `On Spotify it has ${track.streams.toLocaleString("en-US")} documented plays.`
    );
  }
  extras.push("Shortlisted for lasting influence rather than a single chart week or language.");
  bits.push(extras.join(" "));
  return bits.join(" ").replace(/\s+/g, " ").trim();
}

function selectThousand(rows) {
  const chosen = [];
  const seen = new Set();
  const take = (pred, limit) => {
    const pool = rows
      .filter(pred)
      .sort((a, b) => b.sitelinks - a.sitelinks || String(a.name).localeCompare(b.name));
    let n = 0;
    for (const row of pool) {
      if (chosen.length >= 1000 || n >= limit) break;
      const sid = row.oembed.spotifyId;
      if (seen.has(sid)) continue;
      seen.add(sid);
      chosen.push(row);
      n += 1;
    }
  };
  const blob = (row) =>
    `${row.instanceOf} ${(row.genres || []).join(" ")} ${row.description}`.toLowerCase();
  take((r) => r.year && r.year < 1960, 80);
  take((r) => r.year && r.year >= 1960 && r.year < 1980, 120);
  take((r) => r.year && r.year >= 1980 && r.year < 2000, 120);
  take((r) => r.sitelinks >= 8 && /anthem|hymn|classical|opera|jazz|blues|folk|traditional|symphony/.test(blob(r)), 80);
  take(() => true, 1000);
  return chosen;
}

function classifyPerformers(performerIds, entities) {
  const singers = [];
  const bands = [];
  for (const id of performerIds) {
    const name = labelOf(entities, id);
    if (!name) continue;
    const types = claimValues(entities[id], "P31");
    if (isGroup(types) && !isHuman(types)) bands.push(name);
    else if (isHuman(types)) singers.push(name);
    else if (isGroup(types)) bands.push(name);
    else singers.push(name);
  }
  return { singers: unique(singers), bands: unique(bands) };
}

async function main() {
  console.log("1/6 Wikidata candidates…");
  const candidates = await sparqlCandidates();
  console.log(`   ${candidates.length} distinct works`);

  const qids = candidates.map((c) => c.qid);
  console.log("2/6 Wikidata claims…");
  const works = await wbGetEntities(qids);

  const related = new Set();
  for (const qid of qids) {
    const ent = works[qid];
    if (!ent) continue;
    for (const pid of ["P175", "P86", "P676", "P264", "P495", "P136", "P31", "P166", "P407"]) {
      for (const v of claimValues(ent, pid)) {
        if (typeof v === "string" && /^Q\d+$/.test(v)) related.add(v);
      }
    }
  }
  console.log(`   resolving ${related.size} related entities…`);
  const relatedEntities = await wbGetEntities([...related], "labels|claims");
  const extra = new Set();
  for (const ent of Object.values(relatedEntities)) {
    for (const pid of ["P27", "P495", "P31"]) {
      for (const v of claimValues(ent, pid)) {
        if (typeof v === "string" && /^Q\d+$/.test(v) && !relatedEntities[v]) extra.add(v);
      }
    }
  }
  if (extra.size) {
    console.log(`   resolving ${extra.size} nested country/type labels…`);
    Object.assign(relatedEntities, await wbGetEntities([...extra], "labels|claims"));
  }

  const enriched = [];
  for (const c of candidates) {
    const ent = works[c.qid];
    if (!ent) continue;
    const types = claimValues(ent, "P31");
    const hasMusic = types.some((t) => MUSIC_TYPES.has(t));
    const hasNonMusic = types.some((t) => NON_MUSIC_TYPES.has(t));
    const blob = `${c.name} ${c.description}`.toLowerCase();
    if (hasNonMusic && !hasMusic) continue;
    if (/ai-generated|internet meme|convenience store|vocal teacher/.test(blob) && !hasMusic) continue;
    if (/^Q\d+$/.test(c.name)) continue;
    const performerIds = unique(claimValues(ent, "P175"));
    const { singers, bands } = classifyPerformers(performerIds, relatedEntities);
    const composers = unique(claimValues(ent, "P86")).map((id) => labelOf(relatedEntities, id)).filter(Boolean);
    const writers = unique(claimValues(ent, "P676")).map((id) => labelOf(relatedEntities, id)).filter(Boolean);
    const labels = unique(claimValues(ent, "P264")).map((id) => labelOf(relatedEntities, id)).filter(Boolean);
    const workCountries = unique(claimValues(ent, "P495")).map((id) => labelOf(relatedEntities, id)).filter(Boolean);
    const performerCountries = unique(
      performerIds.flatMap((id) => [
        ...claimValues(relatedEntities[id], "P495"),
        ...claimValues(relatedEntities[id], "P27"),
      ])
    )
      .map((id) => labelOf(relatedEntities, id))
      .filter(Boolean);
    const countries = workCountries.length ? workCountries : performerCountries;
    const genres = unique(claimValues(ent, "P136")).map((id) => labelOf(relatedEntities, id)).filter(Boolean);
    const awards = unique(claimValues(ent, "P166")).map((id) => labelOf(relatedEntities, id)).filter(Boolean);
    const years = [...claimValues(ent, "P577"), ...claimValues(ent, "P571")]
      .map(yearFromTime)
      .filter((y) => y && y <= 2026);
    const artistIds = unique(
      performerIds
        .map((id) => claimValues(relatedEntities[id], "P1902")[0])
        .filter(Boolean)
    );
    enriched.push({
      ...c,
      singers,
      bands,
      composers,
      writers,
      labels,
      countries,
      genres,
      awards,
      year: years.length ? Math.min(...years) : null,
      instanceOf: types.map((id) => labelOf(relatedEntities, id)).filter(Boolean)[0] || "recording",
      artistIds,
    });
  }

  console.log("3/6 Spotify oEmbed validation + covers…");
  const usedSpotify = new Set();
  let checked = 0;
  const validated = (
    await mapPool(enriched, 8, async (item) => {
      for (const sid of item.spotifyIds) {
        if (usedSpotify.has(sid)) continue;
        const oem = await oembedFor(sid);
        checked += 1;
        if (checked % 50 === 0) console.log(`   checked ${checked}/${enriched.length}`);
        if (!oem) continue;
        usedSpotify.add(sid);
        return { ...item, oembed: oem };
      }
      return null;
    })
  ).filter(Boolean);
  const uniqueValidated = [];
  const seenIds = new Set();
  for (const row of validated.sort((a, b) => b.sitelinks - a.sitelinks || a.name.localeCompare(b.name))) {
    if (seenIds.has(row.oembed.spotifyId)) continue;
    seenIds.add(row.oembed.spotifyId);
    uniqueValidated.push(row);
  }
  const shortlist = selectThousand(uniqueValidated);
  console.log(`   live Spotify tracks: ${uniqueValidated.length}; keeping ${shortlist.length}`);

  if (shortlist.length < 1000) {
    throw new Error(`Only validated ${shortlist.length} tracks; need 1000.`);
  }

  console.log("4/6 kworb play counts…");
  const kworbTopHtml = await fetchText("https://kworb.net/spotify/songs.html");
  const kworbNameMap = parseKworbTopSongs(kworbTopHtml);
  const streamsById = new Map();
  const streamsByArtistTitle = new Map();

  const artistIds = unique(shortlist.flatMap((t) => t.artistIds));
  console.log(`   fetching ${artistIds.length} artist stream tables…`);
  await mapPool(artistIds, 5, async (id) => {
    try {
      const html = await fetchText(`https://kworb.net/spotify/artist/${id}_songs.html`);
      for (const row of parseKworbArtistSongs(html)) {
        streamsById.set(row.id, row.streams);
        streamsByArtistTitle.set(`${id}|${normalizeTitle(row.title)}`, row.streams);
      }
    } catch {
      // artist may not have a kworb page
    }
  });

  console.log("5/6 Wikipedia extracts for shortlist reasons…");
  await mapPool(shortlist, 6, async (item) => {
    item.extract = await wikipediaExtract(item.enwiki);
  });

  console.log("6/6 assemble catalog…");
  const catalog = shortlist.map((item, idx) => {
    const oem = item.oembed;
    let streams = streamsById.get(oem.spotifyId) || null;
    if (!streams) {
      for (const artistId of item.artistIds) {
        const hit =
          streamsByArtistTitle.get(`${artistId}|${normalizeTitle(item.name)}`) ||
          streamsByArtistTitle.get(`${artistId}|${normalizeTitle(oem.title)}`);
        if (hit) {
          streams = hit;
          break;
        }
      }
    }
    if (!streams) {
      const keys = [];
      const performers = [...item.bands, ...item.singers];
      for (const p of performers) {
        keys.push(`${normalizeTitle(p)}|${normalizeTitle(item.name)}`);
        keys.push(`${normalizeTitle(p)}|${normalizeTitle(oem.title)}`);
      }
      for (const k of keys) {
        if (kworbNameMap.has(k)) {
          streams = kworbNameMap.get(k);
          break;
        }
      }
    }
    const anthem = /anthem|patriotic|hymn/i.test(`${item.instanceOf} ${item.description} ${item.name}`);
    const inferred = inferArtist(item.description, item.extract);
    let singer = joinNames(item.singers);
    let band = joinNames(item.bands);
    if (!singer && !band) {
      if (anthem) {
        singer = "Various / ceremonial performers";
        band = "—";
      } else if (inferred) {
        if (looksLikeGroup(inferred)) {
          band = inferred;
          singer = "—";
        } else {
          singer = inferred;
          band = "—";
        }
      } else {
        singer = "Not listed";
        band = "Not listed";
      }
    } else {
      if (!singer) singer = "—";
      if (!band) band = "—";
    }
    const creditedPerson =
      (singer !== "—" && singer !== "Not listed" && singer !== "Various / ceremonial performers" && singer) ||
      (band !== "—" && band !== "Not listed" && band) ||
      inferred ||
      "";
    const composer =
      joinNames(item.composers) ||
      creditedPerson ||
      (anthem ? "Traditional / ceremonial" : "Traditional / not attributed");
    const writer =
      joinNames(item.writers) ||
      joinNames(item.composers) ||
      creditedPerson ||
      (anthem ? "Traditional / ceremonial" : "Traditional / not attributed");
    const rec = {
      rank: idx + 1,
      id: item.qid,
      name: item.name,
      composer,
      singer,
      band,
      writer,
      musicCompany: joinNames(item.labels) || "Not listed",
      year: item.year,
      releaseCountry: joinNames(item.countries) || "Not listed",
      genre: joinNames(item.genres.slice(0, 3)) || item.instanceOf || "Not listed",
      genres: item.genres,
      spotifyId: oem.spotifyId,
      spotifyUrl: `https://open.spotify.com/track/${oem.spotifyId}`,
      spotifyEmbedUrl: `https://open.spotify.com/embed/track/${oem.spotifyId}?utm_source=generator`,
      coverUrl: oem.coverUrl,
      spotifyTitle: oem.title,
      streams,
      sitelinks: item.sitelinks,
      awards: item.awards,
      wikipediaUrl: item.enwiki
        ? `https://en.wikipedia.org/wiki/${encodeURIComponent(item.enwiki.replace(/ /g, "_"))}`
        : `https://www.wikidata.org/wiki/${item.qid}`,
      instanceOf: item.instanceOf,
      description: item.description,
      extract: item.extract || "",
    };
    rec.whyShortlisted = whyShortlisted(rec);
    rec.influenceScore = item.sitelinks * 10 + Math.log10((streams || 1) + 1);
    return rec;
  });

  const maxSite = Math.max(...catalog.map((t) => t.sitelinks), 1);
  const maxLog = Math.log10(1 + Math.max(...catalog.map((t) => t.streams || 0), 1));
  catalog.forEach((t) => {
    t.influenceScore =
      0.62 * (t.sitelinks / maxSite) + 0.38 * (Math.log10(1 + (t.streams || 0)) / maxLog);
  });
  catalog.sort((a, b) => b.influenceScore - a.influenceScore || b.sitelinks - a.sitelinks);
  catalog.forEach((t, i) => {
    t.rank = i + 1;
  });

  const payload = {
    generatedAt: new Date().toISOString(),
    title: "Canon",
    subtitle: "One thousand recordings that shaped how humans listen",
    count: catalog.length,
    sources: [
      "Wikidata (P2207 Spotify track IDs, sitelinks, bibliographic claims)",
      "Spotify oEmbed (live track verification and official cover art)",
      "kworb.net (published Spotify play counts)",
      "Wikipedia page summaries (shortlist rationale)",
    ],
    tracks: catalog,
  };

  await fs.mkdir(path.dirname(OUT_PATH), { recursive: true });
  await fs.writeFile(OUT_PATH, JSON.stringify(payload));
  const withStreams = catalog.filter((t) => t.streams).length;
  const withCovers = catalog.filter((t) => t.coverUrl).length;
  console.log(`Wrote ${catalog.length} tracks to ${OUT_PATH}`);
  console.log(`  covers: ${withCovers}  streams: ${withStreams}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
