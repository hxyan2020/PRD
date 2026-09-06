import assert from "node:assert/strict";
import {
  displayPersonName,
  fallbackSongAnecdote,
  imageKey,
  anecdoteFits,
  isPlaceholderCredit,
  pickAnecdote,
  searchName,
  splitCredits,
  titleFitsName,
  uniqueImages,
} from "../src/portraits.js";

assert.deepEqual(splitCredits("The Weeknd"), ["The Weeknd"]);
assert.deepEqual(splitCredits("DJ Snake ft. Justin Bieber"), ["DJ Snake", "Justin Bieber"]);
assert.deepEqual(splitCredits("Jay-Z and Kanye West"), ["Jay-Z", "Kanye West"]);
assert.deepEqual(splitCredits("Tones and I"), ["Tones and I"]);
assert.deepEqual(splitCredits("Swedish singer and songwriter Zara Larsson"), [
  "Swedish singer and songwriter Zara Larsson",
]);
assert.deepEqual(splitCredits("Calvin Harris, Justin Timberlake, Halsey and Pharrell"), [
  "Calvin Harris",
  "Justin Timberlake",
  "Halsey",
  "Pharrell",
]);
assert.deepEqual(splitCredits("—"), []);
assert.deepEqual(splitCredits("Not listed"), []);
assert.equal(isPlaceholderCredit("Various / ceremonial performers"), true);
assert.equal(searchName("Swedish singer and songwriter Zara Larsson"), "Zara Larsson");
assert.equal(displayPersonName("Swedish pop duo Roxette"), "Roxette");

const note = pickAnecdote(
  "First sentence is short. Second sentence adds the story of the recording session. Third sentence is extra color that can wait."
);
assert.match(note, /First sentence/);
assert.match(note, /Second sentence/);

const fallback = fallbackSongAnecdote({
  name: "Blinding Lights",
  singer: "The Weeknd",
  band: "—",
  year: 2019,
  releaseCountry: "Canada",
  genre: "synth-pop",
});
assert.match(fallback, /Blinding Lights/);
assert.match(fallback, /The Weeknd/);

const images = uniqueImages(
  [
    { src: "https://example.com/a.jpg", alt: "A" },
    { src: "https://example.com/a.jpg", alt: "dup" },
    { src: "https://example.com/b.jpg", alt: "B" },
    { src: "https://example.com/c.jpg", alt: "C" },
  ],
  3
);
assert.equal(images.length, 3);
assert.equal(titleFitsName("DJ Snake", "Sade (singer)"), false);
assert.equal(titleFitsName("DJ Snake", "Snakefinger"), false);
assert.equal(titleFitsName("DJ Snake", "DJ Snake"), true);
assert.equal(titleFitsName("Pop Smoke", "Spike (musician)"), false);
assert.equal(titleFitsName("Pop Smoke", "Smokey Robinson"), false);
assert.equal(titleFitsName("Pop Smoke", "Pop Smoke"), true);
assert.equal(titleFitsName("2NE1", "2001 Singer Sri Lankan Airlines Rugby 7s"), false);
assert.equal(titleFitsName("Billy Joel", "Billy Joel"), true);
assert.equal(titleFitsName("Beyonce", "Beyoncé"), true);
assert.equal(titleFitsName("Dean", "James Dean"), false);
assert.equal(titleFitsName("Dean", "Dean Corll"), false);
assert.equal(titleFitsName("Dean", "Dean (singer)"), true);
assert.deepEqual(splitCredits("Booker T. & the M.G.'s"), ["Booker T. & the M.G.'s"]);
assert.equal(searchName("Galantis Dilshadilu07celebrity's"), "Galantis");
assert.equal(searchName("DJ Snake"), "DJ Snake");
assert.equal(searchName("Pop Smoke"), "Pop Smoke");
assert.equal(searchName("Swedish pop duo Roxette"), "Roxette");
assert.equal(anecdoteFits("The Weeknd", "Abel Tesfaye, known professionally as the Weeknd"), true);
assert.equal(
  imageKey("https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/The_Weeknd_Portrait.jpg/330px-The_Weeknd_Portrait.jpg"),
  "the_weeknd_portrait.jpg"
);
assert.notEqual(
  imageKey("https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/aa/bb/cc/source/600x600bb.jpg"),
  imageKey("https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/dd/ee/ff/source/600x600bb.jpg")
);

console.log("portrait helper tests ok");
