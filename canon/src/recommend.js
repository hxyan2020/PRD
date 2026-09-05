const MOOD_PROFILES = [
  {
    id: "joyful",
    labels: ["joyful", "happy", "glad", "cheerful", "upbeat", "sunny", "feel good", "feel-good", "fun"],
    genres: ["pop", "dance", "disco", "funk", "reggae", "ska", "gospel", "bubblegum", "k-pop", "j-pop"],
    words: ["joy", "happy", "celebration", "smile", "party", "sunshine"],
  },
  {
    id: "melancholy",
    labels: ["sad", "melancholy", "melancholic", "heartbreak", "heartbroken", "blue", "lonely", "rainy", "grief"],
    genres: ["ballad", "blues", "soul", "folk", "singer-songwriter", "emo", "slowcore", "torch"],
    words: ["loss", "sorrow", "tears", "lonely", "heartbreak", "lament", "elegy"],
  },
  {
    id: "calm",
    labels: ["calm", "peaceful", "chill", "relax", "relaxed", "sleep", "study", "quiet", "gentle", "soft"],
    genres: ["classical", "jazz", "ambient", "folk", "hymn", "new age", "bossa", "acoustic"],
    words: ["quiet", "peace", "gentle", "still", "soft", "lullaby", "nocturne"],
  },
  {
    id: "romantic",
    labels: ["romantic", "love", "tender", "intimate", "date", "valentine"],
    genres: ["r&b", "soul", "bossa", "ballad", "doowop", "love song", "pop"],
    words: ["love", "romance", "heart", "kiss", "devotion", "darling"],
  },
  {
    id: "defiant",
    labels: ["angry", "defiant", "rage", "protest", "rebellious", "fierce", "power"],
    genres: ["punk", "metal", "hip-hop", "rap", "protest", "grunge", "hard rock", "industrial"],
    words: ["fight", "power", "rebel", "protest", "resist", "rage", "freedom"],
  },
  {
    id: "nostalgic",
    labels: ["nostalgic", "nostalgia", "memory", "throwback", "vintage", "oldies"],
    genres: ["oldies", "doo-wop", "motown", "classic rock", "folk", "swing", "traditional"],
    words: ["memory", "yesterday", "remember", "home", "childhood", "time"],
    preferOlder: true,
  },
  {
    id: "spiritual",
    labels: ["spiritual", "sacred", "gospel", "holy", "meditative", "solemn"],
    genres: ["hymn", "gospel", "anthem", "classical", "sacred", "spiritual", "chant"],
    words: ["faith", "prayer", "hymn", "soul", "heaven", "spirit", "anthem"],
  },
  {
    id: "dance",
    labels: ["dance", "party", "club", "groove", "hype", "workout", "energetic", "energy"],
    genres: ["dance", "disco", "house", "edm", "electronic", "funk", "hip-hop", "reggaeton", "k-pop"],
    words: ["dance", "beat", "club", "groove", "night", "floor"],
  },
  {
    id: "night",
    labels: ["night", "midnight", "late", "nocturnal", "after dark", "moody"],
    genres: ["jazz", "r&b", "electronic", "trip hop", "synth", "noir", "soul"],
    words: ["night", "moon", "midnight", "dark", "after hours"],
  },
  {
    id: "summer",
    labels: ["summer", "beach", "tropical", "vacation", "warm"],
    genres: ["reggae", "dancehall", "latin", "calypso", "surf", "disco", "afrobeats"],
    words: ["summer", "sun", "beach", "heat", "island"],
  },
];

const COUNTRY_ALIASES = {
  usa: "united states",
  us: "united states",
  america: "united states",
  uk: "united kingdom",
  britain: "united kingdom",
  england: "united kingdom",
  korea: "south korea",
  "south korea": "south korea",
  "north korea": "north korea",
  nippon: "japan",
  brasil: "brazil",
};

export const MOOD_CHIPS = [
  "Joyful",
  "Melancholy",
  "Calm",
  "Romantic",
  "Defiant",
  "Nostalgic",
  "Spiritual",
  "Dance",
  "Night",
  "Summer",
];

export function utcDateKey(date = new Date()) {
  return new Date(date).toISOString().slice(0, 10);
}

export function hashString(input) {
  let h = 2166136261;
  const s = String(input);
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function trackBlob(track) {
  return normalize(
    [
      track.name,
      track.genre,
      (track.genres || []).join(" "),
      track.releaseCountry,
      track.whyShortlisted,
      track.description,
      track.extract,
      track.instanceOf,
    ].join(" ")
  );
}

function expandCountry(raw) {
  const n = normalize(raw);
  return COUNTRY_ALIASES[n] || n;
}

function matchingMoods(moodQuery) {
  const n = normalize(moodQuery);
  if (!n) return [];
  const toks = n.split(" ").filter(Boolean);
  return MOOD_PROFILES.filter((profile) => {
    if (profile.id === n) return true;
    return profile.labels.some((label) => {
      const ln = normalize(label);
      if (!ln) return false;
      if (n === ln) return true;
      if (toks.includes(ln)) return true;
      return ln.includes(" ") && n.includes(ln);
    });
  });
}

function containsTerm(haystack, term) {
  const t = normalize(term);
  if (!t) return false;
  if (t.includes(" ")) return haystack.includes(t);
  return haystack.split(" ").includes(t);
}

export function scoreTrack(track, { mood = "", country = "", genre = "" } = {}) {
  const blob = trackBlob(track);
  const genreText = normalize([track.genre, ...(track.genres || [])].join(" "));
  const countryText = normalize(track.releaseCountry);
  let score = 0;
  const hits = [];

  const genreQ = normalize(genre);
  if (genreQ) {
    if (genreText.includes(genreQ) || containsTerm(blob, genreQ) || blob.includes(genreQ)) {
      score += 8;
      hits.push(`genre ${genre}`);
    }
  }

  const countryQ = expandCountry(country);
  if (countryQ) {
    if (countryText.includes(countryQ) || blob.includes(countryQ)) {
      score += 8;
      hits.push(`origin ${track.releaseCountry || country}`);
    }
  }

  const moods = matchingMoods(mood);
  if (mood && moods.length === 0) {
    const tokens = normalize(mood).split(" ").filter((t) => t.length > 2);
    for (const token of tokens) {
      if (blob.includes(token)) {
        score += 3;
        hits.push(`mood word “${token}”`);
      }
    }
  }
  for (const profile of moods) {
    if (profile.genres.some((g) => containsTerm(genreText, g) || containsTerm(blob, g))) {
      score += 6;
      hits.push(`${profile.id} palette`);
    }
    if (profile.words.some((w) => containsTerm(blob, w))) {
      score += 3;
      hits.push(`${profile.id} language`);
    }
    if (profile.preferOlder && track.year && track.year < 1985) {
      score += 2;
      hits.push("older recording");
    }
  }

  if (score > 0) {
    score += Math.min(2.5, Math.log10((track.streams || 1) + 1) / 4);
  }
  return { score, hits };
}

function matchesGenre(track, genreQ) {
  if (!genreQ) return true;
  const genreText = normalize([track.genre, ...(track.genres || [])].join(" "));
  return genreText.includes(genreQ) || containsTerm(genreText, genreQ);
}

function matchesCountry(track, countryQ) {
  if (!countryQ) return true;
  const wanted = expandCountry(countryQ);
  const countryText = normalize(track.releaseCountry);
  if (!wanted) return true;
  return countryText.includes(wanted) || containsTerm(countryText, wanted);
}

function pickFrom(pool, seed) {
  if (!pool.length) return null;
  const idx = hashString(seed) % pool.length;
  return pool[idx];
}

export function recommendDaily(tracks, prefs = {}, date = new Date()) {
  const list = Array.isArray(tracks) ? tracks : [];
  const mood = String(prefs.mood || "").trim();
  const country = String(prefs.country || "").trim();
  const genre = String(prefs.genre || "").trim();
  const dateKey = utcDateKey(date);
  const hasPrefs = Boolean(mood || country || genre);

  if (!list.length) {
    return { track: null, reason: "The archive is empty.", mode: "none", dateKey, hasPrefs };
  }

  if (!hasPrefs) {
    const popular = [...list]
      .filter((t) => (t.streams || 0) > 0)
      .sort((a, b) => (b.streams || 0) - (a.streams || 0))
      .slice(0, 80);
    const pool = popular.length ? popular : list;
    const track = pickFrom(pool, `popular|${dateKey}`);
    return {
      track,
      mode: "popular",
      dateKey,
      hasPrefs,
      reason: `No mood, country, or genre was set, so today’s title is drawn from the most streamed recordings in the canon. Change a preference anytime for a matched pick, or wait for tomorrow’s popular rotation.`,
    };
  }

  const genreQ = normalize(genre);
  const byGenre = genreQ ? list.filter((track) => matchesGenre(track, genreQ)) : [];
  const byCountry = country ? list.filter((track) => matchesCountry(track, country)) : [];
  const byBoth =
    genreQ && country
      ? list.filter((track) => matchesGenre(track, genreQ) && matchesCountry(track, country))
      : [];
  const pool =
    (byBoth.length && byBoth) ||
    (byGenre.length && byGenre) ||
    (byCountry.length && byCountry) ||
    list;

  const ranked = pool
    .map((track) => ({ track, ...scoreTrack(track, { mood, country, genre }) }))
    .sort((a, b) => b.score - a.score || (b.track.streams || 0) - (a.track.streams || 0));

  if (!ranked.length) {
    const fallback = recommendDaily(list, {}, date);
    return {
      ...fallback,
      mode: "fallback",
      hasPrefs: true,
      reason: `No close match for ${[mood && `mood “${mood}”`, country && `country “${country}”`, genre && `genre “${genre}”`].filter(Boolean).join(", ")}, so today’s title falls back to a most-streamed recording.`,
    };
  }

  const best = ranked[0].score;
  const top = ranked.filter((row) => row.score >= best * 0.72).slice(0, 8);
  const chosen = pickFrom(
    top,
    `ai|${dateKey}|${normalize(mood)}|${normalize(country)}|${normalize(genre)}`
  );
  const track = chosen.track;
  const bits = [];
  if (mood) bits.push(`mood “${mood}”`);
  if (country) bits.push(`country “${country}”`);
  if (genre) bits.push(`genre “${genre}”`);
  const hitText = (chosen.hits || []).slice(0, 3).join(", ");
  const reason = `Canon’s recommender matched ${bits.join(", ")} to this recording${hitText ? ` (${hitText})` : ""}. Change mood, country, or genre anytime for a new match; the same preferences still rotate each day.`;

  return { track, mode: "ai", dateKey, hasPrefs, reason };
}
