import { extractEmbeddedDate, extractUrlDate, parseLooseDate } from "./dates";

export function sanitizeFeedXml(body: string): string {
  let text = body.replace(/^\uFEFF/, "");
  const xmlStart = text.search(/<\?xml\b/i);
  const rssStart = text.search(/<(?:rss|feed|rdf:RDF)\b/i);
  let start = -1;
  if (xmlStart >= 0 && (rssStart < 0 || xmlStart <= rssStart)) start = xmlStart;
  else if (rssStart >= 0) start = rssStart;
  if (start > 0) text = text.slice(start);
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "").trim();
}

export function looksLikeHtml(body: string): boolean {
  const head = body.slice(0, 600).toLowerCase();
  const hasHtml = /<!doctype html|<html[\s>]/.test(head);
  const hasFeed = /<(?:rss|feed|rdf:rdf)\b/.test(head) || /<\?xml\b/.test(head);
  return hasHtml && !hasFeed;
}

export interface DatedFeedFields {
  isoDate?: string;
  pubDate?: string;
  dcDate?: string;
  updated?: string;
  published?: string;
  date?: string;
  link?: string;
  guid?: string;
  content?: string;
  contentSnippet?: string;
  summary?: string;
  title?: string;
}

export function parseFeedItemDate(
  item: DatedFeedFields,
  lastBuildDate: Date | null = null,
): Date | null {
  for (const value of [
    item.isoDate,
    item.pubDate,
    item.dcDate,
    item.updated,
    item.published,
    item.date,
  ]) {
    if (!value) continue;
    const date = parseLooseDate(value);
    if (date) return date;
  }

  const blob = [item.content, item.contentSnippet, item.summary, item.title]
    .filter(Boolean)
    .join("\n");
  const embedded = extractEmbeddedDate(blob);
  if (embedded) return embedded;

  return extractUrlDate(item.link || item.guid || "", lastBuildDate);
}

export function googleNewsRss(query: string): string {
  const params = new URLSearchParams({
    q: query,
    hl: "en-US",
    gl: "US",
    ceid: "US:en",
  });
  return `https://news.google.com/rss/search?${params.toString()}`;
}
