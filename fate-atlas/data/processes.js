/**
 * Process templates and outcome pools for interactive readings.
 * Every catalog method maps to one pre-defined ritual flow.
 */
(function () {
  "use strict";

  const VERDICTS = {
    bright: [
      "A clear path opens sooner than expected.",
      "Favor gathers around a choice you already know.",
      "What you tend carefully will return abundance.",
      "Allies appear when you speak the need plainly.",
      "Momentum favors beginnings made with clean intent.",
    ],
    mixed: [
      "Progress comes, but only through a deliberate pause.",
      "Two currents pull—choose one before the tide turns.",
      "Gain is real, yet it asks for something small in return.",
      "The answer is yes if you adjust the timing.",
      "A door opens; another must close first.",
    ],
    caution: [
      "Hold still. The sign advises against haste.",
      "Protect what is already working before expanding.",
      "A charming offer hides uneven ground.",
      "Wait one more cycle before binding yourself.",
      "Silence serves you better than persuasion today.",
    ],
    deep: [
      "The question points inward more than outward.",
      "An old pattern wants rewriting—listen to the first whisper.",
      "Fate here is less prediction than invitation.",
      "What returns now is unfinished, not unfinished forever.",
      "Guidance arrives as a feeling before it becomes a fact.",
    ],
  };

  const COUNSELS = [
    "Write the question once, then act on the first honest answer.",
    "Offer thanks before you ask for more.",
    "Move at the pace of breath, not of fear.",
    "Tell one trusted person what you intend.",
    "Clear a small space—desk, doorway, or calendar—and begin there.",
    "Do the next kind thing without announcing it.",
    "Keep a promise you made only to yourself.",
    "Walk outdoors and name three things that are already enough.",
  ];

  const TIMINGS = [
    "Within three days, a sign will confirm the reading.",
    "The next new moon marks a useful checkpoint.",
    "Expect clarity around the end of this week.",
    "A full turning of seven days settles the matter.",
    "Watch the second opportunity—not the first.",
    "Before the month closes, the path names itself.",
  ];

  const SYMBOLS = {
    Fate: ["☉", "☾", "★", "✦", "子午", "甲", "☽"],
    Omen: ["☰", "⚏", "◆", "✧", "⬡", "⁕", "◎"],
    Form: ["✋", "◇", "▢", "◈", "◠", "○", "▣"],
  };

  const HEXAGRAMS = [
    { name: "Creative Force", lines: "䷀", meaning: "Strength gathers when will aligns with timing." },
    { name: "Receptive Field", lines: "䷁", meaning: "Yielding now multiplies later harvest." },
    { name: "Difficulty at the Beginning", lines: "䷂", meaning: "Confusion clears after the first honest step." },
    { name: "Waiting", lines: "䷄", meaning: "Nourish patience; the crossing is not yet." },
    { name: "Conflict", lines: "䷅", meaning: "Argue less with the map; adjust your route." },
    { name: "Holding Together", lines: "䷎", meaning: "Company chosen wisely becomes fortune." },
    { name: "Small Taming", lines: "䷈", meaning: "Restrain impulse; polish the detail." },
    { name: "Peace", lines: "䷊", meaning: "Heaven and earth agree—act while balance holds." },
    { name: "Standstill", lines: "䷋", meaning: "Do not force what the season withholds." },
    { name: "Fellowship", lines: "䷌", meaning: "Shared purpose lights a wider road." },
    { name: "Great Possession", lines: "䷍", meaning: "Steward gains; generosity keeps them alive." },
    { name: "Modesty", lines: "䷎", meaning: "Quiet competence outruns loud claims." },
    { name: "Enthusiasm", lines: "䷏", meaning: "Joy moves crowds—direct it with care." },
    { name: "Following", lines: "䷐", meaning: "Adapt to the living current, not the old plan." },
    { name: "Work on What Has Been Spoiled", lines: "䷑", meaning: "Repair restores more than reinvention." },
    { name: "Approach", lines: "䷒", meaning: "Help arrives; receive it without shrinking." },
  ];

  const ODU_LIKE = [
    { name: "Open Road", verse: "The path is swept. Walk without borrowing fear." },
    { name: "Twin Currents", verse: "Two truths speak; the quieter one is yours." },
    { name: "Market Crossroads", verse: "Trade what weighs you for what feeds you." },
    { name: "Closed Gate", verse: "Not denial—preparation. Return with cleaner hands." },
    { name: "Ancestral Nod", verse: "Someone before you already survived this shape of doubt." },
    { name: "Cowrie Smile", verse: "Joy is not frivolous; it is navigation." },
    { name: "Palm Kernel", verse: "Break the hard shell; the oil was always inside." },
    { name: "Night Drum", verse: "Rhythm before reason—move, then understand." },
  ];

  const TAROT_LIKE = [
    { name: "The Seeker", upright: "Curiosity becomes courage when given a destination." },
    { name: "The Keeper", upright: "Guard the threshold; not every guest is for you." },
    { name: "The Bridge", upright: "You are the crossing between what was and what will be." },
    { name: "The Well", upright: "Depth answers only those who lower a bucket." },
    { name: "The Spark", upright: "A small ignition is enough if the kindling is honest." },
    { name: "The Veil", upright: "Mystery is temporary; patience is the key." },
    { name: "The Harvest", upright: "Collect what you planted; leave the rest to weather." },
    { name: "The Compass", upright: "Direction returns when you stop arguing with north." },
  ];

  const ANIMALS = ["Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake", "Horse", "Goat", "Monkey", "Rooster", "Dog", "Pig"];
  const ELEMENTS = ["Wood", "Fire", "Earth", "Metal", "Water"];
  const RUNES = [
    { name: "Fehu", gloss: "movable wealth, beginning energy" },
    { name: "Uruz", gloss: "vital strength, recovery" },
    { name: "Thurisaz", gloss: "threshold force, necessary conflict" },
    { name: "Ansuz", gloss: "message, breath, counsel" },
    { name: "Raidho", gloss: "journey, right ordering" },
    { name: "Kenaz", gloss: "torch, craft, revelation" },
    { name: "Gebo", gloss: "gift, exchange, bond" },
    { name: "Wunjo", gloss: "joy, belonging" },
  ];

  const PROCESSES = {
    birth: {
      id: "birth",
      label: "Birth chart reading",
      blurb: "Enter a birth date. The atlas derives a symbolic fate signature in the style of this tradition.",
      steps: ["intent", "birth", "ritual", "result"],
      ritualLabel: "Charting the heavens…",
      cta: "Read my fate",
    },
    cast: {
      id: "cast",
      label: "Casting the lots",
      blurb: "Name your question. Lots, shells, sticks, or seeds are cast in a simulated rite.",
      steps: ["intent", "question", "ritual", "result"],
      ritualLabel: "Casting…",
      cta: "Cast now",
    },
    cards: {
      id: "cards",
      label: "Card draw",
      blurb: "Hold a focus in mind. Three symbolic cards are drawn and read together.",
      steps: ["intent", "question", "ritual", "result"],
      ritualLabel: "Shuffling the deck…",
      cta: "Draw cards",
    },
    dice: {
      id: "dice",
      label: "Dice / bone throw",
      blurb: "Ask, then throw. Numbers and faces become the oracle’s speech.",
      steps: ["intent", "question", "ritual", "result"],
      ritualLabel: "Throwing…",
      cta: "Throw",
    },
    book: {
      id: "book",
      label: "Opening the book",
      blurb: "A verse, poem, or lot slip opens as if at random—then is interpreted.",
      steps: ["intent", "question", "ritual", "result"],
      ritualLabel: "Opening the page…",
      cta: "Open the oracle",
    },
    form: {
      id: "form",
      label: "Form reading",
      blurb: "Upload a photo when asked (palm, face, place, etc.), note a trait, and form becomes fortune.",
      steps: ["intent", "form", "ritual", "result"],
      ritualLabel: "Reading the form…",
      cta: "Read the form",
    },
    pendulum: {
      id: "pendulum",
      label: "Yes / no pendulum",
      blurb: "Ask a yes-or-no question. The pendulum’s swing answers.",
      steps: ["intent", "question", "ritual", "result"],
      ritualLabel: "Listening to the swing…",
      cta: "Ask the pendulum",
    },
    day: {
      id: "day",
      label: "Day selection",
      blurb: "Choose a date and purpose. The almanac answers whether the day favors you.",
      steps: ["intent", "day", "ritual", "result"],
      ritualLabel: "Consulting the almanac…",
      cta: "Check this day",
    },
    omen: {
      id: "omen",
      label: "Omen watching",
      blurb: "Name what you seek. Signs are gathered from the tradition’s symbolic field.",
      steps: ["intent", "question", "ritual", "result"],
      ritualLabel: "Watching for signs…",
      cta: "Seek the omen",
    },
  };

  /** Keyword → process id (first match wins). */
  const KEYWORD_MAP = [
    [/tarot|lenormand|kipper|sibilla|cartomancy|baraja|oracle card|parrot/i, "cards"],
    [/rune|ogham|futhorc|futhark/i, "cast"],
    [/i ching|zhou yi|hexagram|liu yao|plum blossom|qimen|liu ren|ling qi/i, "cast"],
    [/if[aá]|odu|cowrie|búzio|dilogg|mérìnd|obi|afa|sikidy|hakata|ngombo|bone|shagai|maize|coca|geomanc|ilm al-raml|ramala|jiaobei|kau chim|omikuji|cleromancy|lot|goralot|belomancy|urim/i, "cast"],
    [/dice|astragal|mo\b|domino|knuckle/i, "dice"],
    [/bibliomancy|hafez|kiều|kieu|sortes|book|poem|verse/i, "book"],
    [/pendulum|dowsing|istikh/i, "pendulum"],
    [/almanac|rokuy|zeri|day select|weekday|tongshu|nekath|weton|pawukon|maramataka|moon night|ben ming|tojeong/i, "day"],
    [/palm|face|physiognom|mian xiang|shou xiang|samudrika|grapholog|mole|nail|vastu|feng shui|kasō|kaso|house|grave|aura|handwriting|seal|metoposcop|bone palm|form/i, "form"],
    [/bazi|zi wei|astrology|jyotish|vedic|saju|horary|zodiac|numerolog|abjad|gematria|birth|pillar|hora|mahabote|taksa|decan|firdaria|human design|astrocart|biorhythm|blood type|name divination|seimei|sanmei|nine star|sukuy|panchanga|manazil|mazalot|tonalpohualli|tzolk|wata|zurhai|tibetan astro/i, "birth"],
    [/dream|scry|smoke|cloud|fire|water|wax|lead|egg|apple|augur|haruspic|scapul|crab|spider|fox|star twinkl|scintill|vision|shaman|tent|incub/i, "omen"],
  ];

  function processForMethod(method) {
    const hay = `${method.name} ${method.summary} ${method.region || ""}`;
    for (const [re, id] of KEYWORD_MAP) {
      if (re.test(hay)) return PROCESSES[id];
    }
    if (method.type === "Fate") return PROCESSES.birth;
    if (method.type === "Form") return PROCESSES.form;
    return PROCESSES.omen;
  }

  /**
   * Photo upload guidance for methods that read from imageable subjects.
   * Returns null when upload is not relevant.
   */
  function photoSubjectFor(method) {
    const hay = `${method.name} ${method.summary} ${method.region || ""}`;
    if (/palm|chiromanc|shou xiang|shouxiang|mogu|bone palm|hand line/i.test(hay)) {
      return {
        id: "palm",
        label: "Upload a photo of your palm",
        accept: "image/*",
        hint: "Use the hand you want read. Good light, palm open, fingers slightly apart. Avoid heavy filters.",
        placeholderTrait: "e.g. deep life line, clear heart line, prominent Venus mount…",
        required: true,
      };
    }
    if (/face|mian xiang|mianxiang|physiognom|metoposcop/i.test(hay)) {
      return {
        id: "face",
        label: "Upload a photo of your face",
        accept: "image/*",
        hint: "Front-facing portrait, even lighting, neutral expression. Hair not covering key features.",
        placeholderTrait: "e.g. broad forehead, high cheekbones, deep-set eyes…",
        required: true,
      };
    }
    if (/mole|moleosoph/i.test(hay)) {
      return {
        id: "mole",
        label: "Upload a photo showing the mole(s)",
        accept: "image/*",
        hint: "Frame the area clearly (face, neck, hand, etc.).",
        placeholderTrait: "e.g. mole on left cheek, raised dark mole near brow…",
        required: true,
      };
    }
    if (/nail|onychomanc/i.test(hay)) {
      return {
        id: "nails",
        label: "Upload a photo of your nails / hands",
        accept: "image/*",
        hint: "Natural nails in clear light work best.",
        placeholderTrait: "e.g. almond shape, pale lunulae, vertical ridges…",
        required: true,
      };
    }
    if (/samudrika/i.test(hay)) {
      return {
        id: "body",
        label: "Upload a photo for body-mark reading",
        accept: "image/*",
        hint: "Hands, face, or the feature you want considered. Keep it respectful and clear.",
        placeholderTrait: "e.g. long fingers, marked brow, distinctive gait note…",
        required: true,
      };
    }
    if (/feng shui|vastu|kasō|kaso|house|grave|boso/i.test(hay)) {
      return {
        id: "place",
        label: "Upload a photo of the place / plan",
        accept: "image/*",
        hint: "Floor plan sketch, entrance, or room photo. North orientation helps if you know it.",
        placeholderTrait: "e.g. south-facing door, cluttered SE corner, L-shaped lot…",
        required: false,
      };
    }
    if (/grapholog|handwriting|seal|insō/i.test(hay)) {
      return {
        id: "writing",
        label: "Upload a photo of the writing / seal",
        accept: "image/*",
        hint: "Clear scan or photo of a handwriting sample or seal impression.",
        placeholderTrait: "e.g. right-slanted script, heavy pressure, open loops…",
        required: true,
      };
    }
    if (/aura/i.test(hay)) {
      return {
        id: "aura",
        label: "Optional: upload a portrait for aura focus",
        accept: "image/*",
        hint: "A calm portrait helps you hold the subject in mind (symbolic reading only).",
        placeholderTrait: "e.g. sensed gold rim, heavy grey near shoulders…",
        required: false,
      };
    }
    if (method.type === "Form") {
      return {
        id: "form",
        label: "Optional: upload a reference photo",
        accept: "image/*",
        hint: "Any clear image of the form you want read.",
        placeholderTrait: "Describe the main trait…",
        required: false,
      };
    }
    return null;
  }

  function hashSeed(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function mulberry32(a) {
    return function () {
      let t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pick(rng, arr) {
    return arr[Math.floor(rng() * arr.length)];
  }

  function toneFromRng(rng) {
    const n = rng();
    if (n < 0.28) return "bright";
    if (n < 0.55) return "mixed";
    if (n < 0.78) return "caution";
    return "deep";
  }

  function zodiacWestern(month, day) {
    const signs = [
      [1, 20, "Capricorn"], [2, 19, "Aquarius"], [3, 20, "Pisces"], [4, 20, "Aries"],
      [5, 21, "Taurus"], [6, 21, "Gemini"], [7, 22, "Cancer"], [8, 23, "Leo"],
      [9, 23, "Virgo"], [10, 23, "Libra"], [11, 22, "Scorpio"], [12, 22, "Sagittarius"], [12, 32, "Capricorn"],
    ];
    for (const [m, d, s] of signs) {
      if (month < m || (month === m && day <= d)) return s;
    }
    return "Capricorn";
  }

  function lifePath(dateStr) {
    const digits = dateStr.replace(/\D/g, "").split("").map(Number);
    let sum = digits.reduce((a, b) => a + b, 0);
    while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
      sum = String(sum).split("").map(Number).reduce((a, b) => a + b, 0);
    }
    return sum;
  }

  function generateReading(method, process, input) {
    const seedStr = [
      method.id,
      process.id,
      input.question || "",
      input.birthDate || "",
      input.dayDate || "",
      input.formTrait || "",
      input.formFocus || "",
      String(input.nonce || 0),
    ].join("|");
    const rng = mulberry32(hashSeed(seedStr));
    const tone = toneFromRng(rng);
    const symbol = pick(rng, SYMBOLS[method.type] || SYMBOLS.Omen);
    const verdict = pick(rng, VERDICTS[tone]);
    const counsel = pick(rng, COUNSELS);
    const timing = pick(rng, TIMINGS);

    const reading = {
      methodId: method.id,
      methodName: method.name,
      processId: process.id,
      processLabel: process.label,
      tone,
      symbol,
      title: "",
      omen: "",
      verdict,
      counsel,
      timing,
      details: [],
      disclaimer:
        "Simulated reading in the style of this tradition—for reflection and learning, not authentic initiatory practice or medical/legal/financial advice. May be inaccurate; cannot predict black swan events.",
    };

    if (process.id === "birth") {
      const d = input.birthDate ? new Date(input.birthDate + "T12:00:00") : new Date();
      const month = d.getMonth() + 1;
      const day = d.getDate();
      const year = d.getFullYear();
      const animal = ANIMALS[(year - 4) % 12];
      const element = ELEMENTS[Math.floor(((year - 4) % 10) / 2)];
      const sign = zodiacWestern(month, day);
      const path = lifePath(input.birthDate || d.toISOString().slice(0, 10));
      reading.title = `${element} ${animal} · ${sign}`;
      reading.omen = `Life path ${path}`;
      reading.details = [
        `Birth signature styled after ${method.name}.`,
        `Celestial lean: ${sign}; calendrical animal: ${animal} (${element}).`,
        `Core number current: ${path}.`,
      ];
    } else if (process.id === "cards") {
      const deck = TAROT_LIKE.slice();
      const cards = [];
      for (let i = 0; i < 3 && deck.length; i++) {
        const idx = Math.floor(rng() * deck.length);
        cards.push(deck.splice(idx, 1)[0]);
      }
      reading.title = cards.map((c) => c.name).join(" · ");
      reading.omen = "Past · Present · Path";
      reading.details = cards.map((c, i) => `${["Past", "Present", "Path"][i]} — ${c.name}: ${c.upright}`);
    } else if (process.id === "cast" && /i ching|zhou|hexagram|liu yao|plum|qimen|liu ren/i.test(method.name + method.summary)) {
      const hx = pick(rng, HEXAGRAMS);
      reading.title = `${hx.lines} ${hx.name}`;
      reading.omen = "Hexagram counsel";
      reading.details = [hx.meaning, `Read in the spirit of ${method.name}.`];
    } else if (process.id === "cast" && /if[aá]|odu|cowrie|búzio|dilogg|mérìnd|obi|afa|sikidy/i.test(method.name + method.summary)) {
      const odu = pick(rng, ODU_LIKE);
      reading.title = odu.name;
      reading.omen = "Oracular figure";
      reading.details = [odu.verse, `Styled after ${method.name} lot-casting.`];
    } else if (process.id === "cast" && /rune|ogham|futhorc|futhark/i.test(method.name + method.summary)) {
      const r1 = pick(rng, RUNES);
      const r2 = pick(rng, RUNES);
      reading.title = `${r1.name} · ${r2.name}`;
      reading.omen = "Cast staves";
      reading.details = [`${r1.name}: ${r1.gloss}`, `${r2.name}: ${r2.gloss}`];
    } else if (process.id === "cast") {
      const faces = Math.floor(rng() * 8) + 1;
      reading.title = `Pattern ${faces}`;
      reading.omen = "Lots settled";
      reading.details = [
        `The cast resolved into pattern ${faces}.`,
        `In the manner of ${method.name}, this pattern leans ${tone}.`,
      ];
    } else if (process.id === "dice") {
      const a = 1 + Math.floor(rng() * 6);
      const b = 1 + Math.floor(rng() * 6);
      reading.title = `${a} + ${b} = ${a + b}`;
      reading.omen = "Thrown faces";
      reading.details = [`Sum ${a + b} colors the reading ${tone}.`, `Thrown in the style of ${method.name}.`];
    } else if (process.id === "book") {
      const verses = [
        "Wherever the river bends, the boat that listens arrives.",
        "A closed hand cannot receive the lantern.",
        "Name the fear once; it loses half its teeth.",
        "The garden remembers every seed you thought forgotten.",
        "Between two answers, choose the one that lets you sleep.",
      ];
      const v = pick(rng, verses);
      reading.title = "Opened verse";
      reading.omen = v;
      reading.details = [`Interpreted through ${method.name}.`, "Let the line sit beside your question without forcing fit."];
    } else if (process.id === "form") {
      const photo = input.photoMeta;
      reading.title = `Form of ${input.formTrait || "the seeker"}`;
      reading.omen = input.formFocus || "General fortune";
      reading.details = [
        `Trait noted: ${input.formTrait || "unspecified"}.`,
        `Focus: ${input.formFocus || "overall path"}.`,
        photo
          ? `Photo received (${photo.subjectLabel}): image held as the form under study.`
          : "No photo uploaded — reading from your written notes alone.",
        `Read in the observational style of ${method.name}.`,
      ];
      reading.photoDataUrl = input.photoDataUrl || null;
      reading.photoSubject = photo?.subjectId || null;
    } else if (process.id === "pendulum") {
      const ans = rng() < 0.5 ? "Yes" : "No";
      const lean = rng() < 0.35 ? "strongly" : rng() < 0.7 ? "clearly" : "softly";
      reading.title = ans;
      reading.omen = `Pendulum swings ${lean}`;
      reading.details = [
        `Answer: ${ans} (${lean}).`,
        `Ask again only if the question changes—not if you dislike the answer.`,
      ];
      if (ans === "No") reading.tone = "caution";
      if (ans === "Yes") reading.tone = "bright";
    } else if (process.id === "day") {
      const score = Math.floor(rng() * 5);
      const labels = ["Inauspicious", "Mixed — caution", "Neutral", "Favorable", "Highly auspicious"];
      reading.title = labels[score];
      reading.omen = input.dayPurpose || "General day reading";
      reading.details = [
        `Date: ${input.dayDate || "today"} for “${input.dayPurpose || "general affairs"}”.`,
        `Almanac lean via ${method.name}: ${labels[score]}.`,
      ];
      reading.tone = score >= 3 ? "bright" : score <= 1 ? "caution" : "mixed";
    } else {
      const omens = [
        "A bird crosses left to right—movement favored.",
        "Smoke rises straight—integrity in the ask.",
        "Clouds thin at the center—clarity after fog.",
        "A sudden stillness—listen before speaking.",
        "Warmth without wind—support without spectacle.",
      ];
      reading.title = "Sign received";
      reading.omen = pick(rng, omens);
      reading.details = [`Watched in the symbolic field of ${method.name}.`];
    }

    if (input.question) {
      reading.details.unshift(`Question held: “${input.question}”`);
    }

    reading.verdict = verdict;
    reading.counsel = counsel;
    reading.timing = timing;
    return reading;
  }

  window.FATE_PROCESSES = PROCESSES;
  window.fateProcessForMethod = processForMethod;
  window.fatePhotoSubjectFor = photoSubjectFor;
  window.fateGenerateReading = generateReading;
})();
