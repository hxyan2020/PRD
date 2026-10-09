/**
 * North American & Afro-Cuban oracles — unique steps, visuals, readings.
 * Innu scapula · Shaking Tent · Midewiwin · Dene stars · Diloggún · Afro-Cuban Ifá
 */
(function () {
  "use strict";

  const IDS = ["innu-scapula", "shaking-tent", "midewiwin", "dene-stars", "dilogun", "ifa-cuba"];

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
      kind: "northamerica",
      ...r,
      disclaimer: isZh()
        ? zhText(
            "教育性模拟——不能替代受训仪式／祭司实践，也不能替代医疗、法律或安全判断。可能不准确；无法预测黑天鹅事件。",
            "教育性模擬——不能替代受訓儀式／祭司實踐，也不能替代醫療、法律或安全判斷。可能不準確；無法預測黑天鵝事件。"
          )
        : "Educational simulation — not a substitute for trained ceremonial/priestly practice, medicine, law, or safety judgment. May be inaccurate; cannot predict black swan events.",
    };
    return RM ? RM.structuredReading(base) : base;
  }
  function interpretQ(q, lean, mechanic) {
    const RM = window.FatumResultModel;
    const body = isZh()
      ? zhText(
          `你问的是「${q || "未写明的事"}」。以${mechanic}给出的「${lean}」倾向为镜：先改一件你能控制的安排，再用日常证据核对。`,
          `你問的是「${q || "未寫明的事"}」。以${mechanic}給出的「${lean}」傾向為鏡：先改一件你能控制的安排，再用日常證據核對。`
        )
      : `You asked about “${q || "an unnamed matter"}”. Hold the “${lean}” lean from ${mechanic} as a mirror: change one arrangement you control, then check ordinary evidence.`;
    return RM ? RM.interpretWithQuestion(q, body) : body;
  }
  function howPack(en, zh, hant) {
    return { en, zh, hant: hant || zh };
  }
  function omen(en, zh, leanEn, leanZh, leanHant) {
    return { en, zh, lean: { en: leanEn, zh: leanZh, hant: leanHant || leanZh } };
  }

  const SCAP = [
    omen("Crack north trail", "裂纹北路", "hunt north · prepare gear", "猎向北·备好装备", "獵向北·備好裝備"),
    omen("Forked east mark", "分叉东痕", "two paths · pick one camp", "两路·只选一营", "兩路·只選一營"),
    omen("Clear south line", "南线清", "open trail · go light", "路开·轻装", "路開·輕裝"),
    omen("Closed west blot", "西斑闭", "hold · wait weather", "守·等天气", "守·等天氣"),
  ];
  const TENT = [
    omen("Strong shake yes", "强震是", "yes · proceed with helpers", "是·有人协助再行", "是·有人協助再行"),
    omen("Soft rattle wait", "轻摇等", "wait · ask again at dawn", "等·黎明再问", "等·黎明再問"),
    omen("Spirit laugh ease", "灵笑缓", "ease · release worry", "缓·放下忧", "緩·放下憂"),
    omen("Silence caution", "静慎", "caution · do not rush", "慎·勿赶", "慎·勿趕"),
  ];
  const MIDE = [
    omen("Birch path open", "桦皮开路", "begin healing path · ask elder", "起疗愈路·问长者", "起療癒路·問長者"),
    omen("Otter mark teach", "水獭记教", "learn · share one skill", "学·分享一技", "學·分享一技"),
    omen("Shell lodge guard", "贝壳居护", "protect circle · keep vow", "护圈·守誓", "護圈·守誓"),
    omen("Scroll gap pause", "卷缺停", "pause · refill knowledge", "停·补给知识", "停·補給知識"),
  ];
  const DENE = [
    omen("Hard twinkle cold", "硬闪寒", "cold spell · stock fuel", "寒潮·备燃料", "寒潮·備燃料"),
    omen("Soft shimmer mild", "柔闪温", "mild days · travel window", "温和·出行窗", "溫和·出行窗"),
    omen("Rapid spark wind", "急闪风", "wind rising · secure camp", "风起·加固营地", "風起·加固營地"),
    omen("Steady glow clear", "稳光晴", "clear skies · observe longer", "晴空·多观察", "晴空·多觀察"),
  ];
  const DILOG = [
    omen("Oddun 5 Oché", "Oddun 5 Oché", "truth · speak cleanly", "真·说清楚", "真·說清楚"),
    omen("Oddun 8 Eyeunle", "Oddun 8 Eyeunle", "stability · tend home", "稳·照料家", "穩·照料家"),
    omen("Oddun 3 Ogundá", "Oddun 3 Ogundá", "iron will · cut a knot", "铁意·斩结", "鐵意·斬結"),
    omen("Oddun 11 Ojuani", "Oddun 11 Ojuani", "crossroads · choose slowly", "路口·慢选", "路口·慢選"),
  ];
  const IFAC = [
    omen("Odù Ogbe Meji", "Odù Ogbe Meji", "light · begin openly", "光·公开起势", "光·公開起勢"),
    omen("Odù Oyeku Meji", "Odù Oyeku Meji", "rest · honor the dark", "歇·敬暗", "歇·敬暗"),
    omen("Odù Iwori Meji", "Odù Iwori Meji", "insight · study deeper", "洞见·深学", "洞見·深學"),
    omen("Odù Odi Meji", "Odù Odi Meji", "boundary · close a door", "界·关上一扇门", "界·關上一扇門"),
  ];

  function rite(summary, how, steps, viz, castCta, pool, mechanicEn, mechanicZh) {
    return {
      summary,
      how,
      steps,
      viz,
      castCta,
      buildCast(state, rng) {
        const item = pick(rng, pool);
        return { item, note: state.question || "", lean: loc(item.lean) };
      },
      generate(q, cast) {
        const n = loc({ en: cast.item.en, zh: cast.item.zh });
        return pack({
          title: q ? `${q} · ${n}` : n,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学示「${n}」，倾向「${cast.lean}」。仪式镜子，不是科学预报。`, `教學示「${n}」，傾向「${cast.lean}」。儀式鏡子，不是科學預報。`)
            : `Teaching shows “${n}”, leaning “${cast.lean}”. A ceremonial mirror, not a scientific forecast.`,
          interpret: interpretQ(q, cast.lean, isZh() ? mechanicZh : mechanicEn),
          details: q ? [q, n] : [n],
          doList: [
            isZh()
              ? zhText(`按「${cast.lean}」做一件今天可完成的小事。`, `按「${cast.lean}」做一件今天可完成的小事。`)
              : `Do one small today-action matching “${cast.lean}”.`,
          ],
          dontList: [
            isZh()
              ? zhText("不要用模拟仪式替代受训祭司或医疗。", "不要用模擬儀式替代受訓祭司或醫療。")
              : "Do not replace trained priests or medicine with a simulated ceremony.",
          ],
          tone: /wait|hold|caution|rest|pause|等|守|慎|歇|停/i.test(n + cast.lean) ? "caution" : "mixed",
          vizData: cast,
        });
      },
    };
  }

  function stepsHow(enTitle, enIntro, enSteps, zhTitle, zhIntro, zhSteps, hantTitle, hantIntro, hantSteps) {
    return howPack(
      { intro: enIntro, steps: enSteps.map(([t, b]) => ({ title: t, body: b })) },
      { intro: zhIntro, steps: zhSteps.map(([t, b]) => ({ title: t, body: b })) },
      { intro: hantIntro, steps: hantSteps.map(([t, b]) => ({ title: t, body: b })) }
    );
  }

  const RITES = {
    "innu-scapula": rite(
      {
        en: "Innu caribou scapulimancy heats a shoulder blade; cracks are read for game trails and outcomes (teaching sim — no real fire/bone).",
        zh: "因努驯鹿胛骨占加热肩胛；裂纹论猎径与结果（教学模拟——无真实火／骨）。",
        hant: "因努馴鹿胛骨占加熱肩胛；裂紋論獵徑與結果（教學模擬——無真實火／骨）。",
      },
      stepsHow(
        "",
        "You’ll hold a question, heat a teaching scapula, then read the crack lean.",
        [
          ["Meet Innu scapulimancy", "Shoulder blade · cracks · trails."],
          ["Hold your question", "One clear ask."],
          ["Heat the scapula", "Teaching heat only."],
          ["Read the crack", "Trail omen appears."],
          ["Read the Innu counsel", "Crack lean."],
          ["Innu counsel", "Lean for your question."],
        ],
        "",
        "你将抱定问题、加热教学胛骨，再读裂纹倾向。",
        [
          ["认识因努胛骨占", "肩胛 · 裂纹 · 猎径。"],
          ["抱定问题", "只留一个清楚的问。"],
          ["加热胛骨", "仅教学加热。"],
          ["读取裂纹", "猎径兆出现。"],
          ["读取因努指引", "裂纹倾向。"],
          ["因努指引", "对照问题。"],
        ],
        "",
        "你將抱定問題、加熱教學胛骨，再讀裂紋傾向。",
        [
          ["認識因努胛骨占", "肩胛 · 裂紋 · 獵徑。"],
          ["抱定問題", "只留一個清楚的問。"],
          ["加熱胛骨", "僅教學加熱。"],
          ["讀取裂紋", "獵徑兆出現。"],
          ["讀取因努指引", "裂紋傾向。"],
          ["因努指引", "對照問題。"],
        ]
      ),
      ["intent", "question", "heatScapula", "crackRead", "innuCounsel", "result"],
      "scapula",
      { en: "Read the Innu counsel", zh: "读取因努指引", hant: "讀取因努指引" },
      SCAP,
      "the scapula crack",
      "胛骨裂纹"
    ),

    "shaking-tent": rite(
      {
        en: "The Shaking Tent ceremony seats a diviner in a tent that shakes as spirits answer questions about hunts and illness — teaching sim only.",
        zh: "摇帐篷仪式中，占卜者入帐，帐篷摇动如灵答狩猎与疾病之问——仅教学模拟。",
        hant: "搖帳篷儀式中，占卜者入帳，帳篷搖動如靈答狩獵與疾病之問——僅教學模擬。",
      },
      stepsHow(
        "",
        "You’ll hold a question, enter a teaching tent, then read the spirit-shake lean.",
        [
          ["Meet Shaking Tent", "Tent · spirits · answers."],
          ["Hold your question", "One clear ask."],
          ["Enter the tent", "Teaching lodge."],
          ["Feel the spirit shake", "Motion settles."],
          ["Read the tent counsel", "Shake lean."],
          ["Tent counsel", "Lean for your question."],
        ],
        "",
        "你将抱定问题、进入教学帐篷，再读灵摇倾向。",
        [
          ["认识摇帐篷", "帐 · 灵 · 答。"],
          ["抱定问题", "只留一个清楚的问。"],
          ["进入帐篷", "教学帐。"],
          ["感受灵摇", "动作安定。"],
          ["读取帐篷指引", "摇倾向。"],
          ["帐篷指引", "对照问题。"],
        ],
        "",
        "你將抱定問題、進入教學帳篷，再讀靈搖傾向。",
        [
          ["認識搖帳篷", "帳 · 靈 · 答。"],
          ["抱定問題", "只留一個清楚的問。"],
          ["進入帳篷", "教學帳。"],
          ["感受靈搖", "動作安定。"],
          ["讀取帳篷指引", "搖傾向。"],
          ["帳篷指引", "對照問題。"],
        ]
      ),
      ["intent", "question", "enterTent", "spiritShake", "tentCounsel", "result"],
      "tent",
      { en: "Read the tent counsel", zh: "读取帐篷指引", hant: "讀取帳篷指引" },
      TENT,
      "the tent shake",
      "帐篷摇动"
    ),

    midewiwin: rite(
      {
        en: "Midewiwin scroll lore holds Ojibwe/Anishinaabe medicine-society knowledge — birchbark scrolls and initiatory healing/divining (teaching marks only).",
        zh: "米德维温卷轴传统保存奥吉布瓦／阿尼希纳贝医药社知识——桦皮卷与入门疗愈／占问（仅教学标记）。",
        hant: "米德維溫捲軸傳統保存奧吉布瓦／阿尼希納貝醫藥社知識——樺皮捲與入門療癒／占問（僅教學標記）。",
      },
      stepsHow(
        "",
        "You’ll hold a question, unroll a teaching scroll, then read the mark lean.",
        [
          ["Meet Midewiwin lore", "Scrolls · lodge · healing."],
          ["Hold your question", "One clear ask."],
          ["Unroll the scroll", "Teaching birchbark."],
          ["See the scroll mark", "Mark appears."],
          ["Read the Mide counsel", "Mark lean."],
          ["Mide counsel", "Lean for your question."],
        ],
        "",
        "你将抱定问题、展开教学卷轴，再读标记倾向。",
        [
          ["认识米德维温", "卷 · 社 · 疗愈。"],
          ["抱定问题", "只留一个清楚的问。"],
          ["展开卷轴", "教学桦皮。"],
          ["查看卷标记", "标记出现。"],
          ["读取米德指引", "标记倾向。"],
          ["米德指引", "对照问题。"],
        ],
        "",
        "你將抱定問題、展開教學捲軸，再讀標記傾向。",
        [
          ["認識米德維溫", "捲 · 社 · 療癒。"],
          ["抱定問題", "只留一個清楚的問。"],
          ["展開捲軸", "教學樺皮。"],
          ["查看捲標記", "標記出現。"],
          ["讀取米德指引", "標記傾向。"],
          ["米德指引", "對照問題。"],
        ]
      ),
      ["intent", "question", "unrollScroll", "scrollMark", "mideCounsel", "result"],
      "mide",
      { en: "Read the Mide counsel", zh: "读取米德指引", hant: "讀取米德指引" },
      MIDE,
      "the scroll mark",
      "卷轴标记"
    ),

    "dene-stars": rite(
      {
        en: "Northern Dene stellar scintillation reads star twinkling to forecast weather and seasonal change.",
        zh: "北部德内星闪以星光闪烁预报天气与季节变化。",
        hant: "北部德內星閃以星光閃爍預報天氣與季節變化。",
      },
      stepsHow(
        "",
        "You’ll hold a question, watch teaching star twinkle, then read the scintillation lean.",
        [
          ["Meet Dene scintillation", "Stars · twinkle · weather."],
          ["Hold your question", "One clear ask."],
          ["Watch the twinkle", "Night sky opens."],
          ["See the scintillation", "Pattern settles."],
          ["Read the Dene counsel", "Twinkle lean."],
          ["Dene counsel", "Lean for your question."],
        ],
        "",
        "你将抱定问题、观看教学星闪，再读闪烁倾向。",
        [
          ["认识德内星闪", "星 · 闪 · 天气。"],
          ["抱定问题", "只留一个清楚的问。"],
          ["观看星闪", "夜空打开。"],
          ["查看闪烁", "格局安定。"],
          ["读取德内指引", "闪倾向。"],
          ["德内指引", "对照问题。"],
        ],
        "",
        "你將抱定問題、觀看教學星閃，再讀閃爍傾向。",
        [
          ["認識德內星閃", "星 · 閃 · 天氣。"],
          ["抱定問題", "只留一個清楚的問。"],
          ["觀看星閃", "夜空打開。"],
          ["查看閃爍", "格局安定。"],
          ["讀取德內指引", "閃傾向。"],
          ["德內指引", "對照問題。"],
        ]
      ),
      ["intent", "question", "watchTwinkle", "scintillate", "deneCounsel", "result"],
      "dene",
      { en: "Read the Dene counsel", zh: "读取德内指引", hant: "讀取德內指引" },
      DENE,
      "the star twinkle",
      "星闪"
    ),

    dilogun: rite(
      {
        en: "Diloggún is Afro-Cuban cowrie Odù reading by Santeros/Santeras in Regla de Ocha — educational cast only, not initiatory.",
        zh: "迪洛贡是古巴圣教（Regla de Ocha）中萨泰罗／萨泰拉的贝壳奥杜解读——仅教育性起卦，非入门。",
        hant: "迪洛貢是古巴聖教（Regla de Ocha）中薩泰羅／薩泰拉的貝殼奧杜解讀——僅教育性起卦，非入門。",
      },
      stepsHow(
        "",
        "You’ll hold a question, cast teaching diloggún, then read an Oddun letter lean.",
        [
          ["Meet Diloggún", "Cowries · Oddun · Ocha."],
          ["Hold your question", "One clear ask."],
          ["Cast the diloggún", "Teaching cowries."],
          ["See the Oddun letter", "Letter settles."],
          ["Read the Diloggún counsel", "Oddun lean."],
          ["Diloggún counsel", "Lean for your question."],
        ],
        "",
        "你将抱定问题、抛下教学迪洛贡，再读奥杜字母倾向。",
        [
          ["认识迪洛贡", "贝 · 奥杜 · 奥查。"],
          ["抱定问题", "只留一个清楚的问。"],
          ["抛下迪洛贡", "教学贝。"],
          ["查看奥杜字母", "字母安定。"],
          ["读取迪洛贡指引", "奥杜倾向。"],
          ["迪洛贡指引", "对照问题。"],
        ],
        "",
        "你將抱定問題、拋下教學迪洛貢，再讀奧杜字母傾向。",
        [
          ["認識迪洛貢", "貝 · 奧杜 · 奧查。"],
          ["抱定問題", "只留一個清楚的問。"],
          ["拋下迪洛貢", "教學貝。"],
          ["查看奧杜字母", "字母安定。"],
          ["讀取迪洛貢指引", "奧杜傾向。"],
          ["迪洛貢指引", "對照問題。"],
        ]
      ),
      ["intent", "question", "castDilogun", "oduLetter", "dilogunCounsel", "result"],
      "dilogun",
      { en: "Read the Diloggún counsel", zh: "读取迪洛贡指引", hant: "讀取迪洛貢指引" },
      DILOG,
      "the Oddun",
      "奥杜"
    ),

    "ifa-cuba": rite(
      {
        en: "Afro-Cuban Ifá: babalawos cast palm nuts on the board for 256 Odù in initiatory lineages — educational board sim only.",
        zh: "古巴伊法：巴巴拉沃在板上抛棕榈果得二百五十六种奥杜——仅教育性板卦模拟。",
        hant: "古巴伊法：巴巴拉沃在板上拋棕櫚果得二百五十六種奧杜——僅教育性板卦模擬。",
      },
      stepsHow(
        "",
        "You’ll hold a question, cast teaching ikines on a board, then read an Odù lean.",
        [
          ["Meet Afro-Cuban Ifá", "Ikines · board · Odù."],
          ["Hold your question", "One clear ask."],
          ["Cast the ikines", "Teaching nuts."],
          ["See the Odù on the board", "Figure settles."],
          ["Read the Ifá Cuba counsel", "Odù lean."],
          ["Ifá Cuba counsel", "Lean for your question."],
        ],
        "",
        "你将抱定问题、在板上抛教学伊金，再读奥杜倾向。",
        [
          ["认识古巴伊法", "伊金 · 板 · 奥杜。"],
          ["抱定问题", "只留一个清楚的问。"],
          ["抛下伊金", "教学果。"],
          ["查看板上奥杜", "卦象安定。"],
          ["读取古巴伊法指引", "奥杜倾向。"],
          ["古巴伊法指引", "对照问题。"],
        ],
        "",
        "你將抱定問題、在板上拋教學伊金，再讀奧杜傾向。",
        [
          ["認識古巴伊法", "伊金 · 板 · 奧杜。"],
          ["抱定問題", "只留一個清楚的問。"],
          ["拋下伊金", "教學果。"],
          ["查看板上奧杜", "卦象安定。"],
          ["讀取古巴伊法指引", "奧杜傾向。"],
          ["古巴伊法指引", "對照問題。"],
        ]
      ),
      ["intent", "question", "castIkinesCuba", "oduBoard", "ifaCubaCounsel", "result"],
      "ifacuba",
      { en: "Read the Ifá Cuba counsel", zh: "读取古巴伊法指引", hant: "讀取古巴伊法指引" },
      IFAC,
      "the Odù",
      "奥杜"
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
            "本站为教育性游玩——不能替代受训仪式／祭司、医疗、法律或安全判断。",
            "本站為教育性遊玩——不能替代受訓儀式／祭司、醫療、法律或安全判斷。"
          )
        : "Educational play on this site — not a substitute for trained ceremonial/priestly practice, medicine, law, or safety judgment.",
    };
  }
  function runCast(id, state) {
    const riteObj = RITES[id];
    if (!riteObj) return null;
    const rng = mulberry32(seedFrom(state.question || state.focus, state.nonce, id));
    const cast = Object.assign({}, state.cast || {}, riteObj.buildCast(state, rng) || {});
    return riteObj.generate(state.question || state.focus || "", cast, rng);
  }

  window.FatumNorthAmericaOracles = { IDS, has, get, howFor, runCast, loc };
})();
