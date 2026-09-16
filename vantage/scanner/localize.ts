import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { isIncompleteZh } from "../src/lib/extract";
import { translationKey, translateManyToZh } from "../src/lib/translateZh";
import type { Briefing, NewsItem } from "../src/lib/types";

const DATA = path.resolve(__dirname, "../data");
const CACHE_FILE = path.join(DATA, "translation-cache.json");

async function loadCache(): Promise<Record<string, string>> {
  try {
    return JSON.parse(await readFile(CACHE_FILE, "utf8")) as Record<string, string>;
  } catch {
    return {};
  }
}

export async function attachChinese(
  items: NewsItem[],
  previous: Briefing | null,
): Promise<void> {
  const cache = await loadCache();
  const prior = new Map((previous?.items ?? []).map((item) => [item.id, item]));

  for (const item of items) {
    const old = prior.get(item.id);
    if (old?.caption === item.caption && old.captionZh && !isIncompleteZh(old.captionZh)) {
      item.captionZh = old.captionZh;
    }
    const englishMatches =
      !!old &&
      old.keyPoints.length === item.keyPoints.length &&
      old.keyPoints.every((point, index) => point === item.keyPoints[index]);
    if (englishMatches && old.keyPointsZh?.length) {
      item.keyPointsZh = old.keyPointsZh.map((value) =>
        value && !isIncompleteZh(value) ? value : "",
      );
    }
  }

  const missing = items.flatMap((item) => {
    const texts: string[] = [];
    if (!item.captionZh || isIncompleteZh(item.captionZh)) texts.push(item.caption);
    item.keyPoints.forEach((point, index) => {
      const zh = item.keyPointsZh[index];
      if (!zh || isIncompleteZh(zh)) texts.push(point);
    });
    return texts;
  });

  if (missing.length) {
    await translateManyToZh(missing, cache);
  }

  for (const item of items) {
    if (!item.captionZh || isIncompleteZh(item.captionZh)) {
      item.captionZh = cache[translationKey(item.caption)] ?? "";
    }
    item.keyPointsZh = item.keyPoints.map((point, index) => {
      const current = item.keyPointsZh[index];
      if (current && !isIncompleteZh(current)) return current;
      return cache[translationKey(point)] || "";
    });
  }

  await writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
}
