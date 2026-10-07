/** Sentence / clause terminators across Latin, CJK, Arabic, Indic scripts. */
const TERMINATOR = /[.!?…。！？۔؟।॥]/u;

/**
 * True when a string looks cut mid-thought (trailing comma/connector, spam, no close).
 */
export function looksIncomplete(text: string): boolean {
  const s = text.trim();
  if (!s) return true;
  if (/[,;:，、；：—–-]\s*$/u.test(s)) return true;
  if (/[:：]\s*$/u.test(s) && s.length < 40) return true;
  if (/\(\s*$/u.test(s)) return true;
  if (/(\b\w+\b)(?:\s+\1){3,}/iu.test(s)) return true;
  if (/(.)\1{8,}/u.test(s)) return true;
  if (/(?:\s*,\s*){4,}/u.test(s)) return true;
  if (/(?:\.\s*){6,}/u.test(s)) return true;
  if (/([\u4e00-\u9fff])(?:\s*\1){6,}/u.test(s)) return true;
  if (
    /\b(the|a|an|and|of|to|in|for|with|from|as|by|or|that|which|their|its|de|la|le|el|y|et|und|der|die|das)\s*$/iu.test(
      s,
    )
  ) {
    return true;
  }
  if (/[\u0600-\u06FF]/.test(s) && s.length > 80 && !/[.!?…۔؟]$/u.test(s)) {
    return true;
  }
  if (s.length > 90 && !TERMINATOR.test(s.slice(-3)) && !TERMINATOR.test(s)) {
    return true;
  }
  return false;
}

/** Keep text through the last complete sentence; empty if none. */
export function lastCompleteSentences(text: string): string {
  const s = text.trim();
  let last = -1;
  for (let i = 0; i < s.length; i++) {
    if (TERMINATOR.test(s[i]!)) last = i;
  }
  if (last < 0) return "";
  return s.slice(0, last + 1).trim();
}

/**
 * Prefer a complete localized string; salvage to last sentence; else fall back.
 */
export function preferCompleteText(localized: string, fallback: string): string {
  const loc = localized?.trim() ?? "";
  const fb = fallback?.trim() ?? "";
  if (!loc) return fb;
  if (!looksIncomplete(loc)) return loc;
  const salvaged = lastCompleteSentences(loc);
  if (salvaged && salvaged.length >= Math.min(48, Math.floor(fb.length * 0.35))) {
    return salvaged;
  }
  return fb || loc;
}

/**
 * Card / list preview: prefer 1–2 full sentences within a soft word budget.
 * Never ends mid-word or mid-clause.
 */
export function excerpt(text: string, maxWords = 36): string {
  const s = text.trim();
  if (!s) return s;
  const words = s.split(/\s+/);
  if (words.length <= maxWords && !looksIncomplete(s)) return s;

  // Prefer sentence boundaries inside the budget
  const budget = words.slice(0, maxWords).join(" ");
  const within = lastCompleteSentences(budget);
  if (within) {
    return within.length < s.length ? within : s;
  }

  // Fall back to whole words, never a dangling connector
  let parts = words.slice(0, maxWords);
  const dangling =
    /^(the|a|an|and|of|to|in|for|with|from|as|by|or|that|which|their|its)$/i;
  while (parts.length > 8 && dangling.test(parts[parts.length - 1]!)) {
    parts = parts.slice(0, -1);
  }
  const out = parts.join(" ");
  return out.length < s.length ? `${out}…` : s;
}

/** Character-budget preview that still ends on a sentence when possible. */
export function charExcerpt(text: string, maxChars = 180): string {
  const s = text.trim();
  if (s.length <= maxChars) return s;
  const window = s.slice(0, maxChars);
  const within = lastCompleteSentences(window);
  if (within && within.length >= Math.min(60, Math.floor(maxChars * 0.4))) {
    return within.length < s.length ? within : s;
  }
  // Break on last whitespace
  const cut = window.replace(/\s+\S*$/, "").trim();
  return `${cut || window.trim()}…`;
}
