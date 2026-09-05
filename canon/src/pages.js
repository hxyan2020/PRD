export function parseRoute(hash = "") {
  const raw = String(hash || "").replace(/^#/, "");
  if (raw === "about") return { page: "about", trackId: "" };
  if (raw === "terms") return { page: "terms", trackId: "" };
  if (raw === "hx-monitor" || raw === "hx-bots") return { page: "hx-monitor", trackId: "" };
  if (raw === "hx-viewership") return { page: "hx-viewership", trackId: "" };
  if (raw === "hx-ping") return { page: "hx-ping", trackId: "" };
  const id = new URLSearchParams(raw).get("t") || "";
  return { page: "home", trackId: id };
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
