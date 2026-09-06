import assert from "node:assert/strict";
import {
  HX_BEACON_PATH,
  HX_NAME,
  HX_PUBLIC_ORIGIN,
  HX_SLUG,
  hxPathForRoute,
  sendHxBeacon,
  viewershipPayload,
} from "../src/hx.js";
import { publicUrl, siteUrl } from "../src/urls.js";
import { parseRoute } from "../src/pages.js";

assert.equal(hxPathForRoute("home", ""), "/");
assert.equal(hxPathForRoute("home", "Q1"), "/#t=Q1");
assert.equal(hxPathForRoute("archive"), "/#archive");
assert.deepEqual(viewershipPayload({ path: "/#about", host: "example.test" }), {
  slug: HX_SLUG,
  name: HX_NAME,
  path: "/#about",
  host: "example.test",
  referer: "",
});
assert.equal(viewershipPayload({ url: `${HX_PUBLIC_ORIGIN}/` }).url, `${HX_PUBLIC_ORIGIN}/`);

let posted = null;
const result = await sendHxBeacon({ path: "/", host: "localhost" }, async (url, opts) => {
  posted = { url, opts };
  return { ok: true, status: 200 };
});
assert.equal(result.ok, true);
assert.equal(posted.url, HX_BEACON_PATH);
assert.equal(posted.opts.method, "POST");
assert.equal(JSON.parse(posted.opts.body).slug, "canon");

assert.equal(publicUrl("catalog.json"), "/catalog.json");
assert.equal(publicUrl("#about"), "/#about");
assert.equal(siteUrl({ origin: "http://localhost:5173", pathname: "/" }), "http://localhost:5173/");
assert.equal(
  siteUrl({
    origin: "https://raw.githack.com",
    pathname: "/hxyan2020/PRD/cursor/canon-music-streaming-c956/docs/index.html",
  }),
  "https://raw.githack.com/hxyan2020/PRD/cursor/canon-music-streaming-c956/docs/"
);

assert.deepEqual(parseRoute("#about"), { page: "about", trackId: "" });
assert.deepEqual(parseRoute("#hx-monitor"), { page: "home", trackId: "" });
assert.deepEqual(parseRoute("#hx-bots"), { page: "home", trackId: "" });
assert.deepEqual(parseRoute("#hx-viewership"), { page: "home", trackId: "" });
assert.deepEqual(parseRoute("#hx-ping"), { page: "home", trackId: "" });
assert.deepEqual(parseRoute("#listen"), { page: "home", trackId: "" });
assert.deepEqual(parseRoute("#archive"), { page: "archive", trackId: "" });

console.log("hx tests ok");
