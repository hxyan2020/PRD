/**
 * African calendar / sky / letter oracles — unique steps & visuals.
 * Akan day names · Awdunigist · Falak · Egyptian dream · Decans · Zāʾirja
 */
(function () {
  "use strict";

  const IDS = [
    "akan-day",
    "awdunigist",
    "falak",
    "egyptian-dream",
    "egyptian-decan",
    "zairja",
  ];

  function isZh() {
    try {
      return String(window.FatumI18n?.getLocale?.() || "").startsWith("zh");
    } catch (_) {
      return false;
    }
  }

  function loc(obj) {
    if (!obj) return "";
    if (typeof obj === "string") return obj;
    if (isZh()) return obj.zh || obj.en || "";
    return obj.en || obj.zh || "";
  }

  function pick(rng, arr) {
    return arr[Math.floor(rng() * arr.length) % arr.length];
  }

  function pack(r) {
    const RM = window.FatumResultModel;
    const base = {
      kind: "africa",
      ...r,
      disclaimer: isZh()
        ? "教育性模拟——不能替代受训祭司／占星实践，也不能替代医疗、法律或安全判断。可能不准确；无法预测黑天鹅事件。"
        : "Educational simulation — not a substitute for trained priestly/astrological practice, medicine, law, or safety judgment. May be inaccurate; cannot predict black swan events.",
    };
    return RM ? RM.structuredReading(base) : base;
  }

  function interpretQ(q, lean, mechanic) {
    const RM = window.FatumResultModel;
    const body = isZh()
      ? `你问的是「${q || "未写明的事"}」。以${mechanic}给出的「${lean}」倾向为镜：先拆成你能动手的一小步，再用日常证据核对——不要把模拟征象当成外在命令。`
      : `You asked about “${q || "an unnamed matter"}”. Hold the “${lean}” lean from ${mechanic} as a mirror: name one reversible next step you control, then check it against ordinary evidence — do not treat a simulated sign as an external order.`;
    return RM ? RM.interpretWithQuestion(q, body) : body;
  }

  const AKAN = [
    {
      day: 0,
      en: "Kwasiada / Akosua",
      zh: "奎西亚达／阿科苏阿",
      soul: { en: "Sunday soul — warmth, prestige, visibility", zh: "日曜魂——温暖、声望、可见" },
    },
    {
      day: 1,
      en: "Kwadwo / Adwoa",
      zh: "夸乔／阿乔瓦",
      soul: { en: "Monday soul — calm, peace, quiet strength", zh: "月曜魂——沉静、和平、静力" },
    },
    {
      day: 2,
      en: "Kwabena / Abena",
      zh: "夸贝纳／阿贝纳",
      soul: { en: "Tuesday soul — fire, drive, sharp edges", zh: "火曜魂——火气、冲劲、锋芒" },
    },
    {
      day: 3,
      en: "Kwaku / Akua",
      zh: "夸库／阿库阿",
      soul: { en: "Wednesday soul — talk, craft, bridge-building", zh: "水曜魂——言语、手艺、搭桥" },
    },
    {
      day: 4,
      en: "Yaw / Yaa",
      zh: "尧／雅阿",
      soul: { en: "Thursday soul — earth, endurance, duty", zh: "木曜魂——土地、耐力、责任" },
    },
    {
      day: 5,
      en: "Kofi / Afua",
      zh: "科菲／阿福阿",
      soul: { en: "Friday soul — fertility, wander, curiosity", zh: "金曜魂——丰饶、游走、好奇" },
    },
    {
      day: 6,
      en: "Kwame / Ama",
      zh: "夸梅／阿玛",
      soul: { en: "Saturday soul — old soul, gravity, memory", zh: "土曜魂——老成、分量、记忆" },
    },
  ];

  const DECANS = [
    { en: "Kenmut", zh: "肯穆特", theme: { en: "dark water · beginnings", zh: "暗水·开端" } },
    { en: "Khery-bakhu", zh: "赫里-巴胡", theme: { en: "horizon · watchfulness", zh: "地平·警觉" } },
    { en: "Hat-djat", zh: "哈特-贾特", theme: { en: "measure · craft", zh: "度量·技艺" } },
    { en: "Pehuy", zh: "佩胡伊", theme: { en: "endings · release", zh: "终结·释放" } },
    { en: "Tepy-a-khentet", zh: "特皮-阿-亨特特", theme: { en: "guidance · path", zh: "指引·道路" } },
    { en: "Seshmu", zh: "塞什穆", theme: { en: "wine · celebration risk", zh: "酒·欢庆之险" } },
  ];

  const DREAM_OMENS = [
    { en: "Crossing water", zh: "渡水", lean: { en: "transition · cleanse", zh: "过渡·涤净" } },
    { en: "Broken vessel", zh: "破器", lean: { en: "leak · repair first", zh: "渗漏·先修补" } },
    { en: "Rising sun in temple", zh: "庙中日出", lean: { en: "clarity · reveal", zh: "清明·揭示" } },
    { en: "Serpent at the threshold", zh: "门槛之蛇", lean: { en: "guard · ask leave", zh: "守护·先求许可" } },
    { en: "Feast with strangers", zh: "与陌生人共宴", lean: { en: "alliance · discern", zh: "结盟·明辨" } },
    { en: "Empty granary", zh: "空粮仓", lean: { en: "provision · stock", zh: "储备·补足" } },
  ];

  const FALAK_HOUSES = [
    { en: "House of travel", zh: "行旅宫", lean: { en: "motion · relocation lean", zh: "动·迁徙倾向" } },
    { en: "House of kin", zh: "亲属宫", lean: { en: "family · obligation", zh: "家人·义务" } },
    { en: "House of trade", zh: "商贸宫", lean: { en: "exchange · timing", zh: "交换·时机" } },
    { en: "House of illness", zh: "疾病宫", lean: { en: "body · rest", zh: "身体·休息" } },
    { en: "House of honor", zh: "名望宫", lean: { en: "reputation · witness", zh: "名声·见证" } },
    { en: "House of secrets", zh: "隐秘宫", lean: { en: "conceal · wait", zh: "隐·等待" } },
  ];

  const RITES = {
    "akan-day": {
      summary: {
        en: "Among Akan peoples, the weekday of birth yields a kra (soul) day-name — Kwadwo, Kwaku, Ama, and others — linked to character teachings.",
        zh: "在阿坎人中，出生的星期几对应灵魂日名（kra）——如夸乔、夸库、阿玛等——并连结性情教导。",
      },
      how: {
        en: {
          intro: "Akan day-names map weekday of birth to a soul name and character counsel. Educational only.",
          steps: [
            { title: "Meet the day-name tradition", body: "Soul names mark the weekday you entered the world." },
            { title: "Pick your birth weekday", body: "Sunday through Saturday — each has male/female day-names." },
            { title: "Ask what it mirrors", body: "Where does this temperament show up in your question?" },
            { title: "Reveal the kra name", body: "We reveal the teaching name pair for that day." },
            { title: "Read the soul counsel", body: "Character lean + reflective do/don’t for your focus." },
          ],
        },
        zh: {
          intro: "阿坎日名把出生星期映射到灵魂名与性情教导。仅供教育。",
          steps: [
            { title: "认识日名传统", body: "灵魂名标记你进入世界的那一天。" },
            { title: "选择出生星期", body: "周日到周六——各有男女日名。" },
            { title: "问它映照什么", body: "这性情在你的问题里显在何处？" },
            { title: "揭示 kra 名", body: "揭示该日的教学用名对。" },
            { title: "读灵魂指引", body: "性情倾向＋对照焦点的可做／慎做。" },
          ],
        },
      },
      steps: ["intent", "weekday", "question", "cast", "result"],
      viz: "weekday7",
      castCta: { en: "Reveal the day-name", zh: "揭示日名" },
      buildCast(state, rng) {
        const day = typeof state.weekday === "number" ? state.weekday : Math.floor(rng() * 7);
        const row = AKAN[day] || AKAN[0];
        return { day, name: row, soul: row.soul };
      },
      generate(q, cast) {
        const row = cast.name || AKAN[0];
        const name = loc({ en: row.en, zh: row.zh });
        const soul = loc(row.soul);
        return pack({
          title: name,
          result: isZh() ? `阿坎日名：${name}` : `Akan day-name: ${name}`,
          explain: isZh()
            ? `出生星期对应「${name}」。教导主题：${soul}。这是文化姓名／性情教学，不是命运判决。`
            : `Birth weekday maps to “${name}”. Teaching theme: ${soul}. Cultural name/temperament teaching — not a fate verdict.`,
          interpret: interpretQ(q, soul, isZh() ? "阿坎日名" : "the Akan day-name"),
          details: [
            isZh() ? `星期索引：${cast.day}` : `Weekday index: ${cast.day}`,
            soul,
          ],
          doList: [
            isZh()
              ? `写出「${soul}」在本周一件真实行为上的具体体现。`
              : `Name one real behavior this week that matches “${soul}”.`,
          ],
          dontList: [
            isZh() ? "不要用日名标签贬低自己或他人。" : "Do not use the day-name to demean yourself or others.",
          ],
          tone: "bright",
          vizData: cast,
        });
      },
    },

    awdunigist: {
      summary: {
        en: "Ethiopian awdunigist practices astrological numerology by counting stars — number patterns counsel timing and character.",
        zh: "埃塞俄比亚阿夫杜尼吉斯特以数星作占星术数——数字格局指引时机与性情。",
      },
      how: {
        en: {
          intro: "Awdunigist counts stars as living numbers. You’ll open a night sky and tally a teaching count.",
          steps: [
            { title: "Meet star counting", body: "Numbers drawn from the night sky become counsel." },
            { title: "Name what you seek timing for", body: "Travel, work, kin — keep one focus." },
            { title: "Open the night field", body: "Stars appear on the dark board." },
            { title: "Count the bright ones", body: "Tap to tally; the count reduces to a teaching figure." },
            { title: "Read the number counsel", body: "Figure + how it mirrors your timing ask." },
          ],
        },
        zh: {
          intro: "阿夫杜尼吉斯特把星当作活的数字。你将打开夜空并点数教学用计数。",
          steps: [
            { title: "认识数星", body: "从夜空抽取的数字成为指引。" },
            { title: "说出你要择时的事", body: "出行、工作、亲属——只留一个焦点。" },
            { title: "打开夜空", body: "暗盘上出现星点。" },
            { title: "数明亮的星", body: "点按计数；数字化为教学图形。" },
            { title: "读数字指引", body: "图形＋如何对照你的择时之问。" },
          ],
        },
      },
      steps: ["intent", "question", "sky", "count", "result"],
      viz: "starcounter",
      castCta: { en: "Count the stars", zh: "数星" },
      buildCast(state, rng) {
        const n = 7 + Math.floor(rng() * 29);
        const figure = (n % 9) + 1;
        const stars = Array.from({ length: Math.min(n, 36) }, () => ({
          x: Math.round(rng() * 100),
          y: Math.round(rng() * 100),
          bright: rng() > 0.35,
        }));
        return { count: n, figure, stars };
      },
      generate(q, cast) {
        const fig = cast.figure || 1;
        const leans = isZh()
          ? ["开启", "配对", "表达", "筑基", "变动", "调和", "省察", "丰盛", "完成"]
          : ["open", "pair", "speak", "build", "shift", "harmonize", "review", "plenty", "complete"];
        const lean = leans[(fig - 1) % leans.length];
        return pack({
          title: isZh() ? `星数 ${cast.count} → 图 ${fig}` : `Star count ${cast.count} → figure ${fig}`,
          result: isZh() ? `教学星数：${cast.count}（化约 ${fig}）` : `Teaching count: ${cast.count} (reduced ${fig})`,
          explain: isZh()
            ? `夜空点数得 ${cast.count}，化约为 ${fig}，倾向「${lean}」。阿夫杜尼吉斯特的数星是术数传统；此处为教育模拟。`
            : `Night tally ${cast.count} reduces to ${fig}, leaning “${lean}”. Awdunigist star-counting is a numerological tradition; this is educational simulation.`,
          interpret: interpretQ(q, lean, isZh() ? "数星化约" : "the star-count figure"),
          details: [
            isZh() ? `点数：${cast.count}` : `Count: ${cast.count}`,
            isZh() ? `化约：${fig}` : `Reduced: ${fig}`,
          ],
          doList: [
            isZh()
              ? `把「${lean}」写成一个可在七日内完成的择时动作。`
              : `Turn “${lean}” into one timing action you can finish within seven days.`,
          ],
          dontList: [
            isZh() ? "不要用星数替代医疗或安全判断。" : "Do not replace medical or safety judgment with a star count.",
          ],
          tone: fig >= 7 ? "bright" : fig <= 3 ? "caution" : "mixed",
          vizData: cast,
        });
      },
    },

    falak: {
      summary: {
        en: "Swahili falak continues Arabic ʿilm al-falak — astrological-numerological charts linking letters, houses, and timing on the coast.",
        zh: "斯瓦希里法拉克承续阿拉伯星学（ʿilm al-falak）——以字母、宫位与时机相连的占星术数盘，通行于海岸地带。",
      },
      how: {
        en: {
          intro: "Falak builds a coastal chart from birth letters and houses. You’ll set a birth mark, then open a house.",
          steps: [
            { title: "Meet Swahili falak", body: "Letter-math and sky houses counsel timing." },
            { title: "Enter a birth mark", body: "Date stands in for the chart radix (teaching)." },
            { title: "Derive letter keys", body: "Name initials become numerical keys on the board." },
            { title: "Open a falak house", body: "One house lights — travel, kin, trade…" },
            { title: "Read the coastal counsel", body: "House lean mirrored to your question." },
          ],
        },
        zh: {
          intro: "法拉克由出生标记与宫位构成海岸盘。你将设定出生标记，再打开一宫。",
          steps: [
            { title: "认识斯瓦希里法拉克", body: "字母术数与天空宫位指引时机。" },
            { title: "输入出生标记", body: "日期代替盘的本命点（教学）。" },
            { title: "推出字母键", body: "姓名首字母成为盘上数值键。" },
            { title: "打开法拉克宫", body: "一宫点亮——行旅、亲属、商贸…" },
            { title: "读海岸指引", body: "宫位倾向对照你的问题。" },
          ],
        },
      },
      steps: ["intent", "birth", "letters", "chart", "result"],
      viz: "falak-chart",
      castCta: { en: "Open the falak house", zh: "打开法拉克宫" },
      buildCast(state, rng) {
        const house = pick(rng, FALAK_HOUSES);
        const keys = (state.letters || "FLK")
          .toUpperCase()
          .replace(/[^A-Z]/g, "")
          .slice(0, 3)
          .padEnd(3, "X")
          .split("");
        const nums = keys.map((ch) => ((ch.charCodeAt(0) - 64 + Math.floor(rng() * 3)) % 9) + 1);
        return {
          birth: state.birthDate || "",
          keys,
          nums,
          house,
        };
      },
      generate(q, cast) {
        const house = cast.house || FALAK_HOUSES[0];
        const title = loc({ en: house.en, zh: house.zh });
        const lean = loc(house.lean);
        return pack({
          title,
          result: isZh()
            ? `法拉克宫：${title}（键 ${((cast.keys || []).join("") || "—")}）`
            : `Falak house: ${title} (keys ${(cast.keys || []).join("") || "—"})`,
          explain: isZh()
            ? `字母键 ${(cast.keys || []).join("·")} → 数 ${(cast.nums || []).join(",")}，落在「${title}」，倾向「${lean}」。海岸法拉克是文本／术数传统；此处为教学盘。`
            : `Letter keys ${(cast.keys || []).join("·")} → nums ${(cast.nums || []).join(",")}, land in “${title}”, leaning “${lean}”. Coastal falak is a textual/numerological tradition; teaching chart only.`,
          interpret: interpretQ(q || cast.birth || "", lean, isZh() ? "法拉克宫位" : "the falak house"),
          details: [
            isZh() ? `出生标记：${cast.birth || "—"}` : `Birth mark: ${cast.birth || "—"}`,
            isZh() ? `键：${(cast.keys || []).join("")}` : `Keys: ${(cast.keys || []).join("")}`,
            title,
          ],
          doList: [
            isZh()
              ? `按「${lean}」安排本周一个与该宫相关的真实动作。`
              : `Schedule one real action this week that matches “${lean}” for that house.`,
          ],
          dontList: [
            isZh() ? "不要用教学盘替代专业占星或医疗意见。" : "Do not replace professional astrology or medicine with the teaching chart.",
          ],
          tone: /secret|隐|illness|疾/.test(title) ? "caution" : "mixed",
          vizData: cast,
        });
      },
    },

    "egyptian-dream": {
      summary: {
        en: "Ancient Egyptian dream books and temple incubation read gods’ messages in sleep — symbols catalogued for health and fate counsel.",
        zh: "古埃及解梦书与神庙孵梦，在睡眠中读取神谕——符号被编目，用于健康与命运指引。",
      },
      how: {
        en: {
          intro: "Incubation asks a clear question, then sleeps on it. You’ll prepare a temple couch and draw a dream-book omen.",
          steps: [
            { title: "Enter the dream-book", body: "Temple sleep manuals listed omen symbols." },
            { title: "Incubate the question", body: "Write what you would ask before sleep." },
            { title: "Lie on the temple couch", body: "Symbolic rest — candles and quiet on screen." },
            { title: "Draw a dream omen", body: "A catalogued symbol appears from the teaching book." },
            { title: "Interpret the omen", body: "Symbol lean mirrored to your incubated ask." },
          ],
        },
        zh: {
          intro: "孵梦先问清楚，再枕问而眠。你将准备神庙卧榻并抽取解梦书兆象。",
          steps: [
            { title: "进入解梦书", body: "神庙睡眠手册罗列兆象符号。" },
            { title: "孵化问题", body: "写下睡前要问的事。" },
            { title: "躺上神庙卧榻", body: "象征性安息——屏幕上的烛与静。" },
            { title: "抽取梦兆", body: "教学书中出现一个编目符号。" },
            { title: "解读兆象", body: "符号倾向对照你孵化的问题。" },
          ],
        },
      },
      steps: ["intent", "question", "incubate", "dream", "result"],
      viz: "dream-incubation",
      castCta: { en: "Draw a dream omen", zh: "抽取梦兆" },
      buildCast(state, rng) {
        const omen = pick(rng, DREAM_OMENS);
        return { omen };
      },
      generate(q, cast) {
        const omen = cast.omen || DREAM_OMENS[0];
        const title = loc({ en: omen.en, zh: omen.zh });
        const lean = loc(omen.lean);
        return pack({
          title,
          result: isZh() ? `梦书兆象：${title}` : `Dream-book omen: ${title}`,
          explain: isZh()
            ? `教学梦书抽出「${title}」，读作「${lean}」。古埃及孵梦在神庙进行；此处为符号教育，不是处方。`
            : `Teaching dream-book draws “${title}”, read as “${lean}”. Egyptian incubation happened in temples; this is symbol education — not a prescription.`,
          interpret: interpretQ(q, lean, isZh() ? "梦书兆象" : "the dream-book omen"),
          details: [title, lean],
          doList: [
            isZh()
              ? `醒来后只记录一个与「${lean}」有关的可观察事实，再决定行动。`
              : `On waking, note one observable fact related to “${lean}” before acting.`,
          ],
          dontList: [
            isZh() ? "不要用梦兆替代医疗诊断。" : "Do not replace medical diagnosis with a dream omen.",
          ],
          tone: /broken|破|empty|空|serpent|蛇/.test(title) ? "caution" : "deep",
          vizData: cast,
        });
      },
    },

    "egyptian-decan": {
      summary: {
        en: "Thirty-six Egyptian decans — star groups rising every ten days — framed destiny, hours of the night, and protective names.",
        zh: "三十六埃及旬星（德坎）——约每十日升起的星群——框定命运、夜时与守护之名。",
      },
      how: {
        en: {
          intro: "Decans divide the sky into thirty-six ten-day watches. You’ll set a birth mark and spin the decan wheel.",
          steps: [
            { title: "Meet the thirty-six", body: "Decans rise in sequence through the year." },
            { title: "Set the birth mark", body: "A date chooses a teaching sector of the wheel." },
            { title: "Spin the decan wheel", body: "Watch sectors pass until one locks." },
            { title: "Name the rising decan", body: "A teaching decan name and theme appear." },
            { title: "Read the watch counsel", body: "Theme mirrored to your question." },
          ],
        },
        zh: {
          intro: "德坎把天空分为三十六旬。你将设定出生标记并旋转旬星轮。",
          steps: [
            { title: "认识三十六旬星", body: "德坎按序在一年中升起。" },
            { title: "设定出生标记", body: "日期选定教学轮盘上的一区。" },
            { title: "旋转旬星轮", body: "看扇区转过直至锁定。" },
            { title: "点名升起的德坎", body: "出现教学用德坎名与主题。" },
            { title: "读守夜指引", body: "主题对照你的问题。" },
          ],
        },
      },
      steps: ["intent", "birth", "wheel", "rising", "result"],
      viz: "decan-wheel",
      castCta: { en: "Lock the rising decan", zh: "锁定升起的德坎" },
      buildCast(state, rng) {
        const decan = pick(rng, DECANS);
        let idx = 0;
        if (state.birthDate) {
          const d = new Date(state.birthDate + "T12:00:00");
          if (!Number.isNaN(d.getTime())) {
            const doy = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
            idx = Math.floor(((doy - 1) % 360) / 10) % DECANS.length;
          }
        } else {
          idx = Math.floor(rng() * DECANS.length);
        }
        return { decan: DECANS[idx] || decan, idx, birth: state.birthDate || "" };
      },
      generate(q, cast) {
        const decan = cast.decan || DECANS[0];
        const title = loc({ en: decan.en, zh: decan.zh });
        const theme = loc(decan.theme);
        return pack({
          title,
          result: isZh() ? `升起德坎：${title}` : `Rising decan: ${title}`,
          explain: isZh()
            ? `教学旬星轮锁定「${title}」（${theme}）。埃及德坎关乎夜时与守护名；此处简化为教育轮盘。`
            : `Teaching wheel locks “${title}” (${theme}). Egyptian decans concern night hours and protective names; simplified teaching wheel here.`,
          interpret: interpretQ(q || cast.birth || "", theme, isZh() ? "德坎主题" : "the decan theme"),
          details: [
            isZh() ? `出生标记：${cast.birth || "—"}` : `Birth mark: ${cast.birth || "—"}`,
            isZh() ? `旬序：${(cast.idx ?? 0) + 1}` : `Decan index: ${(cast.idx ?? 0) + 1}`,
            theme,
          ],
          doList: [
            isZh()
              ? `用「${theme}」为一周日程选一个关键词并执行一次。`
              : `Pick one weekly action keyword from “${theme}” and do it once.`,
          ],
          dontList: [
            isZh() ? "不要把教学德坎当成精确天文学预报。" : "Do not treat the teaching decan as precise astronomical forecasting.",
          ],
          tone: /endings|终结|risk|险/.test(theme) ? "caution" : "deep",
          vizData: cast,
        });
      },
    },

    zairja: {
      summary: {
        en: "Zāʾirja is a Maghrebi letter-device oracle described by Ibn Khaldūn — concentric dials combine letters into oracular phrases.",
        zh: "扎伊尔贾是伊本·赫勒敦记述的马格里布字母装置神谕——同心转盘组合字母成神谕短句。",
      },
      how: {
        en: {
          intro: "Zāʾirja spins letter rings to answer a posed question. You’ll set the question, then turn the dials.",
          steps: [
            { title: "Meet the letter device", body: "Concentric rings encode letter combinations." },
            { title: "Pose the question clearly", body: "Ibn Khaldūn stressed a well-formed ask." },
            { title: "Set the outer dial", body: "Choose a seed letter ring position." },
            { title: "Spin the zāʾirja", body: "Rings animate; a letter strand appears." },
            { title: "Read the letter counsel", body: "Strand becomes a plain teaching phrase for your ask." },
          ],
        },
        zh: {
          intro: "扎伊尔贾转动字母环回答所问。你将提出问题，再转盘。",
          steps: [
            { title: "认识字母装置", body: "同心环编码字母组合。" },
            { title: "清楚地提出问题", body: "伊本·赫勒敦强调问法要成形。" },
            { title: "设定外环", body: "选择种子字母环位置。" },
            { title: "转动扎伊尔贾", body: "环面动画；出现一串字母。" },
            { title: "读字母指引", body: "字母串化为对照问题的白话教学句。" },
          ],
        },
      },
      steps: ["intent", "question", "dial", "spin", "result"],
      viz: "zairja-dial",
      castCta: { en: "Spin the zāʾirja", zh: "转动扎伊尔贾" },
      buildCast(state, rng) {
        const alphabet = "ABJDHWZHTYKLMNSFSRQTTHKHDHGH";
        const seed = state.dialLetter || alphabet[Math.floor(rng() * alphabet.length)];
        const strand = Array.from({ length: 5 }, () => alphabet[Math.floor(rng() * alphabet.length)]).join("");
        const phrases = isZh()
          ? [
              "先问边界，再谈前进",
              "把名字说清楚再签约",
              "今日宜整理，不宜开战",
              "找一位中间人核对",
              "静三日后再答",
            ]
          : [
              "Name the boundary before the advance",
              "Say the names clearly before you sign",
              "Today favors sorting, not starting wars",
              "Find a go-between to verify",
              "Wait three quiet days, then answer",
            ];
        return { seed, strand, phrase: pick(rng, phrases) };
      },
      generate(q, cast) {
        const phrase = cast.phrase || (isZh() ? "先核对，再行动" : "Verify, then move");
        return pack({
          title: phrase,
          result: isZh()
            ? `字母串 ${cast.strand || "—"}（种子 ${cast.seed || "—"}）`
            : `Letter strand ${cast.strand || "—"} (seed ${cast.seed || "—"})`,
          explain: isZh()
            ? `扎伊尔贾教学转盘由种子「${cast.seed}」纺出「${cast.strand}」，白话化为「${phrase}」。历史装置复杂；此处给反思短句，不是魔法命令。`
            : `Teaching zāʾirja from seed “${cast.seed}” spins “${cast.strand}”, plain-spoken as “${phrase}”. Historical devices were complex; this yields a reflective phrase — not a magical command.`,
          interpret: interpretQ(q, phrase, isZh() ? "扎伊尔贾字母串" : "the zāʾirja strand"),
          details: [
            isZh() ? `种子字母：${cast.seed}` : `Seed letter: ${cast.seed}`,
            isZh() ? `字母串：${cast.strand}` : `Strand: ${cast.strand}`,
          ],
          doList: [
            isZh()
              ? `把「${phrase}」改写成一个可验证的下一步。`
              : `Rewrite “${phrase}” as one testable next step.`,
          ],
          dontList: [
            isZh() ? "不要把字母盘当成必须服从的神谕命令。" : "Do not treat the letter dial as an order you must obey.",
          ],
          tone: "mixed",
          vizData: cast,
        });
      },
    },
  };

  function install() {
    const A = window.FatumAfricaOracles;
    if (!A || typeof A.register !== "function") {
      console.warn("[africa-sky] FatumAfricaOracles.register missing — load africa-oracles.js first");
      return;
    }
    A.register(IDS, RITES);
  }

  if (window.FatumAfricaOracles) install();
  else document.addEventListener("DOMContentLoaded", install);

  window.FatumAfricaSkyOracles = { IDS, RITES, install };
})();
