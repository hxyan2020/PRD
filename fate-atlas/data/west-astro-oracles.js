/**
 * Western astrology & Hellenic number rites — unique steps, visuals, readings.
 * Western Astrology · Horary · Celtic Tree · Western Numerology · Isopsephy
 */
(function () {
  "use strict";

  const IDS = [
    "western-astrology",
    "horary",
    "celtic-tree",
    "numerology-west",
    "isopsephy",
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
      kind: "westastro",
      ...r,
      disclaimer: isZh()
        ? zhText(
            "教育性模拟——不能替代受训占星／数理实践，也不能替代医疗、法律或安全判断。可能不准确；无法预测黑天鹅事件。",
            "教育性模擬——不能替代受訓占星／數理實踐，也不能替代醫療、法律或安全判斷。可能不準確；無法預測黑天鵝事件。"
          )
        : "Educational simulation — not a substitute for trained astrology/numerology practice, medicine, law, or safety judgment. May be inaccurate; cannot predict black swan events.",
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
  function digitRoot(n) {
    let x = Math.abs(Number(n) || 0);
    while (x > 9 && x !== 11 && x !== 22 && x !== 33) {
      x = String(x)
        .split("")
        .reduce((a, d) => a + Number(d), 0);
    }
    return x || 9;
  }
  function lifePathFromDate(dateStr) {
    const digits = String(dateStr || "1990-01-01").replace(/\D/g, "");
    let s = 0;
    for (const d of digits) s += Number(d);
    return digitRoot(s);
  }
  function letterSum(name) {
    let s = 0;
    const str = String(name || "A").toUpperCase();
    for (let i = 0; i < str.length; i++) {
      const c = str.charCodeAt(i);
      if (c >= 65 && c <= 90) s += ((c - 64 - 1) % 9) + 1;
    }
    return digitRoot(s) || 9;
  }

  const SIGNS = [
    { en: "Aries", zh: "白羊", lean: { en: "initiate · cut clean", zh: "起势·利落切割", hant: "起勢·利落切割" } },
    { en: "Taurus", zh: "金牛", lean: { en: "steady build · value", zh: "稳健积累·看价值", hant: "穩健積累·看價值" } },
    { en: "Gemini", zh: "双子", lean: { en: "talk · twin paths", zh: "言谈·双径", hant: "言談·雙徑" } },
    { en: "Cancer", zh: "巨蟹", lean: { en: "home · protect", zh: "家·守护", hant: "家·守護" } },
    { en: "Leo", zh: "狮子", lean: { en: "lead · warm stage", zh: "带领·温暖舞台", hant: "帶領·溫暖舞台" } },
    { en: "Virgo", zh: "处女", lean: { en: "refine detail", zh: "精炼细节", hant: "精煉細節" } },
    { en: "Libra", zh: "天秤", lean: { en: "balance · bargain", zh: "平衡·协商", hant: "平衡·協商" } },
    { en: "Scorpio", zh: "天蝎", lean: { en: "depth · transform", zh: "深入·转化", hant: "深入·轉化" } },
  ];
  const HORARY = [
    { en: "Ascendant clear", zh: "上升清明", lean: { en: "yes · proceed with witnesses", zh: "是·有人见证再行", hant: "是·有人見證再行" } },
    { en: "Moon void", zh: "月亮空亡", lean: { en: "delay · wait a beat", zh: "延后·稍候", hant: "延後·稍候" } },
    { en: "Lord of 7th strong", zh: "七宫主旺", lean: { en: "other party holds keys", zh: "对方握钥", hant: "對方握鑰" } },
    { en: "Reception mutual", zh: "互容", lean: { en: "agreement can ripen", zh: "协议可成熟", hant: "協議可成熟" } },
    { en: "Combust caution", zh: "燃烧慎", lean: { en: "hidden heat · check facts", zh: "暗热·核事实", hant: "暗熱·核事實" } },
  ];
  const TREES = [
    { en: "Birch", zh: "桦树", lean: { en: "begin · clean slate", zh: "起势·白纸", hant: "起勢·白紙" } },
    { en: "Rowan", zh: "花楸", lean: { en: "protect · discern", zh: "护界·明辨", hant: "護界·明辨" } },
    { en: "Ash", zh: "梣树", lean: { en: "link worlds · craft", zh: "连结·手艺", hant: "連結·手藝" } },
    { en: "Alder", zh: "赤杨", lean: { en: "bridge · courage", zh: "搭桥·勇气", hant: "搭橋·勇氣" } },
    { en: "Willow", zh: "柳树", lean: { en: "feel · adapt", zh: "感受·适应", hant: "感受·適應" } },
    { en: "Oak", zh: "橡树", lean: { en: "steady strength", zh: "稳固力量", hant: "穩固力量" } },
    { en: "Holly", zh: "冬青", lean: { en: "defend · endure", zh: "守护·忍耐", hant: "守護·忍耐" } },
    { en: "Hazel", zh: "榛树", lean: { en: "learn · counsel", zh: "学习·建言", hant: "學習·建言" } },
  ];
  const PATHS = [
    { n: 1, en: "Path 1", zh: "生命数 1", lean: { en: "lead · invent", zh: "带领·开创", hant: "帶領·開創" } },
    { n: 2, en: "Path 2", zh: "生命数 2", lean: { en: "partner · sense", zh: "伙伴·感知", hant: "夥伴·感知" } },
    { n: 3, en: "Path 3", zh: "生命数 3", lean: { en: "express · play", zh: "表达·玩", hant: "表達·玩" } },
    { n: 4, en: "Path 4", zh: "生命数 4", lean: { en: "build · order", zh: "建设·秩序", hant: "建設·秩序" } },
    { n: 5, en: "Path 5", zh: "生命数 5", lean: { en: "change · roam", zh: "变化·游走", hant: "變化·遊走" } },
    { n: 6, en: "Path 6", zh: "生命数 6", lean: { en: "care · harmony", zh: "照护·和谐", hant: "照護·和諧" } },
    { n: 7, en: "Path 7", zh: "生命数 7", lean: { en: "study · solitude", zh: "钻研·独处", hant: "鑽研·獨處" } },
    { n: 8, en: "Path 8", zh: "生命数 8", lean: { en: "power · account", zh: "权能·负责", hant: "權能·負責" } },
    { n: 9, en: "Path 9", zh: "生命数 9", lean: { en: "complete · give", zh: "收尾·给予", hant: "收尾·給予" } },
  ];
  const ISOP = [
    { en: "Rising total", zh: "升势合", lean: { en: "grow the craft", zh: "滋养技艺", hant: "滋養技藝" } },
    { en: "Even total", zh: "匀合", lean: { en: "keep pace · protect rest", zh: "稳节奏·护休息", hant: "穩節奏·護休息" } },
    { en: "Odd spark", zh: "奇火花", lean: { en: "speak one true line", zh: "说一句真话", hant: "說一句真話" } },
    { en: "Temple total", zh: "神庙合", lean: { en: "honor a small vow", zh: "守一个小誓", hant: "守一個小誓" } },
  ];

  const RITES = {
    "western-astrology": {
      summary: {
        en: "Western astrology reads the natal sky — signs, houses, and aspects — as a symbolic language for temperament and timing.",
        zh: "西方占星以出生星盘——星座、宫位与相位——作为性情与时机的象征语言。",
        hant: "西方占星以出生星盤——星座、宮位與相位——作為性情與時機的象徵語言。",
      },
      how: howPack(
        {
          intro: "You’ll enter birth date, pick a sun-sign lens, then open a teaching chart lean.",
          steps: [
            { title: "Meet Western astrology", body: "Signs · houses · aspects." },
            { title: "Enter birth date", body: "Chart seed." },
            { title: "Pick a sun-sign lens", body: "Teaching sign choice." },
            { title: "Open the natal lean", body: "Sign lean appears." },
            { title: "Astrology counsel", body: "Sign lean for your focus." },
          ],
        },
        {
          intro: "你将输入生辰、选择太阳星座视角，再打开教学盘倾向。",
          steps: [
            { title: "认识西方占星", body: "星座 · 宫位 · 相位。" },
            { title: "输入出生日期", body: "盘种。" },
            { title: "选择太阳星座", body: "教学星座选择。" },
            { title: "打开本命倾向", body: "星座倾向出现。" },
            { title: "占星指引", body: "星意对照焦点。" },
          ],
        },
        {
          intro: "你將輸入生辰、選擇太陽星座視角，再打開教學盤傾向。",
          steps: [
            { title: "認識西方占星", body: "星座 · 宮位 · 相位。" },
            { title: "輸入出生日期", body: "盤種。" },
            { title: "選擇太陽星座", body: "教學星座選擇。" },
            { title: "打開本命傾向", body: "星座傾向出現。" },
            { title: "占星指引", body: "星意對照焦點。" },
          ],
        }
      ),
      steps: ["intent", "birth", "sunSignPick", "westChart", "result"],
      viz: "westchart",
      castCta: { en: "Open the natal lean", zh: "打开本命倾向", hant: "打開本命傾向" },
      buildCast(state, rng) {
        const sign = SIGNS.find((s) => s.en === state.sunSign) || pick(rng, SIGNS);
        return { birth: state.birthDate || "", sign, lean: loc(sign.lean) };
      },
      generate(q, cast) {
        const s = loc({ en: cast.sign.en, zh: cast.sign.zh });
        return pack({
          title: `${cast.birth || "—"} · ${s}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(
                `教学西方占星以「${cast.birth || "—"}」看「${s}」，倾向「${cast.lean}」。真盘需精确时区与星历。`,
                `教學西方占星以「${cast.birth || "—"}」看「${s}」，傾向「${cast.lean}」。真盤需精確時區與星曆。`
              )
            : `Teaching Western astrology for “${cast.birth || "—"}” shows “${s}”, leaning “${cast.lean}”. Real charts need exact timezone and ephemeris.`,
          interpret: interpretQ(q, cast.lean, isZh() ? "太阳星座" : "the sun-sign lens"),
          details: [cast.birth || "—", s],
          doList: [
            isZh()
              ? zhText(`围绕「${cast.lean}」安排本周一次专注时段。`, `圍繞「${cast.lean}」安排本週一次專注時段。`)
              : `Book one focus block this week around “${cast.lean}”.`,
          ],
          dontList: [
            isZh()
              ? zhText("不要用简化盘恐吓他人做重大决定。", "不要用簡化盤恐嚇他人做重大決定。")
              : "Do not scare others into major moves from a teaching chart.",
          ],
          tone: "deep",
          vizData: cast,
        });
      },
    },

    horary: {
      summary: {
        en: "Horary astrology casts a chart for the moment a question is asked — houses and significators answer that one ask.",
        zh: "问事占星（Horary）就提问时刻起盘——以宫位与征象星专答这一问。",
        hant: "問事占星（Horary）就提問時刻起盤——以宮位與徵象星專答這一問。",
      },
      how: howPack(
        {
          intro: "You’ll hold a question, note the ask moment, then open a teaching horary lean.",
          steps: [
            { title: "Meet Horary", body: "Question moment · houses." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Note the ask moment", body: "Teaching clock." },
            { title: "Open the horary lean", body: "Significator lean appears." },
            { title: "Horary counsel", body: "Lean for your question." },
          ],
        },
        {
          intro: "你将抱定问题、记录提问时刻，再打开教学问事盘倾向。",
          steps: [
            { title: "认识问事占星", body: "提问时刻 · 宫位。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "记录提问时刻", body: "教学时钟。" },
            { title: "打开问事倾向", body: "征象倾向出现。" },
            { title: "问事指引", body: "倾向对照问题。" },
          ],
        },
        {
          intro: "你將抱定問題、記錄提問時刻，再打開教學問事盤傾向。",
          steps: [
            { title: "認識問事占星", body: "提問時刻 · 宮位。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "記錄提問時刻", body: "教學時鐘。" },
            { title: "打開問事傾向", body: "徵象傾向出現。" },
            { title: "問事指引", body: "傾向對照問題。" },
          ],
        }
      ),
      steps: ["intent", "question", "askMoment", "horaryChart", "result"],
      viz: "horary",
      castCta: { en: "Open the horary lean", zh: "打开问事倾向", hant: "打開問事傾向" },
      buildCast(state, rng) {
        const figure = pick(rng, HORARY);
        const moment = state.askMoment || new Date().toISOString().slice(0, 16).replace("T", " ");
        return { moment, figure, lean: loc(figure.lean) };
      },
      generate(q, cast) {
        const f = loc({ en: cast.figure.en, zh: cast.figure.zh });
        return pack({
          title: `${f} · ${cast.moment}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(
                `教学问事占星于「${cast.moment}」见「${f}」，倾向「${cast.lean}」。真问事盘需精确时区与宫制。`,
                `教學問事占星於「${cast.moment}」見「${f}」，傾向「${cast.lean}」。真問事盤需精確時區與宮制。`
              )
            : `Teaching horary at “${cast.moment}” shows “${f}”, leaning “${cast.lean}”. Real charts need exact timezone and house system.`,
          interpret: interpretQ(q, cast.lean, isZh() ? "问事征象" : "the horary figure"),
          details: [cast.moment, f],
          doList: [
            isZh()
              ? zhText(`若倾向偏延后，先收集一件可验证的事实。`, `若傾向偏延後，先收集一件可驗證的事實。`)
              : `If the lean delays, gather one verifiable fact first.`,
          ],
          dontList: [
            isZh()
              ? zhText("不要用问事盘羞辱他人的选择。", "不要用問事盤羞辱他人的選擇。")
              : "Do not shame others’ choices with a horary chart.",
          ],
          tone: /void|delay|延|慎|caution|combust/i.test(f + cast.lean) ? "caution" : "mixed",
          vizData: cast,
        });
      },
    },

    "celtic-tree": {
      summary: {
        en: "Celtic tree astrology maps birthdays to sacred trees in modern Celtic revival systems — character themes, not botanical science.",
        zh: "凯尔特树历将生日映射到现代凯尔特复兴体系中的圣树——性情主题，不是植物学。",
        hant: "凱爾特樹曆將生日映射到現代凱爾特復興體系中的聖樹——性情主題，不是植物學。",
      },
      how: howPack(
        {
          intro: "You’ll enter birth date, pick a teaching tree, then read the tree counsel.",
          steps: [
            { title: "Meet Celtic tree astrology", body: "Trees · seasons · character." },
            { title: "Enter birth date", body: "Season seed." },
            { title: "Pick a tree", body: "Teaching grove choice." },
            { title: "Read the tree counsel", body: "Tree lean appears." },
            { title: "Tree counsel", body: "Lean for your focus." },
          ],
        },
        {
          intro: "你将输入生辰、选择教学圣树，再读树意指引。",
          steps: [
            { title: "认识凯尔特树历", body: "树 · 季节 · 性情。" },
            { title: "输入出生日期", body: "季节种。" },
            { title: "选择圣树", body: "教学林选择。" },
            { title: "读取树意指引", body: "树意倾向出现。" },
            { title: "树意指引", body: "倾向对照焦点。" },
          ],
        },
        {
          intro: "你將輸入生辰、選擇教學聖樹，再讀樹意指引。",
          steps: [
            { title: "認識凱爾特樹曆", body: "樹 · 季節 · 性情。" },
            { title: "輸入出生日期", body: "季節種。" },
            { title: "選擇聖樹", body: "教學林選擇。" },
            { title: "讀取樹意指引", body: "樹意傾向出現。" },
            { title: "樹意指引", body: "傾向對照焦點。" },
          ],
        }
      ),
      steps: ["intent", "birth", "treePick", "treeCounsel", "result"],
      viz: "tree",
      castCta: { en: "Read the tree counsel", zh: "读取树意指引", hant: "讀取樹意指引" },
      buildCast(state, rng) {
        const tree = TREES.find((t) => t.en === state.celticTree) || pick(rng, TREES);
        return { birth: state.birthDate || "", tree, lean: loc(tree.lean) };
      },
      generate(q, cast) {
        const t = loc({ en: cast.tree.en, zh: cast.tree.zh });
        return pack({
          title: `${cast.birth || "—"} · ${t}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(
                `教学凯尔特树历以「${cast.birth || "—"}」见「${t}」，倾向「${cast.lean}」。现代复兴体系，非古代德鲁伊历。`,
                `教學凱爾特樹曆以「${cast.birth || "—"}」見「${t}」，傾向「${cast.lean}」。現代復興體系，非古代德魯伊曆。`
              )
            : `Teaching Celtic tree astrology for “${cast.birth || "—"}” shows “${t}”, leaning “${cast.lean}”. A modern revival system, not an ancient Druid calendar.`,
          interpret: interpretQ(q, cast.lean, isZh() ? "圣树" : "the sacred tree"),
          details: [cast.birth || "—", t],
          doList: [
            isZh()
              ? zhText(`按「${cast.lean}」安排一次户外或手作小事。`, `按「${cast.lean}」安排一次戶外或手作小事。`)
              : `Schedule one outdoor or craft small act matching “${cast.lean}”.`,
          ],
          dontList: [
            isZh()
              ? zhText("不要用树标签羞辱他人性格。", "不要用樹標籤羞辱他人性格。")
              : "Do not shame others with tree labels.",
          ],
          tone: "bright",
          vizData: cast,
        });
      },
    },

    "numerology-west": {
      summary: {
        en: "Western numerology reduces birth date (and often name) digits to life-path numbers for character and timing themes.",
        zh: "西方数字命理将生日（常含姓名）数字归约为生命数，论性情与时机主题。",
        hant: "西方數字命理將生日（常含姓名）數字歸約為生命數，論性情與時機主題。",
      },
      how: howPack(
        {
          intro: "You’ll enter birth date, see the life-path sum, then read the number lean.",
          steps: [
            { title: "Meet Western numerology", body: "Digits · life path · counsel." },
            { title: "Enter birth date", body: "Number seed." },
            { title: "See the life-path sum", body: "Teaching total lights." },
            { title: "Read the path lean", body: "Path appears." },
            { title: "Numerology counsel", body: "Path lean for your focus." },
          ],
        },
        {
          intro: "你将输入生辰、查看生命数合计，再读数理倾向。",
          steps: [
            { title: "认识西方数字命理", body: "数字 · 生命数 · 指引。" },
            { title: "输入出生日期", body: "数字种。" },
            { title: "查看生命数合计", body: "教学总和点亮。" },
            { title: "读取生命数倾向", body: "生命数出现。" },
            { title: "数理指引", body: "生命数对照焦点。" },
          ],
        },
        {
          intro: "你將輸入生辰、查看生命數合計，再讀數理傾向。",
          steps: [
            { title: "認識西方數字命理", body: "數字 · 生命數 · 指引。" },
            { title: "輸入出生日期", body: "數字種。" },
            { title: "查看生命數合計", body: "教學總和點亮。" },
            { title: "讀取生命數傾向", body: "生命數出現。" },
            { title: "數理指引", body: "生命數對照焦點。" },
          ],
        }
      ),
      steps: ["intent", "birth", "lifePathSum", "lifePathLean", "result"],
      viz: "lifepath",
      castCta: { en: "Read the path lean", zh: "读取生命数倾向", hant: "讀取生命數傾向" },
      buildCast(state, rng) {
        const pathN = lifePathFromDate(state.birthDate);
        const path = PATHS.find((p) => p.n === pathN) || PATHS[pathN % PATHS.length];
        return { birth: state.birthDate || "", pathN, path, lean: loc(path.lean) };
      },
      generate(q, cast) {
        const p = loc({ en: cast.path.en, zh: cast.path.zh });
        return pack({
          title: `${cast.birth || "—"} · ${p}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(
                `教学西方数字命理以「${cast.birth || "—"}」得「${p}」，倾向「${cast.lean}」。真算常另计姓名振动数。`,
                `教學西方數字命理以「${cast.birth || "—"}」得「${p}」，傾向「${cast.lean}」。真算常另計姓名振動數。`
              )
            : `Teaching Western numerology for “${cast.birth || "—"}” yields “${p}”, leaning “${cast.lean}”. Real work often adds name vibration numbers.`,
          interpret: interpretQ(q, cast.lean, isZh() ? "生命数" : "the life-path number"),
          details: [cast.birth || "—", String(cast.pathN), p],
          doList: [
            isZh()
              ? zhText(`按「${cast.lean}」推进一件可验证的下一步。`, `按「${cast.lean}」推進一件可驗證的下一步。`)
              : `Advance one verifiable next step matching “${cast.lean}”.`,
          ],
          dontList: [
            isZh()
              ? zhText("不要用生命数羞辱他人价值。", "不要用生命數羞辱他人價值。")
              : "Do not shame someone’s worth over a life-path number.",
          ],
          tone: "mixed",
          vizData: cast,
        });
      },
    },

    isopsephy: {
      summary: {
        en: "Isopsephy is Greek letter-number equivalence — words share fate links when their letter totals match.",
        zh: "字母数值占（Isopsephy）是希腊字母数值等价——合计相同的词语被视为命运相连。",
        hant: "字母數值占（Isopsephy）是希臘字母數值等價——合計相同的詞語被視為命運相連。",
      },
      how: howPack(
        {
          intro: "You’ll enter a Greek or romanized word, see the isopsephy sum, then read the number lean.",
          steps: [
            { title: "Meet Isopsephy", body: "Greek letters · totals." },
            { title: "Enter a name or word", body: "Latin or Greek romanization." },
            { title: "See the isopsephy sum", body: "Teaching total lights." },
            { title: "Read the number lean", body: "Band appears." },
            { title: "Isopsephy counsel", body: "Number lean for your ask." },
          ],
        },
        {
          intro: "你将输入姓名或词语、查看字母数值合计，再读数理倾向。",
          steps: [
            { title: "认识字母数值占", body: "希腊字母 · 合计。" },
            { title: "输入姓名或词语", body: "拉丁或希腊罗马字。" },
            { title: "查看数值合计", body: "教学总和点亮。" },
            { title: "读取数理倾向", body: "色带出现。" },
            { title: "字母数值指引", body: "数理对照所问。" },
          ],
        },
        {
          intro: "你將輸入姓名或詞語、查看字母數值合計，再讀數理傾向。",
          steps: [
            { title: "認識字母數值占", body: "希臘字母 · 合計。" },
            { title: "輸入姓名或詞語", body: "拉丁或希臘羅馬字。" },
            { title: "查看數值合計", body: "教學總和點亮。" },
            { title: "讀取數理傾向", body: "色帶出現。" },
            { title: "字母數值指引", body: "數理對照所問。" },
          ],
        }
      ),
      steps: ["intent", "nameInGreek", "isopSum", "isopLean", "result"],
      viz: "isop",
      castCta: { en: "Read the number lean", zh: "读取数理倾向", hant: "讀取數理傾向" },
      buildCast(state, rng) {
        const name = state.personName || "Logos";
        const total = letterSum(name) * 7 + (name.length % 11);
        const band = ISOP[total % ISOP.length];
        return { name, total, band, lean: loc(band.lean) };
      },
      generate(q, cast) {
        const b = loc({ en: cast.band.en, zh: cast.band.zh });
        return pack({
          title: `${cast.name} · ${cast.total} · ${b}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(
                `教学字母数值占以「${cast.name}」得合 ${cast.total}（${b}），倾向「${cast.lean}」。真算需希腊正字法。`,
                `教學字母數值占以「${cast.name}」得合 ${cast.total}（${b}），傾向「${cast.lean}」。真算需希臘正字法。`
              )
            : `Teaching isopsephy for “${cast.name}” totals ${cast.total} (${b}), leaning “${cast.lean}”. Real work needs Greek orthography.`,
          interpret: interpretQ(q || cast.name, cast.lean, isZh() ? "希腊字母数值" : "isopsephy"),
          details: [cast.name, String(cast.total), b],
          doList: [
            isZh()
              ? zhText(`围绕「${cast.lean}」写一句今日意图。`, `圍繞「${cast.lean}」寫一句今日意圖。`)
              : `Write one today-intention matching “${cast.lean}”.`,
          ],
          dontList: [
            isZh()
              ? zhText("不要因数理羞辱姓名。", "不要因數理羞辱姓名。")
              : "Do not shame a name over number totals.",
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
            "本站为教育性游玩——不能替代受训占星／数理、医疗、法律或安全判断。",
            "本站為教育性遊玩——不能替代受訓占星／數理、醫療、法律或安全判斷。"
          )
        : "Educational play on this site — not a substitute for trained astrology/numerology, medicine, law, or safety judgment.",
    };
  }
  function runCast(id, state) {
    const rite = RITES[id];
    if (!rite) return null;
    const rng = mulberry32(
      seedFrom(state.question || state.personName || state.birthDate || state.askMoment, state.nonce, id)
    );
    const cast = Object.assign({}, state.cast || {}, rite.buildCast(state, rng) || {});
    return rite.generate(state.question || state.focus || state.personName || "", cast, rng);
  }

  window.FatumWestAstroOracles = { IDS, has, get, howFor, runCast, loc };
})();
