export type ChatStepId =
  | "name"
  | "skills"
  | "major"
  | "business"
  | "domains"
  | "markets";

export type AnswerAssessment =
  | { ok: true }
  | { ok: false; kind: "greeting" | "meta" | "question" | "too_thin" | "off_track" };

const GREETINGS = new Set([
  "hi",
  "hello",
  "hey",
  "hiya",
  "howdy",
  "yo",
  "sup",
  "hola",
  "bonjour",
  "hallo",
  "ciao",
  "你好",
  "您好",
  "嗨",
  "こんにちは",
  "안녕",
  "안녕하세요",
  "salam",
  "مرحبا",
  "good morning",
  "good afternoon",
  "good evening",
  "good night",
  "gm",
  "gn",
]);

const META = new Set([
  "ok",
  "okay",
  "k",
  "kk",
  "sure",
  "thanks",
  "thank you",
  "thx",
  "ty",
  "cool",
  "nice",
  "lol",
  "haha",
  "hahaha",
  "yes",
  "yep",
  "yeah",
  "no",
  "nope",
  "maybe",
  "idk",
  "dunno",
  "whatever",
  "hmm",
  "huh",
  "test",
  "testing",
  "asdf",
  "???",
  "?",
  "...",
  "…",
]);

const QUESTION_STARTERS =
  /^(what|why|how|when|where|who|which|can you|could you|do you|are you|is this|告诉我|什么|怎么|为什么)\b/i;

function normalize(raw: string): string {
  return raw
    .trim()
    .replace(/[!！。．.？?～~]+$/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function isGreeting(text: string): boolean {
  const n = normalize(text);
  if (GREETINGS.has(n)) return true;
  // "hi there", "hello!" already stripped punctuation
  if (/^(hi|hello|hey|hola|你好|嗨)\b/.test(n) && n.split(" ").length <= 3) {
    // Allow "hi i'm alex" style — handled below by name extraction check
    if (/\b(i'?m|i am|my name is|this is|call me)\b/.test(n)) return false;
    return true;
  }
  return false;
}

function isMeta(text: string): boolean {
  const n = normalize(text);
  return META.has(n) || /^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+$/u.test(text.trim());
}

function looksLikeQuestion(text: string): boolean {
  const t = text.trim();
  if (/\?$/.test(t)) return true;
  return QUESTION_STARTERS.test(t);
}

function extractNameCandidate(text: string): string | null {
  const t = text.trim();
  const titled = t.match(
    /(?:i'?m|i am|my name is|this is|call me|i'm called|我叫|我是|叫我)\s*([A-Za-z\u00C0-\u024F\u4e00-\u9fff][\w\u00C0-\u024F\u4e00-\u9fff.'’\-\s]{0,40})/i,
  );
  if (titled?.[1]) return titled[1].trim();
  // Plain name: 1–3 word-like tokens, letters from common scripts
  if (/^[\p{L}][\p{L}.'’\-\s]{0,40}$/u.test(t) && t.split(/\s+/).length <= 3) {
    return t;
  }
  return null;
}

function listItems(text: string): string[] {
  return text
    .split(/[,;/|]+|\band\b/gi)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Decide whether a user reply answers the current profile step.
 * Off-track replies should stay on the same step with a gentle redirect.
 */
export function assessAnswer(step: ChatStepId, answer: string): AnswerAssessment {
  const text = answer.trim();
  if (!text) return { ok: false, kind: "too_thin" };

  const n = normalize(text);
  if (n === "skip") {
    return step === "markets" ? { ok: true } : { ok: false, kind: "off_track" };
  }

  if (isGreeting(text)) return { ok: false, kind: "greeting" };
  if (isMeta(text)) return { ok: false, kind: "meta" };
  if (looksLikeQuestion(text) && step !== "business") {
    // Business step allows exploratory phrasing; still block pure Qs about the bot
    if (/^(who are you|what (can|do) you|what is this|how does this)\b/i.test(text)) {
      return { ok: false, kind: "question" };
    }
    if (step !== "major" && step !== "domains") {
      return { ok: false, kind: "question" };
    }
  }

  switch (step) {
    case "name": {
      const candidate = extractNameCandidate(text);
      if (!candidate) return { ok: false, kind: "off_track" };
      if (GREETINGS.has(normalize(candidate))) return { ok: false, kind: "greeting" };
      if (candidate.length < 2) return { ok: false, kind: "too_thin" };
      return { ok: true };
    }
    case "skills": {
      const items = listItems(text);
      if (items.length === 0) return { ok: false, kind: "too_thin" };
      if (items.length === 1 && items[0].length < 2) return { ok: false, kind: "too_thin" };
      // Single-word chitchat already caught; require something that isn't pure filler
      if (items.every((i) => META.has(normalize(i)) || GREETINGS.has(normalize(i)))) {
        return { ok: false, kind: "off_track" };
      }
      return { ok: true };
    }
    case "major":
    case "business": {
      if (text.length < 2) return { ok: false, kind: "too_thin" };
      if (looksLikeQuestion(text) && /^(who are you|what (can|do) you)\b/i.test(text)) {
        return { ok: false, kind: "question" };
      }
      return { ok: true };
    }
    case "domains": {
      const items = listItems(text);
      if (items.length === 0) return { ok: false, kind: "too_thin" };
      if (items.every((i) => META.has(normalize(i)))) return { ok: false, kind: "off_track" };
      return { ok: true };
    }
    case "markets": {
      if (n === "skip") return { ok: true };
      const items = listItems(text);
      if (items.length === 0) return { ok: false, kind: "too_thin" };
      return { ok: true };
    }
    default:
      return { ok: true };
  }
}

/** i18n message keys for gentle redirects (defined in messages.ts). */
export function redirectMessageKey(
  step: ChatStepId,
  kind: Extract<AnswerAssessment, { ok: false }>["kind"],
): `match.redirect.${ChatStepId}` | "match.redirect.generic" {
  if (kind === "greeting" || kind === "meta" || kind === "question" || kind === "off_track") {
    return `match.redirect.${step}`;
  }
  return `match.redirect.${step}`;
}
