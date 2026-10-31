/**
 * Folk scrying & European folk oracles — unique steps, visuals, readings.
 * Scrying · Tea leaves · Dowsing · Ceromancy · Slavic · Svyatki · Baltic/Finnic ·
 * Mordovian · Apple peel · Oomancy · Nephomancy · Capnomancy · Pyromancy ·
 * Hydromancy · Domino · Dream interpretation
 */
(function () {
  "use strict";

  const IDS = [
    "scrying",
    "tasseography-tea",
    "dowsing",
    "ceromancy",
    "slavic-folk",
    "russian-svyatki",
    "baltic-finnic",
    "mordovian",
    "apple-peel",
    "oomancy",
    "nephomancy",
    "capnomancy",
    "pyromancy",
    "hydromancy",
    "domino",
    "dream-interp",
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
      kind: "folkscry",
      ...r,
      disclaimer: isZh()
        ? zhText(
            "教育性模拟——不能替代受训民俗／冥想实践，也不能替代医疗、法律或安全判断。可能不准确；无法预测黑天鹅事件。",
            "教育性模擬——不能替代受訓民俗／冥想實踐，也不能替代醫療、法律或安全判斷。可能不準確；無法預測黑天鵝事件。"
          )
        : "Educational simulation — not a substitute for trained folk/meditative practice, medicine, law, or safety judgment. May be inaccurate; cannot predict black swan events.",
    };
    return RM ? RM.structuredReading(base) : base;
  }
  function interpretQ(q, lean, mechanic) {
    const RM = window.FatumResultModel;
    const body = isZh()
      ? zhText(
          `你问的是「${q || "未写明的事"}」。以${mechanic}给出的「${lean}」倾向为镜：先改一件你能控制的安排，再用日常证据核对——不要把模拟兆当作外在命令。`,
          `你問的是「${q || "未寫明的事"}」。以${mechanic}給出的「${lean}」傾向為鏡：先改一件你能控制的安排，再用日常證據核對——不要把模擬兆當作外在命令。`
        )
      : `You asked about “${q || "an unnamed matter"}”. Hold the “${lean}” lean from ${mechanic} as a mirror: change one arrangement you control, then check ordinary evidence — do not treat a simulated omen as an external order.`;
    return RM ? RM.interpretWithQuestion(q, body) : body;
  }
  function howPack(en, zh, hant) {
    return { en, zh, hant: hant || zh };
  }
  function omen(en, zh, leanEn, leanZh, leanHant) {
    return { en, zh, lean: { en: leanEn, zh: leanZh, hant: leanHant || leanZh } };
  }

  const SCRY = [
    omen("Doorway gleam", "门光", "a threshold opens · step kindly", "门槛打开·温和迈入", "門檻打開·溫和邁入"),
    omen("Ripple face", "涟漪脸", "someone returns · stay soft", "有人归来·保持柔", "有人歸來·保持柔"),
    omen("Fog blank", "雾白", "unclear · wait one day", "不明·等一日", "不明·等一日"),
    omen("Path light", "路光", "choose one lane", "只选一条路", "只選一條路"),
  ];
  const TEA = [
    omen("Bird trail", "鸟迹", "news arrives · stay light", "消息将至·保持轻", "消息將至·保持輕"),
    omen("Ring circle", "圆环", "close a loop kindly", "善意收尾", "善意收尾"),
    omen("Road line", "路纹", "travel or move soon", "宜行或迁移", "宜行或遷移"),
    omen("Heart swirl", "心漩", "tend a relationship", "关照一段关系", "關照一段關係"),
  ];
  const PEND = [
    omen("Strong yes swing", "强是摆", "yes · proceed with a witness", "是·有人见证再行", "是·有人見證再行"),
    omen("Steady no", "稳否", "no · hold the line", "否·守住界线", "否·守住界線"),
    omen("Circle stall", "绕圈", "unclear · rephrase the ask", "不明·改问法", "不明·改問法"),
    omen("Soft yes", "柔是", "lean yes · trial one step", "偏是·试一步", "偏是·試一步"),
  ];
  const WAX = [
    omen("Shield blob", "盾形", "protect · set a boundary", "保护·设界", "保護·設界"),
    omen("Key drip", "钥匙滴", "unlock one stuck door", "打开一扇卡住的门", "打開一扇卡住的門"),
    omen("Ring pool", "环池", "bond talk · clarify terms", "关系谈·澄清条款", "關係談·澄清條款"),
    omen("Scatter flecks", "散点", "release worry · breathe", "放下忧虑·呼吸", "放下憂慮·呼吸"),
  ];
  const SLAVIC = [
    omen("Mirror midnight", "午夜镜", "glimpse · do not chase", "一瞥·勿追", "一瞥·勿追"),
    omen("Hen peck grain", "鸡啄谷", "pick one clear option", "只选一个清楚选项", "只選一個清楚選項"),
    omen("Crossroads listen", "十字路口听", "eavesdrop on chance words", "偶闻一句·作镜", "偶聞一句·作鏡"),
    omen("Garland float", "花环漂", "name floats toward you", "名字向你漂来", "名字向你漂來"),
  ];
  const SVYATKI = [
    omen("Candle shadow", "烛影", "silhouette of a next step", "下一步的剪影", "下一步的剪影"),
    omen("Tin in water", "水中锡", "shape of a household change", "家事变化之形", "家事變化之形"),
    omen("Shoe at door", "门边鞋", "visitor or proposal theme", "访客或提亲主题", "訪客或提親主題"),
    omen("Fire crackle", "火噼啪", "heat rising · pace yourself", "热升·控节奏", "熱升·控節奏"),
  ];
  const BALTIC = [
    omen("Midsummer lot", "仲夏签", "season favor · gather outdoors", "季节吉·户外聚会", "季節吉·戶外聚會"),
    omen("Dream birch", "梦桦", "begin · clean slate", "起势·白纸", "起勢·白紙"),
    omen("Lake sign", "湖兆", "reflect · then decide", "先映照·再决定", "先映照·再決定"),
    omen("Forest hush", "林静", "listen more · speak less", "多听·少说", "多聽·少說"),
  ];
  const MORDOV = [
    omen("Bread under pillow", "枕下面包", "dream of a household bond", "梦见家事连结", "夢見家事連結"),
    omen("Blind horse turn", "蒙眼马转", "path points one way", "路指向一方", "路指向一方"),
    omen("Firewood odd count", "柴奇数", "single theme · wait", "单身主题·等待", "單身主題·等待"),
    omen("Shoe line long", "鞋列长", "queue of suitors · choose slowly", "追求者队列·慢选", "追求者隊列·慢選"),
  ];
  const APPLE = [
    omen("Initial S curve", "S弯", "name hint S · stay curious", "姓名提示S·保持好奇", "姓名提示S·保持好奇"),
    omen("Initial M loop", "M环", "name hint M · ask gently", "姓名提示M·温和问", "姓名提示M·溫和問"),
    omen("Broken peel", "断皮", "no clear initial · relax", "无清晰首字母·放松", "無清晰首字母·放鬆"),
    omen("Heart peel", "心形皮", "affection theme · soft step", "情谊主题·柔步", "情誼主題·柔步"),
  ];
  const EGG = [
    omen("White plume", "蛋白羽", "message rising · listen", "讯息升起·倾听", "訊息升起·傾聽"),
    omen("Cloud swirl", "云漩", "confusion · clarify one fact", "混沌·澄清一件事实", "混沌·澄清一件事實"),
    omen("Tower rise", "塔升", "ambition · build slowly", "志向·慢建", "志向·慢建"),
    omen("Clear settle", "澄净", "calm path · no rush", "静路·勿赶", "靜路·勿趕"),
  ];
  const CLOUD = [
    omen("Ship cloud", "船云", "travel theme · pack light", "出行主题·轻装", "出行主題·輕裝"),
    omen("Face cloud", "脸云", "someone on your mind · message them", "有人在心上·捎一句", "有人在心上·捎一句"),
    omen("Mountain cloud", "山云", "slow climb · persist", "慢爬·坚持", "慢爬·堅持"),
    omen("Scatter mist", "散雾", "no firm shape · wait weather", "无形·等天气", "無形·等天氣"),
  ];
  const SMOKE = [
    omen("Smoke right", "烟向右", "favor · proceed carefully", "吉·谨慎前行", "吉·謹慎前行"),
    omen("Smoke left", "烟向左", "caution · delay", "慎·延后", "慎·延後"),
    omen("Smoke column", "烟柱", "steady yes · keep pace", "稳是·守节奏", "穩是·守節奏"),
    omen("Smoke break", "烟断", "interrupted · restart clean", "中断·干净重来", "中斷·乾淨重來"),
  ];
  const FIRE = [
    omen("Tall bright flame", "高亮焰", "energy high · channel it", "能量高·引导它", "能量高·引導它"),
    omen("Crackling sparks", "噼啪星火", "news · stay alert", "消息·保持警觉", "消息·保持警覺"),
    omen("Low blue tip", "低蓝尖", "quiet work · go inward", "静工·向内", "靜工·向內"),
    omen("Flicker die", "焰熄", "pause · refill fuel", "停顿·补给", "停頓·補給"),
  ];
  const WATER = [
    omen("Clear ripple", "清涟", "truth surfaces · name it", "真相浮现·说清", "真相浮現·說清"),
    omen("Oil sheen", "油光", "mixed motives · verify", "动机杂·核实", "動機雜·核實"),
    omen("Still mirror", "静镜", "reflect · then act", "先映照·再行动", "先映照·再行動"),
    omen("Muddy swirl", "浊漩", "wait for clarity", "等清明", "等清明"),
  ];
  const DOMINO = [
    omen("6–6 double", "双六", "fullness · share the win", "圆满·分享胜果", "圓滿·分享勝果"),
    omen("3–1 split", "三一", "small start · ask help", "小起步·求助", "小起步·求助"),
    omen("5–2 travel", "五二", "move · leave buffer", "迁移·留缓冲", "遷移·留緩衝"),
    omen("0–0 blank", "双空", "empty slate · invent", "白板·开创", "白板·開創"),
  ];
  const DREAMS = [
    omen("Water dream", "水梦", "flow around obstacles", "绕障而行", "繞障而行"),
    omen("House dream", "屋梦", "tend the base", "照料根基", "照料根基"),
    omen("Chase dream", "追梦", "name what you avoid", "说出你回避的", "說出你迴避的"),
    omen("Flight dream", "飞梦", "rise · keep a landing plan", "升起·留着陆计划", "升起·留著陸計劃"),
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
        const note = state.dreamNote || state.question || "";
        return { item, note, lean: loc(item.lean) };
      },
      generate(q, cast) {
        const n = loc({ en: cast.item.en, zh: cast.item.zh });
        const ask = q || cast.note || "";
        return pack({
          title: cast.note && cast.note !== ask ? `${cast.note} · ${n}` : n,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学示「${n}」，倾向「${cast.lean}」。民俗镜子，不是科学预测。`, `教學示「${n}」，傾向「${cast.lean}」。民俗鏡子，不是科學預測。`)
            : `Teaching shows “${n}”, leaning “${cast.lean}”. A folk mirror, not a scientific forecast.`,
          interpret: interpretQ(ask, cast.lean, isZh() ? mechanicZh : mechanicEn),
          details: cast.note && cast.note !== n ? [cast.note, n] : [n],
          doList: [
            isZh()
              ? zhText(`按「${cast.lean}」做一件今天可完成的小事。`, `按「${cast.lean}」做一件今天可完成的小事。`)
              : `Do one small today-action matching “${cast.lean}”.`,
          ],
          dontList: [
            isZh()
              ? zhText("不要用民俗兆恐吓他人感情或健康。", "不要用民俗兆恐嚇他人感情或健康。")
              : "Do not frighten others about love or health with folk omens.",
          ],
          tone: /wait|no|unclear|caution|delay|否|不明|慎|等|空|断|熄|浊/i.test(n + cast.lean) ? "caution" : "mixed",
          vizData: cast,
        });
      },
    };
  }

  const RITES = {
    scrying: rite(
      {
        en: "Crystal and mirror scrying seeks images in a polished surface — soft focus counsel, not literal sight.",
        zh: "水晶／镜占在抛光表面中寻视图像——柔焦指引，不是字面看见。",
        hant: "水晶／鏡占在拋光表面中尋視圖像——柔焦指引，不是字面看見。",
      },
      howPack(
        {
          intro: "You’ll hold a question, gaze into a teaching crystal, then read the image lean.",
          steps: [
            { title: "Meet scrying", body: "Crystal · mirror · soft focus." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Gaze into the crystal", body: "Soften your eyes." },
            { title: "Note a scry image", body: "Shape appears." },
            { title: "Read the scry counsel", body: "Image lean appears." },
            { title: "Scry counsel", body: "Lean for your question." },
          ],
        },
        {
          intro: "你将抱定问题、凝视教学水晶，再读图像倾向。",
          steps: [
            { title: "认识水晶占", body: "水晶 · 镜 · 柔焦。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "凝视水晶", body: "放松眼神。" },
            { title: "记下视像", body: "形状出现。" },
            { title: "读取视像指引", body: "图像倾向出现。" },
            { title: "视像指引", body: "图像对照问题。" },
          ],
        },
        {
          intro: "你將抱定問題、凝視教學水晶，再讀圖像傾向。",
          steps: [
            { title: "認識水晶占", body: "水晶 · 鏡 · 柔焦。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "凝視水晶", body: "放鬆眼神。" },
            { title: "記下視像", body: "形狀出現。" },
            { title: "讀取視像指引", body: "圖像傾向出現。" },
            { title: "視像指引", body: "圖像對照問題。" },
          ],
        }
      ),
      ["intent", "question", "gazeCrystal", "scryImage", "scryCounsel", "result"],
      "scry",
      { en: "Read the scry counsel", zh: "读取视像指引", hant: "讀取視像指引" },
      SCRY,
      "the scry image",
      "视像"
    ),

    "tasseography-tea": rite(
      {
        en: "Tea-leaf reading interprets shapes left by leaves in a cup — folk counsel for news, travel, and bonds.",
        zh: "茶叶占解读杯底叶形——民俗指引论消息、出行与关系。",
        hant: "茶葉占解讀杯底葉形——民俗指引論消息、出行與關係。",
      },
      howPack(
        {
          intro: "You’ll hold a question, brew a teaching cup, then read the leaf lean.",
          steps: [
            { title: "Meet tea-leaf reading", body: "Cup · leaves · shapes." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Brew the tea", body: "Leaves settle." },
            { title: "See the leaf shapes", body: "Patterns form." },
            { title: "Read the tea counsel", body: "Shape lean appears." },
            { title: "Tea counsel", body: "Lean for your question." },
          ],
        },
        {
          intro: "你将抱定问题、冲泡教学茶，再读叶形倾向。",
          steps: [
            { title: "认识茶叶占", body: "杯 · 叶 · 形。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "冲泡茶", body: "叶沉淀。" },
            { title: "查看叶形", body: "图案成形。" },
            { title: "读取茶叶指引", body: "形兆倾向出现。" },
            { title: "茶叶指引", body: "形意对照问题。" },
          ],
        },
        {
          intro: "你將抱定問題、沖泡教學茶，再讀葉形傾向。",
          steps: [
            { title: "認識茶葉占", body: "杯 · 葉 · 形。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "沖泡茶", body: "葉沉澱。" },
            { title: "查看葉形", body: "圖案成形。" },
            { title: "讀取茶葉指引", body: "形兆傾向出現。" },
            { title: "茶葉指引", body: "形意對照問題。" },
          ],
        }
      ),
      ["intent", "question", "brewTea", "teaLeaves", "teaCounsel", "result"],
      "tea",
      { en: "Read the tea counsel", zh: "读取茶叶指引", hant: "讀取茶葉指引" },
      TEA,
      "tea leaves",
      "茶叶形"
    ),

    dowsing: rite(
      {
        en: "Dowsing uses a rod or pendulum swing for yes/no and location themes — written early in German mining lore.",
        zh: "寻物／摆锤以棍或摆动作是／否与定位主题——早见于德国矿冶记载。",
        hant: "尋物／擺錘以棍或擺動作是／否與定位主題——早見於德國礦冶記載。",
      },
      howPack(
        {
          intro: "You’ll hold a question, steady a teaching pendulum, then read the swing lean.",
          steps: [
            { title: "Meet Dowsing", body: "Rod · pendulum · yes/no." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Hold the pendulum", body: "Still the hand." },
            { title: "Watch the swing", body: "Motion settles." },
            { title: "Read the dowsing counsel", body: "Swing lean appears." },
            { title: "Dowsing counsel", body: "Lean for your question." },
          ],
        },
        {
          intro: "你将抱定问题、持定教学摆锤，再读摆动倾向。",
          steps: [
            { title: "认识寻物摆锤", body: "棍 · 摆 · 是／否。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "持定摆锤", body: "手安定。" },
            { title: "观看摆动", body: "动作安定。" },
            { title: "读取摆锤指引", body: "摆动倾向出现。" },
            { title: "摆锤指引", body: "摆意对照问题。" },
          ],
        },
        {
          intro: "你將抱定問題、持定教學擺錘，再讀擺動傾向。",
          steps: [
            { title: "認識尋物擺錘", body: "棍 · 擺 · 是／否。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "持定擺錘", body: "手安定。" },
            { title: "觀看擺動", body: "動作安定。" },
            { title: "讀取擺錘指引", body: "擺動傾向出現。" },
            { title: "擺錘指引", body: "擺意對照問題。" },
          ],
        }
      ),
      ["intent", "question", "holdPendulum", "pendulumSwing", "dowsingCounsel", "result"],
      "pendulum",
      { en: "Read the dowsing counsel", zh: "读取摆锤指引", hant: "讀取擺錘指引" },
      PEND,
      "the pendulum swing",
      "摆锤"
    ),

    ceromancy: rite(
      {
        en: "Ceromancy pours melted wax into water; the cooled shape is read as an omen (teaching pour — no hot wax here).",
        zh: "蜡占将熔蜡倒入水中，以冷却形状作兆（教学倾倒——无真实热蜡）。",
        hant: "蠟占將熔蠟倒入水中，以冷卻形狀作兆（教學傾倒——無真實熱蠟）。",
      },
      howPack(
        {
          intro: "You’ll hold a question, pour teaching wax into water, then read the shape lean.",
          steps: [
            { title: "Meet Ceromancy", body: "Wax · water · shape." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Pour the wax", body: "Teaching pour only." },
            { title: "See the wax shape", body: "Shape cools." },
            { title: "Read the wax counsel", body: "Shape lean appears." },
            { title: "Wax counsel", body: "Lean for your question." },
          ],
        },
        {
          intro: "你将抱定问题、将教学蜡倒入水中，再读蜡形倾向。",
          steps: [
            { title: "认识蜡占", body: "蜡 · 水 · 形。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "浇下蜡", body: "仅教学倾倒。" },
            { title: "查看蜡形", body: "形状冷却。" },
            { title: "读取蜡形指引", body: "形兆倾向出现。" },
            { title: "蜡占指引", body: "形意对照问题。" },
          ],
        },
        {
          intro: "你將抱定問題、將教學蠟倒入水中，再讀蠟形傾向。",
          steps: [
            { title: "認識蠟占", body: "蠟 · 水 · 形。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "澆下蠟", body: "僅教學傾倒。" },
            { title: "查看蠟形", body: "形狀冷卻。" },
            { title: "讀取蠟形指引", body: "形兆傾向出現。" },
            { title: "蠟占指引", body: "形意對照問題。" },
          ],
        }
      ),
      ["intent", "question", "pourWax", "waxShape", "waxCounsel", "result"],
      "wax",
      { en: "Read the wax counsel", zh: "读取蜡形指引", hant: "讀取蠟形指引" },
      WAX,
      "the wax shape",
      "蜡形"
    ),

    "slavic-folk": rite(
      {
        en: "Slavic folk divination gathers Yuletide and Midsummer rites — mirrors, garlands, hens, and crossroads listening.",
        zh: "斯拉夫民俗占汇集岁末与仲夏仪轨——镜、花环、鸡啄与十字路口倾听。",
        hant: "斯拉夫民俗占匯集歲末與仲夏儀軌——鏡、花環、雞啄與十字路口傾聽。",
      },
      howPack(
        {
          intro: "You’ll hold a question, pick a teaching Slavic rite, then read the omen lean.",
          steps: [
            { title: "Meet Slavic folk rites", body: "Yuletide · Midsummer · lots." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Pick a Slavic rite", body: "Mirror · hen · crossroads…" },
            { title: "See the folk omen", body: "Omen lights." },
            { title: "Read the Slavic counsel", body: "Omen lean appears." },
            { title: "Slavic counsel", body: "Lean for your question." },
          ],
        },
        {
          intro: "你将抱定问题、选择教学斯拉夫仪轨，再读兆意。",
          steps: [
            { title: "认识斯拉夫民俗", body: "岁末 · 仲夏 · 签。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "选择斯拉夫仪轨", body: "镜 · 鸡 · 路口…" },
            { title: "查看民俗兆", body: "兆点亮。" },
            { title: "读取斯拉夫指引", body: "兆意倾向出现。" },
            { title: "斯拉夫指引", body: "兆意对照问题。" },
          ],
        },
        {
          intro: "你將抱定問題、選擇教學斯拉夫儀軌，再讀兆意。",
          steps: [
            { title: "認識斯拉夫民俗", body: "歲末 · 仲夏 · 籤。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "選擇斯拉夫儀軌", body: "鏡 · 雞 · 路口…" },
            { title: "查看民俗兆", body: "兆點亮。" },
            { title: "讀取斯拉夫指引", body: "兆意傾向出現。" },
            { title: "斯拉夫指引", body: "兆意對照問題。" },
          ],
        }
      ),
      ["intent", "question", "pickSlavicRite", "slavicOmen", "slavicCounsel", "result"],
      "slavic",
      { en: "Read the Slavic counsel", zh: "读取斯拉夫指引", hant: "讀取斯拉夫指引" },
      SLAVIC,
      "the Slavic omen",
      "斯拉夫兆"
    ),

    "russian-svyatki": rite(
      {
        en: "Russian Svyatki fortune-telling uses Christmastide fire, candle shadows, tin/wax in water, and marriage omens.",
        zh: "俄罗斯圣周期占用圣诞季的火、烛影、水中锡／蜡与婚恋兆。",
        hant: "俄羅斯聖週期占用聖誕季的火、燭影、水中錫／蠟與婚戀兆。",
      },
      howPack(
        {
          intro: "You’ll hold a question, tend a teaching Svyatki fire, then read a shadow-or-wax lean.",
          steps: [
            { title: "Meet Svyatki rites", body: "Christmastide · fire · wax." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Tend the Svyatki fire", body: "Candle and hearth." },
            { title: "See shadow or wax", body: "Shape appears." },
            { title: "Read the Svyatki counsel", body: "Omen lean appears." },
            { title: "Svyatki counsel", body: "Lean for your question." },
          ],
        },
        {
          intro: "你将抱定问题、照料教学圣周期之火，再读影／蜡倾向。",
          steps: [
            { title: "认识圣周期", body: "圣诞季 · 火 · 蜡。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "照料圣周期之火", body: "烛与炉。" },
            { title: "查看影或蜡", body: "形状出现。" },
            { title: "读取圣周期指引", body: "兆意倾向出现。" },
            { title: "圣周期指引", body: "兆意对照问题。" },
          ],
        },
        {
          intro: "你將抱定問題、照料教學聖週期之火，再讀影／蠟傾向。",
          steps: [
            { title: "認識聖週期", body: "聖誕季 · 火 · 蠟。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "照料聖週期之火", body: "燭與爐。" },
            { title: "查看影或蠟", body: "形狀出現。" },
            { title: "讀取聖週期指引", body: "兆意傾向出現。" },
            { title: "聖週期指引", body: "兆意對照問題。" },
          ],
        }
      ),
      ["intent", "question", "svyatkiFire", "shadowWax", "svyatkiCounsel", "result"],
      "svyatki",
      { en: "Read the Svyatki counsel", zh: "读取圣周期指引", hant: "讀取聖週期指引" },
      SVYATKI,
      "the Svyatki omen",
      "圣周期兆"
    ),

    "baltic-finnic": rite(
      {
        en: "Baltic and Finnic folk divination uses seasonal lots, dreams, and nature signs across the northern rim.",
        zh: "波罗的／芬兰－乌戈尔民俗占以季节签、梦与自然兆遍及北缘。",
        hant: "波羅的／芬蘭－烏戈爾民俗占以季節籤、夢與自然兆遍及北緣。",
      },
      howPack(
        {
          intro: "You’ll hold a question, pick a teaching season, then read a nature-sign lean.",
          steps: [
            { title: "Meet Baltic & Finnic rites", body: "Season · lots · nature." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Pick a season lens", body: "Midsummer · winter…" },
            { title: "See a nature sign", body: "Sign lights." },
            { title: "Read the Baltic counsel", body: "Sign lean appears." },
            { title: "Baltic counsel", body: "Lean for your question." },
          ],
        },
        {
          intro: "你将抱定问题、选择教学季节，再读自然兆倾向。",
          steps: [
            { title: "认识波罗的／芬兰民俗", body: "季节 · 签 · 自然。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "选择季节视角", body: "仲夏 · 冬…" },
            { title: "查看自然兆", body: "兆点亮。" },
            { title: "读取波罗的指引", body: "兆意倾向出现。" },
            { title: "波罗的指引", body: "兆意对照问题。" },
          ],
        },
        {
          intro: "你將抱定問題、選擇教學季節，再讀自然兆傾向。",
          steps: [
            { title: "認識波羅的／芬蘭民俗", body: "季節 · 籤 · 自然。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "選擇季節視角", body: "仲夏 · 冬…" },
            { title: "查看自然兆", body: "兆點亮。" },
            { title: "讀取波羅的指引", body: "兆意傾向出現。" },
            { title: "波羅的指引", body: "兆意對照問題。" },
          ],
        }
      ),
      ["intent", "question", "seasonPick", "natureSign", "balticCounsel", "result"],
      "baltic",
      { en: "Read the Baltic counsel", zh: "读取波罗的指引", hant: "讀取波羅的指引" },
      BALTIC,
      "the nature sign",
      "自然兆"
    ),

    mordovian: rite(
      {
        en: "Mordovian marriage divination uses Christmas rites — bread under pillows, blindfolded horses, firewood counts, shoe lines.",
        zh: "莫尔多瓦婚恋占用圣诞仪轨——枕下面包、蒙眼马、柴数与鞋列。",
        hant: "莫爾多瓦婚戀占用聖誕儀軌——枕下面包、蒙眼馬、柴數與鞋列。",
      },
      howPack(
        {
          intro: "You’ll hold a question, pick a teaching marriage rite, then read the shoe-line lean.",
          steps: [
            { title: "Meet Mordovian rites", body: "Christmas · marriage omens." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Pick a marriage rite", body: "Bread · horse · shoes…" },
            { title: "See the shoe-line omen", body: "Line settles." },
            { title: "Read the Mordovian counsel", body: "Omen lean appears." },
            { title: "Mordovian counsel", body: "Lean for your question." },
          ],
        },
        {
          intro: "你将抱定问题、选择教学婚恋仪轨，再读鞋列倾向。",
          steps: [
            { title: "认识莫尔多瓦仪轨", body: "圣诞 · 婚恋兆。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "选择婚恋仪轨", body: "面包 · 马 · 鞋…" },
            { title: "查看鞋列兆", body: "队列安定。" },
            { title: "读取莫尔多瓦指引", body: "兆意倾向出现。" },
            { title: "莫尔多瓦指引", body: "兆意对照问题。" },
          ],
        },
        {
          intro: "你將抱定問題、選擇教學婚戀儀軌，再讀鞋列傾向。",
          steps: [
            { title: "認識莫爾多瓦儀軌", body: "聖誕 · 婚戀兆。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "選擇婚戀儀軌", body: "麵包 · 馬 · 鞋…" },
            { title: "查看鞋列兆", body: "隊列安定。" },
            { title: "讀取莫爾多瓦指引", body: "兆意傾向出現。" },
            { title: "莫爾多瓦指引", body: "兆意對照問題。" },
          ],
        }
      ),
      ["intent", "question", "marriageRite", "shoeLine", "mordovianCounsel", "result"],
      "mordovian",
      { en: "Read the Mordovian counsel", zh: "读取莫尔多瓦指引", hant: "讀取莫爾多瓦指引" },
      MORDOV,
      "the Mordovian omen",
      "莫尔多瓦兆"
    ),

    "apple-peel": rite(
      {
        en: "Apple peel divination reads the shape of a long peel for a future initial or lover — Western Halloween folk play.",
        zh: "苹果皮占以长皮形状论未来姓氏首字母或恋人——西方万圣节民俗游玩。",
        hant: "蘋果皮占以長皮形狀論未來姓氏首字母或戀人——西方萬聖節民俗遊玩。",
      },
      howPack(
        {
          intro: "You’ll hold a question, peel a teaching apple, then read the initial lean.",
          steps: [
            { title: "Meet apple peel divination", body: "Peel · initial · lover lore." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Peel the apple", body: "Long unbroken strip." },
            { title: "See the peel initial", body: "Letter-like shape." },
            { title: "Read the apple counsel", body: "Initial lean appears." },
            { title: "Apple counsel", body: "Lean for your question." },
          ],
        },
        {
          intro: "你将抱定问题、削教学苹果皮，再读首字母倾向。",
          steps: [
            { title: "认识苹果皮占", body: "皮 · 首字母 · 恋人传说。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "削苹果皮", body: "尽量不断。" },
            { title: "查看皮形首字母", body: "字母状。" },
            { title: "读取苹果皮指引", body: "首字母倾向出现。" },
            { title: "苹果皮指引", body: "形意对照问题。" },
          ],
        },
        {
          intro: "你將抱定問題、削教學蘋果皮，再讀首字母傾向。",
          steps: [
            { title: "認識蘋果皮占", body: "皮 · 首字母 · 戀人傳說。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "削蘋果皮", body: "盡量不斷。" },
            { title: "查看皮形首字母", body: "字母狀。" },
            { title: "讀取蘋果皮指引", body: "首字母傾向出現。" },
            { title: "蘋果皮指引", body: "形意對照問題。" },
          ],
        }
      ),
      ["intent", "question", "peelApple", "peelInitial", "appleCounsel", "result"],
      "apple",
      { en: "Read the apple counsel", zh: "读取苹果皮指引", hant: "讀取蘋果皮指引" },
      APPLE,
      "the apple peel",
      "苹果皮"
    ),

    oomancy: rite(
      {
        en: "Oomancy drops egg white into water; the plume shapes are read as omens or spiritual diagnosis (teaching sim).",
        zh: "卵占将蛋白滴入水中，以羽状形态作兆或灵性诊断（教学模拟）。",
        hant: "卵占將蛋白滴入水中，以羽狀形態作兆或靈性診斷（教學模擬）。",
      },
      howPack(
        {
          intro: "You’ll hold a question, drop teaching egg white into water, then read the shape lean.",
          steps: [
            { title: "Meet Oomancy", body: "Egg · water · plumes." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Drop the egg white", body: "Teaching drop." },
            { title: "See the egg shape", body: "Plume forms." },
            { title: "Read the oomancy counsel", body: "Shape lean appears." },
            { title: "Oomancy counsel", body: "Lean for your question." },
          ],
        },
        {
          intro: "你将抱定问题、将教学蛋白滴入水中，再读形兆倾向。",
          steps: [
            { title: "认识卵占", body: "蛋 · 水 · 羽形。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "滴入蛋白", body: "教学滴落。" },
            { title: "查看卵形", body: "羽形成形。" },
            { title: "读取卵占指引", body: "形兆倾向出现。" },
            { title: "卵占指引", body: "形意对照问题。" },
          ],
        },
        {
          intro: "你將抱定問題、將教學蛋白滴入水中，再讀形兆傾向。",
          steps: [
            { title: "認識卵占", body: "蛋 · 水 · 羽形。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "滴入蛋白", body: "教學滴落。" },
            { title: "查看卵形", body: "羽形成形。" },
            { title: "讀取卵占指引", body: "形兆傾向出現。" },
            { title: "卵占指引", body: "形意對照問題。" },
          ],
        }
      ),
      ["intent", "question", "dropEgg", "eggShape", "oomancyCounsel", "result"],
      "egg",
      { en: "Read the oomancy counsel", zh: "读取卵占指引", hant: "讀取卵占指引" },
      EGG,
      "the egg plume",
      "卵形"
    ),

    nephomancy: rite(
      {
        en: "Nephomancy reads cloud shapes as signs — ancient sky-watching carried into folk Europe.",
        zh: "云占以云形作兆——古代观天延入欧洲民俗。",
        hant: "雲占以雲形作兆——古代觀天延入歐洲民俗。",
      },
      howPack(
        {
          intro: "You’ll hold a question, watch teaching clouds, then read the cloud-form lean.",
          steps: [
            { title: "Meet Nephomancy", body: "Clouds · shapes · signs." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Watch the clouds", body: "Sky opens." },
            { title: "See a cloud form", body: "Shape settles." },
            { title: "Read the cloud counsel", body: "Form lean appears." },
            { title: "Cloud counsel", body: "Lean for your question." },
          ],
        },
        {
          intro: "你将抱定问题、观看教学云空，再读云形倾向。",
          steps: [
            { title: "认识云占", body: "云 · 形 · 兆。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "观看云空", body: "天空打开。" },
            { title: "查看云形", body: "形状安定。" },
            { title: "读取云占指引", body: "云形倾向出现。" },
            { title: "云占指引", body: "形意对照问题。" },
          ],
        },
        {
          intro: "你將抱定問題、觀看教學雲空，再讀雲形傾向。",
          steps: [
            { title: "認識雲占", body: "雲 · 形 · 兆。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "觀看雲空", body: "天空打開。" },
            { title: "查看雲形", body: "形狀安定。" },
            { title: "讀取雲占指引", body: "雲形傾向出現。" },
            { title: "雲占指引", body: "形意對照問題。" },
          ],
        }
      ),
      ["intent", "question", "watchClouds", "cloudForm", "cloudCounsel", "result"],
      "cloud",
      { en: "Read the cloud counsel", zh: "读取云占指引", hant: "讀取雲占指引" },
      CLOUD,
      "the cloud form",
      "云形"
    ),

    capnomancy: rite(
      {
        en: "Capnomancy reads rising incense or sacrificial smoke for omens — teaching smoke drift only.",
        zh: "烟占以升起的香烟或祭烟作兆——仅教学烟向。",
        hant: "煙占以升起的香煙或祭煙作兆——僅教學煙向。",
      },
      howPack(
        {
          intro: "You’ll hold a question, raise teaching smoke, then read the drift lean.",
          steps: [
            { title: "Meet Capnomancy", body: "Smoke · drift · omens." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Raise the smoke", body: "Teaching incense." },
            { title: "See the smoke drift", body: "Direction settles." },
            { title: "Read the smoke counsel", body: "Drift lean appears." },
            { title: "Smoke counsel", body: "Lean for your question." },
          ],
        },
        {
          intro: "你将抱定问题、升起教学烟，再读烟向倾向。",
          steps: [
            { title: "认识烟占", body: "烟 · 流向 · 兆。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "升起烟", body: "教学香。" },
            { title: "查看烟向", body: "方向安定。" },
            { title: "读取烟占指引", body: "烟向倾向出现。" },
            { title: "烟占指引", body: "烟意对照问题。" },
          ],
        },
        {
          intro: "你將抱定問題、升起教學煙，再讀煙向傾向。",
          steps: [
            { title: "認識煙占", body: "煙 · 流向 · 兆。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "升起煙", body: "教學香。" },
            { title: "查看煙向", body: "方向安定。" },
            { title: "讀取煙占指引", body: "煙向傾向出現。" },
            { title: "煙占指引", body: "煙意對照問題。" },
          ],
        }
      ),
      ["intent", "question", "raiseSmoke", "smokeDrift", "smokeCounsel", "result"],
      "smoke",
      { en: "Read the smoke counsel", zh: "读取烟占指引", hant: "讀取煙占指引" },
      SMOKE,
      "the smoke drift",
      "烟向"
    ),

    pyromancy: rite(
      {
        en: "Pyromancy interprets flame flicker, crackle, and color — hearth and altar fire as counsel.",
        zh: "火占解读焰尖闪烁、噼啪与颜色——炉火与祭火作指引。",
        hant: "火占解讀焰尖閃爍、噼啪與顏色——爐火與祭火作指引。",
      },
      howPack(
        {
          intro: "You’ll hold a question, tend a teaching flame, then read the flicker lean.",
          steps: [
            { title: "Meet Pyromancy", body: "Flame · crackle · color." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Tend the flame", body: "Teaching fire." },
            { title: "See the flame flicker", body: "Motion settles." },
            { title: "Read the fire counsel", body: "Flicker lean appears." },
            { title: "Fire counsel", body: "Lean for your question." },
          ],
        },
        {
          intro: "你将抱定问题、照料教学火焰，再读焰闪倾向。",
          steps: [
            { title: "认识火占", body: "焰 · 噼啪 · 色。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "照料火焰", body: "教学火。" },
            { title: "查看焰闪", body: "动作安定。" },
            { title: "读取火占指引", body: "焰闪倾向出现。" },
            { title: "火占指引", body: "焰意对照问题。" },
          ],
        },
        {
          intro: "你將抱定問題、照料教學火焰，再讀焰閃傾向。",
          steps: [
            { title: "認識火占", body: "焰 · 噼啪 · 色。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "照料火焰", body: "教學火。" },
            { title: "查看焰閃", body: "動作安定。" },
            { title: "讀取火占指引", body: "焰閃傾向出現。" },
            { title: "火占指引", body: "焰意對照問題。" },
          ],
        }
      ),
      ["intent", "question", "tendFlame", "flameFlicker", "fireCounsel", "result"],
      "fire",
      { en: "Read the fire counsel", zh: "读取火占指引", hant: "讀取火占指引" },
      FIRE,
      "the flame",
      "火焰"
    ),

    hydromancy: rite(
      {
        en: "Hydromancy reads ripples, reflections, and colors on water as omens — basin and spring watching.",
        zh: "水占以水面涟漪、倒影与颜色作兆——盆水与泉观。",
        hant: "水占以水面漣漪、倒影與顏色作兆——盆水與泉觀。",
      },
      howPack(
        {
          intro: "You’ll hold a question, still a teaching basin, then read the ripple lean.",
          steps: [
            { title: "Meet Hydromancy", body: "Water · ripple · reflection." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Still the water", body: "Basin settles." },
            { title: "See a water ripple", body: "Surface speaks." },
            { title: "Read the water counsel", body: "Ripple lean appears." },
            { title: "Water counsel", body: "Lean for your question." },
          ],
        },
        {
          intro: "你将抱定问题、静置教学盆水，再读涟漪倾向。",
          steps: [
            { title: "认识水占", body: "水 · 涟漪 · 倒影。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "静置水面", body: "盆水安定。" },
            { title: "查看涟漪", body: "水面作答。" },
            { title: "读取水占指引", body: "涟漪倾向出现。" },
            { title: "水占指引", body: "水意对照问题。" },
          ],
        },
        {
          intro: "你將抱定問題、靜置教學盆水，再讀漣漪傾向。",
          steps: [
            { title: "認識水占", body: "水 · 漣漪 · 倒影。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "靜置水面", body: "盆水安定。" },
            { title: "查看漣漪", body: "水面作答。" },
            { title: "讀取水占指引", body: "漣漪傾向出現。" },
            { title: "水占指引", body: "水意對照問題。" },
          ],
        }
      ),
      ["intent", "question", "stillWater", "waterRipple", "waterCounsel", "result"],
      "water",
      { en: "Read the water counsel", zh: "读取水占指引", hant: "讀取水占指引" },
      WATER,
      "the water surface",
      "水面"
    ),

    domino: rite(
      {
        en: "Domino divination draws face-down tiles; number pairs are interpreted for counsel.",
        zh: "多米诺占抽取背面朝上的骨牌，以点数对作指引。",
        hant: "多米諾占抽取背面朝上的骨牌，以點數對作指引。",
      },
      howPack(
        {
          intro: "You’ll hold a question, draw a teaching domino, then read the pair lean.",
          steps: [
            { title: "Meet Domino divination", body: "Tiles · pairs · numbers." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Draw a domino", body: "Face-down pick." },
            { title: "See the domino pair", body: "Numbers show." },
            { title: "Read the domino counsel", body: "Pair lean appears." },
            { title: "Domino counsel", body: "Lean for your question." },
          ],
        },
        {
          intro: "你将抱定问题、抽取教学多米诺，再读点数对倾向。",
          steps: [
            { title: "认识多米诺占", body: "牌 · 对 · 点数。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "抽取多米诺", body: "背面抽取。" },
            { title: "查看点数对", body: "点数显现。" },
            { title: "读取多米诺指引", body: "点对倾向出现。" },
            { title: "多米诺指引", body: "点意对照问题。" },
          ],
        },
        {
          intro: "你將抱定問題、抽取教學多米諾，再讀點數對傾向。",
          steps: [
            { title: "認識多米諾占", body: "牌 · 對 · 點數。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "抽取多米諾", body: "背面抽取。" },
            { title: "查看點數對", body: "點數顯現。" },
            { title: "讀取多米諾指引", body: "點對傾向出現。" },
            { title: "多米諾指引", body: "點意對照問題。" },
          ],
        }
      ),
      ["intent", "question", "drawDomino", "dominoPair", "dominoCounsel", "result"],
      "domino",
      { en: "Read the domino counsel", zh: "读取多米诺指引", hant: "讀取多米諾指引" },
      DOMINO,
      "the domino pair",
      "多米诺点对"
    ),

    "dream-interp": {
      summary: {
        en: "Dream interpretation reads symbols in spontaneous or incubated dreams — nearly every culture keeps a dream book tradition.",
        zh: "解梦解读自发或孵梦中的象征——几乎每种文化都有梦书传统。",
        hant: "解夢解讀自發或孵夢中的象徵——幾乎每種文化都有夢書傳統。",
      },
      how: howPack(
        {
          intro: "You’ll note a dream image, match a teaching symbol, then read the dream counsel.",
          steps: [
            { title: "Meet dream interpretation", body: "Symbols · counsel." },
            { title: "Note a dream image", body: "What stood out?" },
            { title: "Match a dream symbol", body: "Teaching catalogue." },
            { title: "Read the dream counsel", body: "Symbol lean appears." },
            { title: "Dream counsel", body: "Lean for your image." },
          ],
        },
        {
          intro: "你将记录梦象、对照教学象征，再读梦意倾向。",
          steps: [
            { title: "认识解梦", body: "象征 · 指引。" },
            { title: "记录梦象", body: "什么最醒目？" },
            { title: "对照梦象征", body: "教学目录。" },
            { title: "读取梦意指引", body: "象征倾向出现。" },
            { title: "梦意指引", body: "象征对照梦象。" },
          ],
        },
        {
          intro: "你將記錄夢象、對照教學象徵，再讀夢意傾向。",
          steps: [
            { title: "認識解夢", body: "象徵 · 指引。" },
            { title: "記錄夢象", body: "什麼最醒目？" },
            { title: "對照夢象徵", body: "教學目錄。" },
            { title: "讀取夢意指引", body: "象徵傾向出現。" },
            { title: "夢意指引", body: "象徵對照夢象。" },
          ],
        }
      ),
      steps: ["intent", "dreamNoteFolk", "symbolMatch", "dreamFolkCounsel", "result"],
      viz: "dreamfolk",
      castCta: { en: "Read the dream counsel", zh: "读取梦意指引", hant: "讀取夢意指引" },
      buildCast(state, rng) {
        const note = state.dreamNote || (isZh() ? zhText("流水", "流水") : "running water");
        const item = pick(rng, DREAMS);
        return { item, note, lean: loc(item.lean) };
      },
      generate(q, cast) {
        const n = loc({ en: cast.item.en, zh: cast.item.zh });
        return pack({
          title: `${cast.note} · ${n}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学解梦以「${cast.note}」对照「${n}」，倾向「${cast.lean}」。不是临床解梦。`, `教學解夢以「${cast.note}」對照「${n}」，傾向「${cast.lean}」。不是臨床解夢。`)
            : `Teaching dream interpretation matches “${cast.note}” to “${n}”, leaning “${cast.lean}”. Not clinical dream therapy.`,
          interpret: interpretQ(q || cast.note, cast.lean, isZh() ? "梦象征" : "the dream symbol"),
          details: [cast.note, n],
          doList: [
            isZh()
              ? zhText(`按「${cast.lean}」处理今天一个卡住的决定。`, `按「${cast.lean}」處理今天一個卡住的決定。`)
              : `Handle one stuck decision today matching “${cast.lean}”.`,
          ],
          dontList: [
            isZh()
              ? zhText("不要用梦兆替代心理医疗。", "不要用夢兆替代心理醫療。")
              : "Do not replace mental-health care with dream omens.",
          ],
          tone: "deep",
          vizData: cast,
        });
      },
    },
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
            "本站为教育性游玩——不能替代受训民俗／冥想、医疗、法律或安全判断。",
            "本站為教育性遊玩——不能替代受訓民俗／冥想、醫療、法律或安全判斷。"
          )
        : "Educational play on this site — not a substitute for trained folk/meditative practice, medicine, law, or safety judgment.",
    };
  }
  function runCast(id, state) {
    const riteObj = RITES[id];
    if (!riteObj) return null;
    const rng = mulberry32(seedFrom(state.question || state.dreamNote || state.focus, state.nonce, id));
    const cast = Object.assign({}, state.cast || {}, riteObj.buildCast(state, rng) || {});
    return riteObj.generate(state.question || state.focus || state.dreamNote || "", cast, rng);
  }

  window.FatumFolkScryOracles = { IDS, has, get, howFor, runCast, loc };
})();
