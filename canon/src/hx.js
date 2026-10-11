import { publicUrl } from "./urls.js";

export const HX_SLUG = "canon";
export const HX_NAME = "Canon";
export const HX_COLLECT_URL = "http://188.166.214.47:3520/collect";
export const HX_BEACON_PATH = "/api/hx-viewership";
export const HX_PUBLIC_ORIGIN = "https://canon-ivory.vercel.app";

export function hxBeaconPath() {
  return publicUrl("api/hx-viewership");
}

export function hxPathForRoute(page = "home", trackId = "") {
  if (page === "home") return trackId ? `/#t=${trackId}` : "/";
  return `/#${page}`;
}

export function viewershipPayload({ path = "/", host = "", referer = "", url = "" } = {}) {
  const payload = {
    slug: HX_SLUG,
    name: HX_NAME,
    path: path || "/",
    host: host || "",
    referer: referer || "",
  };
  if (url) payload.url = url;
  return payload;
}

export async function sendHxBeacon(details = {}, fetchImpl, location = globalThis.location) {
  const payload = JSON.stringify(viewershipPayload(details));
  const post = fetchImpl || (typeof fetch === "function" ? fetch : null);
  if (!post) return { ok: false, skipped: true };
  const targets = [hxBeaconPath()];
  const protocol = location?.protocol || "";
  if (!(protocol === "https:" && String(HX_COLLECT_URL).startsWith("http:"))) {
    targets.push(HX_COLLECT_URL);
  }
  for (const url of targets) {
    try {
      const res = await post(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      });
      if (res?.ok || res?.status === 202) return { ok: true };
    } catch {
      /* try the next target */
    }
  }
  return { ok: false };
}
