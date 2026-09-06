export function formatStreams(n) {
  if (n == null || n === 0) return "Not published";
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("en-US");
}

export function formatStreamsFull(n) {
  if (n == null || n === 0) return "Spotify has not published a play count for this Music";
  return `${n.toLocaleString("en-US")} plays on Spotify`;
}

export function decadeOf(year) {
  if (!year) return "Unknown era";
  if (year < 1600) return "Before 1600";
  if (year < 1800) return "1600–1799";
  if (year < 1900) return "1800s";
  return `${Math.floor(year / 10) * 10}s`;
}

export function primaryArtist(track) {
  if (track.band && track.band !== "—") return track.band;
  if (track.singer && track.singer !== "—" && track.singer !== "Not listed") return track.singer;
  if (track.composer && !track.composer.startsWith("Traditional")) return track.composer;
  return "Unknown artist";
}

export function uniqueSorted(values) {
  return [...new Set(values.filter((v) => v && v !== "—" && v !== "Not listed"))].sort((a, b) =>
    a.localeCompare(b)
  );
}
