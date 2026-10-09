/**
 * Chinese destiny / calendar oracles — unique steps, visuals, readings.
 * Bazi · Zi Wei · Zodiac · Ben Ming Nian · Tongshu · Tie Ban · Qizheng · Chenggu
 */
(function () {
  "use strict";

  const IDS = [
    "bazi",
    "ziwei",
    "chinese-zodiac",
    "benmingnian",
    "tongshu",
    "tieban",
    "qizheng",
    "chenggu",
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
      kind: "china",
      ...r,
      disclaimer: isZh()
        ? isHant()
          ? "教育性模擬——不能替代受訓命理師實踐，也不能替代醫療、法律或安全判斷。可能不準確；無法預測黑天鵝事件。"
          : "教育性模拟——不能替代受训命理师实践，也不能替代医疗、法律或安全判断。可能不准确；无法预测黑天鹅事件。"
        : "Educational simulation — not a substitute for trained destiny practice, medicine, law, or safety judgment. May be inaccurate; cannot predict black swan events.",
    };
    return RM ? RM.structuredReading(base) : base;
  }

  function interpretQ(q, lean, mechanic) {
    const RM = window.FatumResultModel;
    const body = isZh()
      ? isHant()
        ? `你問的是「${q || "未寫明的事"}」。以${mechanic}給出的「${lean}」傾向為鏡：先拆成你能動手的一小步，再用日常證據核對——不要把模擬命盤當成外在命令。`
        : `你问的是「${q || "未写明的事"}」。以${mechanic}给出的「${lean}」倾向为镜：先拆成你能动手的一小步，再用日常证据核对——不要把模拟命盘当成外在命令。`
      : `You asked about “${q || "an unnamed matter"}”. Hold the “${lean}” lean from ${mechanic} as a mirror: name one reversible next step you control, then check it against ordinary evidence — do not treat a simulated chart as an external order.`;
    return RM ? RM.interpretWithQuestion(q, body) : body;
  }

  const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  const ANIMALS = [
    { en: "Rat", zh: "鼠", elem: { en: "Water", zh: "水" } },
    { en: "Ox", zh: "牛", elem: { en: "Earth", zh: "土" } },
    { en: "Tiger", zh: "虎", elem: { en: "Wood", zh: "木" } },
    { en: "Rabbit", zh: "兔", elem: { en: "Wood", zh: "木" } },
    { en: "Dragon", zh: "龙", elem: { en: "Earth", zh: "土" } },
    { en: "Snake", zh: "蛇", elem: { en: "Fire", zh: "火" } },
    { en: "Horse", zh: "马", elem: { en: "Fire", zh: "火" } },
    { en: "Goat", zh: "羊", elem: { en: "Earth", zh: "土" } },
    { en: "Monkey", zh: "猴", elem: { en: "Metal", zh: "金" } },
    { en: "Rooster", zh: "鸡", elem: { en: "Metal", zh: "金" } },
    { en: "Dog", zh: "狗", elem: { en: "Earth", zh: "土" } },
    { en: "Pig", zh: "猪", elem: { en: "Water", zh: "水" } },
  ];
  const PALACES = [
    { en: "Life", zh: "命宫" },
    { en: "Wealth", zh: "财帛" },
    { en: "Career", zh: "官禄" },
    { en: "Travel", zh: "迁移" },
    { en: "Friends", zh: "交友" },
    { en: "Health", zh: "疾厄" },
  ];
  const STARS = [
    { en: "Zi Wei", zh: "紫微" },
    { en: "Tian Ji", zh: "天机" },
    { en: "Tai Yang", zh: "太阳" },
    { en: "Wu Qu", zh: "武曲" },
    { en: "Tian Tong", zh: "天同" },
    { en: "Lian Zhen", zh: "廉贞" },
  ];
  const ACTIVITIES = [
    { id: "travel", en: "Travel", zh: "出行" },
    { id: "marriage", en: "Marriage / contract", zh: "婚嫁／签约" },
    { id: "open", en: "Open business", zh: "开市" },
    { id: "move", en: "Moving house", zh: "移徙" },
    { id: "bury", en: "Burial / ancestor", zh: "安葬／祭祀" },
  ];
  const ALMANAC = [
    { en: "宜 · suitable", zh: "宜", tone: "bright" },
    { en: "忌 · avoid", zh: "忌", tone: "caution" },
    { en: "平 · neutral", zh: "平", tone: "mixed" },
  ];
  const BONE_POEMS = [
    {
      w: "2两1钱",
      en: "Light bone — early struggle, late ease",
      zh: "骨轻——先难后易",
    },
    {
      w: "3两2钱",
      en: "Steady bone — craft and kin sustain you",
      zh: "骨稳——技艺与亲缘托住你",
    },
    {
      w: "4两",
      en: "Heavy bone — responsibility comes early",
      zh: "骨重——责任来得早",
    },
    {
      w: "5两1钱",
      en: "Rare weight — reputation travels far",
      zh: "骨奇——名声走得远",
    },
  ];

  function pillarFromDate(dateStr, rng) {
    let h = seedFrom(dateStr, 0, "pillar");
    const r = mulberry32(h || Math.floor(rng() * 1e9));
    return {
      stem: STEMS[Math.floor(r() * 10)],
      branch: BRANCHES[Math.floor(r() * 12)],
    };
  }

  function animalForYear(y) {
    // 1984 = Rat (index 0)
    const idx = ((y - 1984) % 12 + 12) % 12;
    return { ...ANIMALS[idx], idx, year: y };
  }

  const RITES = {
    bazi: {
      summary: {
        en: "Four Pillars (year, month, day, hour) of Heavenly Stems and Earthly Branches are read against the Daymaster’s element balance.",
        zh: "年月日时四柱天干地支，围绕日主五行旺衰来论命。",
      },
      how: {
        en: {
          intro: "Bazi builds four pillars from birth datetime. This is a teaching chart — not a full master reading.",
          steps: [
            { title: "Meet the four pillars", body: "Year · month · day · hour stems and branches." },
            { title: "Enter birth date", body: "The day pillar anchors the Daymaster." },
            { title: "Choose birth hour", body: "Twelve double-hours (shíchen) complete the hour pillar." },
            { title: "Reveal the pillars", body: "Four teaching pillars and a Daymaster lean appear." },
            { title: "Read for your question", body: "Element lean mirrored to what you asked." },
          ],
        },
        zh: {
          intro: "八字由出生日期时辰排出四柱。此为教学盘——不是完整师传批命。",
          steps: [
            { title: "认识四柱", body: "年 · 月 · 日 · 时的干支。" },
            { title: "输入出生日期", body: "日柱锚定日主。" },
            { title: "选择时辰", body: "十二时辰补全时柱。" },
            { title: "揭示四柱", body: "出现教学四柱与日主倾向。" },
            { title: "对照你的问题", body: "五行倾向映照所问。" },
          ],
        },
      },
      steps: ["intent", "birth", "hour", "pillars", "result"],
      viz: "bazi-pillars",
      castCta: { en: "Reveal the four pillars", zh: "揭示四柱" },
      buildCast(state, rng) {
        const birth = state.birthDate || "1990-01-01";
        const hour = typeof state.hourIndex === "number" ? state.hourIndex : Math.floor(rng() * 12);
        const y = pillarFromDate(birth + "-Y", rng);
        const m = pillarFromDate(birth + "-M", rng);
        const d = pillarFromDate(birth + "-D", rng);
        const h = { stem: STEMS[(hour + d.stem.charCodeAt(0)) % 10], branch: BRANCHES[hour % 12] };
        const elements = isZh()
          ? ["木旺", "火通", "土稳", "金锐", "水活"]
          : ["Wood strong", "Fire open", "Earth steady", "Metal sharp", "Water flowing"];
        return {
          birth,
          hour,
          pillars: [
            { label: isZh() ? "年" : "Year", ...y },
            { label: isZh() ? "月" : "Month", ...m },
            { label: isZh() ? "日" : "Day", ...d },
            { label: isZh() ? "时" : "Hour", ...h },
          ],
          daymaster: d.stem,
          lean: pick(rng, elements),
        };
      },
      generate(q, cast) {
        const lean = cast.lean;
        const dm = cast.daymaster;
        return pack({
          title: isZh() ? `日主 ${dm} · ${lean}` : `Daymaster ${dm} · ${lean}`,
          result: isZh()
            ? `四柱：${(cast.pillars || []).map((p) => p.stem + p.branch).join(" · ")}`
            : `Pillars: ${(cast.pillars || []).map((p) => p.stem + p.branch).join(" · ")}`,
          explain: isZh()
            ? `教学八字以日干「${dm}」为日主，盘面倾向「${lean}」。真批需节气与用神细则；此处只作文教育映射。`
            : `Teaching Bazi takes day stem “${dm}” as Daymaster, leaning “${lean}”. Real readings need solar terms and useful-god detail; this is educational mapping only.`,
          interpret: interpretQ(q, lean, isZh() ? "日主五行" : "the Daymaster lean"),
          details: (cast.pillars || []).map((p) => `${p.label}: ${p.stem}${p.branch}`),
          doList: [
            isZh()
              ? `按「${lean}」写下本周一个可验证的调整（节奏／社交／休息）。`
              : `From “${lean}”, write one testable weekly adjustment (pace / people / rest).`,
          ],
          dontList: [
            isZh() ? "不要用教学四柱决定医疗或重大法律事项。" : "Do not decide medical or major legal matters from a teaching chart.",
          ],
          tone: /锐|sharp|旺|strong/.test(lean) ? "bright" : "mixed",
          vizData: cast,
        });
      },
    },

    ziwei: {
      summary: {
        en: "Zi Wei Dou Shu places major stars into twelve palaces to chart lifelong fortune, relationships, and timing.",
        zh: "紫微斗数将主星安入十二宫，用以论终身运势、关系与时机。",
      },
      how: {
        en: {
          intro: "Zi Wei charts twelve palaces and major stars. You’ll set birth data and open a palace.",
          steps: [
            { title: "Meet the purple stars", body: "Twelve palaces · major stars · brightness." },
            { title: "Enter birth date", body: "Date (and optional hour) fix the Life palace teaching sector." },
            { title: "Note gender tradition", body: "Some star transforms differ by yin/yang chart rules — pick a teaching flag." },
            { title: "Open a palace", body: "One palace lights with a major star." },
            { title: "Read the palace counsel", body: "Star-in-palace lean for your question." },
          ],
        },
        zh: {
          intro: "紫微排十二宫与主星。你将设定出生数据并打开一宫。",
          steps: [
            { title: "认识紫微诸星", body: "十二宫 · 主星 · 亮暗。" },
            { title: "输入出生日期", body: "日期（及时辰）锚定教学用命宫方位。" },
            { title: "标注性别传统", body: "部分星系依阴阳盘有异——选一个教学标记。" },
            { title: "打开一宫", body: "一宫点亮并安入主星。" },
            { title: "读宫位指引", body: "星在宫的倾向对照你的问题。" },
          ],
        },
      },
      steps: ["intent", "birth", "gender", "palaces", "result"],
      viz: "ziwei-palaces",
      castCta: { en: "Open a palace", zh: "打开一宫" },
      buildCast(state, rng) {
        const palace = pick(rng, PALACES);
        const star = pick(rng, STARS);
        return {
          birth: state.birthDate || "",
          gender: state.gender || "unspecified",
          palace,
          star,
          brightness: pick(rng, isZh() ? ["庙", "旺", "得", "平"] : ["temple", "bright", "fair", "even"]),
        };
      },
      generate(q, cast) {
        const palace = loc(cast.palace);
        const star = loc(cast.star);
        const lean = `${star} @ ${palace} (${cast.brightness})`;
        return pack({
          title: lean,
          result: isZh()
            ? `${star} 在 ${palace} · ${cast.brightness}`
            : `${star} in ${palace} · ${cast.brightness}`,
          explain: isZh()
            ? `教学紫微盘示「${star}」落「${palace}」，亮度「${cast.brightness}」。真盘需农历与时辰细则；此处为宫星教育。`
            : `Teaching Zi Wei shows “${star}” in “${palace}” at “${cast.brightness}”. Real charts need lunar calendar detail; this is palace-star education.`,
          interpret: interpretQ(q, lean, isZh() ? "紫微宫星" : "the Zi Wei palace-star"),
          details: [
            isZh() ? `出生：${cast.birth || "—"}` : `Birth: ${cast.birth || "—"}`,
            isZh() ? `标记：${cast.gender}` : `Flag: ${cast.gender}`,
            lean,
          ],
          doList: [
            isZh()
              ? `只针对「${palace}」主题列一件本周可做的实事。`
              : `List one concrete weekly action only for the “${palace}” theme.`,
          ],
          dontList: [
            isZh() ? "不要用单宫单星概括一生。" : "Do not summarize a whole life from one palace-star.",
          ],
          tone: /疾|Health|忌/.test(palace) ? "caution" : "deep",
          vizData: cast,
        });
      },
    },

    "chinese-zodiac": {
      summary: {
        en: "Birth-year animal and its elemental cycle are read for temperament, compatibility, and yearly themes.",
        zh: "按出生年份生肖及其五行循环，论性情、合冲与流年主题。",
      },
      how: {
        en: {
          intro: "The twelve animals mark birth years. You’ll pick a year, meet your animal, then ask a focus.",
          steps: [
            { title: "Meet the twelve animals", body: "A twelve-year cycle with elemental colors." },
            { title: "Enter birth year", body: "Year selects the teaching animal." },
            { title: "Meet your animal", body: "Animal + element appear on the ring." },
            { title: "Ask a focus", body: "Work, kin, or timing — one question." },
            { title: "Read the animal counsel", body: "Temperament lean for your focus." },
          ],
        },
        zh: {
          intro: "十二生肖标记出生年。你将选年份、认识生肖，再问一个焦点。",
          steps: [
            { title: "认识十二生肖", body: "十二年一轮，带五行色彩。" },
            { title: "输入出生年", body: "年份选定教学生肖。" },
            { title: "认识你的生肖", body: "生肖＋五行出现在环上。" },
            { title: "提出焦点", body: "工作、亲属或择时——只问一件。" },
            { title: "读生肖指引", body: "性情倾向对照你的焦点。" },
          ],
        },
      },
      steps: ["intent", "year", "animal", "question", "result"],
      viz: "zodiac-ring",
      castCta: { en: "Confirm the animal", zh: "确认生肖" },
      buildCast(state, rng) {
        const y = parseInt(state.birthYear, 10) || 1990 + Math.floor(rng() * 20);
        const animal = animalForYear(y);
        const leans = isZh()
          ? ["机敏·侧翼进", "沉稳·先筑基", "勇·护边界", "柔·连结人", "变·开新局", "察·慢一步"]
          : ["quick · flank", "steady · build first", "bold · guard edge", "soft · link people", "shift · open new", "watch · wait a beat"];
        return { year: y, animal, lean: leans[animal.idx % leans.length] };
      },
      generate(q, cast) {
        const a = cast.animal;
        const name = loc({ en: a.en, zh: a.zh });
        const elem = loc(a.elem);
        const lean = cast.lean;
        return pack({
          title: isZh() ? `${cast.year} · ${name}（${elem}）` : `${cast.year} · ${name} (${elem})`,
          result: isZh() ? `生肖：${name} · 五行：${elem}` : `Animal: ${name} · Element: ${elem}`,
          explain: isZh()
            ? `出生年 ${cast.year} 对应「${name}／${elem}」，性情倾向「${lean}」。生肖是民俗标签；请当作镜子而非判决。`
            : `Birth year ${cast.year} maps to “${name} / ${elem}”, leaning “${lean}”. Zodiac labels are folk mirrors — not verdicts.`,
          interpret: interpretQ(q, lean, isZh() ? "生肖性情" : "the animal temperament"),
          details: [
            isZh() ? `年份：${cast.year}` : `Year: ${cast.year}`,
            isZh() ? `生肖：${name}` : `Animal: ${name}`,
            lean,
          ],
          doList: [
            isZh()
              ? `用「${lean}」写一个本周与焦点相关的小实验。`
              : `Use “${lean}” for one small weekly experiment on your focus.`,
          ],
          dontList: [
            isZh() ? "不要只用生肖决定婚配或雇佣。" : "Do not hire or marry by zodiac alone.",
          ],
          tone: "bright",
          vizData: cast,
        });
      },
    },

    benmingnian: {
      summary: {
        en: "Ben Ming Nian is the year one’s birth animal returns — traditionally read as clash with Tai Sui (Grand Duke Jupiter).",
        zh: "本命年是生肖轮回之年——传统上论与太岁相冲，需谨慎行事。",
      },
      how: {
        en: {
          intro: "Fan Tai Sui years ask for caution and ritual care. You’ll compare birth animal to the year animal.",
          steps: [
            { title: "Meet Ben Ming Nian", body: "Your animal year returns every twelve years." },
            { title: "Enter birth year", body: "Finds your animal." },
            { title: "Set the year in view", body: "Which calendar year are you asking about?" },
            { title: "Check Tai Sui clash", body: "Same animal = ben ming; opposing = clash teaching." },
            { title: "Read the year’s counsel", body: "Caution / calm lean for your plans." },
          ],
        },
        zh: {
          intro: "犯太岁之年讲究谨慎与礼敬。你将对照出生生肖与流年生肖。",
          steps: [
            { title: "认识本命年", body: "生肖每十二年一轮回。" },
            { title: "输入出生年", body: "确定你的生肖。" },
            { title: "设定所问之年", body: "你在问哪一个历年？" },
            { title: "查看太岁冲合", body: "同肖＝本命；对冲＝教学上的冲太岁。" },
            { title: "读流年指引", body: "谨慎／安稳倾向对照你的计划。" },
          ],
        },
      },
      steps: ["intent", "birthyear", "yearcheck", "clash", "result"],
      viz: "taisui",
      castCta: { en: "Check Tai Sui", zh: "查看太岁" },
      buildCast(state, rng) {
        const by = parseInt(state.birthYear, 10) || 1990;
        const ty = parseInt(state.targetYear, 10) || new Date().getFullYear();
        const birthA = animalForYear(by);
        const yearA = animalForYear(ty);
        const same = birthA.idx === yearA.idx;
        const oppose = (birthA.idx + 6) % 12 === yearA.idx;
        let status, lean;
        if (same) {
          status = isZh() ? "本命年" : "Ben Ming Nian";
          lean = isZh() ? "慎始·守礼" : "caution · keep rites";
        } else if (oppose) {
          status = isZh() ? "冲太岁" : "Clash Tai Sui";
          lean = isZh() ? "避锋·缓动" : "dodge edge · slow moves";
        } else {
          status = isZh() ? "未犯太岁" : "No direct Tai Sui";
          lean = isZh() ? "常道·按计划" : "ordinary path · as planned";
        }
        return { birthYear: by, targetYear: ty, birthA, yearA, status, lean, same, oppose };
      },
      generate(q, cast) {
        const b = loc({ en: cast.birthA.en, zh: cast.birthA.zh });
        const y = loc({ en: cast.yearA.en, zh: cast.yearA.zh });
        return pack({
          title: `${cast.status}`,
          result: isZh()
            ? `${cast.birthYear}（${b}）vs ${cast.targetYear}（${y}）→ ${cast.status}`
            : `${cast.birthYear} (${b}) vs ${cast.targetYear} (${y}) → ${cast.status}`,
          explain: isZh()
            ? `对照结果为「${cast.status}」，倾向「${cast.lean}」。本命／冲太岁是民俗择年框架；请用谨慎计划回应，而非恐惧。`
            : `Comparison reads “${cast.status}”, leaning “${cast.lean}”. Ben Ming / Tai Sui is a folk yearly frame — answer with careful plans, not fear.`,
          interpret: interpretQ(q || String(cast.targetYear), cast.lean, isZh() ? "太岁对照" : "the Tai Sui check"),
          details: [
            isZh() ? `本肖：${b}` : `Birth animal: ${b}`,
            isZh() ? `流年肖：${y}` : `Year animal: ${y}`,
            cast.status,
          ],
          doList: [
            isZh()
              ? `若倾向谨慎，把大决定拆成可逆的两步并写下退出条件。`
              : `If caution applies, split a big decision into two reversible steps and write an exit condition.`,
          ],
          dontList: [
            isZh() ? "不要因本命年取消必要的医疗或法律责任。" : "Do not cancel necessary medical or legal duties because of Ben Ming Nian.",
          ],
          tone: cast.same || cast.oppose ? "caution" : "bright",
          vizData: cast,
        });
      },
    },

    tongshu: {
      summary: {
        en: "Huangli / Tongshu (Chinese almanac) selects auspicious and inauspicious days for marriage, travel, burial, and business.",
        zh: "黄历／通书为婚嫁、出行、安葬、开市等事选择宜忌之日。",
      },
      how: {
        en: {
          intro: "Zeri picks days by activity. You’ll choose an activity, pick a candidate day, then read 宜/忌.",
          steps: [
            { title: "Meet the almanac", body: "Days carry suitable / avoid lists." },
            { title: "Choose an activity", body: "Travel, marriage, opening, moving…" },
            { title: "Pick a candidate day", body: "A date you are considering." },
            { title: "Read 宜 / 忌", body: "Teaching verdict for that pair." },
            { title: "Counsel for your plan", body: "Whether to keep, shift, or soften the day." },
          ],
        },
        zh: {
          intro: "择日按事类选日。你将选择事宜、点选候选日，再看宜忌。",
          steps: [
            { title: "认识通书", body: "每日有宜／忌条目。" },
            { title: "选择事宜", body: "出行、婚嫁、开市、移徙…" },
            { title: "点选候选日", body: "你正在考虑的日期。" },
            { title: "读取宜／忌", body: "该组合的教学判定。" },
            { title: "给你的计划建议", body: "保留、改期或软化安排。" },
          ],
        },
      },
      steps: ["intent", "activity", "daypick", "verdict", "result"],
      viz: "almanac",
      castCta: { en: "Read 宜 / 忌", zh: "读取宜忌" },
      buildCast(state, rng) {
        const act = ACTIVITIES.find((a) => a.id === state.activity) || ACTIVITIES[0];
        const day = state.dayDate || new Date().toISOString().slice(0, 10);
        const verdict = pick(rng, ALMANAC);
        return { activity: act, day, verdict };
      },
      generate(q, cast) {
        const act = loc({ en: cast.activity.en, zh: cast.activity.zh });
        const v = loc({ en: cast.verdict.en, zh: cast.verdict.zh });
        const lean =
          cast.verdict.tone === "bright"
            ? isZh()
              ? "可择此日·仍核实务"
              : "day ok · still check logistics"
            : cast.verdict.tone === "caution"
              ? isZh()
                ? "宜改期或缩小动作"
                : "shift day or shrink the act"
              : isZh()
                ? "平日·看你的准备度"
                : "neutral · depend on readiness";
        return pack({
          title: `${v} · ${act}`,
          result: isZh() ? `${cast.day} 办「${act}」→ ${v}` : `${cast.day} for “${act}” → ${v}`,
          explain: isZh()
            ? `通书教学判定「${v}」，建议「${lean}」。黄历是民俗择日工具；最终仍核对场地、法律与健康。`
            : `Almanac teaching verdict “${v}”, counsel “${lean}”. Huangli is folk day-selection — still check venue, law, and health.`,
          interpret: interpretQ(q || `${act} @ ${cast.day}`, lean, isZh() ? "通书宜忌" : "the almanac verdict"),
          details: [
            isZh() ? `事宜：${act}` : `Activity: ${act}`,
            isZh() ? `日期：${cast.day}` : `Day: ${cast.day}`,
            v,
          ],
          doList: [
            isZh()
              ? `若保留此日，列出三件与「${act}」相关的实务清单。`
              : `If you keep the day, list three logistics items for “${act}”.`,
          ],
          dontList: [
            isZh() ? "不要只因「忌」取消紧急必要事务。" : "Do not cancel urgent necessary business only because of 忌.",
          ],
          tone: cast.verdict.tone,
          vizData: cast,
        });
      },
    },

    tieban: {
      summary: {
        en: "Tie Ban Shen Shu (Iron Plate) is a Song-attributed numerological destiny system turning birth data into coded verses.",
        zh: "铁板神数相传出于宋代谱系，把出生数据化为数码与诗断。",
      },
      how: {
        en: {
          intro: "Iron Plate encodes birth into numbers and poems. You’ll enter birth, derive digits, then open a plate verse.",
          steps: [
            { title: "Meet Iron Plate", body: "Numbers unlock teaching verses." },
            { title: "Enter birth date", body: "Date seeds the numerology." },
            { title: "Derive the digits", body: "Watch number plates stamp out." },
            { title: "Open the iron plate", body: "A coded verse appears." },
            { title: "Read the verse counsel", body: "Plain meaning for your question." },
          ],
        },
        zh: {
          intro: "铁板把出生化为数与诗。你将输入生日、推出数码，再打开诗断。",
          steps: [
            { title: "认识铁板神数", body: "数字打开教学诗断。" },
            { title: "输入出生日期", body: "日期作术数种子。" },
            { title: "推出数码", body: "看数板打印出来。" },
            { title: "打开铁板", body: "出现一则诗断。" },
            { title: "读诗断指引", body: "白话含义对照你的问题。" },
          ],
        },
      },
      steps: ["intent", "birth", "digits", "ironplate", "result"],
      viz: "iron-plate",
      castCta: { en: "Open the iron plate", zh: "打开铁板" },
      buildCast(state, rng) {
        const birth = state.birthDate || "1990-05-05";
        const digits = Array.from({ length: 6 }, () => Math.floor(rng() * 10));
        const verses = isZh()
          ? ["门前有路须留步，先问知音再启程", "金风未动且藏锋，待得三秋再发言", "水到渠成非强求，顺势一舟过险滩"]
          : [
              "A road is open — ask a confidant before you step",
              "Hide the edge until autumn winds invite speech",
              "Let the channel fill; one boat rides the rapid",
            ];
        return { birth, digits, verse: pick(rng, verses), code: digits.join("") };
      },
      generate(q, cast) {
        const verse = cast.verse;
        return pack({
          title: verse,
          result: isZh() ? `铁板数码 ${cast.code}` : `Iron plate code ${cast.code}`,
          explain: isZh()
            ? `由出生标记推出数码 ${cast.code}，教学诗断：「${verse}」。铁板谱系说法不一；此处给反思句，不是秘传批文。`
            : `Birth mark yields code ${cast.code}; teaching verse: “${verse}”. Iron Plate lineages vary; this is a reflective line — not a secret master text.`,
          interpret: interpretQ(q || cast.birth, verse, isZh() ? "铁板诗断" : "the iron-plate verse"),
          details: [
            isZh() ? `出生：${cast.birth}` : `Birth: ${cast.birth}`,
            isZh() ? `数码：${cast.code}` : `Code: ${cast.code}`,
          ],
          doList: [
            isZh()
              ? `把诗断改写成一个可执行、可验证的下一步。`
              : `Rewrite the verse as one executable, testable next step.`,
          ],
          dontList: [
            isZh() ? "不要把教学诗断当成必须服从的谶语。" : "Do not treat the teaching verse as a prophecy you must obey.",
          ],
          tone: "deep",
          vizData: cast,
        });
      },
    },

    qizheng: {
      summary: {
        en: "Qizheng Siyu charts the seven luminaries (Sun–Saturn) plus four shadow points for destiny and timing.",
        zh: "七政四余以日月五星七政，加四余影点，论命运与时机。",
      },
      how: {
        en: {
          intro: "Seven governors and four shadows form a sky board. You’ll set birth and light the luminaries.",
          steps: [
            { title: "Meet seven governors", body: "Sun · Moon · Mercury · Venus · Mars · Jupiter · Saturn (+ shadows)." },
            { title: "Enter birth date", body: "Date seeds the teaching sky board." },
            { title: "Light the luminaries", body: "Seven points kindle on the board." },
            { title: "Read the sky board", body: "One governor leads the counsel." },
            { title: "Counsel for your ask", body: "Luminary lean mirrored to your question." },
          ],
        },
        zh: {
          intro: "七政与四余组成天盘。你将设定生日并点亮七政。",
          steps: [
            { title: "认识七政", body: "日月金木水火土（加四余）。" },
            { title: "输入出生日期", body: "日期作教学天盘种子。" },
            { title: "点亮七政", body: "盘上七点火起。" },
            { title: "读取天盘", body: "一颗主星引领指引。" },
            { title: "对照你的问题", body: "主星倾向映照所问。" },
          ],
        },
      },
      steps: ["intent", "birth", "governors", "skyboard", "result"],
      viz: "qizheng-board",
      castCta: { en: "Read the sky board", zh: "读取天盘" },
      buildCast(state, rng) {
        const govs = isZh()
          ? ["日", "月", "水", "金", "火", "木", "土"]
          : ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"];
        const leans = isZh()
          ? ["明·见人", "感·内省", "通·传讯", "和·结盟", "锐·推进", "扩·布局", "敛·守成"]
          : ["clear · be seen", "feel · inward", "link · message", "harmony · ally", "edge · advance", "grow · plan", "hold · conserve"];
        const lead = Math.floor(rng() * 7);
        return {
          birth: state.birthDate || "",
          governors: govs.map((g, i) => ({ name: g, on: true, i })),
          lead: govs[lead],
          lean: leans[lead],
        };
      },
      generate(q, cast) {
        return pack({
          title: isZh() ? `${cast.lead} 主事 · ${cast.lean}` : `${cast.lead} leads · ${cast.lean}`,
          result: isZh() ? `七政主星：${cast.lead}` : `Leading governor: ${cast.lead}`,
          explain: isZh()
            ? `教学七政盘以「${cast.lead}」为主，倾向「${cast.lean}」。真盘需黄道度数；此处为天象教育。`
            : `Teaching Qizheng board leads with “${cast.lead}”, leaning “${cast.lean}”. Real charts need ecliptic degrees; this is sky education.`,
          interpret: interpretQ(q || cast.birth, cast.lean, isZh() ? "七政主星" : "the leading governor"),
          details: [
            isZh() ? `出生：${cast.birth || "—"}` : `Birth: ${cast.birth || "—"}`,
            isZh() ? `主星：${cast.lead}` : `Lead: ${cast.lead}`,
            cast.lean,
          ],
          doList: [
            isZh()
              ? `按「${cast.lean}」选一个本周可见的行动。`
              : `Choose one visible weekly action matching “${cast.lean}”.`,
          ],
          dontList: [
            isZh() ? "不要用单星结论覆盖复杂人事。" : "Do not overwrite complex human affairs with one star.",
          ],
          tone: /锐|edge|敛|hold/.test(cast.lean) ? "caution" : "bright",
          vizData: cast,
        });
      },
    },

    chenggu: {
      summary: {
        en: "Chenggu suanming weighs ‘bones’ by birth year, month, day, and hour, then matches the total to destiny poems.",
        zh: "称骨算命按出生年、月、日、时折算「骨重」，再对照命运诗断。",
      },
      how: {
        en: {
          intro: "Bone-weighing sums symbolic weights into a poem. You’ll enter birth, weigh the bones, then open the poem.",
          steps: [
            { title: "Meet bone-weighing", body: "Year · month · day · hour each add ‘weight’." },
            { title: "Enter birth date", body: "Date (hour optional in teaching mode)." },
            { title: "Weigh the bones", body: "Watch the scale tip as weights add." },
            { title: "Open the destiny poem", body: "Total weight maps to a teaching verse." },
            { title: "Read the poem counsel", body: "Verse lean for your question." },
          ],
        },
        zh: {
          intro: "称骨把象征重量加成诗断。你将输入生日、称骨，再打开诗。",
          steps: [
            { title: "认识称骨", body: "年月日時各加「骨重」。" },
            { title: "输入出生日期", body: "日期（教学时可省略时辰）。" },
            { title: "称量骨重", body: "看秤随着重量倾斜。" },
            { title: "打开命运诗", body: "总重对应教学诗断。" },
            { title: "读诗断指引", body: "诗意倾向对照你的问题。" },
          ],
        },
      },
      steps: ["intent", "birth", "bones", "poem", "result"],
      viz: "bone-scale",
      castCta: { en: "Open the destiny poem", zh: "打开命运诗" },
      buildCast(state, rng) {
        const birth = state.birthDate || "1988-08-08";
        const poem = pick(rng, BONE_POEMS);
        const parts = [
          { k: isZh() ? "年" : "Y", w: (1 + Math.floor(rng() * 3)) + "两" },
          { k: isZh() ? "月" : "M", w: Math.floor(rng() * 3) + "钱" },
          { k: isZh() ? "日" : "D", w: Math.floor(rng() * 3) + "钱" },
          { k: isZh() ? "时" : "H", w: Math.floor(rng() * 2) + "钱" },
        ];
        return { birth, parts, poem };
      },
      generate(q, cast) {
        const poem = cast.poem;
        const title = loc({ en: poem.en, zh: poem.zh });
        return pack({
          title,
          result: isZh() ? `骨重 ${poem.w}` : `Bone weight ${poem.w}`,
          explain: isZh()
            ? `教学称骨合计「${poem.w}」，诗意「${title}」。袁天罡称骨是民俗诗断系统；请作镜子，而非铁律。`
            : `Teaching bone-weigh totals “${poem.w}”, verse “${title}”. Chenggu is a folk poem system — a mirror, not iron law.`,
          interpret: interpretQ(q || cast.birth, title, isZh() ? "称骨诗断" : "the bone-weigh poem"),
          details: [
            isZh() ? `出生：${cast.birth}` : `Birth: ${cast.birth}`,
            ...(cast.parts || []).map((p) => `${p.k}: ${p.w}`),
            poem.w,
          ],
          doList: [
            isZh()
              ? `从诗意中抽出一个你本周能实践的品质。`
              : `Pull one quality from the verse you can practice this week.`,
          ],
          dontList: [
            isZh() ? "不要用骨重比较或贬低他人。" : "Do not rank or demean people by bone weight.",
          ],
          tone: /重|Heavy|责任/.test(title) ? "caution" : "mixed",
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
    const packHow = isZh() ? r.how.zh : r.how.en;
    return {
      title: isZh() ? "这个仪式怎么玩" : "How this rite works",
      intro: packHow.intro,
      steps: packHow.steps,
      note: isZh()
        ? "本站为教育性游玩——不能替代受训命理实践、医疗、法律或安全判断。"
        : "Educational play on this site — not a substitute for trained destiny practice, medicine, law, or safety judgment.",
    };
  }

  function summaryFor(id) {
    const r = RITES[id];
    if (!r) return "";
    return loc(r.summary);
  }

  function runCast(id, state) {
    const rite = RITES[id];
    if (!rite) return null;
    const rng = mulberry32(seedFrom(state.question || state.birthDate || state.birthYear, state.nonce, id));
    const cast = Object.assign({}, state.cast || {}, rite.buildCast(state, rng) || {});
    return rite.generate(state.question || "", cast, rng);
  }

  window.FatumChinaDestiny = {
    IDS,
    has,
    get,
    howFor,
    summaryFor,
    runCast,
    loc,
  };
})();
