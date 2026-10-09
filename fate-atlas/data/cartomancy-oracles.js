/**
 * European & modern cartomancy decks — unique steps, visuals, readings.
 * Lenormand · Kipper · Sibilla · Playing-Card · Spanish Baraja · Oracle Cards
 * (Tarot Major Arcana keeps its dedicated studio flow in reading.js.)
 */
(function () {
  "use strict";

  const IDS = ["lenormand", "kipper", "sibilla", "cartomancy", "baraja", "oracle-cards"];

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
      kind: "cartomancy",
      ...r,
      disclaimer: isZh()
        ? zhText(
            "教育性模拟——不能替代受训牌师实践，也不能替代医疗、法律或安全判断。可能不准确；无法预测黑天鹅事件。",
            "教育性模擬——不能替代受訓牌師實踐，也不能替代醫療、法律或安全判斷。可能不準確；無法預測黑天鵝事件。"
          )
        : "Educational simulation — not a substitute for trained card-reader practice, medicine, law, or safety judgment. May be inaccurate; cannot predict black swan events.",
    };
    return RM ? RM.structuredReading(base) : base;
  }
  function interpretQ(q, lean, mechanic) {
    const RM = window.FatumResultModel;
    const body = isZh()
      ? zhText(
          `你问的是「${q || "未写明的事"}」。以${mechanic}给出的「${lean}」倾向为镜：先改一件你能控制的安排，再用日常证据核对——不要把模拟牌意当作外在命令。`,
          `你問的是「${q || "未寫明的事"}」。以${mechanic}給出的「${lean}」傾向為鏡：先改一件你能控制的安排，再用日常證據核對——不要把模擬牌意當作外在命令。`
        )
      : `You asked about “${q || "an unnamed matter"}”. Hold the “${lean}” lean from ${mechanic} as a mirror: change one arrangement you control, then check ordinary evidence — do not treat simulated cards as an external order.`;
    return RM ? RM.interpretWithQuestion(q, body) : body;
  }
  function howPack(en, zh, hant) {
    return { en, zh, hant: hant || zh };
  }
  function drawN(rng, deck, n) {
    const copy = deck.slice();
    const out = [];
    for (let i = 0; i < n && copy.length; i++) {
      const ix = Math.floor(rng() * copy.length) % copy.length;
      out.push(copy.splice(ix, 1)[0]);
    }
    return out;
  }

  const LENORMAND = [
    { en: "Rider", zh: "骑士", lean: { en: "news arrives soon", zh: "消息将至", hant: "消息將至" } },
    { en: "Clover", zh: "三叶草", lean: { en: "small luck · seize lightly", zh: "小吉·轻取", hant: "小吉·輕取" } },
    { en: "Ship", zh: "船", lean: { en: "travel · distance deal", zh: "出行·远距事务", hant: "出行·遠距事務" } },
    { en: "House", zh: "房屋", lean: { en: "home · stabilize base", zh: "家·稳根基", hant: "家·穩根基" } },
    { en: "Tree", zh: "树", lean: { en: "health pace · grow slow", zh: "健康节奏·慢长", hant: "健康節奏·慢長" } },
    { en: "Clouds", zh: "云", lean: { en: "confusion · wait clarity", zh: "混沌·等清明", hant: "混沌·等清明" } },
    { en: "Snake", zh: "蛇", lean: { en: "complication · watch motives", zh: "纠葛·察动机", hant: "糾葛·察動機" } },
    { en: "Bouquet", zh: "花束", lean: { en: "gift · kindness lands", zh: "礼物·善意落地", hant: "禮物·善意落地" } },
  ];
  const KIPPER = [
    { en: "Main Person", zh: "主事人", lean: { en: "you are central · choose", zh: "你是核心·抉择", hant: "你是核心·抉擇" } },
    { en: "Good Lady", zh: "贵妇", lean: { en: "ally · soft counsel", zh: "盟友·柔言", hant: "盟友·柔言" } },
    { en: "Marriage House", zh: "婚宅", lean: { en: "bond talk · clarify terms", zh: "关系谈·澄清条款", hant: "關係談·澄清條款" } },
    { en: "Letter", zh: "信件", lean: { en: "message · reply carefully", zh: "讯息·慎回", hant: "訊息·慎回" } },
    { en: "Great Fortune", zh: "大运", lean: { en: "opening · act with buffer", zh: "开口·留缓冲再行", hant: "開口·留緩衝再行" } },
    { en: "Prison", zh: "牢", lean: { en: "stuck loop · change one habit", zh: "卡住·改一个习惯", hant: "卡住·改一個習慣" } },
  ];
  const SIBILLA = [
    { en: "Conversazione", zh: "交谈", lean: { en: "talk it through", zh: "谈清楚", hant: "談清楚" } },
    { en: "Allegria", zh: "欢愉", lean: { en: "share joy · stay kind", zh: "分享喜乐·保善", hant: "分享喜樂·保善" } },
    { en: "Dispiacere", zh: "不快", lean: { en: "name the hurt · repair", zh: "说出伤痛·修复", hant: "說出傷痛·修復" } },
    { en: "Viaggio", zh: "旅途", lean: { en: "go with a buffer", zh: "出行留缓冲", hant: "出行留緩衝" } },
    { en: "Denari", zh: "钱币", lean: { en: "budget · one clear deal", zh: "预算·一笔清楚交易", hant: "預算·一筆清楚交易" } },
    { en: "Fedeltà", zh: "忠信", lean: { en: "keep a small vow", zh: "守一个小誓", hant: "守一個小誓" } },
  ];
  const PLAYING = [
    { en: "Ace of Hearts", zh: "红心A", lean: { en: "new affection · open gently", zh: "新情谊·温和开启", hant: "新情誼·溫和開啟" } },
    { en: "King of Clubs", zh: "梅花K", lean: { en: "work mentor · ask counsel", zh: "工作导师·求教", hant: "工作導師·求教" } },
    { en: "Queen of Diamonds", zh: "方块Q", lean: { en: "resource steward · count first", zh: "资源管家·先算清", hant: "資源管家·先算清" } },
    { en: "Jack of Spades", zh: "黑桃J", lean: { en: "sharp news · verify", zh: "锐讯·核实", hant: "銳訊·核實" } },
    { en: "Ten of Hearts", zh: "红心10", lean: { en: "gathering · warm circle", zh: "聚会·温暖圈", hant: "聚會·溫暖圈" } },
    { en: "Three of Clubs", zh: "梅花3", lean: { en: "small growth · keep rhythm", zh: "小成长·守节奏", hant: "小成長·守節奏" } },
  ];
  const BARAJA = [
    { en: "As de Oros", zh: "金币A", lean: { en: "seed money · start small", zh: "种子资金·小起步", hant: "種子資金·小起步" } },
    { en: "Sota de Copas", zh: "金杯侍从", lean: { en: "invitation · respond warmly", zh: "邀约·温暖回应", hant: "邀約·溫暖回應" } },
    { en: "Caballo de Espadas", zh: "宝剑骑士", lean: { en: "swift word · cut clean", zh: "快言·利落切割", hant: "快言·利落切割" } },
    { en: "Rey de Bastos", zh: "权杖王", lean: { en: "lead the project", zh: "带领项目", hant: "帶領專案" } },
    { en: "Siete de Oros", zh: "金币7", lean: { en: "patience pays · wait harvest", zh: "耐心得报·等收成", hant: "耐心得報·等收成" } },
    { en: "Cinco de Copas", zh: "金杯5", lean: { en: "mend a bond", zh: "修补关系", hant: "修補關係" } },
  ];
  const ORACLE = [
    { en: "Threshold card", zh: "门槛卡", lean: { en: "one door · step kindly", zh: "一扇门·温和迈入", hant: "一扇門·溫和邁入" } },
    { en: "Mirror card", zh: "镜子卡", lean: { en: "see your part · adjust", zh: "看清自己·微调", hant: "看清自己·微調" } },
    { en: "Path card", zh: "道路卡", lean: { en: "choose one lane", zh: "只选一条路", hant: "只選一條路" } },
    { en: "Rest card", zh: "歇息卡", lean: { en: "pause · refill", zh: "停顿·补给", hant: "停頓·補給" } },
    { en: "Witness card", zh: "见证卡", lean: { en: "bring a second mind", zh: "请第二意见", hant: "請第二意見" } },
    { en: "Release card", zh: "放下卡", lean: { en: "let one worry go", zh: "放下一个忧虑", hant: "放下一個憂慮" } },
  ];
  const SUITS = [
    { en: "Hearts focus", zh: "红心焦点", hant: "紅心焦點" },
    { en: "Clubs focus", zh: "梅花焦点", hant: "梅花焦點" },
    { en: "Diamonds focus", zh: "方块焦点", hant: "方塊焦點" },
    { en: "Spades focus", zh: "黑桃焦点", hant: "黑桃焦點" },
  ];
  const PALOS = [
    { en: "Oros", zh: "金币", hant: "金幣" },
    { en: "Copas", zh: "金杯", hant: "金杯" },
    { en: "Espadas", zh: "宝剑", hant: "寶劍" },
    { en: "Bastos", zh: "权杖", hant: "權杖" },
  ];

  function spreadExplain(cards, q, mechanic) {
    const names = cards.map((c) => loc({ en: c.en, zh: c.zh })).join(" · ");
    const lean = cards.map((c) => loc(c.lean)).join(" · ");
    return {
      names,
      lean,
      interpret: interpretQ(q, lean, mechanic),
    };
  }

  const RITES = {
    lenormand: {
      summary: {
        en: "Lenormand uses thirty-six concrete picture cards — combinations speak to events, not vague mood alone.",
        zh: "雷诺曼以三十六张具象图画牌——组合论事件，不只谈模糊情绪。",
        hant: "雷諾曼以三十六張具象圖畫牌——組合論事件，不只談模糊情緒。",
      },
      how: howPack(
        {
          intro: "You’ll hold a question, shuffle a teaching Lenormand deck, draw three cards, then read the line.",
          steps: [
            { title: "Meet Lenormand", body: "Thirty-six pictures · combinations." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Shuffle the Lenormand deck", body: "Cards mix." },
            { title: "Draw a three-card line", body: "Past · Now · Next." },
            { title: "Read the Lenormand line", body: "Combination lean appears." },
            { title: "Lenormand counsel", body: "Line lean for your question." },
          ],
        },
        {
          intro: "你将抱定问题、洗教学雷诺曼牌、抽三张，再读牌阵。",
          steps: [
            { title: "认识雷诺曼", body: "三十六图 · 组合。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "洗雷诺曼牌", body: "牌混合。" },
            { title: "抽三张线阵", body: "过去 · 现在 · 下一步。" },
            { title: "读取雷诺曼线阵", body: "组合倾向出现。" },
            { title: "雷诺曼指引", body: "线阵对照问题。" },
          ],
        },
        {
          intro: "你將抱定問題、洗教學雷諾曼牌、抽三張，再讀牌陣。",
          steps: [
            { title: "認識雷諾曼", body: "三十六圖 · 組合。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "洗雷諾曼牌", body: "牌混合。" },
            { title: "抽三張線陣", body: "過去 · 現在 · 下一步。" },
            { title: "讀取雷諾曼線陣", body: "組合傾向出現。" },
            { title: "雷諾曼指引", body: "線陣對照問題。" },
          ],
        }
      ),
      steps: ["intent", "question", "shuffleLenormand", "drawThreeLen", "lenormandSpread", "result"],
      viz: "lenormand",
      castCta: { en: "Read the Lenormand line", zh: "读取雷诺曼线阵", hant: "讀取雷諾曼線陣" },
      buildCast(state, rng) {
        const cards = drawN(rng, LENORMAND, 3);
        return { cards, lean: cards.map((c) => loc(c.lean)).join(" · ") };
      },
      generate(q, cast) {
        const sp = spreadExplain(cast.cards, q, isZh() ? "雷诺曼线阵" : "the Lenormand line");
        return pack({
          title: sp.names,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学雷诺曼得「${sp.names}」，倾向「${cast.lean}」。真牌需完整三十六张与组合规则。`, `教學雷諾曼得「${sp.names}」，傾向「${cast.lean}」。真牌需完整三十六張與組合規則。`)
            : `Teaching Lenormand draws “${sp.names}”, leaning “${cast.lean}”. Real reads need the full 36 and combination rules.`,
          interpret: sp.interpret,
          details: cast.cards.map((c) => loc({ en: c.en, zh: c.zh })),
          doList: [isZh() ? zhText(`按「${cast.lean}」做一件今天可完成的小事。`, `按「${cast.lean}」做一件今天可完成的小事。`) : `Do one small today-action matching “${cast.lean}”.`],
          dontList: [isZh() ? zhText("不要用牌恐吓他人感情或健康。", "不要用牌恐嚇他人感情或健康。") : "Do not frighten others about love or health with cards."],
          tone: /cloud|snake|confusion|混沌|纠葛/i.test(cast.lean + sp.names) ? "caution" : "mixed",
          vizData: cast,
        });
      },
    },

    kipper: {
      summary: {
        en: "Kipper is a nineteenth-century German fortune deck — people, places, and situations read in narrative layouts.",
        zh: "基普牌是十九世纪德国运势牌——人物、场所与情境以叙事牌阵解读。",
        hant: "基普牌是十九世紀德國運勢牌——人物、場所與情境以敘事牌陣解讀。",
      },
      how: howPack(
        {
          intro: "You’ll hold a question, shuffle a teaching Kipper deck, set a layout, then read the counsel.",
          steps: [
            { title: "Meet Kipper", body: "People · places · situations." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Shuffle the Kipper deck", body: "Cards mix." },
            { title: "Set a Kipper layout", body: "Narrative positions." },
            { title: "Read the Kipper counsel", body: "Story lean appears." },
            { title: "Kipper counsel", body: "Story lean for your question." },
          ],
        },
        {
          intro: "你将抱定问题、洗教学基普牌、摆牌阵，再读叙事指引。",
          steps: [
            { title: "认识基普牌", body: "人物 · 场所 · 情境。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "洗基普牌", body: "牌混合。" },
            { title: "摆基普牌阵", body: "叙事位置。" },
            { title: "读取基普指引", body: "故事倾向出现。" },
            { title: "基普指引", body: "故事对照问题。" },
          ],
        },
        {
          intro: "你將抱定問題、洗教學基普牌、擺牌陣，再讀敘事指引。",
          steps: [
            { title: "認識基普牌", body: "人物 · 場所 · 情境。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "洗基普牌", body: "牌混合。" },
            { title: "擺基普牌陣", body: "敘事位置。" },
            { title: "讀取基普指引", body: "故事傾向出現。" },
            { title: "基普指引", body: "故事對照問題。" },
          ],
        }
      ),
      steps: ["intent", "question", "shuffleKipper", "kipperLayout", "kipperCounsel", "result"],
      viz: "kipper",
      castCta: { en: "Read the Kipper counsel", zh: "读取基普指引", hant: "讀取基普指引" },
      buildCast(state, rng) {
        const cards = drawN(rng, KIPPER, 3);
        return { cards, lean: cards.map((c) => loc(c.lean)).join(" · ") };
      },
      generate(q, cast) {
        const sp = spreadExplain(cast.cards, q, isZh() ? "基普叙事" : "the Kipper layout");
        return pack({
          title: sp.names,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学基普得「${sp.names}」，倾向「${cast.lean}」。真牌需完整牌组与德式牌阵。`, `教學基普得「${sp.names}」，傾向「${cast.lean}」。真牌需完整牌組與德式牌陣。`)
            : `Teaching Kipper draws “${sp.names}”, leaning “${cast.lean}”. Real reads need the full deck and German layouts.`,
          interpret: sp.interpret,
          details: cast.cards.map((c) => loc({ en: c.en, zh: c.zh })),
          doList: [isZh() ? zhText(`按「${cast.lean}」推进一件可验证的下一步。`, `按「${cast.lean}」推進一件可驗證的下一步。`) : `Advance one verifiable next step matching “${cast.lean}”.`],
          dontList: [isZh() ? zhText("不要用基普牌羞辱他人关系。", "不要用基普牌羞辱他人關係。") : "Do not shame others’ relationships with Kipper."],
          tone: /prison|stuck|牢|卡住/i.test(cast.lean + sp.names) ? "caution" : "mixed",
          vizData: cast,
        });
      },
    },

    sibilla: {
      summary: {
        en: "Sibilla is an Italian fortune pack for everyday questions — short scenes of talk, travel, money, and fidelity.",
        zh: "西比拉是意大利日常运势牌——短景论交谈、出行、金钱与忠信。",
        hant: "西比拉是義大利日常運勢牌——短景論交談、出行、金錢與忠信。",
      },
      how: howPack(
        {
          intro: "You’ll hold a question, cut a teaching Sibilla deck, draw a trio, then read the counsel.",
          steps: [
            { title: "Meet Sibilla", body: "Everyday scenes · Italian pack." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Cut the Sibilla deck", body: "Teaching cut." },
            { title: "Draw a Sibilla trio", body: "Three scenes." },
            { title: "Read the Sibilla counsel", body: "Scene lean appears." },
            { title: "Sibilla counsel", body: "Scene lean for your question." },
          ],
        },
        {
          intro: "你将抱定问题、切教学西比拉牌、抽三张，再读场景指引。",
          steps: [
            { title: "认识西比拉", body: "日常场景 · 意大利牌。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "切西比拉牌", body: "教学切牌。" },
            { title: "抽西比拉三张", body: "三个场景。" },
            { title: "读取西比拉指引", body: "场景倾向出现。" },
            { title: "西比拉指引", body: "场景对照问题。" },
          ],
        },
        {
          intro: "你將抱定問題、切教學西比拉牌、抽三張，再讀場景指引。",
          steps: [
            { title: "認識西比拉", body: "日常場景 · 義大利牌。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "切西比拉牌", body: "教學切牌。" },
            { title: "抽西比拉三張", body: "三個場景。" },
            { title: "讀取西比拉指引", body: "場景傾向出現。" },
            { title: "西比拉指引", body: "場景對照問題。" },
          ],
        }
      ),
      steps: ["intent", "question", "cutSibilla", "sibillaTrio", "sibillaCounsel", "result"],
      viz: "sibilla",
      castCta: { en: "Read the Sibilla counsel", zh: "读取西比拉指引", hant: "讀取西比拉指引" },
      buildCast(state, rng) {
        const cards = drawN(rng, SIBILLA, 3);
        return { cards, lean: cards.map((c) => loc(c.lean)).join(" · ") };
      },
      generate(q, cast) {
        const sp = spreadExplain(cast.cards, q, isZh() ? "西比拉场景" : "the Sibilla trio");
        return pack({
          title: sp.names,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学西比拉得「${sp.names}」，倾向「${cast.lean}」。真牌需完整意大利牌组。`, `教學西比拉得「${sp.names}」，傾向「${cast.lean}」。真牌需完整義大利牌組。`)
            : `Teaching Sibilla draws “${sp.names}”, leaning “${cast.lean}”. Real reads need the full Italian pack.`,
          interpret: sp.interpret,
          details: cast.cards.map((c) => loc({ en: c.en, zh: c.zh })),
          doList: [isZh() ? zhText(`把「${cast.lean}」写成今天一句可执行提醒。`, `把「${cast.lean}」寫成今天一句可執行提醒。`) : `Write “${cast.lean}” as one doable reminder today.`],
          dontList: [isZh() ? zhText("不要用牌强迫他人服从。", "不要用牌強迫他人服從。") : "Do not coerce others with a card lot."],
          tone: /dispiacere|hurt|不快|伤/i.test(cast.lean + sp.names) ? "caution" : "bright",
          vizData: cast,
        });
      },
    },

    cartomancy: {
      summary: {
        en: "Playing-card cartomancy reads a standard 52-card deck after Etteilla and folk systems — suits carry life themes.",
        zh: "扑克牌占依埃特伊拉与民俗体系解读标准五十二张——花色承载生活主题。",
        hant: "撲克牌占依埃特伊拉與民俗體系解讀標準五十二張——花色承載生活主題。",
      },
      how: howPack(
        {
          intro: "You’ll hold a question, shuffle a teaching 52-card deck, pick a suit focus, then read the spread.",
          steps: [
            { title: "Meet playing-card cartomancy", body: "52 cards · suits · folk systems." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Shuffle the playing deck", body: "Cards mix." },
            { title: "Pick a suit focus", body: "Hearts · Clubs · Diamonds · Spades." },
            { title: "Read the playing spread", body: "Suit lean appears." },
            { title: "Cartomancy counsel", body: "Spread lean for your question." },
          ],
        },
        {
          intro: "你将抱定问题、洗教学扑克牌、选择花色焦点，再读牌阵。",
          steps: [
            { title: "认识扑克牌占", body: "五十二张 · 花色 · 民俗。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "洗扑克牌", body: "牌混合。" },
            { title: "选择花色焦点", body: "红心 · 梅花 · 方块 · 黑桃。" },
            { title: "读取扑克牌阵", body: "花色倾向出现。" },
            { title: "扑克牌占指引", body: "牌阵对照问题。" },
          ],
        },
        {
          intro: "你將抱定問題、洗教學撲克牌、選擇花色焦點，再讀牌陣。",
          steps: [
            { title: "認識撲克牌占", body: "五十二張 · 花色 · 民俗。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "洗撲克牌", body: "牌混合。" },
            { title: "選擇花色焦點", body: "紅心 · 梅花 · 方塊 · 黑桃。" },
            { title: "讀取撲克牌陣", body: "花色傾向出現。" },
            { title: "撲克牌占指引", body: "牌陣對照問題。" },
          ],
        }
      ),
      steps: ["intent", "question", "shufflePlaying", "suitFocus", "playingSpread", "result"],
      viz: "playing",
      castCta: { en: "Read the playing spread", zh: "读取扑克牌阵", hant: "讀取撲克牌陣" },
      buildCast(state, rng) {
        const cards = drawN(rng, PLAYING, 3);
        const suit = SUITS.find((s) => s.en === state.suitFocus) || pick(rng, SUITS);
        return { cards, suit, lean: cards.map((c) => loc(c.lean)).join(" · ") };
      },
      generate(q, cast) {
        const sp = spreadExplain(cast.cards, q, isZh() ? "扑克牌阵" : "the playing-card spread");
        const suit = loc(cast.suit);
        return pack({
          title: `${suit} · ${sp.names}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学扑克牌占以「${suit}」焦点得「${sp.names}」，倾向「${cast.lean}」。`, `教學撲克牌占以「${suit}」焦點得「${sp.names}」，傾向「${cast.lean}」。`)
            : `Teaching playing-card cartomancy with “${suit}” draws “${sp.names}”, leaning “${cast.lean}”.`,
          interpret: sp.interpret,
          details: [suit, ...cast.cards.map((c) => loc({ en: c.en, zh: c.zh }))],
          doList: [isZh() ? zhText(`围绕「${cast.lean}」安排一次温和会面或短任务。`, `圍繞「${cast.lean}」安排一次溫和會面或短任務。`) : `Arrange one gentle meeting or short task matching “${cast.lean}”.`],
          dontList: [isZh() ? zhText("不要用扑克牌恐吓他人财务。", "不要用撲克牌恐嚇他人財務。") : "Do not frighten others about money with playing cards."],
          tone: "mixed",
          vizData: cast,
        });
      },
    },

    baraja: {
      summary: {
        en: "Spanish baraja cartomancy uses a forty-card pack of oros, copas, espadas, and bastos — Iberian and Latin American folk reading.",
        zh: "西班牙纸牌占使用四十张金币、金杯、宝剑、权杖牌——伊比利亚与拉美民俗解读。",
        hant: "西班牙紙牌占使用四十張金幣、金杯、寶劍、權杖牌——伊比利亞與拉美民俗解讀。",
      },
      how: howPack(
        {
          intro: "You’ll hold a question, shuffle a teaching baraja, pick a palo, then read the spread.",
          steps: [
            { title: "Meet Spanish baraja", body: "Forty cards · four palos." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Shuffle the baraja", body: "Cards mix." },
            { title: "Pick a palo", body: "Oros · Copas · Espadas · Bastos." },
            { title: "Read the baraja spread", body: "Palo lean appears." },
            { title: "Baraja counsel", body: "Spread lean for your question." },
          ],
        },
        {
          intro: "你将抱定问题、洗教学西班牙牌、选择花色，再读牌阵。",
          steps: [
            { title: "认识西班牙纸牌", body: "四十张 · 四花色。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "洗西班牙牌", body: "牌混合。" },
            { title: "选择花色", body: "金币 · 金杯 · 宝剑 · 权杖。" },
            { title: "读取西班牙牌阵", body: "花色倾向出现。" },
            { title: "西班牙纸牌指引", body: "牌阵对照问题。" },
          ],
        },
        {
          intro: "你將抱定問題、洗教學西班牙牌、選擇花色，再讀牌陣。",
          steps: [
            { title: "認識西班牙紙牌", body: "四十張 · 四花色。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "洗西班牙牌", body: "牌混合。" },
            { title: "選擇花色", body: "金幣 · 金杯 · 寶劍 · 權杖。" },
            { title: "讀取西班牙牌陣", body: "花色傾向出現。" },
            { title: "西班牙紙牌指引", body: "牌陣對照問題。" },
          ],
        }
      ),
      steps: ["intent", "question", "shuffleBaraja", "paloPick", "barajaSpread", "result"],
      viz: "baraja",
      castCta: { en: "Read the baraja spread", zh: "读取西班牙牌阵", hant: "讀取西班牙牌陣" },
      buildCast(state, rng) {
        const cards = drawN(rng, BARAJA, 3);
        const palo = PALOS.find((p) => p.en === state.paloFocus) || pick(rng, PALOS);
        return { cards, palo, lean: cards.map((c) => loc(c.lean)).join(" · ") };
      },
      generate(q, cast) {
        const sp = spreadExplain(cast.cards, q, isZh() ? "西班牙牌阵" : "the baraja spread");
        const palo = loc(cast.palo);
        return pack({
          title: `${palo} · ${sp.names}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学西班牙纸牌以「${palo}」得「${sp.names}」，倾向「${cast.lean}」。`, `教學西班牙紙牌以「${palo}」得「${sp.names}」，傾向「${cast.lean}」。`)
            : `Teaching Spanish baraja with “${palo}” draws “${sp.names}”, leaning “${cast.lean}”.`,
          interpret: sp.interpret,
          details: [palo, ...cast.cards.map((c) => loc({ en: c.en, zh: c.zh }))],
          doList: [isZh() ? zhText(`按「${cast.lean}」做一件今天可完成的小事。`, `按「${cast.lean}」做一件今天可完成的小事。`) : `Do one small today-action matching “${cast.lean}”.`],
          dontList: [isZh() ? zhText("不要用牌恐吓他人出行或金钱。", "不要用牌恐嚇他人出行或金錢。") : "Do not frighten others about travel or money with the baraja."],
          tone: "mixed",
          vizData: cast,
        });
      },
    },

    "oracle-cards": {
      summary: {
        en: "Oracle cards are free-form illustrated message decks beyond classical tarot structure — one card mirrors the seeker’s ask.",
        zh: "神谕卡是超越经典塔罗结构的自由插画讯息牌——一张牌映照所问。",
        hant: "神諭卡是超越經典塔羅結構的自由插畫訊息牌——一張牌映照所問。",
      },
      how: howPack(
        {
          intro: "You’ll hold a question, settle your breath, draw a teaching oracle card, then read the message.",
          steps: [
            { title: "Meet oracle cards", body: "Free-form messages · one card." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Settle your breath", body: "Soften before the draw." },
            { title: "Draw an oracle card", body: "One message card." },
            { title: "Read the oracle message", body: "Message lean appears." },
            { title: "Oracle counsel", body: "Message lean for your question." },
          ],
        },
        {
          intro: "你将抱定问题、安住呼吸、抽取教学神谕卡，再读讯息。",
          steps: [
            { title: "认识神谕卡", body: "自由讯息 · 一张牌。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "安住呼吸", body: "抽牌前放松。" },
            { title: "抽取神谕卡", body: "一张讯息牌。" },
            { title: "读取神谕讯息", body: "讯息倾向出现。" },
            { title: "神谕指引", body: "讯息对照问题。" },
          ],
        },
        {
          intro: "你將抱定問題、安住呼吸、抽取教學神諭卡，再讀訊息。",
          steps: [
            { title: "認識神諭卡", body: "自由訊息 · 一張牌。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "安住呼吸", body: "抽牌前放鬆。" },
            { title: "抽取神諭卡", body: "一張訊息牌。" },
            { title: "讀取神諭訊息", body: "訊息傾向出現。" },
            { title: "神諭指引", body: "訊息對照問題。" },
          ],
        }
      ),
      steps: ["intent", "question", "breatheOracle", "drawOracle", "oracleMessage", "result"],
      viz: "oracle",
      castCta: { en: "Read the oracle message", zh: "读取神谕讯息", hant: "讀取神諭訊息" },
      buildCast(state, rng) {
        const card = pick(rng, ORACLE);
        return { card, lean: loc(card.lean) };
      },
      generate(q, cast) {
        const name = loc({ en: cast.card.en, zh: cast.card.zh });
        return pack({
          title: name,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学神谕卡得「${name}」，倾向「${cast.lean}」。神谕卡无统一牌义表。`, `教學神諭卡得「${name}」，傾向「${cast.lean}」。神諭卡無統一牌義表。`)
            : `Teaching oracle cards draws “${name}”, leaning “${cast.lean}”. Oracle decks have no single standard lexicon.`,
          interpret: interpretQ(q, cast.lean, isZh() ? "神谕卡" : "the oracle card"),
          details: [name],
          doList: [isZh() ? zhText(`把「${cast.lean}」变成今天一件可完成的小事。`, `把「${cast.lean}」變成今天一件可完成的小事。`) : `Turn “${cast.lean}” into one completable small act today.`],
          dontList: [isZh() ? zhText("不要用神谕卡替代心理医疗。", "不要用神諭卡替代心理醫療。") : "Do not replace mental-health care with oracle cards."],
          tone: /rest|pause|歇|停/i.test(name + cast.lean) ? "caution" : "bright",
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
            "本站为教育性游玩——不能替代受训牌师、医疗、法律或安全判断。",
            "本站為教育性遊玩——不能替代受訓牌師、醫療、法律或安全判斷。"
          )
        : "Educational play on this site — not a substitute for trained card readers, medicine, law, or safety judgment.",
    };
  }
  function runCast(id, state) {
    const rite = RITES[id];
    if (!rite) return null;
    const rng = mulberry32(seedFrom(state.question || state.focus, state.nonce, id));
    const cast = Object.assign({}, state.cast || {}, rite.buildCast(state, rng) || {});
    return rite.generate(state.question || state.focus || "", cast, rng);
  }

  window.FatumCartomancyOracles = { IDS, has, get, howFor, runCast, loc };
})();
