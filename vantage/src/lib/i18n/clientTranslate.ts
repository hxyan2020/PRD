"use client";

import { looksChinese } from "./locale";

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
  if (hit) return hit;
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(cacheKey(text)) ?? "";
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

async function fetchZh(text: string): Promise<string> {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 450))}&langpair=en|zh-CN&de=${encodeURIComponent("hxyan.2015@gmail.com")}`;
  const response = await fetch(url);
  if (!response.ok) return "";
  const body = (await response.json()) as {
    responseStatus?: number;
    responseData?: { translatedText?: string };
  };
  return body.responseStatus === 200 ? body.responseData?.translatedText?.trim() ?? "" : "";
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
  if (looksChinese(trimmed)) return Promise.resolve(trimmed);
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
