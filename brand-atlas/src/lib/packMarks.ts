/** Generate a greyscale SVG wordmark for resource-pack items (data URL). */

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function initials(name: string): string {
  const parts = name
    .replace(/[()]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
  }
  return name.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase() || "??";
}

export function wordmarkDataUrl(name: string, hue = 40): string {
  const glyph = initials(name);
  const short = name.length > 18 ? `${name.slice(0, 16)}…` : name;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" role="img">
  <rect width="240" height="240" fill="#1a1a1a"/>
  <circle cx="120" cy="100" r="54" fill="none" stroke="#c8c8c8" stroke-width="3"/>
  <text x="120" y="112" text-anchor="middle" font-family="Georgia, serif" font-size="42" font-weight="700" fill="#e8e8e8">${escapeXml(glyph)}</text>
  <text x="120" y="196" text-anchor="middle" font-family="system-ui,sans-serif" font-size="16" fill="#b0b0b0">${escapeXml(short)}</text>
  <rect x="0" y="0" width="240" height="240" fill="hsl(${hue} 8% 50% / 0.08)"/>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
