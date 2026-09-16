import { createHash } from "node:crypto";
import { detectSourceLang, langPairToZh, looksUntranslated } from "./i18n/detectLang";
import { looksChinese } from "./i18n/locale";

const ENDPOINT = "https://api.mymemory.translated.net/get";
const EMAIL = "hxyan.2015@gmail.com";

function chunkForTranslate(text: string, max = 420): string[] {
  if (text.length <= max) return [text];
  const chunks: string[] = [];
  let rest = text;
  while (rest.length > max) {
    const slice = rest.slice(0, max);
    const cut = Math.max(slice.lastIndexOf(". "), slice.lastIndexOf("; "), slice.lastIndexOf(", "));
    const take = cut > 40 ? slice.slice(0, cut + 1) : slice;
    chunks.push(take.trim());
    rest = rest.slice(take.length).trim();
  }
  if (rest) chunks.push(rest);
  return chunks;
}

function isUsableZh(source: string, translated: string): boolean {
  if (!translated) return false;
  if (looksUntranslated(source, translated)) return false;
  if (source.length > 40 && translated.length < 8) return false;
  return true;
}

export function translationKey(text: string): string {
  return createHash("sha1").update(text.trim()).digest("hex");
}

export async function translateToZh(
  text: string,
  cache: Record<string, string>,
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return "";
  if (looksChinese(trimmed)) return trimmed;
  const key = translationKey(trimmed);
  if (cache[key] && !looksUntranslated(trimmed, cache[key])) return cache[key];

  const pair = langPairToZh(detectSourceLang(trimmed));
  const chunks = chunkForTranslate(trimmed);
  const parts: string[] = [];
  for (const chunk of chunks) {
    const url = `${ENDPOINT}?q=${encodeURIComponent(chunk)}&langpair=${encodeURIComponent(pair)}&de=${encodeURIComponent(EMAIL)}`;
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      throw new Error(`Translate HTTP ${response.status}`);
    }
    const body = (await response.json()) as {
      responseStatus?: number;
      responseData?: { translatedText?: string };
    };
    const translated = body.responseData?.translatedText?.trim();
    if (!translated || body.responseStatus !== 200 || !isUsableZh(chunk, translated)) {
      throw new Error(`Translate rejected: ${body.responseStatus ?? "unknown"}`);
    }
    parts.push(translated);
  }
  const joined = parts.join("");
  cache[key] = joined;
  return joined;
}

export async function translateManyToZh(
  texts: string[],
  cache: Record<string, string>,
  concurrency = 2,
): Promise<string[]> {
  const unique = [...new Set(texts.filter(Boolean))];
  let index = 0;
  async function worker() {
    while (index < unique.length) {
      const current = unique[index];
      index += 1;
      try {
        await translateToZh(current, cache);
      } catch {
        // Leave uncached; the UI can retry when the reader switches to Chinese.
      }
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, unique.length || 1) }, worker));
  return texts.map((text) => cache[translationKey(text.trim())] ?? "");
}
