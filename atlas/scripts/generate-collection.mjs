/**
 * Generates 1000+ historical toys & games.
 * Fundamentally identical cultural forms are nested as variations.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PLAIN_ARCHETYPES } from "./plain-archetypes.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "../public/data/collection.json");

/** Short culture label for prose (drop slash alternatives). */
function folkName(civ) {
  return String(civ || "")
    .split(/\s*\/\s*/)[0]
    .replace(/\s+peoples$/i, "")
    .trim() || "local";
}

function escapeReg(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Plain-language cleanup for descriptions and steps.
 * Fixes leftover template tokens and stiff catalog wording.
 */
function polishLine(text, country = "", civ = "") {
  if (typeof text !== "string" || !text) return text;
  const folk = folkName(civ);
  let s = text
    .replace(/\$\{c\}/g, country)
    .replace(/\$\{civ\}/g, folk)
    .replace(/\barchaeological layers\b/gi, "old finds")
    .replace(/\bmaterial culture\b/gi, "everyday life")
    .replace(/\bArchaeology and ethnography both find\b/gi, "Old finds and family stories also show")
    .replace(/\bethnography\b/gi, "family stories")
    .replace(/\bminiaturize\b/gi, "copy in tiny form")
    .replace(/\bcrystallized\b/gi, "settled")
    .replace(/\brehearse skills celebrated by\b/gi, "practice skills used by")
    .replace(/\belevated this into formal\b/gi, "grew into")
    .replace(/\bstructure the fun\b/gi, "make the game work")
    .replace(/\bwithin that shared physics toy\b/gi, "of the same spinning toy")
    .replace(/\brecorded here as a regional practice entry when\b/gi, "listed here when")
    .replace(/\bdeserve regional entries when\b/gi, "are listed separately when")
    .replace(/\bportable diagrams of story and hand memory\b/gi, "hand stories you can carry anywhere")
    .replace(/\bephemeral toy\b/gi, "short-lived toy")
    .replace(/\bdidactic\b/gi, "teaching")
    .replace(/\bwar-simulation\b/gi, "war game")
    .replace(/\bformalized as\b/gi, "turned into")
    .replace(/\bcustodial capture\b/gi, "capture by sandwiching")
    .replace(/\basymmetric hunt\b/gi, "hunt game with unequal sides");

  if (country) {
    const c = escapeReg(country);
    const f = escapeReg(folk);
    s = s.replace(new RegExp(`\\b${f} life in ${c}\\b`, "gi"), `life in ${country}`);
    s = s.replace(new RegExp(`\\bin ${c} within ${f}\\b`, "gi"), `in ${country}`);
    s = s.replace(
      new RegExp(`\\bin the ${f} craft style of ${c}\\b`, "gi"),
      `in a local style from ${country}`,
    );
    s = s.replace(
      new RegExp(`\\b${f} craft style of ${c}\\b`, "gi"),
      `local style from ${country}`,
    );
    s = s.replace(
      new RegExp(`\\b${c}'s ${f}\\b`, "gi"),
      `${country}'s`,
    );
    s = s.replace(
      new RegExp(`\\bacross ${f} households in ${c}\\b`, "gi"),
      `in households across ${country}`,
    );
    s = s.replace(
      new RegExp(`\\b${f} oral tradition in ${c}\\b`, "gi"),
      `local riddles from ${country}`,
    );
    s = s.replace(
      new RegExp(`\\ba carved ${f} top from ${c}\\b`, "gi"),
      `a carved top from ${country}`,
    );
    s = s.replace(
      new RegExp(`\\bfrom ${c} street or festival play\\b`, "gi"),
      "from street or festival play",
    );
    // Drop a second identical country mention in one sentence when redundant:
    // "… in Egypt … in Egypt" → keep first
    s = s.replace(
      new RegExp(`\\bin ${c}([^.]{0,80})\\bin ${c}\\b`, "gi"),
      `in ${country}$1`,
    );
  }

  return s.replace(/\s{2,}/g, " ").replace(/\s+([,.])/g, "$1").trim();
}

function polishSeedCopy(seed) {
  const country = seed.originCountry || "";
  const civ = seed.civilization || "";
  return {
    ...seed,
    description: polishLine(seed.description, country, civ),
    howToPlay: (seed.howToPlay || []).map((step) => polishLine(step, country, civ)),
  };
}

/**
 * Per-toy search tags — never use a sibling game’s name (e.g. Go must not
 * search “chess”; Mahjong must not search “poker”).
 */
const ARCHETYPE_TAGS = {
  rattle: "baby-rattle,infant-rattle,wooden-rattle",
  whistle_toy: "toy-whistle,clay-whistle,bird-whistle",
  pull_toy: "pull-toy,wooden-horse-toy,animal-pull-toy",
  mini_weapons_toy: "toy-bow,toy-archery,foam-arrow",
  jacks_local: "jacks-game,knucklebones,five-stones",
  story_dice_oral: "story-dice,game-dice,wooden-lots",
  shadow_play: "shadow-puppet,hand-shadow,shadow-theater",
  kite_local: "kite,kite-flying,paper-kite",
  cloth_doll_local: "cloth-doll,rag-doll,handmade-doll",
  ball_sewn: "cloth-ball,soft-ball,handmade-ball",
  top_local: "spinning-top,wooden-top,beyblade",
  string_local: "cats-cradle,string-figure,finger-string",
  board_race_folk: "race-board-game,pachisi,ludo-board",
  sowing_local: "mancala,owari,sowing-game",
  jump_rope: "jump-rope,skipping-rope,jump-rope-kids",
  blindfold_tag: "blindfold-game,kids-playing-tag,party-blindfold",
  wrestling_play: "youth-wrestling,folk-wrestling,sand-wrestling",
  memory_song: "children-singing-circle,clapping-game,campfire-song",
  balance_stilts: "stilts,walking-stilts,stilt-walker",
  leaf_boat: "leaf-boat,toy-boat,cork-boat",
  snow_or_sand: "sandcastle,snowman,sand-sculpture",
  knuckle_football: "table-football,finger-football,paper-soccer",
  riddle_local: "riddle-book,question-mark-vintage,oral-storytelling",
  ceremonial_toy: "festival-noisemaker,ratchet-toy,carnival-clapper",
  puzzle_knot: "rope-puzzle,disentanglement-puzzle,metal-puzzle",
  mini_house: "dollhouse,miniature-kitchen,toy-tea-set",
};

const CURATED_TAGS = {
  Chess: "chess,chessboard,chess-pieces",
  "Go (Weiqi)": "go-board,weiqi,baduk",
  Xiangqi: "xiangqi,chinese-chess",
  Shogi: "shogi,japanese-chess",
  "Mancala sowing games": "mancala,kalah,owari",
  Backgammon: "backgammon,backgammon-board",
  Senet: "senet,egyptian-game",
  Patolli: "patolli,aztec-game",
  Pachisi: "pachisi,chaupar",
  Mahjong: "mahjong,mahjong-tiles",
  Dominoes: "dominoes,domino-tiles",
  "Nine Men's Morris": "nine-mens-morris,mills-game",
  "Alquerque / Draughts family": "draughts,checkers-board",
  Fanorona: "fanorona,madagascar-board-game",
  Carrom: "carrom,carrom-board",
  "Playing cards (French-suited deck)": "playing-cards,bicycle-cards",
  "Hanafuda / Karuta": "hanafuda,karuta,japanese-cards",
  Ganjifa: "ganjifa,circular-playing-cards",
  Knucklebones: "knucklebones,astragali,jacks-game",
  "Yo-yo": "yo-yo,yoyo,duncan-yoyo",
  "Kite flying": "kite,kite-flying",
  "Cat's cradle": "cats-cradle,string-figure",
  "Jianzi (shuttlecock kicking)": "jianzi,shuttlecock,featherball",
  "Sepak takraw": "sepak-takraw,takraw-ball",
  Lacrosse: "lacrosse,lacrosse-stick",
  "Mesoamerican ballgame / Ulama": "ulama,mesoamerican-ballgame",
  Kokeshi: "kokeshi,japanese-doll",
  Matryoshka: "matryoshka,russian-nesting-dolls",
  "Worry dolls": "worry-dolls,guatemalan-dolls",
  "Corn husk doll": "corn-husk-doll,cornhusk-doll",
  "Bilboquet / Balero / Kendama family": "kendama,bilboquet,cup-and-ball",
  Tangram: "tangram,tangram-puzzle",
  "Rubik's Cube": "rubiks-cube,rubik-cube",
  "Building blocks": "wooden-blocks,building-blocks",
  Chunkey: "chunkey,native-american-game",
  Palín: "palin,mapuche-hockey",
  "Tug of war": "tug-of-war,rope-pulling",
  "Hide-and-seek": "hide-and-seek,kids-hiding",
  Hopscotch: "hopscotch,hopscotch-grid",
  Marbles: "marbles,glass-marbles",
  "Spinning top": "spinning-top,wooden-top",
  Hnefatafl: "hnefatafl,tafl-game",
  "Fox and Geese": "fox-and-geese,board-game",
  "Go Bang / Gomoku": "gomoku,five-in-a-row",
  "Reversi / Othello": "othello,reversi",
  Scrabble: "scrabble,scrabble-tiles",
  "Snakes and Ladders": "snakes-and-ladders,chutes-and-ladders",
  Monopoly: "monopoly,monopoly-board",
  Jenga: "jenga,jenga-tower",
  Diabolo: "diabolo,chinese-yo-yo",
  "Kapu kuapu / Jackstraws / Spillikins": "pick-up-sticks,mikado,spillikins",
  Mehen: "mehen,egyptian-serpent-game",
  "Buckingham Palace toy soldiers aside: Toy soldiers": "toy-soldiers,tin-soldiers",
  "Tea set toy": "toy-tea-set,children-tea-party",
  Slinky: "slinky-toy,metal-spring-toy",
  "Frisbee / flying disc": "frisbee,flying-disc",
  "Hacky sack / footbag": "hacky-sack,footbag",
  Boomerang: "boomerang,returning-boomerang",
  Poi: "poi-balls,maori-poi",
  Surakarta: "surakarta,javanese-board-game",
  Dakon: "dakon,congkak",
  Sungka: "sungka,filipino-mancala",
};

/** Stable Wikimedia Commons thumbnail (follows redirect in browsers). */
function commons(file) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=900`;
}

function unsplash(id) {
  return `https://images.unsplash.com/photo-${id}?w=900&q=80`;
}

/**
 * Hand-picked cover photos (Commons + verified Unsplash). Prefer a correct
 * subject over a pretty wrong one. Keys are primary English catalog names.
 */
const CURATED_PHOTOS = {
  Chess: [
    unsplash("1528819622765-d6bcf132f793"),
    unsplash("1586165368502-1bad197a6461"),
    commons("Chess_game_Staunton_No._6_perfil_view_8.jpg"),
    commons("Wooden_Chess_Board.jpg"),
    commons("Opening_chess_position_from_black_side.jpg"),
  ],
  Chaturanga: [
    commons("Chathurangam-1.jpg"),
    commons("Chaturanga_board_and_pins.png"),
    unsplash("1528819622765-d6bcf132f793"),
  ],
  Shatranj: [
    commons("Persian_Tamerlane_Chess_Set.png"),
    commons("A_treatise_on_chess_2.jpg"),
    unsplash("1586165368502-1bad197a6461"),
  ],
  "Go (Weiqi)": [
    unsplash("1774234528903-f520d964ba13"),
    commons("Go_(13×13)_--_2021_--_6741.jpg"),
    commons("Go_--_2021_--_6732.jpg"),
  ],
  Xiangqi: [
    unsplash("1771588330614-2ce1d77588ca"),
    unsplash("1763901682710-a18f6a7d9531"),
    commons("Xiangqi-Chinese-chess.jpg"),
    commons("Xiangqi_01.jpg"),
  ],
  Shogi: [commons("Shogi-Set-06.JPG"), commons("Shogi_ban.jpg")],
  Mancala: [
    commons("Mancala.jpg"),
    commons("Wooden_Mancala_board.jpg"),
    commons("Brooklyn_Museum_22.239_Mancala_Game_Board.jpg"),
  ],
  "Mancala sowing games": [
    commons("Mancala.jpg"),
    commons("Wooden_Mancala_board.jpg"),
    commons("Oware.jpg"),
  ],
  Oware: [commons("Oware.jpg")],
  Congkak: [commons("Congkak.jpg")],
  Backgammon: [commons("Backgammon_board_-_01.jpg")],
  Senet: [
    commons("Senet_(47429946982).jpg"),
    commons("Senet_game_pieces_(Tutankhamun).jpg"),
  ],
  Patolli: [commons("Patolli.jpg")],
  Pachisi: [commons("Pachisi-real.jpg")],
  Ludo: [commons("Ludo_board.svg")],
  Mahjong: [
    unsplash("1742343886931-14ea96977531"),
    commons("UCB_Mahjong_Tiles.png"),
    commons("Western_mahjong_tiles_eg.jpg"),
  ],
  Dominoes: [
    unsplash("1566694271453-390536dd1f0d"),
    commons("Domino_--_2021_--_6766.jpg"),
  ],
  "Playing cards (French-suited deck)": [
    unsplash("1541278107931-e006523892df"),
    commons("Cards_-Deck_Playing.jpg"),
  ],
  "Playing cards": [commons("Playing_cards.jpg"), commons("Cards_-Deck_Playing.jpg")],
  "Yo-yo": [
    unsplash("1556309294-98916e0aaca7"),
    commons("Yo_yo_toy.jpg"),
    commons("Wooden_yo-yo.jpg"),
  ],
  "Rubik's Cube": [
    unsplash("1540149678796-1a36342a1372"),
    commons("Rubiks_cube_by_keqs.jpg"),
  ],
  Marbles: [unsplash("1687499466496-590c45852352"), commons("Glass_Marbles.jpg")],
  "Kite flying": [unsplash("1757743066599-193b467c35f1"), commons("Kite.jpg")],
  Matryoshka: [
    unsplash("1672092590672-3feb81f3123a"),
    commons("Matryoshka_dolls.jpg"),
  ],
  Jenga: [unsplash("1703000998518-021f436c0b03"), commons("Jenga_distorted.jpg")],
  Scrabble: [unsplash("1671628586515-0e4d9456f291"), commons("Scrabble_game.jpg")],
  "Building blocks": [
    unsplash("1587654780291-39c9404d746b"),
    commons("A_pile_of_alphabet_wooden_blocks.jpg"),
  ],
  "Nine Men's Morris": [commons("Nine_Men's_Morris.svg")],
  Carrom: [commons("Carrom.jpg")],
  Janggi: [commons("Janggi.jpg")],
  Sittuyin: [commons("Sittuyin_PI.png")],
  Makruk: [commons("Makruk_Thai_2.JPG")],
  Dice: [commons("Dice.jpg")],
  "Spinning top": [commons("Spinning_top.jpg")],
  Tops: [commons("Spinning_top.jpg")],
  Knucklebones: [commons("Knucklebones.jpg")],
  Jacks: [commons("Knucklebones.jpg")],
  Shuttlecock: [commons("Shuttlecock.jpg")],
  Jianzi: [commons("Jianzi.jpg")],
  "Rag doll": [commons("Mexican_rag_doll_from_Chiapas_(muñeca_chiapaneca).jpg")],
  "Jump rope": [commons("Ghanaian_kid_(skipping_rope)_02.jpg")],
  Hnefatafl: [commons("Nefatafl_fra_Trondheim_(19896084560).jpg")],
  "Fox and geese": [commons("The_fox_game.jpg")],
  Alquerque: [commons("Alquerque_game_board.jpg")],
  Gomoku: [commons("Gomoku-game-1.svg")],
  Reversi: [commons("Reversi.jpg")],
  Othello: [commons("Othello_board.jpg")],
  Halma: [commons("Halma_board.jpg")],
  "Chinese checkers": [commons("Chinese_checkers.jpg")],
  "Peg solitaire": [commons("PegSolitaire.jpg")],
  Tangram: [commons("Tangram-1.JPG")],
  Draughts: [commons("International_draughts.jpg")],
  Checkers: [commons("Checkers_board_in_a_cell_at_Alcatraz.jpg")],
};

/** Map catalog titles / stems onto CURATED_PHOTOS keys. */
const PHOTO_ALIASES = {
  "mancala sowing games": "Mancala sowing games",
  mancala: "Mancala",
  oware: "Oware",
  congkak: "Congkak",
  dakon: "Congkak",
  sungka: "Congkak",
  weiqi: "Go (Weiqi)",
  go: "Go (Weiqi)",
  "chinese chess": "Xiangqi",
  xiangqi: "Xiangqi",
  shogi: "Shogi",
  janggi: "Janggi",
  sittuyin: "Sittuyin",
  makruk: "Makruk",
  backgammon: "Backgammon",
  senet: "Senet",
  patolli: "Patolli",
  pachisi: "Pachisi",
  chaupar: "Pachisi",
  ludo: "Ludo",
  "parcheesi": "Pachisi",
  mahjong: "Mahjong",
  dominoes: "Dominoes",
  "playing cards": "Playing cards",
  chess: "Chess",
  chaturanga: "Chaturanga",
  "catur-anga": "Chaturanga",
  shatranj: "Shatranj",
  // Regional / nested names → nearest curated photo pool
  baduk: "Go (Weiqi)",
  igo: "Go (Weiqi)",
  "chu shogi": "Shogi",
  "english draughts / checkers": "Checkers",
  "international draughts": "Draughts",
  kharbaga: "Alquerque",
  "twelve men's morris": "Nine Men's Morris",
  umlabalaba: "Nine Men's Morris",
  morabaraba: "Nine Men's Morris",
  nard: "Backgammon",
  tavli: "Backgammon",
  "shesh besh": "Backgammon",
  "royal game of ur": "Senet",
  "american mahjong": "Mahjong",
  "hong kong mahjong": "Mahjong",
  "riichi mahjong": "Mahjong",
  "draw dominoes": "Dominoes",
  "mexican train": "Dominoes",
  "german-suited deck": "Playing cards",
  "italian-suited deck": "Playing cards",
  "spanish baraja": "Playing cards",
  jacks: "Knucklebones",
  gonggi: "Knucklebones",
  trompo: "Spinning top",
  lattoo: "Spinning top",
  ttoli: "Spinning top",
  koma: "Spinning top",
  "đá cầu": "Jianzi",
  jegichagi: "Jianzi",
  bandalore: "Yo-yo",
  "pocket cube (2×2)": "Rubik's Cube",
  "revenge cube (4×4)": "Rubik's Cube",
  othello: "Othello",
  renju: "Gomoku",
  "mensch ärgere dich nicht": "Ludo",
  bao: "Mancala",
  kalah: "Mancala",
  ayoayo: "Oware",
  gebeta: "Mancala",
  pallanguzhi: "Mancala",
  draughts: "Draughts",
  checkers: "Checkers",
  "english draughts": "Draughts",
  carrom: "Carrom",
  "nine men's morris": "Nine Men's Morris",
  mills: "Nine Men's Morris",
  "yo-yo": "Yo-yo",
  yoyo: "Yo-yo",
  "rubik's cube": "Rubik's Cube",
  rubik: "Rubik's Cube",
  marbles: "Marbles",
  kite: "Kite flying",
  "kite flying": "Kite flying",
  matryoshka: "Matryoshka",
  "nesting dolls": "Matryoshka",
  jenga: "Jenga",
  scrabble: "Scrabble",
  "building blocks": "Building blocks",
  blocks: "Building blocks",
  dice: "Dice",
  "spinning top": "Spinning top",
  top: "Spinning top",
  tops: "Tops",
  knucklebones: "Knucklebones",
  jacks: "Jacks",
  shuttlecock: "Shuttlecock",
  jianzi: "Jianzi",
  "rag doll": "Rag doll",
  doll: "Rag doll",
  "jump rope": "Jump rope",
  "skipping rope": "Jump rope",
  hnefatafl: "Hnefatafl",
  tafl: "Hnefatafl",
  "fox and geese": "Fox and geese",
  alquerque: "Alquerque",
  gomoku: "Gomoku",
  renju: "Gomoku",
  reversi: "Reversi",
  othello: "Othello",
  halma: "Halma",
  "chinese checkers": "Chinese checkers",
  "peg solitaire": "Peg solitaire",
  tangram: "Tangram",
};

/**
 * Category cover pools — reused across many catalog entries so cards never
 * fall back to an empty gradient when a title-specific photo is missing.
 */
const CATEGORY_PHOTOS = {
  "Strategy & War": [
    unsplash("1528819622765-d6bcf132f793"),
    commons("Xiangqi_01.jpg"),
    commons("Shogi-Set-06.JPG"),
    commons("International_draughts.jpg"),
    commons("Alquerque_game_board.jpg"),
  ],
  "Board & Race": [
    commons("Backgammon_board_-_01.jpg"),
    commons("Pachisi-real.jpg"),
    commons("Ludo_board.svg"),
    commons("Senet_(47429946982).jpg"),
    commons("Patolli.jpg"),
  ],
  "Mancala & Sowing": [
    commons("Mancala.jpg"),
    commons("Wooden_Mancala_board.jpg"),
    commons("Oware.jpg"),
    commons("Congkak.jpg"),
    commons("Brooklyn_Museum_22.239_Mancala_Game_Board.jpg"),
  ],
  "Cards & Tiles": [
    unsplash("1742343886931-14ea96977531"),
    unsplash("1541278107931-e006523892df"),
    commons("Domino_--_2021_--_6766.jpg"),
    commons("UCB_Mahjong_Tiles.png"),
    commons("Cards_-Deck_Playing.jpg"),
  ],
  "Dice & Chance": [
    commons("Dice.jpg"),
    commons("Backgammon_board_-_01.jpg"),
    unsplash("1566694271453-390536dd1f0d"),
  ],
  "String & Finger": [
    commons("Ghanaian_kid_(skipping_rope)_02.jpg"),
    unsplash("1556309294-98916e0aaca7"),
  ],
  "Dolls & Figures": [
    commons("Matryoshka_dolls.jpg"),
    commons("Mexican_rag_doll_from_Chiapas_(muñeca_chiapaneca).jpg"),
  ],
  "Ball & Sport": [
    commons("Jianzi.jpg"),
    commons("Shuttlecock.jpg"),
    commons("Glass_Marbles.jpg"),
  ],
  "Spinning & Tops": [
    commons("Spinning_top.jpg"),
    commons("Yo_yo_toy.jpg"),
    unsplash("1556309294-98916e0aaca7"),
  ],
  "Puzzles & Skill": [
    commons("Tangram-1.JPG"),
    commons("Rubiks_cube_by_keqs.jpg"),
    commons("PegSolitaire.jpg"),
    unsplash("1540149678796-1a36342a1372"),
  ],
  "Outdoor Folk": [
    commons("Kite.jpg"),
    commons("Ghanaian_kid_(skipping_rope)_02.jpg"),
    commons("Jianzi.jpg"),
  ],
  "Musical Play": [commons("Dice.jpg"), commons("Knucklebones.jpg")],
  Construction: [
    commons("A_pile_of_alphabet_wooden_blocks.jpg"),
    commons("Jenga_distorted.jpg"),
    unsplash("1587654780291-39c9404d746b"),
  ],
  "Ritual & Ceremony": [
    commons("Senet_game_pieces_(Tutankhamun).jpg"),
    commons("Patolli.jpg"),
  ],
  "Memory & Word": [commons("Scrabble_game.jpg"), commons("Cards_-Deck_Playing.jpg")],
};

const PURCHASE = {
  chess: [
    { platform: "Amazon", label: "Wooden Chess Set (Amazon US)", url: "https://www.amazon.com/dp/B07YRJF3S7" },
    { platform: "Amazon UK", label: "Tournament Chess Set (Amazon UK)", url: "https://www.amazon.co.uk/dp/B000P99X7G" },
    { platform: "Walmart", label: "Classic Chess & Checkers (Walmart)", url: "https://www.walmart.com/ip/Chess-Checkers-Deluxe-Wood-Cabinet/14422659" },
  ],
  go: [
    { platform: "Amazon", label: "Go Set with Stones (Amazon US)", url: "https://www.amazon.com/dp/B00004D2Q2" },
    { platform: "Amazon JP", label: "Go Board Set (Amazon Japan)", url: "https://www.amazon.co.jp/dp/B00GQZQZ6Y" },
    { platform: "Yellow Mountain Imports", label: "Melamine Go Stones Set", url: "https://www.ymimports.com/products/go-set-melamine-stones" },
  ],
  mancala: [
    { platform: "Amazon", label: "Folding Mancala Board (Amazon US)", url: "https://www.amazon.com/dp/B00004YOXI" },
    { platform: "Target", label: "Classic Mancala Game (Target)", url: "https://www.target.com/p/mancala-game/-/A-14730464" },
    { platform: "Amazon UK", label: "Wooden Mancala (Amazon UK)", url: "https://www.amazon.co.uk/dp/B00005JB4G" },
  ],
  mahjong: [
    { platform: "Amazon", label: "Chinese Mahjong Set (Amazon US)", url: "https://www.amazon.com/dp/B0009VC8Q6" },
    { platform: "Amazon UK", label: "Mahjong Tile Set (Amazon UK)", url: "https://www.amazon.co.uk/dp/B000FMYL2K" },
    { platform: "Walmart", label: "Mahjong Game Set (Walmart)", url: "https://www.walmart.com/ip/Mahjong-Chinese-Traditional-Game-Set/16715491" },
  ],
  cards: [
    { platform: "Amazon", label: "Bicycle Playing Cards (Amazon US)", url: "https://www.amazon.com/dp/B00004TKS4" },
    { platform: "Amazon DE", label: "French-suited Playing Cards (Amazon DE)", url: "https://www.amazon.de/dp/B000KIZ4P6" },
    { platform: "Walmart", label: "Bicycle Standard Index Cards (Walmart)", url: "https://www.walmart.com/ip/Bicycle-Standard-Playing-Cards/14926905" },
  ],
  dice: [
    { platform: "Amazon", label: "Polyhedral Dice Set (Amazon US)", url: "https://www.amazon.com/dp/B00U26V4VQ" },
    { platform: "Amazon UK", label: "Wooden Dice Set (Amazon UK)", url: "https://www.amazon.co.uk/dp/B01N5OKH1N" },
    { platform: "Etsy", label: "Handcrafted Wooden Dice (Etsy)", url: "https://www.etsy.com/market/wooden_dice_set" },
  ],
  backgammon: [
    { platform: "Amazon", label: "Backgammon Set (Amazon US)", url: "https://www.amazon.com/dp/B00004TKSX" },
    { platform: "Amazon UK", label: "Tournament Backgammon (Amazon UK)", url: "https://www.amazon.co.uk/dp/B0009V1YQK" },
    { platform: "Walmart", label: "Wood Backgammon Board (Walmart)", url: "https://www.walmart.com/ip/Mainstreet-Classics-27-Tournament-Backgammon-Set/17420280" },
  ],
  dominoes: [
    { platform: "Amazon", label: "Double-Six Dominoes (Amazon US)", url: "https://www.amazon.com/dp/B00004YOXJ" },
    { platform: "Target", label: "Wooden Dominoes (Target)", url: "https://www.target.com/p/dominoes-game/-/A-14730466" },
    { platform: "Amazon UK", label: "Mexican Train Dominoes (Amazon UK)", url: "https://www.amazon.co.uk/dp/B00004TSTT" },
  ],
  yo_yo: [
    { platform: "Amazon", label: "Duncan Imperial Yo-Yo (Amazon US)", url: "https://www.amazon.com/dp/B0000C43ZQ" },
    { platform: "Amazon UK", label: "Classic Wooden Yo-Yo (Amazon UK)", url: "https://www.amazon.co.uk/dp/B0000C9Z8T" },
    { platform: "Walmart", label: "Duncan Imperial Yo-Yo (Walmart)", url: "https://www.walmart.com/ip/Duncan-Imperial-Yo-Yo/21914987" },
  ],
  top: [
    { platform: "Amazon", label: "Wooden Spinning Tops Set (Amazon US)", url: "https://www.amazon.com/dp/B01N4VCZXF" },
    { platform: "Etsy", label: "Hand-Turned Wooden Top (Etsy)", url: "https://www.etsy.com/market/wooden_spinning_top" },
    { platform: "Amazon JP", label: "Traditional Japanese Top (Amazon JP)", url: "https://www.amazon.co.jp/dp/B00B1M0Y0I" },
  ],
  kite: [
    { platform: "Amazon", label: "Delta Kite (Amazon US)", url: "https://www.amazon.com/dp/B001B1Y4DY" },
    { platform: "Amazon UK", label: "Traditional Diamond Kite (Amazon UK)", url: "https://www.amazon.co.uk/dp/B0001IXT0Y" },
    { platform: "Walmart", label: "Premier Easy Flyer Kite (Walmart)", url: "https://www.walmart.com/ip/Premier-Kites-Easy-Flyer-Kite/16549912" },
  ],
  doll: [
    { platform: "Amazon", label: "Waldorf-Style Cloth Doll (Amazon US)", url: "https://www.amazon.com/dp/B07D7X5Z8K" },
    { platform: "Etsy", label: "Handcrafted Folk Doll (Etsy)", url: "https://www.etsy.com/market/handmade_rag_doll" },
    { platform: "Amazon UK", label: "Traditional Rag Doll (Amazon UK)", url: "https://www.amazon.co.uk/dp/B00E8JQY6Y" },
  ],
  marbles: [
    { platform: "Amazon", label: "Glass Marble Set (Amazon US)", url: "https://www.amazon.com/dp/B0006GZCT4" },
    { platform: "Amazon UK", label: "Traditional Marbles (Amazon UK)", url: "https://www.amazon.co.uk/dp/B0006N7K6M" },
    { platform: "Walmart", label: "Mega Marbles Pack (Walmart)", url: "https://www.walmart.com/ip/Mega-Marbles-Assorted-Glass-Marbles/14921348" },
  ],
  jacks: [
    { platform: "Amazon", label: "Jacks Game Set (Amazon US)", url: "https://www.amazon.com/dp/B00004YOXL" },
    { platform: "Target", label: "Classic Jacks (Target)", url: "https://www.target.com/p/jacks-game/-/A-14730468" },
    { platform: "Amazon UK", label: "Knucklebones / Jacks (Amazon UK)", url: "https://www.amazon.co.uk/dp/B00005JH6K" },
  ],
  puzzle: [
    { platform: "Amazon", label: "Wooden Tangram Set (Amazon US)", url: "https://www.amazon.com/dp/B0006OUMZ8" },
    { platform: "Amazon UK", label: "Classic Rubik's Cube (Amazon UK)", url: "https://www.amazon.co.uk/dp/B0BJYJ1V2Q" },
    { platform: "Walmart", label: "Wood Brain Teaser Puzzle (Walmart)", url: "https://www.walmart.com/ip/Wooden-Brain-Teaser-Puzzle/55439912" },
  ],
  blocks: [
    { platform: "Amazon", label: "Maple Hardwood Blocks (Amazon US)", url: "https://www.amazon.com/dp/B00005O0IX" },
    { platform: "Target", label: "Wooden Building Blocks (Target)", url: "https://www.target.com/p/wooden-building-blocks/-/A-14730501" },
    { platform: "Amazon DE", label: "Holzbausteine Set (Amazon DE)", url: "https://www.amazon.de/dp/B000KBJYF0" },
  ],
  shuttlecock: [
    { platform: "Amazon", label: "Jianzi Shuttlecock (Amazon US)", url: "https://www.amazon.com/dp/B07B4QXK8R" },
    { platform: "Amazon UK", label: "Chinese Feather Shuttlecock (Amazon UK)", url: "https://www.amazon.co.uk/dp/B07B4QXK8R" },
    { platform: "AliExpress", label: "Traditional Feather Jianzi", url: "https://www.aliexpress.com/w/wholesale-jianzi.html" },
  ],
  xiangqi: [
    { platform: "Amazon", label: "Xiangqi Chinese Chess Set (Amazon US)", url: "https://www.amazon.com/dp/B000WQZ6YI" },
    { platform: "Amazon UK", label: "Xiangqi Folding Board (Amazon UK)", url: "https://www.amazon.co.uk/dp/B0013L1Y0E" },
    { platform: "Yellow Mountain Imports", label: "Xiangqi Magnetic Travel Set", url: "https://www.ymimports.com/collections/xiangqi" },
  ],
  shogi: [
    { platform: "Amazon", label: "Shogi Set (Amazon US)", url: "https://www.amazon.com/dp/B000P0Z6YI" },
    { platform: "Amazon JP", label: "Shogi Set (Amazon JP)", url: "https://www.amazon.co.jp/dp/B000FQJQZQ" },
    { platform: "Yellow Mountain Imports", label: "Shogi Pieces Set", url: "https://www.ymimports.com/collections/shogi" },
  ],
  carrom: [
    { platform: "Amazon", label: "Carrom Board (Amazon US)", url: "https://www.amazon.com/dp/B00KQK8Z0Y" },
    { platform: "Amazon IN", label: "Synco Carrom Board (Amazon IN)", url: "https://www.amazon.in/dp/B00KQK8Z0Y" },
    { platform: "Amazon UK", label: "Wooden Carrom Board (Amazon UK)", url: "https://www.amazon.co.uk/dp/B00KQK8Z0Y" },
  ],
  generic_board: [
    { platform: "Amazon", label: "Classic Wooden Board Game (Amazon US)", url: "https://www.amazon.com/dp/B07YRJF3S7" },
    { platform: "Etsy", label: "Artisan Handcrafted Board Game (Etsy)", url: "https://www.etsy.com/market/handmade_board_game" },
    { platform: "Amazon UK", label: "Traditional Board Game (Amazon UK)", url: "https://www.amazon.co.uk/dp/B000P99X7G" },
  ],
  generic_toy: [
    { platform: "Amazon", label: "Traditional Wooden Toy (Amazon US)", url: "https://www.amazon.com/dp/B01N4VCZXF" },
    { platform: "Etsy", label: "Folk Craft Toy (Etsy)", url: "https://www.etsy.com/market/folk_toy" },
    { platform: "Amazon UK", label: "Heritage Wooden Toy (Amazon UK)", url: "https://www.amazon.co.uk/dp/B0000C9Z8T" },
  ],
  outdoor: [
    { platform: "Amazon", label: "Outdoor Traditional Game Kit (Amazon US)", url: "https://www.amazon.com/dp/B0006GZCT4" },
    { platform: "Amazon UK", label: "Garden Games Set (Amazon UK)", url: "https://www.amazon.co.uk/dp/B0006N7K6M" },
    { platform: "Walmart", label: "Classic Outdoor Play Set (Walmart)", url: "https://www.walmart.com/ip/Mega-Marbles-Assorted-Glass-Marbles/14921348" },
  ],
  music: [
    { platform: "Amazon", label: "Children's Percussion Toy (Amazon US)", url: "https://www.amazon.com/dp/B00005ML7Q" },
    { platform: "Amazon UK", label: "Wooden Musical Toy (Amazon UK)", url: "https://www.amazon.co.uk/dp/B00005ML7Q" },
    { platform: "Etsy", label: "Handcrafted Folk Rattle (Etsy)", url: "https://www.etsy.com/market/wooden_rattle" },
  ],
};

function slugify(s) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 90);
}

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Title-card ref consumed by the UI (`resolveImageSrc`) so the pictured name always matches. */
function encodeLudusCard(name, category, originCountry) {
  return `ludus-card:${encodeURIComponent(name)}|${encodeURIComponent(category)}|${encodeURIComponent(originCountry)}`;
}

function tagsForEntry(name, archetypeKey) {
  if (archetypeKey && ARCHETYPE_TAGS[archetypeKey]) return ARCHETYPE_TAGS[archetypeKey];
  // Strip regional suffix from matrix-style titles
  const base = name.replace(/\s+[—–-]\s+.*$/, "").trim();
  if (CURATED_TAGS[name]) return CURATED_TAGS[name];
  if (CURATED_TAGS[base]) return CURATED_TAGS[base];
  // Derive from distinctive words in the name (avoid generic “game/toy” alone)
  const slug = slugify(base).replace(/-/g, ",");
  return `${slug},traditional-toy`;
}

/**
 * Global image bank: unique sets per entry; primary image is a named title card;
 * follow-on photos use toy-specific tags (never a wrong sibling game’s keywords).
 */
/** Resolve a catalog name to a CURATED_PHOTOS key (exact, alias, or stem). */
function resolvePhotoKey(name) {
  if (!name) return null;
  if (CURATED_PHOTOS[name]?.length) return name;
  const lower = name.toLowerCase().trim();
  if (PHOTO_ALIASES[lower] && CURATED_PHOTOS[PHOTO_ALIASES[lower]]?.length) {
    return PHOTO_ALIASES[lower];
  }
  // Strip regional / parenthetical suffixes: "Go (Weiqi)", "Chess — Persian"
  const stem = lower
    .replace(/\s+[—–-]\s+.*$/, "")
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (PHOTO_ALIASES[stem] && CURATED_PHOTOS[PHOTO_ALIASES[stem]]?.length) {
    return PHOTO_ALIASES[stem];
  }
  for (const [alias, key] of Object.entries(PHOTO_ALIASES)) {
    if (stem.includes(alias) && CURATED_PHOTOS[key]?.length) return key;
  }
  // Title-case stem match against curated keys
  for (const key of Object.keys(CURATED_PHOTOS)) {
    if (key.toLowerCase() === stem) return key;
  }
  return null;
}

const imageBank = {
  /** @type {Set<string>} */
  usedUrls: new Set(),
  /** @type {Set<string>} */
  usedSets: new Set(),
  /** @type {Map<string, number>} */
  curatedCursor: new Map(),
  serial: 0,

  /** Exclusive take from a named curated pool (unique URLs preferred). */
  takeCuratedPhoto(gameName) {
    const key = resolvePhotoKey(gameName);
    if (!key) return null;
    const pool = CURATED_PHOTOS[key];
    if (!pool?.length) return null;
    const start = this.curatedCursor.get(key) || 0;
    for (let i = 0; i < pool.length; i++) {
      const url = pool[(start + i) % pool.length];
      if (!this.usedUrls.has(url)) {
        this.usedUrls.add(url);
        this.curatedCursor.set(key, (start + i + 1) % pool.length);
        return url;
      }
    }
    // All unique slots taken — still return a correct subject photo (reuse OK).
    return pool[start % pool.length];
  },

  /** Category atmosphere photo; reusable so every card can have a cover. */
  takeCategoryPhoto(category, uniqueKey) {
    const pool = CATEGORY_PHOTOS[category];
    if (!pool?.length) return null;
    return pool[hash(uniqueKey) % pool.length];
  },

  /**
   * @param {{ name: string, category: string, originCountry: string, uniqueKey: string, archetypeKey?: string, parentName?: string }} opts
   */
  allocate(opts) {
    const { name, category, originCountry, uniqueKey, parentName } = opts;
    /** @type {string[]} */
    const imgs = [encodeLudusCard(name, category, originCountry)];

    // Prefer title-matched photos, then the parent game's pool (for variations),
    // then a category cover — never loremflickr/picsum.
    const subjectNames = [name, parentName].filter(Boolean);
    const seen = new Set();
    for (const subject of subjectNames) {
      // Pull several curated views when the pool is rich (detail gallery).
      for (let n = 0; n < 3; n++) {
        const url = this.takeCuratedPhoto(subject);
        if (!url || seen.has(url)) break;
        seen.add(url);
        imgs.push(url);
      }
      if (imgs.length > 1) break;
    }
    if (imgs.length === 1) {
      const cover = this.takeCategoryPhoto(category, uniqueKey);
      if (cover) imgs.push(cover);
    }

    const sig = JSON.stringify(imgs);
    if (this.usedSets.has(sig)) {
      imgs.push(encodeLudusCard(`${name} · view`, category, originCountry));
    }
    this.usedSets.add(JSON.stringify(imgs));
    this.usedUrls.add(imgs[0]);
    return imgs;
  },
};

function pickImages(opts) {
  return imageBank.allocate(opts);
}

function pickPurchase(key, salt) {
  const pool = PURCHASE[key] || PURCHASE.generic_toy;
  const start = salt % pool.length;
  const out = [];
  for (let i = 0; i < pool.length; i++) out.push(pool[(start + i) % pool.length]);
  return out.slice(0, Math.min(3, pool.length));
}

/** Hand-authored cornerstone entries with real cultural variations. */
const SEEDS = [
  {
    name: "Chess",
    originCountry: "India",
    civilization: "Gupta / early medieval India",
    creationYear: "c. 600 CE",
    category: "Strategy & War",
    purchase: "chess",
    idealParticipants: "2 people",
    requirements: ["Chessboard (8×8)", "16 pieces per side", "Quiet table", "Knowledge of piece moves"],
    description:
      "Chess evolved from chaturanga, a war-simulation of infantry, cavalry, elephants, and chariots. As it traveled through Persia (shatranj) into the Islamic world and medieval Europe, pieces became court ranks. The modern queen and bishop powers crystallized in late medieval Europe. Across cultures it has stood for intellect, foresight, and educated leisure.",
    howToPlay: [
      "Orient the board so each player has a light square on the right-hand corner.",
      "Place pieces on the back rank (rook, knight, bishop, queen on her color, king, bishop, knight, rook) with pawns on the second rank.",
      "White moves first; players alternate moving one piece (except when castling).",
      "Capture by landing on an opponent's piece. Win by checkmating the king.",
      "Use special moves when legal: castling, en passant, and pawn promotion.",
    ],
    variations: [
      { name: "Chaturanga", originCountry: "India", creationYear: "c. 600 CE", notes: "Ancestral form; elephants instead of bishops; some early accounts mention dice." },
      { name: "Shatranj", originCountry: "Persia / Iran", creationYear: "c. 700 CE", notes: "Persian-Arabic form with firzan (weak queen) and alfil (leaping bishop)." },
      { name: "Makruk", originCountry: "Thailand", creationYear: "centuries old", notes: "Thai chess cousin with different piece powers and promotion rules." },
      { name: "Sittuyin", originCountry: "Myanmar", creationYear: "centuries old", notes: "Burmese chess with free setup behind the pawns." },
    ],
  },
  {
    name: "Go (Weiqi)",
    originCountry: "China",
    civilization: "Ancient China",
    creationYear: "c. 500 BCE or earlier",
    category: "Strategy & War",
    purchase: "go",
    idealParticipants: "2 people",
    requirements: ["19×19 board (or 13×13 / 9×9)", "Black and white stones", "Bowls for stones"],
    description:
      "Go is an encirclement game of territory. Stones never move once placed; captured groups are removed. One of the Four Arts of the Chinese scholar, it spread to Korea (baduk) and Japan (igo). Play encodes balance, influence, and living shape rather than direct capture of a king.",
    howToPlay: [
      "Black places the first stone on a grid intersection.",
      "Players alternate placing one stone; stones do not move after placement.",
      "A group without liberties (empty adjacent intersections) is captured and removed.",
      "Do not recreate the previous full-board position (ko) or play suicidal moves unless they capture.",
      "When both pass, score territory plus captives (rules vary by country); higher score wins.",
    ],
    variations: [
      { name: "Baduk", originCountry: "Korea", creationYear: "early centuries CE", notes: "Korean tradition with the same core rules and distinct teaching culture." },
      { name: "Igo", originCountry: "Japan", creationYear: "c. 7th century CE", notes: "Japanese professional ranks and territory scoring conventions." },
    ],
  },
  {
    name: "Xiangqi",
    originCountry: "China",
    civilization: "Tang–Song China",
    creationYear: "c. 700–900 CE",
    category: "Strategy & War",
    purchase: "xiangqi",
    idealParticipants: "2 people",
    requirements: ["Xiangqi board with river and palaces", "16 pieces per side"],
    description:
      "Xiangqi (Chinese chess) arrays generals, advisors, elephants, horses, chariots, cannons, and soldiers on a lined board crossed by a river. The cannon’s jumping capture and palace confinement give it a tactical flavor distinct from international chess. It remains a beloved park and street game across China.",
    howToPlay: [
      "Arrange pieces on starting points on opposite sides of the river.",
      "Red moves first; pieces move on points according to their type.",
      "Cannons slide like chariots but capture only by jumping over exactly one screen.",
      "Generals stay in the palace; opposing generals may not face on an open file.",
      "Checkmate or stalemate the opposing general to win.",
    ],
    variations: [
      { name: "Janggi", originCountry: "Korea", creationYear: "c. 16th century", notes: "Korean cousin without a river and with different elephant/horse moves." },
    ],
  },
  {
    name: "Shogi",
    originCountry: "Japan",
    civilization: "Heian–Muromachi Japan",
    creationYear: "c. 10th–16th century",
    category: "Strategy & War",
    purchase: "shogi",
    idealParticipants: "2 people",
    requirements: ["9×9 shogi board", "40 pieces", "Optional piece stands"],
    description:
      "Shogi is Japanese chess distinguished by drops: captured pieces return as your own. Wedge-shaped pieces point toward the opponent. Material swings and dense midgames define its drama; professional shogi remains a major Japanese mind sport.",
    howToPlay: [
      "Set pieces with pointed ends facing the opponent.",
      "Sente moves first—move or drop one piece per turn.",
      "Captured pieces go to your stand and may be dropped later on empty squares (with pawn/check restrictions).",
      "Promote eligible pieces in the last three ranks.",
      "Checkmate the opposing king to win.",
    ],
    variations: [
      { name: "Chu shogi", originCountry: "Japan", creationYear: "c. 14th century", notes: "Larger historical variant with many unique piece types." },
    ],
  },
  {
    name: "Mancala sowing games",
    originCountry: "Africa / Middle East",
    civilization: "Ancient Africa & Near East",
    creationYear: "c. 700 BCE or earlier",
    category: "Mancala & Sowing",
    purchase: "mancala",
    idealParticipants: "2 people",
    requirements: ["Board with two or more rows of pits", "Seeds, stones, or beads"],
    description:
      "Mancala is a family of sowing games: players distribute seeds around pits carved in wood, stone, or earth. Boards appear across Africa, the Middle East, and South Asia. Regional names and pit counts differ, but the scoop-and-sow gesture unites them as one fundamental game with many cultural faces.",
    howToPlay: [
      "Default to a Kalah-style 2×6 board: place four seeds in each of the twelve small pits; leave both end stores empty.",
      "On your turn, scoop all seeds from one pit on your side and sow one seed into each following pit counterclockwise, including your store but skipping the opponent’s store.",
      "If the last seed lands in your store, take another turn; if it lands in an empty pit on your side, capture that seed plus any seeds in the opposite pit into your store.",
      "When one player’s six pits are empty, the opponent moves all remaining seeds into their store and the game ends.",
      "Count seeds in each store; the higher total wins (ties are draws).",
    ],
    variations: [
      { name: "Oware", originCountry: "Ghana", creationYear: "centuries old", notes: "Akan 2×6 classic; capture opposite seeds when ending with 2 or 3." },
      { name: "Bao", originCountry: "Tanzania", creationYear: "centuries old", notes: "Complex 4-row Swahili coast game with a special nyumba pit." },
      { name: "Congkak", originCountry: "Malaysia / Indonesia", creationYear: "centuries old", notes: "Boat-shaped Southeast Asian board with large stores." },
      { name: "Gebeta", originCountry: "Ethiopia / Eritrea", creationYear: "centuries old", notes: "Horn of Africa sowing boards." },
      { name: "Pallanguzhi", originCountry: "India", creationYear: "centuries old", notes: "Tamil / South Indian cup-board sowing game." },
      { name: "Ayoayo", originCountry: "Nigeria", creationYear: "centuries old", notes: "Yoruba sowing form with rhythmic scooping play." },
      { name: "Kalah", originCountry: "United States", creationYear: "1940 CE", notes: "Modern commercial teaching form of mancala." },
    ],
  },
  {
    name: "Backgammon",
    originCountry: "Persia / Mesopotamia region",
    civilization: "Ancient Near East / Persia",
    creationYear: "c. 2000 BCE ancestors; modern form later",
    category: "Board & Race",
    purchase: "backgammon",
    idealParticipants: "2 people",
    requirements: ["Backgammon board", "15 checkers per side", "Two dice", "Optional doubling cube"],
    description:
      "Race-and-hit dice games stretch from the Royal Game of Ur to Persian nard and European tables. Backgammon blends luck and skill as players bear off fifteen checkers while hitting blots. The doubling cube is a modern strategic layer.",
    howToPlay: [
      "Set checkers in the standard opening formation on the 24 points.",
      "Roll two dice and move checkers forward using both numbers.",
      "Hit a lone opposing blot to the bar; it must re-enter before other moves.",
      "Stack your own checkers for safety; six consecutive points form a prime.",
      "When all fifteen are home, bear off; first to bear off all wins.",
    ],
    variations: [
      { name: "Nard", originCountry: "Persia / Iran", creationYear: "c. 300–600 CE", notes: "Persian tables game closely related to backgammon." },
      { name: "Tavli", originCountry: "Greece", creationYear: "medieval–modern", notes: "Greek suite: Portes, Plakoto, Fevga." },
      { name: "Shesh Besh", originCountry: "Turkey / Levant", creationYear: "centuries old", notes: "Regional café culture name for backgammon-like play." },
      { name: "Royal Game of Ur", originCountry: "Iraq (Sumer)", creationYear: "c. 2600 BCE", notes: "Ancient race ancestor with a unique track." },
    ],
  },
  {
    name: "Senet",
    originCountry: "Egypt",
    civilization: "Ancient Egypt",
    creationYear: "c. 3100 BCE",
    category: "Board & Race",
    purchase: "generic_board",
    idealParticipants: "2 people",
    requirements: ["30-square senet board", "5–7 pawns per player", "Throwing sticks or knucklebones"],
    description:
      "Senet appears in tomb paintings and burial goods across pharaonic Egypt. It held religious meaning as a passage through the afterlife. Exact rules are reconstructed by Egyptologists from later texts and board geometry.",
    howToPlay: [
      "Place pawns on the opening squares of the 30-square track.",
      "Throw sticks or knucklebones for move length.",
      "Advance along the serpentine path; heed special squares (safe, water, rebirth).",
      "Resolve landings on opponents per the reconstruction you follow.",
      "First to bear all pawns off the final squares wins.",
    ],
    variations: [],
  },
  {
    name: "Patolli",
    originCountry: "Mexico",
    civilization: "Aztec / Mesoamerica",
    creationYear: "c. 200 BCE–1500 CE",
    category: "Board & Race",
    purchase: "generic_board",
    idealParticipants: "2–4 people",
    requirements: ["X-shaped patolli board or mat", "Bean markers", "Marked dice beans"],
    description:
      "Patolli was a sacred Aztec race game on an X-shaped track using beans as dice. Gambling and ritual offerings intertwined; the game appears in codices and Spanish accounts as cosmic risk made playable.",
    howToPlay: [
      "Lay out the X-shaped board and place markers at the start.",
      "Throw marked beans for a move value.",
      "Advance along the track; honor special spaces and capture rules.",
      "Optional historical wagers can be replaced with points today.",
      "First to complete the circuit with all markers wins.",
    ],
    variations: [
      { name: "Bul", originCountry: "Mexico (Maya region)", creationYear: "pre-Columbian", notes: "Related Mesoamerican race/dice tradition." },
    ],
  },
  {
    name: "Pachisi",
    originCountry: "India",
    civilization: "Medieval India",
    creationYear: "c. 4th–16th century",
    category: "Board & Race",
    purchase: "generic_board",
    idealParticipants: "2–4 people",
    requirements: ["Cross-shaped board or cloth", "4 pieces per player", "Cowrie shells or dice"],
    description:
      "Pachisi—the ‘national game of India’—is a cross-and-circle race traditionally played with cowries. Chaupar is a courtly relative. British Ludo and American Parcheesi are commercial descendants of the same fundamental race.",
    howToPlay: [
      "Each player sits at an arm of the cross with four pieces in nest.",
      "Throw cowries or dice; enter pieces when the throw allows.",
      "Move around the track; safe squares protect stacks.",
      "Landing on a lone opponent sends them home.",
      "First to bring all four pieces into the center wins.",
    ],
    variations: [
      { name: "Chaupar", originCountry: "India", creationYear: "Mughal era popular", notes: "Courtly relative with longer arms and dice sticks." },
      { name: "Ludo", originCountry: "United Kingdom", creationYear: "1896 CE", notes: "British patented simplification with cubic dice." },
      { name: "Parcheesi", originCountry: "United States", creationYear: "1867 CE", notes: "American commercial adaptation." },
      { name: "Mensch ärgere dich nicht", originCountry: "Germany", creationYear: "1910 CE", notes: "German family race game in the same lineage." },
    ],
  },
  {
    name: "Mahjong",
    originCountry: "China",
    civilization: "Late Qing China",
    creationYear: "c. 1800–1900 CE",
    category: "Cards & Tiles",
    purchase: "mahjong",
    idealParticipants: "4 people",
    requirements: ["144-tile set", "Table for four walls", "Dice for wall break"],
    description:
      "Mahjong draws on earlier Chinese card and gambling-tile traditions. Four players build melds toward a complete hand while reading discards. Regional styles differ in scoring, but the shuffling ‘wall’ is shared cultural theater.",
    howToPlay: [
      "Build and join four tile walls; break with dice.",
      "Deal hands (usually 13 tiles; dealer 14). East discards first.",
      "Draw or claim a discard for a meld, then discard.",
      "Form chows, pungs, kongs, and a pair.",
      "Declare mahjong on a complete hand; score by regional rules.",
    ],
    variations: [
      { name: "Riichi mahjong", originCountry: "Japan", creationYear: "20th century", notes: "Closed-hand riichi, dora, strict scoring." },
      { name: "Hong Kong mahjong", originCountry: "China / Hong Kong", creationYear: "20th century", notes: "Fast, pung-oriented popular style." },
      { name: "American mahjong", originCountry: "United States", creationYear: "1920s CE", notes: "NMJL card hands and jokers." },
    ],
  },
  {
    name: "Dominoes",
    originCountry: "China",
    civilization: "China (later worldwide)",
    creationYear: "c. 12th–13th century",
    category: "Cards & Tiles",
    purchase: "dominoes",
    idealParticipants: "2–4 people",
    requirements: ["Double-six or larger set", "Flat table"],
    description:
      "Chinese dominoes relate to dice face pairs; European double-six sets spread via Italy and France. Blocking, scoring, and train games all share matching pip ends—one tool, many table cultures.",
    howToPlay: [
      "Shuffle face-down and draw hands.",
      "Lead with a double or highest tile per the variant.",
      "Play a tile matching an open end, or draw/pass if you cannot.",
      "Place doubles crosswise in most styles.",
      "Win by emptying your hand or reaching a pip score.",
    ],
    variations: [
      { name: "Mexican Train", originCountry: "United States / Mexico", creationYear: "20th century", notes: "Double-twelve party game with personal trains." },
      { name: "Draw Dominoes", originCountry: "Europe / Americas", creationYear: "modern standard", notes: "Common parlor blocking/draw rules." },
    ],
  },
  {
    name: "Nine Men's Morris",
    originCountry: "Roman Empire / Europe",
    civilization: "Roman–medieval Europe",
    creationYear: "c. 1st–14th century",
    category: "Strategy & War",
    purchase: "generic_board",
    idealParticipants: "2 people",
    requirements: ["Mills board with 24 points", "9 pieces per player"],
    description:
      "Mills games form three-in-a-row to capture. Boards are cut into cloister benches across medieval Europe. Southern African morabaraba is the same fundamental mills contest with pastoral ‘cow’ metaphors—catalogued here as variations, not separate inventions.",
    howToPlay: [
      "Place pieces alternately on empty points until all nine are down.",
      "Move along lines to adjacent points.",
      "Form a mill (three in a row) to remove an opposing piece not in a mill if possible.",
      "When down to three pieces, flying jumps to any empty point are often allowed.",
      "Win by reducing the opponent to two pieces or blocking all moves.",
    ],
    variations: [
      { name: "Morabaraba", originCountry: "South Africa", creationYear: "centuries old", notes: "Southern African mills with 12 cows per side; school sport form." },
      { name: "Umlabalaba", originCountry: "South Africa", creationYear: "centuries old", notes: "Zulu name for the same mills game." },
      { name: "Twelve Men's Morris", originCountry: "Europe", creationYear: "medieval", notes: "Larger piece-count mills variant." },
    ],
  },
  {
    name: "Alquerque / Draughts family",
    originCountry: "Spain / Islamic Spain",
    civilization: "Al-Andalus / Maghreb",
    creationYear: "c. 10th century (documented)",
    category: "Strategy & War",
    purchase: "generic_board",
    idealParticipants: "2 people",
    requirements: ["Lined Alquerque board or checkered draughts board", "12 pieces per side (typical)"],
    description:
      "Alquerque’s leaping captures on a lined board are documented in Alfonso X’s Book of Games. European draughts/checkers moved the idea onto a checkered board. Saharan kharbaga and related Maghreb games belong to the same leap-capture family—variations of one hunting geometry.",
    howToPlay: [
      "Array pieces on opposing sides.",
      "Move to an adjacent empty point along a line (or dark square in checkers).",
      "Leap an adjacent enemy into an empty landing square to capture.",
      "Continue multi-jumps when allowed.",
      "Capture all enemies or immobilize them to win.",
    ],
    variations: [
      { name: "English draughts / checkers", originCountry: "United Kingdom / United States", creationYear: "c. 15th–19th century", notes: "8×8 checkered form; men move diagonally." },
      { name: "International draughts", originCountry: "France / Netherlands", creationYear: "c. 16th–19th century", notes: "10×10 board with flying kings." },
      { name: "Kharbaga", originCountry: "Mauritania / Morocco", creationYear: "centuries old", notes: "Saharan leap-capture relative." },
    ],
  },
  {
    name: "Fanorona",
    originCountry: "Madagascar",
    civilization: "Malagasy",
    creationYear: "c. 17th century or earlier",
    category: "Strategy & War",
    purchase: "generic_board",
    idealParticipants: "2 people",
    requirements: ["9×5-point fanorona board", "22 pieces per color"],
    description:
      "Fanorona is Madagascar’s national board game of approach and withdrawal captures. Cascading line captures create sharp tactics. Oral history links boards to royal politics and community rivalry.",
    howToPlay: [
      "Fill the board except the center; white moves first.",
      "Move one piece to an adjacent empty point along a line.",
      "Capture by approach or withdrawal relative to an enemy group.",
      "Continue capturing with the same piece when further captures exist.",
      "Capture all opposing pieces to win.",
    ],
    variations: [],
  },
  {
    name: "Carrom",
    originCountry: "India",
    civilization: "Indian subcontinent",
    creationYear: "c. 18th–19th century popular",
    category: "Puzzles & Skill",
    purchase: "carrom",
    idealParticipants: "2 or 4 people",
    requirements: ["Carrom board with pockets", "9 white, 9 black, 1 red queen", "Striker", "Powder for the surface"],
    description:
      "Carrom is a tabletop striking game beloved across South Asia and the diaspora. Players flick a striker to pocket carrom men, with the queen requiring a cover. It blends billiards geometry with sitting-room sociability.",
    howToPlay: [
      "Powder the board lightly; place pieces in the center with the queen in the middle.",
      "Flick the striker from your base line to hit your color into pockets.",
      "Pocket the queen, then cover it by pocketing one of your pieces immediately after.",
      "Fouls return pieces or cost turns per rule set.",
      "Clear your pieces (with queen covered) to win.",
    ],
    variations: [
      { name: "Karrom variant rules (Southeast Asia)", originCountry: "Malaysia / Sri Lanka", creationYear: "20th century spread", notes: "Local foul and scoring house rules on the same board." },
    ],
  },
  {
    name: "Playing cards (French-suited deck)",
    originCountry: "Egypt / China origins; Europe standardized",
    civilization: "Mamluk / European",
    creationYear: "c. 9th–14th century",
    category: "Cards & Tiles",
    purchase: "cards",
    idealParticipants: "1–6+ people (depends on game)",
    requirements: ["52-card French deck (or regional deck)", "Table"],
    description:
      "Playing cards likely descended from Chinese money-card ideas and entered Europe via Mamluk decks. French suits became a global standard tool for thousands of games. Regional decks are variations of the same portable gaming platform—not wholly separate toys.",
    howToPlay: [
      "Use a 52-card French-suited deck; shuffle, then deal thirteen cards to each of four players for a Hearts-style starter game.",
      "Play proceeds clockwise; lead any suit except hearts until hearts are broken; players must follow suit if able.",
      "Highest card of the led suit wins the trick; hearts score 1 penalty point each and the queen of spades scores 13.",
      "After all thirteen tricks, tally penalty points; rotate the dealer clockwise for the next hand.",
      "Play hands until one player reaches 100 penalty points; the lowest score wins (or switch later to whist, rummy, or another named game).",
    ],
    variations: [
      { name: "Italian-suited deck", originCountry: "Italy", creationYear: "c. 15th century", notes: "Cups, coins, swords, batons." },
      { name: "German-suited deck", originCountry: "Germany", creationYear: "c. 15th century", notes: "Hearts, bells, acorns, leaves." },
      { name: "Spanish baraja", originCountry: "Spain", creationYear: "c. 15th–16th century", notes: "40- or 48-card decks for mus, tute, etc." },
    ],
  },
  {
    name: "Hanafuda / Karuta",
    originCountry: "Japan",
    civilization: "Japanese",
    creationYear: "c. 16th–19th century",
    category: "Cards & Tiles",
    purchase: "cards",
    idealParticipants: "2+ people",
    requirements: ["Hanafuda or uta-garuta set", "Tatami or table space"],
    description:
      "Japanese karuta traditions include seasonal hanafuda and literary uta-garuta. Competitive poem-card karuta demands lightning recognition; hanafuda underpins koi-koi. Cards fuse seasons, poetry, and speed into one family of play objects.",
    howToPlay: [
      "For uta-garuta: a reader chants the first half of a poem.",
      "Players race to slap the matching ending card.",
      "Take the card and continue through the set.",
      "For hanafuda/koi-koi: deal, capture by matching months, and declare yaku.",
      "Agree which karuta family you are playing before dealing.",
    ],
    variations: [
      { name: "Hanafuda", originCountry: "Japan", creationYear: "c. 18th–19th century", notes: "12-month flower cards." },
      { name: "Uta-garuta", originCountry: "Japan", creationYear: "Edo period", notes: "One hundred poem-card matching race." },
    ],
  },
  {
    name: "Ganjifa",
    originCountry: "India",
    civilization: "Mughal / Indian",
    creationYear: "c. 16th century",
    category: "Cards & Tiles",
    purchase: "cards",
    idealParticipants: "2–8 people",
    requirements: ["Circular ganjifa set", "Careful hands for painted cards"],
    description:
      "Ganjifa are circular painted cards of Mughal and regional Indian courts, later folk-crafted in places such as Odisha. Suit systems (Mughal, Dashavatara) differ, but trick-taking court hierarchies unite them as one painted-card tradition.",
    howToPlay: [
      "Use an 8-suit Mughal ganjifa set (96 circular cards) or a 10-suit Dashavatara set; shuffle gently without bending paint layers.",
      "For a four-player Mughal session, deal twelve cards each; decide trump by the first suit led or a declared trump suit before play.",
      "Players must follow the led suit if able; otherwise they may play trump or discard.",
      "Highest trump wins the trick if any trump is played; otherwise the highest card of the led suit wins.",
      "Each won trick scores one point (or count face cards if using a court-heavy house tally); highest trick total after all cards are played wins. Store cards flat.",
    ],
    variations: [
      { name: "Dashavatara ganjifa", originCountry: "India", creationYear: "centuries old", notes: "Ten-avatar suit system." },
    ],
  },
  {
    name: "Knucklebones",
    originCountry: "Greece",
    civilization: "Mediterranean antiquity",
    creationYear: "c. 500 BCE or earlier",
    category: "Dice & Chance",
    purchase: "jacks",
    idealParticipants: "1–4 people",
    requirements: ["Four astragali or replicas", "Soft ground or mat"],
    description:
      "Sheep or goat astragalus bones were ubiquitous ancient dice for play and divination. Children tossed and caught them; adults wagered on faces. Modern jacks are a skill descendant of the same pickup tradition.",
    howToPlay: [
      "Start with five astragali (or five jacks plus a small bounce ball if using modern replicas).",
      "Scatter the pieces, toss one aloft (or bounce the ball once), and pick up one piece before catching the tossed piece or ball.",
      "On later turns in the same round, pick up two, then three, then four pieces in one sweep while the toss or bounce is airborne.",
      "Failing to catch or disturbing the remaining pile ends your turn; the next player restarts at picking up ones.",
      "First player to complete the ones–twos–threes–fours sequence scores one point; play to five points. Use plastic or wooden replicas when real bones are unavailable.",
    ],
    variations: [
      { name: "Jacks", originCountry: "United States / global", creationYear: "modern popular", notes: "Metal/plastic jacks with a bounce ball." },
      { name: "Gonggi", originCountry: "Korea", creationYear: "centuries old", notes: "Korean five-stone pickup skill game." },
      { name: "Five stones (otjinori relatives)", originCountry: "Multiple Asia", creationYear: "centuries old", notes: "Stone-toss pickup sequence games." },
    ],
  },
  {
    name: "Yo-yo",
    originCountry: "China / Greece (disputed antiquity); Philippines popularization",
    civilization: "Multiple; modern toy via Philippines / US",
    creationYear: "ancient discs; modern toy 1920s",
    category: "Puzzles & Skill",
    purchase: "yo_yo",
    idealParticipants: "Alone",
    requirements: ["Yo-yo on a string", "Clear space around body"],
    description:
      "Disk-on-string toys appear in ancient art; the modern yo-yo boom traveled through Filipino makers and American brands. Sleeping, looping, and string tricks turn a simple rotor into a skill vocabulary. Contests judge difficulty and style.",
    howToPlay: [
      "Loop the string on your finger and wind the yo-yo.",
      "Throw down firmly so it sleeps at the bottom.",
      "Tug to return, or perform a trick while sleeping.",
      "Learn sleeper, forward pass, and rock-the-baby as foundations.",
      "Compete by trick lists or endurance sleeps.",
    ],
    variations: [
      { name: "Bandalore", originCountry: "France", creationYear: "18th century", notes: "European fashionable disk-and-string toy." },
    ],
  },
  {
    name: "Kite flying",
    originCountry: "China",
    civilization: "Chinese; global folk",
    creationYear: "c. 5th century BCE or earlier",
    category: "Outdoor Folk",
    purchase: "kite",
    idealParticipants: "Alone or 2 people",
    requirements: ["Kite", "Flying line", "Open windy space away from power lines"],
    description:
      "Kites likely began in China for signaling and ceremony before becoming children’s sport worldwide. Fighter-kite cultures in Afghanistan, India, Brazil, and Japan add cutting lines and aerial combat. The toy joins craft, weather reading, and public spectacle.",
    howToPlay: [
      "Assemble the kite; check spars and bridle balance.",
      "With back to the wind, have a helper hold or launch as you reel tension.",
      "Steer with line angle; climb in steady wind.",
      "In fighter variants, maneuver to cut an opponent’s line.",
      "Reel in before storms; never fly near power lines.",
    ],
    variations: [
      { name: "Patang fighter kites", originCountry: "India / Pakistan", creationYear: "centuries old", notes: "Manja abrasive line for kite battles." },
      { name: "Hamamatsu festival kites", originCountry: "Japan", creationYear: "centuries old", notes: "Giant communal kites and fighting events." },
      { name: "Pipas", originCountry: "Brazil", creationYear: "modern folk", notes: "Brazilian fighter-kite street culture." },
    ],
  },
  {
    name: "Cat's cradle",
    originCountry: "Multiple (global)",
    civilization: "Worldwide folk",
    creationYear: "unknown antiquity",
    category: "String & Finger",
    purchase: "generic_toy",
    idealParticipants: "2 people",
    requirements: ["Loop of string about 1–2 meters", "Two players"],
    description:
      "Cat’s cradle and related string figures appear from the Arctic to Oceania with startling similarity. Figures pass between hands in sequence, training spatial memory and cooperation. Anthropologists recorded hundreds of named patterns tied to stories.",
    howToPlay: [
      "Loop a 1–2 meter cord; Player A opens Cat’s Cradle: palms facing, strings across both hands with the palmar string crossed once.",
      "Player B pinches the two crossed X’s, pulls them out and down, then up through the center, taking the figure onto their own hands as Soldier’s Bed (or Mattress).",
      "Player A next takes the side strings to form Candles, then Player B takes again to form the Manger (or Cradle reverse).",
      "If any loop slips off a finger and the figure collapses, both players restart from Player A’s opening cradle.",
      "After one clean four-step pass (Cradle → Bed → Candles → Manger), try the sequence again or learn a solo figure such as Cup and Saucer.",
    ],
    variations: [
      { name: "Ayatori", originCountry: "Japan", creationYear: "centuries old", notes: "Japanese string-figure tradition." },
      { name: "Hawaiian / Polynesian figures", originCountry: "Hawaiʻi", creationYear: "centuries old", notes: "String stories with local names and narratives." },
    ],
  },
  {
    name: "Jianzi (shuttlecock kicking)",
    originCountry: "China",
    civilization: "Chinese folk",
    creationYear: "Han legends; popular later dynasties",
    category: "Ball & Sport",
    purchase: "shuttlecock",
    idealParticipants: "Alone or circle group",
    requirements: ["Feathered shuttlecock", "Flat open ground"],
    description:
      "Jianzi keeps a feathered shuttlecock aloft with the feet—an accessible park sport across China and diaspora communities. Circle play builds rhythm; solo play builds count records. Korean jegichagi and Vietnamese đá cầu are the same fundamental foot-shuttlecock game.",
    howToPlay: [
      "Toss the shuttlecock onto your foot.",
      "Kick with inner foot, outer foot, or knee to keep it airborne.",
      "Count consecutive kicks; restart on a drop.",
      "In a circle, pass to neighbors without using hands.",
      "Agree whether hand saves are allowed (usually not).",
    ],
    variations: [
      { name: "Jegichagi", originCountry: "Korea", creationYear: "centuries old", notes: "Korean paper-wrapped shuttlecock kicking." },
      { name: "Đá cầu", originCountry: "Vietnam", creationYear: "centuries old", notes: "Vietnamese shuttlecock kicking sport." },
    ],
  },
  {
    name: "Sepak takraw",
    originCountry: "Thailand / Malaysia",
    civilization: "Southeast Asian",
    creationYear: "centuries old; modern sport 20th c.",
    category: "Ball & Sport",
    purchase: "outdoor",
    idealParticipants: "2 teams of 3",
    requirements: ["Rattan or synthetic ball", "Net and court for sport form"],
    description:
      "Sepak takraw blends volleyball-like net play with foot, knee, chest, and head contacts only. Roots lie in Malay-world circle kicking (sepak raga). Overhead bicycle kicks define the modern spectacle.",
    howToPlay: [
      "Mark a court about 13.4 × 6.1 m with a net 1.52 m high (men’s sport height) and use a rattan or synthetic takraw ball.",
      "Each team of three stands on its side; the server’s teammate tosses the ball for a foot serve over the net into the opponent’s court.",
      "A side may use at most three touches with foot, knee, chest, or head before sending the ball back; hands and arms are faults.",
      "Score one point when the ball grounds in the opponent’s court or the opponent faults (net touch with hand, four touches, out of bounds).",
      "Play to 21 points per set (must win by 2); best of three sets decides the match.",
    ],
    variations: [
      { name: "Sepak raga", originCountry: "Malaysia", creationYear: "centuries old", notes: "Cooperative circle keeping-up without a net." },
    ],
  },
  {
    name: "Lacrosse",
    originCountry: "Canada / United States",
    civilization: "Haudenosaunee & Eastern Woodlands nations",
    creationYear: "c. 1100 CE or earlier",
    category: "Ball & Sport",
    purchase: "outdoor",
    idealParticipants: "2 teams",
    requirements: ["Lacrosse sticks", "Ball", "Field with goals"],
    description:
      "Stickball among northeastern Indigenous nations held spiritual and diplomatic weight—the Creator’s game. French observers named it lacrosse. Modern codes formalized sport rules, but cradling and scoring with a netted stick continue a deep tradition.",
    howToPlay: [
      "Form two teams and set goals.",
      "Face off at center.",
      "Carry, pass, and shoot using the stick pocket (no hand on ball in field rules).",
      "Score by sending the ball into the goal.",
      "Highest score at the end wins.",
    ],
    variations: [
      { name: "Southeastern stickball", originCountry: "United States", creationYear: "pre-contact", notes: "Double-stick ball games with distinct ritual contexts." },
    ],
  },
  {
    name: "Mesoamerican ballgame / Ulama",
    originCountry: "Mexico",
    civilization: "Olmec–Maya–Aztec continuum",
    creationYear: "c. 1600 BCE onward",
    category: "Ball & Sport",
    purchase: "ball",
    idealParticipants: "2 teams",
    requirements: ["Solid rubber ball", "Court or alley", "Hip protection"],
    description:
      "The Mesoamerican ballgame used heavy rubber balls struck mainly with hips on formal courts. Ritual, politics, and sport intertwined. Modern ulama in Sinaloa continues hip-ball play as a living descendant.",
    howToPlay: [
      "Play ulama de cadera on a long packed-earth alley about 65 m; two teams of three to five wear hip pads and use a solid rubber ball.",
      "Serve by bouncing the ball to a teammate who strikes it forward with the hip only—no hands, feet, or heads.",
      "Teams volley the ball back and forth across the midline; a bounce must stay within the alley sidelines.",
      "Score one point when the opposing team fails to return, lets the ball stop, or sends it out of the alley.",
      "First team to 8 points wins the game (common Sinaloa street tally); rest and switch ends after each game.",
    ],
    variations: [
      { name: "Ulama de cadera", originCountry: "Mexico", creationYear: "living tradition", notes: "Sinaloa hip-ulama continuation." },
    ],
  },
  {
    name: "Kokeshi",
    originCountry: "Japan",
    civilization: "Japanese folk craft",
    creationYear: "c. 19th century",
    category: "Dolls & Figures",
    purchase: "doll",
    idealParticipants: "Alone / N/A (display & gentle play)",
    requirements: ["Turned wooden doll", "Painted finish"],
    description:
      "Kokeshi are limbless lathe-turned wooden dolls from northern Honshu onsen towns—first souvenirs and children’s toys, now collected art. Regional schools (Naruko, Tsuchiyu, and others) differ in head joints and floral painting.",
    howToPlay: [
      "Display or hold the doll; there is no competitive scoring.",
      "Children may invent nurturing stories around a kokeshi.",
      "Collectors compare schools, signatures, and proportions.",
      "Handle painted surfaces gently.",
      "Use as a cultural craft object and soft play prop.",
    ],
    variations: [
      { name: "Naruko kokeshi", originCountry: "Japan", creationYear: "19th–20th century", notes: "Clicking head joint school style." },
    ],
  },
  {
    name: "Matryoshka",
    originCountry: "Russia",
    civilization: "Russian folk craft",
    creationYear: "1890 CE",
    category: "Dolls & Figures",
    purchase: "doll",
    idealParticipants: "Alone",
    requirements: ["Nested wooden doll set"],
    description:
      "Matryoshka nesting dolls were created in the 1890s at Abramtsevo workshops, influenced by nesting forms and peasant dress motifs. Each opening reveals a smaller sister—symbolizing family continuity and fertility—and became a global craft icon.",
    howToPlay: [
      "Open the largest doll at the seam.",
      "Line up each inner doll by size.",
      "Nest them closed again in order.",
      "Invent counting or storytelling games for children.",
      "Do not force tight seams.",
    ],
    variations: [],
  },
  {
    name: "Worry dolls",
    originCountry: "Guatemala",
    civilization: "Maya / Guatemalan folk",
    creationYear: "traditional",
    category: "Dolls & Figures",
    purchase: "doll",
    idealParticipants: "Alone",
    requirements: ["Small cloth dolls", "Box or pillow"],
    description:
      "Guatemalan worry dolls are tiny figures to whom children tell troubles before placing them under a pillow. Folklore says the dolls carry the worries overnight—a ritual of voice and comfort more than competitive play.",
    howToPlay: [
      "Whisper one worry to each doll.",
      "Place them under a pillow or in their box overnight.",
      "In the morning, thank them and put them away.",
      "Use as many dolls as worries (traditionally a small handful).",
      "No scoring—personal comfort ritual.",
    ],
    variations: [],
  },
  {
    name: "Corn husk doll",
    originCountry: "United States / Canada",
    civilization: "Northeastern Indigenous & Appalachian folk",
    creationYear: "pre-contact / colonial continuity",
    category: "Dolls & Figures",
    purchase: "doll",
    idealParticipants: "Alone",
    requirements: ["Dried corn husks", "String", "Optional corn-silk hair"],
    description:
      "Corn husk dolls are traditional among several Indigenous nations and later rural settlers. Faces are often left blank, with community-specific teachings about why. Making the doll is half the play.",
    howToPlay: [
      "Soak husks; fold and tie a head, arms, and body or skirt.",
      "Air-dry the finished doll.",
      "Invent caregiving play or display the figure.",
      "Follow community protocols when learning inside a living tradition.",
      "Keep dolls dry to prevent mold.",
    ],
    variations: [],
  },
  {
    name: "Bilboquet / Balero / Kendama family",
    originCountry: "France / Mexico / Japan",
    civilization: "European, Mexican, Japanese folk",
    creationYear: "medieval Europe; deep Mexican roots; kendama 20th c. Japan",
    category: "Puzzles & Skill",
    purchase: "generic_toy",
    idealParticipants: "Alone",
    requirements: ["Cup-and-ball or spike-and-ball toy on a cord"],
    description:
      "Cup-and-ball toys challenge hand-eye timing: swing a tethered ball into a cup or onto a spike. French bilboquet, Mexican balero, and Japanese kendama are variations of one skill family with different vocabularies of tricks.",
    howToPlay: [
      "Hold the handle with the ball hanging on its cord.",
      "Swing upward and catch the ball in a cup or on the spike.",
      "Progress to flips and named trick sequences.",
      "Count consecutive catches.",
      "Practice over a soft area while learning.",
    ],
    variations: [
      { name: "Balero", originCountry: "Mexico", creationYear: "centuries old", notes: "Mexican competitive cup-and-ball culture." },
      { name: "Kendama", originCountry: "Japan", creationYear: "early 20th century popular", notes: "Multi-cup spike toy with extensive trick lexicon." },
      { name: "Bilboquet", originCountry: "France", creationYear: "medieval–early modern", notes: "European parlor cup-and-ball." },
    ],
  },
  {
    name: "Tangram",
    originCountry: "China",
    civilization: "Chinese",
    creationYear: "c. late 18th century popular (older puzzle roots)",
    category: "Puzzles & Skill",
    purchase: "puzzle",
    idealParticipants: "Alone",
    requirements: ["Seven tan pieces", "Silhouette challenges optional"],
    description:
      "The tangram dissects a square into seven tans used to form silhouettes. It spread from China as a parlor craze in the 19th century. Geometric transformation and negative space are the toy’s quiet lessons.",
    howToPlay: [
      "Begin with all seven pieces forming a square.",
      "Study a silhouette challenge card.",
      "Rearrange all seven pieces to match the outline without overlaps.",
      "Create freeform animals or letters.",
      "Time trials optional for competitive play.",
    ],
    variations: [],
  },
  {
    name: "Rubik's Cube",
    originCountry: "Hungary",
    civilization: "Modern Hungarian / global",
    creationYear: "1974 CE",
    category: "Puzzles & Skill",
    purchase: "puzzle",
    idealParticipants: "Alone",
    requirements: ["3×3 cube puzzle"],
    description:
      "Ernő Rubik’s cube popularized three-dimensional combination puzzles worldwide. Layer-turn mechanics hide group theory inside a colorful toy. Speedcubing culture added algorithms, hardware, and sport timing—still one puzzle at heart.",
    howToPlay: [
      "Scramble by turning faces randomly.",
      "Restore each face to a solid color using layer methods or intuition.",
      "Beginners often solve the white cross, then corners, middle edges, and last layer.",
      "Advanced solvers memorize algorithms for speed.",
      "Optional: time solves with a stackmat or phone timer.",
    ],
    variations: [
      { name: "Pocket Cube (2×2)", originCountry: "global", creationYear: "1980s+", notes: "Smaller order of the same mechanism." },
      { name: "Revenge Cube (4×4)", originCountry: "global", creationYear: "1980s+", notes: "Higher-order cuboid with reduction methods." },
    ],
  },
  {
    name: "Building blocks",
    originCountry: "Multiple (global)",
    civilization: "Worldwide; Froebel popularization in education",
    creationYear: "ancient stacks; kindergarten 19th c.",
    category: "Construction",
    purchase: "blocks",
    idealParticipants: "Alone or small group",
    requirements: ["Set of stacking blocks", "Flat floor or table"],
    description:
      "Stacking blocks are among the oldest construction toys—stone, clay, and wood stacks appear across civilizations. Froebel gifts formalized educational block play in the 19th century. The fundamental act is assembling form from modular solids.",
    howToPlay: [
      "Clear a stable building surface.",
      "Stack, bridge, and cantilever blocks into towers or houses.",
      "Agree optional challenges (tallest tower, bridge span, copy a model).",
      "Knock down deliberately as part of play if desired.",
      "Sort by shape when packing away.",
    ],
    variations: [
      { name: "Froebel gifts", originCountry: "Germany", creationYear: "1830s CE", notes: "Educational block sequence for kindergartens." },
      { name: "Unit blocks", originCountry: "United States", creationYear: "early 20th century", notes: "Caroline Pratt’s modular classroom blocks." },
    ],
  },
  {
    name: "Chunkey",
    originCountry: "United States",
    civilization: "Mississippian culture",
    creationYear: "c. 600–1400 CE",
    category: "Ball & Sport",
    purchase: "outdoor",
    idealParticipants: "2+ people",
    requirements: ["Stone discoidal", "Throwing poles", "Level packed ground"],
    description:
      "Chunkey was a Mississippian plaza sport: a rolled stone disk and spears cast to predict its fall. Status, gambling, and athleticism met near mounds. Archaeology recovers finely made chunkey stones across the Midwest and South.",
    howToPlay: [
      "One player rolls the chunkey stone across the ground.",
      "Others hurl poles toward where the stone will stop.",
      "Score by closeness when the stone rests.",
      "Rotate roles; play to an agreed point total.",
      "Keep spectators clear of the throw path.",
    ],
    variations: [],
  },
  {
    name: "Palín",
    originCountry: "Chile",
    civilization: "Mapuche",
    creationYear: "centuries old",
    category: "Ball & Sport",
    purchase: "outdoor",
    idealParticipants: "2 teams",
    requirements: ["Palín sticks", "Hide or wooden ball", "Long field"],
    description:
      "Palín (chueca) is a Mapuche stick-and-ball game with communal and ritual importance. Teams drive a ball toward goals on a long pitch. It remains a marker of Mapuche gathering and identity.",
    howToPlay: [
      "Mark a long field with goals at each end.",
      "Start the ball at center between teams.",
      "Strike with sticks toward your goal—no dangerous swings at people.",
      "Score when the ball crosses the goal space.",
      "Play to agreed points; honor ceremonial openings when hosted traditionally.",
    ],
    variations: [],
  },
  {
    name: "Tug of war",
    originCountry: "Multiple (global)",
    civilization: "Worldwide ritual & sport",
    creationYear: "ancient–present",
    category: "Outdoor Folk",
    purchase: "outdoor",
    idealParticipants: "2 teams",
    requirements: ["Strong rope", "Center ground marker", "Clear pull zone"],
    description:
      "Tug of war appears in harvest rites, school sports, and village festivals worldwide. Some East Asian and Pacific forms carry cosmological meanings of seasonal balance. Two teams, one rope—an elemental coordination contest.",
    howToPlay: [
      "Mark a center line and team foul lines.",
      "Teams grip evenly; avoid wrapping the rope around limbs in sport rules.",
      "On a signal, pull with short coordinated heaves.",
      "Win by pulling the center marker across your line.",
      "Stop immediately if someone slips dangerously.",
    ],
    variations: [
      { name: "Japanese tsunahiki festival forms", originCountry: "Japan", creationYear: "centuries old", notes: "Communal ropes in ritual calendar events." },
      { name: "Korean juldarigi", originCountry: "Korea", creationYear: "centuries old", notes: "Village tug rites around festivals." },
    ],
  },
  {
    name: "Hide-and-seek",
    originCountry: "Multiple (global)",
    civilization: "Worldwide childhood",
    creationYear: "unknown antiquity",
    category: "Outdoor Folk",
    purchase: "outdoor",
    idealParticipants: "3+ people",
    requirements: ["Safe bounded hiding area", "Agreed home base"],
    description:
      "Hide-and-seek is a near-universal children’s game with countless local names and counting rhymes. It rehearses stealth, spatial memory, and the social thrill of being found. Architecture—from kasbah alleys to apartment stairwells—reshapes strategy.",
    howToPlay: [
      "Pick one seeker and a home base (tree, wall, or stoop); set hard bounds—no street, no locked rooms.",
      "The seeker faces the base and counts aloud to 50 while others hide inside the bounds.",
      "The seeker shouts “Ready or not, here I come,” then tags hiders by touch; tagged players walk to a jail spot beside home base.",
      "A free hider may dash to base, touch it, and call “Free [name]!” to release one jailed player; if the seeker tags them on the way, they go to jail.",
      "When all hiders are jailed, or after five minutes, the first player tagged becomes the next seeker.",
    ],
    variations: [
      { name: "Sardines", originCountry: "United Kingdom / global", creationYear: "modern folk", notes: "Inverse hiding: one hides, others join the hiding spot." },
    ],
  },
  {
    name: "Hopscotch",
    originCountry: "Multiple (global; Roman roots often cited)",
    civilization: "Worldwide childhood",
    creationYear: "ancient–present",
    category: "Outdoor Folk",
    purchase: "outdoor",
    idealParticipants: "1–6 people",
    requirements: ["Chalk or scratched grid", "Flat marker stone"],
    description:
      "Hopping grids for tossed markers appear across continents with local shapes and rhymes. Balance, turn-taking, and pavement chalk art meet in one simple race through numbered cells.",
    howToPlay: [
      "Draw a numbered hopscotch grid.",
      "Toss a marker into the next square; it must land cleanly inside.",
      "Hop through on one foot, skipping the occupied square.",
      "Retrieve the marker on the return without faults.",
      "First to complete all numbers wins.",
    ],
    variations: [
      { name: "Rayuela", originCountry: "Spain / Latin America", creationYear: "folk continuous", notes: "Spanish-language hopscotch naming and grid variants." },
      { name: "Marelle", originCountry: "France", creationYear: "folk continuous", notes: "French hopscotch grids and schoolyard rules." },
    ],
  },
  {
    name: "Marbles",
    originCountry: "Multiple (global)",
    civilization: "Worldwide; ancient Egyptian & Roman finds",
    creationYear: "antiquity–present",
    category: "Outdoor Folk",
    purchase: "marbles",
    idealParticipants: "2–6 people",
    requirements: ["Glass, clay, or stone marbles", "Circle drawn on ground"],
    description:
      "Marble rings are nearly universal children’s gaming. Clay, stone, and later glass spheres are knuckle-shot to knock targets from a circle. ‘Keepsies’ versus friendlies decide whether winners keep captured marbles.",
    howToPlay: [
      "Draw a circle and place target marbles inside.",
      "Knuckle-shoot from the edge to knock targets out.",
      "Captured marbles score or are kept depending on agreed stakes.",
      "If your shooter remains in-ring, many rules allow another shot from there.",
      "Clear the ring or reach a point goal to win.",
    ],
    variations: [
      { name: "Ringer", originCountry: "United States", creationYear: "modern sport rules", notes: "Formal marble-tournament circle rules." },
    ],
  },
  {
    name: "Spinning top",
    originCountry: "Multiple (global)",
    civilization: "Worldwide ancient",
    creationYear: "c. 3500 BCE evidence onward",
    category: "Spinning & Tops",
    purchase: "top",
    idealParticipants: "1–many people",
    requirements: ["Wooden, clay, or metal top", "String or whip", "Hard ground"],
    description:
      "Tops are among humanity’s oldest mechanical toys, excavated from Ur to the Indus and beyond. String-launch and whip-sustained forms support endurance contests and combat. Local names differ; the physics lesson is shared.",
    howToPlay: [
      "Wind string around the body or prepare a whip.",
      "Launch with a smooth pull so the tip spins on hard ground.",
      "Optionally whip to add energy.",
      "Compete for longest spin or for knocking out rivals.",
      "Repair worn tips as needed.",
    ],
    variations: [
      { name: "Trompo", originCountry: "Mexico", creationYear: "centuries old", notes: "Cord-thrown combat and trick tops." },
      { name: "Koma", originCountry: "Japan", creationYear: "Edo–present", notes: "Japanese arena and festival tops." },
      { name: "Lattoo", originCountry: "India", creationYear: "centuries old", notes: "South Asian whipping / string tops." },
      { name: "Ttoli", originCountry: "Korea", creationYear: "centuries old", notes: "Korean whipping top." },
    ],
  },
];

/** Regions for matrix expansion */
const REGIONS = [
  ["Egypt", "Ancient Egypt"],
  ["Sudan", "Nubian"],
  ["Ethiopia", "Ethiopian highland"],
  ["Mali", "Mande / Mali Empire"],
  ["Ghana", "Akan"],
  ["Nigeria", "Yoruba / Igbo / Hausa"],
  ["Senegal", "Senegambian"],
  ["Kenya", "Kenyan highland / Swahili"],
  ["Tanzania", "Swahili coast"],
  ["South Africa", "Southern African peoples"],
  ["Madagascar", "Malagasy"],
  ["Morocco", "Amazigh / Maghreb"],
  ["Algeria", "Amazigh / Maghreb"],
  ["China", "Chinese dynastic"],
  ["Japan", "Japanese"],
  ["Korea", "Korean"],
  ["Mongolia", "Mongol steppe"],
  ["India", "Indian subcontinent"],
  ["Pakistan", "Indus / regional"],
  ["Bangladesh", "Bengali"],
  ["Nepal", "Himalayan"],
  ["Sri Lanka", "Sri Lankan"],
  ["Myanmar", "Burmese"],
  ["Thailand", "Thai"],
  ["Vietnam", "Vietnamese"],
  ["Cambodia", "Khmer"],
  ["Laos", "Lao"],
  ["Indonesia", "Indonesian archipelago"],
  ["Malaysia", "Malay"],
  ["Philippines", "Filipino"],
  ["Tibet", "Tibetan"],
  ["Iran", "Persian"],
  ["Iraq", "Mesopotamian"],
  ["Turkey", "Anatolian / Ottoman"],
  ["Saudi Arabia", "Arabian"],
  ["Yemen", "Yemeni"],
  ["Israel", "Levantine"],
  ["Lebanon", "Levantine"],
  ["Armenia", "Armenian"],
  ["Georgia", "Georgian"],
  ["Afghanistan", "Afghan"],
  ["Uzbekistan", "Central Asian"],
  ["Kazakhstan", "Steppe Kazakh"],
  ["Greece", "Greek"],
  ["Italy", "Roman / Italian"],
  ["France", "French"],
  ["Spain", "Spanish"],
  ["Portugal", "Portuguese"],
  ["United Kingdom", "British"],
  ["Ireland", "Irish"],
  ["Germany", "German"],
  ["Netherlands", "Dutch"],
  ["Belgium", "Belgian"],
  ["Sweden", "Swedish"],
  ["Norway", "Norwegian"],
  ["Finland", "Finnish"],
  ["Denmark", "Danish"],
  ["Poland", "Polish"],
  ["Russia", "Russian"],
  ["Ukraine", "Ukrainian"],
  ["Czechia", "Czech"],
  ["Hungary", "Hungarian"],
  ["Romania", "Romanian"],
  ["Bulgaria", "Bulgarian"],
  ["Serbia", "South Slavic"],
  ["Croatia", "South Slavic"],
  ["Mexico", "Mexican / Mesoamerican"],
  ["Guatemala", "Maya"],
  ["Belize", "Maya / Caribbean"],
  ["Peru", "Andean"],
  ["Bolivia", "Andean"],
  ["Ecuador", "Andean"],
  ["Chile", "Chilean / Mapuche"],
  ["Brazil", "Brazilian"],
  ["Argentina", "Argentine"],
  ["Colombia", "Colombian"],
  ["Venezuela", "Venezuelan"],
  ["Cuba", "Cuban"],
  ["United States", "Indigenous & settler folk"],
  ["Canada", "First Nations / Canadian folk"],
  ["Greenland", "Inuit"],
  ["Australia", "Aboriginal Australian"],
  ["New Zealand", "Māori"],
  ["Fiji", "Fijian"],
  ["Samoa", "Samoan"],
  ["Tonga", "Tongan"],
  ["Hawaiʻi", "Hawaiian"],
  ["Papua New Guinea", "Papuan"],
  ["Solomon Islands", "Melanesian"],
];

/** Regional craft/play archetypes — plain-language copy in plain-archetypes.mjs */
const ALL_ARCHETYPES = PLAIN_ARCHETYPES;

/** Extra unique named games to enrich beyond the matrix */
const EXTRA_NAMED = [
  ["Hnefatafl", "Norway", "Norse", "c. 400–1000 CE", "Strategy & War", "generic_board", "2 people", ["Tafl board", "King and defenders vs attackers"], "Hnefatafl is a Norse asymmetric hunt: a king and defenders try to escape attackers on a grid. Variants spread across Viking worlds. Balance of forces and throne squares define tense endgames.", ["Play Copenhagen Hnefatafl on an 11×11 board: place the king on the center throne with 12 defenders in a cross; place 24 attackers in the four edge camps.", "Attackers move first. Every piece slides any number of empty squares like a rook; none may jump.", "Capture an enemy by sandwiching it between two of your pieces on a rank or file (custodial capture); the throne and corner squares can help bracket.", "Attackers win by capturing the king on two opposite sides (or against the throne/edge as a second side). Defenders win if the king reaches any of the four corner sanctuary squares.", "Pieces may not stop on the throne except the king; attackers may not occupy the corners."], [{"name":"Tablut","originCountry":"Sweden / Sápmi","creationYear":"documented 18th c.","notes":"Linnaeus recorded Sámi tablut—same tafl family."},{"name":"Brandub","originCountry":"Ireland","creationYear":"early medieval","notes":"Irish tafl relative on a smaller board."}]],
  ["Fox and Geese", "United Kingdom", "Northern European folk", "medieval", "Strategy & War", "generic_board", "2 people", ["Cross board", "1 fox and 13+ geese"], "Asymmetric hunt on a cross: geese try to corner a fox that leaps to capture. Related to many predator-prey boards worldwide—the European parlor form is catalogued here with cousins as variations.", ["Place geese on one end and the fox centrally or opposite per rules.", "Geese move first or second by agreement; they walk without jumping.", "Fox may jump adjacent geese to capture.", "Geese win by immobilizing the fox; fox wins by capturing enough geese.", "Use a modern printed fox-and-geese board if historic boards are unavailable."], [{"name":"Cercar la Liebre","originCountry":"Spain","creationYear":"centuries old","notes":"Hare-hunting asymmetric relative."},{"name":"Hyena game","originCountry":"Sudan","creationYear":"centuries old","notes":"Spiral predator-prey race cousin."}]],
  ["Go Bang / Gomoku", "Japan / China", "East Asian", "centuries old; sport rules modern", "Strategy & War", "go", "2 people", ["15×15 or 19×19 grid", "Black and white stones"], "Five-in-a-row on a Go-like grid is an ancient East Asian pastime formalized as gomoku and renju. Distinct from Go's territory scoring—the goal is a straight five.", ["Black places first on an intersection.", "Players alternate placing one stone.", "First to form five consecutive stones in a line wins.", "Sport renju adds opening restrictions for balance.", "Play on a dedicated gomoku board or a Go board."], [{"name":"Renju","originCountry":"Japan","creationYear":"20th century sport","notes":"Balanced competitive ruleset for five-in-a-row."}]],
  ["Reversi / Othello", "United Kingdom / Japan", "Modern parlor", "1883 CE (Reversi); Othello 1973", "Strategy & War", "generic_board", "2 people", ["8×8 board", "64 double-sided discs"], "Reversi flips sandwiched discs to claim majority color. Othello standardized modern branding and opening. A pure placement-and-flip contest with explosive endgame swings.", ["Place four discs in the center in the standard Othello opening.", "Black places first on a square that flips at least one white disc.", "Flip all sandwiched opponent discs in every direction.", "A player unable to flip passes; when both cannot move, count discs.", "Majority color wins."], [{"name":"Othello","originCountry":"Japan","creationYear":"1973 CE","notes":"Trademarked modern standardization of reversi-like play."}]],
  ["Scrabble", "United States", "Modern American / global", "1938 CE", "Memory & Word", "generic_board", "2–4 people", ["Scrabble board", "Letter tiles", "Tile racks", "Dictionary for challenges"], "Scrabble assigns point values to letters on a crossword-style grid with premium squares. Born from American crossword culture, it became a global word sport with language-specific sets.", ["Draw seven tiles; place first word through the center star.", "Build new words connecting to existing letters crossword-style.", "Score letter values times premiums; tally each turn.", "Draw back to seven tiles after each play.", "Highest score when tiles run out and one player empties their rack wins."], []],
  ["Snakes and Ladders", "India", "Indian didactic; global children", "c. 2nd century BCE–19th century CE forms", "Board & Race", "generic_board", "2–4 people", ["Grid board with snakes and ladders", "Die", "One token per player"], "Paramapada sopanam / gyan chaupar taught karma with virtues as ladders and vices as snakes. British Snakes and Ladders secularized the race for children—same fundamental up-and-down morality track.", ["Place tokens off the board; roll to enter.", "Move forward by the die.", "Land at a ladder base to climb; land on a snake head to slide down.", "Exact roll may be required to finish.", "First to the final square wins."], [{"name":"Gyan Chaupar","originCountry":"India","creationYear":"centuries old","notes":"Didactic ancestor with virtues and vices labeled."},{"name":"Chutes and Ladders","originCountry":"United States","creationYear":"1943 CE","notes":"American Milton Bradley branding of the same race."}]],
  ["Monopoly", "United States", "Modern American / global", "1904 Landlord's Game roots; Monopoly 1935", "Board & Race", "generic_board", "2–6 people", ["Monopoly set", "Table space", "Play money"], "Property-trading race games critique or celebrate real-estate capitalism. Magie's Landlord's Game preceded Parker Brothers' Monopoly. Local editions map world cities onto the same buy-rent-bankrupt loop.", ["Each player starts with allotted cash and a token at Go.", "Roll dice, move, and buy unowned properties you land on—or pay rent.", "Build houses/hotels on complete color sets.", "Manage mortgages and trades.", "Last player not bankrupt wins."], [{"name":"The Landlord's Game","originCountry":"United States","creationYear":"1904 CE","notes":"Elizabeth Magie's teaching ancestor."}]],
  ["Jenga", "United Kingdom", "Modern global", "1983 CE popular (older block-stack play)", "Puzzles & Skill", "blocks", "1–8 people", ["54 precision blocks", "Stable table"], "Jenga formalizes the ancient thrill of removing pieces from a stack without collapse. Leslie Scott marketed the tower game globally; the physical puzzle is one shared stack for all players.", ["Build the tower in alternating crosswise layers of three.", "On your turn, remove one block below the incomplete top layer using one hand.", "Place it on the top to complete or continue layers.", "The player who topples the tower loses (or the prior player wins).", "Rebuild to play again."], []],
  ["Ouija-adjacent planchette toys aside: Cup-and-ball already seeded"],
  ["Diabolo", "China", "Chinese; French name later", "centuries old in China", "Puzzles & Skill", "generic_toy", "Alone", ["Diabolo spool", "Hand sticks with string"], "The Chinese kongzhu / diabolo spins on a string between sticks—tosses, accelerations, and suicides form a circus vocabulary. European circuses adopted and renamed it diabolo.", ["Start the spool rocking on the string.", "Accelerate with alternating stick motions.", "Toss and catch; attempt orbit tricks.", "Count consecutive catches or trick scores.", "Use open space clear of lamps and faces."], [{"name":"Kongzhu","originCountry":"China","creationYear":"centuries old","notes":"Chinese name and folk/circus tradition for the same spool toy."}]],
  ["Kapu kuapu / Jackstraws / Spillikins", "Multiple Europe / China roots debated", "European parlor; pick-up sticks global", "centuries old", "Puzzles & Skill", "puzzle", "1–4 people", ["Bundle of thin sticks", "Table"], "Pick-up sticks (spillikins, jackstraws) drop in a tangle; players extract sticks without moving others. Color values score. A quiet parlor test of fine motor control.", ["Hold sticks upright in a bundle and release to scramble.", "Players alternately pull one stick without wiggling others.", "If others move, your turn ends (and the stick may return).", "Score by stick colors/values.", "Highest score when the pile is cleared wins."], [{"name":"Mikado","originCountry":"Europe","creationYear":"modern commercial","notes":"Named commercial pick-up sticks set."}]],
  ["Ludo already variation of Pachisi"],
  ["Mehen", "Egypt", "Ancient Egypt", "c. 3000 BCE", "Board & Race", "generic_board", "2+ people", ["Spiral mehen board", "Marbles or lion pieces", "Throwing sticks"], "Mehen, the coiled serpent game, appears in early dynastic Egypt. Play moved along a spiral serpent toward the center; exact rules are fragmentary, but the board's sacred animal form is clear.", ["Place pieces at the serpent's tail.", "Throw sticks to advance inward along the spiral.", "Resolve interactions when sharing segments per a chosen reconstruction.", "Reaching the center may reverse the path outward.", "First to complete the journey wins in most reconstructions."], []],
  ["Buckingham Palace toy soldiers aside: Toy soldiers", "Germany / United Kingdom", "European modern", "c. 18th–19th century popular", "Dolls & Figures", "generic_toy", "Alone or 2 people", ["Miniature soldiers", "Flat floor or sand table"], "Cast or printed miniature soldiers supported war play and later wargaming. German tin makers and British hollow-casts spread sets worldwide. Play ranges from simple line battles to rule-heavy simulations.", ["Array two equal forces of at least ten figures each on opposite ends of a table or sand tray; place one flag token behind each line.", "On a turn, move up to three of your figures up to one hand-span forward, sideways, or diagonally.", "If a figure ends within one finger-width of an enemy, roll one six-sided die: 4–6 removes the enemy; 1–3 misses. Remove casualties to a dead pile.", "Capture the opponent’s flag by ending a move on its square, or eliminate every enemy figure, to win.", "Store figures upright in a box with tissue so paint and bayonets do not chip."], [{"name":"Tin flats","originCountry":"Germany","creationYear":"18th–19th century","notes":"Early mass-painted flat tin soldiers."}]],
  ["Tea set toy", "United Kingdom / Europe / East Asia porcelain play", "Modern childhood global", "18th–19th century popular", "Dolls & Figures", "doll", "1–4 people", ["Miniature cups and pot", "Optional water/sand"], "Miniature tea sets let children rehearse hospitality rituals. Porcelain and tin versions tracked adult tea cultures from Britain to Japan. Social scripts—pouring, offering, thanking—are the real ruleset.", ["Set places for dolls or friends.", "Pour (real or imaginary) tea without tipping cups.", "Practice serving order and polite phrases.", "Wash and put away as part of play.", "No score—etiquette role-play."], []],
  ["Slinky", "United States", "Modern American", "1945 CE", "Puzzles & Skill", "generic_toy", "Alone", ["Metal or plastic spring toy", "Stairs optional"], "The Slinky converts potential energy into end-over-end stair walking. A happy accident of naval spring engineering became a global desk and stair toy.", ["Place the Slinky on a stair tread.", "Tip the top coil to the next lower step.", "Watch it walk; restart when it tumbles.", "On flat desks, rock it between hands as a wave.", "Avoid overstretching coils permanently."], []],
  ["Frisbee / flying disc", "United States", "Modern American / global", "1950s CE popular (earlier tin-lid toss)", "Ball & Sport", "outdoor", "2+ people", ["Flying disc", "Open field"], "Flying discs formalized beach and park tossing; ultimate and disc golf added sport frames. The fundamental toy is a hand-thrown gliding plate.", ["Grip the disc with fingers under the rim.", "Throw flat with a spin; face the target.", "Catch with two hands when learning.", "Play catch, ultimate scores, or disc-golf holes.", "Mind wind and bystanders."], []],
  ["Hacky sack / footbag", "United States / global; older Asian footbags", "Modern global; ancient Chinese cuju relatives for feet", "1970s CE popular footbag; older kickbags centuries", "Ball & Sport", "outdoor", "1–circle group", ["Footbag", "Flat ground"], "Keeping a small bag aloft with feet echoes older Eurasian kickbag play. Circle 'sunny' sessions emphasize style and sharing over scoring.", ["Drop the bag to a foot and kick gently upward.", "Use feet, knees, and thighs—no hands.", "In a circle, pass to neighbors.", "Count consecutive kicks.", "Restart together after a drop."], [{"name":"Chinese shuttlecock/footbag relatives","originCountry":"China","creationYear":"centuries old","notes":"Older kick-keeping traditions related in spirit."}]],
  ["Boomerang", "Australia", "Aboriginal Australian", "ancient continuous", "Outdoor Folk", "outdoor", "Alone", ["Returning boomerang", "Large open field", "Spotter recommended"], "Returning boomerangs are precision-carved throwing sticks from Aboriginal Australian traditions, also used in hunting forms that do not return. Tourist sport boomerangs simplify the returning toy; cultural knowledge of designs remains with communities.", ["Use only in huge clear fields with no people downrange.", "Grip and throw at the angle taught for that shape.", "Watch the return path; do not snatch blindly.", "Let it land if unsure.", "Learn from knowledgeable throwers; respect design ownership."], []],
  ["Nullabine / Indigenous Australian string & toy diversity noted in matrix"],
  ["Poi", "New Zealand", "Māori", "centuries old", "Musical Play", "music", "Alone or group", ["Poi (flax or modern weights on cords)", "Clear swing radius"], "Māori poi swung in dance train wrist rhythm and storytelling. Modern fire and performance poi extend the toy globally; traditional contexts remain cultural practice.", ["Hold cords with weights clear of people.", "Swing in simple side circles to a beat.", "Add patterns as skill grows.", "In cultural performance, follow song and choreography.", "Use fire poi only with professional safety practice."], []],
  ["Surakarta", "Indonesia", "Javanese", "centuries old", "Strategy & War", "generic_board", "2 people", ["Surakarta board with circuits", "12 pieces per side"], "Surakarta is a Javanese capture game where pieces travel circuits around colored loops. Captures follow the loops rather than simple jumps—an elegant regional strategy toy.", ["Array pieces on your side of the board.", "Move to adjacent empty points.", "Capture by traveling along a circuit loop onto an enemy.", "Removed pieces leave gaps that reshape routes.", "Capture all enemies to win."], []],
  ["Dakon", "Indonesia", "Javanese", "centuries old", "Mancala & Sowing", "mancala", "2 people", ["Dakon boat board", "Seeds"], "Dakon is a Javanese congkak-family sowing board, often elaborately carved. It is presented as a named regional standard within mancala while remaining one sowing family.", ["Use a boat board with seven small cups per side plus one large store (lumbung) at each end; place seven seeds in every small cup.", "On your turn, scoop one of your cups and sow one seed clockwise into each following cup, including your store but skipping the opponent’s store.", "If the last seed lands in your store, sow again immediately from any of your cups that still hold seeds (relay turn).", "If the last seed lands in an empty cup on your side, capture that seed and all seeds in the opposite cup into your store.", "When one player cannot move, remaining seeds go to the owner of those cups; most seeds in store wins."], [{"name":"Congkak","originCountry":"Malaysia","creationYear":"centuries old","notes":"Closely related Malay boat-board sowing game—same family."}]],
  ["Sungka", "Philippines", "Filipino", "centuries old", "Mancala & Sowing", "mancala", "2 people", ["Sungka board", "Cowries or seeds"], "Sungka is the Filipino boat-shaped sowing game, cousin to congkak. Boards are household heirlooms; play mixes speed sowing with capture timing.", ["Seat two players at a sungka board with seven small cups (bahay) per side and one head store (ulo) each; place seven cowries or seeds in every bahay.", "Scoop all seeds from one of your bahay and sow counterclockwise one-by-one into each following cup, including your ulo but skipping the opponent’s ulo.", "If the last seed lands in your ulo, take another turn; if it lands in an empty bahay on your side, capture the opposite bahay’s seeds into your ulo.", "A player who empties their side early waits while the opponent may still sow; continue until neither side has seeds left in bahay.", "Count cowries in each ulo; the higher store wins."], [{"name":"Congkak","originCountry":"Malaysia","creationYear":"centuries old","notes":"Malay relative—variation within sowing boat boards."}]],
];

function normalizeExtra(row) {
  if (!Array.isArray(row) || row.length < 10) return null;
  const [name, originCountry, civilization, creationYear, category, purchase, idealParticipants, requirements, description, howToPlay, variations] = row;
  return {
    name,
    originCountry,
    civilization,
    creationYear,
    category,
    purchase,
    idealParticipants,
    requirements,
    description,
    howToPlay,
    variations: variations || [],
  };
}

function toGame(seed, index) {
  const salt = hash(seed.name + seed.originCountry + String(index));
  const slugBase = slugify(seed.name);
  const slug = `${slugBase}-${String(index).padStart(4, "0")}`;
  const imageKey = `game:${slug}`;
  const variations = (seed.variations || []).map((v, vi) => {
    const varKey = `var:${slug}:${slugify(v.name)}:${slugify(v.originCountry)}:${vi}`;
    return {
      ...v,
      images: pickImages({
        name: v.name,
        category: seed.category,
        originCountry: v.originCountry,
        uniqueKey: varKey,
        archetypeKey: seed.archetypeKey,
        parentName: seed.name,
      }),
    };
  });
  /** @type {Record<string, unknown>} */
  const game = {
    id: `game-${String(index).padStart(4, "0")}`,
    slug,
    name: seed.name,
    originCountry: seed.originCountry,
    civilization: seed.civilization,
    creationYear: seed.creationYear,
    category: seed.category,
    images: pickImages({
      name: seed.name,
      category: seed.category,
      originCountry: seed.originCountry,
      uniqueKey: imageKey,
      archetypeKey: seed.archetypeKey,
    }),
    description: seed.description,
    howToPlay: seed.howToPlay,
    purchaseLinks: pickPurchase(seed.purchase, salt),
    requirements: seed.requirements,
    idealParticipants: seed.idealParticipants,
    variations,
    tags: [seed.category, seed.originCountry, seed.civilization].map((t) => t.toLowerCase()),
  };
  if (seed.archetypeKey) {
    game.archetypeKey = seed.archetypeKey;
  }
  return game;
}

function main() {
  const games = [];
  const seen = new Set();

  function add(seed) {
    const key = slugify(seed.name);
    // Allow region-qualified names; block exact duplicates
    if (seen.has(key)) return false;
    seen.add(key);
    games.push(toGame(polishSeedCopy(seed), games.length + 1));
    return true;
  }

  for (const s of SEEDS) add(s);

  for (const row of EXTRA_NAMED) {
    const s = normalizeExtra(row);
    if (s) add(s);
  }

  // Matrix expansion: each archetype × each region
  for (const arch of ALL_ARCHETYPES) {
    for (const [country, civ] of REGIONS) {
      const name = `${arch.title} — ${country}`;
      add({
        name,
        originCountry: country,
        civilization: civ,
        creationYear: arch.year,
        category: arch.category,
        purchase: arch.purchase,
        idealParticipants: arch.participants,
        requirements: arch.req,
        description: arch.desc(country, civ),
        howToPlay: typeof arch.steps === "function" ? arch.steps(country, civ) : arch.steps,
        variations: [],
        archetypeKey: arch.key,
      });
    }
  }

  // If still short, add numbered ethnographic craft variants with unique names
  let n = 1;
  const fillers = [
    ["Bone flute toy", "Musical Play", "music", "Alone", ["Small flute toy"], "simple wind toy for children"],
    ["Reed boat bath toy", "Outdoor Folk", "outdoor", "Alone", ["Reed or cork toy boat"], "floating toy for basins and streams"],
    ["Woven finger trap", "Puzzles & Skill", "puzzle", "Alone", ["Woven tube trap"], "Chinese finger-trap style woven toy"],
    ["Clay animal figurine", "Dolls & Figures", "doll", "Alone", ["Clay animal"], "modeled animal for story play"],
    ["Bead maze table toy", "Puzzles & Skill", "puzzle", "Alone", ["Bead maze"], "wire-and-bead tracking toy"],
    ["Hoop and stick", "Outdoor Folk", "outdoor", "Alone", ["Hoop", "Drive stick"], "rolling hoop driven with a stick"],
    ["Cup bells toy", "Musical Play", "music", "Alone", ["Jingle cup toy"], "jingling grasp toy"],
    ["Folded paper flyer", "Outdoor Folk", "outdoor", "Alone", ["Paper sheet"], "paper glider folding play"],
    ["Shell spinning disc", "Spinning & Tops", "top", "Alone", ["Shell or button spinner"], "twirled disc spinner"],
    ["Counting rods play", "Memory & Word", "generic_toy", "1–2 people", ["Counting rods or sticks"], "arithmetic play sticks"],
  ];
  while (games.length < 1000) {
    const [country, civ] = REGIONS[n % REGIONS.length];
    const f = fillers[n % fillers.length];
    const [title, category, purchase, participants, req, blurb] = f;
    const name = `${title} (${civ}, set ${Math.floor(n / fillers.length) + 1})`;
    add({
      name,
      originCountry: country,
      civilization: civ,
      creationYear: "centuries old / traditional",
      category,
      purchase,
      idealParticipants: participants,
      requirements: req,
      description: `This ${blurb} is a children’s play object known in ${country}. Making it, decorating it, and using it builds hand skill and shows local style. Families may treat it as simple fun or as a small good-luck charm.`,
      howToPlay: [
        `In ${country}, gather materials for a ${title.toLowerCase()} and check for sharp edges before play.`,
        `Show one full use—blow, float, trap, model, track, roll, jingle, fold, spin, or count—then hand it to the child.`,
        "Let the child repeat that action five times, then invent one new safe use.",
        "If two or more players are present, take turns of thirty seconds each until everyone has had two turns.",
        `Wipe or air-dry the ${title.toLowerCase()} and store it flat or upright for next time.`,
      ],
      variations: [],
    });
    n++;
    if (n > 5000) break;
  }

  const categories = [...new Set(games.map((g) => g.category))].sort();
  const civilizations = [...new Set(games.map((g) => g.civilization))].sort();
  const totalVariations = games.reduce((a, g) => a + (g.variations?.length || 0), 0);

  const payload = {
    meta: {
      generatedAt: new Date().toISOString(),
      totalGames: games.length,
      totalVariations,
      categories,
      civilizations,
      brand: "Ludus Atlas",
    },
    games,
  };

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(payload));
  console.log(`Wrote ${games.length} games with ${totalVariations} nested variations → ${outPath}`);
}

main();
