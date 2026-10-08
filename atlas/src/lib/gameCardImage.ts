/** Category accent colors aligned with Ludus Atlas brand palette. */
const CATEGORY_ACCENT: Record<string, string> = {
  "Strategy & War": "#bc0234",
  "Board & Race": "#8a6a72",
  "Mancala & Sowing": "#8e0126",
  "Cards & Tiles": "#c45a72",
  "Dice & Chance": "#bc0234",
  "String & Finger": "#8a6a72",
  "Dolls & Figures": "#d4784a",
  "Ball & Sport": "#6a9bc3",
  "Spinning & Tops": "#c97b4a",
  "Puzzles & Skill": "#9b7d9b",
  "Outdoor Folk": "#6f9b7d",
  "Musical Play": "#c96a8a",
  Construction: "#8a9bc9",
  "Ritual & Ceremony": "#b49b6a",
  "Memory & Word": "#7d8a9b",
  "Hand & Gesture": "#9b8a7d",
};

const CARD_PREFIX = "ludus-card:";

export function isLudusCardSrc(src: string): boolean {
  return src.startsWith(CARD_PREFIX);
}

/** Encode a title card reference stored in collection.json. */
export function encodeLudusCard(
  name: string,
  category: string,
  originCountry: string,
): string {
  return `${CARD_PREFIX}${encodeURIComponent(name)}|${encodeURIComponent(category)}|${encodeURIComponent(originCountry)}`;
}

function parseLudusCard(src: string): {
  name: string;
  category: string;
  originCountry: string;
} | null {
  if (!isLudusCardSrc(src)) return null;
  const raw = src.slice(CARD_PREFIX.length);
  const [name, category, originCountry] = raw.split("|").map((p) => {
    try {
      return decodeURIComponent(p || "");
    } catch {
      return p || "";
    }
  });
  if (!name) return null;
  return { name, category: category || "", originCountry: originCountry || "" };
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapLines(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > maxChars && cur) {
      lines.push(cur);
      cur = w;
      if (lines.length >= maxLines) break;
    } else {
      cur = next;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (words.join(" ").length > lines.join(" ").length) {
    const last = lines[lines.length - 1] ?? "";
    lines[lines.length - 1] = `${last.replace(/\s+\S*$/, "")}…`;
  }
  return lines.length ? lines : [text.slice(0, maxChars)];
}

/** Build an SVG data-URI title card so the pictured name always matches the entry. */
export function ludusCardDataUri(
  name: string,
  category: string,
  originCountry: string,
): string {
  const accent = CATEGORY_ACCENT[category] || "#7d9b8a";
  const titleLines = wrapLines(name, 22, 3);
  const titleFont =
    titleLines.length >= 3 ? 42 : titleLines.length === 2 ? 48 : 56;
  const titleBlock = titleLines
    .map((line, i) => {
      const y = 250 + i * (titleFont + 8);
      return `<text x="60" y="${y}" fill="#e8f0ec" font-family="Georgia, 'Times New Roman', serif" font-size="${titleFont}" font-weight="700">${escapeXml(line)}</text>`;
    })
    .join("");
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#12080a"/>
      <stop offset="55%" stop-color="#0c0c0c"/>
      <stop offset="100%" stop-color="#1a1214"/>
    </linearGradient>
    <pattern id="grain" width="40" height="40" patternUnits="userSpaceOnUse">
      <circle cx="4" cy="8" r="1" fill="${accent}" opacity="0.12"/>
      <circle cx="22" cy="26" r="1.2" fill="#e8f0ec" opacity="0.06"/>
    </pattern>
  </defs>
  <rect width="900" height="600" fill="url(#bg)"/>
  <rect width="900" height="600" fill="url(#grain)"/>
  <rect x="0" y="0" width="12" height="600" fill="${accent}"/>
  <text x="60" y="92" fill="${accent}" font-family="system-ui, sans-serif" font-size="18" font-weight="600" letter-spacing="0.18em">LUDUS ATLAS</text>
  <text x="60" y="150" fill="#b7c9c0" font-family="system-ui, sans-serif" font-size="20">${escapeXml(category || "Toy & Game")}</text>
  ${titleBlock}
  <text x="60" y="520" fill="#b7c9c0" font-family="system-ui, sans-serif" font-size="22">${escapeXml(originCountry || "")}</text>
  <text x="60" y="560" fill="#7d9b8a" font-family="system-ui, sans-serif" font-size="14">Catalog reference card</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Hosts that frequently 404 / block empty in browsers (hotlink blocks, flaky CDN). */
const FRAGILE_HOSTS = new Set([
  "loremflickr.com",
  "www.loremflickr.com",
  "picsum.photos",
  "fastly.picsum.photos",
]);

export function isFragileRemoteSrc(src: string): boolean {
  if (!src || isLudusCardSrc(src) || src.startsWith("data:")) return false;
  try {
    return FRAGILE_HOSTS.has(new URL(src).hostname);
  } catch {
    return true;
  }
}

/**
 * Resolve a collection image src for use in <img>.
 * Title-card refs become SVG data URIs bearing the correct game name.
 */
export function resolveImageSrc(src: string): string {
  const parsed = parseLudusCard(src);
  if (!parsed) return src;
  return ludusCardDataUri(parsed.name, parsed.category, parsed.originCountry);
}

/**
 * Prefer a named title card over fragile stock-photo hosts so galleries never
 * show the browser’s broken-image icon.
 */
export function stableImageSrc(
  src: string,
  label?: { name: string; category: string; originCountry: string },
): string {
  if (label && (isLudusCardSrc(src) || isFragileRemoteSrc(src))) {
    return ludusCardDataUri(label.name, label.category, label.originCountry);
  }
  if (isFragileRemoteSrc(src)) {
    const parsed = parseLudusCard(src);
    if (parsed) {
      return ludusCardDataUri(parsed.name, parsed.category, parsed.originCountry);
    }
  }
  return resolveImageSrc(src);
}

/** Rewrite fragile remote URLs to ludus-card refs and drop duplicates. */
export function sanitizeImageList(
  images: string[] | undefined,
  label: { name: string; category: string; originCountry: string },
): string[] {
  const card = encodeLudusCard(label.name, label.category, label.originCountry);
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of images ?? []) {
    const next = !raw || isFragileRemoteSrc(raw) ? card : raw;
    const key = isLudusCardSrc(next) ? card : next;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(isLudusCardSrc(next) ? card : next);
  }
  if (!out.length) out.push(card);
  return out;
}
