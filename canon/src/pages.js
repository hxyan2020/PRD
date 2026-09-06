const PAGES = new Set([
  "about",
  "terms",
  "collections",
  "log",
  "history",
  "recommend-log",
]);

function normalizePage(token) {
  if (token === "history" || token === "recommend-log") return "log";
  return token;
}

export function parseRoute(hash = "") {
  const raw = String(hash || "").replace(/^#/, "");
  if (!raw) return { page: "home", trackId: "" };

  const parts = raw.split("&").filter(Boolean);
  const head = parts[0] || "";
  let page = "home";
  let trackId = "";

  if (head.startsWith("t=")) {
    trackId = decodeURIComponent(head.slice(2));
  } else if (PAGES.has(head)) {
    page = normalizePage(head);
  }

  for (const part of parts.slice(1)) {
    if (part.startsWith("t=")) trackId = decodeURIComponent(part.slice(2));
  }

  if (page === "about" || page === "terms") trackId = "";
  return { page, trackId };
}

export function routeHash(page = "home", trackId = "") {
  const id = String(trackId || "");
  const token = page === "home" ? "" : page;
  if (!token) return id ? `t=${encodeURIComponent(id)}` : "";
  return id ? `${token}&t=${encodeURIComponent(id)}` : token;
}

export function pageAllowsTrack(page) {
  return page === "home" || page === "collections" || page === "log";
}

export const ABOUT_SECTIONS = [
  ["aboutWhatTitle", "aboutWhatBody"],
  ["aboutChooseTitle", "aboutChooseBody"],
  ["aboutDoTitle", "aboutDoBody"],
  ["aboutSpotifyTitle", "aboutSpotifyBody"],
  ["aboutLangTitle", "aboutLangBody"],
  ["aboutNotTitle", "aboutNotBody"],
  ["aboutDataTitle", "aboutDataBody"],
  ["aboutSourcesTitle", "aboutSourcesBody"],
  ["aboutHostTitle", "aboutHostBody"],
];

export const TERMS_SECTIONS = [
  ["terms1Title", "terms1Body"],
  ["terms2Title", "terms2Body"],
  ["terms3Title", "terms3Body"],
  ["terms4Title", "terms4Body"],
  ["terms5Title", "terms5Body"],
  ["terms6Title", "terms6Body"],
  ["terms7Title", "terms7Body"],
  ["terms8Title", "terms8Body"],
  ["terms9Title", "terms9Body"],
];
