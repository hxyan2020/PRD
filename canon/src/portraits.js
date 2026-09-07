export const PLACEHOLDER_CREDITS = new Set([
  "",
  "—",
  "-",
  "n/a",
  "na",
  "not listed",
  "various / ceremonial performers",
]);

export function normalizeCreditKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function isPlaceholderCredit(value) {
  return PLACEHOLDER_CREDITS.has(normalizeCreditKey(value));
}

const KEEP_TOGETHER = new Set([
  "tones and i",
  "earth, wind & fire",
  "earth wind & fire",
  "simon & garfunkel",
  "simon and garfunkel",
  "hall & oates",
  "hall and oates",
  "salt-n-pepa",
  "johnny cash and the tennessee two",
  "the staple singers",
]);

export function splitCredits(value) {
  if (isPlaceholderCredit(value)) return [];
  const chunks = String(value)
    .split(/\s*·\s*|\s+ft\.?\s+|\s+feat\.?\s+|\s+featuring\s+/i)
    .map((part) => part.trim())
    .filter((part) => part && !isPlaceholderCredit(part));
  const out = [];
  for (const chunk of chunks) {
    out.push(...splitCollabChunk(chunk));
  }
  return out;
}

function splitCollabChunk(chunk) {
  const key = chunk.toLowerCase();
  if (KEEP_TOGETHER.has(key)) return [chunk];
  if (/\b(singer|songwriter|rapper|musician|duo|band|group)\b/i.test(chunk) && !/,/.test(chunk)) {
    return [chunk];
  }
  if (/\band the\b/i.test(chunk) || /\s+&\s+the\s+/i.test(chunk)) return [chunk];
  if (chunk.includes(",")) {
    return chunk
      .split(/\s*,\s*|\s+and\s+/i)
      .map((part) => part.trim())
      .filter(Boolean);
  }
  if (chunk.includes(" & ") && !/\b(earth|blood|salt|simon)\b/i.test(chunk)) {
    return chunk
      .split(/\s+&\s+/)
      .map((part) => part.trim())
      .filter(Boolean);
  }
  if (/\s+and\s+/i.test(chunk)) {
    const parts = chunk.split(/\s+and\s+/i).map((part) => part.trim()).filter(Boolean);
    if (parts.length === 2 && parts.every((part) => part.split(/\s+/).length <= 4 && part.length > 1)) {
      return parts;
    }
  }
  return [chunk];
}

export function pickAnecdote(extract, fallback = "") {
  const text = String(extract || "").replace(/\s+/g, " ").trim();
  if (!text) return String(fallback || "").trim();
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  let out = "";
  for (const sentence of sentences) {
    const next = out ? `${out} ${sentence}` : sentence;
    if (next.length > 520 && out) break;
    out = next;
    if (out.length >= 220 && sentences.indexOf(sentence) >= 1) break;
  }
  return out || text.slice(0, 480);
}

export function fallbackSongAnecdote(track) {
  const who = [...splitCredits(track?.singer), ...splitCredits(track?.band)];
  const names = who.length ? who.join(" and ") : "its credited performers";
  const when = track?.year ? ` in ${track.year}` : "";
  const where =
    track?.releaseCountry && !isPlaceholderCredit(track.releaseCountry)
      ? ` from ${track.releaseCountry}`
      : "";
  const genre = track?.genre && !isPlaceholderCredit(track.genre) ? ` ${track.genre}` : "";
  return `${track?.name || "This recording"} is a${genre} work by ${names}${when}${where}. It remains in the canon because listeners kept it in circulation, not because of a single chart week.`;
}

export function fallbackPersonAnecdote(name, kind) {
  const role = kind === "band" ? "band" : "singer";
  return `${name} appears in this archive as a ${role} whose recordings still shape how people listen. The notes below are drawn from public encyclopedia pages when they exist.`;
}

export function uniqueImages(images, limit = 6) {
  const seen = new Map();
  const order = [];
  for (const item of images || []) {
    const src = String(item?.src || item || "").trim();
    if (!src) continue;
    const key = imageKey(src);
    if (!key) continue;
    const next = {
      src,
      alt: String(item?.alt || "").trim(),
    };
    if (!seen.has(key)) {
      seen.set(key, next);
      order.push(key);
      continue;
    }
    if (imageQuality(src) > imageQuality(seen.get(key).src)) {
      seen.set(key, next);
    }
  }
  return order.slice(0, limit).map((key) => seen.get(key));
}

export function imagePixelHint(src) {
  const raw = String(src || "");
  const wiki = raw.match(/\/(\d+)px-/i);
  if (wiki) return Number(wiki[1]);
  const width = raw.match(/[?&]width=(\d+)/i);
  if (width) return Number(width[1]);
  const box = raw.match(/(\d+)x(\d+)bb/i);
  if (box) return Number(box[1]);
  if (/\/Special:FilePath\//i.test(raw)) return 800;
  return 0;
}

export function imageQuality(src) {
  let score = imagePixelHint(src);
  if (/upload\.wikimedia\.org/i.test(src)) score += 40;
  if (/\bcropped\b/i.test(src)) score += 8;
  return score;
}

export function enlargeImageUrl(src) {
  const raw = String(src || "").trim();
  if (!raw) return "";
  if (/\/Special:FilePath\//i.test(raw)) {
    try {
      const url = new URL(raw);
      url.searchParams.set("width", "1920");
      return url.toString();
    } catch {
      return raw;
    }
  }
  if (/upload\.wikimedia\.org\/wikipedia\/.*\/thumb\//i.test(raw)) {
    return raw.replace(/\/\d+px-/i, "/1920px-");
  }
  return raw.replace(/100x100bb|200x200bb|300x300bb|600x600bb/i, "1200x1200bb");
}

function wikiFileName(src) {
  const url = new URL(src, "https://example.com");
  const pathName = decodeURIComponent(url.pathname);
  const filePath = pathName.match(/\/Special:FilePath\/(.+)$/i);
  if (filePath) return filePath[1];
  const thumb = pathName.match(/\/thumb\/[^/]+\/[^/]+\/([^/]+)\/\d+px-/i);
  if (thumb) return thumb[1];
  const original = pathName.match(/\/wikipedia\/[^/]+\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/([^/]+)$/i);
  if (original) return original[1];
  return pathName.split("/").pop() || "";
}

function wikiFileStem(fileName) {
  let stem = String(fileName || "")
    .toLowerCase()
    .replace(/^\d+px-/i, "")
    .replace(/\.[a-z0-9]+$/i, "");
  let prev = "";
  while (stem !== prev) {
    prev = stem;
    stem = stem
      .replace(/[_-]?\((?:cropped(?:[^)]*)?|3x4[^)]*|contrast|thumb|crop)\)/g, "")
      .replace(/[_-]cropped(?:[_\s.-]?\d*)?$/g, "")
      .replace(/-cropped$/g, "")
      .replace(/_+$/g, "")
      .replace(/-+$/g, "");
  }
  return stem.replace(/_+/g, "_").replace(/\s+/g, " ").trim();
}

export function imageKey(src) {
  try {
    const url = new URL(src, "https://example.com");
    const pathName = url.pathname;
    const deezer = pathName.match(/\/images\/(?:artist|cover|playlist)\/([a-f0-9]+)\//i);
    if (deezer) return `deezer:${deezer[1].toLowerCase()}`;
    const spotify = pathName.match(/ab67616d0000[a-z0-9]+([a-f0-9]{32})/i);
    if (spotify) return `spotify:${spotify[1].toLowerCase()}`;
    const fileName = wikiFileName(src);
    const base = fileName.toLowerCase();
    if (/^\d+x\d+bb\.[a-z]+$/i.test(base) || /^(cover_[a-z]+|picture_[a-z]+)\.[a-z]+$/i.test(base)) {
      return pathName.toLowerCase();
    }
    return wikiFileStem(fileName) || base;
  } catch {
    return String(src || "").toLowerCase();
  }
}

export function foldName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function titleFitsName(name, title) {
  const want = foldName(searchName(name) || name);
  const got = foldName(String(title || "").replace(/\s*\([^)]*\)\s*/g, " "));
  if (!want || !got) return false;
  if (got === want) return true;
  if (want.includes(" ") && (got.startsWith(`${want} `) || want.startsWith(`${got} `) || want.includes(` ${got} `))) {
    return true;
  }
  const skip = new Set(["the", "and", "dj", "band", "group", "duo", "trio", "quartet"]);
  const wantParts = want.split(" ").filter((word) => word.length > 1 && !skip.has(word));
  const gotParts = got.split(" ").filter((word) => word.length > 1 && !skip.has(word));
  const gotSet = new Set(gotParts);
  if (wantParts.length >= 2 && wantParts.every((part) => gotSet.has(part))) return true;
  if (gotParts.length >= 2 && gotParts.every((part) => wantParts.includes(part))) return true;
  if (wantParts.length >= 2 && gotSet.has(wantParts.at(-1)) && gotParts.length >= 2) {
    const w0 = wantParts[0];
    const g0 = gotParts[0];
    if (g0.startsWith(w0.slice(0, 4)) || w0.startsWith(g0.slice(0, 4))) return true;
  }
  return false;
}

export function anecdoteFits(name, anecdote) {
  const cleaned = searchName(name) || name;
  const token = cleaned
    .split(/\s+/)
    .filter((word) => word.length > 2 && !/^(the|and|band)$/i.test(word))[0];
  if (!token) return true;
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(escaped, "i").test(String(anecdote || ""));
}

export function searchName(name) {
  return String(name || "")
    .replace(
      /^(?:american|british|canadian|swedish|french|spanish|nigerian|australian|colombian|irish|german|italian|korean|japanese|brazilian)\s+/i,
      ""
    )
    .replace(/^(?:pop|rock|folk|soul|jazz|rap|hip[- ]hop)\s+(?=duo|band|group|singer|trio)/i, "")
    .replace(
      /^(?:singer and songwriter|singer-songwriter|singer|rapper|musician|duo|band|group|trio)(?:\s+and\s+songwriter)?\s+/i,
      ""
    )
    .replace(/\s+\S*\d{2,}\S*/g, "")
    .replace(/\s+\((?:song|musician|band|singer|group).*$/i, "")
    .trim();
}

export function displayPersonName(name) {
  return searchName(name) || name;
}
