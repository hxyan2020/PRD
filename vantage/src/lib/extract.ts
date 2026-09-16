const HTML_TAG = /<[^>]+>/g;
const WHITESPACE = /\s+/g;
const JUNK_POINT =
  /^(author:\s*a finextra|advertisement|subscribe|read more|click here|sign up)/i;

const ABBREVIATIONS = [
  "U.S.",
  "U.K.",
  "E.U.",
  "a.m.",
  "p.m.",
  "A.M.",
  "P.M.",
  "Mr.",
  "Mrs.",
  "Ms.",
  "Dr.",
  "Prof.",
  "Inc.",
  "Ltd.",
  "Corp.",
  "Jr.",
  "Sr.",
  "vs.",
  "No.",
  "St.",
  "e.g.",
  "i.e.",
  "etc.",
  "Jan.",
  "Feb.",
  "Mar.",
  "Apr.",
  "Jun.",
  "Jul.",
  "Aug.",
  "Sep.",
  "Sept.",
  "Oct.",
  "Nov.",
  "Dec.",
  "Gen.",
  "Sen.",
  "Rep.",
  "Gov.",
  "D.A.",
];

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

function protectAbbreviations(text: string): { text: string; tokens: string[] } {
  let work = text;
  const tokens: string[] = [];
  for (const abbr of ABBREVIATIONS) {
    if (!work.includes(abbr)) continue;
    const token = `⟦${tokens.length}⟧`;
    work = work.split(abbr).join(token);
    tokens.push(abbr);
  }
  return { text: work, tokens };
}

function restoreAbbreviations(text: string, tokens: string[]): string {
  let work = text;
  tokens.forEach((abbr, index) => {
    work = work.split(`⟦${index}⟧`).join(abbr);
  });
  return work;
}

export function splitSentences(text: string): string[] {
  const protectedText = protectAbbreviations(text);
  return protectedText.text
    .split(/(?<=[.!?])\s+(?=[A-Z0-9“"])/)
    .map((part) => restoreAbbreviations(part.trim(), protectedText.tokens))
    .filter((part) => part.length > 24 && !JUNK_POINT.test(part));
}

const MONTH_TAIL =
  /\b(sept|sep|jan|feb|mar|apr|jun|jul|aug|oct|nov|dec)\.$/i;
const TITLE_ABBR_TAIL = /\b(u\.s|u\.k|e\.u|d\.a|st)\.$/i;
const CLOCK_TAIL = /\b(a\.m|p\.m)\.$/i;
const TIMEZONE_HEAD =
  /^(EDT|EST|PST|PDT|CST|CDT|MST|MDT|PT|ET|GMT|UTC|AEDT|AEST|BST|CET|CEST|JST)\b/;

export function shouldMergeSplit(current: string, next: string): boolean {
  const cur = current.trim();
  const nxt = next.trim();
  if (!cur || !nxt) return false;
  if (MONTH_TAIL.test(cur) && /^\d/.test(nxt)) return true;
  if (TITLE_ABBR_TAIL.test(cur) && /^[A-Z]/.test(nxt)) return true;
  if (CLOCK_TAIL.test(cur) && (TIMEZONE_HEAD.test(nxt) || /^\d/.test(nxt) || nxt.startsWith("("))) {
    return true;
  }
  if (/\([^)]*$/.test(cur)) return true;
  return false;
}

export function isBrokenAbbreviationTail(text: string): boolean {
  return MONTH_TAIL.test(text.trim()) || TITLE_ABBR_TAIL.test(text.trim());
}

export function tidyPoint(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\d{1,2},\s+\d{4}\s+\/PRNewswire\/\s*--\s*/i, "")
    .trim();
}

export function isIncompletePoint(text: string): boolean {
  const raw = text.trim();
  if (!raw) return true;
  if (/\.\.\.$|…$/.test(raw)) return true;
  const value = tidyPoint(raw);
  if (!value) return true;
  if (JUNK_POINT.test(value)) return true;
  if (/^(your day-ahead look for sept\.?)$/i.test(value)) return true;
  if (/^\d{1,2},\s+(?!\d{4}\b)/.test(value)) return true;
  if (/^\d{1,2},\s+\d{4}\b/.test(value) && value.length < 48) return true;
  if (isBrokenAbbreviationTail(value)) return true;
  if (/\([^)]*$/.test(value)) return true;
  const stripped = value.replace(/[.!?…]+$/g, "").trim();
  if (/\b(at|the|and|or|of|for|to|with|a|an)$/i.test(stripped)) return true;
  if (/\s[a-z]\.$/i.test(value)) return true;
  if (value.length < 24 && !/[.!?。！？]$/.test(value)) return true;
  return false;
}

export function isIncompleteZh(text: string): boolean {
  const value = text.trim();
  if (!value) return true;
  if (/^\d{1,2}\s*[，,]\s*/.test(value)) return true;
  if (/[.…]+$/.test(value)) return true;
  if (/寻找9月|未来的一天寻找/.test(value)) return true;
  if (/^(作者|advertisement)/i.test(value)) return true;
  return false;
}

function completeSlice(text: string, max = 420): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (/\.\.\.$|…$/.test(cleaned)) return "";
  if (cleaned.length <= max) return cleaned;
  const slice = cleaned.slice(0, max);
  const cutAt = Math.max(
    slice.lastIndexOf(". "),
    slice.lastIndexOf("? "),
    slice.lastIndexOf("! "),
    slice.lastIndexOf("; "),
  );
  const cut = cutAt > 80 ? slice.slice(0, cutAt + 1) : slice.replace(/\s+\S*$/, "");
  return cut.replace(/[.…]+$/, "").trim();
}

export function finishPoint(point: string): string {
  const value = tidyPoint(point);
  if (!value) return "";
  if (/\.\.\.$|…$/.test(value)) return value;
  const trimmed = value.replace(/[.…]+$/, "").trim();
  if (!trimmed) return "";
  const opens = (trimmed.match(/\(/g) ?? []).length;
  const closes = (trimmed.match(/\)/g) ?? []).length;
  const balanced = opens > closes ? `${trimmed}${")".repeat(opens - closes)}` : trimmed;
  if (/[.!?…]$/.test(balanced) || isBrokenAbbreviationTail(balanced) || CLOCK_TAIL.test(balanced)) {
    return balanced;
  }
  return `${balanced}.`;
}

export function keyPoints(title: string, summary: string, max = 4): string[] {
  const cleaned = stripHtml(summary);
  const points = splitSentences(cleaned)
    .map((point) => finishPoint(point))
    .filter((point) => !isIncompletePoint(point));

  if (points.length === 0 && cleaned && !JUNK_POINT.test(cleaned)) {
    const fallback = finishPoint(completeSlice(cleaned));
    if (fallback && !isIncompletePoint(fallback)) points.push(fallback);
  }

  if (points.length === 0 && title) {
    const fromTitle = finishPoint(title.trim());
    if (fromTitle) points.push(fromTitle);
  }

  return points.slice(0, max);
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
