import assert from "node:assert/strict";
import {
  HX_BEACON_PATH,
  HX_NAME,
  HX_SLUG,
  VIEWERSHIP_KEY,
  hxPathForRoute,
  isLikelyBot,
  lastPingFor,
  loadViewership,
  recordBotPing,
  recordVisit,
  sendHxBeacon,
  viewershipPayload,
} from "../src/hx.js";
import { parseRoute } from "../src/pages.js";

assert.equal(isLikelyBot("Mozilla/5.0"), false);
assert.equal(isLikelyBot("curl/8.0"), true);
assert.equal(isLikelyBot("Mozilla/5.0", { webdriver: true }), true);
assert.equal(hxPathForRoute("home", ""), "/");
assert.equal(hxPathForRoute("home", "Q1"), "/#t=Q1");
assert.equal(hxPathForRoute("hx-viewership"), "/#hx-viewership");
assert.deepEqual(viewershipPayload({ path: "/#about", host: "example.test" }), {
  slug: HX_SLUG,
  name: HX_NAME,
  path: "/#about",
  host: "example.test",
  referer: "",
});

const memory = {
  data: new Map(),
  getItem(key) {
    return this.data.has(key) ? this.data.get(key) : null;
  },
  setItem(key, value) {
    this.data.set(key, String(value));
  },
  removeItem(key) {
    this.data.delete(key);
  },
};

const human = recordVisit({ route: "home", origin: "http://localhost", ua: "Mozilla/5.0" }, memory);
assert.equal(human.totals.views, 1);
assert.equal(human.totals.human, 1);
assert.equal(human.totals.bot, 0);
const bot = recordVisit({ route: "hx-monitor", ua: "python-requests/2.0" }, memory);
assert.equal(bot.totals.bot, 1);
assert.equal(loadViewership(memory).visits.length, 2);
assert.ok(memory.getItem(VIEWERSHIP_KEY));

const pings = recordBotPing("hx-ping", memory);
assert.equal(lastPingFor("hx-ping", pings).id, "hx-ping");

let posted = null;
const result = await sendHxBeacon({ path: "/", host: "localhost" }, async (url, opts) => {
  posted = { url, opts };
  return { ok: true, status: 200 };
});
assert.equal(result.ok, true);
assert.equal(posted.url, HX_BEACON_PATH);
assert.equal(posted.opts.method, "POST");
assert.equal(JSON.parse(posted.opts.body).slug, "canon");

assert.deepEqual(parseRoute("#hx-monitor"), { page: "hx-monitor", trackId: "" });
assert.deepEqual(parseRoute("#hx-bots"), { page: "hx-monitor", trackId: "" });
assert.deepEqual(parseRoute("#hx-viewership"), { page: "hx-viewership", trackId: "" });
assert.deepEqual(parseRoute("#hx-ping"), { page: "hx-ping", trackId: "" });

console.log("hx tests ok");
