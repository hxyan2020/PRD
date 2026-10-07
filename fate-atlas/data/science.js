/**
 * Epistemic / scientific-status labels for each method.
 * Honest about evidence: cultural value ≠ validated prediction.
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

  const RULES = [
    {
      re: /biorhythm/i,
      level: "falsified",
      reasoning:
        "Biorhythm theory has been empirically tested and does not outperform chance for predicting performance or events.",
    },
    {
      re: /blood type/i,
      level: "falsified",
      reasoning:
        "Blood-type personality claims lack reproducible scientific support; ABO type does not determine character or destiny.",
    },
    {
      re: /grapholog|handwriting/i,
      level: "falsified",
      reasoning:
        "Graphology as personality or fate diagnosis is not supported by controlled studies; handwriting analysis for identity is a separate forensic skill.",
    },
    {
      re: /mbti/i,
      level: "contested",
      reasoning:
        "MBTI-style inventories describe self-reported preferences. Scientific standing is mixed (reliability/validity debates). They are not instruments for predicting life events or black swans.",
    },
    {
      re: /stellar scintillation|star twinkl|torres strait|northern dene|aboriginal australian sky/i,
      level: "env",
      reasoning:
        "Watching how stars twinkle or seasonal sky patterns can track real atmospheric and ecological cues (weather/season). That is environmental observation—not a validated model of personal fate.",
    },
    {
      re: /astrology|zodiac|bazi|zi wei|jyotish|vedic|saju|horary|natal|horoscope|western astrology|islamic astrology|tibetan astro|mahabote|horasat|decan|firdaria|astrocart|human design|nine star|sukuy|panchanga|manazil|mazalot|tonalpohualli|tzolk|zurhai|qizheng|chenggu|tie ban|ben ming|tojeong|gunghap|weton|pawukon|maramataka|moon night|taksa|thai weekday|akan day|falak|awdunigist/i,
      level: "none",
      reasoning:
        "Natal and judicial astrology have been studied extensively; controlled tests do not show reliable prediction of personality or events beyond chance, Barnum effects, and selective memory.",
    },
    {
      re: /numerolog|abjad|gematria|isopsephy|seimei|name divination|anka|tamil numerology/i,
      level: "none",
      reasoning:
        "Assigning destiny to letter/number values has no demonstrated causal mechanism or predictive validity in scientific trials.",
    },
    {
      re: /palm|chiromanc|shou xiang|mogu|face|mian xiang|physiognom|metoposcop|mole|onychomanc|samudrika|aura/i,
      level: "none",
      reasoning:
        "Body-feature systems for character or destiny lack validated predictive power. Any “hits” are usually vague traits, confirmation bias, or ordinary observation—not proven fate mechanics.",
    },
    {
      re: /feng shui|vastu|kasō|kaso|ba zhai|flying star/i,
      level: "cultural",
      reasoning:
        "Spatial harmony traditions encode cultural aesthetics and practical habitat heuristics. Claims that layout determines cosmic destiny are not scientifically established.",
    },
    {
      re: /tarot|lenormand|kipper|sibilla|oracle card|cartomancy|runes|ogham|i ching|zhou yi|bagua|hexagram|if[aá]|cowrie|búzio|dilogg|sikidy|geomanc|bibliomancy|hafez|omikuji|kau chim|pendulum|dowsing|scry|haruspic|augur|dice|mo\b|shagai|dream/i,
      level: "reflective",
      reasoning:
        "Lot-casting and symbolic decks can prompt reflection (projection, narrative sense-making). Random draws are stochastic by design; they do not constitute evidence-based forecasting.",
    },
    {
      re: /almanac|rokuy|zeri|tongshu|day select/i,
      level: "cultural",
      reasoning:
        "Almanacs organize ritual and social timing. Auspicious-day claims about controlling outcomes are traditional, not experimentally verified predictors.",
    },
  ];

  function scienceStatusFor(method) {
    const hay = `${method.id || ""} ${method.name || ""} ${method.summary || ""} ${method.region || ""} ${method.type || ""}`;
    for (const rule of RULES) {
      if (rule.re.test(hay)) {
        const level = LEVELS[rule.level];
        return {
          levelId: level.id,
          label: level.short,
          tag: level.tag,
          reasoning: rule.reasoning,
        };
      }
    }
    if (method.type === "Fate") {
      return {
        levelId: "none",
        label: LEVELS.none.short,
        tag: LEVELS.none.tag,
        reasoning:
          "Birth-timed destiny systems are culturally rich but lack scientific evidence as reliable predictors of individual futures.",
      };
    }
    if (method.type === "Form") {
      return {
        levelId: "none",
        label: LEVELS.none.short,
        tag: LEVELS.none.tag,
        reasoning:
          "Form-reading for fortune is not supported as a predictive science; use only as cultural or reflective exploration.",
      };
    }
    return {
      levelId: "reflective",
      label: LEVELS.reflective.short,
      tag: LEVELS.reflective.tag,
      reasoning:
        "Symbolic or omen procedures may aid reflection. They do not meet scientific standards for forecasting, especially under deep uncertainty and black swan shocks.",
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
})();
