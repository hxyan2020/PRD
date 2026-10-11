/** Category accent colors aligned with Ludus Atlas palette. */
const CATEGORY_ACCENT: Record<string, string> = {
  "Strategy & War": "#c9a227",
  "Board & Race": "#7d9b8a",
  "Mancala & Sowing": "#a8841a",
  "Cards & Tiles": "#8eb4a3",
  "Dice & Chance": "#c9a227",
  "String & Finger": "#7d9b8a",
  "Dolls & Figures": "#d4b56a",
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
      <stop offset="0%" stop-color="#0a1f23"/>
      <stop offset="55%" stop-color="#0c2428"/>
      <stop offset="100%" stop-color="#14353b"/>
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

/**
 * Resolve a collection image src for use in <img>.
 * Title-card refs become SVG data URIs bearing the correct game name.
 */
export function resolveImageSrc(src: string): string {
  const parsed = parseLudusCard(src);
  if (!parsed) return src;
  return ludusCardDataUri(parsed.name, parsed.category, parsed.originCountry);
}
