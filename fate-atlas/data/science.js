/**
 * Epistemic / scientific-status labels — case-by-case per rite.
 * Cultural value ≠ validated prediction. Never invent evidence.
 */
(function () {
  "use strict";

  const LEVELS = {
    none: {
      id: "none",
      short: "No predictive science",
      tag: "Science: none for fate claims",
    },
    cultural: {
      id: "cultural",
      short: "Cultural system",
      tag: "Science: cultural · not predictive",
    },
    reflective: {
      id: "reflective",
      short: "Reflective / symbolic",
      tag: "Science: reflective only",
    },
    contested: {
      id: "contested",
      short: "Contested psychology",
      tag: "Science: contested · not fate",
    },
    env: {
      id: "env",
      short: "Environmental observation",
      tag: "Science: env. observation",
    },
    falsified: {
      id: "falsified",
      short: "Claims tested & unsupported",
      tag: "Science: unsupported / falsified",
    },
  };

  const GLOBAL_ADVISORY = {
    title: "Accuracy advisory",
    body:
      "These readings may not be accurate. We live in a stochastic world—chance, feedback loops, and hidden variables shape outcomes. Some traditions feel precise in hindsight or as mirrors for reflection, but none can reliably forecast the future, and none can predict black swan events: rare, high-impact shocks that can rewrite plans immediately.",
    bullets: [
      "Treat every result as optional reflection, not instruction.",
      "Past accuracy (or coincidence) does not guarantee the next outcome.",
      "Black swans—pandemics, crashes, accidents, sudden political or personal ruptures—lie outside divinatory models.",
      "Do not use this site for medical, legal, financial, or safety-critical decisions.",
    ],
  };

  function haystack(method) {
    return `${method.id || ""} ${method.name || ""} ${method.summary || ""} ${method.region || ""} ${(method.countries || []).join(" ")}`;
  }

  function placeOf(method) {
    if (method.region) return method.region;
    if (method.countries && method.countries.length) return method.countries.slice(0, 3).join(", ");
    return method.continent || "this tradition";
  }

  function practiceBit(method) {
    const s = String(method.summary || "").replace(/\s+/g, " ").trim();
    if (!s) return "";
    const cut = s.split(/(?<=[.!?])\s+/)[0] || s;
    return cut.length > 160 ? cut.slice(0, 157).trimEnd() + "…" : cut;
  }

  function lead(method) {
    return `${method.name} (${placeOf(method)})`;
  }

  /** Explicit overrides for rites with well-documented epistemic status. */
  const BY_ID = {
    mbti: {
      level: "contested",
      reasoning:
        "MBTI Personality Fate is a simplified self-report preference quiz. Peer-reviewed psychology treats MBTI as contested: test–retest reliability and predictive validity for life outcomes are debated, and the four-letter code is not a clinical diagnosis. Preferring E vs I (etc.) can organize reflection about how you decide — it does not forecast job offers, relationships, or black swan events.",
    },
    biorhythm: {
      level: "falsified",
      reasoning:
        "Biorhythm charts claim fixed physical/emotional/intellectual sine waves from birth. Controlled studies have repeatedly found no predictive accuracy beyond chance for performance, accidents, or life events. Treat any “high/low day” here as a discarded hypothesis, not evidence.",
    },
    "blood-type": {
      level: "falsified",
      reasoning:
        "Blood Type Personality links ABO blood groups to character and destiny (popular in parts of East Asia). ABO type is a real antigen system for medicine; it is not a validated determinant of personality or fate. Controlled research does not support blood-type fortune claims.",
    },
    graphology: {
      level: "falsified",
      reasoning:
        "Graphology reads handwriting for personality or destiny. Forensic document comparison (identity of a writer) is a separate skill. As character/fate diagnosis, graphology fails controlled tests and is not accepted as scientific psychology.",
    },
    bagua: {
      level: "reflective",
      reasoning:
        "Bagua / coin hexagram (铜钱起卦) builds a six-line figure from coin tosses, then reads trigrams and changing lines in the Yijing tradition. The coin procedure is random by design; hexagram texts are a classical Chinese philosophical corpus. Random + text can structure reflection, but trials do not show hexagrams predict personal futures or black swans.",
    },
    tarot: {
      level: "reflective",
      reasoning:
        "Tarot (Major Arcana) uses a shuffled symbolic deck and position meanings (e.g. Past · Present · Path). Card order is stochastic; interpretations rely on archetypal imagery and the reader’s narrative. That supports projection and sense-making, not evidence-based event forecasting.",
    },
    ifa: {
      level: "reflective",
      reasoning:
        "Ifá is a Yoruba oracular system in which a babaláwo casts palm nuts or an ọ̀pẹ̀lẹ̀ chain to identify one of 256 Odù, each linked to memorized verses and ritual prescriptions. The literary and liturgical corpus is culturally deep; the cast itself is a lot procedure. This site’s simulation is educational only — not initiatory practice — and does not scientifically predict outcomes.",
    },
    "i-ching": {
      level: "reflective",
      reasoning:
        "Zhou Yi / I Ching consultation derives a hexagram (classically via yarrow or coins) and reads attached judgments. Historically it is a book of changes and ethics as much as an oracle. Stochastic line generation plus ancient commentary can prompt reflection; it is not a validated forecasting instrument.",
    },
  };

  /**
   * Classify without over-broad tokens like bare "omen" (matches type)
   * or bare "palm" (matches "palm nuts" in Ifá).
   */
  function classify(method) {
    const h = haystack(method);
    const id = method.id || "";

    if (BY_ID[id]) return { level: BY_ID[id].level, kind: "override" };

    if (/biorhythm/i.test(h)) return { level: "falsified", kind: "biorhythm" };
    if (/blood[ -]?type/i.test(h)) return { level: "falsified", kind: "blood" };
    if (/grapholog|handwriting analysis/i.test(h)) return { level: "falsified", kind: "graphology" };
    if (/\bmbti\b/i.test(h)) return { level: "contested", kind: "mbti" };

    if (/stellar scintillation|star twinkl|northern dene|torres strait|aboriginal australian sky/i.test(h)) {
      return { level: "env", kind: "env-sky" };
    }

    if (/feng shui|vastu|kasō|kaso|ba zhai|flying star|xuan kong/i.test(h)) {
      return { level: "cultural", kind: "spatial" };
    }

    if (/almanac|rokuy|zeri|tongshu|day selection|sarvatobhadra|onmyōdō almanac|onmyodo almanac/i.test(h)) {
      return { level: "cultural", kind: "almanac" };
    }

    if (/tarot|lenormand|kipper|sibilla|cartomancy|oracle card|baraja|parrot cards/i.test(h)) {
      return { level: "reflective", kind: "cards" };
    }

    if (/\brunes?\b|ogham|futhorc|futhark/i.test(h)) {
      return { level: "reflective", kind: "runes" };
    }

    if (/i ching|zhou yi|bagua|hexagram|liu yao|mei hua|meihua|plum blossom|qimen|liu ren|xiao liu ren|xiaoliuren|ling qiqiao|yijing/i.test(h)) {
      return { level: "reflective", kind: "yijing" };
    }

    if (/if[aá]\b|odu\b|cowrie|búzio|dilogg|mérìnd|obi divination|\bafa\b|sikidy|hakata|ngombo|geomanc|ilm al-raml|ramala|jiaobei|kau chim|omikuji|cleromancy|belomancy|urim|shagai|dice|bone throw|maize|coca leaf|lot casting|lots\b|goralot/i.test(h)) {
      return { level: "reflective", kind: "lots" };
    }

    if (/dream book|dream incubation|oneiro|dream divin/i.test(h)) {
      return { level: "reflective", kind: "dreams" };
    }

    if (/pendulum|dowsing|radiesthes/i.test(h)) {
      return { level: "none", kind: "pendulum" };
    }

    if (/scry|mirror divin|crystal ball|hydromanc|capnomanc|ceromanc|oomanc|tea-leaf|tea leaf|coffee reading|tasseomanc|ink blot divin/i.test(h)) {
      return { level: "reflective", kind: "scry" };
    }

    if (/augury|haruspic|ornithomanc|bird flight|extispic|omen watching/i.test(h)) {
      return { level: "reflective", kind: "augury" };
    }

    if (/palmistry|chiromanc|shou xiang|mogu|sāmudrika|samudrika/i.test(h)) {
      return { level: "none", kind: "palm" };
    }

    if (/mian xiang|face reading|physiognom|metoposcop|mole reading|face divin/i.test(h)) {
      return { level: "none", kind: "face" };
    }

    if (/numerolog|abjad|gematria|isopsephy|seimei|name divination|anka jataka|tamil numerology|holy name/i.test(h)) {
      return { level: "none", kind: "numbers" };
    }

    if (/astrology|zodiac|bazi|zi wei|jyotish|vedic|saju|horary|natal chart|horoscope|four pillars|tứ trụ|tu tru|sanmeigaku|shichū|shichu|pawukon|weton|maramataka|panchanga|manazil|mazalot|tonalpohualli|tzolk|qizheng|tojeong|gunghap|mahabote|horasat|firdaria|decan|sukuyō|sukuyo|ben ming|chenggu|tie ban shen|falak|awdunigist|akan day|nine star|human design|astrocartography|tibetan astro|zurhai|western astrology|islamic astrology|egyptian decan/i.test(h)) {
      return { level: "none", kind: "astro" };
    }

    if (/bibliomanc|hafez|quranic lot|sortes|opened book|verse lot|bói kiều|boi kieu|kieu fortune/i.test(h)) {
      return { level: "reflective", kind: "book" };
    }

    if (/oracle bone|scapulimanc|futomani|kiboku|tortoise shell|plastron|shoulder blade|innu caribou/i.test(h)) {
      return { level: "reflective", kind: "scapula" };
    }

    if (/crab divin|spider|nggàm|nggam|fox track|dogon fox|dlera/i.test(h)) {
      return { level: "reflective", kind: "animal-path" };
    }

    if (/benge|poison oracle/i.test(h)) {
      return { level: "none", kind: "poison-oracle" };
    }

    if (/pythia|delphic|trance|shaking tent|machi|curandero|ayahuasca|tobacco vision|spirit consultation|sangoma|midewiwin|wauja|giriama spirit|draunikau/i.test(h)) {
      return { level: "cultural", kind: "spirit-counsel" };
    }

    if (/cezi|character divin|zāʾirja|zairja|written character/i.test(h)) {
      return { level: "reflective", kind: "glyph" };
    }

    if (/kurşun|kursun|lead pour|molybdomanc|tin\/wax|wax.*water|apple peel|chabashira|tea-stalk|tea stalk/i.test(h)) {
      return { level: "reflective", kind: "folk-shape" };
    }

    if (/nephomanc|cloud reading|pyromanc|flame|fire divin/i.test(h)) {
      return { level: "reflective", kind: "element-watch" };
    }

    if (/domino/i.test(h)) {
      return { level: "reflective", kind: "lots" };
    }

    if (/angel number/i.test(h)) {
      return { level: "none", kind: "numbers" };
    }

    if (/dream interpretation|dream omen|mesopotamian dream|fijian.*dream|mapuche dream/i.test(h)) {
      return { level: "reflective", kind: "dreams" };
    }

    if (/fá \(fon\)|fon counterpart|amathambo|zulu bones|ashtamangala|ling qi jing|lingqijing/i.test(h)) {
      return { level: "reflective", kind: "lots" };
    }

    if (/hawaiian kilo|micronesian star|star path navigation/i.test(h)) {
      return { level: "env", kind: "env-nav" };
    }

    if (/despacho|offering omen|quechua/i.test(h)) {
      return { level: "cultural", kind: "offering" };
    }

    if (/slavic folk|svyatki|mordovian|yuletide|midsummer/i.test(h)) {
      return { level: "reflective", kind: "folk-shape" };
    }

    if (/png smoke|smoke \/ sorcery|sorcery oracle/i.test(h)) {
      return { level: "reflective", kind: "element-watch" };
    }

    if (method.type === "Fate") return { level: "none", kind: "fate-birth" };
    if (method.type === "Form") return { level: "none", kind: "form" };
    return { level: "reflective", kind: "symbolic" };
  }

  function reasoningFor(method, kind) {
    if (BY_ID[method.id]) return BY_ID[method.id].reasoning;

    const L = lead(method);
    const bit = practiceBit(method);
    const practice = bit ? ` Practice note: ${bit}` : "";

    switch (kind) {
      case "biorhythm":
        return `${L}: fixed “biorhythm” cycles from birth date have been tested and do not beat chance for predicting performance or events.${practice}`;
      case "blood":
        return `${L}: ABO blood groups matter in medicine, but claims that blood type fixes personality or destiny lack reproducible scientific support.${practice}`;
      case "graphology":
        return `${L}: reading handwriting for character or fate is unsupported in controlled studies (distinct from forensic writer identification).${practice}`;
      case "mbti":
        return `${L}: self-report preference labels are contested in psychology and are not tools for forecasting life events.${practice}`;
      case "env-sky":
        return `${L} attends to real sky/atmosphere cues (twinkling, season, visibility). That can track weather and ecology. It is not a validated model of an individual’s personal fate or black swan events.${practice}`;
      case "spatial":
        return `${L} encodes cultural ideas of spatial harmony and practical habitat heuristics. Aesthetic or comfort effects are possible; claims that room layout determines cosmic destiny are not scientifically established.${practice}`;
      case "almanac":
        return `${L} organizes ritual and social timing in a cultural calendar. “Auspicious day” claims that the calendar controls outcomes are traditional prescriptions, not experimentally verified predictors of personal success or disaster.${practice}`;
      case "cards":
        return `${L} draws meaning from shuffled symbolic cards. Shuffle order is random; card images invite projection and storytelling. Useful as reflective narrative — not as evidence-based forecasting of concrete events.${practice}`;
      case "runes":
        return `${L} casts or draws letter-staves with associated glosses from Germanic/Celtic revival practice. The draw is stochastic; glosses are interpretive keywords, not demonstrated causal predictors of outcomes.${practice}`;
      case "yijing":
        return `${L} produces a hexagram/trigram figure (coins, numbers, or related Chinese cosmographic boards) and reads it through classical change-texts. Line generation is random or rule-based symbolism; the corpus is philosophical literature. Neither supplies validated personal prophecy.${practice}`;
      case "lots":
        return `${L} settles a question by casting lots, shells, seeds, bones, or similar tokens — a randomized or semi-randomized procedure wrapped in tradition-specific verses or patterns. Randomness plus interpretation can structure reflection; it does not meet scientific standards for predicting futures or black swans.${practice}`;
      case "dreams":
        return `${L} interprets dreams or incubation experiences. Dreams are real psychological events; specific omen codes that map dream images to future facts are not scientifically validated predictors.${practice}`;
      case "pendulum":
        return `${L} assigns yes/no (or direction) from a swinging weight. Motion is easily influenced by ideomotor effects — unconscious muscle micro-movements. That explains many “answers” without invoking predictive forces; it is not a reliable oracle for external events.${practice}`;
      case "scry":
        return `${L} reads shapes in smoke, wax, water, leaves, coffee, mirrors, or similar media. Pattern-finding in ambiguous stimuli (pareidolia) is a well-known human bias. It can spark metaphor; it does not demonstrate forecasting skill.${practice}`;
      case "augury":
        return `${L} reads public or natural signs (birds, entrails, smoke, etc.) in a traditional code. Historical societies used such codes for ritual decision-making. As a scientific predictor of personal outcomes under modern uncertainty, it has no validated track record.${practice}`;
      case "palm":
        return `${L} maps hand lines/shapes to character or destiny. Hands are real anatomy; chiromantic fate claims lack validated predictive power. Apparent “hits” are usually vague traits, cold reading, or confirmation bias.${practice}`;
      case "face":
        return `${L} infers character or fortune from facial features. Everyday social perception can notice mood or health cues; physiognomic destiny systems are not supported as predictive science and risk stereotype harm.${practice}`;
      case "numbers":
        return `${L} assigns destiny to names, dates, or letter–number values. Number systems are cultural mathematics; causal links from gematria/numerology to life outcomes have no demonstrated mechanism or trial-backed predictive validity.${practice}`;
      case "astro":
        return `${L} times character or events from birth/sky calendars. Birth time and planetary positions are astronomical facts; controlled tests of natal and judicial astrology do not show reliable prediction of personality or events beyond chance, Barnum effects, and selective memory.${practice}`;
      case "book":
        return `${L} opens a text “at random” and interprets the passage beside a question (bibliomancy). The line can be a useful prompt; chance page selection is not a validated channel for forecasting.${practice}`;
      case "scapula":
        return `${L} reads cracks in heated bone or shell (scapulimancy / oracle-bone style). Heat fracture is a physical process; mapping crack shapes to royal or personal futures is a cultural code without scientific predictive validation.${practice}`;
      case "animal-path":
        return `${L} lets an animal’s movement disturb a prepared field (sand, cards, water, shards). Animal behavior is real ethology; the oracular overlay that translates a path into destiny is symbolic, not a tested forecasting model.${practice}`;
      case "poison-oracle":
        return `${L} is documented historically as a high-stakes ordeal oracle. This site never simulates harm. As epistemology: ordeal outcomes are not ethical or scientific evidence about witchcraft, guilt, or fate, and must not be reenacted.${practice}`;
      case "spirit-counsel":
        return `${L} belongs to spirit-consultation, trance, or specialist healing lineages. These are living cultural/religious institutions with their own rules of authority. They are not laboratory-validated medical or predictive technologies; this atlas offers cultural learning only, never a substitute for care.${practice}`;
      case "glyph":
        return `${L} parses characters, letters, or diagram devices into component meanings. Linguistic and combinatorial play can be insightful as word-craft; it does not establish a causal channel from glyphs to future events.${practice}`;
      case "folk-shape":
        return `${L} reads chance shapes (wax, lead, peels, tea stalks, household rites). Ambiguous forms invite pareidolia — seeing meaning in noise — which is psychologically common and not evidence of prediction.${practice}`;
      case "element-watch":
        return `${L} interprets fire, smoke, or clouds as signs. Flames and weather are physical; omen codes laid on top are cultural. Useful as metaphor; not a validated forecast of personal outcomes.${practice}`;
      case "env-nav":
        return `${L} observes stars, ocean, birds, or weather for voyage and communal timing. Environmental observation can be genuinely skillful for navigation and season. Extending those cues into personal destiny claims leaves the domain of tested environmental knowledge.${practice}`;
      case "offering":
        return `${L} reads how offerings burn or are received in ritual. Within its tradition this is religious communication; scientifically it is not a demonstrated predictor of secular outcomes and should not replace practical planning.${practice}`;
      case "fate-birth":
        return `${L} is a birth-timed destiny framework. Such systems are culturally rich mnemonics for identity and timing. Scientific evidence does not support them as reliable predictors of an individual’s future or of black swan shocks.${practice}`;
      case "form":
        return `${L} reads visible form (body, object, or offered image) for fortune. Observation can start a conversation; form-to-fate inference is not established predictive science and must not replace medical or safety judgment.${practice}`;
      case "symbolic":
      default:
        return `${L} uses symbolic or omen procedures from its tradition.${practice} Symbols may aid reflection and cultural learning; they do not meet scientific standards for forecasting under deep uncertainty or black swan events.`;
    }
  }

  function scienceStatusFor(method) {
    const { level, kind } = classify(method);
    const meta = LEVELS[level] || LEVELS.reflective;
    return {
      levelId: meta.id,
      label: meta.short,
      tag: meta.tag,
      kind,
      reasoning: reasoningFor(method, kind),
    };
  }

  function readingScienceBlock(method) {
    const s = scienceStatusFor(method);
    return {
      ...s,
      advisory: GLOBAL_ADVISORY.body,
    };
  }

  window.FATE_SCIENCE_LEVELS = LEVELS;
  window.FATE_GLOBAL_ADVISORY = GLOBAL_ADVISORY;
  window.fateScienceStatusFor = scienceStatusFor;
  window.fateReadingScienceBlock = readingScienceBlock;
  window.fateScienceClassify = classify;
})();
