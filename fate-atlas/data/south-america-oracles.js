/**
 * South American oracles — unique steps, visuals, readings.
 * Búzios · Andean Wata · Coca · Wauja tobacco · Mapuche peuma · Ayahuasca vision · Despacho
 * (Teaching sims only — no real entheogens, smoke inhalation, or fire offerings.)
 */
(function () {
  "use strict";

  const IDS = [
    "buzios",
    "andean-wata",
    "coca-leaves",
    "wauja-tobacco",
    "mapuche-peuma",
    "ayahuasca-vision",
    "quechua-despacho",
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
      kind: "southamerica",
      ...r,
      disclaimer: isZh()
        ? zhText(
            "教育性模拟——不能替代受训祭司／萨满／paqo实践，也不能替代医疗、法律或安全判断。不含真实致幻剂、吸烟或火祭。可能不准确；无法预测黑天鹅事件。",
            "教育性模擬——不能替代受訓祭司／薩滿／paqo實踐，也不能替代醫療、法律或安全判斷。不含真實致幻劑、吸煙或火祭。可能不準確；無法預測黑天鵝事件。"
          )
        : "Educational simulation — not a substitute for trained priest/shaman/paqo practice, medicine, law, or safety judgment. No real entheogens, smoking, or fire offerings. May be inaccurate; cannot predict black swan events.",
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

  const BUZ = [
    omen("Odú 4 Irosun", "Odú 4 Irosun", "ancestry · ask an elder", "祖源·问长者", "祖源·問長者"),
    omen("Odú 7 Odi", "Odú 7 Odi", "close a loop kindly", "善意收尾", "善意收尾"),
    omen("Odú 12 Ejila", "Odú 12 Ejila", "crossroads · choose slowly", "路口·慢选", "路口·慢選"),
    omen("Odú 1 Okana", "Odú 1 Okana", "begin · one firm step", "起势·踏实一步", "起勢·踏實一步"),
  ];
  const WATA = [
    omen("Inti Raymi season", "因蒂雷米季", "gather · thank the sun", "聚会·谢日", "聚會·謝日"),
    omen("Capac Raymi quiet", "卡帕克雷米静", "inward · plan the year", "向内·规划年", "向內·規劃年"),
    omen("Pacha sowing", "帕查播种", "plant · tend soil first", "播种·先护土", "播種·先護土"),
    omen("Chacra rest", "查克拉歇", "fallow · do not force", "休耕·勿强", "休耕·勿強"),
  ];
  const COCA = [
    omen("Leaves face up", "叶面朝上", "yes lean · proceed gently", "偏是·温和前行", "偏是·溫和前行"),
    omen("Crossed stems", "茎交叉", "meeting · bring a gift", "会见·带礼物", "會見·帶禮物"),
    omen("Scattered fall", "散落", "unclear · rephrase ask", "不明·改问法", "不明·改問法"),
    omen("Stacked pair", "叠成对", "partnership · clarify roles", "伙伴·澄清角色", "夥伴·澄清角色"),
  ];
  const WAUJA = [
    omen("Smoke-path clear", "烟径清", "cause named · tend rest", "因已名·多休息", "因已名·多休息"),
    omen("Shadow visitor", "影访客", "boundary · protect sleep", "设界·护睡眠", "設界·護睡眠"),
    omen("River spirit calm", "河灵静", "soothe · cool the fever of worry", "安抚·降温忧虑", "安撫·降溫憂慮"),
    omen("Forest hush wait", "林静等", "wait · do not chase the vision", "等·勿追幻象", "等·勿追幻象"),
  ];
  const PEUMA = [
    omen("Peuma of water", "水之梦", "flow around a block", "绕障而行", "繞障而行"),
    omen("Peuma of horse", "马之梦", "power · pace the ride", "力·控节奏", "力·控節奏"),
    omen("Peuma of fire", "火之梦", "heat · cool before speak", "热·先降温再说", "熱·先降溫再說"),
    omen("Peuma of mountain", "山之梦", "endure · climb slowly", "忍耐·慢爬", "忍耐·慢爬"),
  ];
  const AYA = [
    omen("Shipibo wave path", "希皮博波纹路", "pattern · rewrite one habit", "图案·改一习惯", "圖案·改一習慣"),
    omen("Serpent coil heal", "蛇盘愈", "heal · ask for body rest", "愈·让身体休息", "癒·讓身體休息"),
    omen("Flower bridge soft", "花桥柔", "connect · soften defense", "连结·软化防御", "連結·軟化防禦"),
    omen("Dark water pause", "暗水停", "pause · do not force vision", "停·勿强求视象", "停·勿強求視象"),
  ];
  const DESP = [
    omen("Smoke rises straight", "烟直升", "accepted · give thanks", "受纳·致谢", "受納·致謝"),
    omen("Smoke drifts left", "烟偏左", "adjust offering · simplify", "调整供物·简化", "調整供物·簡化"),
    omen("Quick clean burn", "快净燃", "clear path · act soon", "路清·早行", "路清·早行"),
    omen("Slow smolder wait", "慢焖等", "wait · refine the ask", "等· refining 问法", "等· refining 問法"),
  ];
  // fix despacho last omen zh
  DESP[3] = omen("Slow smolder wait", "慢焖等", "wait · refine the ask", "等·改问法", "等·改問法");

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
            ? zhText(`教学示「${n}」，倾向「${cast.lean}」。仪轨镜子，不是科学预报。`, `教學示「${n}」，傾向「${cast.lean}」。儀軌鏡子，不是科學預報。`)
            : `Teaching shows “${n}”, leaning “${cast.lean}”. A ritual mirror, not a scientific forecast.`,
          interpret: interpretQ(ask, cast.lean, isZh() ? mechanicZh : mechanicEn),
          details: cast.note ? [cast.note, n] : [n],
          doList: [
            isZh()
              ? zhText(`按「${cast.lean}」做一件今天可完成的小事。`, `按「${cast.lean}」做一件今天可完成的小事。`)
              : `Do one small today-action matching “${cast.lean}”.`,
          ],
          dontList: [
            isZh()
              ? zhText("不要用模拟仪式替代受训实践、医疗或真实致幻剂使用。", "不要用模擬儀式替代受訓實踐、醫療或真實致幻劑使用。")
              : "Do not replace trained practice, medicine, or real entheogen use with a simulation.",
          ],
          tone: /wait|pause|unclear|hold|fallow|等|停|不明|休|慢/i.test(n + cast.lean) ? "caution" : "mixed",
          vizData: cast,
        });
      },
    };
  }

  const RITES = {
    buzios: rite(
      {
        en: "Jogo de Búzios casts cowries in Candomblé/Umbanda to select odú verses — educational cast only, not initiatory.",
        zh: "布齐奥斯贝占在康东布雷／乌班达中抛贝选奥杜经文——仅教育性起卦，非入门。",
        hant: "布齊奧斯貝占在康東布雷／烏班達中拋貝選奧杜經文——僅教育性起卦，非入門。",
      },
      stepsHow(
        "You’ll hold a question, cast teaching búzios, then read an odú lean.",
        [
          ["Meet Jogo de Búzios", "Cowries · odú · counsel."],
          ["Hold your question", "One clear ask."],
          ["Cast the búzios", "Teaching cowries."],
          ["See the odú", "Verse settles."],
          ["Read the Búzios counsel", "Odú lean."],
          ["Búzios counsel", "Lean for your question."],
        ],
        "你将抱定问题、抛下教学布齐奥斯，再读奥杜倾向。",
        [
          ["认识布齐奥斯", "贝 · 奥杜 · 指引。"],
          ["抱定问题", "只留一个清楚的问。"],
          ["抛下布齐奥斯", "教学贝。"],
          ["查看奥杜", "经文安定。"],
          ["读取布齐奥斯指引", "奥杜倾向。"],
          ["布齐奥斯指引", "对照问题。"],
        ],
        "你將抱定問題、拋下教學布齊奧斯，再讀奧杜傾向。",
        [
          ["認識布齊奧斯", "貝 · 奧杜 · 指引。"],
          ["抱定問題", "只留一個清楚的問。"],
          ["拋下布齊奧斯", "教學貝。"],
          ["查看奧杜", "經文安定。"],
          ["讀取布齊奧斯指引", "奧杜傾向。"],
          ["布齊奧斯指引", "對照問題。"],
        ]
      ),
      ["intent", "question", "castBuzios", "oduBuzios", "buziosCounsel", "result"],
      "buzios",
      { en: "Read the Búzios counsel", zh: "读取布齐奥斯指引", hant: "讀取布齊奧斯指引" },
      BUZ,
      "the odú",
      "奥杜"
    ),

    "andean-wata": rite(
      {
        en: "Andean / Inca Wata marks year festivals and calendrical timing for agricultural and ritual fortune.",
        zh: "安第斯／印加瓦塔标记年节与农事／仪轨时机。",
        hant: "安第斯／印加瓦塔標記年節與農事／儀軌時機。",
      },
      stepsHow(
        "You’ll pick a day, meet a teaching Wata season, then read the lean.",
        [
          ["Meet Andean Wata", "Festivals · seasons · fortune."],
          ["Pick a day", "Teaching calendar seed."],
          ["Meet the Wata season", "Season appears."],
          ["Read the Wata counsel", "Season lean."],
          ["Wata counsel", "Lean for your day."],
        ],
        "你将选择日期、会见教学瓦塔季节，再读倾向。",
        [
          ["认识安第斯瓦塔", "节庆 · 季节 · 运势。"],
          ["选择日期", "教学历种。"],
          ["会见瓦塔季节", "季节出现。"],
          ["读取瓦塔指引", "季节倾向。"],
          ["瓦塔指引", "对照日期。"],
        ],
        "你將選擇日期、會見教學瓦塔季節，再讀傾向。",
        [
          ["認識安第斯瓦塔", "節慶 · 季節 · 運勢。"],
          ["選擇日期", "教學曆種。"],
          ["會見瓦塔季節", "季節出現。"],
          ["讀取瓦塔指引", "季節傾向。"],
          ["瓦塔指引", "對照日期。"],
        ]
      ),
      ["intent", "dayDate", "wataSeason", "wataCounsel", "result"],
      "wata",
      { en: "Read the Wata counsel", zh: "读取瓦塔指引", hant: "讀取瓦塔指引" },
      WATA,
      "the Wata season",
      "瓦塔季节",
      "dayDate"
    ),

    "coca-leaves": rite(
      {
        en: "Coca leaf divination: paqos cast or read leaves for diagnosis, travel, and offerings — teaching leaves only.",
        zh: "古柯叶占：paqo抛读叶作诊断、出行与供奉指引——仅教学叶。",
        hant: "古柯葉占：paqo拋讀葉作診斷、出行與供奉指引——僅教學葉。",
      },
      stepsHow(
        "You’ll hold a question, cast teaching coca leaves, then read the spread lean.",
        [
          ["Meet Coca Leaf Divination", "Leaves · cast · counsel."],
          ["Hold your question", "One clear ask."],
          ["Cast the coca leaves", "Teaching leaves."],
          ["See the leaf spread", "Pattern settles."],
          ["Read the coca counsel", "Spread lean."],
          ["Coca counsel", "Lean for your question."],
        ],
        "你将抱定问题、抛下教学古柯叶，再读散叶倾向。",
        [
          ["认识古柯叶占", "叶 · 抛 · 指引。"],
          ["抱定问题", "只留一个清楚的问。"],
          ["抛下古柯叶", "教学叶。"],
          ["查看叶阵", "格局安定。"],
          ["读取古柯指引", "叶阵倾向。"],
          ["古柯指引", "对照问题。"],
        ],
        "你將抱定問題、拋下教學古柯葉，再讀散葉傾向。",
        [
          ["認識古柯葉占", "葉 · 拋 · 指引。"],
          ["抱定問題", "只留一個清楚的問。"],
          ["拋下古柯葉", "教學葉。"],
          ["查看葉陣", "格局安定。"],
          ["讀取古柯指引", "葉陣傾向。"],
          ["古柯指引", "對照問題。"],
        ]
      ),
      ["intent", "question", "castCoca", "cocaSpread", "cocaCounsel", "result"],
      "coca",
      { en: "Read the coca counsel", zh: "读取古柯指引", hant: "讀取古柯指引" },
      COCA,
      "the coca spread",
      "古柯叶阵"
    ),

    "wauja-tobacco": rite(
      {
        en: "Wauja tobacco vision divination: shamans use tobacco-linked visions to identify spirit causes of illness — teaching breath/vision sim only (no smoking).",
        zh: "瓦乌亚烟草视象占：萨满以烟草相关视象辨疾病灵因——仅教学呼吸／视象模拟（无吸烟）。",
        hant: "瓦烏亞煙草視象占：薩滿以煙草相關視象辨疾病靈因——僅教學呼吸／視象模擬（無吸煙）。",
      },
      stepsHow(
        "You’ll hold a question, take a teaching tobacco breath, then read a vision lean.",
        [
          ["Meet Wauja tobacco vision", "Breath · vision · cause."],
          ["Hold your question", "One clear ask."],
          ["Take the tobacco breath", "Teaching breath only."],
          ["See the vision shape", "Shape appears."],
          ["Read the Wauja counsel", "Vision lean."],
          ["Wauja counsel", "Lean for your question."],
        ],
        "你将抱定问题、做教学烟草呼吸，再读视象倾向。",
        [
          ["认识瓦乌亚烟草视象", "呼吸 · 视象 · 病因。"],
          ["抱定问题", "只留一个清楚的问。"],
          ["做烟草呼吸", "仅教学呼吸。"],
          ["查看视象形", "形状出现。"],
          ["读取瓦乌亚指引", "视象倾向。"],
          ["瓦乌亚指引", "对照问题。"],
        ],
        "你將抱定問題、做教學煙草呼吸，再讀視象傾向。",
        [
          ["認識瓦烏亞煙草視象", "呼吸 · 視象 · 病因。"],
          ["抱定問題", "只留一個清楚的問。"],
          ["做煙草呼吸", "僅教學呼吸。"],
          ["查看視象形", "形狀出現。"],
          ["讀取瓦烏亞指引", "視象傾向。"],
          ["瓦烏亞指引", "對照問題。"],
        ]
      ),
      ["intent", "question", "tobaccoBreath", "visionShape", "waujaCounsel", "result"],
      "wauja",
      { en: "Read the Wauja counsel", zh: "读取瓦乌亚指引", hant: "讀取瓦烏亞指引" },
      WAUJA,
      "the vision",
      "视象"
    ),

    "mapuche-peuma": rite(
      {
        en: "Mapuche peuma & machi divination: machi interpret dreams and spirit contact for healing and communal guidance.",
        zh: "马普切梦兆与马奇占：马奇解读梦与灵接触，作疗愈与社群指引。",
        hant: "馬普切夢兆與馬奇占：馬奇解讀夢與靈接觸，作療癒與社群指引。",
      },
      stepsHow(
        "You’ll note a dream image, listen with a teaching machi lens, then read the peuma lean.",
        [
          ["Meet Mapuche peuma", "Dream · machi · counsel."],
          ["Note a dream image", "What stood out?"],
          ["Listen with the machi", "Teaching listen."],
          ["Read the peuma counsel", "Dream lean."],
          ["Peuma counsel", "Lean for your dream."],
        ],
        "你将记录梦象、以教学马奇倾听，再读梦兆倾向。",
        [
          ["认识马普切梦兆", "梦 · 马奇 · 指引。"],
          ["记录梦象", "什么最醒目？"],
          ["以马奇倾听", "教学倾听。"],
          ["读取梦兆指引", "梦倾向。"],
          ["梦兆指引", "对照梦象。"],
        ],
        "你將記錄夢象、以教學馬奇傾聽，再讀夢兆傾向。",
        [
          ["認識馬普切夢兆", "夢 · 馬奇 · 指引。"],
          ["記錄夢象", "什麼最醒目？"],
          ["以馬奇傾聽", "教學傾聽。"],
          ["讀取夢兆指引", "夢傾向。"],
          ["夢兆指引", "對照夢象。"],
        ]
      ),
      ["intent", "dreamNoteMapuche", "machiListen", "peumaCounsel", "result"],
      "peuma",
      { en: "Read the peuma counsel", zh: "读取梦兆指引", hant: "讀取夢兆指引" },
      PEUMA,
      "the peuma",
      "梦兆",
      "dreamNote"
    ),

    "ayahuasca-vision": rite(
      {
        en: "Ayahuasca visionary diagnosis: Shipibo and other Amazonian healers read visionary imagery — teaching pattern sim only (no real brew).",
        zh: "死藤水视象诊断：希皮博等亚马逊疗愈者读视象——仅教学图案模拟（无真实药酿）。",
        hant: "死藤水視象診斷：希皮博等亞馬遜療癒者讀視象——僅教學圖案模擬（無真實藥釀）。",
      },
      stepsHow(
        "You’ll hold a question, meet a teaching vision vessel, then read a Shipibo-pattern lean.",
        [
          ["Meet ayahuasca vision diagnosis", "Vision · pattern · counsel."],
          ["Hold your question", "One clear ask."],
          ["Meet the vision vessel", "Teaching vessel only."],
          ["See the Shipibo pattern", "Pattern settles."],
          ["Read the vision counsel", "Pattern lean."],
          ["Vision counsel", "Lean for your question."],
        ],
        "你将抱定问题、会见教学视象器皿，再读希皮博图案倾向。",
        [
          ["认识死藤水视象诊断", "视象 · 图案 · 指引。"],
          ["抱定问题", "只留一个清楚的问。"],
          ["会见视象器皿", "仅教学器皿。"],
          ["查看希皮博图案", "图案安定。"],
          ["读取视象指引", "图案倾向。"],
          ["视象指引", "对照问题。"],
        ],
        "你將抱定問題、會見教學視象器皿，再讀希皮博圖案傾向。",
        [
          ["認識死藤水視象診斷", "視象 · 圖案 · 指引。"],
          ["抱定問題", "只留一個清楚的問。"],
          ["會見視象器皿", "僅教學器皿。"],
          ["查看希皮博圖案", "圖案安定。"],
          ["讀取視象指引", "圖案傾向。"],
          ["視象指引", "對照問題。"],
        ]
      ),
      ["intent", "question", "visionVessel", "shipiboPattern", "ayaCounsel", "result"],
      "ayahuasca",
      { en: "Read the vision counsel", zh: "读取视象指引", hant: "讀取視象指引" },
      AYA,
      "the vision pattern",
      "视象图案"
    ),

    "quechua-despacho": rite(
      {
        en: "Despacho / offering omens: how teaching offerings “burn” or are received by Apus is read as an answer — no real fire.",
        zh: "德斯帕乔／供奉兆：教学供物如何被山神“受纳”作答——无真实火。",
        hant: "德斯帕喬／供奉兆：教學供物如何被山神「受納」作答——無真實火。",
      },
      stepsHow(
        "You’ll hold a question, build a teaching despacho, then read a burn-omen lean.",
        [
          ["Meet Despacho omens", "Offering · Apus · answer."],
          ["Hold your question", "One clear ask."],
          ["Build the despacho", "Teaching bundle."],
          ["See the burn omen", "Teaching burn only."],
          ["Read the despacho counsel", "Omen lean."],
          ["Despacho counsel", "Lean for your question."],
        ],
        "你将抱定问题、制作教学德斯帕乔，再读受纳兆倾向。",
        [
          ["认识德斯帕乔兆", "供物 · 山神 · 答。"],
          ["抱定问题", "只留一个清楚的问。"],
          ["制作德斯帕乔", "教学包。"],
          ["查看受纳兆", "仅教学燃烧。"],
          ["读取德斯帕乔指引", "兆倾向。"],
          ["德斯帕乔指引", "对照问题。"],
        ],
        "你將抱定問題、製作教學德斯帕喬，再讀受納兆傾向。",
        [
          ["認識德斯帕喬兆", "供物 · 山神 · 答。"],
          ["抱定問題", "只留一個清楚的問。"],
          ["製作德斯帕喬", "教學包。"],
          ["查看受納兆", "僅教學燃燒。"],
          ["讀取德斯帕喬指引", "兆傾向。"],
          ["德斯帕喬指引", "對照問題。"],
        ]
      ),
      ["intent", "question", "buildDespacho", "burnOmen", "despachoCounsel", "result"],
      "despacho",
      { en: "Read the despacho counsel", zh: "读取德斯帕乔指引", hant: "讀取德斯帕喬指引" },
      DESP,
      "the offering omen",
      "供奉兆"
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
            "本站为教育性游玩——不能替代受训祭司／萨满／paqo、医疗、法律或安全判断。",
            "本站為教育性遊玩——不能替代受訓祭司／薩滿／paqo、醫療、法律或安全判斷。"
          )
        : "Educational play on this site — not a substitute for trained priest/shaman/paqo practice, medicine, law, or safety judgment.",
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

  window.FatumSouthAmericaOracles = { IDS, has, get, howFor, runCast, loc };
})();
