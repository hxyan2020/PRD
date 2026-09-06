#!/usr/bin/env node
/**
 * Attach a short anecdote to every song and every credited singer/band,
 * plus at least three iconic Wikimedia / catalog images per person or group.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  fallbackPersonAnecdote,
  fallbackSongAnecdote,
  isPlaceholderCredit,
  pickAnecdote,
  searchName,
  anecdoteFits,
  splitCredits,
  uniqueImages,
  titleFitsName,
} from "../src/portraits.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG_PATH = path.join(ROOT, "public", "catalog.json");
const PORTRAITS_PATH = path.join(ROOT, "public", "portraits.json");
const CACHE_PATH = "/tmp/canon-portrait-cache.json";
const UA = "CanonMusicArchive/1.0 (https://github.com/hxyan2020/PRD; educational catalog)";
const SKIP_FILE =
  /logo|icon|flag|signature|wordmark|wikidata|commons-logo|protection|oojs|gnome|gclef|speaker|padlock|disambig|question_book|edit-ltr|crystal|symbol_|pictogram|clipboard|nuvola|wikimedia|creative_commons|red_pencil|ambox|unsourced|increase|decrease|steady|featured|sound-icon|musical_notes|clef|vip\.svg|semi-protection|support\.svg|star_of|coat_of_arms|map_of|location_map/i;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson(url, timeout = 25000) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeout);
    try {
      const res = await fetch(url, {
        signal: ctrl.signal,
        headers: { "User-Agent": UA, Accept: "application/json" },
      });
      if (res.status === 429 || res.status >= 500) {
        await sleep(500 * 2 ** attempt);
        continue;
      }
      if (!res.ok) return null;
      return await res.json();
    } catch {
      await sleep(300 * 2 ** attempt);
    } finally {
      clearTimeout(t);
    }
  }
  return null;
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

function absSrc(src) {
  if (!src) return "";
  const raw = String(src).startsWith("//") ? `https:${src}` : String(src);
  return raw.split("?")[0];
}

function wikiTitleFromUrl(url) {
  const m = String(url || "").match(/wikipedia\.org\/wiki\/([^?#]+)/i);
  if (!m) return "";
  try {
    return decodeURIComponent(m[1].replace(/_/g, " "));
  } catch {
    return m[1].replace(/_/g, " ");
  }
}

function filePathUrl(title) {
  const file = String(title || "").replace(/^File:/i, "").replace(/ /g, "_");
  if (!file) return "";
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=800`;
}

function usableFileTitle(title) {
  const t = String(title || "");
  if (!t) return false;
  if (SKIP_FILE.test(t)) return false;
  if (/\.svg$/i.test(t)) return false;
  return /\.(jpe?g|png|webp|gif)$/i.test(t) || !/\.[a-z0-9]+$/i.test(t);
}

async function wikiSummary(title) {
  if (!title) return null;
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const data = await fetchJson(url);
  if (!data || data.type === "disambiguation") return null;
  if (/topics referred to by the same term/i.test(data.description || "")) return null;
  return data;
}

async function wikiSearch(query) {
  const url =
    "https://en.wikipedia.org/w/api.php?action=query&list=search&format=json" +
    `&srsearch=${encodeURIComponent(query)}&srlimit=8&srnamespace=0`;
  const data = await fetchJson(url);
  return (data?.query?.search || []).map((row) => row.title).filter(Boolean);
}

async function openSearch(query) {
  const url = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(
    query
  )}&limit=5&namespace=0&format=json`;
  const data = await fetchJson(url);
  return Array.isArray(data?.[1]) ? data[1] : [];
}

async function mediaList(title) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/media-list/${encodeURIComponent(title)}`;
  const data = await fetchJson(url);
  const out = [];
  for (const item of data?.items || []) {
    if (item.type && item.type !== "image") continue;
    if (!usableFileTitle(item.title)) continue;
    const src = absSrc(item.srcset?.[1]?.src || item.srcset?.[0]?.src) || filePathUrl(item.title);
    if (src) out.push({ src, alt: String(item.title || "").replace(/^File:/i, "").replace(/_/g, " ") });
  }
  return out;
}

async function commonsSearch(query) {
  const url =
    "https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*" +
    `&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=16` +
    "&prop=imageinfo&iiprop=url|mime|size&iiurlwidth=800";
  const data = await fetchJson(url);
  const out = [];
  for (const page of Object.values(data?.query?.pages || {})) {
    const info = page.imageinfo?.[0];
    if (!info) continue;
    if (info.mime && !/^image\/(jpeg|png|webp|gif)$/i.test(info.mime)) continue;
    if (!usableFileTitle(page.title)) continue;
    const src = absSrc(info.thumburl || info.url);
    if (src) out.push({ src, alt: String(page.title || "").replace(/^File:/i, "").replace(/_/g, " ") });
  }
  return out;
}

function looksWrongPage(kind, name, summary) {
  const title = summary?.title || "";
  const blob = `${title} ${summary?.description || ""} ${summary?.extract || ""}`.toLowerCase();
  if (/topics referred to by the same term|disambiguation/.test(blob)) return true;
  if (!titleFitsName(name, title) && !titleFitsName(name, summary?.description || "")) return true;
  if (
    /\b(album|song|single|tournament|film|photograph)\b/i.test(summary?.description || "") &&
    !/singer|rapper|musician|band|songwriter/.test(summary?.description || "")
  ) {
    return true;
  }
  if (kind === "singer" && /\((?:band|group)\)/i.test(title) && !/rapper|singer|vocalist/.test(summary?.description || "")) {
    return true;
  }
  if (
    kind === "band" &&
    /religion|buddhist|hindu|nirvāṇa|nirvana, in the indian|soteriological|liberation from repeated/.test(blob) &&
    !/rock band|pop group|musical group|grunge/.test(blob)
  ) {
    return true;
  }
  if (/discography/.test(title) && !/band|singer|rapper|musician/.test(blob)) return true;
  if (/\b(serial killer|murderer|sex offender|politician|footballer|soccer player|actor)\b/i.test(blob) && !/\b(singer|rapper|musician|songwriter|band|record producer|dj)\b/i.test(blob)) {
    return true;
  }
  return false;
}

async function resolvePersonPage(name, kind) {
  const wd = await wikidataPerson(name, kind);
  if (wd?.enwiki) {
    const summary = await wikiSummary(wd.enwiki);
    if (summary?.extract && !looksWrongPage(kind, name, summary)) {
      return { title: summary.title || wd.enwiki, summary, image: wd.image, category: wd.category };
    }
  }
  const cleaned = searchName(name) || name;
  const tries =
    kind === "band"
      ? [`${cleaned} (band)`, `${cleaned} (group)`, `${cleaned} (American band)`, cleaned]
      : /^dj\s+/i.test(cleaned)
        ? [`${cleaned} (DJ)`, `${cleaned} (musician)`, cleaned, `${cleaned} (singer)`]
        : [`${cleaned} (singer)`, `${cleaned} (South Korean singer)`, `${cleaned} (musician)`, `${cleaned} (rapper)`, `${cleaned} (American singer)`, cleaned];
  for (const query of tries) {
    const summary = await wikiSummary(query);
    if (summary?.extract && !looksWrongPage(kind, cleaned, summary)) {
      return { title: summary.title || query, summary, image: wd?.image || "", category: wd?.category || "" };
    }
    for (const title of await openSearch(query)) {
      if (/discography|disambiguation/i.test(title)) continue;
      const hit = await wikiSummary(title);
      if (hit?.extract && !looksWrongPage(kind, cleaned, hit)) {
        return { title: hit.title || title, summary: hit, image: wd?.image || "", category: wd?.category || "" };
      }
    }
  }
  for (const title of await wikiSearch(`${cleaned} ${kind === "band" ? "band" : "singer"}`)) {
    if (/discography|disambiguation/i.test(title)) continue;
    const summary = await wikiSummary(title);
    if (summary?.extract && !looksWrongPage(kind, cleaned, summary)) {
      return { title: summary.title || title, summary, image: wd?.image || "", category: wd?.category || "" };
    }
  }
  return { title: "", summary: null, image: wd?.image || "", category: wd?.category || "" };
}

function songToken(track) {
  return String(track?.name || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !/^(the|and|for|you|was)$/i.test(word))[0] || "";
}

function looksWrongSong(track, summary) {
  if (!summary?.extract) return true;
  const blob = `${summary.title || ""} ${summary.description || ""} ${summary.extract}`.toLowerCase();
  if (/disambiguation|topics referred to by the same term|given name|family name/.test(blob)) return true;
  if (/\b(corporation|beverage producer|fashion house|luxury goods|township|census)\b/.test(blob) && !/\b(song|single|album)\b/.test(blob)) {
    return true;
  }
  const token = songToken(track);
  if (token && !new RegExp(`\\b${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(blob)) return true;
  const artist = (splitCredits(track.singer)[0] || splitCredits(track.band)[0] || "").toLowerCase();
  const artistToken = searchName(artist).split(/\s+/).filter((word) => word.length > 2 && word !== "the")[0];
  const musical = /song|single|track|ballad|recording|album/.test(blob);
  if (artistToken && !blob.includes(artistToken) && !musical) return true;
  return false;
}

async function resolveSongPage(track) {
  const artist = splitCredits(track.singer)[0] || splitCredits(track.band)[0] || "";
  const fromUrl = wikiTitleFromUrl(track.wikipediaUrl);
  const exact = [
    fromUrl,
    artist ? `${track.name} (${searchName(artist) || artist} song)` : "",
    `${track.name} (song)`,
    `${track.name} (single)`,
  ].filter(Boolean);
  for (const title of exact) {
    const summary = await wikiSummary(title);
    if (!looksWrongSong(track, summary)) return summary;
  }
  const query = artist ? `"${track.name}" ${searchName(artist) || artist} song` : `"${track.name}" song`;
  const titles = [...(await openSearch(query)), ...(await wikiSearch(query))];
  const seen = new Set(exact.map((title) => title.toLowerCase()));
  for (const title of titles) {
    const key = String(title || "").toLowerCase();
    if (!key || seen.has(key) || /disambiguation/i.test(title)) continue;
    seen.add(key);
    const summary = await wikiSummary(title);
    if (!looksWrongSong(track, summary)) return summary;
  }
  return null;
}

async function commonsCategory(category) {
  if (!category) return [];
  const title = category.startsWith("Category:") ? category : `Category:${category}`;
  const url =
    "https://commons.wikimedia.org/w/api.php?action=query&format=json" +
    `&list=categorymembers&cmtitle=${encodeURIComponent(title)}&cmtype=file&cmlimit=20`;
  const data = await fetchJson(url);
  const out = [];
  for (const item of data?.query?.categorymembers || []) {
    if (!usableFileTitle(item.title)) continue;
    out.push({
      src: filePathUrl(item.title),
      alt: String(item.title || "").replace(/^File:/i, "").replace(/_/g, " "),
    });
  }
  return out;
}

async function wikidataPerson(name, kind) {
  const cleaned = searchName(name) || name;
  const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(
    cleaned
  )}&language=en&limit=8&format=json`;
  const data = await fetchJson(url);
  const kindRe =
    kind === "band"
      ? /band|group|ensemble|orchestra|duo|trio|quartet|collective/i
      : /singer|rapper|musician|songwriter|dj|artist|vocalist|performer|producer|composer/i;
  const reject =
    /monarch|queen of the united kingdom|princess|noble family|given name|family name|disambiguation|ship\b|album\b|film\b|soteriological|indian religions|leafhopper|genus|photograph in the|university in|census/i;
  const hits = data?.search || [];
  const hit = hits.find((item) => kindRe.test(item.description || "") && !reject.test(`${item.label} ${item.description}`));
  if (!hit?.id) return null;
  const raw = await fetchJson(
    `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${hit.id}&props=sitelinks|claims&format=json`
  );
  const entity = raw?.entities?.[hit.id];
  if (!entity) return null;
  const p18 = entity.claims?.P18?.[0]?.mainsnak?.datavalue?.value || "";
  const p373 = entity.claims?.P373?.[0]?.mainsnak?.datavalue?.value || "";
  return {
    enwiki: entity.sitelinks?.enwiki?.title || "",
    image: p18 ? filePathUrl(`File:${p18}`) : "",
    category: p373,
    description: hit.description || "",
  };
}

async function wbSongTitles(qids) {
  const map = new Map();
  for (let i = 0; i < qids.length; i += 40) {
    const chunk = qids.slice(i, i + 40);
    const data = await fetchJson(
      `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${chunk.join("|")}&props=sitelinks&format=json`
    );
    for (const [id, entity] of Object.entries(data?.entities || {})) {
      const title = entity?.sitelinks?.enwiki?.title;
      if (title) map.set(id, title);
    }
    await sleep(60);
  }
  return map;
}

async function itunesImages(name) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(searchName(name) || name)}&entity=album&limit=8`;
  const data = await fetchJson(url);
  const out = [];
  for (const item of data?.results || []) {
    const src = String(item.artworkUrl100 || "").replace("100x100bb", "600x600bb");
    if (src) out.push({ src, alt: `${name} — ${item.collectionName || "recording"}` });
  }
  return out;
}

async function deezerImages(name) {
  const q = encodeURIComponent(searchName(name) || name);
  const artist = await fetchJson(`https://api.deezer.com/search/artist?q=${q}&limit=3`);
  const out = [];
  const picture = artist?.data?.[0]?.picture_xl || artist?.data?.[0]?.picture_big;
  if (picture) out.push({ src: picture, alt: name });
  const albums = await fetchJson(`https://api.deezer.com/search/album?q=${q}&limit=8`);
  for (const album of albums?.data || []) {
    const src = album.cover_xl || album.cover_big;
    if (src) out.push({ src, alt: `${name} — ${album.title || "recording"}` });
  }
  return out;
}

async function audioDbImages(name) {
  const url = `https://www.theaudiodb.com/api/v1/json/2/search.php?s=${encodeURIComponent(searchName(name) || name)}`;
  const data = await fetchJson(url);
  const artist = data?.artists?.[0];
  if (!artist) return [];
  const out = [];
  for (const key of ["strArtistThumb", "strArtistFanart", "strArtistFanart2", "strArtistFanart3", "strArtistWideThumb", "strArtistBanner"]) {
    if (artist[key]) out.push({ src: artist[key], alt: name });
  }
  return out;
}

async function itunesSongNote(track) {
  const artist = splitCredits(track.singer)[0] || splitCredits(track.band)[0] || "";
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
    `${track.name} ${searchName(artist) || artist}`.trim()
  )}&entity=song&limit=8`;
  const data = await fetchJson(url);
  const want = String(track.name || "").toLowerCase();
  const hit = (data?.results || []).find((item) => String(item.trackName || "").toLowerCase().includes(want.slice(0, 18))) || data?.results?.[0];
  if (!hit) return "";
  const who = artist || hit.artistName || "its performers";
  const album = hit.collectionName ? ` on ${hit.collectionName}` : "";
  const when = hit.releaseDate ? ` in ${String(hit.releaseDate).slice(0, 4)}` : track.year ? ` in ${track.year}` : "";
  return `"${track.name}" is a recording by ${who}${when}${album}. Listeners still keep it in rotation, which is why it sits in this archive.`;
}

async function imagesFor(name, wikiTitle, covers, extra = []) {
  const collected = [...extra];
  if (wikiTitle) collected.push(...(await mediaList(wikiTitle)));
  if (collected.length < 6) collected.push(...(await commonsSearch(`${searchName(name) || name} musician`)));
  if (collected.length < 6) collected.push(...(await commonsSearch(searchName(name) || name)));
  collected.push(...(await itunesImages(name)));
  if (collected.length < 3) collected.push(...(await deezerImages(name)));
  if (collected.length < 3) collected.push(...(await audioDbImages(name)));
  for (const src of covers || []) {
    collected.push({ src, alt: `${name} recording cover` });
  }
  return uniqueImages(collected, 9);
}

function cachePersonOk(row, name, kind) {
  if (!row?.anecdote || (row.images || []).length < 3) return false;
  if (/appears in this archive as/.test(row.anecdote)) return false;
  if (!titleFitsName(name, row.title || "") && !titleFitsName(name, row.anecdote || "")) return false;
  if (/\b(serial killer|sex offender|murderer)\b/i.test(row.anecdote || "")) return false;
  return true;
}

async function loadCache() {
  let cache = { people: {}, songs: {} };
  try {
    cache = JSON.parse(await fs.readFile(CACHE_PATH, "utf8"));
  } catch {
    cache = { people: {}, songs: {} };
  }
  cache.people ||= {};
  cache.songs ||= {};
  try {
    const portraits = JSON.parse(await fs.readFile(PORTRAITS_PATH, "utf8"));
    cache.people = { ...(portraits.people || {}), ...cache.people };
  } catch {
    /* first run */
  }
  return cache;
}

async function saveCache(cache) {
  await fs.writeFile(CACHE_PATH, JSON.stringify(cache));
}

async function main() {
  const catalog = JSON.parse(await fs.readFile(CATALOG_PATH, "utf8"));
  const cache = await loadCache();
  for (const track of catalog.tracks) {
    if (/dilshadilu07/i.test(track.singer)) track.singer = "Galantis";
    if (track.anecdote && !cache.songs[track.id]) {
      cache.songs[track.id] = { anecdote: track.anecdote };
    }
  }
  const coversByName = new Map();
  const people = new Map();

  for (const track of catalog.tracks) {
    const names = [
      ...splitCredits(track.singer).map((name) => ({ name, kind: "singer" })),
      ...splitCredits(track.band).map((name) => ({ name, kind: "band" })),
    ];
    for (const item of names) {
      if (!people.has(item.name)) people.set(item.name, item.kind);
      const list = coversByName.get(item.name) || [];
      if (track.coverUrl && !list.includes(track.coverUrl)) list.push(track.coverUrl);
      coversByName.set(item.name, list);
    }
  }

  const personNames = [...people.keys()];
  console.log(`portraits: ${personNames.length} singers/bands`);
  let done = 0;
  await mapPool(personNames, 3, async (name) => {
    const kind = people.get(name);
    if (cachePersonOk(cache.people[name], name, kind)) {
      done += 1;
      return;
    }
    const page = await resolvePersonPage(name, kind);
    const extras = [];
    if (page.image) extras.push({ src: page.image, alt: name });
    if (page.category) extras.push(...(await commonsCategory(page.category)));
    const images = await imagesFor(name, page.title, coversByName.get(name), extras);
    const thumb = page.summary?.thumbnail?.source;
    if (thumb) images.unshift({ src: absSrc(thumb), alt: name });
    cache.people[name] = {
      kind,
      title: page.title || name,
      anecdote: pickAnecdote(page.summary?.extract, fallbackPersonAnecdote(name, kind)),
      images: uniqueImages(images, 9),
    };
    done += 1;
    if (done % 25 === 0) {
      console.log(`   people ${done}/${personNames.length}`);
      await saveCache(cache);
    }
    await sleep(70);
  });
  await saveCache(cache);

  const stillShort = personNames.filter((name) => (cache.people[name]?.images || []).length < 3);
  if (stillShort.length) {
    console.log(`padding images for ${stillShort.length} people`);
    await mapPool(stillShort, 3, async (name) => {
      const kind = people.get(name);
      const row = cache.people[name] || {
        kind,
        title: name,
        anecdote: fallbackPersonAnecdote(name, kind),
        images: [],
      };
      const extra = await imagesFor(name, row.title !== name ? row.title : "", coversByName.get(name), row.images);
      row.images = uniqueImages([...(row.images || []), ...extra], 9);
      cache.people[name] = row;
    });
    await saveCache(cache);
  }

  console.log(`songs: ${catalog.tracks.length}`);
  const wikiTitles = await wbSongTitles(catalog.tracks.map((track) => track.id).filter((id) => /^Q\d+$/.test(id)));
  console.log(`   wikidata enwiki titles: ${wikiTitles.size}`);
  done = 0;
  await mapPool(catalog.tracks, 3, async (track) => {
    if (
      cache.songs[track.id]?.anecdote &&
      !/remains in the canon because listeners/.test(cache.songs[track.id].anecdote) &&
      !/\b(corporation|beverage producer|fashion house|luxury goods)\b/i.test(cache.songs[track.id].anecdote)
    ) {
      done += 1;
      return;
    }
    let extract = track.extract;
    if (!extract || extract.length < 60) {
      const wikiTitle = wikiTitles.get(track.id);
      const fromWd = wikiTitle ? await wikiSummary(wikiTitle) : null;
      const summary = fromWd && !looksWrongSong(track, fromWd) ? fromWd : await resolveSongPage(track);
      extract = summary?.extract || "";
    }
    let anecdote = pickAnecdote(extract, "");
    if (!anecdote || anecdote.length < 60) {
      anecdote = (await itunesSongNote(track)) || fallbackSongAnecdote(track);
    }
    cache.songs[track.id] = { anecdote };
    done += 1;
    if (done % 50 === 0) {
      console.log(`   songs ${done}/${catalog.tracks.length}`);
      await saveCache(cache);
    }
    await sleep(50);
  });
  await saveCache(cache);

  const portraits = { generatedAt: new Date().toISOString(), people: {} };
  let shortImages = 0;
  for (const [name, kind] of people) {
    const row = cache.people[name] || {
      kind,
      title: name,
      anecdote: fallbackPersonAnecdote(name, kind),
      images: uniqueImages((coversByName.get(name) || []).map((src) => ({ src, alt: name })), 9),
    };
    if ((row.images || []).length < 3) shortImages += 1;
    portraits.people[name] = row;
  }

  for (const track of catalog.tracks) {
    track.anecdote = cache.songs[track.id]?.anecdote || fallbackSongAnecdote(track);
  }

  await fs.writeFile(PORTRAITS_PATH, JSON.stringify(portraits));
  await fs.writeFile(CATALOG_PATH, JSON.stringify(catalog));
  const withThree = Object.values(portraits.people).filter((p) => (p.images || []).length >= 3).length;
  console.log(
    JSON.stringify(
      {
        people: personNames.length,
        withThreeOrMoreImages: withThree,
        shortImages,
        songs: catalog.tracks.length,
        portraitsPath: PORTRAITS_PATH,
      },
      null,
      2
    )
  );
}

await main();
