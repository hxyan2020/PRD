/**
 * Himalayan / Central / SE Asian calendar & omen oracles — unique steps, visuals, readings.
 * Tibetan Astrology · Mo · Zurhai · Shagai · Scapulimancy · Mahabote · Thai Horasat ·
 * Thai Weekday · Taksa · Khmer Horasastra · Lao Calendar · Weton · Pawukon
 */
(function () {
  "use strict";

  const IDS = [
    "tibetan-astro",
    "mo-dice",
    "zurhai",
    "shagai",
    "scapulimancy-asia",
    "mahabote",
    "thai-horasat",
    "thai-weekday",
    "taksa",
    "khmer-hora",
    "lao-calendar",
    "weton",
    "pawukon",
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
      kind: "himalayasea",
      ...r,
      disclaimer: isZh()
        ? zhText(
            "教育性模拟——不能替代受训历算／骰占／择日实践，也不能替代医疗、法律或安全判断。可能不准确；无法预测黑天鹅事件。",
            "教育性模擬——不能替代受訓曆算／骰占／擇日實踐，也不能替代醫療、法律或安全判斷。可能不準確；無法預測黑天鵝事件。"
          )
        : "Educational simulation — not a substitute for trained calendar/dice/muhūrta practice, medicine, law, or safety judgment. May be inaccurate; cannot predict black swan events.",
    };
    return RM ? RM.structuredReading(base) : base;
  }
  function interpretQ(q, lean, mechanic) {
    const RM = window.FatumResultModel;
    const body = isZh()
      ? zhText(
          `你问的是「${q || "未写明的事"}」。以${mechanic}给出的「${lean}」倾向为镜：先改一件你能控制的安排，再用日常证据核对——不要把模拟盘当作外在命令。`,
          `你問的是「${q || "未寫明的事"}」。以${mechanic}給出的「${lean}」傾向為鏡：先改一件你能控制的安排，再用日常證據核對——不要把模擬盤當作外在命令。`
        )
      : `You asked about “${q || "an unnamed matter"}”. Hold the “${lean}” lean from ${mechanic} as a mirror: change one arrangement you control, then check ordinary evidence — do not treat a simulated chart as an external order.`;
    return RM ? RM.interpretWithQuestion(q, body) : body;
  }
  function howPack(en, zh, hant) {
    return { en, zh, hant: hant || zh };
  }

  const ELEMENTS = [
    { en: "Wood", zh: "木", lean: { en: "grow · begin", zh: "生发·起势", hant: "生發·起勢" } },
    { en: "Fire", zh: "火", lean: { en: "show · warm", zh: "显扬·温暖", hant: "顯揚·溫暖" } },
    { en: "Earth", zh: "土", lean: { en: "stabilize · hold", zh: "安住·守成", hant: "安住·守成" } },
    { en: "Iron", zh: "铁", lean: { en: "refine · decide", zh: "收敛·决断", hant: "收斂·決斷" } },
    { en: "Water", zh: "水", lean: { en: "flow · listen", zh: "流动·倾听", hant: "流動·傾聽" } },
  ];
  const ANIMALS = [
    { en: "Tiger", zh: "虎", lean: { en: "brave start", zh: "勇开", hant: "勇開" } },
    { en: "Hare", zh: "兔", lean: { en: "soft path", zh: "柔路", hant: "柔路" } },
    { en: "Dragon", zh: "龙", lean: { en: "stretch ambition", zh: "伸展志向", hant: "伸展志向" } },
    { en: "Snake", zh: "蛇", lean: { en: "quiet strategy", zh: "静策", hant: "靜策" } },
    { en: "Horse", zh: "马", lean: { en: "move · travel", zh: "行动·远行", hant: "行動·遠行" } },
    { en: "Sheep", zh: "羊", lean: { en: "care · gather", zh: "照护·聚会", hant: "照護·聚會" } },
  ];
  const MO = [
    { n: "1-1", en: "Clear path", zh: "坦途", lean: { en: "go with witnesses", zh: "有人见证再行", hant: "有人見證再行" } },
    { n: "2-3", en: "Mixed cloud", zh: "杂云", lean: { en: "clarify before commit", zh: "先澄清再承诺", hant: "先澄清再承諾" } },
    { n: "4-2", en: "Obstacle gate", zh: "障门", lean: { en: "pause · ask help", zh: "暂停·求助", hant: "暫停·求助" } },
    { n: "6-6", en: "Joy blossom", zh: "喜花", lean: { en: "share a small win", zh: "分享小胜", hant: "分享小勝" } },
    { n: "3-5", en: "Repair thread", zh: "补线", lean: { en: "mend one relationship", zh: "修补一段关系", hant: "修補一段關係" } },
  ];
  const SHAGAI_FACES = [
    { en: "Horse", zh: "马面", lean: { en: "speed · outbound", zh: "迅捷·外向", hant: "迅捷·外向" } },
    { en: "Camel", zh: "驼面", lean: { en: "endure · carry", zh: "耐力·承载", hant: "耐力·承載" } },
    { en: "Goat", zh: "羊面", lean: { en: "gather · soft power", zh: "聚合·柔力", hant: "聚合·柔力" } },
    { en: "Sheep", zh: "绵面", lean: { en: "home · rest", zh: "归家·歇息", hant: "歸家·歇息" } },
  ];
  const WEEKDAYS = [
    { id: 0, en: "Sunday", zh: "星期日", lean: { en: "visible lead", zh: "外显带领", hant: "外顯帶領" } },
    { id: 1, en: "Monday", zh: "星期一", lean: { en: "care · mood", zh: "照护·情绪", hant: "照護·情緒" } },
    { id: 2, en: "Tuesday", zh: "星期二", lean: { en: "drive · cut", zh: "驱动·切割", hant: "驅動·切割" } },
    { id: 3, en: "Wednesday", zh: "星期三", lean: { en: "talk · trade", zh: "言谈·交易", hant: "言談·交易" } },
    { id: 4, en: "Thursday", zh: "星期四", lean: { en: "grow · teach", zh: "成长·教导", hant: "成長·教導" } },
    { id: 5, en: "Friday", zh: "星期五", lean: { en: "beauty · bond", zh: "美感·连结", hant: "美感·連結" } },
    { id: 6, en: "Saturday", zh: "星期六", lean: { en: "structure · patience", zh: "结构·耐心", hant: "結構·耐心" } },
  ];
  const MAHABOTE = [
    { en: "Sun house", zh: "日曜宫", lean: { en: "stand in light", zh: "立于光中", hant: "立於光中" } },
    { en: "Moon house", zh: "月曜宫", lean: { en: "nurture circle", zh: "滋养圈层", hant: "滋養圈層" } },
    { en: "Mars house", zh: "火曜宫", lean: { en: "defend boundary", zh: "护住边界", hant: "護住邊界" } },
    { en: "Mercury house", zh: "水曜宫", lean: { en: "write · link", zh: "书写·连结", hant: "書寫·連結" } },
    { en: "Jupiter house", zh: "木曜宫", lean: { en: "expand wisely", zh: "明智扩展", hant: "明智擴展" } },
    { en: "Venus house", zh: "金曜宫", lean: { en: "harmonize taste", zh: "调和品味", hant: "調和品味" } },
    { en: "Saturn house", zh: "土曜宫", lean: { en: "slow build", zh: "慢工积累", hant: "慢工積累" } },
    { en: "Rahu house", zh: "罗睺宫", lean: { en: "stretch · watch excess", zh: "延展·防过火", hant: "延展·防過火" } },
  ];
  const THAI_COLORS = [
    { en: "Red · Sunday", zh: "红·日", lean: { en: "bold presence", zh: "大胆现身", hant: "大膽現身" } },
    { en: "Yellow · Monday", zh: "黄·一", lean: { en: "soft authority", zh: "柔和权威", hant: "柔和權威" } },
    { en: "Pink · Tuesday", zh: "粉·二", lean: { en: "warm courage", zh: "温勇", hant: "溫勇" } },
    { en: "Green · Wednesday", zh: "绿·三", lean: { en: "grow networks", zh: "扩展网络", hant: "擴展網絡" } },
    { en: "Orange · Thursday", zh: "橙·四", lean: { en: "teach · share", zh: "教导·分享", hant: "教導·分享" } },
    { en: "Blue · Friday", zh: "蓝·五", lean: { en: "beauty · calm", zh: "美感·平静", hant: "美感·平靜" } },
    { en: "Purple · Saturday", zh: "紫·六", lean: { en: "deep focus", zh: "深专注", hant: "深專注" } },
  ];
  const TAKSA_BANDS = [
    { en: "Auspicious letters", zh: "吉字母", lean: { en: "keep the soft vowels", zh: "保留柔元音", hant: "保留柔元音" } },
    { en: "Neutral letters", zh: "平字母", lean: { en: "use everyday forms", zh: "用日常字形", hant: "用日常字形" } },
    { en: "Care letters", zh: "慎字母", lean: { en: "soften harsh consonants", zh: "柔化硬辅音", hant: "柔化硬輔音" } },
  ];
  const PASARAN = [
    { en: "Legi", zh: "Legi", lean: { en: "sweet openings", zh: "甜开", hant: "甜開" } },
    { en: "Pahing", zh: "Pahing", lean: { en: "bitter clarity", zh: "苦清", hant: "苦清" } },
    { en: "Pon", zh: "Pon", lean: { en: "gather markets", zh: "市集聚", hant: "市集聚" } },
    { en: "Wagé", zh: "Wagé", lean: { en: "earth pace", zh: "土节奏", hant: "土節奏" } },
    { en: "Kliwon", zh: "Kliwon", lean: { en: "spirit night care", zh: "灵夜慎", hant: "靈夜慎" } },
  ];
  const UKU = [
    { en: "Sinta week", zh: "Sinta 周", lean: { en: "love · begin", zh: "情谊·起势", hant: "情誼·起勢" } },
    { en: "Landep week", zh: "Landep 周", lean: { en: "sharp focus", zh: "锐专注", hant: "銳專注" } },
    { en: "Ukir week", zh: "Ukir 周", lean: { en: "craft detail", zh: "细工", hant: "細工" } },
    { en: "Kulantir week", zh: "Kulantir 周", lean: { en: "patience thread", zh: "耐心线", hant: "耐心線" } },
  ];

  const RITES = {
    "tibetan-astro": {
      summary: {
        en: "Tibetan astrology combines Five Elements and twelve animals through Himalayan calendar systems for character and timing themes.",
        zh: "藏历占星以五行与十二生肖结合藏历体系，论性情与时机主题。",
        hant: "藏曆占星以五行與十二生肖結合藏曆體系，論性情與時機主題。",
      },
      how: howPack(
        {
          intro: "You’ll enter birth date, set element–animal lens, then open a teaching Tibetan board.",
          steps: [
            { title: "Meet Tibetan astrology", body: "Elements · animals · calendar." },
            { title: "Enter birth date", body: "Chart seed." },
            { title: "Set element–animal", body: "Teaching pair choice." },
            { title: "Open the board", body: "Pair lean appears." },
            { title: "Tibetan counsel", body: "Element–animal for your focus." },
          ],
        },
        {
          intro: "你将输入生辰、设定五行－生肖视角，再打开教学藏历盘。",
          steps: [
            { title: "认识藏历占星", body: "五行 · 生肖 · 历算。" },
            { title: "输入出生日期", body: "盘种。" },
            { title: "设定五行－生肖", body: "教学配对选择。" },
            { title: "打开盘面", body: "配对倾向出现。" },
            { title: "藏历指引", body: "五行生肖对照焦点。" },
          ],
        },
        {
          intro: "你將輸入生辰、設定五行－生肖視角，再打開教學藏曆盤。",
          steps: [
            { title: "認識藏曆占星", body: "五行 · 生肖 · 曆算。" },
            { title: "輸入出生日期", body: "盤種。" },
            { title: "設定五行－生肖", body: "教學配對選擇。" },
            { title: "打開盤面", body: "配對傾向出現。" },
            { title: "藏曆指引", body: "五行生肖對照焦點。" },
          ],
        }
      ),
      steps: ["intent", "birth", "elementAnimal", "tibetanBoard", "result"],
      viz: "tibetan",
      castCta: { en: "Open the board", zh: "打开盘面", hant: "打開盤面" },
      buildCast(state, rng) {
        const el = ELEMENTS.find((e) => e.en === state.tibElement) || pick(rng, ELEMENTS);
        const an = ANIMALS.find((a) => a.en === state.tibAnimal) || pick(rng, ANIMALS);
        return {
          birth: state.birthDate || "",
          el,
          an,
          lean: loc({ en: `${loc(el.lean)} · ${loc(an.lean)}`, zh: `${loc(el.lean)}·${loc(an.lean)}` }),
        };
      },
      generate(q, cast) {
        const e = loc({ en: cast.el.en, zh: cast.el.zh });
        const a = loc({ en: cast.an.en, zh: cast.an.zh });
        return pack({
          title: `${e} ${a}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学藏历以「${cast.birth || "—"}」见「${e}${a}」，倾向「${cast.lean}」。真盘需藏历换算。`, `教學藏曆以「${cast.birth || "—"}」見「${e}${a}」，傾向「${cast.lean}」。真盤需藏曆換算。`)
            : `Teaching Tibetan astrology for “${cast.birth || "—"}” shows “${e} ${a}”, leaning “${cast.lean}”. Real charts need Tibetan calendar math.`,
          interpret: interpretQ(q, cast.lean, isZh() ? "藏历五行生肖" : "Tibetan element–animal"),
          details: [cast.birth || "—", e, a],
          doList: [isZh() ? zhText(`围绕「${cast.lean}」安排本周一次专注时段。`, `圍繞「${cast.lean}」安排本週一次專注時段。`) : `Book one focus block this week around “${cast.lean}”.`],
          dontList: [isZh() ? zhText("不要用简化盘恐吓他人做重大决定。", "不要用簡化盤恐嚇他人做重大決定。") : "Do not scare others into major moves from a teaching board."],
          tone: "deep",
          vizData: cast,
        });
      },
    },

    "mo-dice": {
      summary: {
        en: "Mo is Tibetan dice divination — rolls indexed to Mo texts for counsel and prognosis (educational sim).",
        zh: "西藏骰占（Mo）以骰点对照摩经文作指引与预后（教育模拟）。",
        hant: "西藏骰占（Mo）以骰點對照摩經文作指引與預後（教育模擬）。",
      },
      how: howPack(
        {
          intro: "You’ll hold a question, roll teaching Mo dice, then read the verse lean.",
          steps: [
            { title: "Meet Mo", body: "Dice · text · counsel." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Roll the Mo dice", body: "Two teaching faces." },
            { title: "Read the Mo verse", body: "Verse lean appears." },
            { title: "Mo counsel", body: "Verse lean for your question." },
          ],
        },
        {
          intro: "你将抱定问题、掷下教学摩骰，再读经文倾向。",
          steps: [
            { title: "认识摩骰", body: "骰 · 经文 · 指引。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "掷下摩骰", body: "两个教学点面。" },
            { title: "读取摩文", body: "经文倾向出现。" },
            { title: "摩骰指引", body: "文意对照问题。" },
          ],
        },
        {
          intro: "你將抱定問題、擲下教學摩骰，再讀經文傾向。",
          steps: [
            { title: "認識摩骰", body: "骰 · 經文 · 指引。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "擲下摩骰", body: "兩個教學點面。" },
            { title: "讀取摩文", body: "經文傾向出現。" },
            { title: "摩骰指引", body: "文意對照問題。" },
          ],
        }
      ),
      steps: ["intent", "question", "rollMo", "moVerse", "result"],
      viz: "mo",
      castCta: { en: "Read the Mo verse", zh: "读取摩文", hant: "讀取摩文" },
      buildCast(state, rng) {
        const verse = pick(rng, MO);
        return { verse, lean: loc(verse.lean), dice: verse.n };
      },
      generate(q, cast) {
        const v = loc({ en: cast.verse.en, zh: cast.verse.zh });
        return pack({
          title: `${cast.dice} · ${v}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学摩骰得「${cast.dice}·${v}」，倾向「${cast.lean}」。真摩需传承文本。`, `教學摩骰得「${cast.dice}·${v}」，傾向「${cast.lean}」。真摩需傳承文本。`)
            : `Teaching Mo rolls “${cast.dice} · ${v}”, leaning “${cast.lean}”. Real Mo needs transmitted texts.`,
          interpret: interpretQ(q, cast.lean, isZh() ? "摩骰经文" : "the Mo verse"),
          details: [cast.dice, v],
          doList: [isZh() ? zhText(`按「${cast.lean}」做一件今天可完成的小事。`, `按「${cast.lean}」做一件今天可完成的小事。`) : `Do one small today-action matching “${cast.lean}”.`],
          dontList: [isZh() ? zhText("不要用骰占恐吓他人。", "不要用骰占恐嚇他人。") : "Do not frighten others with dice lots."],
          tone: /障|Obstacle|pause|pause/i.test(v + cast.lean) ? "caution" : "mixed",
          vizData: cast,
        });
      },
    },

    zurhai: {
      summary: {
        en: "Mongolian Zurhai is calendrical astrology related to Tibetan systems — year marks counsel character and timing.",
        zh: "蒙古祖尔海是与藏系相关的历算占星——年标论性情与时机。",
        hant: "蒙古祖爾海是與藏系相關的曆算占星——年標論性情與時機。",
      },
      how: howPack(
        {
          intro: "You’ll enter birth year, set a Zurhai mark, then open a teaching chart lean.",
          steps: [
            { title: "Meet Zurhai", body: "Year marks · Mongolian calendar." },
            { title: "Enter birth year", body: "Year seed." },
            { title: "Set a Zurhai mark", body: "Teaching animal–element mark." },
            { title: "Open the Zurhai chart", body: "Mark lean appears." },
            { title: "Zurhai counsel", body: "Mark lean for your focus." },
          ],
        },
        {
          intro: "你将输入出生年、设定祖尔海年标，再打开教学盘倾向。",
          steps: [
            { title: "认识祖尔海", body: "年标 · 蒙古历算。" },
            { title: "输入出生年", body: "年种。" },
            { title: "设定祖尔海年标", body: "教学生肖－元素标。" },
            { title: "打开祖尔海盘", body: "年标倾向出现。" },
            { title: "祖尔海指引", body: "年标对照焦点。" },
          ],
        },
        {
          intro: "你將輸入出生年、設定祖爾海年標，再打開教學盤傾向。",
          steps: [
            { title: "認識祖爾海", body: "年標 · 蒙古曆算。" },
            { title: "輸入出生年", body: "年種。" },
            { title: "設定祖爾海年標", body: "教學生肖－元素標。" },
            { title: "打開祖爾海盤", body: "年標傾向出現。" },
            { title: "祖爾海指引", body: "年標對照焦點。" },
          ],
        }
      ),
      steps: ["intent", "birthyear", "zurhaiMark", "zurhaiChart", "result"],
      viz: "zurhai",
      castCta: { en: "Open the Zurhai chart", zh: "打开祖尔海盘", hant: "打開祖爾海盤" },
      buildCast(state, rng) {
        const el = ELEMENTS.find((e) => e.en === state.tibElement) || pick(rng, ELEMENTS);
        const an = ANIMALS.find((a) => a.en === state.tibAnimal) || pick(rng, ANIMALS);
        return {
          year: state.birthYear || "",
          el,
          an,
          lean: loc({ en: `${loc(el.lean)} · ${loc(an.lean)}`, zh: `${loc(el.lean)}·${loc(an.lean)}` }),
        };
      },
      generate(q, cast) {
        const e = loc({ en: cast.el.en, zh: cast.el.zh });
        const a = loc({ en: cast.an.en, zh: cast.an.zh });
        return pack({
          title: `${cast.year || "—"} · ${e} ${a}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学祖尔海以年「${cast.year || "—"}」标「${e}${a}」，倾向「${cast.lean}」。真祖尔海需蒙古历表。`, `教學祖爾海以年「${cast.year || "—"}」標「${e}${a}」，傾向「${cast.lean}」。真祖爾海需蒙古曆表。`)
            : `Teaching Zurhai for year “${cast.year || "—"}” marks “${e} ${a}”, leaning “${cast.lean}”. Real Zurhai needs Mongolian tables.`,
          interpret: interpretQ(q || cast.year, cast.lean, isZh() ? "祖尔海年标" : "Zurhai year mark"),
          details: [String(cast.year || "—"), e, a],
          doList: [isZh() ? zhText(`按「${cast.lean}」推进一件可验证的下一步。`, `按「${cast.lean}」推進一件可驗證的下一步。`) : `Advance one verifiable next step matching “${cast.lean}”.`],
          dontList: [isZh() ? zhText("不要用年标羞辱他人出身。", "不要用年標羞辱他人出身。") : "Do not shame anyone’s birth year with Zurhai."],
          tone: "mixed",
          vizData: cast,
        });
      },
    },

    shagai: {
      summary: {
        en: "Shagai casts four sheep anklebones; the four faces (horse, camel, goat, sheep) counsel fortune and play.",
        zh: "羊踝骨占（沙盖）抛掷四枚羊踝骨，四面（马／驼／羊／绵）论吉凶与游戏。",
        hant: "羊踝骨占（沙蓋）拋擲四枚羊踝骨，四面（馬／駝／羊／綿）論吉凶與遊戲。",
      },
      how: howPack(
        {
          intro: "You’ll hold a question, toss teaching shagai, then read the face pattern.",
          steps: [
            { title: "Meet Shagai", body: "Anklebones · four faces." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Toss the bones", body: "Four teaching faces land." },
            { title: "Read the faces", body: "Pattern lean appears." },
            { title: "Shagai counsel", body: "Face lean for your question." },
          ],
        },
        {
          intro: "你将抱定问题、抛掷教学沙盖，再读四面格局。",
          steps: [
            { title: "认识沙盖", body: "踝骨 · 四面。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "抛掷踝骨", body: "四个教学面落下。" },
            { title: "读取四面", body: "格局倾向出现。" },
            { title: "沙盖指引", body: "面意对照问题。" },
          ],
        },
        {
          intro: "你將抱定問題、拋擲教學沙蓋，再讀四面格局。",
          steps: [
            { title: "認識沙蓋", body: "踝骨 · 四面。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "拋擲踝骨", body: "四個教學面落下。" },
            { title: "讀取四面", body: "格局傾向出現。" },
            { title: "沙蓋指引", body: "面意對照問題。" },
          ],
        }
      ),
      steps: ["intent", "question", "tossBones", "shagaiFaces", "result"],
      viz: "shagai",
      castCta: { en: "Read the faces", zh: "读取四面", hant: "讀取四面" },
      buildCast(state, rng) {
        const faces = [pick(rng, SHAGAI_FACES), pick(rng, SHAGAI_FACES), pick(rng, SHAGAI_FACES), pick(rng, SHAGAI_FACES)];
        const lead = faces[0];
        return { faces, lean: loc(lead.lean) };
      },
      generate(q, cast) {
        const names = cast.faces.map((f) => loc({ en: f.en, zh: f.zh }));
        return pack({
          title: names.join(" · "),
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学沙盖得「${names.join("、")}」，主导倾向「${cast.lean}」。真抛掷可作游戏与占问。`, `教學沙蓋得「${names.join("、")}」，主導傾向「${cast.lean}」。真拋擲可作遊戲與占問。`)
            : `Teaching shagai shows “${names.join(", ")}”, leading “${cast.lean}”. Real casts are both game and oracle.`,
          interpret: interpretQ(q, cast.lean, isZh() ? "沙盖四面" : "shagai faces"),
          details: names,
          doList: [isZh() ? zhText(`把「${cast.lean}」变成今天一个可逆试探。`, `把「${cast.lean}」變成今天一個可逆試探。`) : `Turn “${cast.lean}” into one reversible trial today.`],
          dontList: [isZh() ? zhText("不要因赌局伤害他人财物。", "不要因賭局傷害他人財物。") : "Do not harm others’ property over gambling casts."],
          tone: "mixed",
          vizData: cast,
        });
      },
    },

    "scapulimancy-asia": {
      summary: {
        en: "Central Asian scapulimancy heats shoulder blades for crack omens (educational heat/crack sim only — no real bones burned).",
        zh: "中亚灼骨占加热肩胛取裂纹兆（仅教育加热／裂纹模拟——无真实灼骨）。",
        hant: "中亞灼骨占加熱肩胛取裂紋兆（僅教育加熱／裂紋模擬——無真實灼骨）。",
      },
      how: howPack(
        {
          intro: "You’ll hold a question, heat the teaching scapula, then read the Asia crack lean.",
          steps: [
            { title: "Meet scapulimancy", body: "Blade · heat · crack." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Heat the scapula", body: "Teaching glow only." },
            { title: "Read the crack", body: "Pattern lean appears." },
            { title: "Scapula counsel", body: "Crack lean for your question." },
          ],
        },
        {
          intro: "你将抱定问题、加热教学肩胛，再读中亚裂纹倾向。",
          steps: [
            { title: "认识灼骨占", body: "肩胛 · 加热 · 裂纹。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "加热肩胛", body: "仅教学光热。" },
            { title: "读取裂纹", body: "纹路倾向出现。" },
            { title: "灼骨指引", body: "兆意对照问题。" },
          ],
        },
        {
          intro: "你將抱定問題、加熱教學肩胛，再讀中亞裂紋傾向。",
          steps: [
            { title: "認識灼骨占", body: "肩胛 · 加熱 · 裂紋。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "加熱肩胛", body: "僅教學光熱。" },
            { title: "讀取裂紋", body: "紋路傾向出現。" },
            { title: "灼骨指引", body: "兆意對照問題。" },
          ],
        }
      ),
      steps: ["intent", "question", "heatScapula", "asiaCrack", "result"],
      viz: "scapula",
      castCta: { en: "Read the crack", zh: "读取裂纹", hant: "讀取裂紋" },
      buildCast(state, rng) {
        const cracks = isZh()
          ? [
              { t: "直裂向东", l: "向光明处求证" },
              { t: "分叉双路", l: "两条路径各试一天" },
              { t: "细网碎裂", l: "细节过多·做减法" },
              { t: "横阻一截", l: "暂停硬推·改节奏" },
            ]
          : [
              { t: "Eastward split", l: "verify toward the clearer path" },
              { t: "Forked roads", l: "trial each path for a day" },
              { t: "Fine mesh", l: "too many details · simplify" },
              { t: "Cross block", l: "pause the hard push · change pace" },
            ];
        return { crack: pick(rng, cracks) };
      },
      generate(q, cast) {
        return pack({
          title: cast.crack.t,
          result: cast.crack.l,
          explain: isZh()
            ? zhText(`教学中亚灼骨示「${cast.crack.t}」，倾向「${cast.crack.l}」。无真实灼烧伤害。`, `教學中亞灼骨示「${cast.crack.t}」，傾向「${cast.crack.l}」。無真實灼燒傷害。`)
            : `Teaching Central Asian scapulimancy shows “${cast.crack.t}”, leaning “${cast.crack.l}”. No real bones are harmed.`,
          interpret: interpretQ(q, cast.crack.l, isZh() ? "灼骨裂纹" : "the scapula crack"),
          details: [cast.crack.t],
          doList: [isZh() ? zhText(`按「${cast.crack.l}」处理眼前一件卡住的事。`, `按「${cast.crack.l}」處理眼前一件卡住的事。`) : `Handle one stuck matter per “${cast.crack.l}”.`],
          dontList: [isZh() ? zhText("不要真实灼烧动物骨骼。", "不要真實灼燒動物骨骼。") : "Do not actually burn animal bones."],
          tone: /阻|碎|block|simplify|暂停/i.test(cast.crack.t + cast.crack.l) ? "caution" : "mixed",
          vizData: cast,
        });
      },
    },

    mahabote: {
      summary: {
        en: "Mahabote maps birth weekday onto an eightfold planetary house scheme used in Myanmar for character and timing.",
        zh: "缅甸星命（Mahabote）将出生星期映射到八重行星宫位，论性情与时机。",
        hant: "緬甸星命（Mahabote）將出生星期映射到八重行星宮位，論性情與時機。",
      },
      how: howPack(
        {
          intro: "You’ll pick a birth weekday, see the Mahabote house, then read the lean.",
          steps: [
            { title: "Meet Mahabote", body: "Weekday · eight houses." },
            { title: "Pick birth weekday", body: "Day under review." },
            { title: "See the Mahabote house", body: "Planetary house lights." },
            { title: "Read the house lean", body: "House counsel appears." },
            { title: "Mahabote counsel", body: "House lean for your focus." },
          ],
        },
        {
          intro: "你将点选出生星期、查看缅甸星命宫，再读宫位倾向。",
          steps: [
            { title: "认识缅甸星命", body: "星期 · 八宫。" },
            { title: "点选出生星期", body: "所问之日。" },
            { title: "查看星命宫", body: "行星宫点亮。" },
            { title: "读取宫位倾向", body: "宫位指引出现。" },
            { title: "缅甸星命指引", body: "宫意对照焦点。" },
          ],
        },
        {
          intro: "你將點選出生星期、查看緬甸星命宮，再讀宮位傾向。",
          steps: [
            { title: "認識緬甸星命", body: "星期 · 八宮。" },
            { title: "點選出生星期", body: "所問之日。" },
            { title: "查看星命宮", body: "行星宮點亮。" },
            { title: "讀取宮位傾向", body: "宮位指引出現。" },
            { title: "緬甸星命指引", body: "宮意對照焦點。" },
          ],
        }
      ),
      steps: ["intent", "weekdayPick", "mahaboteHouse", "mahaboteLean", "result"],
      viz: "mahabote",
      castCta: { en: "Read the house lean", zh: "读取宫位倾向", hant: "讀取宮位傾向" },
      buildCast(state, rng) {
        const day = WEEKDAYS.find((w) => w.id === Number(state.weekday)) || pick(rng, WEEKDAYS);
        const house = MAHABOTE[day.id % MAHABOTE.length];
        return { day, house, lean: loc(house.lean) };
      },
      generate(q, cast) {
        const d = loc({ en: cast.day.en, zh: cast.day.zh });
        const h = loc({ en: cast.house.en, zh: cast.house.zh });
        return pack({
          title: `${d} · ${h}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学缅甸星命以「${d}」入「${h}」，倾向「${cast.lean}」。真盘含更细生辰。`, `教學緬甸星命以「${d}」入「${h}」，傾向「${cast.lean}」。真盤含更細生辰。`)
            : `Teaching Mahabote places “${d}” in “${h}”, leaning “${cast.lean}”. Real charts use fuller birth data.`,
          interpret: interpretQ(q || d, cast.lean, isZh() ? "缅甸星命宫" : "Mahabote house"),
          details: [d, h],
          doList: [isZh() ? zhText(`按「${cast.lean}」安排本周一次行动。`, `按「${cast.lean}」安排本週一次行動。`) : `Schedule one weekly action matching “${cast.lean}”.`],
          dontList: [isZh() ? zhText("不要用星期标签羞辱他人。", "不要用星期標籤羞辱他人。") : "Do not shame others with weekday labels."],
          tone: "mixed",
          vizData: cast,
        });
      },
    },

    "thai-horasat": {
      summary: {
        en: "Thai Horasat is natal astrology rooted in Ayutthaya court tradition — houses and planets counsel life themes.",
        zh: "泰式占星（Horasat）源自阿瑜陀耶宫廷传统——以宫位与行星论人生主题。",
        hant: "泰式占星（Horasat）源自阿瑜陀耶宮廷傳統——以宮位與行星論人生主題。",
      },
      how: howPack(
        {
          intro: "You’ll enter birth date, pick a hora house lens, then reveal a teaching lean.",
          steps: [
            { title: "Meet Thai Horasat", body: "Houses · planets · counsel." },
            { title: "Enter birth date", body: "Chart seed." },
            { title: "Pick a hora house", body: "Teaching house choice." },
            { title: "Reveal the hora lean", body: "House lean appears." },
            { title: "Horasat counsel", body: "House lean for your focus." },
          ],
        },
        {
          intro: "你将输入生辰、选择时宫视角，再揭示教学倾向。",
          steps: [
            { title: "认识泰式占星", body: "宫位 · 行星 · 指引。" },
            { title: "输入出生日期", body: "盘种。" },
            { title: "选择时宫", body: "教学宫选择。" },
            { title: "揭示时宫倾向", body: "宫位倾向出现。" },
            { title: "泰式占星指引", body: "宫意对照焦点。" },
          ],
        },
        {
          intro: "你將輸入生辰、選擇時宮視角，再揭示教學傾向。",
          steps: [
            { title: "認識泰式占星", body: "宮位 · 行星 · 指引。" },
            { title: "輸入出生日期", body: "盤種。" },
            { title: "選擇時宮", body: "教學宮選擇。" },
            { title: "揭示時宮傾向", body: "宮位傾向出現。" },
            { title: "泰式占星指引", body: "宮意對照焦點。" },
          ],
        }
      ),
      steps: ["intent", "birth", "horaHouse", "horaReveal", "result"],
      viz: "hora",
      castCta: { en: "Reveal the hora lean", zh: "揭示时宫倾向", hant: "揭示時宮傾向" },
      buildCast(state, rng) {
        const houses = [
          { en: "Self house", zh: "命宫", lean: { en: "identity · presence", zh: "身份·现身", hant: "身份·現身" } },
          { en: "Wealth house", zh: "财宫", lean: { en: "resource pace", zh: "资源节奏", hant: "資源節奏" } },
          { en: "Sibling house", zh: "兄弟宫", lean: { en: "allies · skills", zh: "同侪·技艺", hant: "同儕·技藝" } },
          { en: "Home house", zh: "田宅宫", lean: { en: "roots · shelter", zh: "根基·庇护", hant: "根基·庇護" } },
          { en: "Child house", zh: "子女宫", lean: { en: "create · joy", zh: "创造·喜乐", hant: "創造·喜樂" } },
          { en: "Work house", zh: "奴仆宫", lean: { en: "service · health pace", zh: "服务·健康节奏", hant: "服務·健康節奏" } },
        ];
        const house = houses.find((h) => h.en === state.horaHouse) || pick(rng, houses);
        return { birth: state.birthDate || "", house, lean: loc(house.lean) };
      },
      generate(q, cast) {
        const h = loc({ en: cast.house.en, zh: cast.house.zh });
        return pack({
          title: `${cast.birth || "—"} · ${h}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学泰式占星以「${cast.birth || "—"}」看「${h}」，倾向「${cast.lean}」。真盘需精确时辰。`, `教學泰式占星以「${cast.birth || "—"}」看「${h}」，傾向「${cast.lean}」。真盤需精確時辰。`)
            : `Teaching Thai Horasat for “${cast.birth || "—"}” shows “${h}”, leaning “${cast.lean}”. Real charts need exact birth time.`,
          interpret: interpretQ(q, cast.lean, isZh() ? "泰式时宫" : "Thai hora house"),
          details: [cast.birth || "—", h],
          doList: [isZh() ? zhText(`围绕「${cast.lean}」做一件本周可验证的小事。`, `圍繞「${cast.lean}」做一件本週可驗證的小事。`) : `Do one verifiable small act this week around “${cast.lean}”.`],
          dontList: [isZh() ? zhText("不要把教学宫当成绝对命运判决。", "不要把教學宮當成絕對命運判決。") : "Do not treat a teaching house as an absolute fate verdict."],
          tone: "deep",
          vizData: cast,
        });
      },
    },

    "thai-weekday": {
      summary: {
        en: "Thai weekday divination links birth day to guardian Buddha themes and lucky colors for character counsel.",
        zh: "泰式星期命运将出生日与守护佛主题、幸运色相连，论性情指引。",
        hant: "泰式星期命運將出生日與守護佛主題、幸運色相連，論性情指引。",
      },
      how: howPack(
        {
          intro: "You’ll pick a weekday, see color–Buddha pairing, then read the day counsel.",
          steps: [
            { title: "Meet Thai weekday lore", body: "Day · color · guardian." },
            { title: "Pick a weekday", body: "Birth day under review." },
            { title: "See color–Buddha", body: "Pairing lights." },
            { title: "Read the day counsel", body: "Color lean appears." },
            { title: "Weekday counsel", body: "Lean for your focus." },
          ],
        },
        {
          intro: "你将点选星期、查看色－佛配对，再读日辰指引。",
          steps: [
            { title: "认识泰式星期", body: "日 · 色 · 守护。" },
            { title: "点选星期", body: "所问出生日。" },
            { title: "查看色－佛", body: "配对点亮。" },
            { title: "读取日辰指引", body: "色带倾向出现。" },
            { title: "星期指引", body: "倾向对照焦点。" },
          ],
        },
        {
          intro: "你將點選星期、查看色－佛配對，再讀日辰指引。",
          steps: [
            { title: "認識泰式星期", body: "日 · 色 · 守護。" },
            { title: "點選星期", body: "所問出生日。" },
            { title: "查看色－佛", body: "配對點亮。" },
            { title: "讀取日辰指引", body: "色帶傾向出現。" },
            { title: "星期指引", body: "傾向對照焦點。" },
          ],
        }
      ),
      steps: ["intent", "weekdayThai", "colorBuddha", "thaiDayCounsel", "result"],
      viz: "thaiday",
      castCta: { en: "Read the day counsel", zh: "读取日辰指引", hant: "讀取日辰指引" },
      buildCast(state, rng) {
        const day = WEEKDAYS.find((w) => w.id === Number(state.weekday)) || pick(rng, WEEKDAYS);
        const color = THAI_COLORS[day.id % THAI_COLORS.length];
        return { day, color, lean: loc(color.lean) };
      },
      generate(q, cast) {
        const d = loc({ en: cast.day.en, zh: cast.day.zh });
        const c = loc({ en: cast.color.en, zh: cast.color.zh });
        return pack({
          title: `${d} · ${c}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学泰式星期以「${d}」配「${c}」，倾向「${cast.lean}」。幸运色是民俗镜子，不是法令。`, `教學泰式星期以「${d}」配「${c}」，傾向「${cast.lean}」。幸運色是民俗鏡子，不是法令。`)
            : `Teaching Thai weekday pairs “${d}” with “${c}”, leaning “${cast.lean}”. Lucky colors are folk mirrors, not law.`,
          interpret: interpretQ(q || d, cast.lean, isZh() ? "泰式星期色" : "Thai weekday color"),
          details: [d, c],
          doList: [isZh() ? zhText(`今天用「${cast.lean}」做一件善意小事。`, `今天用「${cast.lean}」做一件善意小事。`) : `Do one kind small act today matching “${cast.lean}”.`],
          dontList: [isZh() ? zhText("不要因幸运色排斥他人穿着。", "不要因幸運色排斥他人穿著。") : "Do not police others’ clothing over lucky colors."],
          tone: "bright",
          vizData: cast,
        });
      },
    },

    taksa: {
      summary: {
        en: "Taksa (Thai naming astrology) counsels lucky and unlucky letters for names from the weekday of birth.",
        zh: "泰式命名占星（Taksa）依出生星期论姓名用字的吉凶字母倾向。",
        hant: "泰式命名占星（Taksa）依出生星期論姓名用字的吉凶字母傾向。",
      },
      how: howPack(
        {
          intro: "You’ll pick a birth weekday, see the letter band, then read naming counsel.",
          steps: [
            { title: "Meet Taksa", body: "Weekday · letters · name." },
            { title: "Pick birth weekday", body: "Day seed." },
            { title: "See the letter band", body: "Auspicious / care bands." },
            { title: "Read naming counsel", body: "Band lean appears." },
            { title: "Taksa counsel", body: "Letter lean for your name ask." },
          ],
        },
        {
          intro: "你将点选出生星期、查看字母色带，再读命名指引。",
          steps: [
            { title: "认识泰式命名", body: "星期 · 字母 · 姓名。" },
            { title: "点选出生星期", body: "日种。" },
            { title: "查看字母色带", body: "吉／慎色带。" },
            { title: "读取命名指引", body: "色带倾向出现。" },
            { title: "命名指引", body: "字母倾向对照所问。" },
          ],
        },
        {
          intro: "你將點選出生星期、查看字母色帶，再讀命名指引。",
          steps: [
            { title: "認識泰式命名", body: "星期 · 字母 · 姓名。" },
            { title: "點選出生星期", body: "日種。" },
            { title: "查看字母色帶", body: "吉／慎色帶。" },
            { title: "讀取命名指引", body: "色帶傾向出現。" },
            { title: "命名指引", body: "字母傾向對照所問。" },
          ],
        }
      ),
      steps: ["intent", "weekdayTaksa", "letterBand", "taksaName", "result"],
      viz: "taksa",
      castCta: { en: "Read naming counsel", zh: "读取命名指引", hant: "讀取命名指引" },
      buildCast(state, rng) {
        const day = WEEKDAYS.find((w) => w.id === Number(state.weekday)) || pick(rng, WEEKDAYS);
        const band = TAKSA_BANDS[day.id % TAKSA_BANDS.length];
        return { day, band, lean: loc(band.lean) };
      },
      generate(q, cast) {
        const d = loc({ en: cast.day.en, zh: cast.day.zh });
        const b = loc({ en: cast.band.en, zh: cast.band.zh });
        return pack({
          title: `${d} · ${b}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学泰式命名以「${d}」得「${b}」，倾向「${cast.lean}」。改名需尊重本人意愿与法律。`, `教學泰式命名以「${d}」得「${b}」，傾向「${cast.lean}」。改名需尊重本人意願與法律。`)
            : `Teaching Taksa for “${d}” shows “${b}”, leaning “${cast.lean}”. Renaming needs the person’s consent and the law.`,
          interpret: interpretQ(q || d, cast.lean, isZh() ? "泰式命名字母" : "Taksa letter band"),
          details: [d, b],
          doList: [isZh() ? zhText(`试写一个呼应「${cast.lean}」的昵称方案（不强制启用）。`, `試寫一個呼應「${cast.lean}」的暱稱方案（不強制啟用）。`) : `Draft one nickname option matching “${cast.lean}” (no forced use).`],
          dontList: [isZh() ? zhText("不要强迫他人改名。", "不要強迫他人改名。") : "Do not force anyone to change their name."],
          tone: /慎|Care|soften/i.test(b + cast.lean) ? "caution" : "bright",
          vizData: cast,
        });
      },
    },

    "khmer-hora": {
      summary: {
        en: "Khmer Horasastra is Cambodian horoscopic tradition associated with Angkor-era learning — signs counsel life themes.",
        zh: "高棉星命（Horasastra）是与吴哥学问相关的柬埔寨星命传统——以星座论人生主题。",
        hant: "高棉星命（Horasastra）是與吳哥學問相關的柬埔寨星命傳統——以星座論人生主題。",
      },
      how: howPack(
        {
          intro: "You’ll enter birth date, pick a Khmer sign lens, then open a teaching board.",
          steps: [
            { title: "Meet Khmer Horasastra", body: "Signs · houses · counsel." },
            { title: "Enter birth date", body: "Chart seed." },
            { title: "Pick a Khmer sign", body: "Teaching sign choice." },
            { title: "Open the Khmer board", body: "Sign lean appears." },
            { title: "Khmer counsel", body: "Sign lean for your focus." },
          ],
        },
        {
          intro: "你将输入生辰、选择高棉星座视角，再打开教学盘。",
          steps: [
            { title: "认识高棉星命", body: "星座 · 宫位 · 指引。" },
            { title: "输入出生日期", body: "盘种。" },
            { title: "选择高棉星座", body: "教学星座选择。" },
            { title: "打开高棉盘", body: "星座倾向出现。" },
            { title: "高棉星命指引", body: "星意对照焦点。" },
          ],
        },
        {
          intro: "你將輸入生辰、選擇高棉星座視角，再打開教學盤。",
          steps: [
            { title: "認識高棉星命", body: "星座 · 宮位 · 指引。" },
            { title: "輸入出生日期", body: "盤種。" },
            { title: "選擇高棉星座", body: "教學星座選擇。" },
            { title: "打開高棉盤", body: "星座傾向出現。" },
            { title: "高棉星命指引", body: "星意對照焦點。" },
          ],
        }
      ),
      steps: ["intent", "birth", "khmerSign", "khmerBoard", "result"],
      viz: "khmer",
      castCta: { en: "Open the Khmer board", zh: "打开高棉盘", hant: "打開高棉盤" },
      buildCast(state, rng) {
        const signs = [
          { en: "Meṣa-like", zh: "白羊意", lean: { en: "start boldly", zh: "大胆起步", hant: "大膽起步" } },
          { en: "Vṛṣabha-like", zh: "金牛意", lean: { en: "steady build", zh: "稳健积累", hant: "穩健積累" } },
          { en: "Mithuna-like", zh: "双子意", lean: { en: "talk · twin paths", zh: "言谈·双径", hant: "言談·雙徑" } },
          { en: "Karka-like", zh: "巨蟹意", lean: { en: "home · protect", zh: "家·守护", hant: "家·守護" } },
          { en: "Siṃha-like", zh: "狮子意", lean: { en: "lead · warm", zh: "带领·温暖", hant: "帶領·溫暖" } },
          { en: "Kanyā-like", zh: "处女意", lean: { en: "refine detail", zh: "精炼细节", hant: "精煉細節" } },
        ];
        const sign = signs.find((s) => s.en === state.khmerSign) || pick(rng, signs);
        return { birth: state.birthDate || "", sign, lean: loc(sign.lean) };
      },
      generate(q, cast) {
        const s = loc({ en: cast.sign.en, zh: cast.sign.zh });
        return pack({
          title: `${cast.birth || "—"} · ${s}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学高棉星命以「${cast.birth || "—"}」见「${s}」，倾向「${cast.lean}」。真盘需高棉历算。`, `教學高棉星命以「${cast.birth || "—"}」見「${s}」，傾向「${cast.lean}」。真盤需高棉曆算。`)
            : `Teaching Khmer Horasastra for “${cast.birth || "—"}” shows “${s}”, leaning “${cast.lean}”. Real charts need Khmer calendar math.`,
          interpret: interpretQ(q, cast.lean, isZh() ? "高棉星座" : "Khmer sign"),
          details: [cast.birth || "—", s],
          doList: [isZh() ? zhText(`按「${cast.lean}」安排一次可逆试探。`, `按「${cast.lean}」安排一次可逆試探。`) : `Schedule one reversible trial matching “${cast.lean}”.`],
          dontList: [isZh() ? zhText("不要用星座标签羞辱他人。", "不要用星座標籤羞辱他人。") : "Do not shame others with sign labels."],
          tone: "mixed",
          vizData: cast,
        });
      },
    },

    "lao-calendar": {
      summary: {
        en: "Lao calendar divination reads auspiciousness for rites and travel from traditional Lao calendrical marks.",
        zh: "老挝历算依传统历注论仪轨与出行的吉凶倾向。",
        hant: "老撾曆算依傳統曆註論儀軌與出行的吉凶傾向。",
      },
      how: howPack(
        {
          intro: "You’ll pick a day, see Lao day quality, then read the counsel.",
          steps: [
            { title: "Meet Lao calendar lore", body: "Day marks · travel · rites." },
            { title: "Pick a day", body: "Date under review." },
            { title: "See Lao day quality", body: "Quality lights." },
            { title: "Read the day counsel", body: "Quality lean appears." },
            { title: "Lao counsel", body: "Lean for your purpose." },
          ],
        },
        {
          intro: "你将点选日期、查看老挝日质，再读日辰指引。",
          steps: [
            { title: "认识老挝历算", body: "日注 · 出行 · 仪轨。" },
            { title: "点选日期", body: "所问之日。" },
            { title: "查看老挝日质", body: "日质点亮。" },
            { title: "读取日辰指引", body: "日质倾向出现。" },
            { title: "老挝历算指引", body: "倾向对照目的。" },
          ],
        },
        {
          intro: "你將點選日期、查看老撾日質，再讀日辰指引。",
          steps: [
            { title: "認識老撾曆算", body: "日註 · 出行 · 儀軌。" },
            { title: "點選日期", body: "所問之日。" },
            { title: "查看老撾日質", body: "日質點亮。" },
            { title: "讀取日辰指引", body: "日質傾向出現。" },
            { title: "老撾曆算指引", body: "傾向對照目的。" },
          ],
        }
      ),
      steps: ["intent", "daypickLao", "laoQuality", "laoCounsel", "result"],
      viz: "lao",
      castCta: { en: "Read the day counsel", zh: "读取日辰指引", hant: "讀取日辰指引" },
      buildCast(state, rng) {
        const quals = [
          { en: "Good for starts", zh: "宜开事", lean: { en: "open soft starts", zh: "轻开新局", hant: "輕開新局" } },
          { en: "Travel fair", zh: "宜出行", lean: { en: "go with a buffer", zh: "出行留缓冲", hant: "出行留緩衝" } },
          { en: "Rest preferred", zh: "宜歇", lean: { en: "close loops · rest", zh: "收尾·歇息", hant: "收尾·歇息" } },
          { en: "Care day", zh: "慎日", lean: { en: "delay hard contracts", zh: "延后硬约", hant: "延後硬約" } },
        ];
        const q = pick(rng, quals);
        return { date: state.dayDate || "", q, lean: loc(q.lean) };
      },
      generate(q, cast) {
        const name = loc({ en: cast.q.en, zh: cast.q.zh });
        return pack({
          title: `${cast.date || "—"} · ${name}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学老挝历算于「${cast.date || "未选日"}」示「${name}」，倾向「${cast.lean}」。真历注依当地通书。`, `教學老撾曆算於「${cast.date || "未選日"}」示「${name}」，傾向「${cast.lean}」。真曆註依當地通書。`)
            : `Teaching Lao calendar on “${cast.date || "unset day"}” shows “${name}”, leaning “${cast.lean}”. Real marks follow a local almanac.`,
          interpret: interpretQ(q || cast.date, cast.lean, isZh() ? "老挝历注" : "Lao day quality"),
          details: [cast.date || "—", name],
          doList: [isZh() ? zhText(`按「${cast.lean}」安排今天一个时间块。`, `按「${cast.lean}」安排今天一個時間塊。`) : `Schedule one time block today matching “${cast.lean}”.`],
          dontList: [isZh() ? zhText("不要因历注取消必要医疗预约。", "不要因曆註取消必要醫療預約。") : "Do not cancel needed medical appointments over day marks."],
          tone: /慎|Care|delay|延/i.test(name + cast.lean) ? "caution" : "mixed",
          vizData: cast,
        });
      },
    },

    weton: {
      summary: {
        en: "Javanese Weton combines the five-day pasaran market cycle with the seven-day week for birth weight and character counsel.",
        zh: "爪哇湿日（Weton）将五日市集周与七日星期合成，论出生“重量”与性情指引。",
        hant: "爪哇濕日（Weton）將五日市集週與七日星期合成，論出生「重量」與性情指引。",
      },
      how: howPack(
        {
          intro: "You’ll enter birth date, pick a pasaran day, then read the weton weight lean.",
          steps: [
            { title: "Meet Weton", body: "Pasaran · weekday · weight." },
            { title: "Enter birth date", body: "Cycle seed." },
            { title: "Pick a pasaran day", body: "Market-day lens." },
            { title: "Read weton weight", body: "Weight lean appears." },
            { title: "Weton counsel", body: "Weight lean for your focus." },
          ],
        },
        {
          intro: "你将输入生辰、选择市集日，再读湿日重量倾向。",
          steps: [
            { title: "认识湿日", body: "市集日 · 星期 · 重量。" },
            { title: "输入出生日期", body: "周期种。" },
            { title: "选择市集日", body: "市集日视角。" },
            { title: "读取湿日重量", body: "重量倾向出现。" },
            { title: "湿日指引", body: "重量对照焦点。" },
          ],
        },
        {
          intro: "你將輸入生辰、選擇市集日，再讀濕日重量傾向。",
          steps: [
            { title: "認識濕日", body: "市集日 · 星期 · 重量。" },
            { title: "輸入出生日期", body: "週期種。" },
            { title: "選擇市集日", body: "市集日視角。" },
            { title: "讀取濕日重量", body: "重量傾向出現。" },
            { title: "濕日指引", body: "重量對照焦點。" },
          ],
        }
      ),
      steps: ["intent", "birth", "pasaranPick", "wetonWeight", "result"],
      viz: "weton",
      castCta: { en: "Read weton weight", zh: "读取湿日重量", hant: "讀取濕日重量" },
      buildCast(state, rng) {
        const pas = PASARAN.find((p) => p.en === state.pasaran) || pick(rng, PASARAN);
        const weight = 7 + Math.floor(rng() * 12);
        return { birth: state.birthDate || "", pas, weight, lean: loc(pas.lean) };
      },
      generate(q, cast) {
        const p = loc({ en: cast.pas.en, zh: cast.pas.zh });
        return pack({
          title: `${p} · ${cast.weight}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学湿日以「${cast.birth || "—"}」得「${p}」重量示意 ${cast.weight}，倾向「${cast.lean}」。真湿日用于合婚与择日。`, `教學濕日以「${cast.birth || "—"}」得「${p}」重量示意 ${cast.weight}，傾向「${cast.lean}」。真濕日用於合婚與擇日。`)
            : `Teaching weton for “${cast.birth || "—"}” shows “${p}” with weight hint ${cast.weight}, leaning “${cast.lean}”. Real weton is used for matching and day-picking.`,
          interpret: interpretQ(q, cast.lean, isZh() ? "爪哇湿日" : "Javanese weton"),
          details: [cast.birth || "—", p, String(cast.weight)],
          doList: [isZh() ? zhText(`按「${cast.lean}」安排一次温和会面。`, `按「${cast.lean}」安排一次溫和會面。`) : `Arrange one gentle meeting matching “${cast.lean}”.`],
          dontList: [isZh() ? zhText("不要用湿日分数羞辱合婚对象。", "不要用濕日分數羞辱合婚對象。") : "Do not shame match partners with weton scores."],
          tone: "mixed",
          vizData: cast,
        });
      },
    },

    pawukon: {
      summary: {
        en: "Pawukon is Bali’s 210-day combinatorial calendar — overlapping weeks counsel destiny themes and ritual timing.",
        zh: "巴厘帕乌贡历是二百一十日组合历——多重周次论命运主题与仪轨时机。",
        hant: "峇里帕烏貢曆是二百一十日組合曆——多重週次論命運主題與儀軌時機。",
      },
      how: howPack(
        {
          intro: "You’ll pick a day, see the uku week lens, then read pawukon counsel.",
          steps: [
            { title: "Meet Pawukon", body: "210-day · uku weeks." },
            { title: "Pick a day", body: "Date under review." },
            { title: "See the uku week", body: "Week lens lights." },
            { title: "Read pawukon counsel", body: "Week lean appears." },
            { title: "Pawukon counsel", body: "Lean for your purpose." },
          ],
        },
        {
          intro: "你将点选日期、查看乌库周视角，再读帕乌贡指引。",
          steps: [
            { title: "认识帕乌贡历", body: "二百一十日 · 乌库周。" },
            { title: "点选日期", body: "所问之日。" },
            { title: "查看乌库周", body: "周次视角点亮。" },
            { title: "读取帕乌贡指引", body: "周次倾向出现。" },
            { title: "帕乌贡指引", body: "倾向对照目的。" },
          ],
        },
        {
          intro: "你將點選日期、查看烏庫週視角，再讀帕烏貢指引。",
          steps: [
            { title: "認識帕烏貢曆", body: "二百一十日 · 烏庫週。" },
            { title: "點選日期", body: "所問之日。" },
            { title: "查看烏庫週", body: "週次視角點亮。" },
            { title: "讀取帕烏貢指引", body: "週次傾向出現。" },
            { title: "帕烏貢指引", body: "傾向對照目的。" },
          ],
        }
      ),
      steps: ["intent", "daypickPawukon", "ukuWeek", "pawukonCounsel", "result"],
      viz: "pawukon",
      castCta: { en: "Read pawukon counsel", zh: "读取帕乌贡指引", hant: "讀取帕烏貢指引" },
      buildCast(state, rng) {
        const uku = UKU.find((u) => u.en === state.ukuWeek) || pick(rng, UKU);
        return { date: state.dayDate || "", uku, lean: loc(uku.lean) };
      },
      generate(q, cast) {
        const u = loc({ en: cast.uku.en, zh: cast.uku.zh });
        return pack({
          title: `${cast.date || "—"} · ${u}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学帕乌贡于「${cast.date || "未选日"}」见「${u}」，倾向「${cast.lean}」。真历需完整组合周次。`, `教學帕烏貢於「${cast.date || "未選日"}」見「${u}」，傾向「${cast.lean}」。真曆需完整組合週次。`)
            : `Teaching pawukon on “${cast.date || "unset day"}” shows “${u}”, leaning “${cast.lean}”. Real calendars need full combinatorial weeks.`,
          interpret: interpretQ(q || cast.date, cast.lean, isZh() ? "帕乌贡乌库周" : "pawukon uku week"),
          details: [cast.date || "—", u],
          doList: [isZh() ? zhText(`按「${cast.lean}」安排一次仪轨或专注时段。`, `按「${cast.lean}」安排一次儀軌或專注時段。`) : `Schedule one ritual or focus block matching “${cast.lean}”.`],
          dontList: [isZh() ? zhText("不要因历注打断他人必要工作。", "不要因曆註打斷他人必要工作。") : "Do not disrupt others’ needed work over calendar lore."],
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
            "本站为教育性游玩——不能替代受训历算／骰占／择日、医疗、法律或安全判断。",
            "本站為教育性遊玩——不能替代受訓曆算／骰占／擇日、醫療、法律或安全判斷。"
          )
        : "Educational play on this site — not a substitute for trained calendar/dice/muhūrta practice, medicine, law, or safety judgment.",
    };
  }
  function runCast(id, state) {
    const rite = RITES[id];
    if (!rite) return null;
    const rng = mulberry32(
      seedFrom(state.question || state.personName || state.birthDate || state.birthYear || state.dayDate, state.nonce, id)
    );
    const cast = Object.assign({}, state.cast || {}, rite.buildCast(state, rng) || {});
    return rite.generate(state.question || state.focus || state.personName || "", cast, rng);
  }

  window.FatumHimalayaSeaOracles = { IDS, has, get, howFor, runCast, loc };
})();
