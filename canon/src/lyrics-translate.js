export const MYMEMORY_GET = "https://api.mymemory.translated.net/get";
export const TRANSLATE_MAX_CHARS = 450;

export const TRANSLATE_TARGETS = {
  en: "en",
  zh: "zh-CN",
  hi: "hi-IN",
  es: "es",
  fr: "fr",
  ar: "ar-SA",
  bn: "bn-IN",
  pt: "pt-BR",
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
  if (hint) {
    const scripted = candidates.find((item) => hint.test(item) && item.trim() !== originalText);
    if (scripted) return scripted.trim();
  }
  const changed = candidates.find((item) => item.trim() && item.trim() !== originalText);
  return (changed || primary || "").trim();
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

async function translateBlob(text, locale, fetchFn) {
  const target = translateTarget(locale);
  const url = myMemoryUrl(text, target);
  const payload = await readJson(await fetchFn(url).catch(() => null));
  return pickTranslatedText(payload, text, locale);
}

async function translateChunk(chunk, locale, fetchFn) {
  const joined = chunk.map((item) => item.text).join("\n");
  const blob = await translateBlob(joined, locale, fetchFn);
  const aligned = alignTranslatedChunk(chunk, blob);
  if (aligned) return aligned;
  const out = [];
  for (const item of chunk) {
    const translated = await translateBlob(item.text, locale, fetchFn);
    out.push({ ...item, translated: translated && translated !== item.text ? translated : "" });
  }
  return out;
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
  cache?.set?.(key, result);
  return result;
}

export function clearTranslateCache(cache = translateCache) {
  cache?.clear?.();
}
