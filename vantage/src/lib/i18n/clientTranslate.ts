"use client";

import { detectSourceLang, langPairToZh, looksUntranslated } from "./detectLang";

const memory = new Map<string, string>();
const waiters = new Map<string, Array<(value: string) => void>>();
const queue: string[] = [];
let active = 0;
const LIMIT = 2;

function cacheKey(text: string): string {
  return `vantage-zh:${text.trim()}`;
}

function readStore(text: string): string {
  const hit = memory.get(text);
  if (hit && !looksUntranslated(text, hit)) return hit;
  if (typeof window === "undefined") return "";
  try {
    const stored = window.localStorage.getItem(cacheKey(text)) ?? "";
    return stored && !looksUntranslated(text, stored) ? stored : "";
  } catch {
    return "";
  }
}

function writeStore(text: string, zh: string): void {
  memory.set(text, zh);
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(cacheKey(text), zh);
  } catch {
    // Ignore quota errors; in-memory cache still works for the session.
  }
}

function chunkForClient(text: string, max = 420): string[] {
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

async function fetchZh(text: string): Promise<string> {
  const pair = langPairToZh(detectSourceLang(text));
  const parts: string[] = [];
  for (const chunk of chunkForClient(text)) {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=${encodeURIComponent(pair)}&de=${encodeURIComponent("hxyan.2015@gmail.com")}`;
    const response = await fetch(url);
    if (!response.ok) return "";
    const body = (await response.json()) as {
      responseStatus?: number;
      responseData?: { translatedText?: string };
    };
    const translated =
      body.responseStatus === 200 ? body.responseData?.translatedText?.trim() ?? "" : "";
    if (!translated || looksUntranslated(chunk, translated)) return "";
    if (text.length > 40 && translated.length < 8) return "";
    parts.push(translated);
  }
  return parts.join("");
}

function pump(): void {
  if (active >= LIMIT || queue.length === 0) return;
  const text = queue.shift();
  if (!text) return;
  active += 1;
  fetchZh(text)
    .then((zh) => {
      if (zh) writeStore(text, zh);
      const resolvers = waiters.get(text) ?? [];
      waiters.delete(text);
      for (const resolve of resolvers) resolve(zh);
    })
    .catch(() => {
      const resolvers = waiters.get(text) ?? [];
      waiters.delete(text);
      for (const resolve of resolvers) resolve("");
    })
    .finally(() => {
      active -= 1;
      pump();
    });
}

export function requestZh(text: string): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return Promise.resolve("");
  if (detectSourceLang(trimmed) === "zh") return Promise.resolve(trimmed);
  const cached = readStore(trimmed);
  if (cached) return Promise.resolve(cached);
  return new Promise((resolve) => {
    const pending = waiters.get(trimmed);
    if (pending) {
      pending.push(resolve);
      return;
    }
    waiters.set(trimmed, [resolve]);
    queue.push(trimmed);
    pump();
  });
}
