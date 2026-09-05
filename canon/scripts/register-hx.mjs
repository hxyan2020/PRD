import { viewershipPayload } from "../src/hx.js";

const collect = "http://188.166.214.47:3520/collect";
const origin = process.argv[2] || "";
const host = origin ? new URL(origin).host : "canon";
const payload = {
  ...viewershipPayload({
    path: "/",
    host,
    referer: "canon-register",
  }),
  url: origin || "",
  health: origin ? `${origin.replace(/\/$/, "")}/hx/health.json` : "/hx/health.json",
  watch: true,
};

const res = await fetch(collect, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});
const text = await res.text();
console.log(res.status, text);
if (!res.ok) process.exit(1);
