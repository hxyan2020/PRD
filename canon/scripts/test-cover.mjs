import assert from "node:assert/strict";
import { hdCoverUrl, pickHdCover, withHdCover } from "../src/cover.js";

const medium = "https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e028863bc11d2aa12b54f5aeb36";
const large = "https://image-cdn-fa.spotifycdn.com/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36";
const tiny = "https://i.scdn.co/image/ab67616d000048518863bc11d2aa12b54f5aeb36";

assert.equal(hdCoverUrl(medium), large);
assert.equal(hdCoverUrl(large), large);
assert.equal(hdCoverUrl(tiny), "https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36");
assert.equal(hdCoverUrl(""), "");
assert.equal(hdCoverUrl("https://example.com/art.jpg"), "https://example.com/art.jpg");

assert.equal(
  pickHdCover([
    { url: tiny, width: 64, height: 64 },
    { url: medium, width: 300, height: 300 },
    { url: large, width: 640, height: 640 },
  ]),
  large
);
assert.equal(pickHdCover([{ url: medium, width: 300 }]), large);
assert.equal(pickHdCover([]), "");

const track = withHdCover({ id: "1", coverUrl: medium });
assert.equal(track.coverUrl, large);
assert.equal(withHdCover({ id: "1", coverUrl: large }).coverUrl, large);

console.log("cover tests ok");
