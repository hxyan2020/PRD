import type { Game } from "../types/game";
import type {
  DiscoverHit,
  DiscoverPreferences,
  DiscoverProgress,
  DiscoverResult,
} from "../types/discover";
import { scoreGame } from "./chatEngine";
import type { UserPrefs } from "../types/chat";
import { readPool } from "./pool";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Unique picture set per discovery draft (never reused across drafts). */
function draftImages(slug: string, salt: number): string[] {
  const tags = "toy,game,play";
  const n = 2 + (salt % 2);
  return Array.from({ length: n }, (_, i) => {
    const lock = hash(`discover:${slug}:${i}`);
    return `https://loremflickr.com/900/600/${tags}?lock=${lock}`;
  });
}

const PURCHASE = [
  {
    platform: "Amazon",
    label: "Traditional Wooden Toy (Amazon US)",
    url: "https://www.amazon.com/dp/B01N4VCZXF",
  },
  {
    platform: "Etsy",
    label: "Folk Craft Toy (Etsy)",
    url: "https://www.etsy.com/market/folk_toy",
  },
  {
    platform: "Amazon UK",
    label: "Heritage Wooden Toy (Amazon UK)",
    url: "https://www.amazon.co.uk/dp/B0000C9Z8T",
  },
];

type DraftSeed = {
  name: string;
  country: string;
  civilization: string;
  year: string;
  category: string;
  participants: string;
  requirements: string[];
  description: string;
  howToPlay: string[];
};

const DISCOVERY_SEEDS: DraftSeed[] = [
  {
    name: "Seed-and-cup relay race",
    country: "West Africa",
    civilization: "West African folk",
    year: "centuries old",
    category: "Outdoor Folk",
    participants: "2 teams",
    requirements: ["Cups or calabashes", "Seeds or beans", "Open yard"],
    description:
      "A cooperative-competitive relay where teams carry seeds between cups without spilling—training balance, timing, and harvest metaphors common in West African children’s play.",
    howToPlay: [
      "Form two teams and line cups at either end of a short course.",
      "Fill the start cup with seeds; players ferry seeds by hand or spoon.",
      "Drop seeds into the far cup; sprint back to tag the next runner.",
      "Spills return to the start cup.",
      "First team to empty the start cup wins.",
    ],
  },
  {
    name: "Moon-phase memory tiles",
    country: "Multiple (global)",
    civilization: "Observational folk teaching",
    year: "traditional–modern teaching toy",
    category: "Memory & Word",
    participants: "1–4 people",
    requirements: ["Tile pairs showing moon phases", "Flat table"],
    description:
      "A matching memory set that teaches lunar phases through play. Variants appear in museum education kits and folk astronomy teaching across cultures that track the night sky.",
    howToPlay: [
      "Shuffle and lay tiles face-down.",
      "Turn two tiles per turn seeking a matching phase pair.",
      "Keep pairs and play again; mismatches flip back.",
      "Optional: say the phase name when matched.",
      "Most pairs wins.",
    ],
  },
  {
    name: "Market bargain counting sticks",
    country: "Southeast Asia",
    civilization: "Southeast Asian market folk",
    year: "centuries old",
    category: "Memory & Word",
    participants: "2–6 people",
    requirements: ["Counting sticks or tokens", "Role cards (buyer/seller)"],
    description:
      "Children’s market role-play using sticks as coin and tally. Builds arithmetic fluency and social negotiation—an everyday economic toy of bazaar cultures.",
    howToPlay: [
      "Deal buyer and seller roles and a purse of sticks.",
      "Sellers name prices for imagined goods.",
      "Buyers count out sticks; make change with remaining sticks.",
      "Rotate roles each round.",
      "Optional score: fewest mistakes in change-making.",
    ],
  },
  {
    name: "Silk-road caravan race",
    country: "Central Asia",
    civilization: "Central Asian / Silk Road",
    year: "inspired by centuries of caravan culture",
    category: "Board & Race",
    participants: "2–4 people",
    requirements: ["Path board with oasis spaces", "Tokens", "Dice or sticks"],
    description:
      "A race along oasis waypoints that echoes Silk Road travel lore. Players manage ‘loads’ and delays—an educational race toy blending geography and chance.",
    howToPlay: [
      "Place tokens at the western start.",
      "Roll to advance toward the eastern market.",
      "Oasis spaces may grant water (safe) or sandstorm (skip a turn).",
      "Carrying an optional extra load slows you but scores bonus on arrival.",
      "First to the market with required load conditions wins.",
    ],
  },
  {
    name: "Courtyard shadow animals",
    country: "China",
    civilization: "Chinese folk",
    year: "centuries old",
    category: "Hand & Gesture",
    participants: "1–many people",
    requirements: ["Lamp or lantern", "Blank wall", "Hands"],
    description:
      "Hand-shadow animal performances for courtyard evenings—storytelling toy of silhouette and voice, related to wider shadow-play traditions.",
    howToPlay: [
      "Place a lamp to cast clear hand shadows.",
      "Form birds, wolves, or rabbits with fingers.",
      "Narrate a short scene while shapes move.",
      "Pass the lamp role to the next storyteller.",
      "No score—audience applause optional.",
    ],
  },
  {
    name: "Harbor knot race",
    country: "Portugal",
    civilization: "Maritime Portuguese folk",
    year: "centuries old",
    category: "Puzzles & Skill",
    participants: "2–6 people",
    requirements: ["Short rope lengths", "Knot diagram cards"],
    description:
      "A sailor’s skill game: race to tie named knots cleanly. Harbor towns turned practical ropework into timed children’s contests.",
    howToPlay: [
      "Draw a knot card (reef, clove hitch, bowline, etc.).",
      "On a signal, tie the knot in your rope.",
      "Judge checks correctness and tightness.",
      "Fastest correct knot scores a point.",
      "Play to an agreed total.",
    ],
  },
  {
    name: "Desert fox stones",
    country: "Morocco",
    civilization: "Amazigh / Maghreb",
    year: "centuries old",
    category: "Strategy & War",
    participants: "2 people",
    requirements: ["Grid scratched in sand or board", "1 fox + several hen stones"],
    description:
      "An asymmetric hunt on a small grid—one fox against many hens—belonging to the worldwide predator-prey family, with Maghreb naming and sand-board practice.",
    howToPlay: [
      "Place hens on one side and the fox opposite.",
      "Hens move one step; fox may leap to capture.",
      "Hens win by cornering the fox; fox wins by capturing enough hens.",
      "Agree capture totals before play.",
      "Redraw the grid if playing in sand.",
    ],
  },
  {
    name: "Festival ribbon weave",
    country: "Mexico",
    civilization: "Mexican folk festival",
    year: "centuries old",
    category: "Ritual & Ceremony",
    participants: "Alone or small group",
    requirements: ["Colored ribbons", "Dowel or maypole stick"],
    description:
      "Children weave festival ribbons around a stick in patterned over-under steps—craft play tied to dance and celebration color symbolism.",
    howToPlay: [
      "Fix ribbons at the top of a stick.",
      "Follow an over-under sequence around the shaft.",
      "Keep tension even so patterns show.",
      "Compare finished weaves for neatness.",
      "Use ribbons again next festival season.",
    ],
  },
  {
    name: "Snow hare track stamp",
    country: "Finland",
    civilization: "Finnish / Nordic folk",
    year: "centuries old",
    category: "Outdoor Folk",
    participants: "2+ people",
    requirements: ["Snowy ground", "Agreed track stamps or footprints"],
    description:
      "A winter tracking game: one player lays a ‘hare’ trail in snow; others follow clues. Teaches observation and winter outdoor play.",
    howToPlay: [
      "Hare player makes a trail with turns and false spurs.",
      "Seekers wait, then follow the freshest prints.",
      "Hare may loop back toward a home tree.",
      "Tagging the hare ends the round.",
      "Rotate who is hare.",
    ],
  },
  {
    name: "Temple bell echo clap",
    country: "Japan",
    civilization: "Japanese folk / shrine play",
    year: "centuries old",
    category: "Musical Play",
    participants: "2+ people",
    requirements: ["Small bell or clap substitute", "Listening space"],
    description:
      "A call-and-echo rhythm game inspired by shrine bell and clap etiquette—children copy timing and volume in playful rounds.",
    howToPlay: [
      "Leader rings or claps a short pattern.",
      "Others echo after a pause.",
      "Mistimed echoes are out for the round.",
      "Last accurate echoer becomes leader.",
      "Keep volumes respectful if near a real shrine.",
    ],
  },
  {
    name: "River reed flute duet",
    country: "Peru",
    civilization: "Andean",
    year: "centuries old",
    category: "Musical Play",
    participants: "2 people",
    requirements: ["Two simple reed or toy flutes", "Quiet outdoor space"],
    description:
      "Paired breath-and-phrase play on simple flutes, echoing Andean musical socialization where toy instruments lead into communal music.",
    howToPlay: [
      "Agree a short call phrase.",
      "Player A plays; Player B answers with a variation.",
      "Keep phrases short enough to remember.",
      "Optional: match each other’s ending note.",
      "No hard score—listen for blend.",
    ],
  },
  {
    name: "Obsidian mirror peek toy",
    country: "Mexico",
    civilization: "Mesoamerican craft memory",
    year: "inspired by ancient mirror crafts",
    category: "Puzzles & Skill",
    participants: "Alone",
    requirements: ["Dark polished stone or acrylic ‘mirror’ disc", "Safe handling"],
    description:
      "A contemplation and angle-skill toy recalling Mesoamerican mirror crafts: catch light, frame a view, invent peek-a-boot games without claiming sacred status.",
    howToPlay: [
      "Hold the disc to catch a patch of sky or lamp light.",
      "Challenge: keep a reflected spot on a wall mark.",
      "Invent peek games that never aim at eyes with bright sun.",
      "Store padded to avoid scratches.",
      "Treat as a craft toy, not a ritual object.",
    ],
  },
];

function prefsToUserPrefs(p: DiscoverPreferences): UserPrefs {
  return {
    players: p.players,
    setting: p.setting,
    vibe: p.vibe,
    region: p.region.trim() || "any",
  };
}

function keywordBoost(game: Game, keywords: string): number {
  if (!keywords.trim()) return 0;
  const blob = `${game.name} ${game.description} ${game.category} ${game.originCountry} ${game.tags.join(" ")}`.toLowerCase();
  const tokens = keywords.toLowerCase().split(/[\s,]+/).filter((t) => t.length > 2);
  return tokens.reduce((a, t) => a + (blob.includes(t) ? 1.2 : 0), 0);
}

function eraMatch(game: Game, era: DiscoverPreferences["era"]): number {
  if (era === "any") return 0;
  const y = game.creationYear.toLowerCase();
  if (era === "ancient") {
    return /bce|bc\b|prehistoric|antiquity|dynastic egypt|c\.\s*\d{3,4}\s*bce/.test(y) ||
      /c\.\s*[12]\d{3}\s*bce/.test(y) ||
      /\bce\b/.test(y) && /c\.\s*\d{1,3}\b/.test(y)
      ? 1.5
      : /centuries old|ancient/.test(y)
        ? 0.8
        : -0.5;
  }
  if (era === "modern") {
    return /19\d{2}|20\d{2}|modern|ce\b/.test(y) ? 1.2 : -0.3;
  }
  // traditional
  return /centuries old|traditional|medieval|edo|mughal|folk/.test(y) ? 1.2 : 0;
}

function reasonFor(_game: Game, prefs: DiscoverPreferences, score: number): string {
  const bits: string[] = [];
  if (prefs.vibe !== "any") bits.push(`${prefs.vibe} feel`);
  if (prefs.setting !== "either") bits.push(prefs.setting);
  if (prefs.players !== "any") bits.push(`fits ${prefs.players} play`);
  if (prefs.region.trim() && prefs.region !== "any")
    bits.push(`region lean: ${prefs.region}`);
  if (prefs.keywords.trim()) bits.push(`keywords: ${prefs.keywords}`);
  bits.push(`match score ${score.toFixed(1)}`);
  return bits.join(" · ");
}

function draftDiscovery(
  seed: DraftSeed,
  prefs: DiscoverPreferences,
  index: number,
  existingNames: Set<string>,
): Game | null {
  const region = prefs.region.trim();
  const country =
    region && region.toLowerCase() !== "any" && region.toLowerCase() !== "worldwide"
      ? region
      : seed.country;
  const name =
    region && region.toLowerCase() !== "any"
      ? `${seed.name} (${country})`
      : seed.name;
  if (existingNames.has(name.toLowerCase())) return null;

  const salt = hash(name + String(index) + prefs.vibe);
  const idNum = 9000 + (salt % 9000);
  const participants =
    prefs.players === "alone"
      ? "Alone"
      : prefs.players === "two"
        ? "2 people"
        : prefs.players === "small"
          ? "2–4 people"
          : prefs.players === "group"
            ? "2 teams / group"
            : seed.participants;

  const year =
    prefs.era === "ancient"
      ? "c. 500 BCE – early centuries CE (reconstructed folk form)"
      : prefs.era === "modern"
        ? "20th–21st century revival / teaching form"
        : seed.year;

  const slug = `${slugify(name)}-${String(idNum).padStart(4, "0")}`;
  return {
    id: `game-${String(idNum).padStart(4, "0")}`,
    slug,
    name,
    originCountry: country,
    civilization: seed.civilization,
    creationYear: year,
    category: seed.category,
    images: draftImages(slug, salt),
    description: `${seed.description} Atlas Guide drafted this discovery to match your preference profile (${prefs.vibe}, ${prefs.setting}, ${prefs.players}).`,
    howToPlay: seed.howToPlay,
    purchaseLinks: [...PURCHASE],
    requirements: seed.requirements,
    idealParticipants: participants,
    variations: [],
    tags: ["discovery", "ai-draft", prefs.vibe, prefs.setting],
  };
}

export async function runDiscoverySearch(
  catalog: Game[],
  prefs: DiscoverPreferences,
  onProgress: (p: DiscoverProgress) => void,
  signal?: AbortSignal,
): Promise<DiscoverResult> {
  const throwIfAborted = () => {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  };

  onProgress({
    percent: 4,
    status: "discover.status.readingPrefs",
    detail: summarizePrefs(prefs),
  });
  await sleep(280);
  throwIfAborted();

  onProgress({
    percent: 14,
    status: "discover.status.scanning",
    detail: `${catalog.length.toLocaleString()} entries`,
  });
  await sleep(320);
  throwIfAborted();

  const userPrefs = prefsToUserPrefs(prefs);
  const poolIds = new Set(readPool().map((g) => g.id));
  const catalogHits: DiscoverHit[] = [];

  // Chunked scan for realtime feel
  const chunk = Math.max(80, Math.floor(catalog.length / 8));
  for (let i = 0; i < catalog.length; i += chunk) {
    throwIfAborted();
    const slice = catalog.slice(i, i + chunk);
    for (const game of slice) {
      if (poolIds.has(game.id)) continue;
      let s = scoreGame(game, userPrefs) + keywordBoost(game, prefs.keywords);
      s += eraMatch(game, prefs.era);
      if (s >= 4.5) {
        catalogHits.push({
          game,
          source: "catalog",
          score: s,
          reason: reasonFor(game, prefs, s),
        });
      }
    }
    const pct = 14 + Math.round(((i + chunk) / catalog.length) * 40);
    onProgress({
      percent: Math.min(54, pct),
      status: "discover.status.ranking",
      detail: `Reviewed ${Math.min(catalog.length, i + chunk).toLocaleString()} / ${catalog.length.toLocaleString()}`,
    });
    await sleep(90);
  }

  onProgress({
    percent: 60,
    status: "discover.status.querying",
    detail: "Folk archives, board lineages, outdoor & craft corpora",
  });
  await sleep(450);
  throwIfAborted();

  const discoveries: DiscoverHit[] = [];
  if (prefs.includeNewDiscoveries) {
    onProgress({
      percent: 72,
      status: "discover.status.drafting",
      detail: "Generating candidate toys/games not yet in the pool",
    });
    await sleep(380);
    throwIfAborted();

    const existingNames = new Set([
      ...catalog.map((g) => g.name.toLowerCase()),
      ...readPool().map((g) => g.name.toLowerCase()),
    ]);

    let drafted = 0;
    for (let i = 0; i < DISCOVERY_SEEDS.length; i++) {
      throwIfAborted();
      const seed = DISCOVERY_SEEDS[i];
      // Filter seeds roughly by vibe/setting
      if (!seedFitsPrefs(seed, prefs)) continue;
      const game = draftDiscovery(seed, prefs, i, existingNames);
      if (!game) continue;
      existingNames.add(game.name.toLowerCase());
      const s =
        scoreGame(game, userPrefs) +
        keywordBoost(game, prefs.keywords) +
        2.5; // discovery bias when requested
      discoveries.push({
        game,
        source: "discovery",
        score: s,
        // Prefix localized in PreferencesPage via prefs.badgeDiscovery / reason display
        reason: reasonFor(game, prefs, s),
      });
      drafted += 1;
      onProgress({
        percent: 72 + Math.min(18, drafted * 3),
        status: "discover.status.draftingMore",
        detail: `Drafted ${drafted}: ${game.name}`,
      });
      await sleep(120);
    }
  } else {
    onProgress({
      percent: 78,
      status: "discover.status.catalogOnly",
    });
    await sleep(200);
  }

  onProgress({ percent: 94, status: "discover.status.finalizing" });
  await sleep(220);
  throwIfAborted();

  const hits = [...catalogHits, ...discoveries]
    .sort((a, b) => b.score - a.score)
    .slice(0, 24);

  onProgress({
    percent: 100,
    status: "discover.status.complete",
    detail: `${hits.length} candidates ready to add to the collection pool`,
  });

  return {
    hits,
    scannedCatalog: catalog.length,
    draftedDiscoveries: discoveries.length,
  };
}

function summarizePrefs(p: DiscoverPreferences) {
  return [
    p.players,
    p.setting,
    p.vibe,
    p.region || "any region",
    p.era,
    p.keywords ? `“${p.keywords}”` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function seedFitsPrefs(seed: DraftSeed, prefs: DiscoverPreferences): boolean {
  if (prefs.setting === "outdoor" && !/Outdoor|Ball|Sport/.test(seed.category)) {
    // allow some crossover
    if (!/Folk|Musical|Ritual/.test(seed.category)) return false;
  }
  if (prefs.setting === "indoor" && /Outdoor Folk|Ball & Sport/.test(seed.category)) {
    return false;
  }
  if (prefs.vibe === "strategy" && !/Strategy|Board|Mancala|Puzzle/.test(seed.category))
    return false;
  if (prefs.vibe === "sport" && !/Outdoor|Ball|Sport/.test(seed.category)) return false;
  if (prefs.vibe === "craft" && !/Doll|Construction|Ritual|Musical/.test(seed.category))
    return false;
  if (prefs.vibe === "puzzle" && !/Puzzle|Memory|String|Skill/.test(seed.category))
    return false;
  if (prefs.vibe === "ritual" && !/Ritual|Memory|Musical/.test(seed.category)) return false;
  if (prefs.vibe === "kids" && !/Outdoor|Doll|Musical|Puzzle|Memory|Folk/.test(seed.category))
    return false;
  if (prefs.keywords.trim()) {
    const blob = `${seed.name} ${seed.description} ${seed.category}`.toLowerCase();
    const toks = prefs.keywords.toLowerCase().split(/[\s,]+/).filter((t) => t.length > 2);
    // Soft filter: keep seed if any keyword hits; otherwise still allow
    if (toks.length && toks.some((t) => blob.includes(t))) return true;
  }
  return true;
}

export const DEFAULT_DISCOVER_PREFS: DiscoverPreferences = {
  players: "any",
  setting: "either",
  vibe: "any",
  region: "",
  keywords: "",
  era: "any",
  includeNewDiscoveries: true,
};

const PREFS_KEY = "ludus-atlas-discover-prefs-v1";

export function loadSavedDiscoverPrefs(): DiscoverPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_DISCOVER_PREFS };
    return { ...DEFAULT_DISCOVER_PREFS, ...(JSON.parse(raw) as DiscoverPreferences) };
  } catch {
    return { ...DEFAULT_DISCOVER_PREFS };
  }
}

export function saveDiscoverPrefs(prefs: DiscoverPreferences) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}
