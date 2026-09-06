#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { splitCredits } from "../src/portraits.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = path.join(root, "public", "catalog.json");
const raw = JSON.parse(await fs.readFile(catalogPath, "utf8"));

assert.equal(raw.count, 1000, "catalog count field");
assert.equal(raw.tracks.length, 1000, "tracks array length");

const ids = new Set();
const spotifyIds = new Set();
const required = [
  "rank",
  "name",
  "composer",
  "singer",
  "band",
  "writer",
  "musicCompany",
  "releaseCountry",
  "genre",
  "spotifyId",
  "spotifyUrl",
  "spotifyEmbedUrl",
  "coverUrl",
  "whyShortlisted",
];

let covers = 0;
let spotifyLinks = 0;
let reasons = 0;
let years = 0;
let streamCounts = 0;

for (const track of raw.tracks) {
  for (const key of required) {
    assert.ok(track[key], `missing ${key} on rank ${track.rank} (${track.name})`);
  }
  assert.match(track.spotifyId, /^[0-9A-Za-z]{22}$/, `spotify id ${track.name}`);
  assert.equal(track.spotifyUrl, `https://open.spotify.com/track/${track.spotifyId}`);
  assert.match(track.coverUrl, /^https:\/\//, `cover ${track.name}`);
  assert.doesNotMatch(track.coverUrl, /ab67616d00001e02|ab67616d00004851/, `low-res cover ${track.name}`);
  assert.match(track.coverUrl, /ab67616d0000b273/, `hd cover ${track.name}`);
  assert.ok(track.whyShortlisted.length > 40, `shortlist reason too short: ${track.name}`);
  assert.ok(!ids.has(track.id), `duplicate wikidata id ${track.id}`);
  assert.ok(!spotifyIds.has(track.spotifyId), `duplicate spotify id ${track.spotifyId}`);
  ids.add(track.id);
  spotifyIds.add(track.spotifyId);
  covers += 1;
  spotifyLinks += 1;
  reasons += 1;
  if (track.year) years += 1;
  if (typeof track.streams === "number" && track.streams > 0) streamCounts += 1;
}

assert.equal(covers, 1000);
assert.equal(spotifyLinks, 1000);
assert.ok(years > 700, `expected most tracks to have a year, got ${years}`);
assert.ok(streamCounts > 200, `expected hundreds of Spotify play counts, got ${streamCounts}`);

assert.ok(!raw.tracks.some((t) => /^Q\d+$/.test(t.name)), "unlabeled wikidata ids");
const missingPerformer = raw.tracks.filter(
  (t) => t.singer === "Not listed" && t.band === "Not listed"
).length;
assert.ok(missingPerformer < 40, `too many tracks missing performer: ${missingPerformer}`);

const genres = new Set(raw.tracks.map((t) => t.genre));
assert.ok(genres.size > 20, "genre diversity");

const portraitsPath = path.join(root, "public", "portraits.json");
const portraits = JSON.parse(await fs.readFile(portraitsPath, "utf8"));
assert.ok(portraits.people, "portraits people map");
let shortPortraits = 0;
const missingAnecdotes = [];
for (const track of raw.tracks) {
  assert.ok(String(track.anecdote || "").length > 40, `missing song anecdote: ${track.name}`);
  const names = [...splitCredits(track.singer), ...splitCredits(track.band)];
  for (const name of names) {
    const person = portraits.people[name];
    assert.ok(person, `missing portrait record for ${name}`);
    assert.ok(String(person.anecdote || "").length > 20, `missing anecdote for ${name}`);
    if (!person.images || person.images.length < 3) shortPortraits += 1;
  }
}
assert.equal(missingAnecdotes.length, 0);
assert.equal(shortPortraits, 0, `people with fewer than 3 images: ${shortPortraits}`);

console.log("catalog ok");
console.log(JSON.stringify({
  tracks: raw.tracks.length,
  uniqueSpotifyIds: spotifyIds.size,
  withYear: years,
  withStreams: streamCounts,
  genres: genres.size,
  generatedAt: raw.generatedAt,
}, null, 2));
