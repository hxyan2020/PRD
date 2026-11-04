import assert from "node:assert/strict";
import { decadeOf, formatStreams, formatStreamsFull, primaryArtist } from "../src/format.js";

assert.equal(formatStreams(null), "Not published");
assert.equal(formatStreams(1200), "1.2K");
assert.equal(formatStreams(3_500_000), "3.5M");
assert.match(formatStreamsFull(909173013), /909,173,013 plays on Spotify/);
assert.equal(decadeOf(1971), "1970s");
assert.equal(decadeOf(1799), "1600–1799");
assert.equal(
  primaryArtist({ band: "Queen", singer: "Freddie Mercury", composer: "Mercury" }),
  "Queen"
);
assert.equal(
  primaryArtist({ band: "—", singer: "Billie Holiday", composer: "Holiday" }),
  "Billie Holiday"
);
console.log("format tests ok");
