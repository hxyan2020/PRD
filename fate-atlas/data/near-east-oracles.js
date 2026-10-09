/**
 * Near Eastern / Abrahamic / Mesopotamian oracles — unique steps, visuals, readings.
 * Islamic Astrology · Manāzil · Fāl-e Ḥāfeẓ · Istikhāra · Abjad · Jafr · Firdaria ·
 * Ikhtiyārāt · Belomancy · Gematria · Mazalot · Urim & Thummim · Goralot ·
 * Turkish Coffee · Kurşun Dökme · Extispicy · Dream Omens
 */
(function () {
  "use strict";

  const IDS = [
    "islamic-astrology",
    "manazil",
    "fal-hafez",
    "istikhara",
    "abjad",
    "jafr",
    "firdaria",
    "ikhtiyarat",
    "belomancy",
    "kabbalah-numerology",
    "mazalot",
    "urim-thummim",
    "goralot",
    "coffee-tasseography",
    "molybdomancy-tr",
    "mesopotamian-extispicy",
    "mesopotamian-dream",
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
      kind: "neareast",
      ...r,
      disclaimer: isZh()
        ? zhText(
            "教育性模拟——不能替代受训占星／经文／祭司实践，也不能替代医疗、法律或安全判断。可能不准确；无法预测黑天鹅事件。",
            "教育性模擬——不能替代受訓占星／經文／祭司實踐，也不能替代醫療、法律或安全判斷。可能不準確；無法預測黑天鵝事件。"
          )
        : "Educational simulation — not a substitute for trained astrology/scripture/priestly practice, medicine, law, or safety judgment. May be inaccurate; cannot predict black swan events.",
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
  function letterSum(name) {
    let s = 0;
    const str = String(name || "A");
    for (let i = 0; i < str.length; i++) s += 1 + (str.charCodeAt(i) % 9);
    return 1 + (s % 9) || 9;
  }

  const PLANETS = [
    { en: "Saturn hour", zh: "土星时", lean: { en: "structure · patience", zh: "结构·耐心", hant: "結構·耐心" } },
    { en: "Jupiter hour", zh: "木星时", lean: { en: "grow · counsel", zh: "成长·建言", hant: "成長·建言" } },
    { en: "Mars hour", zh: "火星时", lean: { en: "act · defend", zh: "行动·护界", hant: "行動·護界" } },
    { en: "Sun hour", zh: "太阳时", lean: { en: "visible lead", zh: "外显带领", hant: "外顯帶領" } },
    { en: "Venus hour", zh: "金星时", lean: { en: "harmonize · value", zh: "调和·看价值", hant: "調和·看價值" } },
    { en: "Mercury hour", zh: "水星时", lean: { en: "talk · trade", zh: "言谈·交易", hant: "言談·交易" } },
    { en: "Moon hour", zh: "月亮时", lean: { en: "care · nest", zh: "照护·筑巢", hant: "照護·築巢" } },
  ];
  const MANAZIL = [
    { en: "Al-Sharaṭān", zh: "两角宿", lean: { en: "begin · cut clean", zh: "起势·利落切割", hant: "起勢·利落切割" } },
    { en: "Al-Thurayyā", zh: "昴宿", lean: { en: "gather · craft", zh: "聚合·手艺", hant: "聚合·手藝" } },
    { en: "Al-Dabarān", zh: "毕宿", lean: { en: "watch heat · pace", zh: "慎热·控节奏", hant: "慎熱·控節奏" } },
    { en: "Al-Haçal", zh: "觜宿意", lean: { en: "seek · scout", zh: "寻视·探路", hant: "尋視·探路" } },
    { en: "Al-Nathra", zh: "鬼宿意", lean: { en: "soft belly · rest", zh: "柔软·歇息", hant: "柔軟·歇息" } },
    { en: "Al-Balda", zh: "危宿意", lean: { en: "city pause · plan", zh: "城中停·谋划", hant: "城中停·謀劃" } },
  ];
  const HAFEZ = [
    { en: "Cupbearer verse", zh: "司酒诗意", lean: { en: "share joy · stay kind", zh: "分享喜乐·保善", hant: "分享喜樂·保善" } },
    { en: "Rose garden verse", zh: "玫瑰园诗意", lean: { en: "beauty before haste", zh: "先美后急", hant: "先美後急" } },
    { en: "Nightingale verse", zh: "夜莺诗意", lean: { en: "speak true · soft", zh: "直言·柔说", hant: "直言·柔說" } },
    { en: "Dust of the path", zh: "尘路诗意", lean: { en: "humble step forward", zh: "谦步前行", hant: "謙步前行" } },
    { en: "Wine of patience", zh: "忍酒诗意", lean: { en: "wait the right cup", zh: "等对的一杯", hant: "等對的一杯" } },
  ];
  const ISTIKHARA = [
    { en: "Ease opens", zh: "易开", lean: { en: "proceed with witnesses", zh: "有人见证再行", hant: "有人見證再行" } },
    { en: "Heart unsettled", zh: "心未安", lean: { en: "delay · gather facts", zh: "延后·收集事实", hant: "延後·收集事實" } },
    { en: "Mixed signs", zh: "兆杂", lean: { en: "trial one reversible step", zh: "试一步可逆", hant: "試一步可逆" } },
    { en: "Quiet yes", zh: "静是", lean: { en: "accept · prepare gently", zh: "接纳·温和准备", hant: "接納·溫和準備" } },
  ];
  const JAFR = [
    { en: "Letter gate opens", zh: "字母门开", lean: { en: "name the ask clearly", zh: "把问题说清楚", hant: "把問題說清楚" } },
    { en: "Cipher of pause", zh: "停顿密文", lean: { en: "hold · rewrite the plan", zh: "按兵·改写计划", hant: "按兵·改寫計劃" } },
    { en: "Witness letters", zh: "见证字母", lean: { en: "bring a second mind", zh: "请第二意见", hant: "請第二意見" } },
    { en: "Path of return", zh: "回返之路", lean: { en: "circle back to basics", zh: "回到基本面", hant: "回到基本面" } },
  ];
  const FIRDARIA = [
    { en: "Sun period", zh: "日周期", lean: { en: "identity · duty", zh: "身份·职分", hant: "身份·職分" } },
    { en: "Moon period", zh: "月周期", lean: { en: "care · mood pace", zh: "照护·情绪节奏", hant: "照護·情緒節奏" } },
    { en: "Mars period", zh: "火周期", lean: { en: "drive · cut clean", zh: "驱动·利落切割", hant: "驅動·利落切割" } },
    { en: "Mercury period", zh: "水周期", lean: { en: "words · links", zh: "言辞·连结", hant: "言辭·連結" } },
    { en: "Jupiter period", zh: "木周期", lean: { en: "expand wisely", zh: "明智扩展", hant: "明智擴展" } },
    { en: "Venus period", zh: "金周期", lean: { en: "beauty · bond", zh: "美感·连结", hant: "美感·連結" } },
    { en: "Saturn period", zh: "土周期", lean: { en: "slow build", zh: "慢工积累", hant: "慢工積累" } },
  ];
  const ARROWS = [
    { en: "Command arrow", zh: "令箭", lean: { en: "decide · announce", zh: "决断·宣告", hant: "決斷·宣告" } },
    { en: "Blank arrow", zh: "空白箭", lean: { en: "no · wait", zh: "否·等待", hant: "否·等待" } },
    { en: "Travel arrow", zh: "行旅箭", lean: { en: "go with a buffer", zh: "出行留缓冲", hant: "出行留緩衝" } },
    { en: "Peace arrow", zh: "和箭", lean: { en: "reconcile · soften", zh: "和解·柔化", hant: "和解·柔化" } },
  ];
  const MAZAL = [
    { en: "Ṭaleh (Aries)", zh: "白羊", lean: { en: "start boldly", zh: "大胆起步", hant: "大膽起步" } },
    { en: "Shor (Taurus)", zh: "金牛", lean: { en: "steady build", zh: "稳健积累", hant: "穩健積累" } },
    { en: "Teomim (Gemini)", zh: "双子", lean: { en: "talk · twin paths", zh: "言谈·双径", hant: "言談·雙徑" } },
    { en: "Sartan (Cancer)", zh: "巨蟹", lean: { en: "home · protect", zh: "家·守护", hant: "家·守護" } },
    { en: "Aryeh (Leo)", zh: "狮子", lean: { en: "lead · warm", zh: "带领·温暖", hant: "帶領·溫暖" } },
    { en: "Betulah (Virgo)", zh: "处女", lean: { en: "refine detail", zh: "精炼细节", hant: "精煉細節" } },
  ];
  const URIM = [
    { en: "Urim light", zh: "乌陵亮", lean: { en: "yes · proceed carefully", zh: "是·谨慎前行", hant: "是·謹慎前行" } },
    { en: "Thummim still", zh: "土明静", lean: { en: "no · hold the line", zh: "否·守住界线", hant: "否·守住界線" } },
    { en: "Both mute", zh: "双静", lean: { en: "unclear · ask again later", zh: "不明·稍后再问", hant: "不明·稍後再問" } },
  ];
  const GORAL = [
    { en: "Lot of mercy", zh: "慈念签", lean: { en: "soften · forgive one thing", zh: "柔化·宽恕一事", hant: "柔化·寬恕一事" } },
    { en: "Lot of counsel", zh: "劝诫签", lean: { en: "seek an elder mind", zh: "求教长者", hant: "求教長者" } },
    { en: "Lot of gate", zh: "门签", lean: { en: "open one small door", zh: "开一扇小门", hant: "開一扇小門" } },
    { en: "Lot of hush", zh: "静签", lean: { en: "speak less · listen more", zh: "少说·多听", hant: "少說·多聽" } },
  ];
  const COFFEE = [
    { en: "Bird track", zh: "鸟迹", lean: { en: "news arrives · stay light", zh: "消息将至·保持轻", hant: "消息將至·保持輕" } },
    { en: "Road line", zh: "路纹", lean: { en: "travel or move soon", zh: "宜行或迁移", hant: "宜行或遷移" } },
    { en: "Heart swirl", zh: "心漩", lean: { en: "tend a relationship", zh: "关照一段关系", hant: "關照一段關係" } },
    { en: "Mountain mound", zh: "山丘", lean: { en: "slow climb · persist", zh: "慢爬·坚持", hant: "慢爬·堅持" } },
  ];
  const LEAD = [
    { en: "Shield shape", zh: "盾形", lean: { en: "protect · set a boundary", zh: "保护·设界", hant: "保護·設界" } },
    { en: "Key shape", zh: "钥匙形", lean: { en: "unlock one stuck door", zh: "打开一扇卡住的门", hant: "打開一扇卡住的門" } },
    { en: "Ring shape", zh: "环形", lean: { en: "close a loop kindly", zh: "善意收尾", hant: "善意收尾" } },
    { en: "Scatter drops", zh: "散滴", lean: { en: "release worry · breathe", zh: "放下忧虑·呼吸", hant: "放下憂慮·呼吸" } },
  ];
  const LIVER = [
    { en: "Favorable lobe", zh: "吉叶", lean: { en: "campaign may proceed", zh: "行动可推进", hant: "行動可推進" } },
    { en: "Marked cleft", zh: "裂痕", lean: { en: "inspect risk · delay", zh: "检视风险·延后", hant: "檢視風險·延後" } },
    { en: "Even texture", zh: "纹理匀", lean: { en: "steady path · no rush", zh: "稳路·勿赶", hant: "穩路·勿趕" } },
    { en: "Dark edge", zh: "暗缘", lean: { en: "watch the margins", zh: "留意边缘细节", hant: "留意邊緣細節" } },
  ];
  const DREAMS = [
    { en: "River dream", zh: "河梦", lean: { en: "flow around obstacles", zh: "绕障而行", hant: "繞障而行" } },
    { en: "Gate dream", zh: "门梦", lean: { en: "a threshold decision", zh: "门槛抉择", hant: "門檻抉擇" } },
    { en: "Bird dream", zh: "鸟梦", lean: { en: "message · listen", zh: "讯息·倾听", hant: "訊息·傾聽" } },
    { en: "Fire dream", zh: "火梦", lean: { en: "transform · contain heat", zh: "转化·控热", hant: "轉化·控熱" } },
  ];
  const NUM_BANDS = [
    { en: "Rising band", zh: "升势带", lean: { en: "grow the craft", zh: "滋养技艺", hant: "滋養技藝" } },
    { en: "Steady band", zh: "稳健带", lean: { en: "keep pace · protect rest", zh: "稳节奏·护休息", hant: "穩節奏·護休息" } },
    { en: "Refine band", zh: "精炼带", lean: { en: "edit the signature", zh: "精炼署名", hant: "精煉署名" } },
  ];

  function riteShell(id, summary, how, steps, viz, castCta, buildCast, generate) {
    return { summary, how, steps, viz, castCta, buildCast, generate };
  }

  const RITES = {
    "islamic-astrology": riteShell(
      "islamic-astrology",
      {
        en: "Islamic astrology reads celestial positions for destiny themes and elections in medieval interpretive systems.",
        zh: "伊斯兰占星以天体位置论命运主题与择时，承中世纪诠释体系。",
        hant: "伊斯蘭占星以天體位置論命運主題與擇時，承中世紀詮釋體系。",
      },
      howPack(
        {
          intro: "You’ll enter birth date, pick a planetary hour lens, then open a teaching chart lean.",
          steps: [
            { title: "Meet Islamic astrology", body: "Planets · hours · elections." },
            { title: "Enter birth date", body: "Chart seed." },
            { title: "Pick a planetary hour", body: "Teaching hour choice." },
            { title: "Open the chart lean", body: "Hour lean appears." },
            { title: "Astrology counsel", body: "Hour lean for your focus." },
          ],
        },
        {
          intro: "你将输入生辰、选择行星时视角，再打开教学盘倾向。",
          steps: [
            { title: "认识伊斯兰占星", body: "行星 · 时 · 择时。" },
            { title: "输入出生日期", body: "盘种。" },
            { title: "选择行星时", body: "教学时选择。" },
            { title: "打开盘面倾向", body: "时辰倾向出现。" },
            { title: "占星指引", body: "时意对照焦点。" },
          ],
        },
        {
          intro: "你將輸入生辰、選擇行星時視角，再打開教學盤傾向。",
          steps: [
            { title: "認識伊斯蘭占星", body: "行星 · 時 · 擇時。" },
            { title: "輸入出生日期", body: "盤種。" },
            { title: "選擇行星時", body: "教學時選擇。" },
            { title: "打開盤面傾向", body: "時辰傾向出現。" },
            { title: "占星指引", body: "時意對照焦點。" },
          ],
        }
      ),
      ["intent", "birth", "planetHour", "islamicChart", "result"],
      "islamic",
      { en: "Open the chart lean", zh: "打开盘面倾向", hant: "打開盤面傾向" },
      (state, rng) => {
        const hour = PLANETS.find((p) => p.en === state.planetHour) || pick(rng, PLANETS);
        return { birth: state.birthDate || "", hour, lean: loc(hour.lean) };
      },
      (q, cast) => {
        const h = loc({ en: cast.hour.en, zh: cast.hour.zh });
        return pack({
          title: `${cast.birth || "—"} · ${h}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学伊斯兰占星以「${cast.birth || "—"}」看「${h}」，倾向「${cast.lean}」。真盘需精确时区与星历。`, `教學伊斯蘭占星以「${cast.birth || "—"}」看「${h}」，傾向「${cast.lean}」。真盤需精確時區與星曆。`)
            : `Teaching Islamic astrology for “${cast.birth || "—"}” shows “${h}”, leaning “${cast.lean}”. Real charts need exact timezone and ephemeris.`,
          interpret: interpretQ(q, cast.lean, isZh() ? "行星时" : "the planetary hour"),
          details: [cast.birth || "—", h],
          doList: [isZh() ? zhText(`围绕「${cast.lean}」安排本周一次专注时段。`, `圍繞「${cast.lean}」安排本週一次專注時段。`) : `Book one focus block this week around “${cast.lean}”.`],
          dontList: [isZh() ? zhText("不要用简化盘恐吓他人做重大决定。", "不要用簡化盤恐嚇他人做重大決定。") : "Do not scare others into major moves from a teaching chart."],
          tone: "deep",
          vizData: cast,
        });
      }
    ),

    manazil: riteShell(
      "manazil",
      {
        en: "Manāzil are twenty-eight Arabian lunar stations used for weather, travel, and natal day quality.",
        zh: "月宿（Manāzil）是二十八个阿拉伯月站，用于天气、出行与生辰日质。",
        hant: "月宿（Manāzil）是二十八個阿拉伯月站，用於天氣、出行與生辰日質。",
      },
      howPack(
        {
          intro: "You’ll pick a day, see its manzil station, then read the counsel.",
          steps: [
            { title: "Meet Manāzil", body: "Twenty-eight stations · travel." },
            { title: "Pick a day", body: "Date under review." },
            { title: "See the manzil", body: "Station lights." },
            { title: "Read the station counsel", body: "Station lean appears." },
            { title: "Manāzil counsel", body: "Lean for your purpose." },
          ],
        },
        {
          intro: "你将点选日期、查看月宿站，再读日辰指引。",
          steps: [
            { title: "认识月宿", body: "二十八站 · 出行。" },
            { title: "点选日期", body: "所问之日。" },
            { title: "查看月宿", body: "月站点亮。" },
            { title: "读取月宿指引", body: "月宿倾向出现。" },
            { title: "月宿指引", body: "倾向对照目的。" },
          ],
        },
        {
          intro: "你將點選日期、查看月宿站，再讀日辰指引。",
          steps: [
            { title: "認識月宿", body: "二十八站 · 出行。" },
            { title: "點選日期", body: "所問之日。" },
            { title: "查看月宿", body: "月站點亮。" },
            { title: "讀取月宿指引", body: "月宿傾向出現。" },
            { title: "月宿指引", body: "傾向對照目的。" },
          ],
        }
      ),
      ["intent", "daypickManzil", "mansionManzil", "manazilCounsel", "result"],
      "manazil",
      { en: "Read the station counsel", zh: "读取月宿指引", hant: "讀取月宿指引" },
      (state, rng) => {
        const m = MANAZIL.find((x) => x.en === state.manzil) || pick(rng, MANAZIL);
        return { date: state.dayDate || "", m, lean: loc(m.lean) };
      },
      (q, cast) => {
        const m = loc({ en: cast.m.en, zh: cast.m.zh });
        return pack({
          title: `${cast.date || "—"} · ${m}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学月宿于「${cast.date || "未选日"}」见「${m}」，倾向「${cast.lean}」。真月宿依当地历算。`, `教學月宿於「${cast.date || "未選日"}」見「${m}」，傾向「${cast.lean}」。真月宿依當地曆算。`)
            : `Teaching manāzil on “${cast.date || "unset day"}” shows “${m}”, leaning “${cast.lean}”. Real stations follow a local almanac.`,
          interpret: interpretQ(q || cast.date, cast.lean, isZh() ? "阿拉伯月宿" : "the manzil station"),
          details: [cast.date || "—", m],
          doList: [isZh() ? zhText(`按「${cast.lean}」安排今天一个时间块。`, `按「${cast.lean}」安排今天一個時間塊。`) : `Schedule one time block today matching “${cast.lean}”.`],
          dontList: [isZh() ? zhText("不要因月宿取消必要行程。", "不要因月宿取消必要行程。") : "Do not cancel needed travel over manāzil alone."],
          tone: /慎|watch|heat|pace|危/i.test(m + cast.lean) ? "caution" : "mixed",
          vizData: cast,
        });
      }
    ),

    "fal-hafez": riteShell(
      "fal-hafez",
      {
        en: "Fāl-e Ḥāfeẓ opens Hafez’s Divan at random — the poem mirrors the seeker’s intention as counsel, not decree.",
        zh: "哈菲兹诗占随机翻开《哈菲兹诗集》，以诗句作意向之镜——是指引，不是法令。",
        hant: "哈菲茲詩占隨機翻開《哈菲茲詩集》，以詩句作意向之鏡——是指引，不是法令。",
      },
      howPack(
        {
          intro: "You’ll hold a question, open the teaching Divan, then receive a verse lean.",
          steps: [
            { title: "Meet Fāl-e Ḥāfeẓ", body: "Divan · intention · verse." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Open the Divan", body: "Pages flutter." },
            { title: "Receive the verse", body: "Poem lean appears." },
            { title: "Hafez counsel", body: "Verse lean for your question." },
          ],
        },
        {
          intro: "你将抱定问题、翻开教学诗集，再领取诗句倾向。",
          steps: [
            { title: "认识哈菲兹诗占", body: "诗集 · 意向 · 诗句。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "翻开诗集", body: "书页翻动。" },
            { title: "领取诗句", body: "诗意倾向出现。" },
            { title: "哈菲兹指引", body: "诗意对照问题。" },
          ],
        },
        {
          intro: "你將抱定問題、翻開教學詩集，再領取詩句傾向。",
          steps: [
            { title: "認識哈菲茲詩占", body: "詩集 · 意向 · 詩句。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "翻開詩集", body: "書頁翻動。" },
            { title: "領取詩句", body: "詩意傾向出現。" },
            { title: "哈菲茲指引", body: "詩意對照問題。" },
          ],
        }
      ),
      ["intent", "question", "openDivan", "hafezVerse", "result"],
      "hafez",
      { en: "Receive the verse", zh: "领取诗句", hant: "領取詩句" },
      (state, rng) => {
        const verse = pick(rng, HAFEZ);
        return { verse, lean: loc(verse.lean), page: 1 + Math.floor(rng() * 400) };
      },
      (q, cast) => {
        const v = loc({ en: cast.verse.en, zh: cast.verse.zh });
        return pack({
          title: `${v} · p.${cast.page}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学哈菲兹诗占翻至约第 ${cast.page} 页「${v}」，倾向「${cast.lean}」。真诗占需完整诗集与文化语境。`, `教學哈菲茲詩占翻至約第 ${cast.page} 頁「${v}」，傾向「${cast.lean}」。真詩占需完整詩集與文化語境。`)
            : `Teaching Fāl-e Ḥāfeẓ opens near p.${cast.page} “${v}”, leaning “${cast.lean}”. Real fāl needs the full Divan and cultural context.`,
          interpret: interpretQ(q, cast.lean, isZh() ? "哈菲兹诗句" : "the Hafez verse"),
          details: [v, `p.${cast.page}`],
          doList: [isZh() ? zhText(`把「${cast.lean}」写成今天一句可执行的提醒。`, `把「${cast.lean}」寫成今天一句可執行的提醒。`) : `Write “${cast.lean}” as one doable reminder today.`],
          dontList: [isZh() ? zhText("不要用诗句强迫他人服从。", "不要用詩句強迫他人服從。") : "Do not coerce others with a poem lot."],
          tone: "bright",
          vizData: cast,
        });
      }
    ),
  };

  // Continue remaining rites in compact form
  Object.assign(RITES, {
    istikhara: {
      summary: {
        en: "Istikhāra seeks guidance through prayer — answers are read via ease, dream, or lots as a spiritual mirror, not a guarantee.",
        zh: "求签祈导（Istikhāra）以祈祷求指引——借由心安、梦兆或抽签作灵性之镜，不是保证。",
        hant: "求籤祈導（Istikhāra）以祈禱求指引——藉由心安、夢兆或抽籤作靈性之鏡，不是保證。",
      },
      how: howPack(
        {
          intro: "You’ll hold a question, settle into teaching ease, then read an istikhāra sign.",
          steps: [
            { title: "Meet Istikhāra", body: "Prayer · ease · sign." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Settle into ease", body: "Notice tightness or calm." },
            { title: "Read the sign", body: "Ease lean appears." },
            { title: "Istikhāra counsel", body: "Sign lean for your ask." },
          ],
        },
        {
          intro: "你将抱定问题、安住教学心安感，再读祈导征兆。",
          steps: [
            { title: "认识祈导", body: "祈祷 · 心安 · 征兆。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "安住心安", body: "觉察紧或松。" },
            { title: "读取征兆", body: "心安倾向出现。" },
            { title: "祈导指引", body: "兆意对照所问。" },
          ],
        },
        {
          intro: "你將抱定問題、安住教學心安感，再讀祈導徵兆。",
          steps: [
            { title: "認識祈導", body: "祈禱 · 心安 · 徵兆。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "安住心安", body: "覺察緊或鬆。" },
            { title: "讀取徵兆", body: "心安傾向出現。" },
            { title: "祈導指引", body: "兆意對照所問。" },
          ],
        }
      ),
      steps: ["intent", "question", "prayEase", "istikharaSign", "result"],
      viz: "istikhara",
      castCta: { en: "Read the sign", zh: "读取征兆", hant: "讀取徵兆" },
      buildCast(state, rng) {
        const sign = pick(rng, ISTIKHARA);
        return { sign, lean: loc(sign.lean) };
      },
      generate(q, cast) {
        const s = loc({ en: cast.sign.en, zh: cast.sign.zh });
        return pack({
          title: s,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学祈导示「${s}」，倾向「${cast.lean}」。真祈导是灵修实践，不是占卜表演。`, `教學祈導示「${s}」，傾向「${cast.lean}」。真祈導是靈修實踐，不是占卜表演。`)
            : `Teaching istikhāra shows “${s}”, leaning “${cast.lean}”. Real istikhāra is spiritual practice, not a show.`,
          interpret: interpretQ(q, cast.lean, isZh() ? "祈导征兆" : "istikhāra"),
          details: [s],
          doList: [isZh() ? zhText(`若倾向偏延后，先收集一件可验证的事实。`, `若傾向偏延後，先收集一件可驗證的事實。`) : `If the lean delays, gather one verifiable fact first.`],
          dontList: [isZh() ? zhText("不要用祈导羞辱他人的选择。", "不要用祈導羞辱他人的選擇。") : "Do not shame others’ choices with istikhāra."],
          tone: /未安|delay|wait|延/i.test(s + cast.lean) ? "caution" : "bright",
          vizData: cast,
        });
      },
    },

    abjad: {
      summary: {
        en: "Abjad numerology assigns values to letters in the Semitic alphabet order for name and word counsel.",
        zh: "阿布贾德数字命理依闪语字母顺序赋值，论姓名与词语倾向。",
        hant: "阿布賈德數字命理依閃語字母順序賦值，論姓名與詞語傾向。",
      },
      how: howPack(
        {
          intro: "You’ll enter a name or word, see the abjad sum, then read the number lean.",
          steps: [
            { title: "Meet Abjad", body: "Letters · values · counsel." },
            { title: "Enter a name or word", body: "Latin or Arabic romanization." },
            { title: "See the abjad sum", body: "Teaching total lights." },
            { title: "Read the number lean", body: "Band appears." },
            { title: "Abjad counsel", body: "Number lean for your ask." },
          ],
        },
        {
          intro: "你将输入姓名或词语、查看阿布贾德合计，再读数理倾向。",
          steps: [
            { title: "认识阿布贾德", body: "字母 · 数值 · 指引。" },
            { title: "输入姓名或词语", body: "拉丁或阿拉伯罗马字。" },
            { title: "查看阿布贾德合计", body: "教学总和点亮。" },
            { title: "读取数理倾向", body: "色带出现。" },
            { title: "阿布贾德指引", body: "数理对照所问。" },
          ],
        },
        {
          intro: "你將輸入姓名或詞語、查看阿布賈德合計，再讀數理傾向。",
          steps: [
            { title: "認識阿布賈德", body: "字母 · 數值 · 指引。" },
            { title: "輸入姓名或詞語", body: "拉丁或阿拉伯羅馬字。" },
            { title: "查看阿布賈德合計", body: "教學總和點亮。" },
            { title: "讀取數理傾向", body: "色帶出現。" },
            { title: "阿布賈德指引", body: "數理對照所問。" },
          ],
        }
      ),
      steps: ["intent", "nameInAbjad", "abjadSum", "abjadLean", "result"],
      viz: "abjad",
      castCta: { en: "Read the number lean", zh: "读取数理倾向", hant: "讀取數理傾向" },
      buildCast(state, rng) {
        const name = state.personName || "A";
        const total = letterSum(name);
        const band = NUM_BANDS[(total - 1) % NUM_BANDS.length];
        return { name, total, band, lean: loc(band.lean) };
      },
      generate(q, cast) {
        const b = loc({ en: cast.band.en, zh: cast.band.zh });
        return pack({
          title: `${cast.name} · ${cast.total} · ${b}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学阿布贾德以「${cast.name}」得合 ${cast.total}（${b}），倾向「${cast.lean}」。真算需规范字母表。`, `教學阿布賈德以「${cast.name}」得合 ${cast.total}（${b}），傾向「${cast.lean}」。真算需規範字母表。`)
            : `Teaching abjad for “${cast.name}” totals ${cast.total} (${b}), leaning “${cast.lean}”. Real work needs a standard letter table.`,
          interpret: interpretQ(q || cast.name, cast.lean, isZh() ? "阿布贾德数理" : "abjad numerology"),
          details: [cast.name, String(cast.total), b],
          doList: [isZh() ? zhText(`试一句更清晰的自我介绍，呼应「${cast.lean}」。`, `試一句更清晰的自我介紹，呼應「${cast.lean}」。`) : `Try one clearer self-intro matching “${cast.lean}”.`],
          dontList: [isZh() ? zhText("不要因数理羞辱姓名。", "不要因數理羞辱姓名。") : "Do not shame a name over number totals."],
          tone: "mixed",
          vizData: cast,
        });
      },
    },

    jafr: {
      summary: {
        en: "Jafr is letter science traditionally attributed to Jaʿfar al-Ṣādiq — tables combine letters into oracular phrases.",
        zh: "贾弗尔字母学传统上归于贾法尔·萨迪克——以表组合字母成神谕短语。",
        hant: "賈弗爾字母學傳統上歸於賈法爾·薩迪克——以表組合字母成神諭短語。",
      },
      how: howPack(
        {
          intro: "You’ll hold a question, consult a teaching jafr table, then read the phrase lean.",
          steps: [
            { title: "Meet Jafr", body: "Letters · tables · phrases." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Consult the table", body: "Letters combine." },
            { title: "Read the phrase", body: "Phrase lean appears." },
            { title: "Jafr counsel", body: "Phrase lean for your question." },
          ],
        },
        {
          intro: "你将抱定问题、查阅教学贾弗尔表，再读短语倾向。",
          steps: [
            { title: "认识贾弗尔", body: "字母 · 表 · 短语。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "查阅字母表", body: "字母组合。" },
            { title: "读取短语", body: "短语倾向出现。" },
            { title: "贾弗尔指引", body: "短语对照问题。" },
          ],
        },
        {
          intro: "你將抱定問題、查閱教學賈弗爾表，再讀短語傾向。",
          steps: [
            { title: "認識賈弗爾", body: "字母 · 表 · 短語。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "查閱字母表", body: "字母組合。" },
            { title: "讀取短語", body: "短語傾向出現。" },
            { title: "賈弗爾指引", body: "短語對照問題。" },
          ],
        }
      ),
      steps: ["intent", "question", "jafrTable", "jafrPhrase", "result"],
      viz: "jafr",
      castCta: { en: "Read the phrase", zh: "读取短语", hant: "讀取短語" },
      buildCast(state, rng) {
        const phrase = pick(rng, JAFR);
        return { phrase, lean: loc(phrase.lean) };
      },
      generate(q, cast) {
        const p = loc({ en: cast.phrase.en, zh: cast.phrase.zh });
        return pack({
          title: p,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学贾弗尔得「${p}」，倾向「${cast.lean}」。真贾弗尔需师承表法。`, `教學賈弗爾得「${p}」，傾向「${cast.lean}」。真賈弗爾需師承表法。`)
            : `Teaching jafr yields “${p}”, leaning “${cast.lean}”. Real jafr needs transmitted tables.`,
          interpret: interpretQ(q, cast.lean, isZh() ? "贾弗尔短语" : "the jafr phrase"),
          details: [p],
          doList: [isZh() ? zhText(`按「${cast.lean}」改写今天一个计划句。`, `按「${cast.lean}」改寫今天一個計劃句。`) : `Rewrite one plan sentence today to match “${cast.lean}”.`],
          dontList: [isZh() ? zhText("不要伪造秘传权威恐吓他人。", "不要偽造秘傳權威恐嚇他人。") : "Do not fake secret authority to frighten others."],
          tone: /pause|停|hold|按兵/i.test(p + cast.lean) ? "caution" : "mixed",
          vizData: cast,
        });
      },
    },

    firdaria: {
      summary: {
        en: "Firdaria are Persian planetary time-lords — life periods under successive planets for timing themes.",
        zh: "菲尔达里亚是波斯行星时主体系——人生各段由行星轮值论时机主题。",
        hant: "菲爾達里亞是波斯行星時主體系——人生各段由行星輪值論時機主題。",
      },
      how: howPack(
        {
          intro: "You’ll enter birth date, see the firdaria lord, then read the period tone.",
          steps: [
            { title: "Meet Firdaria", body: "Planets · periods · timing." },
            { title: "Enter birth date", body: "Period seed." },
            { title: "See the firdaria lord", body: "Planet period lights." },
            { title: "Read the period tone", body: "Lord lean appears." },
            { title: "Firdaria counsel", body: "Period lean for your focus." },
          ],
        },
        {
          intro: "你将输入生辰、查看菲尔达里亚时主，再读周期色调。",
          steps: [
            { title: "认识菲尔达里亚", body: "行星 · 周期 · 时机。" },
            { title: "输入出生日期", body: "周期种。" },
            { title: "查看时主", body: "行星周期点亮。" },
            { title: "读取周期色调", body: "时主倾向出现。" },
            { title: "菲尔达里亚指引", body: "周期对照焦点。" },
          ],
        },
        {
          intro: "你將輸入生辰、查看菲爾達里亞時主，再讀週期色調。",
          steps: [
            { title: "認識菲爾達里亞", body: "行星 · 週期 · 時機。" },
            { title: "輸入出生日期", body: "週期種。" },
            { title: "查看時主", body: "行星週期點亮。" },
            { title: "讀取週期色調", body: "時主傾向出現。" },
            { title: "菲爾達里亞指引", body: "週期對照焦點。" },
          ],
        }
      ),
      steps: ["intent", "birth", "firdariaLord", "firdariaTone", "result"],
      viz: "firdaria",
      castCta: { en: "Read the period tone", zh: "读取周期色调", hant: "讀取週期色調" },
      buildCast(state, rng) {
        const lord = FIRDARIA.find((f) => f.en === state.firdariaLord) || pick(rng, FIRDARIA);
        return { birth: state.birthDate || "", lord, lean: loc(lord.lean) };
      },
      generate(q, cast) {
        const l = loc({ en: cast.lord.en, zh: cast.lord.zh });
        return pack({
          title: `${cast.birth || "—"} · ${l}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学菲尔达里亚以「${cast.birth || "—"}」入「${l}」，倾向「${cast.lean}」。真时主需完整年表。`, `教學菲爾達里亞以「${cast.birth || "—"}」入「${l}」，傾向「${cast.lean}」。真時主需完整年表。`)
            : `Teaching firdaria for “${cast.birth || "—"}” enters “${l}”, leaning “${cast.lean}”. Real periods need full tables.`,
          interpret: interpretQ(q, cast.lean, isZh() ? "菲尔达里亚时主" : "the firdaria lord"),
          details: [cast.birth || "—", l],
          doList: [isZh() ? zhText(`按「${cast.lean}」推进一件可验证的下一步。`, `按「${cast.lean}」推進一件可驗證的下一步。`) : `Advance one verifiable next step matching “${cast.lean}”.`],
          dontList: [isZh() ? zhText("不要把教学周期当成绝对命运时刻表。", "不要把教學週期當成絕對命運時刻表。") : "Do not treat a teaching period as an absolute fate clock."],
          tone: "deep",
          vizData: cast,
        });
      },
    },

    ikhtiyarat: {
      summary: {
        en: "Ikhtiyārāt is electional astrology — choosing auspicious moments, famously practiced at the Abbasid court.",
        zh: "择时星占（Ikhtiyārāt）选择吉利时刻，著名于阿拔斯宫廷实践。",
        hant: "擇時星占（Ikhtiyārāt）選擇吉利時刻，著名於阿拔斯宮廷實踐。",
      },
      how: howPack(
        {
          intro: "You’ll pick a candidate day, set an election hour, then read the counsel.",
          steps: [
            { title: "Meet Ikhtiyārāt", body: "Elections · hours · starts." },
            { title: "Pick a candidate day", body: "Date under review." },
            { title: "Set an election hour", body: "Teaching hour choice." },
            { title: "Read the election counsel", body: "Hour lean appears." },
            { title: "Election counsel", body: "Lean for your purpose." },
          ],
        },
        {
          intro: "你将点选候选日、设定择时，再读择时指引。",
          steps: [
            { title: "认识择时星占", body: "择时 · 时辰 · 开事。" },
            { title: "点选候选日", body: "所问之日。" },
            { title: "设定择时", body: "教学时选择。" },
            { title: "读取择时指引", body: "时辰倾向出现。" },
            { title: "择时指引", body: "倾向对照目的。" },
          ],
        },
        {
          intro: "你將點選候選日、設定擇時，再讀擇時指引。",
          steps: [
            { title: "認識擇時星占", body: "擇時 · 時辰 · 開事。" },
            { title: "點選候選日", body: "所問之日。" },
            { title: "設定擇時", body: "教學時選擇。" },
            { title: "讀取擇時指引", body: "時辰傾向出現。" },
            { title: "擇時指引", body: "傾向對照目的。" },
          ],
        }
      ),
      steps: ["intent", "daypickElect", "electHour", "electCounsel", "result"],
      viz: "elect",
      castCta: { en: "Read the election counsel", zh: "读取择时指引", hant: "讀取擇時指引" },
      buildCast(state, rng) {
        const hour = PLANETS.find((p) => p.en === state.planetHour) || pick(rng, PLANETS);
        return { date: state.dayDate || "", hour, lean: loc(hour.lean) };
      },
      generate(q, cast) {
        const h = loc({ en: cast.hour.en, zh: cast.hour.zh });
        return pack({
          title: `${cast.date || "—"} · ${h}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学择时于「${cast.date || "未选日"}」取「${h}」，倾向「${cast.lean}」。真择时需完整星盘。`, `教學擇時於「${cast.date || "未選日"}」取「${h}」，傾向「${cast.lean}」。真擇時需完整星盤。`)
            : `Teaching ikhtiyārāt on “${cast.date || "unset day"}” takes “${h}”, leaning “${cast.lean}”. Real elections need a full chart.`,
          interpret: interpretQ(q || cast.date, cast.lean, isZh() ? "择时" : "the election hour"),
          details: [cast.date || "—", h],
          doList: [isZh() ? zhText(`按「${cast.lean}」安排一次可逆试探。`, `按「${cast.lean}」安排一次可逆試探。`) : `Schedule one reversible trial matching “${cast.lean}”.`],
          dontList: [isZh() ? zhText("不要因择时取消必要医疗预约。", "不要因擇時取消必要醫療預約。") : "Do not cancel needed medical appointments over elections."],
          tone: "mixed",
          vizData: cast,
        });
      },
    },

    belomancy: {
      summary: {
        en: "Belomancy draws marked arrows as lots for decisions and omens — an ancient Arabian and Eurasian practice.",
        zh: "箭卜（Belomancy）抽取带标记的箭矢作抉择与征兆——古代阿拉伯与欧亚传统。",
        hant: "箭卜（Belomancy）抽取帶標記的箭矢作抉擇與徵兆——古代阿拉伯與歐亞傳統。",
      },
      how: howPack(
        {
          intro: "You’ll hold a question, draw a teaching arrow, then read the lot lean.",
          steps: [
            { title: "Meet Belomancy", body: "Arrows · lots · decisions." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Draw an arrow", body: "A marked lot is taken." },
            { title: "Read the arrow lot", body: "Lot lean appears." },
            { title: "Arrow counsel", body: "Lot lean for your question." },
          ],
        },
        {
          intro: "你将抱定问题、抽取教学箭矢，再读签意倾向。",
          steps: [
            { title: "认识箭卜", body: "箭 · 签 · 抉择。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "抽取箭矢", body: "取出带标记的签。" },
            { title: "读取箭签", body: "签意倾向出现。" },
            { title: "箭卜指引", body: "签意对照问题。" },
          ],
        },
        {
          intro: "你將抱定問題、抽取教學箭矢，再讀籤意傾向。",
          steps: [
            { title: "認識箭卜", body: "箭 · 籤 · 抉擇。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "抽取箭矢", body: "取出帶標記的籤。" },
            { title: "讀取箭籤", body: "籤意傾向出現。" },
            { title: "箭卜指引", body: "籤意對照問題。" },
          ],
        }
      ),
      steps: ["intent", "question", "drawArrow", "arrowLot", "result"],
      viz: "arrow",
      castCta: { en: "Read the arrow lot", zh: "读取箭签", hant: "讀取箭籤" },
      buildCast(state, rng) {
        const arrow = pick(rng, ARROWS);
        return { arrow, lean: loc(arrow.lean) };
      },
      generate(q, cast) {
        const a = loc({ en: cast.arrow.en, zh: cast.arrow.zh });
        return pack({
          title: a,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学箭卜抽得「${a}」，倾向「${cast.lean}」。真箭卜是历史决策工具。`, `教學箭卜抽得「${a}」，傾向「${cast.lean}」。真箭卜是歷史決策工具。`)
            : `Teaching belomancy draws “${a}”, leaning “${cast.lean}”. Real arrow lots were historical decision tools.`,
          interpret: interpretQ(q, cast.lean, isZh() ? "箭签" : "the arrow lot"),
          details: [a],
          doList: [isZh() ? zhText(`按「${cast.lean}」做一件今天可完成的小事。`, `按「${cast.lean}」做一件今天可完成的小事。`) : `Do one small today-action matching “${cast.lean}”.`],
          dontList: [isZh() ? zhText("不要用箭签强迫他人服从。", "不要用箭籤強迫他人服從。") : "Do not coerce others with an arrow lot."],
          tone: /空白|no|wait|否/i.test(a + cast.lean) ? "caution" : "mixed",
          vizData: cast,
        });
      },
    },

    "kabbalah-numerology": {
      summary: {
        en: "Gematria assigns numeric values to Hebrew letters to reveal hidden meanings and destiny links in names and words.",
        zh: "希伯来字母数值（Gematria）揭示姓名与词语的隐意与命运连结。",
        hant: "希伯來字母數值（Gematria）揭示姓名與詞語的隱意與命運連結。",
      },
      how: howPack(
        {
          intro: "You’ll enter a name or word, see the gematria sum, then read the number lean.",
          steps: [
            { title: "Meet Gematria", body: "Hebrew letters · values." },
            { title: "Enter a name or word", body: "Latin or Hebrew romanization." },
            { title: "See the gematria sum", body: "Teaching total lights." },
            { title: "Read the number lean", body: "Band appears." },
            { title: "Gematria counsel", body: "Number lean for your ask." },
          ],
        },
        {
          intro: "你将输入姓名或词语、查看字母数值合计，再读数理倾向。",
          steps: [
            { title: "认识字母数值", body: "希伯来字母 · 数值。" },
            { title: "输入姓名或词语", body: "拉丁或希伯来罗马字。" },
            { title: "查看数值合计", body: "教学总和点亮。" },
            { title: "读取数理倾向", body: "色带出现。" },
            { title: "字母数值指引", body: "数理对照所问。" },
          ],
        },
        {
          intro: "你將輸入姓名或詞語、查看字母數值合計，再讀數理傾向。",
          steps: [
            { title: "認識字母數值", body: "希伯來字母 · 數值。" },
            { title: "輸入姓名或詞語", body: "拉丁或希伯來羅馬字。" },
            { title: "查看數值合計", body: "教學總和點亮。" },
            { title: "讀取數理傾向", body: "色帶出現。" },
            { title: "字母數值指引", body: "數理對照所問。" },
          ],
        }
      ),
      steps: ["intent", "nameInHebrew", "gematriaSum", "gematriaLean", "result"],
      viz: "gematria",
      castCta: { en: "Read the number lean", zh: "读取数理倾向", hant: "讀取數理傾向" },
      buildCast(state, rng) {
        const name = state.personName || "A";
        const total = letterSum(name) * 4 + (name.length % 7);
        const band = NUM_BANDS[total % NUM_BANDS.length];
        return { name, total, band, lean: loc(band.lean) };
      },
      generate(q, cast) {
        const b = loc({ en: cast.band.en, zh: cast.band.zh });
        return pack({
          title: `${cast.name} · ${cast.total} · ${b}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学字母数值以「${cast.name}」得合 ${cast.total}（${b}），倾向「${cast.lean}」。真算需希伯来正字法。`, `教學字母數值以「${cast.name}」得合 ${cast.total}（${b}），傾向「${cast.lean}」。真算需希伯來正字法。`)
            : `Teaching gematria for “${cast.name}” totals ${cast.total} (${b}), leaning “${cast.lean}”. Real work needs Hebrew orthography.`,
          interpret: interpretQ(q || cast.name, cast.lean, isZh() ? "希伯来字母数值" : "gematria"),
          details: [cast.name, String(cast.total), b],
          doList: [isZh() ? zhText(`围绕「${cast.lean}」写一句今日意图。`, `圍繞「${cast.lean}」寫一句今日意圖。`) : `Write one today-intention matching “${cast.lean}”.`],
          dontList: [isZh() ? zhText("不要因数理羞辱姓名或信仰。", "不要因數理羞辱姓名或信仰。") : "Do not shame names or faith over number totals."],
          tone: "deep",
          vizData: cast,
        });
      },
    },

    mazalot: {
      summary: {
        en: "Mazalot is the Hebrew zodiac with planetary hours in Jewish calendrical astrology for character themes.",
        zh: "希伯来黄道（Mazalot）结合行星时，论犹太历算占星中的性情主题。",
        hant: "希伯來黃道（Mazalot）結合行星時，論猶太曆算占星中的性情主題。",
      },
      how: howPack(
        {
          intro: "You’ll enter birth date, pick a mazal sign, then open a teaching board.",
          steps: [
            { title: "Meet Mazalot", body: "Hebrew signs · hours." },
            { title: "Enter birth date", body: "Chart seed." },
            { title: "Pick a mazal sign", body: "Teaching sign choice." },
            { title: "Open the mazalot board", body: "Sign lean appears." },
            { title: "Mazalot counsel", body: "Sign lean for your focus." },
          ],
        },
        {
          intro: "你将输入生辰、选择希伯来星座，再打开教学盘。",
          steps: [
            { title: "认识希伯来黄道", body: "希伯来星座 · 时。" },
            { title: "输入出生日期", body: "盘种。" },
            { title: "选择希伯来星座", body: "教学星座选择。" },
            { title: "打开黄道盘", body: "星座倾向出现。" },
            { title: "希伯来黄道指引", body: "星意对照焦点。" },
          ],
        },
        {
          intro: "你將輸入生辰、選擇希伯來星座，再打開教學盤。",
          steps: [
            { title: "認識希伯來黃道", body: "希伯來星座 · 時。" },
            { title: "輸入出生日期", body: "盤種。" },
            { title: "選擇希伯來星座", body: "教學星座選擇。" },
            { title: "打開黃道盤", body: "星座傾向出現。" },
            { title: "希伯來黃道指引", body: "星意對照焦點。" },
          ],
        }
      ),
      steps: ["intent", "birth", "mazalSign", "mazalotBoard", "result"],
      viz: "mazalot",
      castCta: { en: "Open the mazalot board", zh: "打开黄道盘", hant: "打開黃道盤" },
      buildCast(state, rng) {
        const sign = MAZAL.find((m) => m.en === state.mazalSign) || pick(rng, MAZAL);
        return { birth: state.birthDate || "", sign, lean: loc(sign.lean) };
      },
      generate(q, cast) {
        const s = loc({ en: cast.sign.en, zh: cast.sign.zh });
        return pack({
          title: `${cast.birth || "—"} · ${s}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学希伯来黄道以「${cast.birth || "—"}」见「${s}」，倾向「${cast.lean}」。真盘需犹太历换算。`, `教學希伯來黃道以「${cast.birth || "—"}」見「${s}」，傾向「${cast.lean}」。真盤需猶太曆換算。`)
            : `Teaching mazalot for “${cast.birth || "—"}” shows “${s}”, leaning “${cast.lean}”. Real charts need Jewish calendar math.`,
          interpret: interpretQ(q, cast.lean, isZh() ? "希伯来黄道" : "mazalot"),
          details: [cast.birth || "—", s],
          doList: [isZh() ? zhText(`按「${cast.lean}」安排本周一次行动。`, `按「${cast.lean}」安排本週一次行動。`) : `Schedule one weekly action matching “${cast.lean}”.`],
          dontList: [isZh() ? zhText("不要用星座标签羞辱他人。", "不要用星座標籤羞辱他人。") : "Do not shame others with sign labels."],
          tone: "mixed",
          vizData: cast,
        });
      },
    },

    "urim-thummim": {
      summary: {
        en: "Urim and Thummim were priestly lots for yes/no guidance in the Hebrew Bible — here as an educational lot sim.",
        zh: "乌陵与土明是希伯来圣经中祭司的是／否签——此处为教育性抽签模拟。",
        hant: "烏陵與土明是希伯來聖經中祭司的是／否籤——此處為教育性抽籤模擬。",
      },
      how: howPack(
        {
          intro: "You’ll hold a question, hold the teaching lots, then read the urim reply.",
          steps: [
            { title: "Meet Urim and Thummim", body: "Priestly lots · yes/no." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Hold the lots", body: "Teaching stones settle." },
            { title: "Read the reply", body: "Yes / no / unclear." },
            { title: "Lot counsel", body: "Reply lean for your question." },
          ],
        },
        {
          intro: "你将抱定问题、持定教学签石，再读乌陵答复。",
          steps: [
            { title: "认识乌陵土明", body: "祭司签 · 是／否。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "持定签石", body: "教学石安定。" },
            { title: "读取答复", body: "是／否／不明。" },
            { title: "签石指引", body: "答复对照问题。" },
          ],
        },
        {
          intro: "你將抱定問題、持定教學籤石，再讀烏陵答覆。",
          steps: [
            { title: "認識烏陵土明", body: "祭司籤 · 是／否。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "持定籤石", body: "教學石安定。" },
            { title: "讀取答覆", body: "是／否／不明。" },
            { title: "籤石指引", body: "答覆對照問題。" },
          ],
        }
      ),
      steps: ["intent", "question", "holdLots", "urimReply", "result"],
      viz: "urim",
      castCta: { en: "Read the reply", zh: "读取答复", hant: "讀取答覆" },
      buildCast(state, rng) {
        const reply = pick(rng, URIM);
        return { reply, lean: loc(reply.lean) };
      },
      generate(q, cast) {
        const r = loc({ en: cast.reply.en, zh: cast.reply.zh });
        return pack({
          title: r,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学乌陵土明示「${r}」，倾向「${cast.lean}」。真祭司签属历史／宗教语境。`, `教學烏陵土明示「${r}」，傾向「${cast.lean}」。真祭司籤屬歷史／宗教語境。`)
            : `Teaching Urim and Thummim shows “${r}”, leaning “${cast.lean}”. Real priestly lots belong to historical/religious context.`,
          interpret: interpretQ(q, cast.lean, isZh() ? "乌陵土明" : "Urim and Thummim"),
          details: [r],
          doList: [isZh() ? zhText(`若答复不明，先收集一件可验证的事实。`, `若答覆不明，先收集一件可驗證的事實。`) : `If the reply is unclear, gather one verifiable fact first.`],
          dontList: [isZh() ? zhText("不要伪造神谕权威强迫他人。", "不要偽造神諭權威強迫他人。") : "Do not fake oracular authority to coerce others."],
          tone: /否|no|hold|不明|unclear/i.test(r + cast.lean) ? "caution" : "bright",
          vizData: cast,
        });
      },
    },

    goralot: {
      summary: {
        en: "Goralot are Jewish lot books and diagrams used in folk practice — a page or diagram answers the seeker’s ask.",
        zh: "犹太签书（Goralot）是民俗实践中的签书与图示——翻开一页或一图作答。",
        hant: "猶太籤書（Goralot）是民俗實踐中的籤書與圖示——翻開一頁或一圖作答。",
      },
      how: howPack(
        {
          intro: "You’ll hold a question, spin a teaching goral diagram, then read the page lean.",
          steps: [
            { title: "Meet Goralot", body: "Lot books · diagrams." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Spin the goral", body: "Diagram settles." },
            { title: "Read the goral page", body: "Page lean appears." },
            { title: "Goral counsel", body: "Page lean for your question." },
          ],
        },
        {
          intro: "你将抱定问题、旋转教学签图，再读签页倾向。",
          steps: [
            { title: "认识犹太签书", body: "签书 · 图示。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "旋转签图", body: "图示安定。" },
            { title: "读取签页", body: "签页倾向出现。" },
            { title: "签书指引", body: "签意对照问题。" },
          ],
        },
        {
          intro: "你將抱定問題、旋轉教學籤圖，再讀籤頁傾向。",
          steps: [
            { title: "認識猶太籤書", body: "籤書 · 圖示。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "旋轉籤圖", body: "圖示安定。" },
            { title: "讀取籤頁", body: "籤頁傾向出現。" },
            { title: "籤書指引", body: "籤意對照問題。" },
          ],
        }
      ),
      steps: ["intent", "question", "spinGoral", "goralPage", "result"],
      viz: "goral",
      castCta: { en: "Read the goral page", zh: "读取签页", hant: "讀取籤頁" },
      buildCast(state, rng) {
        const page = pick(rng, GORAL);
        return { page, lean: loc(page.lean), n: 1 + Math.floor(rng() * 72) };
      },
      generate(q, cast) {
        const p = loc({ en: cast.page.en, zh: cast.page.zh });
        return pack({
          title: `${p} · №${cast.n}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学犹太签书得「${p}」（№${cast.n}），倾向「${cast.lean}」。真签书属民俗／宗教语境。`, `教學猶太籤書得「${p}」（№${cast.n}），傾向「${cast.lean}」。真籤書屬民俗／宗教語境。`)
            : `Teaching goralot yields “${p}” (№${cast.n}), leaning “${cast.lean}”. Real lot books belong to folk/religious context.`,
          interpret: interpretQ(q, cast.lean, isZh() ? "犹太签书" : "goralot"),
          details: [p, `№${cast.n}`],
          doList: [isZh() ? zhText(`把「${cast.lean}」变成今天一件可完成的小事。`, `把「${cast.lean}」變成今天一件可完成的小事。`) : `Turn “${cast.lean}” into one completable small act today.`],
          dontList: [isZh() ? zhText("不要用签书羞辱信仰差异。", "不要用籤書羞辱信仰差異。") : "Do not shame faith differences with lot books."],
          tone: "mixed",
          vizData: cast,
        });
      },
    },

    "coffee-tasseography": {
      summary: {
        en: "Turkish coffee reading interprets shapes in the grounds for love, travel, and fortune themes — folk counsel, not science.",
        zh: "土耳其咖啡占解读杯底渣形，论爱情、出行与运势主题——民俗指引，不是科学。",
        hant: "土耳其咖啡占解讀杯底渣形，論愛情、出行與運勢主題——民俗指引，不是科學。",
      },
      how: howPack(
        {
          intro: "You’ll hold a question, brew a teaching cup, then read the grounds lean.",
          steps: [
            { title: "Meet coffee reading", body: "Cup · grounds · shapes." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Brew the cup", body: "Grounds settle." },
            { title: "Read the grounds", body: "Shape lean appears." },
            { title: "Coffee counsel", body: "Shape lean for your question." },
          ],
        },
        {
          intro: "你将抱定问题、冲泡教学杯，再读渣形倾向。",
          steps: [
            { title: "认识咖啡占", body: "杯 · 渣 · 形。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "冲泡杯", body: "渣沉淀。" },
            { title: "读取渣形", body: "形兆倾向出现。" },
            { title: "咖啡占指引", body: "形意对照问题。" },
          ],
        },
        {
          intro: "你將抱定問題、沖泡教學杯，再讀渣形傾向。",
          steps: [
            { title: "認識咖啡占", body: "杯 · 渣 · 形。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "沖泡杯", body: "渣沉澱。" },
            { title: "讀取渣形", body: "形兆傾向出現。" },
            { title: "咖啡占指引", body: "形意對照問題。" },
          ],
        }
      ),
      steps: ["intent", "question", "brewCup", "groundsRead", "result"],
      viz: "coffee",
      castCta: { en: "Read the grounds", zh: "读取渣形", hant: "讀取渣形" },
      buildCast(state, rng) {
        const shape = pick(rng, COFFEE);
        return { shape, lean: loc(shape.lean) };
      },
      generate(q, cast) {
        const s = loc({ en: cast.shape.en, zh: cast.shape.zh });
        return pack({
          title: s,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学咖啡占见「${s}」，倾向「${cast.lean}」。民俗镜子，不是科学预测。`, `教學咖啡占見「${s}」，傾向「${cast.lean}」。民俗鏡子，不是科學預測。`)
            : `Teaching coffee reading shows “${s}”, leaning “${cast.lean}”. A folk mirror, not a scientific forecast.`,
          interpret: interpretQ(q, cast.lean, isZh() ? "咖啡渣形" : "coffee grounds"),
          details: [s],
          doList: [isZh() ? zhText(`按「${cast.lean}」安排一次温和会面或短途。`, `按「${cast.lean}」安排一次溫和會面或短途。`) : `Arrange one gentle meeting or short trip matching “${cast.lean}”.`],
          dontList: [isZh() ? zhText("不要用渣形恐吓他人感情。", "不要用渣形恐嚇他人感情。") : "Do not frighten others about relationships over grounds."],
          tone: "bright",
          vizData: cast,
        });
      },
    },

    "molybdomancy-tr": {
      summary: {
        en: "Kurşun dökme pours molten lead into water; the shape is read for protection and New Year counsel (educational sim — no real molten metal).",
        zh: "浇铅占（Kurşun dökme）将熔铅倒入水中，以形状论护佑与岁首指引（仅教育模拟——无真实熔铅）。",
        hant: "澆鉛占（Kurşun dökme）將熔鉛倒入水中，以形狀論護佑與歲首指引（僅教育模擬——無真實熔鉛）。",
      },
      how: howPack(
        {
          intro: "You’ll hold a question, pour teaching lead into water, then read the shape lean.",
          steps: [
            { title: "Meet Kurşun dökme", body: "Lead · water · shape." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Pour the lead", body: "Teaching pour only." },
            { title: "Read the lead shape", body: "Shape lean appears." },
            { title: "Lead counsel", body: "Shape lean for your question." },
          ],
        },
        {
          intro: "你将抱定问题、将教学铅倒入水中，再读铅形倾向。",
          steps: [
            { title: "认识浇铅占", body: "铅 · 水 · 形。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "浇下铅", body: "仅教学倾倒。" },
            { title: "读取铅形", body: "形兆倾向出现。" },
            { title: "浇铅指引", body: "形意对照问题。" },
          ],
        },
        {
          intro: "你將抱定問題、將教學鉛倒入水中，再讀鉛形傾向。",
          steps: [
            { title: "認識澆鉛占", body: "鉛 · 水 · 形。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "澆下鉛", body: "僅教學傾倒。" },
            { title: "讀取鉛形", body: "形兆傾向出現。" },
            { title: "澆鉛指引", body: "形意對照問題。" },
          ],
        }
      ),
      steps: ["intent", "question", "pourLead", "leadShape", "result"],
      viz: "lead",
      castCta: { en: "Read the lead shape", zh: "读取铅形", hant: "讀取鉛形" },
      buildCast(state, rng) {
        const shape = pick(rng, LEAD);
        return { shape, lean: loc(shape.lean) };
      },
      generate(q, cast) {
        const s = loc({ en: cast.shape.en, zh: cast.shape.zh });
        return pack({
          title: s,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学浇铅占见「${s}」，倾向「${cast.lean}」。无真实熔铅烫伤风险。`, `教學澆鉛占見「${s}」，傾向「${cast.lean}」。無真實熔鉛燙傷風險。`)
            : `Teaching kurşun dökme shows “${s}”, leaning “${cast.lean}”. No real molten metal — no burn risk here.`,
          interpret: interpretQ(q, cast.lean, isZh() ? "浇铅形" : "the lead shape"),
          details: [s],
          doList: [isZh() ? zhText(`按「${cast.lean}」做一件护界或收尾的小事。`, `按「${cast.lean}」做一件護界或收尾的小事。`) : `Do one boundary or closing small act matching “${cast.lean}”.`],
          dontList: [isZh() ? zhText("不要真实熔铅；易烫伤与中毒。", "不要真實熔鉛；易燙傷與中毒。") : "Do not actually melt lead — burn and toxicity risks."],
          tone: "caution",
          vizData: cast,
        });
      },
    },

    "mesopotamian-extispicy": {
      summary: {
        en: "Mesopotamian extispicy read entrails omens for kings and campaigns (~2500 BCE) — here as an educational symbolic sim only (no animals harmed).",
        zh: "美索不达米亚脏卜为王室与战役读内脏兆（约前2500年）——此处仅为教育象征模拟（无动物伤害）。",
        hant: "美索不達米亞臟卜為王室與戰役讀內臟兆（約前2500年）——此處僅為教育象徵模擬（無動物傷害）。",
      },
      how: howPack(
        {
          intro: "You’ll hold a question, inspect a teaching liver diagram, then read the omen lean.",
          steps: [
            { title: "Meet Extispicy", body: "Liver marks · royal omens." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Inspect the liver diagram", body: "Teaching marks only." },
            { title: "Read the liver omen", body: "Mark lean appears." },
            { title: "Extispicy counsel", body: "Omen lean for your question." },
          ],
        },
        {
          intro: "你将抱定问题、检视教学肝图，再读脏卜倾向。",
          steps: [
            { title: "认识脏卜", body: "肝纹 · 王室兆。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "检视肝图", body: "仅教学纹记。" },
            { title: "读取脏卜", body: "纹兆倾向出现。" },
            { title: "脏卜指引", body: "兆意对照问题。" },
          ],
        },
        {
          intro: "你將抱定問題、檢視教學肝圖，再讀臟卜傾向。",
          steps: [
            { title: "認識臟卜", body: "肝紋 · 王室兆。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "檢視肝圖", body: "僅教學紋記。" },
            { title: "讀取臟卜", body: "紋兆傾向出現。" },
            { title: "臟卜指引", body: "兆意對照問題。" },
          ],
        }
      ),
      steps: ["intent", "question", "inspectLiver", "liverOmen", "result"],
      viz: "liver",
      castCta: { en: "Read the liver omen", zh: "读取脏卜", hant: "讀取臟卜" },
      buildCast(state, rng) {
        const omen = pick(rng, LIVER);
        return { omen, lean: loc(omen.lean) };
      },
      generate(q, cast) {
        const o = loc({ en: cast.omen.en, zh: cast.omen.zh });
        return pack({
          title: o,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学脏卜示「${o}」，倾向「${cast.lean}」。无真实祭牲；历史认识论教育。`, `教學臟卜示「${o}」，傾向「${cast.lean}」。無真實祭牲；歷史認識論教育。`)
            : `Teaching extispicy shows “${o}”, leaning “${cast.lean}”. No animals harmed — historical epistemology education.`,
          interpret: interpretQ(q, cast.lean, isZh() ? "脏卜纹兆" : "the liver omen"),
          details: [o],
          doList: [isZh() ? zhText(`按「${cast.lean}」检视今天一个风险点。`, `按「${cast.lean}」檢視今天一個風險點。`) : `Inspect one risk point today matching “${cast.lean}”.`],
          dontList: [isZh() ? zhText("不要伤害动物做占卜。", "不要傷害動物做占卜。") : "Do not harm animals for divination."],
          tone: /裂|delay|risk|暗|watch/i.test(o + cast.lean) ? "caution" : "mixed",
          vizData: cast,
        });
      },
    },

    "mesopotamian-dream": {
      summary: {
        en: "Mesopotamian dream omen tablets classified dream symbols for counsel — you note a dream image and match a teaching tablet lean.",
        zh: "美索不达米亚梦书泥板将梦象分类作指引——你记录梦象并对照教学泥板倾向。",
        hant: "美索不達米亞夢書泥板將夢象分類作指引——你記錄夢象並對照教學泥板傾向。",
      },
      how: howPack(
        {
          intro: "You’ll note a dream image, match a teaching tablet, then read the dream omen lean.",
          steps: [
            { title: "Meet dream omen tablets", body: "Symbols · counsel." },
            { title: "Note a dream image", body: "What stood out?" },
            { title: "Match a tablet entry", body: "Teaching catalogue." },
            { title: "Read the dream omen", body: "Tablet lean appears." },
            { title: "Dream counsel", body: "Omen lean for your image." },
          ],
        },
        {
          intro: "你将记录梦象、对照教学泥板，再读梦兆倾向。",
          steps: [
            { title: "认识梦书泥板", body: "象征 · 指引。" },
            { title: "记录梦象", body: "什么最醒目？" },
            { title: "对照泥板条目", body: "教学目录。" },
            { title: "读取梦兆", body: "泥板倾向出现。" },
            { title: "梦兆指引", body: "兆意对照梦象。" },
          ],
        },
        {
          intro: "你將記錄夢象、對照教學泥板，再讀夢兆傾向。",
          steps: [
            { title: "認識夢書泥板", body: "象徵 · 指引。" },
            { title: "記錄夢象", body: "什麼最醒目？" },
            { title: "對照泥板條目", body: "教學目錄。" },
            { title: "讀取夢兆", body: "泥板傾向出現。" },
            { title: "夢兆指引", body: "兆意對照夢象。" },
          ],
        }
      ),
      steps: ["intent", "dreamNote", "tabletMatch", "dreamOmen", "result"],
      viz: "dream",
      castCta: { en: "Read the dream omen", zh: "读取梦兆", hant: "讀取夢兆" },
      buildCast(state, rng) {
        const note = state.dreamNote || (isZh() ? zhText("河水", "河水") : "a river");
        const omen = pick(rng, DREAMS);
        return { note, omen, lean: loc(omen.lean) };
      },
      generate(q, cast) {
        const o = loc({ en: cast.omen.en, zh: cast.omen.zh });
        return pack({
          title: `${cast.note} · ${o}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学梦书以「${cast.note}」对照「${o}」，倾向「${cast.lean}」。泥板是历史目录，不是临床解梦。`, `教學夢書以「${cast.note}」對照「${o}」，傾向「${cast.lean}」。泥板是歷史目錄，不是臨床解夢。`)
            : `Teaching dream tablets match “${cast.note}” to “${o}”, leaning “${cast.lean}”. Tablets are historical catalogues, not clinical dream therapy.`,
          interpret: interpretQ(q || cast.note, cast.lean, isZh() ? "梦书泥板" : "the dream tablet"),
          details: [cast.note, o],
          doList: [isZh() ? zhText(`按「${cast.lean}」处理今天一个卡住的决定。`, `按「${cast.lean}」處理今天一個卡住的決定。`) : `Handle one stuck decision today matching “${cast.lean}”.`],
          dontList: [isZh() ? zhText("不要用梦兆替代心理医疗。", "不要用夢兆替代心理醫療。") : "Do not replace mental-health care with dream omens."],
          tone: "deep",
          vizData: cast,
        });
      },
    },
  });

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
            "本站为教育性游玩——不能替代受训占星／经文／祭司、医疗、法律或安全判断。",
            "本站為教育性遊玩——不能替代受訓占星／經文／祭司、醫療、法律或安全判斷。"
          )
        : "Educational play on this site — not a substitute for trained astrology/scripture/priestly practice, medicine, law, or safety judgment.",
    };
  }
  function runCast(id, state) {
    const rite = RITES[id];
    if (!rite) return null;
    const rng = mulberry32(
      seedFrom(state.question || state.personName || state.birthDate || state.dayDate || state.dreamNote, state.nonce, id)
    );
    const cast = Object.assign({}, state.cast || {}, rite.buildCast(state, rng) || {});
    return rite.generate(state.question || state.focus || state.personName || state.dreamNote || "", cast, rng);
  }

  window.FatumNearEastOracles = { IDS, has, get, howFor, runCast, loc };
})();
