import {
  finishPoint,
  isIncompletePoint,
  isIncompleteZh,
  keyPoints,
  shouldMergeSplit,
  tidyPoint,
} from "./extract";
import type { NewsItem } from "./types";

function mergeAbbreviationSplits(points: string[]): string[] {
  const work = points.map((point) => point.trim()).filter(Boolean);
  let index = 0;
  while (index < work.length - 1) {
    if (shouldMergeSplit(work[index], work[index + 1])) {
      work.splice(index, 2, `${work[index]} ${work[index + 1]}`);
      continue;
    }
    index += 1;
  }
  return work;
}

function keepChinese(english: string, chinese: string | undefined): string {
  const value = chinese?.trim() ?? "";
  if (!value) return "";
  if (isIncompleteZh(value)) return "";
  if (isIncompletePoint(english)) return "";
  if (/[A-Za-z]{10,}\.\.\.$/.test(value)) return "";
  return value;
}

export function repairNewsItem(item: NewsItem): NewsItem {
  const previousZh = new Map(
    (item.keyPoints ?? []).map((english, index) => [english, item.keyPointsZh?.[index] ?? ""]),
  );
  const merged = mergeAbbreviationSplits(item.keyPoints ?? []);
  let points = merged
    .map((point) => finishPoint(tidyPoint(point)))
    .filter((point) => point && !isIncompletePoint(point));

  if (points.length === 0) {
    points = keyPoints(item.caption, merged.join(" "));
  }

  if (points.length === 0) {
    const caption = finishPoint(item.caption.trim());
    if (caption) points = [caption];
  }

  const captionZh = item.captionZh && !isIncompleteZh(item.captionZh) ? item.captionZh : "";

  return {
    ...item,
    captionZh,
    keyPoints: points,
    keyPointsZh: points.map((point) => keepChinese(point, previousZh.get(point))),
  };
}

export function repairNewsItems(items: NewsItem[]): NewsItem[] {
  return items.map(repairNewsItem);
}
