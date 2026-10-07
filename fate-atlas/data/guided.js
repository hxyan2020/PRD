/**
 * Featured guided rites with tradition-accurate steps:
 * 八卦 (Bagua / coin hexagram), MBTI, 塔罗牌 (Tarot).
 */
(function () {
  "use strict";

  const TRIGRAMS = {
    "111": { name: "乾 Qián", symbol: "☰", nature: "天 Heaven", trait: "Creative force, leadership, initiative", advice: "Act with integrity; your will can shape the field—avoid arrogance." },
    "000": { name: "坤 Kūn", symbol: "☷", nature: "地 Earth", trait: "Receptivity, support, patience", advice: "Yield and nourish; strength now is in carrying, not commanding." },
    "100": { name: "震 Zhèn", symbol: "☳", nature: "雷 Thunder", trait: "Shock, awakening, movement", advice: "A jolt clears fog—move after the first clap, not before." },
    "011": { name: "巽 Xùn", symbol: "☴", nature: "风 Wind", trait: "Penetration, gentle influence", advice: "Enter sideways; soft persistence outlasts force." },
    "010": { name: "坎 Kǎn", symbol: "☵", nature: "水 Water", trait: "Danger, depth, sincerity", advice: "Stay true in the gorge; do not pretend the cliff is a meadow." },
    "101": { name: "离 Lí", symbol: "☲", nature: "火 Fire", trait: "Clarity, attachment, radiance", advice: "Shine without clinging; clarity fades when you grip the flame." },
    "001": { name: "艮 Gèn", symbol: "☶", nature: "山 Mountain", trait: "Stillness, boundary, stopping", advice: "Stop at the right ridge; rest is strategy, not defeat." },
    "110": { name: "兑 Duì", symbol: "☱", nature: "泽 Lake", trait: "Joy, exchange, speech", advice: "Speak and share—but joy that costs your center is not joy." },
  };

  // King Wen-ish sample of 64 via upper/lower nature names + counsel
  const HEX_COUNSEL = {
    "乾乾": { title: "乾为天 Qián", meaning: "Pure creative energy. Begin boldly; renew yourself daily." },
    "坤坤": { title: "坤为地 Kūn", meaning: "Pure receptivity. Support others and the path supports you." },
    "坎离": { title: "水火既济 Jì Jì", meaning: "Water above fire—things in place. Complete carefully; do not grow careless." },
    "离坎": { title: "火水未济 Wèi Jì", meaning: "Not yet complete. Keep going; the crossing is unfinished but possible." },
    "震乾": { title: "雷天大壮 Dà Zhuàng", meaning: "Great power rising. Use force justly; excess breaks the axle." },
    "坤震": { title: "地雷复 Fù", meaning: "Return. A cycle renews from the bottom—small correct moves matter." },
    "艮坤": { title: "山地剥 Bō", meaning: "Stripping away. Let what is finished fall; protect the core." },
    "兑坤": { title: "泽地萃 Cuì", meaning: "Gathering. People and resources collect—lead with sincerity." },
    "巽离": { title: "风火家人 Jiā Rén", meaning: "Family / inner circle. Order the near before the far." },
    "离巽": { title: "火风鼎 Dǐng", meaning: "The cauldron. Transform raw into nourishment; refine your craft." },
  };

  function trigramFromBits(bits) {
    // bits: array of 0/1 from bottom to top (3 lines)
    const key = bits.map(String).join("");
    return TRIGRAMS[key] || TRIGRAMS["111"];
  }

  function lineFromCoins(coins) {
    // coins: array of 2 or 3 (tails=2, heads=3) classic method
    const sum = coins.reduce((a, b) => a + b, 0);
    // 6 old yin (changing to yang), 7 young yang, 8 young yin, 9 old yang (changing to yin)
    const changing = sum === 6 || sum === 9;
    const yang = sum === 7 || sum === 9;
    return { sum, yang, changing, symbol: yang ? (changing ? "⚊○" : "⚊") : changing ? "⚋×" : "⚋" };
  }

  function tossThreeCoins(rng) {
    return [0, 1, 2].map(() => (rng() < 0.5 ? 2 : 3));
  }

  function defaultHexCounsel(lower, upper) {
    const key = upper.name.slice(0, 1) + lower.name.slice(0, 1);
    // fallback by natures
    const byNature = HEX_COUNSEL[upper.name.charAt(0) + lower.name.charAt(0)];
    if (HEX_COUNSEL[upper.name.slice(0, 1) + lower.name.slice(0, 1)]) {
      return HEX_COUNSEL[upper.name.slice(0, 1) + lower.name.slice(0, 1)];
    }
    return {
      title: `${upper.symbol}${lower.symbol} ${upper.name.split(" ")[0]}上${lower.name.split(" ")[0]}下`,
      meaning: `Upper ${upper.nature}, lower ${lower.nature}. ${upper.trait}. Below: ${lower.trait}.`,
    };
  }

  function interpretHexagram(lines) {
    // lines[0] = bottom (初爻)
    const lowerBits = lines.slice(0, 3).map((l) => (l.yang ? 1 : 0));
    const upperBits = lines.slice(3, 6).map((l) => (l.yang ? 1 : 0));
    const lower = trigramFromBits(lowerBits);
    const upper = trigramFromBits(upperBits);
    const changingIdx = lines.map((l, i) => (l.changing ? i : -1)).filter((i) => i >= 0);
    const changed = lines.map((l) => ({
      yang: l.changing ? !l.yang : l.yang,
      changing: false,
    }));
    const lower2 = trigramFromBits(changed.slice(0, 3).map((l) => (l.yang ? 1 : 0)));
    const upper2 = trigramFromBits(changed.slice(3, 6).map((l) => (l.yang ? 1 : 0)));

    const key = upper.name.charAt(0) + lower.name.charAt(0);
    const known = HEX_COUNSEL[`${upper.name.split(" ")[0]}${lower.name.split(" ")[0]}`];
    const primary =
      known ||
      {
        title: `${upper.symbol}${lower.symbol} ${upper.name.split(" ")[0]} / ${lower.name.split(" ")[0]}`,
        meaning: `${upper.nature} over ${lower.nature}. ${upper.advice} ${lower.advice}`,
      };

    return {
      lower,
      upper,
      primary,
      changingIdx,
      changed:
        changingIdx.length > 0
          ? {
              title: `${upper2.symbol}${lower2.symbol} → ${upper2.name.split(" ")[0]} / ${lower2.name.split(" ")[0]}`,
              meaning: `Transformed hexagram: ${upper2.nature} over ${lower2.nature}. ${upper2.advice}`,
              upper: upper2,
              lower: lower2,
            }
          : null,
      lines,
    };
  }

  // ——— Tarot Major Arcana ———
  const MAJOR = [
    { id: 0, name: "The Fool", nameZh: "愚者", upright: "A leap of faith; begin before you feel ready.", reversed: "Recklessness or frozen hesitation—check the cliff edge." },
    { id: 1, name: "The Magician", nameZh: "魔术师", upright: "You have the tools; focus intent into one act.", reversed: "Scattered will or unused talent—gather yourself." },
    { id: 2, name: "The High Priestess", nameZh: "女祭司", upright: "Trust the quiet knowing; not all answers are loud.", reversed: "Secrets or ignored intuition—listen inward." },
    { id: 3, name: "The Empress", nameZh: "女皇", upright: "Growth, care, and abundance through nurture.", reversed: "Depletion or smothering—restore your roots." },
    { id: 4, name: "The Emperor", nameZh: "皇帝", upright: "Structure and authority; build a lasting frame.", reversed: "Rigidity or weak boundaries—reclaim order without tyranny." },
    { id: 5, name: "The Hierophant", nameZh: "教皇", upright: "Tradition, teaching, shared belief as guide.", reversed: "Break a stale rule; seek living wisdom." },
    { id: 6, name: "The Lovers", nameZh: "恋人", upright: "Alignment of values; a meaningful choice of heart.", reversed: "Misalignment or avoidance of a true choice." },
    { id: 7, name: "The Chariot", nameZh: "战车", upright: "Willpower steers opposing forces toward a goal.", reversed: "Loss of direction—rein in competing drives." },
    { id: 8, name: "Strength", nameZh: "力量", upright: "Gentle courage tames what force cannot.", reversed: "Self-doubt or harsh control—soften your grip." },
    { id: 9, name: "The Hermit", nameZh: "隐者", upright: "Solitude for insight; the lamp is yours to carry.", reversed: "Isolation or refusal to seek counsel." },
    { id: 10, name: "Wheel of Fortune", nameZh: "命运之轮", upright: "A turn of cycle; ride the change consciously.", reversed: "Resistance to change—adapt or be spun." },
    { id: 11, name: "Justice", nameZh: "正义", upright: "Truth and consequence; weigh fairly.", reversed: "Bias or avoided accountability—rebalance." },
    { id: 12, name: "The Hanged Man", nameZh: "倒吊人", upright: "Surrender for a new view; pause is productive.", reversed: "Stalling or sacrifice without meaning." },
    { id: 13, name: "Death", nameZh: "死神", upright: "Ending that clears space for rebirth.", reversed: "Clinging to what is already over." },
    { id: 14, name: "Temperance", nameZh: "节制", upright: "Blend opposites; patience mixes the elixir.", reversed: "Excess or impatience—restore the middle way." },
    { id: 15, name: "The Devil", nameZh: "恶魔", upright: "Name the chain; attachment can be unhooked.", reversed: "Release begins—or denial deepens." },
    { id: 16, name: "The Tower", nameZh: "高塔", upright: "Sudden truth topples false structures.", reversed: "Delayed collapse—or fear of necessary change." },
    { id: 17, name: "The Star", nameZh: "星星", upright: "Hope and healing after the storm.", reversed: "Dimmed faith—reconnect to a small light." },
    { id: 18, name: "The Moon", nameZh: "月亮", upright: "Dreams and uncertainty; feel before you conclude.", reversed: "Confusion clearing—or illusions exposed." },
    { id: 19, name: "The Sun", nameZh: "太阳", upright: "Warm clarity, vitality, honest success.", reversed: "Temporary cloud; joy is delayed, not denied." },
    { id: 20, name: "Judgement", nameZh: "审判", upright: "Awakening call; answer who you are becoming.", reversed: "Self-judgment or ignored calling." },
    { id: 21, name: "The World", nameZh: "世界", upright: "Completion and integration; a cycle fulfilled.", reversed: "Almost there—close the last gap." },
  ];

  const TAROT_POSITIONS = [
    { id: "past", label: "Past / 过去", hint: "What shaped this moment" },
    { id: "present", label: "Present / 现在", hint: "The heart of the matter" },
    { id: "path", label: "Path / 指引", hint: "Counsel for the road ahead" },
  ];

  // ——— MBTI ———
  const MBTI_QUESTIONS = [
    { id: "ei1", dim: "EI", text: "At a gathering, you usually…", a: { label: "Feel energized talking with many people", side: "E" }, b: { label: "Prefer a few deep conversations—or quiet", side: "I" } },
    { id: "ei2", dim: "EI", text: "After a long day, you recharge by…", a: { label: "Going out or messaging friends", side: "E" }, b: { label: "Being alone with your thoughts", side: "I" } },
    { id: "ei3", dim: "EI", text: "When solving a problem, you tend to…", a: { label: "Think out loud with others", side: "E" }, b: { label: "Work it through privately first", side: "I" } },
    { id: "sn1", dim: "SN", text: "You trust information that is…", a: { label: "Concrete, proven, and present-focused", side: "S" }, b: { label: "Pattern-based, future possibilities", side: "N" } },
    { id: "sn2", dim: "SN", text: "You prefer instructions that are…", a: { label: "Step-by-step and practical", side: "S" }, b: { label: "Big-picture with room to invent", side: "N" } },
    { id: "sn3", dim: "SN", text: "In conversation you notice…", a: { label: "Facts, details, and what was said", side: "S" }, b: { label: "Meanings, metaphors, and what was implied", side: "N" } },
    { id: "tf1", dim: "TF", text: "A tough decision is better when you…", a: { label: "Weigh logic and consistent principles", side: "T" }, b: { label: "Weigh people, harmony, and values", side: "F" } },
    { id: "tf2", dim: "TF", text: "Feedback you give tends to be…", a: { label: "Direct and truth-first", side: "T" }, b: { label: "Careful of feelings and encouragement", side: "F" } },
    { id: "tf3", dim: "TF", text: "You are more convinced by…", a: { label: "A clear analysis", side: "T" }, b: { label: "A sincere personal story", side: "F" } },
    { id: "jp1", dim: "JP", text: "Your ideal weekend is…", a: { label: "Planned with a satisfying checklist", side: "J" }, b: { label: "Open, flexible, see what happens", side: "P" } },
    { id: "jp2", dim: "JP", text: "Deadlines make you…", a: { label: "Finish early and tidy loose ends", side: "J" }, b: { label: "Do your best work near the edge", side: "P" } },
    { id: "jp3", dim: "JP", text: "You feel better when…", a: { label: "Decisions are made and settled", side: "J" }, b: { label: "Options stay open a little longer", side: "P" } },
  ];

  const MBTI_TYPES = {
    INTJ: { title: "Architect", fate: "You build long games. Fate favors private mastery that later becomes public structure.", path: "Commit to one blueprint; finish before starting three more." },
    INTP: { title: "Logician", fate: "Insight arrives in quiet. Your fortune grows when curiosity is given a container.", path: "Ship a small version of the idea you keep refining." },
    ENTJ: { title: "Commander", fate: "Momentum follows decisive leadership. Watch for allies you might overlook.", path: "Delegate one control point; strength multiplies." },
    ENTP: { title: "Debater", fate: "Opportunity loves your improvisation—ground it or it scatters.", path: "Pick one debate worth winning this month." },
    INFJ: { title: "Advocate", fate: "You sense the hidden thread. Fate asks you to trust the vision and rest the body.", path: "Protect solitude; your counsel needs charge." },
    INFP: { title: "Mediator", fate: "Meaning is your compass. Fortune comes when values become a craft.", path: "Make one beautiful thing that serves another person." },
    ENFJ: { title: "Protagonist", fate: "People gather where you warm the room. Guard against carrying everyone.", path: "Ask for help once without apologizing." },
    ENFP: { title: "Campaigner", fate: "Sparks and doors open around you. Depth keeps the flame from burning out.", path: "Finish the project that still excites your chest." },
    ISTJ: { title: "Logistician", fate: "Reliability is rare magic. Systems you tend become quiet wealth.", path: "Allow one controlled experiment outside the manual." },
    ISFJ: { title: "Defender", fate: "Care is your power. Fate asks you to include yourself in the circle you protect.", path: "Say no once; keep the yes that matters." },
    ESTJ: { title: "Executive", fate: "Order creates harvest. Soften the edge so loyalty can grow.", path: "Listen fully before the next directive." },
    ESFJ: { title: "Consul", fate: "Belonging multiplies around you. Boundaries keep the feast from emptying you.", path: "Schedule recovery as firmly as duty." },
    ISTP: { title: "Virtuoso", fate: "Skill under pressure is your luck. Trouble teaches your hands.", path: "Teach one trick; mastery deepens when shared." },
    ISFP: { title: "Adventurer", fate: "Beauty and freedom call you. Anchors help the art survive.", path: "Claim a gentle routine that still feels like yours." },
    ESTP: { title: "Entrepreneur", fate: "The live moment is your arena. Reflection turns wins into wisdom.", path: "Pause one beat before the next leap." },
    ESFP: { title: "Entertainer", fate: "Joy opens doors. Substance keeps the stage from becoming a trap.", path: "Invest in one relationship that isn’t a performance." },
  };

  function mulberry32(a) {
    return function () {
      let t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashSeed(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function shuffle(arr, rng) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function scoreMbti(answers) {
    const score = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
    MBTI_QUESTIONS.forEach((q) => {
      const side = answers[q.id];
      if (side) score[side] += 1;
    });
    const type =
      (score.E >= score.I ? "E" : "I") +
      (score.S >= score.N ? "S" : "N") +
      (score.T >= score.F ? "T" : "F") +
      (score.J >= score.P ? "J" : "P");
    return { type, score, meta: MBTI_TYPES[type] };
  }

  function generateBaguaReading(input) {
    const rng = mulberry32(hashSeed(`bagua|${input.question}|${input.nonce}|${(input.lines || []).map((l) => l.sum).join(",")}`));
    const lines = input.lines && input.lines.length === 6
      ? input.lines
      : Array.from({ length: 6 }, () => lineFromCoins(tossThreeCoins(rng)));
    const hex = interpretHexagram(lines);
    const changingNote =
      hex.changingIdx.length === 0
        ? "No changing lines—read the primary hexagram as a stable counsel."
        : hex.changingIdx.length === 1
          ? `One changing line at position ${hex.changingIdx[0] + 1} (from the bottom). Weight that line’s movement.`
          : `${hex.changingIdx.length} changing lines—read the primary hexagram, then the transformed one.`;

    return {
      kind: "bagua",
      title: hex.primary.title,
      omen: `${hex.upper.symbol} over ${hex.lower.symbol}`,
      verdict: hex.primary.meaning,
      counsel: hex.upper.advice,
      timing: hex.changed ? hex.changed.meaning : hex.lower.advice,
      details: [
        input.question ? `Question / 所问：${input.question}` : "Open reading / 无特定问题",
        `Lower trigram 下卦：${hex.lower.symbol} ${hex.lower.name} — ${hex.lower.nature}`,
        `Upper trigram 上卦：${hex.upper.symbol} ${hex.upper.name} — ${hex.upper.nature}`,
        changingNote,
        hex.changed ? `Changed hexagram 变卦：${hex.changed.title}` : "Stable hexagram 静卦",
      ],
      hex,
      lines,
      disclaimer:
        "Educational simulation of the three-coin Yì method (铜钱起卦). Reflective only—not a validated forecast. May be inaccurate; cannot predict black swan events.",
    };
  }

  function generateTarotReading(input) {
    const rng = mulberry32(hashSeed(`tarot|${input.question}|${input.nonce}`));
    const deck = shuffle(MAJOR, rng);
    const drawn = (input.drawn && input.drawn.length === 3)
      ? input.drawn
      : [0, 1, 2].map((i) => {
          const card = deck[i];
          const reversed = rng() < 0.3;
          return { ...card, reversed };
        });
    const positions = TAROT_POSITIONS;
    return {
      kind: "tarot",
      title: drawn.map((c) => `${c.nameZh} ${c.name}${c.reversed ? " (Rx)" : ""}`).join(" · "),
      omen: "Past · Present · Path / 过去 · 现在 · 指引",
      verdict: drawn[1].reversed ? drawn[1].reversed : drawn[1].upright,
      counsel: drawn[2].reversed ? drawn[2].reversed : drawn[2].upright,
      timing: "Let the Path card set the next seven days’ tone.",
      details: drawn.map((c, i) => {
        const mean = c.reversed ? c.reversed : c.upright;
        return `${positions[i].label} — ${c.name} / ${c.nameZh}${c.reversed ? " (reversed)" : ""}: ${mean}`;
      }),
      drawn,
      positions,
      disclaimer:
        "Major Arcana three-card spread for reflection. Simulated shuffle—not a validated forecast. May be inaccurate; cannot predict black swan events.",
    };
  }

  function generateMbtiReading(input) {
    const { type, score, meta } = scoreMbti(input.answers || {});
    return {
      kind: "mbti",
      title: `${type} — ${meta.title}`,
      omen: `E${score.E}/I${score.I} · S${score.S}/N${score.N} · T${score.T}/F${score.F} · J${score.J}/P${score.P}`,
      verdict: meta.fate,
      counsel: meta.path,
      timing: "Revisit this map when a life choice presses—type is preference, not prison.",
      details: [
        input.focus ? `Focus held：${input.focus}` : "General path reading",
        `Extraversion ${score.E} vs Introversion ${score.I}`,
        `Sensing ${score.S} vs Intuition ${score.N}`,
        `Thinking ${score.T} vs Feeling ${score.F}`,
        `Judging ${score.J} vs Perceiving ${score.P}`,
        "MBTI describes preference patterns; use it as a mirror, not a verdict on worth.",
      ],
      type,
      score,
      meta,
      disclaimer:
        "Simplified MBTI-style preference quiz for self-reflection—not a clinical assessment or fate forecast. Preferences ≠ destiny; cannot predict black swan events.",
    };
  }

  window.FATE_GUIDED = {
    TRIGRAMS,
    MAJOR,
    TAROT_POSITIONS,
    MBTI_QUESTIONS,
    MBTI_TYPES,
    lineFromCoins,
    tossThreeCoins,
    interpretHexagram,
    shuffle,
    mulberry32,
    hashSeed,
    scoreMbti,
    generateBaguaReading,
    generateTarotReading,
    generateMbtiReading,
  };

  // Featured method definitions merged at runtime if missing
  window.FATE_FEATURED_METHODS = [
    {
      id: "bagua",
      name: "八卦 / Bagua (Coin Hexagram)",
      continent: "Asia",
      countries: ["China", "Taiwan", "Hong Kong", "Singapore"],
      region: "China · Yijing",
      type: "Omen",
      summary: "三枚铜钱起卦：连掷六次，自下而上成八卦重卦（六十四卦），读本卦与变爻。",
      source: "Yijing coin method · 铜钱起卦",
      guided: "bagua",
      featured: true,
    },
    {
      id: "mbti",
      name: "MBTI Personality Fate",
      continent: "North America",
      countries: ["United States"],
      region: "Modern psychology-inspired",
      type: "Form",
      summary: "Answer preference questions across E/I, S/N, T/F, J/P to receive your type and a path-style fate reading.",
      source: "MBTI-inspired preference model (simplified)",
      guided: "mbti",
      featured: true,
    },
    {
      id: "tarot",
      name: "塔罗牌 / Tarot (Major Arcana)",
      continent: "Europe",
      countries: ["Italy", "France", "Switzerland", "United Kingdom"],
      region: "Europe",
      type: "Omen",
      summary: "洗牌、切牌、抽出三张大阿卡纳：过去 · 现在 · 指引，逐步翻开解读。",
      source: "Tarot Major Arcana tradition",
      guided: "tarot",
      featured: true,
    },
  ];
})();
