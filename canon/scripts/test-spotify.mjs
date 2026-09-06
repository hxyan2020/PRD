import assert from "node:assert/strict";
import {
  PLAYLIST_NAME,
  SCOPES,
  base64UrlEncode,
  buildAuthorizeUrl,
  codeChallengeFromVerifier,
  getClientId,
  parseCallbackParams,
  parseTokenResponse,
  saveClientId,
  setPendingAdd,
  spotifyTrackUri,
  takePendingAdd,
  tokenIsFresh,
  redirectUri,
} from "../src/spotify.js";
import { siteUrl } from "../src/urls.js";

assert.equal(PLAYLIST_NAME, "Canon");
assert.match(SCOPES, /user-library-modify/);
assert.match(SCOPES, /playlist-modify-private/);
assert.equal(spotifyTrackUri("0VjIjW4GlUZAMYd2vXMi3b"), "spotify:track:0VjIjW4GlUZAMYd2vXMi3b");
assert.equal(spotifyTrackUri(""), "");

assert.deepEqual(parseCallbackParams("?code=abc&state=xyz"), { code: "abc", state: "xyz", error: "" });
assert.equal(parseCallbackParams("?error=access_denied").error, "access_denied");

const tokens = parseTokenResponse({ access_token: "tok", refresh_token: "ref", expires_in: 3600 }, 1_000);
assert.equal(tokens.access_token, "tok");
assert.equal(tokens.expires_at, 1_000 + 3_600_000);
assert.equal(tokenIsFresh(tokens, 1_000), true);
assert.equal(tokenIsFresh(tokens, tokens.expires_at), false);

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

saveClientId(" cid123 ", memory);
assert.equal(getClientId(memory, ""), "cid123");
assert.equal(getClientId(memory, "env-id"), "env-id");

setPendingAdd("track-1", memory);
assert.equal(takePendingAdd(memory), "track-1");
assert.equal(takePendingAdd(memory), "");

const url = buildAuthorizeUrl({
  clientId: "cid",
  redirect: "http://localhost:5173/",
  challenge: "challenge",
  state: "st",
});
assert.match(url, /accounts\.spotify\.com\/authorize/);
assert.match(url, /code_challenge_method=S256/);
assert.match(url, /redirect_uri=http%3A%2F%2Flocalhost%3A5173%2F/);

assert.equal(redirectUri({ origin: "http://localhost:5173", pathname: "/" }), "http://localhost:5173/");
assert.equal(
  siteUrl({
    origin: "https://hxyan2020.github.io",
    pathname: "/PRD/index.html",
  }),
  "https://hxyan2020.github.io/PRD/"
);

assert.equal(
  await codeChallengeFromVerifier("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"),
  "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"
);

const bytes = new Uint8Array([1, 2, 255]);
assert.equal(typeof base64UrlEncode(bytes), "string");

console.log("spotify tests ok");
