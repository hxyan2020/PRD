import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  copyFileSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const atlasRoot = join(__dirname, "..");
const publicData = join(atlasRoot, "public", "data");
const i18nData = join(atlasRoot, "scripts", "content-i18n-data");
const backupDir = join(__dirname, "data-overrides");

const PATHS = {
  collection: join(publicData, "collection.json"),
  tutorials: join(publicData, "tutorials.json"),
  contentI18n: join(publicData, "content-i18n.json"),
  curatedEn: join(i18nData, "curated-en.json"),
  curatedI18n: join(i18nData, "curated-i18n.json"),
};

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, path.endsWith("collection.json") ? 0 : 2));
}

export function loadCollection() {
  return readJson(PATHS.collection, { meta: {}, games: [] });
}

export function loadTutorials() {
  return readJson(PATHS.tutorials, {});
}

export function loadCuratedEn() {
  return readJson(PATHS.curatedEn, {});
}

export function loadCuratedI18n() {
  return readJson(PATHS.curatedI18n, {});
}

export function listGames({ q = "", page = 1, limit = 40 } = {}) {
  const collection = loadCollection();
  const tutorials = loadTutorials();
  const query = String(q || "").trim().toLowerCase();
  let games = collection.games || [];
  if (query) {
    games = games.filter((g) => {
      const hay = [
        g.id,
        g.slug,
        g.name,
        g.category,
        g.originCountry,
        g.civilization,
        ...(g.tags || []),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });
  }
  const total = games.length;
  const start = Math.max(0, (page - 1) * limit);
  const slice = games.slice(start, start + limit).map((g) => ({
    id: g.id,
    slug: g.slug,
    name: g.name,
    category: g.category,
    originCountry: g.originCountry,
    civilization: g.civilization,
    creationYear: g.creationYear,
    imageCount: (g.images || []).length,
    cover: (g.images || [])[0] || "",
    hasTutorial: Boolean(tutorials[g.id]?.videoId),
    tutorialTitle: tutorials[g.id]?.title || "",
  }));
  return {
    total,
    page,
    limit,
    games: slice,
    meta: collection.meta,
  };
}

export function getGame(id) {
  const collection = loadCollection();
  const game = (collection.games || []).find((g) => g.id === id || g.slug === id);
  if (!game) return null;
  const tutorials = loadTutorials();
  const curatedEn = loadCuratedEn();
  const curatedI18n = loadCuratedI18n();
  /** @type {Record<string, unknown>} */
  const localeOverlays = {};
  for (const [locale, pack] of Object.entries(curatedI18n)) {
    if (pack && pack[game.id]) localeOverlays[locale] = pack[game.id];
  }
  return {
    game,
    tutorial: tutorials[game.id] || null,
    curatedEn: curatedEn[game.id] || null,
    localeOverlays,
  };
}

function backupFiles() {
  mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  for (const [key, path] of Object.entries(PATHS)) {
    if (!existsSync(path)) continue;
    copyFileSync(path, join(backupDir, `${stamp}-${key}.json`));
  }
}

/**
 * @param {string} id
 * @param {{ game?: object, tutorial?: object|null, curatedEn?: object|null, localeOverlays?: Record<string, object|null> }} patch
 */
export function saveGame(id, patch) {
  backupFiles();
  const collection = loadCollection();
  const idx = (collection.games || []).findIndex(
    (g) => g.id === id || g.slug === id,
  );
  if (idx === -1) throw new Error("Game not found");
  const prev = collection.games[idx];
  const nextGame = {
    ...prev,
    ...(patch.game || {}),
    id: prev.id,
  };
  if (!nextGame.slug) nextGame.slug = prev.slug;
  if (!Array.isArray(nextGame.images)) nextGame.images = prev.images || [];
  if (!Array.isArray(nextGame.howToPlay)) nextGame.howToPlay = prev.howToPlay || [];
  if (!Array.isArray(nextGame.requirements))
    nextGame.requirements = prev.requirements || [];
  if (!Array.isArray(nextGame.variations))
    nextGame.variations = prev.variations || [];
  if (!Array.isArray(nextGame.tags)) nextGame.tags = prev.tags || [];
  if (!Array.isArray(nextGame.purchaseLinks))
    nextGame.purchaseLinks = prev.purchaseLinks || [];
  collection.games[idx] = nextGame;
  collection.meta = {
    ...collection.meta,
    generatedAt: new Date().toISOString(),
    totalGames: collection.games.length,
    totalVariations: collection.games.reduce(
      (a, g) => a + (g.variations?.length || 0),
      0,
    ),
  };
  // Minified for size (matches generator output)
  writeFileSync(PATHS.collection, JSON.stringify(collection));

  const tutorials = loadTutorials();
  if (patch.tutorial === null) {
    delete tutorials[prev.id];
  } else if (patch.tutorial && typeof patch.tutorial === "object") {
    const videoId = extractYoutubeId(
      patch.tutorial.videoId || patch.tutorial.url || "",
    );
    if (videoId) {
      tutorials[prev.id] = {
        videoId,
        title: patch.tutorial.title || nextGame.name,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        channelTitle: patch.tutorial.channelTitle || "Admin",
        publishedText: patch.tutorial.publishedText || "updated",
        viewCount: Number(patch.tutorial.viewCount) || 0,
        likeCount: Number(patch.tutorial.likeCount) || 0,
        candidatesConsidered: Number(patch.tutorial.candidatesConsidered) || 1,
        query: patch.tutorial.query || `${nextGame.name} how to play`,
      };
    }
  }
  writeFileSync(PATHS.tutorials, JSON.stringify(tutorials));

  if (patch.curatedEn !== undefined) {
    const curatedEn = loadCuratedEn();
    if (patch.curatedEn === null) {
      delete curatedEn[prev.id];
    } else if (patch.curatedEn) {
      curatedEn[prev.id] = {
        name: patch.curatedEn.name || nextGame.name,
        description: patch.curatedEn.description || nextGame.description,
        howToPlay: patch.curatedEn.howToPlay || nextGame.howToPlay,
        requirements: patch.curatedEn.requirements || nextGame.requirements,
        idealParticipants:
          patch.curatedEn.idealParticipants || nextGame.idealParticipants,
        variationNotes: patch.curatedEn.variationNotes || [],
      };
    }
    writeJson(PATHS.curatedEn, curatedEn);
  }

  if (patch.localeOverlays) {
    const curatedI18n = loadCuratedI18n();
    for (const [locale, overlay] of Object.entries(patch.localeOverlays)) {
      if (!curatedI18n[locale]) curatedI18n[locale] = {};
      if (overlay === null) {
        delete curatedI18n[locale][prev.id];
      } else if (overlay) {
        curatedI18n[locale][prev.id] = overlay;
      }
    }
    writeJson(PATHS.curatedI18n, curatedI18n);
  }

  return getGame(prev.id);
}

export function extractYoutubeId(input) {
  const s = String(input || "").trim();
  if (!s) return "";
  if (/^[\w-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1, 12);
    const v = u.searchParams.get("v");
    if (v && /^[\w-]{11}$/.test(v)) return v;
    const m = u.pathname.match(/\/embed\/([\w-]{11})/);
    if (m) return m[1];
  } catch {
    /* ignore */
  }
  const m2 = s.match(/(?:v=|\/)([\w-]{11})(?:[?&]|$)/);
  return m2 ? m2[1] : "";
}

export function supportedLocales() {
  return [
    "zh-Hans",
    "zh-Hant",
    "es",
    "hi",
    "ar",
    "fr",
    "pt",
    "ru",
    "ja",
    "de",
    "ko",
    "it",
    "tr",
    "vi",
    "th",
    "id",
    "nl",
    "pl",
    "sv",
    "el",
    "he",
    "uk",
    "fa",
    "bn",
    "sw",
    "la",
    "grc",
    "sa",
    "egy",
    "akk",
    "non",
  ];
}

export { PATHS, atlasRoot };
