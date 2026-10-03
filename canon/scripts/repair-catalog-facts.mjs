#!/usr/bin/env node
/**
 * Repair catalog facts after automated fill: drop album titles used as labels,
 * correct mismatched countries/years, and fill remaining key credits.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isPlaceholderCredit } from "../src/portraits.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = path.join(root, "public", "catalog.json");

const COUNTRY_BY_SPOTIFY = {
  "4Dvkj6JhhA12EX05fT7y2e": "United Kingdom",
  "3AJwUDP919kvQ9QcozQPxg": "United Kingdom",
  "2plbrEY59IikOBgBGLjaoe": "United States",
  "3dYD57lRAUcMHufyqn9GcI": "Ireland",
  "1mea3bSkSGXuIRvnydlB5b": "United Kingdom",
  "3bidbhpOYeV4knp8AIu8Xn": "United States",
  "0TK2YIli7K1leLovkQiNik": "United States",
  "2VxeLyX666F8uXCJ0dZF8B": "United States",
  "0yLdNVWF3Srea0uzk55zFn": "United States",
  "7o2CTH4ctstm8TNelqjb51": "United States",
  "1zwMYTA5nlNjZxYrvBB2pV": "United Kingdom",
  "0bYg9bo50gSsH3LtXe2SQn": "United States",
  "5sICkBXVmaCQk5aISGR3x1": "United States",
  "7LVHVU3tWfcxj5aiPFEW4Q": "United Kingdom",
  "2rb5MvYT7ZIxbKW5hfcHx8": "United States",
  "2tUBqZG2AbRi7Q0BIrVrEj": "United States",
  "0BCPKOYdS2jbQ8iyB56Zns": "United Kingdom",
  "463CkQjx2Zk1yXoBuierM9": "United Kingdom",
  "59WN2psjkt1tyaxjspN8fp": "United States",
  "5ihS6UUlyQAfmp48eSkxuQ": "United States",
  "3ia3dJETSOllPsv3LJkE35": "United States",
  "6mFkJmJqdDVQ1REhVfGgd1": "United Kingdom",
  "1z3ugFmUKoCzGsI6jdY4Ci": "South Africa",
  "0N3W5peJUQtI4eyR6GJT5O": "United States",
  "1pKYYY0dkg23sQQXi0Q5zN": "France",
  "7mykoq6R3BArsSpNDjFQTm": "United Kingdom",
  "5UJmwdqGP7RONuVzYnHjUp": "United Kingdom",
  "53Mz9H5UvWMQUXHZnaZYKQ": "United Kingdom",
  "6kdjgn9fNS8NGIMqz1fuDm": "Soviet Union",
  "3AcGiQFsQRo6pphrbeIQNj": "Sweden",
  "6dOtVTDdiauQNBQEDOtlAB": "United States",
  "4OSBTYWVwsQhGLF9NHvIbR": "United Kingdom",
  "3vkCueOmm7xQDoJ17W1Pm3": "Sweden",
  "3pRaLNL3b8x5uBOcsgvdqM": "United States",
  "4bHsxqR3GMrXTxEPLuK5ue": "United States",
};

const COUNTRY_BY_NAME = {
  "Birds of a Feather": "United States",
  Havana: "United States",
  "Rolling in the Deep": "United Kingdom",
  "Gimme! Gimme! Gimme!": "Sweden",
  "Hey Ya!": "United States",
  "Stormy Monday": "United States",
  "Comfortably Numb": "United Kingdom",
  "Baba O'Riley": "United Kingdom",
  "Get Lucky": "France",
  "Born to Run": "United States",
  "A Day in the Life": "United Kingdom",
  Hallelujah: "United States",
  "Don't Stop Believin'": "United States",
};

function looksLikeAlbumTitle(value) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return false;
  if (
    /\b(remix|single|ep|deluxe|edition|soundtrack|ost|\balbum\b|vol\.|volume|box set|cast recording|greatest hits|anthology)\b/i.test(
      text
    )
  ) {
    return true;
  }
  return /\s-\s/.test(text) && !/\b(records|recordings|entertainment)\b/i.test(text);
}

function normalizeCountry(value) {
  const parts = String(value || "")
    .split(/\s*·\s*/)
    .map((part) => (part === "English people" ? "United Kingdom" : part.trim()))
    .filter(Boolean);
  return [...new Set(parts)].join(" · ");
}

function syncGenres(track) {
  const genre = String(track.genre || "").trim();
  if (!genre || genre === "Essential recording") return;
  const parts = genre.split(/\s*·\s*/).map((part) => part.trim()).filter(Boolean);
  const current = Array.isArray(track.genres) ? track.genres : [];
  if (!current.length || current.includes("Essential recording")) {
    track.genres = parts;
  }
}

const catalog = JSON.parse(await fs.readFile(catalogPath, "utf8"));
let labelsReverted = 0;
let countriesSet = 0;

for (const track of catalog.tracks) {
  if (!isPlaceholderCredit(track.musicCompany) && looksLikeAlbumTitle(track.musicCompany)) {
    track.musicCompany = "Not listed";
    labelsReverted += 1;
  }

  const country = normalizeCountry(
    COUNTRY_BY_SPOTIFY[track.spotifyId] || COUNTRY_BY_NAME[track.name] || track.releaseCountry
  );
  if (country && country !== track.releaseCountry) {
    track.releaseCountry = country;
    countriesSet += 1;
  }

  syncGenres(track);
}

const killing = catalog.tracks.find((track) => track.spotifyId === "59WN2psjkt1tyaxjspN8fp");
if (killing) killing.year = 1992;

const sommartider = catalog.tracks.find((track) => track.name === "Sommartider");
if (sommartider) sommartider.year = 1982;

const battle = catalog.tracks.find((track) => track.spotifyId === "6kdjgn9fNS8NGIMqz1fuDm");
if (battle) {
  battle.singer = "Iosif Kobzon";
  battle.band = "—";
  battle.composer = "Aleksandra Pakhmutova";
  battle.writer = "Nikolai Dobronravov";
  battle.releaseCountry = "Soviet Union";
  battle.year = 1974;
  if (battle.genre === "Essential recording" || isPlaceholderCredit(battle.genre)) {
    battle.genre = "march";
    battle.genres = ["march"];
  }
}

const midsummer = catalog.tracks.find((track) => track.spotifyId === "3AcGiQFsQRo6pphrbeIQNj");
if (midsummer) {
  midsummer.singer = midsummer.composer && !isPlaceholderCredit(midsummer.composer) ? midsummer.composer : "Hugo Alfvén";
  midsummer.releaseCountry = "Sweden";
}

for (const track of catalog.tracks) {
  if (track.singer === "Swedish singer and songwriter Zara Larsson") track.singer = "Zara Larsson";
  if (track.singer === "Swedish pop duo Roxette") {
    track.singer = "—";
    track.band = "Roxette";
  }
}

catalog.generatedAt = new Date().toISOString();
await fs.writeFile(catalogPath, `${JSON.stringify(catalog)}\n`);

const missingCountry = catalog.tracks.filter((track) => isPlaceholderCredit(track.releaseCountry));
const missingYear = catalog.tracks.filter((track) => !Number(track.year));
const placeholderGenre = catalog.tracks.filter((track) => track.genre === "Essential recording");
const missingPerformer = catalog.tracks.filter(
  (track) => isPlaceholderCredit(track.singer) && isPlaceholderCredit(track.band)
);

console.log(
  JSON.stringify(
    {
      labelsReverted,
      countriesSet,
      missingCountry: missingCountry.map((track) => `${track.rank} ${track.name}`),
      missingYear: missingYear.map((track) => `${track.rank} ${track.name}`),
      placeholderGenre: placeholderGenre.map((track) => `${track.rank} ${track.name}`),
      missingPerformer: missingPerformer.map((track) => `${track.rank} ${track.name}`),
      missingLabel: catalog.tracks.filter((track) => isPlaceholderCredit(track.musicCompany)).length,
    },
    null,
    2
  )
);
