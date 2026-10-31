/**
 * Oceanic sky, moon, and spirit oracles — unique steps, visuals, readings.
 * Maramataka · Tahitian nights · Aboriginal sky · Torres scintillation ·
 * Hawaiian kilo · Samoan tofa · Fijian draunikau · PNG smoke · Micronesian stars
 */
(function () {
  "use strict";

  const IDS = [
    "maori-moon",
    "tahitian-moon",
    "aboriginal-sky",
    "torres-scintillation",
    "hawaiian-kilo",
    "samoan-tofa",
    "fijian-draunikau",
    "png-smoke",
    "micronesian-stars",
  ];

  function isZh() {
    try {
      return String(window.FatumI18n?.getLocale?.() || "").startsWith("zh");
    } catch (_) {
      return false;
    }
  }
  function isHant() {
    try {
      return String(window.FatumI18n?.getLocale?.() || "").startsWith("zh-Hant");
    } catch (_) {
      return false;
    }
  }
  function loc(obj) {
    if (!obj) return "";
    if (typeof obj === "string") return obj;
    if (isZh()) return (isHant() && obj.hant) || obj.zh || obj.en || "";
    return obj.en || obj.zh || "";
  }
  function zhText(hans, hant) {
    return isHant() ? hant || hans : hans;
  }
  function pick(rng, arr) {
    return arr[Math.floor(rng() * arr.length) % arr.length];
  }
  function mulberry32(a) {
    return function () {
      let t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function seedFrom(q, nonce, salt) {
    let h = 2166136261;
    const s = `${q || ""}|${nonce || 0}|${salt || ""}`;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function pack(r) {
    const RM = window.FatumResultModel;
    const base = {
      kind: "oceanic",
      ...r,
      disclaimer: isZh()
        ? zhText(
            "教育性模拟——不能替代受训航海／观天／灵询实践，也不能替代医疗、法律或安全判断。可能不准确；无法预测黑天鹅事件。",
            "教育性模擬——不能替代受訓航海／觀天／靈詢實踐，也不能替代醫療、法律或安全判斷。可能不準確；無法預測黑天鵝事件。"
          )
        : "Educational simulation — not a substitute for trained navigation/skywatching/spirit-counsel practice, medicine, law, or safety judgment. May be inaccurate; cannot predict black swan events.",
    };
    return RM ? RM.structuredReading(base) : base;
  }
  function interpretQ(q, lean, mechanic) {
    const RM = window.FatumResultModel;
    const body = isZh()
      ? zhText(
          `你关注的是「${q || "未写明的事"}」。以${mechanic}给出的「${lean}」倾向为镜：先改一件你能控制的安排，再用日常证据核对。`,
          `你關注的是「${q || "未寫明的事"}」。以${mechanic}給出的「${lean}」傾向為鏡：先改一件你能控制的安排，再用日常證據核對。`
        )
      : `You focused on “${q || "an unnamed matter"}”. Hold the “${lean}” lean from ${mechanic} as a mirror: change one arrangement you control, then check ordinary evidence.`;
    return RM ? RM.interpretWithQuestion(q, body) : body;
  }
  function howPack(en, zh, hant) {
    return { en, zh, hant: hant || zh };
  }
  function omen(en, zh, leanEn, leanZh, leanHant) {
    return { en, zh, lean: { en: leanEn, zh: leanZh, hant: leanHant || leanZh } };
  }
  function stepsHow(enIntro, enSteps, zhIntro, zhSteps, hantIntro, hantSteps) {
    return howPack(
      { intro: enIntro, steps: enSteps.map(([t, b]) => ({ title: t, body: b })) },
      { intro: zhIntro, steps: zhSteps.map(([t, b]) => ({ title: t, body: b })) },
      { intro: hantIntro, steps: hantSteps.map(([t, b]) => ({ title: t, body: b })) }
    );
  }

  const MARAMA = [
    omen("Whiro night", "Whiro 夜", "rest · avoid heavy starts", "歇·勿重起", "歇·勿重起"),
    omen("Rakaunui full", "Rakaunui 满", "gather · fish or feast", "聚会·渔或宴", "聚會·漁或宴"),
    omen("Ōuenuku clear", "Ōuenuku 清", "plant · tend roots", "播种·护根", "播種·護根"),
    omen("Tangaroa sea", "Tangaroa 海", "travel water · check tide", "水路·查潮", "水路·查潮"),
  ];
  const PO = [
    omen("Ore’ore night", "Ore’ore 夜", "quiet work · stay inland", "静工·留岸", "靜工·留岸"),
    omen("Ari full path", "Ari 满径", "open path · go social", "路开·社交", "路開·社交"),
    omen("Tā’u planting", "Tā’u 播种", "sow · water gently", "播·轻浇", "播·輕澆"),
    omen("Mahea rest", "Mahea 歇", "pause · mend nets", "停·补网", "停·補網"),
  ];
  const SKYAU = [
    omen("Emu in the sky", "天中鸸鹋", "season shift · store food", "季变·贮粮", "季變·貯糧"),
    omen("Seven sisters rise", "七姐妹升", "story time · share lore", "故事时·传知", "故事時·傳知"),
    omen("Dark cloud river", "暗云河", "rain coming · prepare shelter", "雨将至·备棚", "雨將至·備棚"),
    omen("Morning star bright", "晨星亮", "travel early · go light", "早行·轻装", "早行·輕裝"),
  ];
  const MERIAM = [
    omen("Hard scintillation", "硬闪", "wind rising · delay sail", "风起·缓航", "風起·緩航"),
    omen("Soft steady glow", "柔稳光", "mild seas · good window", "海平·好窗口", "海平·好窗口"),
    omen("Rapid wet spark", "急湿闪", "wet weather · stay near shore", "湿季·近岸", "濕季·近岸"),
    omen("Cool clear pulse", "凉清脉", "cool air · observe longer", "凉气·多观察", "涼氣·多觀察"),
  ];
  const KILO = [
    omen("Cloud pillar east", "东云柱", "message from east · listen", "东讯·倾听", "東訊·傾聽"),
    omen("Bird cross path", "鸟横切", "omen of visitor · prepare", "客兆·预备", "客兆·預備"),
    omen("Ocean flat calm", "海平静", "council · speak evenly", "议事·平和说", "議事·平和說"),
    omen("Dream wave night", "夜梦浪", "incubate · note the dream", "孵梦·记下", "孵夢·記下"),
  ];
  const TOFA = [
    omen("Ancestral yes", "祖灵是", "yes · proceed with respect", "是·恭敬前行", "是·恭敬前行"),
    omen("Ancestral hold", "祖灵守", "hold · ask the matai", "守·问族长", "守·問族長"),
    omen("Soft blessing", "柔祝福", "bless · share food", "福·分享食物", "福·分享食物"),
    omen("Warning hush", "警示静", "caution · do not rush", "慎·勿赶", "慎·勿趕"),
  ];
  const FIJI = [
    omen("Dream of flood", "洪水梦", "cleanse · clear a path", "净·清路", "淨·清路"),
    omen("Dream of empty house", "空屋梦", "loss theme · mend bonds", "失主题·修关系", "失主題·修關係"),
    omen("Dream of canoe", "独木舟梦", "journey · pack carefully", "行·细心装", "行·細心裝"),
    omen("Dream of firelight", "火光梦", "reveal · name the fear", "显·说出恐惧", "顯·說出恐懼"),
  ];
  const PNG = [
    omen("Smoke toward accused", "烟向所指", "direction lean · verify gently", "方向倾向·温和核实", "方向傾向·溫和核實"),
    omen("Smoke breaks early", "烟早断", "interrupted · restart clean", "中断·干净重来", "中斷·乾淨重來"),
    omen("Smoke column calm", "烟柱稳", "steady · keep peace talk", "稳·守和谈", "穩·守和談"),
    omen("Smoke drifts sea", "烟漂海", "elsewhere · widen the ask", "别处·扩大问法", "別處·擴大問法"),
  ];
  const MICRO = [
    omen("Star path open", "星路开", "voyage window · depart fair", "出航窗·宜行", "出航窗·宜行"),
    omen("Swell from east", "东涌", "delay · wait settled swell", "缓·等涌平", "緩·等湧平"),
    omen("Zenith star sharp", "天顶星锐", "navigate · trust the line", "导航·信航线", "導航·信航線"),
    omen("Cloud wall ahead", "前云墙", "shelter · do not force night sail", "避·勿夜航", "避·勿夜航"),
  ];

  function rite(summary, how, steps, viz, castCta, pool, mechanicEn, mechanicZh, noteField) {
    return {
      summary,
      how,
      steps,
      viz,
      castCta,
      noteField: noteField || "question",
      buildCast(state, rng) {
        const item = pick(rng, pool);
        const note = state[noteField || "question"] || state.question || state.dayDate || state.dreamNote || "";
        return { item, note, lean: loc(item.lean) };
      },
      generate(q, cast) {
        const n = loc({ en: cast.item.en, zh: cast.item.zh });
        const ask = q || cast.note || "";
        return pack({
          title: cast.note ? `${cast.note} · ${n}` : n,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学示「${n}」，倾向「${cast.lean}」。太平洋知识镜子，不是科学预报。`, `教學示「${n}」，傾向「${cast.lean}」。太平洋知識鏡子，不是科學預報。`)
            : `Teaching shows “${n}”, leaning “${cast.lean}”. A Pacific knowledge mirror, not a scientific forecast.`,
          interpret: interpretQ(ask, cast.lean, isZh() ? mechanicZh : mechanicEn),
          details: cast.note ? [cast.note, n] : [n],
          doList: [
            isZh()
              ? zhText(`按「${cast.lean}」做一件今天可完成的小事。`, `按「${cast.lean}」做一件今天可完成的小事。`)
              : `Do one small today-action matching “${cast.lean}”.`,
          ],
          dontList: [
            isZh()
              ? zhText("不要用模拟星兆替代航海安全或受训知识持有者。", "不要用模擬星兆替代航海安全或受訓知識持有者。")
              : "Do not replace navigation safety or trained knowledge holders with a simulated omen.",
          ],
          tone: /wait|hold|rest|pause|delay|caution|歇|守|停|缓|慎|避/i.test(n + cast.lean) ? "caution" : "mixed",
          vizData: cast,
        });
      },
    };
  }

  const RITES = {
    "maori-moon": rite(
      {
        en: "Māori maramataka names ~30 moon nights that guide planting, fishing, and personal timing.",
        zh: "毛利月历（maramataka）约三十个月夜，指引播种、渔捞与个人时机。",
        hant: "毛利月曆（maramataka）約三十個月夜，指引播種、漁撈與個人時機。",
      },
      stepsHow(
        "You’ll pick a day, meet a teaching marama night, then read the lean.",
        [
          ["Meet Maramataka", "Moon nights · planting · fishing."],
          ["Pick a day", "Teaching calendar seed."],
          ["Meet the marama night", "Night name appears."],
          ["Read the marama counsel", "Night lean."],
          ["Marama counsel", "Lean for your day."],
        ],
        "你将选择日期、会见教学月夜，再读倾向。",
        [
          ["认识毛利月历", "月夜 · 播种 · 渔捞。"],
          ["选择日期", "教学历种。"],
          ["会见月夜", "夜名出现。"],
          ["读取月夜指引", "夜倾向。"],
          ["月夜指引", "对照日期。"],
        ],
        "你將選擇日期、會見教學月夜，再讀傾向。",
        [
          ["認識毛利月曆", "月夜 · 播種 · 漁撈。"],
          ["選擇日期", "教學曆種。"],
          ["會見月夜", "夜名出現。"],
          ["讀取月夜指引", "夜傾向。"],
          ["月夜指引", "對照日期。"],
        ]
      ),
      ["intent", "dayDate", "maramaNight", "maramaCounsel", "result"],
      "marama",
      { en: "Read the marama counsel", zh: "读取月夜指引", hant: "讀取月夜指引" },
      MARAMA,
      "the marama night",
      "月夜",
      "dayDate"
    ),

    "tahitian-moon": rite(
      {
        en: "Tahitian moon nights name lunar nights for activity and omen under Tahitian nomenclature.",
        zh: "塔希提月夜以本地命名论活动与兆象。",
        hant: "塔希提月夜以本地命名論活動與兆象。",
      },
      stepsHow(
        "You’ll pick a day, meet a teaching pō night, then read the lean.",
        [
          ["Meet Tahitian moon nights", "Named nights · activity."],
          ["Pick a day", "Teaching calendar seed."],
          ["Meet the pō night", "Night name appears."],
          ["Read the Tahitian counsel", "Night lean."],
          ["Tahitian counsel", "Lean for your day."],
        ],
        "你将选择日期、会见教学塔希提夜，再读倾向。",
        [
          ["认识塔希提月夜", "夜名 · 活动。"],
          ["选择日期", "教学历种。"],
          ["会见塔希提夜", "夜名出现。"],
          ["读取塔希提指引", "夜倾向。"],
          ["塔希提指引", "对照日期。"],
        ],
        "你將選擇日期、會見教學塔希提夜，再讀傾向。",
        [
          ["認識塔希提月夜", "夜名 · 活動。"],
          ["選擇日期", "教學曆種。"],
          ["會見塔希提夜", "夜名出現。"],
          ["讀取塔希提指引", "夜傾向。"],
          ["塔希提指引", "對照日期。"],
        ]
      ),
      ["intent", "dayDate", "poNight", "tahitiCounsel", "result"],
      "tahiti",
      { en: "Read the Tahitian counsel", zh: "读取塔希提指引", hant: "讀取塔希提指引" },
      PO,
      "the pō night",
      "塔希提夜",
      "dayDate"
    ),

    "aboriginal-sky": rite(
      {
        en: "Aboriginal Australian sky knowledge uses seasonal calendars and star lore for weather, food, and social timing.",
        zh: "澳大利亚原住民天象知识以季节历与星辰传说论天气、食物与社交时机。",
        hant: "澳大利亞原住民天象知識以季節曆與星辰傳說論天氣、食物與社交時機。",
      },
      stepsHow(
        "You’ll hold a question, watch a teaching season sky, then read a sky-sign lean.",
        [
          ["Meet Aboriginal sky knowledge", "Seasons · stars · timing."],
          ["Hold your question", "One clear ask."],
          ["Watch the season sky", "Sky opens."],
          ["See a sky sign", "Sign settles."],
          ["Read the sky counsel", "Sign lean."],
          ["Sky counsel", "Lean for your question."],
        ],
        "你将抱定问题、观看教学季节天空，再读天兆倾向。",
        [
          ["认识原住民天象", "季节 · 星 · 时机。"],
          ["抱定问题", "只留一个清楚的问。"],
          ["观看季节天空", "天空打开。"],
          ["查看天兆", "兆安定。"],
          ["读取天象指引", "兆倾向。"],
          ["天象指引", "对照问题。"],
        ],
        "你將抱定問題、觀看教學季節天空，再讀天兆傾向。",
        [
          ["認識原住民天象", "季節 · 星 · 時機。"],
          ["抱定問題", "只留一個清楚的問。"],
          ["觀看季節天空", "天空打開。"],
          ["查看天兆", "兆安定。"],
          ["讀取天象指引", "兆傾向。"],
          ["天象指引", "對照問題。"],
        ]
      ),
      ["intent", "question", "seasonSky", "skySignAU", "aborigCounsel", "result"],
      "aborig",
      { en: "Read the sky counsel", zh: "读取天象指引", hant: "讀取天象指引" },
      SKYAU,
      "the sky sign",
      "天兆"
    ),

    "torres-scintillation": rite(
      {
        en: "Torres Strait (Meriam) stellar scintillation gauges trade winds, wet weather, and temperature by star twinkling.",
        zh: "托雷斯海峡（Meriam）星闪以星光闪烁估信风、湿季与气温变化。",
        hant: "托雷斯海峽（Meriam）星閃以星光閃爍估信風、濕季與氣溫變化。",
      },
      stepsHow(
        "You’ll hold a question, watch Meriam teaching twinkle, then read the scintillation lean.",
        [
          ["Meet Torres scintillation", "Twinkle · wind · weather."],
          ["Hold your question", "One clear ask."],
          ["Watch Meriam twinkle", "Stars pulse."],
          ["See the scintillation", "Pattern settles."],
          ["Read the Torres counsel", "Twinkle lean."],
          ["Torres counsel", "Lean for your question."],
        ],
        "你将抱定问题、观看 Meriam 教学星闪，再读闪烁倾向。",
        [
          ["认识托雷斯星闪", "闪 · 风 · 天气。"],
          ["抱定问题", "只留一个清楚的问。"],
          ["观看 Meriam 星闪", "星脉动。"],
          ["查看闪烁", "格局安定。"],
          ["读取托雷斯指引", "闪倾向。"],
          ["托雷斯指引", "对照问题。"],
        ],
        "你將抱定問題、觀看 Meriam 教學星閃，再讀閃爍傾向。",
        [
          ["認識托雷斯星閃", "閃 · 風 · 天氣。"],
          ["抱定問題", "只留一個清楚的問。"],
          ["觀看 Meriam 星閃", "星脈動。"],
          ["查看閃爍", "格局安定。"],
          ["讀取托雷斯指引", "閃傾向。"],
          ["托雷斯指引", "對照問題。"],
        ]
      ),
      ["intent", "question", "watchMeriam", "meriamTwinkle", "torresCounsel", "result"],
      "torres",
      { en: "Read the Torres counsel", zh: "读取托雷斯指引", hant: "讀取托雷斯指引" },
      MERIAM,
      "the Meriam twinkle",
      "Meriam 星闪"
    ),

    "hawaiian-kilo": rite(
      {
        en: "Hawaiian kilo observation reads clouds, ocean, birds, and dreams for chiefly and communal guidance.",
        zh: "夏威夷 kilo 观象以云、海、鸟与梦作酋长与社群指引。",
        hant: "夏威夷 kilo 觀象以雲、海、鳥與夢作酋長與社群指引。",
      },
      stepsHow(
        "You’ll hold a question, watch with a teaching kilo lens, then read a sign lean.",
        [
          ["Meet Hawaiian kilo", "Cloud · ocean · bird · dream."],
          ["Hold your question", "One clear ask."],
          ["Watch as a kilo", "Observation opens."],
          ["See a kilo sign", "Sign settles."],
          ["Read the kilo counsel", "Sign lean."],
          ["Kilo counsel", "Lean for your question."],
        ],
        "你将抱定问题、以教学 kilo 观看，再读兆倾向。",
        [
          ["认识夏威夷 kilo", "云 · 海 · 鸟 · 梦。"],
          ["抱定问题", "只留一个清楚的问。"],
          ["以 kilo 观看", "观察打开。"],
          ["查看 kilo 兆", "兆安定。"],
          ["读取 kilo 指引", "兆倾向。"],
          ["kilo 指引", "对照问题。"],
        ],
        "你將抱定問題、以教學 kilo 觀看，再讀兆傾向。",
        [
          ["認識夏威夷 kilo", "雲 · 海 · 鳥 · 夢。"],
          ["抱定問題", "只留一個清楚的問。"],
          ["以 kilo 觀看", "觀察打開。"],
          ["查看 kilo 兆", "兆安定。"],
          ["讀取 kilo 指引", "兆傾向。"],
          ["kilo 指引", "對照問題。"],
        ]
      ),
      ["intent", "question", "kiloWatch", "kiloSign", "kiloCounsel", "result"],
      "kilo",
      { en: "Read the kilo counsel", zh: "读取 kilo 指引", hant: "讀取 kilo 指引" },
      KILO,
      "the kilo sign",
      "kilo 兆"
    ),

    "samoan-tofa": rite(
      {
        en: "Samoan tofa / spirit consultation seeks ancestral and spirit knowledge for decisions — teaching counsel only.",
        zh: "萨摩亚 tofa／灵询向祖先与灵知识求决——仅教学指引。",
        hant: "薩摩亞 tofa／靈詢向祖先與靈知識求決——僅教學指引。",
      },
      stepsHow(
        "You’ll hold a question, sit in a teaching tofa seat, then hear a spirit-word lean.",
        [
          ["Meet Samoan tofa", "Ancestral counsel · decisions."],
          ["Hold your question", "One clear ask."],
          ["Sit for tofa", "Teaching seat."],
          ["Hear the spirit word", "Word settles."],
          ["Read the tofa counsel", "Word lean."],
          ["Tofa counsel", "Lean for your question."],
        ],
        "你将抱定问题、坐入教学 tofa 席，再听灵语倾向。",
        [
          ["认识萨摩亚 tofa", "祖询 · 决断。"],
          ["抱定问题", "只留一个清楚的问。"],
          ["入 tofa 席", "教学席。"],
          ["听灵语", "话语安定。"],
          ["读取 tofa 指引", "话语倾向。"],
          ["tofa 指引", "对照问题。"],
        ],
        "你將抱定問題、坐入教學 tofa 席，再聽靈語傾向。",
        [
          ["認識薩摩亞 tofa", "祖詢 · 決斷。"],
          ["抱定問題", "只留一個清楚的問。"],
          ["入 tofa 席", "教學席。"],
          ["聽靈語", "話語安定。"],
          ["讀取 tofa 指引", "話語傾向。"],
          ["tofa 指引", "對照問題。"],
        ]
      ),
      ["intent", "question", "tofaSeat", "spiritWord", "tofaCounsel", "result"],
      "tofa",
      { en: "Read the tofa counsel", zh: "读取 tofa 指引", hant: "讀取 tofa 指引" },
      TOFA,
      "the spirit word",
      "灵语"
    ),

    "fijian-draunikau": rite(
      {
        en: "Fijian draunikau / dream omens use dream and specialist ritual readings for misfortune and remedy.",
        zh: "斐济 draunikau／梦兆以梦与专家仪轨论不幸与补救。",
        hant: "斐濟 draunikau／夢兆以夢與專家儀軌論不幸與補救。",
      },
      stepsHow(
        "You’ll note a dream image, meet a teaching draunikau rite, then read the lean.",
        [
          ["Meet Fijian draunikau", "Dream · rite · remedy."],
          ["Note a dream image", "What stood out?"],
          ["Meet the draunikau rite", "Teaching rite."],
          ["Read the dream counsel", "Dream lean."],
          ["Draunikau counsel", "Lean for your dream."],
        ],
        "你将记录梦象、会见教学 draunikau 仪轨，再读倾向。",
        [
          ["认识斐济 draunikau", "梦 · 仪轨 · 补救。"],
          ["记录梦象", "什么最醒目？"],
          ["会见 draunikau 仪轨", "教学仪轨。"],
          ["读取梦兆指引", "梦倾向。"],
          ["draunikau 指引", "对照梦象。"],
        ],
        "你將記錄夢象、會見教學 draunikau 儀軌，再讀傾向。",
        [
          ["認識斐濟 draunikau", "夢 · 儀軌 · 補救。"],
          ["記錄夢象", "什麼最醒目？"],
          ["會見 draunikau 儀軌", "教學儀軌。"],
          ["讀取夢兆指引", "夢傾向。"],
          ["draunikau 指引", "對照夢象。"],
        ]
      ),
      ["intent", "dreamNoteFiji", "draunikauRite", "fijiDreamCounsel", "result"],
      "fiji",
      { en: "Read the dream counsel", zh: "读取梦兆指引", hant: "讀取夢兆指引" },
      FIJI,
      "the dream omen",
      "梦兆",
      "dreamNote"
    ),

    "png-smoke": rite(
      {
        en: "New Guinea smoke / sorcery oracles use tobacco smoke direction and related signs to locate misfortune sources — teaching smoke drift only.",
        zh: "新几内亚烟／巫祝神谕以烟草烟向等兆定位不幸之源——仅教学烟向。",
        hant: "新幾內亞煙／巫祝神諭以煙草煙向等兆定位不幸之源——僅教學煙向。",
      },
      stepsHow(
        "You’ll hold a question, raise teaching PNG smoke, then read the direction lean.",
        [
          ["Meet PNG smoke oracles", "Smoke · direction · cause."],
          ["Hold your question", "One clear ask."],
          ["Raise the smoke", "Teaching smoke only."],
          ["See the smoke direction", "Direction settles."],
          ["Read the PNG counsel", "Direction lean."],
          ["PNG counsel", "Lean for your question."],
        ],
        "你将抱定问题、升起教学新几内亚烟，再读烟向倾向。",
        [
          ["认识新几内亚烟谕", "烟 · 方向 · 因。"],
          ["抱定问题", "只留一个清楚的问。"],
          ["升起烟", "仅教学烟。"],
          ["查看烟向", "方向安定。"],
          ["读取新几内亚指引", "烟向倾向。"],
          ["新几内亚指引", "对照问题。"],
        ],
        "你將抱定問題、升起教學新幾內亞煙，再讀煙向傾向。",
        [
          ["認識新幾內亞煙諭", "煙 · 方向 · 因。"],
          ["抱定問題", "只留一個清楚的問。"],
          ["升起煙", "僅教學煙。"],
          ["查看煙向", "方向安定。"],
          ["讀取新幾內亞指引", "煙向傾向。"],
          ["新幾內亞指引", "對照問題。"],
        ]
      ),
      ["intent", "question", "raisePngSmoke", "smokeDirPng", "pngCounsel", "result"],
      "png",
      { en: "Read the PNG counsel", zh: "读取新几内亚指引", hant: "讀取新幾內亞指引" },
      PNG,
      "the smoke direction",
      "烟向"
    ),

    "micronesian-stars": rite(
      {
        en: "Micronesian star-path navigation omens use star paths and ocean signs for voyage timing and condition reading.",
        zh: "密克罗尼西亚星路航海兆以星径与海象论出航时机与条件。",
        hant: "密克羅尼西亞星路航海兆以星徑與海象論出航時機與條件。",
      },
      stepsHow(
        "You’ll hold a question, trace a teaching star path, then read an ocean-sign lean.",
        [
          ["Meet Micronesian star paths", "Stars · swell · voyage."],
          ["Hold your question", "One clear ask."],
          ["Trace the star path", "Path lights."],
          ["See an ocean sign", "Sign settles."],
          ["Read the star-path counsel", "Sign lean."],
          ["Star-path counsel", "Lean for your question."],
        ],
        "你将抱定问题、描摹教学星路，再读海兆倾向。",
        [
          ["认识密克罗尼西亚星路", "星 · 涌 · 航。"],
          ["抱定问题", "只留一个清楚的问。"],
          ["描摹星路", "路点亮。"],
          ["查看海兆", "兆安定。"],
          ["读取星路指引", "兆倾向。"],
          ["星路指引", "对照问题。"],
        ],
        "你將抱定問題、描摹教學星路，再讀海兆傾向。",
        [
          ["認識密克羅尼西亞星路", "星 · 湧 · 航。"],
          ["抱定問題", "只留一個清楚的問。"],
          ["描摹星路", "路點亮。"],
          ["查看海兆", "兆安定。"],
          ["讀取星路指引", "兆傾向。"],
          ["星路指引", "對照問題。"],
        ]
      ),
      ["intent", "question", "starPath", "oceanSign", "microCounsel", "result"],
      "micro",
      { en: "Read the star-path counsel", zh: "读取星路指引", hant: "讀取星路指引" },
      MICRO,
      "the star path",
      "星路"
    ),
  };

  function has(id) {
    return IDS.includes(id) && !!RITES[id];
  }
  function get(id) {
    return RITES[id] || null;
  }
  function howFor(id) {
    const r = RITES[id];
    if (!r) return null;
    const packHow = isZh() ? (isHant() && r.how.hant ? r.how.hant : r.how.zh) : r.how.en;
    return {
      title: isZh() ? zhText("这个仪式怎么玩", "這個儀式怎麼玩") : "How this rite works",
      intro: packHow.intro,
      steps: packHow.steps,
      note: isZh()
        ? zhText(
            "本站为教育性游玩——不能替代受训航海／观天／灵询、医疗、法律或安全判断。",
            "本站為教育性遊玩——不能替代受訓航海／觀天／靈詢、醫療、法律或安全判斷。"
          )
        : "Educational play on this site — not a substitute for trained navigation/skywatching/spirit-counsel practice, medicine, law, or safety judgment.",
    };
  }
  function runCast(id, state) {
    const riteObj = RITES[id];
    if (!riteObj) return null;
    const seed = state.question || state.dreamNote || state.dayDate || state.focus;
    const rng = mulberry32(seedFrom(seed, state.nonce, id));
    const cast = Object.assign({}, state.cast || {}, riteObj.buildCast(state, rng) || {});
    return riteObj.generate(state.question || state.focus || state.dreamNote || state.dayDate || "", cast, rng);
  }

  window.FatumOceanicOracles = { IDS, has, get, howFor, runCast, loc };
})();
