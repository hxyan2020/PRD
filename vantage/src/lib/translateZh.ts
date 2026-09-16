import { createHash } from "node:crypto";
import { looksChinese } from "./i18n/locale";

const ENDPOINT = "https://api.mymemory.translated.net/get";
const EMAIL = "hxyan.2015@gmail.com";

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
  if (cache[key]) return cache[key];

  const url = `${ENDPOINT}?q=${encodeURIComponent(trimmed.slice(0, 450))}&langpair=en|zh-CN&de=${encodeURIComponent(EMAIL)}`;
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
  if (!translated || body.responseStatus !== 200) {
    throw new Error(`Translate rejected: ${body.responseStatus ?? "unknown"}`);
  }
  cache[key] = translated;
  return translated;
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
