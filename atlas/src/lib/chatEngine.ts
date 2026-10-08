import type { Game } from "../types/game";
import type {
  ChatMessage,
  ChatPhase,
  ChatState,
  PlayerPref,
  SettingPref,
  UserPrefs,
  VibePref,
} from "../types/chat";
import type { MessageKey } from "../i18n/messages/en";
import { charExcerpt } from "./textPreview";
import { countryWithFlag } from "./countryFlags";

export type ChatTranslate = (
  key: MessageKey,
  vars?: Record<string, string | number>,
) => string;

function playerQuickReplies(t: ChatTranslate) {
  return [
    t("chat.qr.alone"),
    t("chat.qr.two"),
    t("chat.qr.small"),
    t("chat.qr.group"),
    t("chat.qr.anySize"),
  ];
}

function settingQuickReplies(t: ChatTranslate) {
  return [t("chat.qr.indoor"), t("chat.qr.outdoor"), t("chat.qr.either")];
}

function vibeQuickReplies(t: ChatTranslate, full = true) {
  if (full) {
    return [
      t("chat.qr.strategy"),
      t("chat.qr.casual"),
      t("chat.qr.craft"),
      t("chat.qr.sport"),
      t("chat.qr.puzzle"),
      t("chat.qr.kids"),
      t("chat.qr.ritual"),
      t("chat.qr.surprise"),
    ];
  }
  return [
    t("chat.qr.strategy"),
    t("chat.qr.casual"),
    t("chat.qr.craft"),
    t("chat.qr.sport"),
    t("chat.qr.puzzle"),
    t("chat.qr.surprise"),
  ];
}

function uid() {
  return `m_${Math.random().toString(36).slice(2, 10)}`;
}

function assistant(
  content: string,
  extras?: Partial<ChatMessage>,
): ChatMessage {
  return { id: uid(), role: "assistant", content, ...extras };
}

function normalize(s: string) {
  return s.toLowerCase().trim();
}

const OUTDOOR_CATS = new Set([
  "Outdoor Folk",
  "Ball & Sport",
]);

const INDOOR_CATS = new Set([
  "Board & Race",
  "Strategy & War",
  "Mancala & Sowing",
  "Cards & Tiles",
  "Dice & Chance",
  "String & Finger",
  "Dolls & Figures",
  "Puzzles & Skill",
  "Musical Play",
  "Construction",
  "Memory & Word",
  "Hand & Gesture",
  "Ritual & Ceremony",
  "Spinning & Tops",
]);

const VIBE_CATEGORIES: Record<Exclude<VibePref, "any">, string[]> = {
  strategy: ["Strategy & War", "Mancala & Sowing", "Board & Race"],
  casual: ["Cards & Tiles", "Dice & Chance", "Outdoor Folk", "Spinning & Tops"],
  craft: ["Dolls & Figures", "Construction", "Musical Play"],
  sport: ["Ball & Sport", "Outdoor Folk"],
  ritual: ["Ritual & Ceremony", "Memory & Word"],
  kids: ["Dolls & Figures", "Spinning & Tops", "Outdoor Folk", "Construction", "String & Finger"],
  puzzle: ["Puzzles & Skill", "String & Finger", "Memory & Word"],
};

export function initialChatState(): ChatState {
  return {
    phase: "welcome",
    prefs: {},
    lastRecommendations: [],
    seenRecommendedIds: [],
  };
}

const REC_BATCH = 3;

function mergeSeen(prev: string[], games: Game[]): string[] {
  const next = new Set(prev);
  for (const g of games) next.add(g.id);
  return [...next];
}

function recommendExcluding(
  games: Game[],
  prefs: UserPrefs,
  excludeIds: Iterable<string>,
  limit = REC_BATCH,
): Game[] {
  const exclude = new Set(excludeIds);
  return recommendGames(games, prefs, Math.max(limit * 4, 12))
    .filter((g) => !exclude.has(g.id))
    .slice(0, limit);
}

export function welcomeMessage(t: ChatTranslate): ChatMessage {
  return assistant(t("chat.welcome"), {
    quickReplies: playerQuickReplies(t),
  });
}

function parsePlayers(text: string, tr?: ChatTranslate): PlayerPref | null {
  const t = normalize(text);
  if (tr) {
    if (t === normalize(tr("chat.qr.alone"))) return "alone";
    if (t === normalize(tr("chat.qr.two"))) return "two";
    if (t === normalize(tr("chat.qr.small"))) return "small";
    if (t === normalize(tr("chat.qr.group"))) return "group";
    if (t === normalize(tr("chat.qr.anySize"))) return "any";
  }
  if (/\b(alone|solo|by myself|1 person|one person|just me)\b/.test(t)) return "alone";
  if (/\b(2|two|pair|duo)\b/.test(t) && !/\b(3|4|three|four|group)\b/.test(t)) return "two";
  if (/\b(3|4|three|four|small group|few friends)\b/.test(t)) return "small";
  if (/\b(group|many|party|team|crowd|5\+|large)\b/.test(t)) return "group";
  if (/\b(any|either|doesn't matter|no preference|flexible)\b/.test(t)) return "any";
  if (t.includes("2 people")) return "two";
  if (t.includes("3–4") || t.includes("3-4")) return "small";
  if (t.includes("larger group")) return "group";
  if (t === "any size") return "any";
  return null;
}

function parseSetting(text: string, tr?: ChatTranslate): SettingPref | null {
  const t = normalize(text);
  if (tr) {
    if (t === normalize(tr("chat.qr.outdoor"))) return "outdoor";
    if (t === normalize(tr("chat.qr.indoor"))) return "indoor";
    if (t === normalize(tr("chat.qr.either"))) return "either";
  }
  if (/\b(outdoor|outside|yard|park|field|street)\b/.test(t)) return "outdoor";
  if (/\b(indoor|inside|table|tabletop|home|parlor|room)\b/.test(t)) return "indoor";
  if (/\b(either|both|any|no preference|doesn't matter)\b/.test(t)) return "either";
  return null;
}

function parseVibe(text: string, tr?: ChatTranslate): VibePref | null {
  const t = normalize(text);
  if (tr) {
    if (t === normalize(tr("chat.qr.strategy"))) return "strategy";
    if (t === normalize(tr("chat.qr.casual"))) return "casual";
    if (t === normalize(tr("chat.qr.craft"))) return "craft";
    if (t === normalize(tr("chat.qr.sport"))) return "sport";
    if (t === normalize(tr("chat.qr.ritual"))) return "ritual";
    if (t === normalize(tr("chat.qr.kids"))) return "kids";
    if (t === normalize(tr("chat.qr.puzzle"))) return "puzzle";
    if (t === normalize(tr("chat.qr.surprise"))) return "any";
  }
  if (/\b(strateg|chess|think|tactical|mind)\b/.test(t)) return "strategy";
  if (/\b(casual|light|easy|party|social|fun)\b/.test(t)) return "casual";
  if (/\b(craft|doll|make|build|construction|toy figure)\b/.test(t)) return "craft";
  if (/\b(sport|ball|athletic|active|kick)\b/.test(t)) return "sport";
  if (/\b(ritual|festival|ceremony|sacred|spiritual)\b/.test(t)) return "ritual";
  if (/\b(kid|child|children|family)\b/.test(t)) return "kids";
  if (/\b(puzzle|skill|dexterity|brain)\b/.test(t)) return "puzzle";
  if (/\b(any|surprise|no preference|mix)\b/.test(t)) return "any";
  // quick reply labels
  if (t.includes("deep strategy")) return "strategy";
  if (t.includes("light & social")) return "casual";
  if (t.includes("craft & dolls")) return "craft";
  if (t.includes("sport & active")) return "sport";
  if (t.includes("ritual & festival")) return "ritual";
  if (t.includes("kids & family")) return "kids";
  if (t.includes("puzzles & skill")) return "puzzle";
  return null;
}

function parseRegion(text: string, tr?: ChatTranslate): string | null {
  const t = normalize(text);
  if (tr) {
    if (t === normalize(tr("chat.qr.worldwide"))) return "any";
    if (t === normalize(tr("chat.qr.regionEastAsia"))) return "east asia";
    if (t === normalize(tr("chat.qr.regionAfrica"))) return "africa";
    if (t === normalize(tr("chat.qr.regionIndia"))) return "india";
    if (t === normalize(tr("chat.qr.regionEurope"))) return "europe";
    if (t === normalize(tr("chat.qr.regionMesoamerica"))) return "mesoamerica";
  }
  if (/\b(any|worldwide|no preference|everywhere|global)\b/.test(t)) return "any";
  if (!t) return null;
  return t.replace(/^(from|in|around|near)\s+/, "");
}

function isStartOver(text: string, tr?: ChatTranslate) {
  if (tr && normalize(text) === normalize(tr("chat.qr.startOver"))) return true;
  return /\b(start over|restart|reset|new search|begin again)\b/i.test(text);
}

function isOffTopic(text: string) {
  const t = normalize(text);
  if (!t) return false;
  // Clearly unrelated domains
  const off =
    /\b(weather|stock|crypto|bitcoin|nfl scores|movie times|recipe|cook dinner|medical advice|diagnose|homework essay|write code for me|programming help|political election|dating advice)\b/.test(
      t,
    );
  if (!off) return false;
  // Still allow if they also mention games/toys
  if (/\b(game|toy|play|board|mancala|chess|buy|purchase|catalog|ludus)\b/.test(t)) {
    return false;
  }
  return true;
}

function isCatalogScopedAsk(text: string): boolean {
  const t = normalize(text);
  // Explicit catalog topics, or short follow-ups about the page’s game (“tell me more”, “explain it”).
  return /\b(play|rule|step|how|origin|history|civilization|culture|variation|variant|buy|purchase|shop|require|equipment|material|player|participant|score|win|capture|board|toy|game|catalog|ludus|where|when|what|who|why|explain|summarize|summary|tell|more|about|need|gear|piece|pieces|setup|start|begin|learn)\b/.test(
    t,
  );
}

function playersMatch(game: Game, pref?: PlayerPref): number {
  if (!pref || pref === "any") return 1;
  const p = normalize(game.idealParticipants);
  if (pref === "alone") {
    if (/\balone\b|1–|1-|n\/a|display|caregiver|solo/.test(p)) return 3;
    if (/\b1–|1-/.test(p)) return 2;
    return 0;
  }
  if (pref === "two") {
    if (/\b2 people\b|^2\b|2 teams|1–2|1-2|2\+/.test(p)) return 3;
    if (/\b2–|2-/.test(p)) return 2;
    return 0;
  }
  if (pref === "small") {
    if (/\b2–4|2-4|3–4|3-4|1–4|2–6|4 people/.test(p)) return 3;
    if (/\b2\+|3\+|people/.test(p)) return 1;
    return 0;
  }
  if (pref === "group") {
    if (/\bteam|group|many|10\+|2 teams|circle|parade/.test(p)) return 3;
    if (/\b4\+|6\+|8\+|2–10|3\+/.test(p)) return 2;
    return 0;
  }
  return 1;
}

function settingMatch(game: Game, pref?: SettingPref): number {
  if (!pref || pref === "either") return 1;
  const outdoor = OUTDOOR_CATS.has(game.category);
  if (pref === "outdoor") return outdoor ? 3 : 0;
  return outdoor ? 0 : INDOOR_CATS.has(game.category) ? 2 : 1;
}

function vibeMatch(game: Game, pref?: VibePref): number {
  if (!pref || pref === "any") return 1;
  const cats = VIBE_CATEGORIES[pref] || [];
  if (cats.includes(game.category)) return 3;
  // soft keyword boosts
  const blob = `${game.name} ${game.description} ${game.tags.join(" ")}`.toLowerCase();
  if (pref === "strategy" && /strategy|chess|capture|territory/.test(blob)) return 2;
  if (pref === "kids" && /child|children|infant|nurtur/.test(blob)) return 2;
  if (pref === "sport" && /kick|ball|field|court|race/.test(blob)) return 2;
  return 0;
}

const REGION_ALIASES: Record<string, string[]> = {
  "east asia": ["china", "japan", "korea", "mongolia", "taiwan", "chinese", "japanese", "korean"],
  asia: ["china", "japan", "korea", "india", "indonesia", "thailand", "vietnam", "mongolia", "persia", "iran"],
  africa: ["africa", "egypt", "ghana", "nigeria", "mali", "ethiopia", "kenya", "tanzania", "madagascar", "morocco", "akan", "yoruba"],
  europe: ["europe", "greece", "italy", "france", "spain", "germany", "united kingdom", "britain", "russia", "norse"],
  india: ["india", "indian", "tamil", "mughal"],
  mesoamerica: ["mexico", "maya", "aztec", "mesoamerican", "guatemala"],
  worldwide: [],
};

function regionMatch(game: Game, region?: string): number {
  if (!region || region === "any" || region === "worldwide") return 1;
  const blob = `${game.originCountry} ${game.civilization} ${game.name} ${game.variations
    .map((v) => `${v.name} ${v.originCountry}`)
    .join(" ")}`.toLowerCase();
  const key = region.toLowerCase();
  const aliases = REGION_ALIASES[key];
  if (aliases) {
    if (!aliases.length) return 1;
    const hit = aliases.some((a) => blob.includes(a));
    return hit ? 3 : 0;
  }
  const tokens = key.split(/[\s,/]+/).filter((t) => t.length > 2);
  if (!tokens.length) return 1;
  let hits = 0;
  for (const t of tokens) {
    if (blob.includes(t)) hits += 1;
  }
  if (hits === 0) return 0;
  return Math.min(3, hits + 1);
}

export function scoreGame(game: Game, prefs: UserPrefs): number {
  const scores = [
    playersMatch(game, prefs.players),
    settingMatch(game, prefs.setting),
    vibeMatch(game, prefs.vibe),
    regionMatch(game, prefs.region),
  ];
  // Hard filter: if any explicit pref scores 0, heavily penalize
  if (scores.some((s) => s === 0)) {
    return scores.reduce((a, b) => a + b, 0) * 0.15;
  }
  let total = scores.reduce((a, b) => a + b, 0);
  // Prefer curated/seed entries (with variations or without regional matrix suffixes)
  if (game.variations.length > 0) total += 1.5;
  if (!game.name.includes(" — ")) total += 1;
  if (game.howToPlay.length >= 4 && game.description.length > 220) total += 0.5;
  return total;
}

export function recommendGames(games: Game[], prefs: UserPrefs, limit = 5): Game[] {
  const ranked = [...games]
    .map((g) => ({ g, s: scoreGame(g, prefs) }))
    .filter((x) => x.s > 1.5)
    .sort((a, b) => b.s - a.s || a.g.name.localeCompare(b.g.name));

  // Prefer diversity of categories in top results
  const picked: Game[] = [];
  const seenCats = new Set<string>();
  for (const { g } of ranked) {
    if (picked.length >= limit) break;
    if (seenCats.has(g.category) && picked.length < limit - 1) continue;
    picked.push(g);
    seenCats.add(g.category);
  }
  // fill if diversity skipped too many
  for (const { g } of ranked) {
    if (picked.length >= limit) break;
    if (!picked.some((p) => p.id === g.id)) picked.push(g);
  }
  return picked;
}

const NAME_STOP = new Set([
  "how",
  "do",
  "to",
  "play",
  "the",
  "a",
  "an",
  "one",
  "first",
  "second",
  "third",
  "where",
  "can",
  "i",
  "buy",
  "get",
  "purchase",
  "tell",
  "me",
  "its",
  "about",
  "history",
  "show",
  "variations",
  "more",
  "like",
  "these",
  "this",
  "that",
  "what",
  "which",
  "for",
  "from",
  "with",
  "and",
  "recommend",
  "suggest",
  "please",
  "game",
  "games",
  "toy",
  "toys",
]);

function findGamesByName(games: Game[], text: string, limit = 5): Game[] {
  let t = normalize(text)
    .replace(/[?!.,]/g, " ")
    .replace(/\b(how (do|to) play|where can i (buy|get)|tell me about|show me)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Drop leading buy/play wrappers still left
  t = t.replace(/^(buy|play)\s+/, "");

  if (!t || NAME_STOP.has(t)) return [];

  const scored = games
    .map((g) => {
      const name = normalize(g.name);
      const vars = g.variations.map((v) => normalize(v.name));
      let s = 0;
      if (name === t) s = 100;
      else if (t.length >= 3 && (name.includes(t) || vars.some((v) => v === t || v.includes(t))))
        s = 80;
      else if (t.length >= 4 && name.startsWith(t)) s = 75;
      else {
        const tokens = t.split(/\s+/).filter((x) => x.length > 2 && !NAME_STOP.has(x));
        if (!tokens.length) return { g, s: 0 };
        const hits = tokens.filter(
          (tok) =>
            name.includes(tok) ||
            vars.some((v) => v.includes(tok)) ||
            normalize(g.originCountry).includes(tok),
        ).length;
        // Require a solid fraction of meaningful tokens
        if (hits === 0) s = 0;
        else if (hits === tokens.length) s = 50 + hits * 10;
        else if (hits >= 2) s = 25 + hits * 8;
        else s = 0;
      }
      return { g, s };
    })
    .filter((x) => x.s >= 40)
    .sort((a, b) => b.s - a.s);
  return scored.slice(0, limit).map((x) => x.g);
}

function intent(text: string): string {
  const t = normalize(text);
  if (
    /\b(how\s+(do\s+i\s+|do\s+|to\s+)?play|rules|teach me|steps|instructions)\b/.test(
      t,
    )
  )
    return "how_to_play";
  if (/\b(buy|purchase|where (can|do) i (get|buy)|shop|amazon|etsy|price)\b/.test(t))
    return "purchase";
  if (/\b(origin|where .* from|history|civilization|created|invent|culture|symbolic|meaning)\b/.test(t))
    return "about";
  if (/\b(variation|variant|related|cousin|also called|other (forms|names))\b/.test(t))
    return "variations";
  if (/\b(requirement|need|equipment|materials|what do i need)\b/.test(t)) return "requirements";
  if (/\b(players?|how many|participants|alone|people)\b/.test(t) && /\b(need|for|ideal|many)\b/.test(t))
    return "participants";
  // Paginate the current preference pool (Guide “More recommendations” button).
  if (
    /\b(more recommendations?|more picks?|generate more|show more|more please)\b/.test(
      t,
    )
  )
    return "more_recs";
  if (/\b(more like|similar|another|other recommendation|else|different)\b/.test(t))
    return "more_like";
  if (/\b(recommend|suggest|what should|help me (find|choose)|looking for)\b/.test(t))
    return "recommend";
  if (/\b(compare|versus| vs |difference between)\b/.test(t)) return "compare";
  return "general";
}

function formatRecIntro(
  prefs: UserPrefs,
  games: Game[],
  t: ChatTranslate,
  opts?: { more?: boolean; moreAvailable?: boolean },
): string {
  const bits: string[] = [];
  if (prefs.players && prefs.players !== "any") {
    bits.push(t("chat.rec.forPlayers", { players: labelPlayers(prefs.players, t) }));
  }
  if (prefs.setting === "indoor") bits.push(t("chat.rec.settingIndoor"));
  else if (prefs.setting === "outdoor") bits.push(t("chat.rec.settingOutdoor"));
  if (prefs.vibe && prefs.vibe !== "any") {
    const vibeKey = `chat.vibe.${prefs.vibe}` as MessageKey;
    bits.push(t("chat.rec.vibePlay", { vibe: t(vibeKey) }));
  }
  if (prefs.region && prefs.region !== "any") {
    bits.push(t("chat.rec.tiedTo", { region: prefs.region }));
  }
  const prefLine = bits.length ? t("chat.rec.basedOn", { bits: bits.join(", ") }) : "";
  if (!games.length) {
    return t("chat.rec.none", { prefLine });
  }
  const intro = opts?.more
    ? t("chat.rec.moreIntro", { n: games.length, prefLine })
    : t("chat.rec.intro", { n: games.length, prefLine });
  if (opts?.moreAvailable === false) {
    return `${intro}\n\n${t("chat.rec.exhausted")}`;
  }
  return intro;
}

function labelPlayers(p: PlayerPref, t: ChatTranslate) {
  switch (p) {
    case "alone":
      return t("chat.players.alone");
    case "two":
      return t("chat.players.two");
    case "small":
      return t("chat.players.small");
    case "group":
      return t("chat.players.group");
    default:
      return t("chat.players.any");
  }
}

function answerHowToPlay(game: Game, t: ChatTranslate): string {
  const steps = game.howToPlay.map((s, i) => `${i + 1}. ${s}`).join("\n");
  return t("chat.answer.howToPlay", {
    name: game.name,
    steps,
    participants: game.idealParticipants,
  });
}

function answerPurchase(game: Game, t: ChatTranslate): string {
  if (!game.purchaseLinks.length) {
    return t("chat.answer.purchaseNone", { name: game.name });
  }
  const links = game.purchaseLinks
    .map((l) => `• ${l.platform}: ${l.label}\n  ${l.url}`)
    .join("\n");
  return t("chat.answer.purchase", { name: game.name, links });
}

function answerAbout(game: Game, t: ChatTranslate): string {
  return t("chat.answer.about", {
    name: game.name,
    origin: countryWithFlag(game.originCountryKey ?? game.originCountry),
    civilization: game.civilization,
    year: game.creationYear,
    category: game.category,
    description: game.description,
  });
}

function answerVariations(game: Game, t: ChatTranslate): string {
  if (!game.variations.length) {
    return t("chat.answer.variationsNone", { name: game.name });
  }
  const lines = game.variations
    .map((v) =>
      t("chat.answer.variationLine", {
        name: v.name,
        origin: countryWithFlag(v.originCountryKey ?? v.originCountry),
        year: v.creationYear,
        notes: v.notes,
      }),
    )
    .join("\n");
  return t("chat.answer.variations", { name: game.name, lines });
}

function answerRequirements(game: Game, t: ChatTranslate): string {
  return t("chat.answer.requirements", {
    name: game.name,
    lines: game.requirements.map((r) => `• ${r}`).join("\n"),
  });
}

function followupQuickReplies(
  t: ChatTranslate,
  opts?: { withVariations?: boolean; moreAvailable?: boolean },
) {
  const q: string[] = [];
  // Lead with pagination so “generate more” is one tap after each batch of 3.
  if (opts?.moreAvailable !== false) q.push(t("chat.qr.moreRecs"));
  q.push(
    t("chat.qr.howToPlayFirst"),
    t("chat.qr.whereBuyIt"),
    t("chat.qr.tellHistory"),
  );
  if (opts?.withVariations) q.push(t("chat.qr.showVariations"));
  q.push(t("chat.qr.startOver"));
  return q;
}

function nextRecommendationBatch(
  games: Game[],
  prefs: UserPrefs,
  seenIds: Iterable<string>,
): { recs: Game[]; moreAvailable: boolean } {
  const exclude = new Set(seenIds);
  let recs = recommendExcluding(games, prefs, exclude);
  let workingPrefs = prefs;
  if (!recs.length && prefs.region && prefs.region !== "any") {
    workingPrefs = { ...prefs, region: "any" };
    recs = recommendExcluding(games, workingPrefs, exclude);
  }
  const seenAfter = mergeSeen([...exclude], recs);
  const moreAvailable =
    recommendExcluding(games, workingPrefs, seenAfter, 1).length > 0 ||
    (!!(workingPrefs.region && workingPrefs.region !== "any") &&
      recommendExcluding(
        games,
        { ...workingPrefs, region: "any" },
        seenAfter,
        1,
      ).length > 0);
  return { recs, moreAvailable };
}

function resolveFocusGame(
  games: Game[],
  text: string,
  state: ChatState,
): Game | null {
  const t = normalize(text);

  // Ordinals / pronouns against the latest recommendation list first
  if (state.lastRecommendations.length) {
    if (/\b(third|3rd)\b/.test(t) && state.lastRecommendations[2]) {
      return state.lastRecommendations[2];
    }
    if (/\b(second|2nd)\b/.test(t) && state.lastRecommendations[1]) {
      return state.lastRecommendations[1];
    }
    if (
      /\b(first|1st|it|this|that|the first one)\b/.test(t) ||
      /\b(the first)\b/.test(t)
    ) {
      return state.lastRecommendations[0];
    }
  }

  const named = findGamesByName(games, text, 3);
  if (named.length === 1) return named[0];
  if (named.length > 1) {
    const fromRec = named.find((g) =>
      state.lastRecommendations.some((r) => r.id === g.id),
    );
    return fromRec || named[0];
  }
  if (state.focusGameId) {
    return games.find((g) => g.id === state.focusGameId) || null;
  }
  if (state.lastRecommendations.length === 1) return state.lastRecommendations[0];
  return null;
}

function applyFreeformPrefs(text: string, prefs: UserPrefs, tr?: ChatTranslate): UserPrefs {
  const next = { ...prefs };
  const players = parsePlayers(text, tr);
  const setting = parseSetting(text, tr);
  const vibe = parseVibe(text, tr);
  if (players) next.players = players;
  if (setting) next.setting = setting;
  if (vibe) next.vibe = vibe;
  // region hints: "from japan", "african", "china"
  const regionHint = text.match(
    /\b(?:from|in)\s+([a-z\u00C0-\u024f\s]{3,40})/i,
  );
  if (regionHint) next.region = regionHint[1].trim();
  else if (/\b(africa|asian|asia|europe|america|oceania|japan|china|india|korea|mexico|egypt)\b/i.test(text)) {
    const m = text.match(
      /\b(africa|asian|asia|europe|america|oceania|japan|china|india|korea|mexico|egypt)\b/i,
    );
    if (m) next.region = m[1];
  }
  return next;
}

export type ChatTurnResult = {
  state: ChatState;
  replies: ChatMessage[];
};

export function handleUserMessage(
  games: Game[],
  state: ChatState,
  rawText: string,
  t: ChatTranslate,
): ChatTurnResult {
  const text = rawText.trim();
  if (!text) {
    return {
      state,
      replies: [assistant(t("chat.hint.preference"))],
    };
  }

  if (isStartOver(text, t)) {
    const fresh = initialChatState();
    fresh.phase = "ask_players";
    return {
      state: fresh,
      replies: [
        assistant(t("chat.welcome"), {
          quickReplies: playerQuickReplies(t),
        }),
      ],
    };
  }

  if (isOffTopic(text)) {
    return { state, replies: [assistant(t("chat.outOfScope"))] };
  }

  // Preference interview flow
  if (state.phase === "welcome" || state.phase === "ask_players") {
    const players = parsePlayers(text, t);
    if (!players) {
      // maybe they jumped ahead with a full ask
      if (intent(text) === "recommend" || parseVibe(text, t) || parseSetting(text, t)) {
        const prefs = applyFreeformPrefs(text, state.prefs, t);
        const { recs, moreAvailable } = nextRecommendationBatch(
          games,
          prefs,
          state.seenRecommendedIds,
        );
        const seenRecommendedIds = mergeSeen(state.seenRecommendedIds, recs);
        return {
          state: {
            ...state,
            phase: "followup",
            prefs,
            lastRecommendations: recs,
            seenRecommendedIds,
            focusGameId: recs[0]?.id,
          },
          replies: [
            assistant(formatRecIntro(prefs, recs, t, { moreAvailable }), {
              recommendations: recs,
              quickReplies: followupQuickReplies(t, { moreAvailable }),
            }),
          ],
        };
      }
      return {
        state: { ...state, phase: "ask_players" },
        replies: [
          assistant(t("chat.hint.players"), {
            quickReplies: playerQuickReplies(t),
          }),
        ],
      };
    }
    return {
      state: {
        ...state,
        phase: "ask_setting",
        prefs: { ...state.prefs, players },
      },
      replies: [
        assistant(t("chat.askSetting"), {
          quickReplies: settingQuickReplies(t),
        }),
      ],
    };
  }

  if (state.phase === "ask_setting") {
    const setting = parseSetting(text, t);
    if (!setting) {
      return {
        state,
        replies: [
          assistant(t("chat.hint.setting"), {
            quickReplies: settingQuickReplies(t),
          }),
        ],
      };
    }
    return {
      state: {
        ...state,
        phase: "ask_vibe",
        prefs: { ...state.prefs, setting },
      },
      replies: [
        assistant(t("chat.askVibe"), {
          quickReplies: vibeQuickReplies(t, true),
        }),
      ],
    };
  }

  if (state.phase === "ask_vibe") {
    const vibe = parseVibe(text, t) || (normalize(text).includes("surprise") ? "any" : null);
    if (!vibe) {
      return {
        state,
        replies: [
          assistant(t("chat.hint.vibe"), {
            quickReplies: vibeQuickReplies(t, false),
          }),
        ],
      };
    }
    return {
      state: {
        ...state,
        phase: "ask_region",
        prefs: { ...state.prefs, vibe },
      },
      replies: [
        assistant(t("chat.askRegion"), {
          quickReplies: [
            t("chat.qr.worldwide"),
            t("chat.qr.regionEastAsia"),
            t("chat.qr.regionAfrica"),
            t("chat.qr.regionIndia"),
            t("chat.qr.regionEurope"),
            t("chat.qr.regionMesoamerica"),
          ],
        }),
      ],
    };
  }

  if (state.phase === "ask_region") {
    const region = parseRegion(text, t) || normalize(text) || "any";
    const prefs = { ...state.prefs, region };
    const { recs, moreAvailable } = nextRecommendationBatch(
      games,
      prefs,
      state.seenRecommendedIds,
    );
    const seenRecommendedIds = mergeSeen(state.seenRecommendedIds, recs);
    return {
      state: {
        ...state,
        phase: "followup",
        prefs,
        lastRecommendations: recs,
        seenRecommendedIds,
        focusGameId: recs[0]?.id,
      },
      replies: [
        assistant(formatRecIntro(prefs, recs, t, { moreAvailable }), {
          recommendations: recs,
          quickReplies: followupQuickReplies(t, {
            withVariations: true,
            moreAvailable,
          }),
        }),
      ],
    };
  }

  // Follow-up / freeform mode
  const prefs = applyFreeformPrefs(text, state.prefs, t);
  const i = intent(text);
  let focus = resolveFocusGame(games, text, state);

  // Named game without clear intent → about + offer actions
  const named = findGamesByName(games, text, 3);
  if (!focus && named.length && i === "general") {
    focus = named[0];
  }

  if (i === "how_to_play") {
    if (!focus) {
      return {
        state: { ...state, prefs },
        replies: [
          assistant(t("chat.askHowToPlayWhich"), {
            quickReplies: state.lastRecommendations.slice(0, 3).map((g) => g.name),
          }),
        ],
      };
    }
    return {
      state: { ...state, prefs, focusGameId: focus.id, phase: "followup" },
      replies: [
        assistant(answerHowToPlay(focus, t), {
          recommendations: [focus],
          quickReplies: [
            t("chat.qr.requirements"),
            t("chat.qr.whereBuy"),
            t("chat.qr.variations"),
            t("chat.qr.recommendElse"),
          ],
        }),
      ],
    };
  }

  if (i === "purchase") {
    if (!focus) {
      return {
        state: { ...state, prefs },
        replies: [
          assistant(t("chat.askPurchaseWhich"), {
            quickReplies: state.lastRecommendations
              .slice(0, 3)
              .map((g) => t("chat.qr.buyNamed", { name: g.name })),
          }),
        ],
      };
    }
    return {
      state: { ...state, prefs, focusGameId: focus.id, phase: "followup" },
      replies: [
        assistant(answerPurchase(focus, t), {
          recommendations: [focus],
          quickReplies: [
            t("chat.qr.howToPlay"),
            t("chat.qr.requirements"),
            t("chat.qr.moreRecs"),
          ],
        }),
      ],
    };
  }

  if (i === "about") {
    if (!focus) {
      return {
        state: { ...state, prefs },
        replies: [assistant(t("chat.askAbout"))],
      };
    }
    return {
      state: { ...state, prefs, focusGameId: focus.id, phase: "followup" },
      replies: [
        assistant(answerAbout(focus, t), {
          recommendations: [focus],
          quickReplies: [
            t("chat.qr.howToPlay"),
            t("chat.qr.variations"),
            t("chat.qr.whereBuy"),
          ],
        }),
      ],
    };
  }

  if (i === "variations") {
    if (!focus) {
      return {
        state: { ...state, prefs },
        replies: [assistant(t("chat.askVariations"))],
      };
    }
    return {
      state: { ...state, prefs, focusGameId: focus.id, phase: "followup" },
      replies: [
        assistant(answerVariations(focus, t), {
          recommendations: [focus],
          quickReplies: [t("chat.qr.howToPlay"), t("chat.qr.whereBuy")],
        }),
      ],
    };
  }

  if (i === "requirements" || i === "participants") {
    if (!focus) {
      return {
        state: { ...state, prefs },
        replies: [assistant(t("chat.askRequirements"))],
      };
    }
    const extra =
      i === "participants"
        ? t("chat.answer.participants", {
            name: focus.name,
            participants: focus.idealParticipants,
          })
        : answerRequirements(focus, t);
    return {
      state: { ...state, prefs, focusGameId: focus.id, phase: "followup" },
      replies: [
        assistant(extra, {
          recommendations: [focus],
          quickReplies: [t("chat.qr.howToPlay"), t("chat.qr.whereBuy")],
        }),
      ],
    };
  }

  if (i === "compare") {
    const found = findGamesByName(games, text, 4);
    if (found.length < 2 && state.lastRecommendations.length >= 2) {
      found.push(state.lastRecommendations[0], state.lastRecommendations[1]);
    }
    const unique = [...new Map(found.map((g) => [g.id, g])).values()].slice(0, 2);
    if (unique.length < 2) {
      return {
        state: { ...state, prefs },
        replies: [assistant(t("chat.askCompare"))],
      };
    }
    const [a, b] = unique;
    const body = t("chat.answer.compare", {
      a: a.name,
      b: b.name,
      aOrigin: countryWithFlag(a.originCountryKey ?? a.originCountry),
      aYear: a.creationYear,
      bOrigin: countryWithFlag(b.originCountryKey ?? b.originCountry),
      bYear: b.creationYear,
      aPlayers: a.idealParticipants,
      bPlayers: b.idealParticipants,
      aCategory: a.category,
      bCategory: b.category,
      aDesc: charExcerpt(a.description, 200),
      bDesc: charExcerpt(b.description, 200),
    });
    return {
      state: { ...state, prefs, phase: "followup", lastRecommendations: unique },
      replies: [
        assistant(body, {
          recommendations: unique,
          quickReplies: [
            t("chat.qr.howToPlayNamed", { name: a.name }),
            t("chat.qr.howToPlayNamed", { name: b.name }),
            t("chat.qr.startOver"),
          ],
        }),
      ],
    };
  }

  if (i === "more_recs" || i === "more_like" || i === "recommend") {
    const seed = focus || state.lastRecommendations[0];
    let nextPrefs = { ...prefs };
    // “More like these” may tilt vibe/setting from a seed title.
    // “More recommendations” keeps the interview prefs and only pages forward.
    if (seed && i === "more_like") {
      nextPrefs = {
        ...nextPrefs,
        vibe: nextPrefs.vibe || guessVibeFromGame(seed),
        setting:
          nextPrefs.setting ||
          (OUTDOOR_CATS.has(seed.category) ? "outdoor" : "indoor"),
      };
    }

    const exclude = new Set(state.seenRecommendedIds);
    for (const g of state.lastRecommendations) exclude.add(g.id);
    if (seed && i === "more_like") exclude.add(seed.id);

    const { recs, moreAvailable } = nextRecommendationBatch(
      games,
      nextPrefs,
      exclude,
    );

    if (!recs.length) {
      return {
        state: { ...state, prefs: nextPrefs, phase: "followup" },
        replies: [
          assistant(t("chat.rec.exhausted"), {
            quickReplies: [t("chat.qr.startOver")],
          }),
        ],
      };
    }

    const seenRecommendedIds = mergeSeen([...exclude], recs);
    const isMore = i === "more_recs" || i === "more_like";

    return {
      state: {
        ...state,
        prefs: nextPrefs,
        phase: "followup",
        lastRecommendations: recs,
        seenRecommendedIds,
        focusGameId: recs[0]?.id,
      },
      replies: [
        assistant(
          formatRecIntro(nextPrefs, recs, t, {
            more: isMore,
            moreAvailable,
          }),
          {
            recommendations: recs,
            quickReplies: followupQuickReplies(t, { moreAvailable }),
          },
        ),
      ],
    };
  }

  // General: if they named a game, introduce it
  if (focus) {
    return {
      state: { ...state, prefs, focusGameId: focus.id, phase: "followup" },
      replies: [
        assistant(
          t("chat.answer.aboutFollowup", { about: answerAbout(focus, t) }),
          {
            recommendations: [focus],
            quickReplies: [
              t("chat.qr.howToPlay"),
              t("chat.qr.whereBuy"),
              t("chat.qr.variations"),
              t("chat.qr.recommendElse"),
            ],
          },
        ),
      ],
    };
  }

  // Fallback guidance within scope
  return {
    state: { ...state, prefs, phase: "followup" },
    replies: [
      assistant(t("chat.answer.fallback"), {
        quickReplies: [
          t("chat.qr.startOver"),
          t("chat.qr.recommendSomething"),
          t("chat.qr.howToPlayChess"),
          t("chat.qr.buyMancala"),
        ],
      }),
    ],
  };
}

function guessVibeFromGame(game: Game): VibePref {
  for (const [vibe, cats] of Object.entries(VIBE_CATEGORIES) as [
    Exclude<VibePref, "any">,
    string[],
  ][]) {
    if (cats.includes(game.category)) return vibe;
  }
  return "any";
}

export function phaseAfterWelcome(): ChatPhase {
  return "ask_players";
}

function gameAssistantQuickReplies(t: ChatTranslate, game: Game) {
  const q = [
    t("chat.qr.howToPlay"),
    t("chat.qr.tellHistory"),
    t("chat.qr.requirements"),
    t("chat.qr.whereBuy"),
  ];
  if (game.variations.length) q.splice(2, 0, t("chat.qr.variations"));
  return q;
}

/** Welcome bubble for the per-game assistant on detail pages. */
export function gameAssistantWelcome(game: Game, t: ChatTranslate): ChatMessage {
  return assistant(t("detail.assistant.welcome", { name: game.name }), {
    quickReplies: gameAssistantQuickReplies(t, game),
  });
}

/**
 * Answer questions scoped to one catalog game on its detail page.
 * Gently refuses off-topic asks and redirects catalog-wide browsing to Guide.
 */
export function handleGameAssistantMessage(
  game: Game,
  rawText: string,
  t: ChatTranslate,
): ChatMessage[] {
  const text = rawText.trim();
  if (!text) {
    return [
      assistant(t("detail.assistant.hint", { name: game.name }), {
        quickReplies: gameAssistantQuickReplies(t, game),
      }),
    ];
  }

  if (isOffTopic(text) || (!isCatalogScopedAsk(text) && text.length > 12)) {
    return [
      assistant(t("detail.assistant.outOfScope", { name: game.name }), {
        quickReplies: gameAssistantQuickReplies(t, game),
      }),
    ];
  }

  const i = intent(text);

  if (i === "recommend" || i === "more_recs" || i === "more_like") {
    return [
      assistant(t("detail.assistant.useGuide", { name: game.name }), {
        quickReplies: gameAssistantQuickReplies(t, game),
      }),
    ];
  }

  // Named a well-known different title? Keep this page focused on `game`.
  const otherTitle = text.match(
    /\b(chess|go|weiqi|mancala|xiangqi|mahjong|backgammon|ludo|pachisi|shogi|janggi)\b/i,
  )?.[1];
  if (otherTitle) {
    const other = normalize(otherTitle);
    const self = normalize(game.name);
    const varHit = game.variations.some((v) => normalize(v.name).includes(other));
    if (!self.includes(other) && !varHit) {
      return [
        assistant(t("detail.assistant.otherGame", { name: game.name }), {
          quickReplies: gameAssistantQuickReplies(t, game),
        }),
      ];
    }
  }

  if (i === "how_to_play") {
    return [
      assistant(answerHowToPlay(game, t), {
        quickReplies: gameAssistantQuickReplies(t, game),
      }),
    ];
  }
  if (i === "purchase") {
    return [
      assistant(answerPurchase(game, t), {
        quickReplies: gameAssistantQuickReplies(t, game),
      }),
    ];
  }
  if (i === "about") {
    return [
      assistant(answerAbout(game, t), {
        quickReplies: gameAssistantQuickReplies(t, game),
      }),
    ];
  }
  if (i === "variations") {
    return [
      assistant(answerVariations(game, t), {
        quickReplies: gameAssistantQuickReplies(t, game),
      }),
    ];
  }
  if (i === "requirements" || i === "participants") {
    const body =
      i === "participants"
        ? t("chat.answer.participants", {
            name: game.name,
            participants: game.idealParticipants,
          })
        : answerRequirements(game, t);
    return [
      assistant(body, {
        quickReplies: gameAssistantQuickReplies(t, game),
      }),
    ];
  }

  // Default: short about + invite to ask about rules / buy / variations
  return [
    assistant(
      t("detail.assistant.default", {
        about: answerAbout(game, t),
        name: game.name,
      }),
      {
        quickReplies: gameAssistantQuickReplies(t, game),
      },
    ),
  ];
}
