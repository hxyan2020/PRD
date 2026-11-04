export const MYMEMORY_GET = "https://api.mymemory.translated.net/get";
export const GTX_GET = "https://translate.googleapis.com/translate_a/single";
export const TRANSLATE_MAX_CHARS = 900;

export const TRANSLATE_TARGETS = {
  en: "en",
  zh: "zh-CN",
  hi: "hi",
  es: "es",
  fr: "fr",
  ar: "ar",
  bn: "bn",
  pt: "pt",
};

export const MYMEMORY_TARGETS = {
  en: "en",
  zh: "zh-CN",
  hi: "hi",
  es: "es",
  fr: "fr",
  ar: "ar",
  bn: "bn",
  pt: "pt",
};

const LATIN_MARKERS = {
  en: ["the", "and", "you", "that", "with", "this", "have", "your", "dont", "gonna", "wanna", "its", "im"],
  es: ["que", "los", "las", "una", "por", "esta", "como", "para", "pero", "amor", "mi", "te"],
  fr: ["les", "une", "des", "est", "pas", "pour", "dans", "vous", "avec", "je", "tu", "que"],
  pt: ["nao", "voce", "para", "esta", "uma", "com", "eu", "meu", "minha", "amor"],
};

const translateCache = new Map();

export function translateTarget(locale) {
  return TRANSLATE_TARGETS[locale] || "en";
}

export function localeRoot(locale) {
  return String(locale || "en").toLowerCase().slice(0, 2);
}

export function splitLyricLines(text) {
  return String(text || "").replace(/\r\n/g, "\n").split("\n");
}

export function isSkippableLyricLine(line) {
  const s = String(line || "").trim();
  if (!s) return true;
  if (/^♪+$/u.test(s)) return true;
  if (/^[\p{P}\p{S}\p{N}\s]+$/u.test(s)) return true;
  return false;
}

function countScript(sample, script) {
  try {
    return (sample.match(new RegExp(`\\p{Script=${script}}`, "gu")) || []).length;
  } catch {
    return 0;
  }
}

function latinTokens(sample) {
  return String(sample || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^\p{L}]+/u)
    .filter((word) => word.length > 1);
}

export function detectLatinLanguage(sample) {
  const words = latinTokens(sample);
  if (!words.length) return "und";
  const scores = { en: 0, es: 0, fr: 0, pt: 0 };
  for (const word of words) {
    for (const [lang, markers] of Object.entries(LATIN_MARKERS)) {
      if (markers.includes(word)) scores[lang] += 1;
    }
  }
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (!ranked[0][1]) return "en";
  if (ranked[0][1] === ranked[1][1]) return "en";
  return ranked[0][0];
}

export function detectLyricsLanguage(text) {
  const sample = String(text || "").slice(0, 2500);
  if (!sample.trim()) return "und";
  const zh = countScript(sample, "Han");
  const ar = countScript(sample, "Arabic");
  const hi = countScript(sample, "Devanagari");
  const bn = countScript(sample, "Bengali");
  const latin = countScript(sample, "Latin");
  const letters = zh + ar + hi + bn + latin || 1;
  if (zh / letters > 0.18) return "zh";
  if (ar / letters > 0.18) return "ar";
  if (hi / letters > 0.18) return "hi";
  if (bn / letters > 0.18) return "bn";
  if (latin / letters > 0.35) return detectLatinLanguage(sample);
  return "und";
}

export function lyricsNeedTranslation(text, locale) {
  const target = localeRoot(locale);
  const detected = detectLyricsLanguage(text);
  if (detected === target) return false;
  if (detected === "und" && target === "en") return false;
  return Boolean(String(text || "").trim());
}

export function myMemoryUrl(text, target, source = "Autodetect") {
  const params = new URLSearchParams({
    q: text,
    langpair: `${source}|${target}`,
  });
  return `${MYMEMORY_GET}?${params}`;
}

export function gtxTarget(locale) {
  return TRANSLATE_TARGETS[localeRoot(locale)] || "en";
}

export function gtxSource(text) {
  const detected = detectLyricsLanguage(text);
  if (!detected || detected === "und") return "auto";
  return detected === "zh" ? "zh-CN" : detected;
}

export function gtxUrl(text, locale, source = "") {
  const params = new URLSearchParams({
    client: "gtx",
    sl: source || gtxSource(text),
    tl: gtxTarget(locale),
    dt: "t",
    q: text,
  });
  return `${GTX_GET}?${params}`;
}

export function parseGtxPayload(payload) {
  if (!Array.isArray(payload) || !Array.isArray(payload[0])) return "";
  return payload[0].map((part) => (part && part[0] ? String(part[0]) : "")).join("");
}

export function isUnusableTranslation(text, original) {
  const value = String(text || "").trim();
  if (!value) return true;
  if (/MYMEMORY WARNING|YOU USED ALL AVAILABLE FREE TRANSLATIONS|INVALID LANGUAGE PAIR|QUERY LENGTH|NO QUERY SPECIFIED/i.test(value)) {
    return true;
  }
  return value === String(original || "").trim();
}

function scriptHint(locale) {
  const root = localeRoot(locale);
  if (root === "zh") return /[\u3400-\u9fff]/;
  if (root === "ar") return /[\u0600-\u06ff]/;
  if (root === "hi") return /[\u0900-\u097f]/;
  if (root === "bn") return /[\u0980-\u09ff]/;
  return null;
}

export function pickTranslatedText(payload, original, locale) {
  const originalText = String(original || "").trim();
  const candidates = [];
  const primary = payload?.responseData?.translatedText;
  if (primary) candidates.push(String(primary));
  for (const match of payload?.matches || []) {
    if (match?.translation) candidates.push(String(match.translation));
  }
  const hint = scriptHint(locale);
  const usable = (item) => item && !isUnusableTranslation(item, originalText);
  if (hint) {
    const scripted = candidates.find((item) => hint.test(item) && usable(item));
    if (scripted) return scripted.trim();
    return "";
  }
  const changed = candidates.find((item) => usable(item));
  return (changed || "").trim();
}

export function chunkLyricLines(lines, maxChars = TRANSLATE_MAX_CHARS) {
  const chunks = [];
  let current = [];
  let size = 0;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (isSkippableLyricLine(line)) continue;
    const extra = line.length + (current.length ? 1 : 0);
    if (current.length && size + extra > maxChars) {
      chunks.push(current);
      current = [];
      size = 0;
    }
    current.push({ index: i, text: line });
    size += extra;
  }
  if (current.length) chunks.push(current);
  return chunks;
}

export function alignTranslatedChunk(chunk, translatedText) {
  const parts = splitLyricLines(String(translatedText || "")).map((line) => line.trim());
  while (parts.length && !parts[0]) parts.shift();
  while (parts.length && !parts[parts.length - 1]) parts.pop();
  if (parts.length === chunk.length) {
    return chunk.map((item, i) => ({ ...item, translated: parts[i] }));
  }
  return null;
}

async function readJson(response) {
  if (!response || !response.ok) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function acceptTranslation(text, original, locale) {
  if (isUnusableTranslation(text, original)) return "";
  const hint = scriptHint(locale);
  if (hint && !hint.test(text)) return "";
  return String(text || "").trim();
}

async function translateGtx(text, locale, fetchFn) {
  const payload = await readJson(await fetchFn(gtxUrl(text, locale)).catch(() => null));
  return acceptTranslation(parseGtxPayload(payload), text, locale);
}

async function translateMyMemory(text, locale, fetchFn) {
  const target = MYMEMORY_TARGETS[localeRoot(locale)] || translateTarget(locale);
  const source = gtxSource(text);
  const from = source === "zh-CN" ? "zh-CN" : source;
  const pairs = source === "auto"
    ? [["Autodetect", target], ["en", target]]
    : [[from, target], ["Autodetect", target]];
  for (const [from, to] of pairs) {
    const payload = await readJson(await fetchFn(myMemoryUrl(text, to, from)).catch(() => null));
    const translated = pickTranslatedText(payload, text, locale);
    if (translated) return translated;
  }
  return "";
}

async function translateBlob(text, locale, fetchFn) {
  return (await translateGtx(text, locale, fetchFn)) || (await translateMyMemory(text, locale, fetchFn));
}

async function translateChunk(chunk, locale, fetchFn) {
  const joined = chunk.map((item) => item.text).join("\n");
  const blob = await translateBlob(joined, locale, fetchFn);
  const aligned = alignTranslatedChunk(chunk, blob);
  if (aligned) return aligned;
  if (chunk.length === 1) {
    return [{ ...chunk[0], translated: blob && blob !== chunk[0].text ? blob : "" }];
  }
  const mid = Math.ceil(chunk.length / 2);
  const left = await translateChunk(chunk.slice(0, mid), locale, fetchFn);
  const right = await translateChunk(chunk.slice(mid), locale, fetchFn);
  return [...left, ...right];
}

function hasUsableLines(lines, translations) {
  return (translations || []).some((line, index) => {
    const translated = String(line || "").trim();
    return translated && translated !== String(lines[index] || "").trim() && !isUnusableTranslation(translated, lines[index]);
  });
}

export async function translateLyricLines(text, locale, { fetchFn = fetch, cache = translateCache } = {}) {
  const lines = splitLyricLines(text);
  const target = localeRoot(locale);
  const key = `${target}|||${text}`;
  if (cache?.has?.(key)) return cache.get(key);
  if (!lyricsNeedTranslation(text, locale)) {
    const skip = { needed: false, lines, translations: null };
    cache?.set?.(key, skip);
    return skip;
  }

  const translations = lines.map(() => "");
  const chunks = chunkLyricLines(lines);
  for (const chunk of chunks) {
    const done = await translateChunk(chunk, locale, fetchFn);
    for (const item of done) translations[item.index] = item.translated || "";
  }
  const result = { needed: true, lines, translations };
  if (hasUsableLines(lines, translations)) cache?.set?.(key, result);
  return result;
}

export function clearTranslateCache(cache = translateCache) {
  cache?.clear?.();
}
