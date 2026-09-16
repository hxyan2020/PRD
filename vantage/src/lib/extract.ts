const HTML_TAG = /<[^>]+>/g;
const WHITESPACE = /\s+/g;

export function stripHtml(value: string | undefined | null): string {
  if (!value) return "";
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(HTML_TAG, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(WHITESPACE, " ")
    .trim();
}

export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((part) => part.trim())
    .filter((part) => part.length > 24);
}

export function keyPoints(title: string, summary: string, max = 4): string[] {
  const cleaned = stripHtml(summary);
  const sentences = splitSentences(cleaned);
  const points = sentences.slice(0, max);

  if (points.length === 0 && cleaned) {
    points.push(cleaned.slice(0, 280) + (cleaned.length > 280 ? "…" : ""));
  }

  if (points.length === 0 && title) {
    points.push(title.trim());
  }

  return points.map((point) =>
    point.endsWith(".") || point.endsWith("!") || point.endsWith("?")
      ? point
      : `${point}.`,
  );
}

export function normalizeTitle(title: string): string {
  return stripHtml(title)
    .replace(/\s*[-|–]\s*(CoinDesk|Cointelegraph|Reuters|Bloomberg|Finextra).*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function storyKey(title: string, link: string): string {
  const host = (() => {
    try {
      return new URL(link).hostname.replace(/^www\./, "");
    } catch {
      return link;
    }
  })();
  const normalized = normalizeTitle(title)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return `${host}::${normalized.slice(0, 120)}`;
}
