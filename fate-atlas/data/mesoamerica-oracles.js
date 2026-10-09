/**
 * Mesoamerican calendar & curing oracles — unique steps, visuals, readings.
 * Tonalpohualli · Tzolk’in · Zapotec/Mixtec · Maize casting · Mazatec curing
 */
(function () {
  "use strict";

  const IDS = [
    "aztec-tonalpohualli",
    "mayan-tzolkin",
    "zapotec-mixtec",
    "maize-casting",
    "mazatec-curandero",
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
      kind: "mesoamerica",
      ...r,
      disclaimer: isZh()
        ? zhText(
            "教育性模拟——不能替代受训日守／治愈师实践，也不能替代医疗、法律或安全判断。可能不准确；无法预测黑天鹅事件。",
            "教育性模擬——不能替代受訓日守／治癒師實踐，也不能替代醫療、法律或安全判斷。可能不準確；無法預測黑天鵝事件。"
          )
        : "Educational simulation — not a substitute for trained daykeeper/curer practice, medicine, law, or safety judgment. May be inaccurate; cannot predict black swan events.",
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

  const TONAL = [
    omen("1 Cipactli", "1 鳄鱼", "begin · plant one seed", "起势·种下一粒", "起勢·種下一粒"),
    omen("7 Quetzalli", "7 羽", "beauty · refine gently", "美·温和打磨", "美·溫和打磨"),
    omen("4 Ollin", "4 动", "movement · change course", "动·改道", "動·改道"),
    omen("9 Atl", "9 水", "flow · soften resistance", "流·软化阻力", "流·軟化阻力"),
  ];
  const TZOLKIN = [
    omen("Imox nawal", "Imox 纳瓦尔", "dream · listen inward", "梦·向内听", "夢·向內聽"),
    omen("Iq’ wind", "Iq’ 风", "message · speak cleanly", "讯息·说清楚", "訊息·說清楚"),
    omen("Kiej deer", "Kiej 鹿", "authority · lead kindly", "权威·善意带领", "權威·善意帶領"),
    omen("Ajpu sun", "Ajpu 日", "courage · finish the hunt", "勇气·完成猎事", "勇氣·完成獵事"),
  ];
  const ZAP = [
    omen("Cocijo day", "雷神日", "storm clear · act after rain", "雨后行", "雨後行"),
    omen("Pitao luck", "神恩日", "favor · share the gift", "恩·分享礼物", "恩·分享禮物"),
    omen("Nisa water", "水日", "cleanse · start fresh", "净·重新开始", "淨·重新開始"),
    omen("Chilla alligator", "鳄日", "root · protect the base", "根·护住根基", "根·護住根基"),
  ];
  const MAIZE = [
    omen("Kernels cluster", "粒聚", "gather counsel · ask elders", "聚议·问长者", "聚議·問長者"),
    omen("Scattered path", "散路", "many options · pick one", "多路·只选一", "多路·只選一"),
    omen("Cross of four", "四交叉", "balance · fair trade", "平衡·公平交换", "平衡·公平交換"),
    omen("Empty pocket", "空袋", "lack · refill before ask", "缺·先补给再问", "缺·先補給再問"),
  ];
  const MAZ = [
    omen("Plant call calm", "草木召静", "soothe · rest the body", "安抚·让身体休息", "安撫·讓身體休息"),
    omen("Dream visitor", "梦访客", "message · write it down", "讯息·写下来", "訊息·寫下來"),
    omen("Song path", "歌径", "sing · name the fear", "唱·说出恐惧", "唱·說出恐懼"),
    omen("Night watch", "夜守", "vigil · wait one dawn", "守夜·等一晨", "守夜·等一晨"),
  ];

  function rite(summary, how, steps, viz, castCta, pool, mechanicEn, mechanicZh, needsBirth) {
    return {
      summary,
      how,
      steps,
      viz,
      castCta,
      needsBirth: !!needsBirth,
      buildCast(state, rng) {
        const item = pick(rng, pool);
        return {
          item,
          note: state.birthDate || state.question || state.formNote || "",
          lean: loc(item.lean),
        };
      },
      generate(q, cast) {
        const n = loc({ en: cast.item.en, zh: cast.item.zh });
        const ask = q || cast.note || "";
        return pack({
          title: cast.note ? `${cast.note} · ${n}` : n,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学示「${n}」，倾向「${cast.lean}」。历法／仪轨镜子，不是科学预报。`, `教學示「${n}」，傾向「${cast.lean}」。曆法／儀軌鏡子，不是科學預報。`)
            : `Teaching shows “${n}”, leaning “${cast.lean}”. A calendar/ritual mirror, not a scientific forecast.`,
          interpret: interpretQ(ask, cast.lean, isZh() ? mechanicZh : mechanicEn),
          details: cast.note ? [cast.note, n] : [n],
          doList: [
            isZh()
              ? zhText(`按「${cast.lean}」做一件今天可完成的小事。`, `按「${cast.lean}」做一件今天可完成的小事。`)
              : `Do one small today-action matching “${cast.lean}”.`,
          ],
          dontList: [
            isZh()
              ? zhText("不要用模拟日签替代受训日守或医疗。", "不要用模擬日籤替代受訓日守或醫療。")
              : "Do not replace trained daykeepers or medicine with a simulated day-sign.",
          ],
          tone: /wait|lack|rest|empty|缺|等|静|空/i.test(n + cast.lean) ? "caution" : "mixed",
          vizData: cast,
        });
      },
    };
  }

  const RITES = {
    "aztec-tonalpohualli": rite(
      {
        en: "The Tonalpohualli is the Mexica 260-day sacred count — day-signs shape destiny and ritual timing.",
        zh: "托纳尔波瓦利是墨西卡二百六十日圣历——日符塑造命运与仪轨时机。",
        hant: "托納爾波瓦利是墨西卡二百六十日聖曆——日符塑造命運與儀軌時機。",
      },
      howPack(
        {
          intro: "You’ll enter a birth date, meet a teaching day-sign, then read the tonal lean.",
          steps: [
            { title: "Meet Tonalpohualli", body: "260 days · day-signs." },
            { title: "Enter a birth date", body: "Teaching count seed." },
            { title: "Meet your day-sign", body: "Sign appears." },
            { title: "Read the tonal counsel", body: "Day-sign lean." },
            { title: "Tonal counsel", body: "Lean for your date." },
          ],
        },
        {
          intro: "你将输入生日、会见教学日符，再读托纳尔倾向。",
          steps: [
            { title: "认识托纳尔波瓦利", body: "二百六十日 · 日符。" },
            { title: "输入生日", body: "教学历种。" },
            { title: "会见日符", body: "日符出现。" },
            { title: "读取托纳尔指引", body: "日符倾向。" },
            { title: "托纳尔指引", body: "对照生日。" },
          ],
        },
        {
          intro: "你將輸入生日、會見教學日符，再讀托納爾傾向。",
          steps: [
            { title: "認識托納爾波瓦利", body: "二百六十日 · 日符。" },
            { title: "輸入生日", body: "教學曆種。" },
            { title: "會見日符", body: "日符出現。" },
            { title: "讀取托納爾指引", body: "日符傾向。" },
            { title: "托納爾指引", body: "對照生日。" },
          ],
        }
      ),
      ["intent", "birth", "daySignAztec", "tonalCounsel", "result"],
      "tonal",
      { en: "Read the tonal counsel", zh: "读取托纳尔指引", hant: "讀取托納爾指引" },
      TONAL,
      "the day-sign",
      "日符",
      true
    ),

    "mayan-tzolkin": rite(
      {
        en: "The Tzolk’in is the Maya 260-day count still kept by highland daykeepers for destiny and ceremony.",
        zh: "卓尔金是玛雅二百六十日计数，高原日守仍用于命运与仪典。",
        hant: "卓爾金是瑪雅二百六十日計數，高原日守仍用於命運與儀典。",
      },
      howPack(
        {
          intro: "You’ll enter a birth date, meet a teaching nawal, then read the Tzolk’in lean.",
          steps: [
            { title: "Meet Tzolk’in", body: "260 days · nawales." },
            { title: "Enter a birth date", body: "Teaching count seed." },
            { title: "Meet your nawal", body: "Nawal appears." },
            { title: "Read the Tzolk’in counsel", body: "Nawal lean." },
            { title: "Tzolk’in counsel", body: "Lean for your date." },
          ],
        },
        {
          intro: "你将输入生日、会见教学纳瓦尔，再读卓尔金倾向。",
          steps: [
            { title: "认识卓尔金", body: "二百六十日 · 纳瓦尔。" },
            { title: "输入生日", body: "教学历种。" },
            { title: "会见纳瓦尔", body: "纳瓦尔出现。" },
            { title: "读取卓尔金指引", body: "纳瓦尔倾向。" },
            { title: "卓尔金指引", body: "对照生日。" },
          ],
        },
        {
          intro: "你將輸入生日、會見教學納瓦爾，再讀卓爾金傾向。",
          steps: [
            { title: "認識卓爾金", body: "二百六十日 · 納瓦爾。" },
            { title: "輸入生日", body: "教學曆種。" },
            { title: "會見納瓦爾", body: "納瓦爾出現。" },
            { title: "讀取卓爾金指引", body: "納瓦爾傾向。" },
            { title: "卓爾金指引", body: "對照生日。" },
          ],
        }
      ),
      ["intent", "birth", "nawalesPick", "tzolkinCounsel", "result"],
      "tzolkin",
      { en: "Read the Tzolk’in counsel", zh: "读取卓尔金指引", hant: "讀取卓爾金指引" },
      TZOLKIN,
      "the nawal",
      "纳瓦尔",
      true
    ),

    "zapotec-mixtec": rite(
      {
        en: "Zapotec and Mixtec day counts are related 260-day destiny systems of southern Mexico (Oaxaca).",
        zh: "萨波特克／米斯特克日计数是南墨西哥（瓦哈卡）相关的二百六十日命运体系。",
        hant: "薩波特克／米斯特克日計數是南墨西哥（瓦哈卡）相關的二百六十日命運體系。",
      },
      howPack(
        {
          intro: "You’ll enter a birth date, meet an Oaxaca teaching day, then read the lean.",
          steps: [
            { title: "Meet Zapotec / Mixtec count", body: "Oaxaca · 260 days." },
            { title: "Enter a birth date", body: "Teaching count seed." },
            { title: "Meet the Oaxaca day", body: "Day appears." },
            { title: "Read the Zapotec counsel", body: "Day lean." },
            { title: "Zapotec counsel", body: "Lean for your date." },
          ],
        },
        {
          intro: "你将输入生日、会见瓦哈卡教学日，再读倾向。",
          steps: [
            { title: "认识萨波特克／米斯特克", body: "瓦哈卡 · 二百六十日。" },
            { title: "输入生日", body: "教学历种。" },
            { title: "会见瓦哈卡日", body: "日出现。" },
            { title: "读取萨波特克指引", body: "日倾向。" },
            { title: "萨波特克指引", body: "对照生日。" },
          ],
        },
        {
          intro: "你將輸入生日、會見瓦哈卡教學日，再讀傾向。",
          steps: [
            { title: "認識薩波特克／米斯特克", body: "瓦哈卡 · 二百六十日。" },
            { title: "輸入生日", body: "教學曆種。" },
            { title: "會見瓦哈卡日", body: "日出現。" },
            { title: "讀取薩波特克指引", body: "日傾向。" },
            { title: "薩波特克指引", body: "對照生日。" },
          ],
        }
      ),
      ["intent", "birth", "oaxacaDay", "zapotecCounsel", "result"],
      "zapotec",
      { en: "Read the Zapotec counsel", zh: "读取萨波特克指引", hant: "讀取薩波特克指引" },
      ZAP,
      "the Oaxaca day",
      "瓦哈卡日",
      true
    ),

    "maize-casting": rite(
      {
        en: "Maize seed casting uses kernels with the 260-day calendar for diagnosis and counsel (Mixe / Mesoamerica).",
        zh: "玉米粒占结合二百六十日历作诊断与指引（米赫／中美洲）。",
        hant: "玉米粒占結合二百六十日曆作診斷與指引（米赫／中美洲）。",
      },
      howPack(
        {
          intro: "You’ll hold a question, cast teaching maize, then read the kernel pattern lean.",
          steps: [
            { title: "Meet Maize Casting", body: "Kernels · calendar · counsel." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Cast the maize", body: "Teaching kernels." },
            { title: "See the maize pattern", body: "Pattern settles." },
            { title: "Read the maize counsel", body: "Pattern lean." },
            { title: "Maize counsel", body: "Lean for your question." },
          ],
        },
        {
          intro: "你将抱定问题、抛下教学玉米粒，再读格局倾向。",
          steps: [
            { title: "认识玉米粒占", body: "粒 · 历 · 指引。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "抛下玉米粒", body: "教学粒。" },
            { title: "查看玉米格局", body: "格局安定。" },
            { title: "读取玉米指引", body: "格局倾向。" },
            { title: "玉米指引", body: "对照问题。" },
          ],
        },
        {
          intro: "你將抱定問題、拋下教學玉米粒，再讀格局傾向。",
          steps: [
            { title: "認識玉米粒占", body: "粒 · 曆 · 指引。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "拋下玉米粒", body: "教學粒。" },
            { title: "查看玉米格局", body: "格局安定。" },
            { title: "讀取玉米指引", body: "格局傾向。" },
            { title: "玉米指引", body: "對照問題。" },
          ],
        }
      ),
      ["intent", "question", "castMaize", "maizePattern", "maizeCounsel", "result"],
      "maize",
      { en: "Read the maize counsel", zh: "读取玉米指引", hant: "讀取玉米指引" },
      MAIZE,
      "the maize pattern",
      "玉米格局",
      false
    ),

    "mazatec-curandero": rite(
      {
        en: "Mazatec divinatory curing (chjota chjine) uses ritual, plants, and dream calling for personal and medical oracles — teaching sim only.",
        zh: "马萨特克占卜治愈（chjota chjine）以仪轨、草木与梦召作个人与医疗神谕——仅教学模拟。",
        hant: "馬薩特克占卜治癒（chjota chjine）以儀軌、草木與夢召作個人與醫療神諭——僅教學模擬。",
      },
      howPack(
        {
          intro: "You’ll hold a question, sense a teaching plant call, then meet a dream-call lean.",
          steps: [
            { title: "Meet Mazatec curing", body: "Ritual · plants · dreams." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Sense the plant call", body: "Teaching plants." },
            { title: "Meet the dream call", body: "Night message." },
            { title: "Read the Mazatec counsel", body: "Call lean." },
            { title: "Mazatec counsel", body: "Lean for your question." },
          ],
        },
        {
          intro: "你将抱定问题、感受教学草木召，再会见梦召倾向。",
          steps: [
            { title: "认识马萨特克治愈", body: "仪轨 · 草木 · 梦。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "感受草木召", body: "教学草木。" },
            { title: "会见梦召", body: "夜讯。" },
            { title: "读取马萨特克指引", body: "召倾向。" },
            { title: "马萨特克指引", body: "对照问题。" },
          ],
        },
        {
          intro: "你將抱定問題、感受教學草木召，再會見夢召傾向。",
          steps: [
            { title: "認識馬薩特克治癒", body: "儀軌 · 草木 · 夢。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "感受草木召", body: "教學草木。" },
            { title: "會見夢召", body: "夜訊。" },
            { title: "讀取馬薩特克指引", body: "召傾向。" },
            { title: "馬薩特克指引", body: "對照問題。" },
          ],
        }
      ),
      ["intent", "question", "plantCall", "dreamCall", "mazatecCounsel", "result"],
      "mazatec",
      { en: "Read the Mazatec counsel", zh: "读取马萨特克指引", hant: "讀取馬薩特克指引" },
      MAZ,
      "the plant/dream call",
      "草木／梦召",
      false
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
            "本站为教育性游玩——不能替代受训日守／治愈师、医疗、法律或安全判断。",
            "本站為教育性遊玩——不能替代受訓日守／治癒師、醫療、法律或安全判斷。"
          )
        : "Educational play on this site — not a substitute for trained daykeeper/curer practice, medicine, law, or safety judgment.",
    };
  }
  function runCast(id, state) {
    const riteObj = RITES[id];
    if (!riteObj) return null;
    const rng = mulberry32(seedFrom(state.birthDate || state.question || state.focus, state.nonce, id));
    const cast = Object.assign({}, state.cast || {}, riteObj.buildCast(state, rng) || {});
    return riteObj.generate(state.question || state.focus || state.birthDate || "", cast, rng);
  }

  window.FatumMesoamericaOracles = { IDS, has, get, howFor, runCast, loc };
})();
