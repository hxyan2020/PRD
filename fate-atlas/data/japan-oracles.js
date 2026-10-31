/**
 * Japanese destiny, almanac, and omen oracles — unique steps, visuals, readings.
 * Omikuji · Onmyōdō · Rokuyō · Seimei · Sanmeigaku · Shichū · Nine Star Ki ·
 * Futomani · Kiboku · Kasō · Chabashira · Sukuyō
 */
(function () {
  "use strict";

  const IDS = [
    "omikuji",
    "onmyodo",
    "rokuyo",
    "seimei",
    "sanmeigaku",
    "shichu",
    "nine-star-ki",
    "futomani",
    "kiboku",
    "kaso",
    "chabashira",
    "sukuyo",
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
      kind: "japan",
      ...r,
      disclaimer: isZh()
        ? zhText(
            "教育性模拟——不能替代受训阴阳道／神社／命理实践，也不能替代医疗、法律或安全判断。可能不准确；无法预测黑天鹅事件。",
            "教育性模擬——不能替代受訓陰陽道／神社／命理實踐，也不能替代醫療、法律或安全判斷。可能不準確；無法預測黑天鵝事件。"
          )
        : "Educational simulation — not a substitute for trained onmyōdō/shrine/meishin practice, medicine, law, or safety judgment. May be inaccurate; cannot predict black swan events.",
    };
    return RM ? RM.structuredReading(base) : base;
  }
  function interpretQ(q, lean, mechanic) {
    const RM = window.FatumResultModel;
    const body = isZh()
      ? zhText(
          `你问的是「${q || "未写明的事"}」。以${mechanic}给出的「${lean}」倾向为镜：先改一件你能控制的安排，再用日常证据核对——不要把模拟签当作外在命令。`,
          `你問的是「${q || "未寫明的事"}」。以${mechanic}給出的「${lean}」傾向為鏡：先改一件你能控制的安排，再用日常證據核對——不要把模擬籤當作外在命令。`
        )
      : `You asked about “${q || "an unnamed matter"}”. Hold the “${lean}” lean from ${mechanic} as a mirror: change one arrangement you control, then check ordinary evidence — do not treat a simulated lot as an external order.`;
    return RM ? RM.interpretWithQuestion(q, body) : body;
  }

  const OMIKUJI = [
    { en: "Daikichi", zh: "大吉", lean: { en: "open boldly · stay kind", zh: "大胆开路·保持善意", hant: "大膽開路·保持善意" } },
    { en: "Chūkichi", zh: "中吉", lean: { en: "steady gain · finish one thread", zh: "稳进·收完一条线", hant: "穩進·收完一條線" } },
    { en: "Shōkichi", zh: "小吉", lean: { en: "small win · protect it", zh: "小胜·护住它", hant: "小勝·護住它" } },
    { en: "Suekichi", zh: "末吉", lean: { en: "late bloom · wait the beat", zh: "晚成·等节拍", hant: "晚成·等節拍" } },
    { en: "Kyō", zh: "凶", lean: { en: "reduce risk · ask help", zh: "减险·求助", hant: "減險·求助" } },
  ];
  const ROKUYO = [
    { id: "taian", en: "Taian", zh: "大安", lean: { en: "good for starts", zh: "宜开事", hant: "宜開事" } },
    { id: "shakko", en: "Shakkō", zh: "赤口", lean: { en: "watch noon disputes", zh: "慎午间口舌", hant: "慎午間口舌" } },
    { id: "sensho", en: "Senshō", zh: "先胜", lean: { en: "act in the morning", zh: "宜上午行动", hant: "宜上午行動" } },
    { id: "tomobiki", en: "Tomobiki", zh: "友引", lean: { en: "share · avoid funerals", zh: "宜分享·忌葬", hant: "宜分享·忌葬" } },
    { id: "senbu", en: "Sembu", zh: "先负", lean: { en: "afternoon better", zh: "宜下午", hant: "宜下午" } },
    { id: "butsumetsu", en: "Butsumetsu", zh: "佛灭", lean: { en: "rest · close loops", zh: "宜休整·收尾", hant: "宜休整·收尾" } },
  ];
  const STARS9 = [
    { n: 1, en: "One White", zh: "一白", lean: { en: "water talk · support", zh: "水运·言谈助力", hant: "水運·言談助力" } },
    { n: 2, en: "Two Black", zh: "二黑", lean: { en: "earth care · health pace", zh: "土养·健康节奏", hant: "土養·健康節奏" } },
    { n: 3, en: "Three Jade", zh: "三碧", lean: { en: "wood start · watch quarrel", zh: "木起·防争", hant: "木起·防爭" } },
    { n: 4, en: "Four Green", zh: "四绿", lean: { en: "study · soft breeze", zh: "文昌·柔风", hant: "文昌·柔風" } },
    { n: 5, en: "Five Yellow", zh: "五黄", lean: { en: "center weight · simplify", zh: "中宫重·做减法", hant: "中宮重·做減法" } },
    { n: 6, en: "Six White", zh: "六白", lean: { en: "metal lead · travel", zh: "金令·远行", hant: "金令·遠行" } },
    { n: 7, en: "Seven Red", zh: "七赤", lean: { en: "change · cut clean", zh: "变动·利落切割", hant: "變動·利落切割" } },
    { n: 8, en: "Eight White", zh: "八白", lean: { en: "wealth mountain · build", zh: "财山·积累", hant: "財山·積累" } },
    { n: 9, en: "Nine Purple", zh: "九紫", lean: { en: "fire joy · be seen", zh: "火喜·可见", hant: "火喜·可見" } },
  ];
  const GOGYO = [
    { en: "Wood", zh: "木", lean: { en: "grow · begin", zh: "生发·起势", hant: "生發·起勢" } },
    { en: "Fire", zh: "火", lean: { en: "show · brighten", zh: "显扬·开明", hant: "顯揚·開明" } },
    { en: "Earth", zh: "土", lean: { en: "stabilize · hold", zh: "安住·守成", hant: "安住·守成" } },
    { en: "Metal", zh: "金", lean: { en: "refine · decide", zh: "收敛·决断", hant: "收斂·決斷" } },
    { en: "Water", zh: "水", lean: { en: "flow · listen", zh: "流动·倾听", hant: "流動·傾聽" } },
  ];
  const MANSIONS = [
    { en: "Krittikā-like lodge", zh: "昴宿意", lean: { en: "craft · spark", zh: "技艺·火花", hant: "技藝·火花" } },
    { en: "Rohiṇī-like lodge", zh: "毕宿意", lean: { en: "nourish · stay", zh: "滋养·安住", hant: "滋養·安住" } },
    { en: "Mṛga-like lodge", zh: "参宿意", lean: { en: "seek · scout", zh: "寻视·探路", hant: "尋視·探路" } },
    { en: "Punarvasu-like lodge", zh: "井宿意", lean: { en: "return · renew", zh: "回返·更新", hant: "回返·更新" } },
  ];
  const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

  function pillarsFromDate(dateStr, rng) {
    const d = dateStr ? new Date(dateStr + "T12:00:00") : new Date();
    const y = d.getFullYear() || 2000;
    const m = (d.getMonth?.() ?? 0) + 1;
    const day = d.getDate?.() || 1;
    const hourIdx = Math.floor(rng() * 12);
    return {
      yearP: STEMS[y % 10] + BRANCHES[y % 12],
      monthP: STEMS[(y * 2 + m) % 10] + BRANCHES[(m + 1) % 12],
      dayP: STEMS[(y + day) % 10] + BRANCHES[(day + m) % 12],
      hourP: STEMS[(day + hourIdx) % 10] + BRANCHES[hourIdx],
      hourIdx,
    };
  }

  function howPack(en, zh, hant) {
    return { en, zh, hant: hant || zh };
  }

  const RITES = {
    omikuji: {
      summary: {
        en: "Omikuji are shrine fortune slips drawn at random — grades from daikichi (great blessing) to kyō (curse) with short counsel verses.",
        zh: "御神签是神社随机抽取的签文——从大吉到凶，并附简短劝诫。",
        hant: "御神籤是神社隨機抽取的籤文——從大吉到凶，並附簡短勸誡。",
      },
      how: howPack(
        {
          intro: "You’ll hold a question, shake the tube, then draw a teaching slip grade.",
          steps: [
            { title: "Meet Omikuji", body: "Shrine slips · grades · counsel verse." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Shake the tube", body: "The cylinder rattles." },
            { title: "Draw the slip", body: "A grade settles." },
            { title: "Slip counsel", body: "Grade lean for your question." },
          ],
        },
        {
          intro: "你将抱定问题、摇签筒，再抽得教学签等。",
          steps: [
            { title: "认识御神签", body: "神社签 · 等级 · 劝诫。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "摇动签筒", body: "筒身作响。" },
            { title: "抽出签文", body: "签等落下。" },
            { title: "签文指引", body: "签等倾向对照问题。" },
          ],
        },
        {
          intro: "你將抱定問題、搖籤筒，再抽得教學籤等。",
          steps: [
            { title: "認識御神籤", body: "神社籤 · 等級 · 勸誡。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "搖動籤筒", body: "筒身作響。" },
            { title: "抽出籤文", body: "籤等落下。" },
            { title: "籤文指引", body: "籤等傾向對照問題。" },
          ],
        }
      ),
      steps: ["intent", "question", "shakeTube", "drawSlip", "result"],
      viz: "omikuji",
      castCta: { en: "Draw the slip", zh: "抽出签文", hant: "抽出籤文" },
      buildCast(state, rng) {
        const slip = pick(rng, OMIKUJI);
        return { slip, lean: loc(slip.lean), n: 1 + Math.floor(rng() * 50) };
      },
      generate(q, cast) {
        const g = loc({ en: cast.slip.en, zh: cast.slip.zh });
        return pack({
          title: `${g} · №${cast.n}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学御神签得「${g}」（№${cast.n}），倾向「${cast.lean}」。真签在神社；此处为签等教育。`, `教學御神籤得「${g}」（№${cast.n}），傾向「${cast.lean}」。真籤在神社；此處為籤等教育。`)
            : `Teaching omikuji draws “${g}” (№${cast.n}), leaning “${cast.lean}”. Real slips are at shrines; grade education here.`,
          interpret: interpretQ(q, cast.lean, isZh() ? zhText("御神签", "御神籤") : "omikuji"),
          details: [g, `№${cast.n}`],
          doList: [isZh() ? zhText(`按「${cast.lean}」做一件今天可完成的小事。`, `按「${cast.lean}」做一件今天可完成的小事。`) : `Do one small today-action matching “${cast.lean}”.`],
          dontList: [isZh() ? zhText("不要因凶签自伤或伤害他人。", "不要因凶籤自傷或傷害他人。") : "Do not harm yourself or others over a kyō slip."],
          tone: /凶|Kyō|risk/i.test(g + cast.lean) ? "caution" : "bright",
          vizData: cast,
        });
      },
    },

    onmyodo: {
      summary: {
        en: "Onmyōdō almanac arts from the Heian yin-yang bureau — day quality, directional taboos (hōi), and calendar counsel.",
        zh: "阴阳道通书源自平安阴阳寮——论日辰、方位禁忌（方忌）与历注指引。",
        hant: "陰陽道通書源自平安陰陽寮——論日辰、方位禁忌（方忌）與曆註指引。",
      },
      how: howPack(
        {
          intro: "You’ll pick a day, set a direction lens, then read a teaching almanac note.",
          steps: [
            { title: "Meet Onmyōdō", body: "Calendar · hōi · day notes." },
            { title: "Pick a day", body: "The date under review." },
            { title: "Set a direction", body: "Which way are you moving?" },
            { title: "Read the almanac note", body: "A teaching gloss appears." },
            { title: "Almanac counsel", body: "Note lean for your plan." },
          ],
        },
        {
          intro: "你将点选日期、设定方位视角，再读教学历注。",
          steps: [
            { title: "认识阴阳道", body: "历注 · 方忌 · 日辰。" },
            { title: "点选日期", body: "所问之日。" },
            { title: "设定方位", body: "你往哪边动？" },
            { title: "读取历注", body: "出现教学注记。" },
            { title: "通书指引", body: "注记倾向对照计划。" },
          ],
        },
        {
          intro: "你將點選日期、設定方位視角，再讀教學曆註。",
          steps: [
            { title: "認識陰陽道", body: "曆註 · 方忌 · 日辰。" },
            { title: "點選日期", body: "所問之日。" },
            { title: "設定方位", body: "你往哪邊動？" },
            { title: "讀取曆註", body: "出現教學註記。" },
            { title: "通書指引", body: "註記傾向對照計劃。" },
          ],
        }
      ),
      steps: ["intent", "dayDate", "houi", "almanacNote", "result"],
      viz: "onmyodo",
      castCta: { en: "Read the almanac note", zh: "读取历注", hant: "讀取曆註" },
      buildCast(state, rng) {
        const dirs = [
          { id: "NE", en: "Northeast", zh: "东北", lean: { en: "demon gate care", zh: "鬼门慎动", hant: "鬼門慎動" } },
          { id: "SW", en: "Southwest", zh: "西南", lean: { en: "back demon gate care", zh: "裏鬼门慎", hant: "裏鬼門慎" } },
          { id: "E", en: "East", zh: "东", lean: { en: "growth path", zh: "生发之路", hant: "生發之路" } },
          { id: "W", en: "West", zh: "西", lean: { en: "harvest path", zh: "收敛之路", hant: "收斂之路" } },
        ];
        const dir = dirs.find((d) => d.id === state.houi) || pick(rng, dirs);
        return { date: state.dayDate || "", dir, lean: loc(dir.lean) };
      },
      generate(q, cast) {
        const dname = loc({ en: cast.dir.en, zh: cast.dir.zh });
        return pack({
          title: `${cast.date || "—"} · ${dname}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学阴阳道于「${cast.date || "未选日"}」看「${dname}」，倾向「${cast.lean}」。真方忌依年盘；此处为方位教育。`, `教學陰陽道於「${cast.date || "未選日"}」看「${dname}」，傾向「${cast.lean}」。真方忌依年盤；此處為方位教育。`)
            : `Teaching onmyōdō on “${cast.date || "unset day"}” toward “${dname}” leans “${cast.lean}”. Real hōi depends on the year chart; direction education here.`,
          interpret: interpretQ(q || cast.date, cast.lean, isZh() ? zhText("阴阳道历注", "陰陽道曆註") : "the onmyōdō note"),
          details: [cast.date || "—", dname],
          doList: [isZh() ? zhText(`若倾向偏慎，改选一条可逆路径试一天。`, `若傾向偏慎，改選一條可逆路徑試一天。`) : `If the lean cautions, trial one reversible path for a day.`],
          dontList: [isZh() ? zhText("不要因方忌恐吓他人取消必要行程。", "不要因方忌恐嚇他人取消必要行程。") : "Do not scare others into canceling needed travel over hōi."],
          tone: /慎|care|demon/i.test(cast.lean) ? "caution" : "mixed",
          vizData: cast,
        });
      },
    },

    rokuyo: {
      summary: {
        en: "Rokuyō cycles six day labels — taian, shakkō, senshō, tomobiki, sembu, butsumetsu — still used for weddings and starts in Japan.",
        zh: "六曜循环六个日签——大安、赤口、先胜、友引、先负、佛灭——日本仍常用于婚嫁与开事。",
        hant: "六曜循環六個日籤——大安、赤口、先勝、友引、先負、佛滅——日本仍常用於婚嫁與開事。",
      },
      how: howPack(
        {
          intro: "You’ll pick a candidate day, see its rokuyō label, then read the counsel.",
          steps: [
            { title: "Meet Rokuyō", body: "Six labels · folk calendar." },
            { title: "Pick a candidate day", body: "Date under review." },
            { title: "See the rokuyō label", body: "One of six lights." },
            { title: "Read the day counsel", body: "Label lean appears." },
            { title: "Rokuyō counsel", body: "Lean for your purpose." },
          ],
        },
        {
          intro: "你将点选候选日、查看六曜标签，再读日辰指引。",
          steps: [
            { title: "认识六曜", body: "六签 · 民俗历。" },
            { title: "点选候选日", body: "所问之日。" },
            { title: "查看六曜标签", body: "六者之一点亮。" },
            { title: "读取日辰指引", body: "标签倾向出现。" },
            { title: "六曜指引", body: "倾向对照目的。" },
          ],
        },
        {
          intro: "你將點選候選日、查看六曜標籤，再讀日辰指引。",
          steps: [
            { title: "認識六曜", body: "六籤 · 民俗曆。" },
            { title: "點選候選日", body: "所問之日。" },
            { title: "查看六曜標籤", body: "六者之一點亮。" },
            { title: "讀取日辰指引", body: "標籤傾向出現。" },
            { title: "六曜指引", body: "傾向對照目的。" },
          ],
        }
      ),
      steps: ["intent", "daypickRoku", "rokuLabel", "counselRoku", "result"],
      viz: "rokuyo",
      castCta: { en: "Read the day counsel", zh: "读取日辰指引", hant: "讀取日辰指引" },
      buildCast(state, rng) {
        const d = state.dayDate ? new Date(state.dayDate + "T12:00:00") : new Date();
        const idx = ((d.getFullYear() + d.getMonth() + d.getDate()) % 6 + 6) % 6;
        const label = ROKUYO[idx] || pick(rng, ROKUYO);
        return { date: state.dayDate || "", label, lean: loc(label.lean) };
      },
      generate(q, cast) {
        const name = loc({ en: cast.label.en, zh: cast.label.zh });
        return pack({
          title: `${cast.date || "—"} · ${name}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学六曜示「${name}」，倾向「${cast.lean}」。六曜是民俗历注，不是天文保证。`, `教學六曜示「${name}」，傾向「${cast.lean}」。六曜是民俗曆註，不是天文保證。`)
            : `Teaching rokuyō shows “${name}”, leaning “${cast.lean}”. Folk calendar labels, not astronomical guarantees.`,
          interpret: interpretQ(q || cast.date, cast.lean, isZh() ? "六曜" : "rokuyō"),
          details: [cast.date || "—", name],
          doList: [isZh() ? zhText(`按「${cast.lean}」调整该日上午／下午安排。`, `按「${cast.lean}」調整該日上午／下午安排。`) : `Shift morning/afternoon plans that day per “${cast.lean}”.`],
          dontList: [isZh() ? zhText("不要因佛灭取消必要医疗。", "不要因佛滅取消必要醫療。") : "Do not cancel needed medical care over butsumetsu."],
          tone: /佛灭|赤口|Butsumetsu|Shakkō|rest|disputes/i.test(name + cast.lean) ? "caution" : "bright",
          vizData: cast,
        });
      },
    },

    seimei: {
      summary: {
        en: "Seimei Handan scores stroke counts of a written name for fortune themes — numerology of kanji/kana forms, not identity judgment.",
        zh: "姓名判断依姓名笔画数理论吉凶主题——是字形数理，不是对人的贬损。",
        hant: "姓名判斷依姓名筆畫數理論吉凶主題——是字形數理，不是對人的貶損。",
      },
      how: howPack(
        {
          intro: "You’ll enter a name, see a teaching stroke total, then read a grade lean.",
          steps: [
            { title: "Meet Seimei Handan", body: "Strokes · five grids · grades." },
            { title: "Enter a name", body: "Kanji or roman letters as seed." },
            { title: "Count the strokes", body: "A teaching total appears." },
            { title: "Read the grade", body: "Fortune band lights." },
            { title: "Name counsel", body: "Grade lean for your question." },
          ],
        },
        {
          intro: "你将输入姓名、查看教学笔画合计，再读等级倾向。",
          steps: [
            { title: "认识姓名判断", body: "笔画 · 五格 · 等级。" },
            { title: "输入姓名", body: "汉字或拉丁字母作种子。" },
            { title: "计算笔画", body: "出现教学合计。" },
            { title: "读取等级", body: "吉凶色带点亮。" },
            { title: "姓名指引", body: "等级倾向对照问题。" },
          ],
        },
        {
          intro: "你將輸入姓名、查看教學筆畫合計，再讀等級傾向。",
          steps: [
            { title: "認識姓名判斷", body: "筆畫 · 五格 · 等級。" },
            { title: "輸入姓名", body: "漢字或拉丁字母作種子。" },
            { title: "計算筆畫", body: "出現教學合計。" },
            { title: "讀取等級", body: "吉凶色帶點亮。" },
            { title: "姓名指引", body: "等級傾向對照問題。" },
          ],
        }
      ),
      steps: ["intent", "nameIn", "strokeCount", "seimeiGrade", "result"],
      viz: "seimei",
      castCta: { en: "Read the grade", zh: "读取等级", hant: "讀取等級" },
      buildCast(state, rng) {
        const name = state.personName || "A";
        let strokes = 0;
        for (let i = 0; i < name.length; i++) strokes += 1 + (name.charCodeAt(i) % 7);
        strokes = 5 + (strokes % 40);
        const grades = [
          { en: "Daikichi band", zh: "大吉带", lean: { en: "name supports clarity", zh: "姓名助力清晰", hant: "姓名助力清晰" } },
          { en: "Kichi band", zh: "吉带", lean: { en: "steady name weather", zh: "姓名气象平稳", hant: "姓名氣象平穩" } },
          { en: "Hankichi band", zh: "半吉带", lean: { en: "mixed · refine how you sign", zh: "驳杂·精炼署名方式", hant: "駁雜·精煉署名方式" } },
          { en: "Kyō caution", zh: "凶慎", lean: { en: "soften how the name is used", zh: "柔化姓名使用方式", hant: "柔化姓名使用方式" } },
        ];
        const grade = pick(rng, grades);
        return { name, strokes, grade, lean: loc(grade.lean) };
      },
      generate(q, cast) {
        const g = loc({ en: cast.grade.en, zh: cast.grade.zh });
        return pack({
          title: `${cast.name} · ${cast.strokes} · ${g}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学姓名判断以「${cast.name}」得笔画示意 ${cast.strokes}、等级「${g}」，倾向「${cast.lean}」。真五格需规范笔画表。`, `教學姓名判斷以「${cast.name}」得筆畫示意 ${cast.strokes}、等級「${g}」，傾向「${cast.lean}」。真五格需規範筆畫表。`)
            : `Teaching seimei for “${cast.name}” shows stroke hint ${cast.strokes}, grade “${g}”, leaning “${cast.lean}”. Real go-kaku needs standard stroke tables.`,
          interpret: interpretQ(q || cast.name, cast.lean, isZh() ? zhText("姓名判断", "姓名判斷") : "seimei handan"),
          details: [cast.name, String(cast.strokes), g],
          doList: [isZh() ? zhText(`试一种更清晰的自我介绍句，呼应「${cast.lean}」。`, `試一種更清晰的自我介紹句，呼應「${cast.lean}」。`) : `Try one clearer self-intro line matching “${cast.lean}”.`],
          dontList: [isZh() ? zhText("不要因数理羞辱他人姓名。", "不要因數理羞辱他人姓名。") : "Do not shame anyone’s name over stroke numerology."],
          tone: /凶|Kyō|caution/i.test(g) ? "caution" : "mixed",
          vizData: cast,
        });
      },
    },

    sanmeigaku: {
      summary: {
        en: "Sanmeigaku is a modern Japanese destiny school using the sexagenary cycle and Five Elements (gogyō) from birth data.",
        zh: "算命学是日本现代命理流派，依生辰干支与五行论格局。",
        hant: "算命學是日本現代命理流派，依生辰干支與五行論格局。",
      },
      how: howPack(
        {
          intro: "You’ll enter birth date, pick a Five Element lens, then open a teaching board.",
          steps: [
            { title: "Meet Sanmeigaku", body: "Sexagenary · gogyō · destiny." },
            { title: "Enter birth date", body: "Chart seed." },
            { title: "Choose a gogyō lens", body: "Wood fire earth metal water." },
            { title: "Open the board", body: "Element lean highlights." },
            { title: "Sanmei counsel", body: "Element lean for your focus." },
          ],
        },
        {
          intro: "你将输入生辰、选择五行视角，再打开教学盘。",
          steps: [
            { title: "认识算命学", body: "干支 · 五行 · 命局。" },
            { title: "输入出生日期", body: "命盘种子。" },
            { title: "选择五行视角", body: "木火土金水。" },
            { title: "打开命盘", body: "五行倾向点亮。" },
            { title: "算命指引", body: "五行倾向对照焦点。" },
          ],
        },
        {
          intro: "你將輸入生辰、選擇五行視角，再打開教學盤。",
          steps: [
            { title: "認識算命學", body: "干支 · 五行 · 命局。" },
            { title: "輸入出生日期", body: "命盤種子。" },
            { title: "選擇五行視角", body: "木火土金水。" },
            { title: "打開命盤", body: "五行傾向點亮。" },
            { title: "算命指引", body: "五行傾向對照焦點。" },
          ],
        }
      ),
      steps: ["intent", "birth", "gogyo", "sanmeiBoard", "result"],
      viz: "sanmei",
      castCta: { en: "Open the board", zh: "打开命盘", hant: "打開命盤" },
      buildCast(state, rng) {
        const el = GOGYO.find((g) => g.en.toLowerCase() === String(state.gogyo || "").toLowerCase()) || pick(rng, GOGYO);
        const p = pillarsFromDate(state.birthDate, rng);
        return { ...p, el, lean: loc(el.lean) };
      },
      generate(q, cast) {
        const e = loc({ en: cast.el.en, zh: cast.el.zh });
        return pack({
          title: `${e} · ${cast.dayP}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学算命学以日柱「${cast.dayP}」看五行「${e}」，倾向「${cast.lean}」。`, `教學算命學以日柱「${cast.dayP}」看五行「${e}」，傾向「${cast.lean}」。`)
            : `Teaching sanmeigaku reads day “${cast.dayP}” through “${e}”, leaning “${cast.lean}”.`,
          interpret: interpretQ(q, cast.lean, isZh() ? zhText("算命学五行", "算命學五行") : "sanmeigaku gogyō"),
          details: [cast.yearP, cast.dayP, e],
          doList: [isZh() ? zhText(`本周用「${cast.lean}」安排一件可验证行动。`, `本週用「${cast.lean}」安排一件可驗證行動。`) : `Schedule one checkable act this week per “${cast.lean}”.`],
          dontList: [isZh() ? zhText("不要用五行标签歧视他人。", "不要用五行標籤歧視他人。") : "Do not discriminate using element labels."],
          tone: "mixed",
          vizData: cast,
        });
      },
    },

    shichu: {
      summary: {
        en: "Shichū Suimei is Japan’s four-pillars destiny school — year, month, day, hour pillars read for temperament and timing.",
        zh: "四柱推命是日本的四柱命理流派——以年月日时四柱论性情与时机。",
        hant: "四柱推命是日本的四柱命理流派——以年月日時四柱論性情與時機。",
      },
      how: howPack(
        {
          intro: "You’ll enter birth date, set the hour pillar, then reveal a teaching four-pillar board.",
          steps: [
            { title: "Meet Shichū Suimei", body: "Four pillars · Daymaster." },
            { title: "Enter birth date", body: "Year month day seeds." },
            { title: "Set the hour pillar", body: "Twelve double-hours." },
            { title: "Reveal the pillars", body: "Four teaching columns." },
            { title: "Shichū counsel", body: "Board lean for your ask." },
          ],
        },
        {
          intro: "你将输入生辰、设定时柱，再展开教学四柱盘。",
          steps: [
            { title: "认识四柱推命", body: "四柱 · 日主。" },
            { title: "输入出生日期", body: "年月日种子。" },
            { title: "设定时柱", body: "十二时辰。" },
            { title: "展开四柱", body: "四列教学柱。" },
            { title: "推命指引", body: "盘意对照所问。" },
          ],
        },
        {
          intro: "你將輸入生辰、設定時柱，再展開教學四柱盤。",
          steps: [
            { title: "認識四柱推命", body: "四柱 · 日主。" },
            { title: "輸入出生日期", body: "年月日種子。" },
            { title: "設定時柱", body: "十二時辰。" },
            { title: "展開四柱", body: "四列教學柱。" },
            { title: "推命指引", body: "盤意對照所問。" },
          ],
        }
      ),
      steps: ["intent", "birth", "shichuHour", "shichuPillars", "result"],
      viz: "shichu",
      castCta: { en: "Reveal the pillars", zh: "展开四柱", hant: "展開四柱" },
      buildCast(state, rng) {
        const p = pillarsFromDate(state.birthDate, rng);
        if (state.hourIndex != null && state.hourIndex !== "") {
          const hi = Number(state.hourIndex);
          p.hourIdx = hi;
          p.hourP = STEMS[(p.dayP.charCodeAt(0) + hi) % 10] + BRANCHES[hi % 12];
        }
        const leans = isZh()
          ? [
              { t: "日主有根", l: "宜稳进表达" },
              { t: "官杀透干", l: "职场规则·防过压" },
              { t: "财星得位", l: "资源可见·忌贪急" },
              { t: "印比相生", l: "学习互助" },
            ]
          : [
              { t: "Daymaster rooted", l: "steady express" },
              { t: "Officer stem shows", l: "role rules · avoid overpressure" },
              { t: "Wealth well placed", l: "resources visible · no rush" },
              { t: "Resource peers", l: "learn · mutual aid" },
            ];
        return { ...p, tag: pick(rng, leans) };
      },
      generate(q, cast) {
        return pack({
          title: `${cast.dayP} · ${cast.tag.t}`,
          result: cast.tag.l,
          explain: isZh()
            ? zhText(`教学四柱推命示日柱「${cast.dayP}」、时柱「${cast.hourP}」，格局「${cast.tag.t}」，倾向「${cast.tag.l}」。`, `教學四柱推命示日柱「${cast.dayP}」、時柱「${cast.hourP}」，格局「${cast.tag.t}」，傾向「${cast.tag.l}」。`)
            : `Teaching shichū shows day “${cast.dayP}”, hour “${cast.hourP}”, pattern “${cast.tag.t}”, leaning “${cast.tag.l}”.`,
          interpret: interpretQ(q, cast.tag.l, isZh() ? zhText("四柱推命", "四柱推命") : "shichū suimei"),
          details: [cast.yearP, cast.monthP, cast.dayP, cast.hourP],
          doList: [isZh() ? zhText(`按「${cast.tag.l}」调整本周一个习惯。`, `按「${cast.tag.l}」調整本週一個習慣。`) : `Adjust one habit this week per “${cast.tag.l}”.`],
          dontList: [isZh() ? zhText("不要用教学盘否定他人价值。", "不要用教學盤否定他人價值。") : "Do not deny someone’s worth with a teaching board."],
          tone: "mixed",
          vizData: cast,
        });
      },
    },

    "nine-star-ki": {
      summary: {
        en: "Nine Star Ki uses birth and month stars (1–9) to counsel direction, timing, and yearly themes.",
        zh: "九星气学以出生与月份九星（1–9）论方位、时机与年运主题。",
        hant: "九星氣學以出生與月份九星（1–9）論方位、時機與年運主題。",
      },
      how: howPack(
        {
          intro: "You’ll enter birth year, see your star house, then read a direction lean.",
          steps: [
            { title: "Meet Nine Star Ki", body: "Nine stars · houses · directions." },
            { title: "Enter birth year", body: "Year star seed." },
            { title: "See the star house", body: "One of nine lights." },
            { title: "Read direction counsel", body: "Hōi lean for the star." },
            { title: "Star counsel", body: "Star lean for your ask." },
          ],
        },
        {
          intro: "你将输入出生年、查看星宅，再读方位倾向。",
          steps: [
            { title: "认识九星气学", body: "九星 · 宅位 · 方位。" },
            { title: "输入出生年", body: "年星种子。" },
            { title: "查看星宅", body: "九者之一点亮。" },
            { title: "读取方位指引", body: "方忌／方吉倾向。" },
            { title: "九星指引", body: "星意对照所问。" },
          ],
        },
        {
          intro: "你將輸入出生年、查看星宅，再讀方位傾向。",
          steps: [
            { title: "認識九星氣學", body: "九星 · 宅位 · 方位。" },
            { title: "輸入出生年", body: "年星種子。" },
            { title: "查看星宅", body: "九者之一點亮。" },
            { title: "讀取方位指引", body: "方忌／方吉傾向。" },
            { title: "九星指引", body: "星意對照所問。" },
          ],
        }
      ),
      steps: ["intent", "birthyear", "starHouse", "houiStar", "result"],
      viz: "ninestar",
      castCta: { en: "Read direction counsel", zh: "读取方位指引", hant: "讀取方位指引" },
      buildCast(state, rng) {
        const year = Number(state.birthYear) || 1990;
        const star = STARS9[(11 - (year % 9)) % 9] || pick(rng, STARS9);
        return { year, star, lean: loc(star.lean) };
      },
      generate(q, cast) {
        const s = loc({ en: cast.star.en, zh: cast.star.zh });
        return pack({
          title: `${cast.year} · ${s}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学九星以${cast.year}年生得「${s}」，倾向「${cast.lean}」。真推年／月星有固定表。`, `教學九星以${cast.year}年生得「${s}」，傾向「${cast.lean}」。真推年／月星有固定表。`)
            : `Teaching Nine Star Ki for ${cast.year} shows “${s}”, leaning “${cast.lean}”. Real year/month stars use fixed tables.`,
          interpret: interpretQ(q, cast.lean, isZh() ? zhText("九星气学", "九星氣學") : "Nine Star Ki"),
          details: [String(cast.year), s],
          doList: [isZh() ? zhText(`本月按「${cast.lean}」选一个可逆方向试探。`, `本月按「${cast.lean}」選一個可逆方向試探。`) : `Trial one reversible direction this month per “${cast.lean}”.`],
          dontList: [isZh() ? zhText("不要用五黄恐吓他人。", "不要用五黃恐嚇他人。") : "Do not scare people with Five Yellow."],
          tone: /五黄|Five Yellow|simplify|quarrel/i.test(s + cast.lean) ? "caution" : "bright",
          vizData: cast,
        });
      },
    },

    futomani: {
      summary: {
        en: "Futomani is ancient Shinto scapulimancy — a deer shoulder blade heated until cracks form omens (educational heat/crack sim only).",
        zh: "太占是古代神道骨卜——灼烤鹿肩胛至裂纹成兆（仅教育性灼裂模拟，无真实灼烧）。",
        hant: "太占是古代神道骨卜——灼烤鹿肩胛至裂紋成兆（僅教育性灼裂模擬，無真實灼燒）。",
      },
      how: howPack(
        {
          intro: "You’ll hold a question, heat the teaching bone, then read the crack lean.",
          steps: [
            { title: "Meet Futomani", body: "Shoulder blade · heat · cracks." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Heat the bone", body: "Teaching glow — no real fire." },
            { title: "Read the crack", body: "A pattern lean appears." },
            { title: "Crack counsel", body: "Omen lean for your question." },
          ],
        },
        {
          intro: "你将抱定问题、加热教学骨版，再读裂纹倾向。",
          steps: [
            { title: "认识太占", body: "肩胛 · 灼热 · 裂纹。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "加热骨版", body: "教学光热——无真火。" },
            { title: "读取裂纹", body: "出现纹路倾向。" },
            { title: "裂兆指引", body: "兆意对照问题。" },
          ],
        },
        {
          intro: "你將抱定問題、加熱教學骨版，再讀裂紋傾向。",
          steps: [
            { title: "認識太占", body: "肩胛 · 灼熱 · 裂紋。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "加熱骨版", body: "教學光熱——無真火。" },
            { title: "讀取裂紋", body: "出現紋路傾向。" },
            { title: "裂兆指引", body: "兆意對照問題。" },
          ],
        }
      ),
      steps: ["intent", "question", "heatBone", "crackRead", "result"],
      viz: "futomani",
      castCta: { en: "Read the crack", zh: "读取裂纹", hant: "讀取裂紋" },
      buildCast(state, rng) {
        const cracks = isZh()
          ? [
              { t: "纵裂通达", l: "路径可通·稳步" },
              { t: "横裂阻隔", l: "先清障碍" },
              { t: "星状裂", l: "多向选择·勿贪" },
              { t: "细裂密布", l: "细节过多·简化" },
            ]
          : [
              { t: "Longitudinal crack", l: "path open · steady" },
              { t: "Cross crack", l: "clear a block first" },
              { t: "Star crack", l: "many options · don’t greed" },
              { t: "Fine mesh cracks", l: "too many details · simplify" },
            ];
        return { crack: pick(rng, cracks) };
      },
      generate(q, cast) {
        return pack({
          title: cast.crack.t,
          result: cast.crack.l,
          explain: isZh()
            ? zhText(`教学太占示「${cast.crack.t}」，倾向「${cast.crack.l}」。无真实灼烧动物骨骼。`, `教學太占示「${cast.crack.t}」，傾向「${cast.crack.l}」。無真實灼燒動物骨骼。`)
            : `Teaching futomani shows “${cast.crack.t}”, leaning “${cast.crack.l}”. No real animal bones are burned.`,
          interpret: interpretQ(q, cast.crack.l, isZh() ? "太占裂兆" : "the futomani crack"),
          details: [cast.crack.t],
          doList: [isZh() ? zhText(`按「${cast.crack.l}」处理眼前一件卡住的事。`, `按「${cast.crack.l}」處理眼前一件卡住的事。`) : `Handle one stuck matter per “${cast.crack.l}”.`],
          dontList: [isZh() ? zhText("不要真实灼烧动物骨骼。", "不要真實灼燒動物骨骼。") : "Do not actually burn animal bones."],
          tone: /阻|块|Cross|simplify|障碍/i.test(cast.crack.t + cast.crack.l) ? "caution" : "mixed",
          vizData: cast,
        });
      },
    },

    kiboku: {
      summary: {
        en: "Kiboku heats tortoise shells for crack omens — related to continental oracle-bone practice (educational sim only).",
        zh: "灼骨／龟卜加热龟甲取裂纹兆——与大陆甲骨传统相关（仅教育模拟）。",
        hant: "灼骨／龜卜加熱龜甲取裂紋兆——與大陸甲骨傳統相關（僅教育模擬）。",
      },
      how: howPack(
        {
          intro: "You’ll hold a question, heat the teaching shell, then read the kiboku crack.",
          steps: [
            { title: "Meet Kiboku", body: "Shell · heat · crack omen." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Heat the shell", body: "Teaching glow only." },
            { title: "Read kiboku crack", body: "Pattern lean appears." },
            { title: "Shell counsel", body: "Omen lean for your question." },
          ],
        },
        {
          intro: "你将抱定问题、加热教学龟甲，再读灼裂纹路。",
          steps: [
            { title: "认识灼骨龟卜", body: "龟甲 · 加热 · 裂兆。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "加热龟甲", body: "仅教学光热。" },
            { title: "读取灼裂", body: "出现纹路倾向。" },
            { title: "甲兆指引", body: "兆意对照问题。" },
          ],
        },
        {
          intro: "你將抱定問題、加熱教學龜甲，再讀灼裂紋路。",
          steps: [
            { title: "認識灼骨龜卜", body: "龜甲 · 加熱 · 裂兆。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "加熱龜甲", body: "僅教學光熱。" },
            { title: "讀取灼裂", body: "出現紋路傾向。" },
            { title: "甲兆指引", body: "兆意對照問題。" },
          ],
        }
      ),
      steps: ["intent", "question", "shellHeat", "kibokuCrack", "result"],
      viz: "kiboku",
      castCta: { en: "Read kiboku crack", zh: "读取灼裂", hant: "讀取灼裂" },
      buildCast(state, rng) {
        const cracks = isZh()
          ? [
              { t: "甲心直裂", l: "核心议题可直说" },
              { t: "边缘碎裂", l: "外围噪音·回中心" },
              { t: "对称双裂", l: "两边兼顾·订边界" },
              { t: "斜裂外指", l: "向外求证·防臆断" },
            ]
          : [
              { t: "Center split", l: "name the core issue directly" },
              { t: "Edge shatter", l: "ignore noise · return to center" },
              { t: "Twin cracks", l: "hold both sides · set a border" },
              { t: "Diagonal out", l: "verify outside · avoid guessing" },
            ];
        return { crack: pick(rng, cracks) };
      },
      generate(q, cast) {
        return pack({
          title: cast.crack.t,
          result: cast.crack.l,
          explain: isZh()
            ? zhText(`教学龟卜示「${cast.crack.t}」，倾向「${cast.crack.l}」。无真实灼甲伤害。`, `教學龜卜示「${cast.crack.t}」，傾向「${cast.crack.l}」。無真實灼甲傷害。`)
            : `Teaching kiboku shows “${cast.crack.t}”, leaning “${cast.crack.l}”. No real shells are harmed.`,
          interpret: interpretQ(q, cast.crack.l, isZh() ? zhText("龟卜裂兆", "龜卜裂兆") : "the kiboku crack"),
          details: [cast.crack.t],
          doList: [isZh() ? zhText(`用「${cast.crack.l}」处理今天一个决策。`, `用「${cast.crack.l}」處理今天一個決策。`) : `Apply “${cast.crack.l}” to one decision today.`],
          dontList: [isZh() ? zhText("不要真实灼烧龟甲。", "不要真實灼燒龜甲。") : "Do not actually heat tortoise shells."],
          tone: "deep",
          vizData: cast,
        });
      },
    },

    kaso: {
      summary: {
        en: "Kasō reads Japanese house floor plans and orientation for household fortune — related to, but distinct from, Chinese feng shui.",
        zh: "家相依日本住宅平面与坐向论家运——与风水相关而自成系统。",
        hant: "家相依日本住宅平面與坐向論家運——與風水相關而自成系統。",
      },
      how: howPack(
        {
          intro: "You’ll mark a plan type, set facing, then map a teaching kasō lean.",
          steps: [
            { title: "Meet Kasō", body: "Plan · facing · household qi." },
            { title: "Mark the plan type", body: "Apartment, house, shop…" },
            { title: "Set the facing", body: "Main opening direction." },
            { title: "Map the house", body: "Teaching sectors light." },
            { title: "Kasō counsel", body: "Facing lean for your ask." },
          ],
        },
        {
          intro: "你将标记平面类型、设定朝向，再映射教学家相倾向。",
          steps: [
            { title: "认识家相", body: "平面 · 朝向 · 家气。" },
            { title: "标记平面类型", body: "公寓、一户建、店铺…" },
            { title: "设定朝向", body: "主要开口方向。" },
            { title: "映射宅盘", body: "教学区位点亮。" },
            { title: "家相指引", body: "朝向倾向对照所问。" },
          ],
        },
        {
          intro: "你將標記平面類型、設定朝向，再映射教學家相傾向。",
          steps: [
            { title: "認識家相", body: "平面 · 朝向 · 家氣。" },
            { title: "標記平面類型", body: "公寓、一戶建、店鋪…" },
            { title: "設定朝向", body: "主要開口方向。" },
            { title: "映射宅盤", body: "教學區位點亮。" },
            { title: "家相指引", body: "朝向傾向對照所問。" },
          ],
        }
      ),
      steps: ["intent", "housePlan", "kasoFacing", "kasoMap", "result"],
      viz: "kaso",
      castCta: { en: "Map the house", zh: "映射宅盘", hant: "映射宅盤" },
      buildCast(state, rng) {
        const faces = [
          { id: "S", en: "South", zh: "南", lean: { en: "bright gathering", zh: "明堂聚气", hant: "明堂聚氣" } },
          { id: "E", en: "East", zh: "东", lean: { en: "morning growth", zh: "朝发生发", hant: "朝發生發" } },
          { id: "N", en: "North", zh: "北", lean: { en: "quiet store", zh: "静藏收纳", hant: "靜藏收納" } },
          { id: "W", en: "West", zh: "西", lean: { en: "evening refine", zh: "暮色收敛", hant: "暮色收斂" } },
        ];
        const facing = faces.find((f) => f.id === state.facing) || pick(rng, faces);
        return { plan: state.housePlan || "house", facing, lean: loc(facing.lean) };
      },
      generate(q, cast) {
        const f = loc({ en: cast.facing.en, zh: cast.facing.zh });
        const planLabels = {
          house: { en: "House", zh: "一户建", hant: "一戶建" },
          apartment: { en: "Apartment", zh: "公寓", hant: "公寓" },
          shop: { en: "Shop", zh: "店铺", hant: "店鋪" },
        };
        const planName = loc(planLabels[cast.plan] || { en: cast.plan, zh: cast.plan });
        return pack({
          title: `${planName} · ${f}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学家相以「${planName}」朝「${f}」，倾向「${cast.lean}」。真家相需平面图实地。`, `教學家相以「${planName}」朝「${f}」，傾向「${cast.lean}」。真家相需平面圖實地。`)
            : `Teaching kasō for “${planName}” facing “${f}” leans “${cast.lean}”. Real kasō needs a floor plan on site.`,
          interpret: interpretQ(q || planName, cast.lean, isZh() ? "家相" : "kasō"),
          details: [planName, cast.facing.id],
          doList: [isZh() ? zhText(`只改一件可逆摆设呼应「${cast.lean}」。`, `只改一件可逆擺設呼應「${cast.lean}」。`) : `Change only one reversible layout item matching “${cast.lean}”.`],
          dontList: [isZh() ? zhText("不要因教学盘大拆承重墙。", "不要因教學盤大拆承重牆。") : "Do not gut load-bearing walls from a teaching map."],
          tone: "mixed",
          vizData: cast,
        });
      },
    },

    chabashira: {
      summary: {
        en: "Chabashira is the folk omen of a tea stalk standing upright in the cup — read as a lucky-day sign.",
        zh: "茶柱是茶杯中茶梗直立的民俗吉兆——常被视为好运之日的信号。",
        hant: "茶柱是茶杯中茶梗直立的民俗吉兆——常被視為好運之日的信號。",
      },
      how: howPack(
        {
          intro: "You’ll hold a wish for the day, brew, watch the stalk, then read whether it stands — teaching sim.",
          steps: [
            { title: "Meet Chabashira", body: "Tea · stalk · upright omen." },
            { title: "Name today’s wish", body: "One gentle hope for the cup." },
            { title: "Brew the tea", body: "Cup fills." },
            { title: "Watch the stalk", body: "Does it rise?" },
            { title: "Read the tea omen", body: "Stand or drift lean." },
            { title: "Tea counsel", body: "Omen lean for your wish." },
          ],
        },
        {
          intro: "你将写下今日心愿、泡茶、观察茶梗，再读是否直立——教学模拟。",
          steps: [
            { title: "认识茶柱", body: "茶 · 梗 · 直立兆。" },
            { title: "写下今日心愿", body: "给这杯茶一个轻愿。" },
            { title: "沏茶", body: "杯满。" },
            { title: "观察茶梗", body: "会不会立起？" },
            { title: "读取茶兆", body: "直立或漂倾向。" },
            { title: "茶兆指引", body: "兆意对照心愿。" },
          ],
        },
        {
          intro: "你將寫下今日心願、泡茶、觀察茶梗，再讀是否直立——教學模擬。",
          steps: [
            { title: "認識茶柱", body: "茶 · 梗 · 直立兆。" },
            { title: "寫下今日心願", body: "給這杯茶一個輕願。" },
            { title: "沏茶", body: "杯滿。" },
            { title: "觀察茶梗", body: "會不會立起？" },
            { title: "讀取茶兆", body: "直立或漂傾向。" },
            { title: "茶兆指引", body: "兆意對照心願。" },
          ],
        }
      ),
      steps: ["intent", "question", "brewTea", "watchStalk", "teaOmen", "result"],
      viz: "chabashira",
      castCta: { en: "Read the tea omen", zh: "读取茶兆", hant: "讀取茶兆" },
      buildCast(state, rng) {
        const up = rng() > 0.45;
        return {
          upright: up,
          lean: up
            ? loc({ en: "lucky pause · notice goodwill", zh: "吉暂停·留意善意", hant: "吉暫停·留意善意" })
            : loc({ en: "ordinary cup · make your own luck", zh: "平常杯·自造小运气", hant: "平常杯·自造小運氣" }),
        };
      },
      generate(q, cast) {
        const title = cast.upright
          ? isZh()
            ? zhText("茶柱直立", "茶柱直立")
            : "Stalk stands"
          : isZh()
            ? zhText("茶梗平漂", "茶梗平漂")
            : "Stalk drifts";
        return pack({
          title,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学茶柱示「${title}」，倾向「${cast.lean}」。民俗吉兆，不是科学预测。`, `教學茶柱示「${title}」，傾向「${cast.lean}」。民俗吉兆，不是科學預測。`)
            : `Teaching chabashira shows “${title}”, leaning “${cast.lean}”. Folk omen, not a scientific forecast.`,
          interpret: interpretQ(q || "today", cast.lean, isZh() ? "茶柱" : "chabashira"),
          details: [title],
          doList: [isZh() ? zhText(`把「${cast.lean}」变成今天一句感谢或一个小完成。`, `把「${cast.lean}」變成今天一句感謝或一個小完成。`) : `Turn “${cast.lean}” into one thank-you or small finish today.`],
          dontList: [isZh() ? zhText("不要强迫他人相信茶兆。", "不要強迫他人相信茶兆。") : "Do not force others to believe a tea omen."],
          tone: cast.upright ? "bright" : "mixed",
          vizData: cast,
        });
      },
    },

    sukuyo: {
      summary: {
        en: "Sukuyō is esoteric Buddhist astrology in Japan — twenty-seven lunar mansions and hosts read from birth for compatibility and timing.",
        zh: "宿曜是日本密教占星——以二十七宿与宿曜从生辰论合参与时机。",
        hant: "宿曜是日本密教占星——以二十七宿與宿曜從生辰論合參與時機。",
      },
      how: howPack(
        {
          intro: "You’ll enter birth date, pick a mansion lens, then meet a teaching sukuyō host lean.",
          steps: [
            { title: "Meet Sukuyō", body: "Lunar mansions · hosts · timing." },
            { title: "Enter birth date", body: "Mansion seed." },
            { title: "Pick a mansion lens", body: "Teaching lodge choice." },
            { title: "Meet the host", body: "Host lean appears." },
            { title: "Sukuyō counsel", body: "Mansion lean for your focus." },
          ],
        },
        {
          intro: "你将输入生辰、选择宿视角，再会见教学宿曜主倾向。",
          steps: [
            { title: "认识宿曜", body: "二十七宿 · 宿主 · 时机。" },
            { title: "输入出生日期", body: "宿种。" },
            { title: "选择宿视角", body: "教学宿选择。" },
            { title: "会见宿主", body: "宿主倾向出现。" },
            { title: "宿曜指引", body: "宿意对照焦点。" },
          ],
        },
        {
          intro: "你將輸入生辰、選擇宿視角，再會見教學宿曜主傾向。",
          steps: [
            { title: "認識宿曜", body: "二十七宿 · 宿主 · 時機。" },
            { title: "輸入出生日期", body: "宿種。" },
            { title: "選擇宿視角", body: "教學宿選擇。" },
            { title: "會見宿主", body: "宿主傾向出現。" },
            { title: "宿曜指引", body: "宿意對照焦點。" },
          ],
        }
      ),
      steps: ["intent", "birth", "mansionPick", "sukuyoHost", "result"],
      viz: "sukuyo",
      castCta: { en: "Meet the host", zh: "会见宿主", hant: "會見宿主" },
      buildCast(state, rng) {
        const m =
          MANSIONS.find((x) => x.en === state.mansion) ||
          MANSIONS[Math.abs((state.birthDate || "").length) % MANSIONS.length] ||
          pick(rng, MANSIONS);
        return { mansion: m, lean: loc(m.lean), birth: state.birthDate || "" };
      },
      generate(q, cast) {
        const name = loc({ en: cast.mansion.en, zh: cast.mansion.zh });
        return pack({
          title: name,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学宿曜以生辰「${cast.birth || "—"}」见「${name}」，倾向「${cast.lean}」。真宿曜需密教历算。`, `教學宿曜以生辰「${cast.birth || "—"}」見「${name}」，傾向「${cast.lean}」。真宿曜需密教曆算。`)
            : `Teaching sukuyō for “${cast.birth || "—"}” shows “${name}”, leaning “${cast.lean}”. Real sukuyō needs esoteric calendar math.`,
          interpret: interpretQ(q, cast.lean, isZh() ? "宿曜" : "sukuyō"),
          details: [cast.birth || "—", name],
          doList: [isZh() ? zhText(`围绕「${cast.lean}」安排本周一次专注时段。`, `圍繞「${cast.lean}」安排本週一次專注時段。`) : `Book one focus block this week around “${cast.lean}”.`],
          dontList: [isZh() ? zhText("不要用宿曜否定他人合参自由。", "不要用宿曜否定他人合參自由。") : "Do not deny others’ freedom of association with sukuyō."],
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
            "本站为教育性游玩——不能替代受训阴阳道／神社／命理、医疗、法律或安全判断。",
            "本站為教育性遊玩——不能替代受訓陰陽道／神社／命理、醫療、法律或安全判斷。"
          )
        : "Educational play on this site — not a substitute for trained onmyōdō/shrine/meishin practice, medicine, law, or safety judgment.",
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

  window.FatumJapanOracles = { IDS, has, get, howFor, runCast, loc };
})();
