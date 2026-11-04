const SPOTIFY_COVER_64 = "ab67616d00004851";
const SPOTIFY_COVER_300 = "ab67616d00001e02";
const SPOTIFY_COVER_640 = "ab67616d0000b273";

export function hdCoverUrl(url = "") {
  const raw = String(url || "").trim();
  if (!raw) return "";
  return raw.replace(/([/])ab67616d(?:00001e02|00004851)/g, `$1${SPOTIFY_COVER_640}`);
}

export function pickHdCover(images = []) {
  const list = Array.isArray(images) ? images : [];
  let best = null;
  for (const image of list) {
    const url = String(image?.url || "").trim();
    if (!url) continue;
    const size = Math.max(Number(image.width) || 0, Number(image.height) || 0);
    if (!best || size > best.size) best = { url, size };
  }
  return hdCoverUrl(best?.url || "");
}

export function withHdCover(track) {
  if (!track || typeof track !== "object") return track;
  const coverUrl = hdCoverUrl(track.coverUrl);
  if (coverUrl === (track.coverUrl || "")) return track;
  return { ...track, coverUrl };
}

export const SPOTIFY_COVER_SIZE = { 64: SPOTIFY_COVER_64, 300: SPOTIFY_COVER_300, 640: SPOTIFY_COVER_640 };
