import { HX_COLLECT_URL, HX_PUBLIC_ORIGIN, viewershipPayload } from "../src/hx.js";

const origin = (process.argv[2] || HX_PUBLIC_ORIGIN).replace(/\/$/, "");
const host = (() => {
  try {
    return new URL(origin).host;
  } catch {
    return "canon";
  }
})();
const health = `${origin}/hx/health.json`;
const payload = {
  ...viewershipPayload({
    path: "/",
    host,
    referer: "canon-register",
    url: `${origin}/index.html`,
  }),
  health,
  watch: true,
  kind: "external",
};

const res = await fetch(HX_COLLECT_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});
const text = await res.text();
console.log(res.status, text);
if (!res.ok) process.exit(1);
