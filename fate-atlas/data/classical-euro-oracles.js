/**
 * Classical European oracles — unique steps, visuals, readings.
 * Younger Futhark · Futhorc · Ogham · Augury · Haruspicy · Delphi ·
 * Bibliomancy · Cleromancy · Astragalomancy · Western Geomancy
 */
(function () {
  "use strict";

  const IDS = [
    "runes-younger",
    "runes-futhorc",
    "ogham",
    "augury",
    "haruspicy",
    "delphi",
    "bibliomancy",
    "cleromancy",
    "astragalomancy",
    "geomancy-west",
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
      kind: "classicaleuro",
      ...r,
      disclaimer: isZh()
        ? zhText(
            "教育性模拟——不能替代受训祭司／占卜实践，也不能替代医疗、法律或安全判断。可能不准确；无法预测黑天鹅事件。",
            "教育性模擬——不能替代受訓祭司／占卜實踐，也不能替代醫療、法律或安全判斷。可能不準確；無法預測黑天鵝事件。"
          )
        : "Educational simulation — not a substitute for trained priestly/divinatory practice, medicine, law, or safety judgment. May be inaccurate; cannot predict black swan events.",
    };
    return RM ? RM.structuredReading(base) : base;
  }
  function interpretQ(q, lean, mechanic) {
    const f = q || (isZh() ? zhText("未写明的事", "未寫明的事") : "an unnamed matter");
    // Single-locale paragraph — avoid mixing EN body with ZH lead from interpretWithQuestion.
    if (isZh()) {
      return zhText(
        `你问的是「${f}」。${mechanic}给出「${lean}」：把这倾向译成今天能做的一步，再用日常证据核对。这不是日期预报或外在命令。`,
        `你問的是「${f}」。${mechanic}給出「${lean}」：把這傾向譯成今天能做的一步，再用日常證據核對。這不是日期預報或外在命令。`
      );
    }
    return `You asked about “${f}”. ${mechanic} gives “${lean}”: turn that lean into one step you can take today, then check ordinary evidence. This is not a date forecast or an external order.`;
  }
  function howPack(en, zh, hant) {
    return { en, zh, hant: hant || zh };
  }

  const YOUNGER = [
    { en: "Fé", zh: "费", glyph: "ᚠ", lean: { en: "wealth · tend what feeds you", zh: "财富·照料养活你的", hant: "財富·照料養活你的" } },
    { en: "Úr", zh: "乌尔", glyph: "ᚢ", lean: { en: "slag out · refine", zh: "除渣·精炼", hant: "除渣·精煉" } },
    { en: "Thurs", zh: "图尔斯", glyph: "ᚦ", lean: { en: "force · set a boundary", zh: "力·设界", hant: "力·設界" } },
    { en: "Áss", zh: "阿斯", glyph: "ᚬ", lean: { en: "mouth · speak true", zh: "口·直言", hant: "口·直言" } },
    { en: "Reið", zh: "雷兹", glyph: "ᚱ", lean: { en: "ride · keep moving", zh: "骑行·持续前进", hant: "騎行·持續前進" } },
    { en: "Kaun", zh: "考恩", glyph: "ᚴ", lean: { en: "torch · illuminate one corner", zh: "火把·照亮一角", hant: "火把·照亮一角" } },
  ];
  const FUTHORC = [
    { en: "Feoh", zh: "费奥", glyph: "ᚠ", lean: { en: "cattle · resource care", zh: "牲口·照料资源", hant: "牲口·照料資源" } },
    { en: "Ur", zh: "乌尔", glyph: "ᚢ", lean: { en: "aurochs · raw strength", zh: "野牛·原力", hant: "野牛·原力" } },
    { en: "Thorn", zh: "索恩", glyph: "ᚦ", lean: { en: "thorn · protect soft parts", zh: "刺·护柔软处", hant: "刺·護柔軟處" } },
    { en: "Os", zh: "奥斯", glyph: "ᚩ", lean: { en: "mouth of gods · counsel", zh: "神口·建言", hant: "神口·建言" } },
    { en: "Rad", zh: "拉德", glyph: "ᚱ", lean: { en: "road · paced journey", zh: "路·有节奏的旅程", hant: "路·有節奏的旅程" } },
    { en: "Cen", zh: "肯", glyph: "ᚳ", lean: { en: "torch · craft light", zh: "火把·手艺之光", hant: "火把·手藝之光" } },
  ];
  const OGHAM = [
    { en: "Beith (Birch)", zh: "桦", glyph: "ᚁ", lean: { en: "begin · clean slate", zh: "起势·白纸", hant: "起勢·白紙" } },
    { en: "Luis (Rowan)", zh: "花楸", glyph: "ᚂ", lean: { en: "protect · discern", zh: "护界·明辨", hant: "護界·明辨" } },
    { en: "Fearn (Alder)", zh: "赤杨", glyph: "ᚃ", lean: { en: "bridge · courage", zh: "搭桥·勇气", hant: "搭橋·勇氣" } },
    { en: "Saille (Willow)", zh: "柳", glyph: "ᚄ", lean: { en: "feel · adapt", zh: "感受·适应", hant: "感受·適應" } },
    { en: "Nuin (Ash)", zh: "梣", glyph: "ᚅ", lean: { en: "link worlds · craft", zh: "连结·手艺", hant: "連結·手藝" } },
    { en: "Huath (Hawthorn)", zh: "山楂", glyph: "ᚆ", lean: { en: "threshold · wait the right gate", zh: "门槛·等对的门", hant: "門檻·等對的門" } },
  ];
  const BIRDS = [
    { en: "Eagle rightward", zh: "鹰向右", lean: { en: "favor · proceed with witnesses", zh: "吉·有人见证再行", hant: "吉·有人見證再行" } },
    { en: "Crow leftward", zh: "鸦向左", lean: { en: "caution · gather facts", zh: "慎·收集事实", hant: "慎·收集事實" } },
    { en: "Dove circling", zh: "鸽盘旋", lean: { en: "peace talk · soften", zh: "和谈·柔化", hant: "和談·柔化" } },
    { en: "Silent sky", zh: "寂空", lean: { en: "no clear omen · wait", zh: "无明兆·等待", hant: "無明兆·等待" } },
  ];
  const LIVER = [
    { en: "Favorable lobe", zh: "吉叶", lean: { en: "campaign may proceed", zh: "行动可推进", hant: "行動可推進" } },
    { en: "Marked cleft", zh: "裂痕", lean: { en: "inspect risk · delay", zh: "检视风险·延后", hant: "檢視風險·延後" } },
    { en: "Even texture", zh: "纹理匀", lean: { en: "steady path · no rush", zh: "稳路·勿赶", hant: "穩路·勿趕" } },
    { en: "Dark edge", zh: "暗缘", lean: { en: "watch the margins", zh: "留意边缘细节", hant: "留意邊緣細節" } },
  ];
  const PYTHIA = [
    { en: "Know thyself echo", zh: "认识你自己", lean: { en: "name your part first", zh: "先认清自己的部分", hant: "先認清自己的部分" } },
    { en: "Nothing in excess", zh: "勿过度", lean: { en: "trim one excess", zh: "削减一处过度", hant: "削減一處過度" } },
    { en: "Laurel verse", zh: "月桂诗", lean: { en: "proceed · keep vows", zh: "前行·守誓", hant: "前行·守誓" } },
    { en: "Veiled answer", zh: "隐答", lean: { en: "unclear · ask a smaller question", zh: "不明·问更小的问题", hant: "不明·問更小的問題" } },
  ];
  const SORTES = [
    { en: "Virgil lot", zh: "维吉尔签", lean: { en: "duty before haste", zh: "职分先于急躁", hant: "職分先於急躁" } },
    { en: "Homer lot", zh: "荷马签", lean: { en: "homeward · keep faith", zh: "归途·守信", hant: "歸途·守信" } },
    { en: "Psalm lot", zh: "诗篇签", lean: { en: "rest in refuge · then act", zh: "先安息·再行动", hant: "先安息·再行動" } },
    { en: "Blank page pause", zh: "空白页", lean: { en: "no verse · wait a day", zh: "无签·等一日", hant: "無籤·等一日" } },
  ];
  const LOTS = [
    { en: "White lot", zh: "白签", lean: { en: "yes · proceed carefully", zh: "是·谨慎前行", hant: "是·謹慎前行" } },
    { en: "Black lot", zh: "黑签", lean: { en: "no · hold the line", zh: "否·守住界线", hant: "否·守住界線" } },
    { en: "Marked lot", zh: "记号签", lean: { en: "conditional · set one term", zh: "有条件·设一个条款", hant: "有條件·設一個條款" } },
    { en: "Blank lot", zh: "空签", lean: { en: "redraw later · gather facts", zh: "稍后再抽·收集事实", hant: "稍後再抽·收集事實" } },
  ];
  const BONES = [
    { en: "Four upright", zh: "四直", lean: { en: "stable yes · announce", zh: "稳是·宣告", hant: "穩是·宣告" } },
    { en: "Mixed toss", zh: "混掷", lean: { en: "split path · trial one step", zh: "分叉·试一步", hant: "分叉·試一步" } },
    { en: "All flat", zh: "全平", lean: { en: "rest · do not force", zh: "歇息·勿强求", hant: "歇息·勿強求" } },
    { en: "Odd stack", zh: "奇叠", lean: { en: "surprise · stay flexible", zh: "意外·保持弹性", hant: "意外·保持彈性" } },
  ];
  const FIGURES = [
    { en: "Via", zh: "道路", lean: { en: "path opens · walk steadily", zh: "路开·稳步走", hant: "路開·穩步走" } },
    { en: "Populus", zh: "众人", lean: { en: "crowd mind · choose your lane", zh: "众人意·选自己的道", hant: "眾人意·選自己的道" } },
    { en: "Fortuna Major", zh: "大运", lean: { en: "strong opening · act with buffer", zh: "强开口·留缓冲再行", hant: "強開口·留緩衝再行" } },
    { en: "Carcer", zh: "牢", lean: { en: "stuck loop · change one habit", zh: "卡住·改一个习惯", hant: "卡住·改一個習慣" } },
    { en: "Acquisitio", zh: "获得", lean: { en: "gain · count costs", zh: "获得·算代价", hant: "獲得·算代價" } },
    { en: "Amissio", zh: "失去", lean: { en: "release · close kindly", zh: "放下·善意收尾", hant: "放下·善意收尾" } },
  ];

  function makeRite(cfg) {
    return cfg;
  }

  const RITES = {
    "runes-younger": makeRite({
      summary: {
        en: "Younger Futhark is the sixteen-stave Viking-age rune row — cast or drawn as counsel, not a fixed fate clock.",
        zh: "小弗萨克是十六符的维京时代卢恩字母——抽取或抛掷作指引，不是固定命运钟。",
        hant: "小弗薩克是十六符的維京時代盧恩字母——抽取或拋擲作指引，不是固定命運鐘。",
      },
      how: howPack(
        {
          intro: "You’ll hold a question, cast teaching Younger Futhark staves, then read the rune counsel.",
          steps: [
            { title: "Meet Younger Futhark", body: "Sixteen Viking-age staves." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Cast the Younger staves", body: "Runes scatter." },
            { title: "Reveal a rune", body: "One stave lights." },
            { title: "Read the rune counsel", body: "Stave lean appears." },
            { title: "Rune counsel", body: "Lean for your question." },
          ],
        },
        {
          intro: "你将抱定问题、抛掷教学小弗萨克符文，再读符意。",
          steps: [
            { title: "认识小弗萨克", body: "十六个维京符。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "抛掷小弗萨克", body: "符文散落。" },
            { title: "揭示符文", body: "一符点亮。" },
            { title: "读取符意", body: "符意倾向出现。" },
            { title: "符文指引", body: "符意对照问题。" },
          ],
        },
        {
          intro: "你將抱定問題、拋擲教學小弗薩克符文，再讀符意。",
          steps: [
            { title: "認識小弗薩克", body: "十六個維京符。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "拋擲小弗薩克", body: "符文散落。" },
            { title: "揭示符文", body: "一符點亮。" },
            { title: "讀取符意", body: "符意傾向出現。" },
            { title: "符文指引", body: "符意對照問題。" },
          ],
        }
      ),
      steps: ["intent", "question", "castYounger", "runeReveal", "youngerCounsel", "result"],
      viz: "younger",
      castCta: { en: "Read the rune counsel", zh: "读取符意", hant: "讀取符意" },
      buildCast(state, rng) {
        const rune = pick(rng, YOUNGER);
        return { rune, lean: loc(rune.lean) };
      },
      generate(q, cast) {
        const n = loc({ en: cast.rune.en, zh: cast.rune.zh });
        const ask = q || "";
        const result = isZh()
          ? zhText(
              `对照「${ask || "未写问题"}」：抽到「${n}」，意思是「${cast.lean}」——把它变成今天可做的一步，而不是索取日期。`,
              `對照「${ask || "未寫問題"}」：抽到「${n}」，意思是「${cast.lean}」——把它變成今天可做的一步，而不是索取日期。`
            )
          : `For “${ask || "your question"}”: drew “${n}”, meaning “${cast.lean}” — turn it into a step today, not a request for dates.`;
        return pack({
          title: `${cast.rune.glyph} ${n}`,
          result,
          explain: isZh()
            ? zhText(`教学小弗萨克得「${n}」（${cast.rune.glyph}），倾向「${cast.lean}」。关键词是现代研习用法；真符需完整十六符与文化语境。`, `教學小弗薩克得「${n}」（${cast.rune.glyph}），傾向「${cast.lean}」。關鍵詞是現代研習用法；真符需完整十六符與文化語境。`)
            : `Teaching Younger Futhark draws “${n}” (${cast.rune.glyph}), leaning “${cast.lean}”. Keywords are modern study glosses; real casts need the full sixteen and cultural context.`,
          interpret: interpretQ(q, cast.lean, isZh() ? "小弗萨克符" : "the Younger Futhark rune"),
          details: [
            isZh() ? zhText(`你的问题：「${ask || "未写"}」`, `你的問題：「${ask || "未寫"}」`) : `Your question: “${ask || "unnamed"}”`,
            `${cast.rune.glyph} ${n}`,
            cast.lean,
          ],
          doList: [
            isZh()
              ? zhText(`围绕「${ask || "问题"}」，按「${cast.lean}」做一件今天可完成的小事。`, `圍繞「${ask || "問題"}」，按「${cast.lean}」做一件今天可完成的小事。`)
              : `Around “${ask || "your question"}”, do one small today-action matching “${cast.lean}”.`,
          ],
          dontList: [
            isZh() ? zhText("不要向符文索取准确日期或恐吓他人。", "不要向符文索取準確日期或恐嚇他人。") : "Do not demand exact dates from runes or frighten others with lots.",
          ],
          tone: /thorn|force|刺|力|界/i.test(n + cast.lean) ? "caution" : "mixed",
          vizData: cast,
        });
      },
    }),

    "runes-futhorc": makeRite({
      summary: {
        en: "Anglo-Saxon Futhorc expands the rune row to about thirty-three staves — modern and reconstructed casting for counsel.",
        zh: "盎格鲁－撒克逊弗索克将卢恩扩至约三十三符——现代与重构抛掷作指引。",
        hant: "盎格魯－撒克遜弗索克將盧恩擴至約三十三符——現代與重構拋擲作指引。",
      },
      how: howPack(
        {
          intro: "You’ll hold a question, cast teaching Futhorc staves, then read the stave counsel.",
          steps: [
            { title: "Meet Anglo-Saxon Futhorc", body: "Expanded English rune row." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Cast the Futhorc staves", body: "Staves scatter." },
            { title: "See a Futhorc stave", body: "One stave lights." },
            { title: "Read the stave counsel", body: "Stave lean appears." },
            { title: "Futhorc counsel", body: "Lean for your question." },
          ],
        },
        {
          intro: "你将抱定问题、抛掷教学弗索克符文，再读符意。",
          steps: [
            { title: "认识弗索克", body: "扩展英语卢恩行。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "抛掷弗索克", body: "符文散落。" },
            { title: "查看弗索克符", body: "一符点亮。" },
            { title: "读取符意", body: "符意倾向出现。" },
            { title: "弗索克指引", body: "符意对照问题。" },
          ],
        },
        {
          intro: "你將抱定問題、拋擲教學弗索克符文，再讀符意。",
          steps: [
            { title: "認識弗索克", body: "擴展英語盧恩行。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "拋擲弗索克", body: "符文散落。" },
            { title: "查看弗索克符", body: "一符點亮。" },
            { title: "讀取符意", body: "符意傾向出現。" },
            { title: "弗索克指引", body: "符意對照問題。" },
          ],
        }
      ),
      steps: ["intent", "question", "castFuthorc", "futhorcStave", "futhorcCounsel", "result"],
      viz: "futhorc",
      castCta: { en: "Read the stave counsel", zh: "读取符意", hant: "讀取符意" },
      buildCast(state, rng) {
        const rune = pick(rng, FUTHORC);
        return { rune, lean: loc(rune.lean) };
      },
      generate(q, cast) {
        const n = loc({ en: cast.rune.en, zh: cast.rune.zh });
        return pack({
          title: `${cast.rune.glyph} ${n}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学弗索克得「${n}」，倾向「${cast.lean}」。真符需完整符行与重构语境。`, `教學弗索克得「${n}」，傾向「${cast.lean}」。真符需完整符行與重構語境。`)
            : `Teaching Futhorc draws “${n}”, leaning “${cast.lean}”. Real casts need the full row and reconstructed context.`,
          interpret: interpretQ(q, cast.lean, isZh() ? "弗索克符" : "the Futhorc stave"),
          details: [cast.rune.glyph, n],
          doList: [isZh() ? zhText(`围绕「${cast.lean}」安排一次专注时段。`, `圍繞「${cast.lean}」安排一次專注時段。`) : `Book one focus block matching “${cast.lean}”.`],
          dontList: [isZh() ? zhText("不要伪造古英语权威恐吓他人。", "不要偽造古英語權威恐嚇他人。") : "Do not fake Old English authority to frighten others."],
          tone: "mixed",
          vizData: cast,
        });
      },
    }),

    ogham: makeRite({
      summary: {
        en: "Ogham letter staves are drawn in Celtic revival practice — trees and letters counsel character and timing themes.",
        zh: "欧甘字母棍在凯尔特复兴实践中抽取——树木与字母论性情与时机主题。",
        hant: "歐甘字母棍在凱爾特復興實踐中抽取——樹木與字母論性情與時機主題。",
      },
      how: howPack(
        {
          intro: "You’ll hold a question, draw a teaching ogham fid, then read the tree counsel.",
          steps: [
            { title: "Meet Ogham", body: "Letter staves · tree names." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Draw an ogham stave", body: "Teaching fid." },
            { title: "See the ogham fid", body: "Tree letter lights." },
            { title: "Read the ogham counsel", body: "Tree lean appears." },
            { title: "Ogham counsel", body: "Lean for your question." },
          ],
        },
        {
          intro: "你将抱定问题、抽取教学欧甘字母，再读树意。",
          steps: [
            { title: "认识欧甘", body: "字母棍 · 树名。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "抽取欧甘棍", body: "教学字母。" },
            { title: "查看欧甘字母", body: "树字母点亮。" },
            { title: "读取欧甘指引", body: "树意倾向出现。" },
            { title: "欧甘指引", body: "树意对照问题。" },
          ],
        },
        {
          intro: "你將抱定問題、抽取教學歐甘字母，再讀樹意。",
          steps: [
            { title: "認識歐甘", body: "字母棍 · 樹名。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "抽取歐甘棍", body: "教學字母。" },
            { title: "查看歐甘字母", body: "樹字母點亮。" },
            { title: "讀取歐甘指引", body: "樹意傾向出現。" },
            { title: "歐甘指引", body: "樹意對照問題。" },
          ],
        }
      ),
      steps: ["intent", "question", "drawOgham", "oghamFid", "oghamCounsel", "result"],
      viz: "ogham",
      castCta: { en: "Read the ogham counsel", zh: "读取欧甘指引", hant: "讀取歐甘指引" },
      buildCast(state, rng) {
        const fid = pick(rng, OGHAM);
        return { fid, lean: loc(fid.lean) };
      },
      generate(q, cast) {
        const n = loc({ en: cast.fid.en, zh: cast.fid.zh });
        return pack({
          title: `${cast.fid.glyph} ${n}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学欧甘得「${n}」，倾向「${cast.lean}」。现代复兴体系，非古代德鲁伊历。`, `教學歐甘得「${n}」，傾向「${cast.lean}」。現代復興體系，非古代德魯伊曆。`)
            : `Teaching ogham draws “${n}”, leaning “${cast.lean}”. A Celtic revival practice, not an ancient Druid calendar.`,
          interpret: interpretQ(q, cast.lean, isZh() ? "欧甘字母" : "the ogham fid"),
          details: [cast.fid.glyph, n],
          doList: [isZh() ? zhText(`按「${cast.lean}」安排一次户外或手作小事。`, `按「${cast.lean}」安排一次戶外或手作小事。`) : `Schedule one outdoor or craft small act matching “${cast.lean}”.`],
          dontList: [isZh() ? zhText("不要用树标签羞辱他人。", "不要用樹標籤羞辱他人。") : "Do not shame others with tree labels."],
          tone: "bright",
          vizData: cast,
        });
      },
    }),

    augury: makeRite({
      summary: {
        en: "Augury reads bird flight, calls, and feeding as public omens — a Roman and Greek state craft, here as teaching sky signs.",
        zh: "鸟占以鸟飞、鸣叫与取食作公共征兆——罗马与希腊国务技艺，此处为教学天兆。",
        hant: "鳥占以鳥飛、鳴叫與取食作公共徵兆——羅馬與希臘國務技藝，此處為教學天兆。",
      },
      how: howPack(
        {
          intro: "You’ll hold a question, watch a teaching sky, then read a bird-sign lean.",
          steps: [
            { title: "Meet Augury", body: "Bird flight · calls · feeding." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Watch the teaching sky", body: "Templum opens." },
            { title: "See a bird sign", body: "Flight lean lights." },
            { title: "Read the augury counsel", body: "Sign lean appears." },
            { title: "Augury counsel", body: "Lean for your question." },
          ],
        },
        {
          intro: "你将抱定问题、观看教学天空，再读鸟兆倾向。",
          steps: [
            { title: "认识鸟占", body: "鸟飞 · 鸣叫 · 取食。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "观看教学天空", body: "占域打开。" },
            { title: "查看鸟兆", body: "飞向倾向点亮。" },
            { title: "读取鸟占指引", body: "兆意倾向出现。" },
            { title: "鸟占指引", body: "兆意对照问题。" },
          ],
        },
        {
          intro: "你將抱定問題、觀看教學天空，再讀鳥兆傾向。",
          steps: [
            { title: "認識鳥占", body: "鳥飛 · 鳴叫 · 取食。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "觀看教學天空", body: "占域打開。" },
            { title: "查看鳥兆", body: "飛向傾向點亮。" },
            { title: "讀取鳥占指引", body: "兆意傾向出現。" },
            { title: "鳥占指引", body: "兆意對照問題。" },
          ],
        }
      ),
      steps: ["intent", "question", "watchSky", "birdSign", "auguryCounsel", "result"],
      viz: "augury",
      castCta: { en: "Read the augury counsel", zh: "读取鸟占指引", hant: "讀取鳥占指引" },
      buildCast(state, rng) {
        const bird = pick(rng, BIRDS);
        return { bird, lean: loc(bird.lean) };
      },
      generate(q, cast) {
        const n = loc({ en: cast.bird.en, zh: cast.bird.zh });
        return pack({
          title: n,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学鸟占见「${n}」，倾向「${cast.lean}」。真鸟占属历史国务语境。`, `教學鳥占見「${n}」，傾向「${cast.lean}」。真鳥占屬歷史國務語境。`)
            : `Teaching augury shows “${n}”, leaning “${cast.lean}”. Real augury belonged to historical state craft.`,
          interpret: interpretQ(q, cast.lean, isZh() ? "鸟兆" : "the bird sign"),
          details: [n],
          doList: [isZh() ? zhText(`若兆偏等待，先收集一件可验证的事实。`, `若兆偏等待，先收集一件可驗證的事實。`) : `If the omen waits, gather one verifiable fact first.`],
          dontList: [isZh() ? zhText("不要用鸟兆羞辱他人选择。", "不要用鳥兆羞辱他人選擇。") : "Do not shame others’ choices with bird omens."],
          tone: /caution|wait|慎|寂|silent|left/i.test(n + cast.lean) ? "caution" : "bright",
          vizData: cast,
        });
      },
    }),

    haruspicy: makeRite({
      summary: {
        en: "Etruscan–Roman haruspicy read liver marks for affairs of state — here as an educational symbolic sim only (no animals harmed).",
        zh: "伊特鲁里亚－罗马脏卜为国务读肝脏纹记——此处仅为教育象征模拟（无动物伤害）。",
        hant: "伊特魯里亞－羅馬臟卜為國務讀肝臟紋記——此處僅為教育象徵模擬（無動物傷害）。",
      },
      how: howPack(
        {
          intro: "You’ll hold a question, inspect a teaching Etruscan liver diagram, then read the haruspex lean.",
          steps: [
            { title: "Meet Haruspicy", body: "Liver marks · state omens." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Inspect the Etruscan liver", body: "Teaching marks only." },
            { title: "See a haruspex mark", body: "Mark lights." },
            { title: "Read the haruspex counsel", body: "Mark lean appears." },
            { title: "Haruspicy counsel", body: "Lean for your question." },
          ],
        },
        {
          intro: "你将抱定问题、检视教学伊特鲁里亚肝图，再读脏卜倾向。",
          steps: [
            { title: "认识脏卜", body: "肝纹 · 国务兆。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "检视伊特鲁里亚肝图", body: "仅教学纹记。" },
            { title: "查看脏卜纹记", body: "纹记点亮。" },
            { title: "读取脏卜指引", body: "纹兆倾向出现。" },
            { title: "脏卜指引", body: "兆意对照问题。" },
          ],
        },
        {
          intro: "你將抱定問題、檢視教學伊特魯里亞肝圖，再讀臟卜傾向。",
          steps: [
            { title: "認識臟卜", body: "肝紋 · 國務兆。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "檢視伊特魯里亞肝圖", body: "僅教學紋記。" },
            { title: "查看臟卜紋記", body: "紋記點亮。" },
            { title: "讀取臟卜指引", body: "紋兆傾向出現。" },
            { title: "臟卜指引", body: "兆意對照問題。" },
          ],
        }
      ),
      steps: ["intent", "question", "inspectEtruscanLiver", "haruspexMark", "haruspexCounsel", "result"],
      viz: "haruspex",
      castCta: { en: "Read the haruspex counsel", zh: "读取脏卜指引", hant: "讀取臟卜指引" },
      buildCast(state, rng) {
        const omen = pick(rng, LIVER);
        return { omen, lean: loc(omen.lean) };
      },
      generate(q, cast) {
        const n = loc({ en: cast.omen.en, zh: cast.omen.zh });
        return pack({
          title: n,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学脏卜示「${n}」，倾向「${cast.lean}」。无真实祭牲；历史认识论教育。`, `教學臟卜示「${n}」，傾向「${cast.lean}」。無真實祭牲；歷史認識論教育。`)
            : `Teaching haruspicy shows “${n}”, leaning “${cast.lean}”. No animals harmed — historical epistemology education.`,
          interpret: interpretQ(q, cast.lean, isZh() ? "伊特鲁里亚脏卜" : "the haruspex mark"),
          details: [n],
          doList: [isZh() ? zhText(`按「${cast.lean}」检视今天一个风险点。`, `按「${cast.lean}」檢視今天一個風險點。`) : `Inspect one risk point today matching “${cast.lean}”.`],
          dontList: [isZh() ? zhText("不要伤害动物做占卜。", "不要傷害動物做占卜。") : "Do not harm animals for divination."],
          tone: /裂|delay|risk|暗|watch|cleft/i.test(n + cast.lean) ? "caution" : "mixed",
          vizData: cast,
        });
      },
    }),

    delphi: makeRite({
      summary: {
        en: "The Delphic Oracle spoke through the Pythia’s inspired trance at Apollo’s sanctuary — counsel in verse, not a guarantee.",
        zh: "德尔斐神谕经由皮提亚在阿波罗圣地的灵感出神传达——诗句指引，不是保证。",
        hant: "德爾斐神諭經由皮提亞在阿波羅聖地的靈感出神傳達——詩句指引，不是保證。",
      },
      how: howPack(
        {
          intro: "You’ll hold a question, approach a teaching temple, then receive a Pythia verse lean.",
          steps: [
            { title: "Meet the Delphic Oracle", body: "Pythia · Apollo · verse." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Approach the temple", body: "Teaching sanctuary." },
            { title: "Enter the Pythia trance", body: "Breath settles." },
            { title: "Receive the Pythia verse", body: "Verse lean appears." },
            { title: "Delphic counsel", body: "Verse lean for your question." },
          ],
        },
        {
          intro: "你将抱定问题、走近教学神庙，再领取皮提亚诗句倾向。",
          steps: [
            { title: "认识德尔斐神谕", body: "皮提亚 · 阿波罗 · 诗句。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "走近神庙", body: "教学圣地。" },
            { title: "进入皮提亚出神", body: "呼吸安定。" },
            { title: "领取皮提亚诗句", body: "诗意倾向出现。" },
            { title: "德尔斐指引", body: "诗意对照问题。" },
          ],
        },
        {
          intro: "你將抱定問題、走近教學神廟，再領取皮提亞詩句傾向。",
          steps: [
            { title: "認識德爾斐神諭", body: "皮提亞 · 阿波羅 · 詩句。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "走近神廟", body: "教學聖地。" },
            { title: "進入皮提亞出神", body: "呼吸安定。" },
            { title: "領取皮提亞詩句", body: "詩意傾向出現。" },
            { title: "德爾斐指引", body: "詩意對照問題。" },
          ],
        }
      ),
      steps: ["intent", "question", "approachTemple", "pythiaTrance", "pythiaVerse", "result"],
      viz: "delphi",
      castCta: { en: "Receive the Pythia verse", zh: "领取皮提亚诗句", hant: "領取皮提亞詩句" },
      buildCast(state, rng) {
        const verse = pick(rng, PYTHIA);
        return { verse, lean: loc(verse.lean) };
      },
      generate(q, cast) {
        const n = loc({ en: cast.verse.en, zh: cast.verse.zh });
        return pack({
          title: n,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学德尔斐得「${n}」，倾向「${cast.lean}」。真神谕属历史宗教语境。`, `教學德爾斐得「${n}」，傾向「${cast.lean}」。真神諭屬歷史宗教語境。`)
            : `Teaching Delphi yields “${n}”, leaning “${cast.lean}”. Real oracles belonged to historical religious context.`,
          interpret: interpretQ(q, cast.lean, isZh() ? "皮提亚诗句" : "the Pythia verse"),
          details: [n],
          doList: [isZh() ? zhText(`把「${cast.lean}」写成今天一句可执行提醒。`, `把「${cast.lean}」寫成今天一句可執行提醒。`) : `Write “${cast.lean}” as one doable reminder today.`],
          dontList: [isZh() ? zhText("不要伪造神谕权威强迫他人。", "不要偽造神諭權威強迫他人。") : "Do not fake oracular authority to coerce others."],
          tone: /veiled|unclear|隐|不明/i.test(n + cast.lean) ? "caution" : "deep",
          vizData: cast,
        });
      },
    }),

    bibliomancy: makeRite({
      summary: {
        en: "Bibliomancy (sortes) opens sacred or literary books at random — Virgil, Homer, or scripture as counsel mirrors.",
        zh: "书占（Sortes）随机翻开圣典或文学书——维吉尔、荷马或经文作指引之镜。",
        hant: "書占（Sortes）隨機翻開聖典或文學書——維吉爾、荷馬或經文作指引之鏡。",
      },
      how: howPack(
        {
          intro: "You’ll hold a question, open a teaching sortes book, then read the verse lean.",
          steps: [
            { title: "Meet Bibliomancy", body: "Books · random page · verse." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Open the sortes book", body: "Pages flutter." },
            { title: "See the sortes verse", body: "Passage lights." },
            { title: "Read the bibliomancy counsel", body: "Verse lean appears." },
            { title: "Bibliomancy counsel", body: "Verse lean for your question." },
          ],
        },
        {
          intro: "你将抱定问题、翻开教学签书，再读诗句倾向。",
          steps: [
            { title: "认识书占", body: "书 · 随机页 · 诗句。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "翻开签书", body: "书页翻动。" },
            { title: "查看签诗", body: "段落点亮。" },
            { title: "读取书占指引", body: "诗意倾向出现。" },
            { title: "书占指引", body: "诗意对照问题。" },
          ],
        },
        {
          intro: "你將抱定問題、翻開教學籤書，再讀詩句傾向。",
          steps: [
            { title: "認識書占", body: "書 · 隨機頁 · 詩句。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "翻開籤書", body: "書頁翻動。" },
            { title: "查看籤詩", body: "段落點亮。" },
            { title: "讀取書占指引", body: "詩意傾向出現。" },
            { title: "書占指引", body: "詩意對照問題。" },
          ],
        }
      ),
      steps: ["intent", "question", "openSortes", "sortesVerse", "bibliomancyCounsel", "result"],
      viz: "sortes",
      castCta: { en: "Read the bibliomancy counsel", zh: "读取书占指引", hant: "讀取書占指引" },
      buildCast(state, rng) {
        const verse = pick(rng, SORTES);
        return { verse, lean: loc(verse.lean), page: 1 + Math.floor(rng() * 400) };
      },
      generate(q, cast) {
        const n = loc({ en: cast.verse.en, zh: cast.verse.zh });
        return pack({
          title: `${n} · p.${cast.page}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学书占翻至约第 ${cast.page} 页「${n}」，倾向「${cast.lean}」。`, `教學書占翻至約第 ${cast.page} 頁「${n}」，傾向「${cast.lean}」。`)
            : `Teaching bibliomancy opens near p.${cast.page} “${n}”, leaning “${cast.lean}”.`,
          interpret: interpretQ(q, cast.lean, isZh() ? "签书诗句" : "the sortes verse"),
          details: [n, `p.${cast.page}`],
          doList: [isZh() ? zhText(`把「${cast.lean}」变成今天一件可完成的小事。`, `把「${cast.lean}」變成今天一件可完成的小事。`) : `Turn “${cast.lean}” into one completable small act today.`],
          dontList: [isZh() ? zhText("不要用经文羞辱信仰差异。", "不要用經文羞辱信仰差異。") : "Do not shame faith differences with scripture lots."],
          tone: /blank|wait|空白|等/i.test(n + cast.lean) ? "caution" : "deep",
          vizData: cast,
        });
      },
    }),

    cleromancy: makeRite({
      summary: {
        en: "Cleromancy casts lots, dice, or marked objects for decisions — among the oldest attested methods.",
        zh: "抽签术抛掷签、骰或带标记物件作抉择——人类最古老的占卜方法之一。",
        hant: "抽籤術拋擲籤、骰或帶標記物件作抉擇——人類最古老的占卜方法之一。",
      },
      how: howPack(
        {
          intro: "You’ll hold a question, cast teaching lots, then read the lot lean.",
          steps: [
            { title: "Meet Cleromancy", body: "Lots · dice · marked objects." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Cast the lots", body: "Objects settle." },
            { title: "See the lot mark", body: "Mark lights." },
            { title: "Read the lot counsel", body: "Lot lean appears." },
            { title: "Cleromancy counsel", body: "Lean for your question." },
          ],
        },
        {
          intro: "你将抱定问题、抛掷教学签物，再读签意。",
          steps: [
            { title: "认识抽签术", body: "签 · 骰 · 标记物。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "抛掷签物", body: "物件安定。" },
            { title: "查看签记", body: "标记点亮。" },
            { title: "读取签意", body: "签意倾向出现。" },
            { title: "抽签指引", body: "签意对照问题。" },
          ],
        },
        {
          intro: "你將抱定問題、拋擲教學籤物，再讀籤意。",
          steps: [
            { title: "認識抽籤術", body: "籤 · 骰 · 標記物。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "拋擲籤物", body: "物件安定。" },
            { title: "查看籤記", body: "標記點亮。" },
            { title: "讀取籤意", body: "籤意傾向出現。" },
            { title: "抽籤指引", body: "籤意對照問題。" },
          ],
        }
      ),
      steps: ["intent", "question", "castLots", "lotMark", "cleromancyCounsel", "result"],
      viz: "lots",
      castCta: { en: "Read the lot counsel", zh: "读取签意", hant: "讀取籤意" },
      buildCast(state, rng) {
        const lot = pick(rng, LOTS);
        return { lot, lean: loc(lot.lean) };
      },
      generate(q, cast) {
        const n = loc({ en: cast.lot.en, zh: cast.lot.zh });
        return pack({
          title: n,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学抽签得「${n}」，倾向「${cast.lean}」。真抽签是历史决策工具。`, `教學抽籤得「${n}」，傾向「${cast.lean}」。真抽籤是歷史決策工具。`)
            : `Teaching cleromancy draws “${n}”, leaning “${cast.lean}”. Real lots were historical decision tools.`,
          interpret: interpretQ(q, cast.lean, isZh() ? "签记" : "the cast lot"),
          details: [n],
          doList: [isZh() ? zhText(`若签偏否或空，先收集一件可验证的事实。`, `若籤偏否或空，先收集一件可驗證的事實。`) : `If the lot is no or blank, gather one verifiable fact first.`],
          dontList: [isZh() ? zhText("不要用签强迫他人服从。", "不要用籤強迫他人服從。") : "Do not coerce others with a lot."],
          tone: /black|no|blank|否|空/i.test(n + cast.lean) ? "caution" : "mixed",
          vizData: cast,
        });
      },
    }),

    astragalomancy: makeRite({
      summary: {
        en: "Astragalomancy tosses knucklebones (astragali) for numbered oracles — a Greek and Roman game of chance turned counsel.",
        zh: "距骨占抛掷距骨（关节骨）得编号神谕——希腊罗马博弈转为指引。",
        hant: "距骨占拋擲距骨（關節骨）得編號神諭——希臘羅馬博弈轉為指引。",
      },
      how: howPack(
        {
          intro: "You’ll hold a question, toss teaching knucklebones, then read the bone-face lean.",
          steps: [
            { title: "Meet Astragalomancy", body: "Knucklebones · numbered faces." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Toss the knucklebones", body: "Bones tumble." },
            { title: "See the bone faces", body: "Faces settle." },
            { title: "Read the astragal counsel", body: "Face lean appears." },
            { title: "Astragal counsel", body: "Lean for your question." },
          ],
        },
        {
          intro: "你将抱定问题、抛掷教学距骨，再读骨面倾向。",
          steps: [
            { title: "认识距骨占", body: "距骨 · 编号面。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "抛掷距骨", body: "骨翻滚。" },
            { title: "查看骨面", body: "骨面安定。" },
            { title: "读取距骨指引", body: "骨面倾向出现。" },
            { title: "距骨指引", body: "骨意对照问题。" },
          ],
        },
        {
          intro: "你將抱定問題、拋擲教學距骨，再讀骨面傾向。",
          steps: [
            { title: "認識距骨占", body: "距骨 · 編號面。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "拋擲距骨", body: "骨翻滾。" },
            { title: "查看骨面", body: "骨面安定。" },
            { title: "讀取距骨指引", body: "骨面傾向出現。" },
            { title: "距骨指引", body: "骨意對照問題。" },
          ],
        }
      ),
      steps: ["intent", "question", "tossBonesEuro", "boneFaces", "astragalCounsel", "result"],
      viz: "astragal",
      castCta: { en: "Read the astragal counsel", zh: "读取距骨指引", hant: "讀取距骨指引" },
      buildCast(state, rng) {
        const face = pick(rng, BONES);
        return { face, lean: loc(face.lean) };
      },
      generate(q, cast) {
        const n = loc({ en: cast.face.en, zh: cast.face.zh });
        return pack({
          title: n,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学距骨占得「${n}」，倾向「${cast.lean}」。真距骨有四面分值传统。`, `教學距骨占得「${n}」，傾向「${cast.lean}」。真距骨有四面分值傳統。`)
            : `Teaching astragalomancy shows “${n}”, leaning “${cast.lean}”. Real knucklebones had four-face scoring traditions.`,
          interpret: interpretQ(q, cast.lean, isZh() ? "距骨面" : "the knucklebone faces"),
          details: [n],
          doList: [isZh() ? zhText(`按「${cast.lean}」做一件今天可完成的小事。`, `按「${cast.lean}」做一件今天可完成的小事。`) : `Do one small today-action matching “${cast.lean}”.`],
          dontList: [isZh() ? zhText("不要用博弈恐吓他人做重大决定。", "不要用博弈恐嚇他人做重大決定。") : "Do not scare others into major moves from a game of chance."],
          tone: /flat|rest|平|歇/i.test(n + cast.lean) ? "caution" : "mixed",
          vizData: cast,
        });
      },
    }),

    "geomancy-west": makeRite({
      summary: {
        en: "Western geomancy draws sixteen figures from rows of dots — transmitted from Islamic North Africa into medieval Europe.",
        zh: "西方土占以点行生成十六个卦象——由伊斯兰北非传入中世纪欧洲。",
        hant: "西方土占以點行生成十六個卦象——由伊斯蘭北非傳入中世紀歐洲。",
      },
      how: howPack(
        {
          intro: "You’ll hold a question, mark teaching dot rows, then read a geomantic figure lean.",
          steps: [
            { title: "Meet Western Geomancy", body: "Sixteen figures · dotted lots." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Mark the dot rows", body: "Teaching points." },
            { title: "See the geomantic figure", body: "Figure lights." },
            { title: "Read the geomancy counsel", body: "Figure lean appears." },
            { title: "Geomancy counsel", body: "Lean for your question." },
          ],
        },
        {
          intro: "你将抱定问题、点画教学点行，再读土占卦象倾向。",
          steps: [
            { title: "认识西方土占", body: "十六卦 · 点签。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "点画点行", body: "教学点。" },
            { title: "查看土占卦象", body: "卦象点亮。" },
            { title: "读取土占指引", body: "卦意倾向出现。" },
            { title: "土占指引", body: "卦意对照问题。" },
          ],
        },
        {
          intro: "你將抱定問題、點畫教學點行，再讀土占卦象傾向。",
          steps: [
            { title: "認識西方土占", body: "十六卦 · 點籤。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "點畫點行", body: "教學點。" },
            { title: "查看土占卦象", body: "卦象點亮。" },
            { title: "讀取土占指引", body: "卦意傾向出現。" },
            { title: "土占指引", body: "卦意對照問題。" },
          ],
        }
      ),
      steps: ["intent", "question", "markDots", "geomancyFigure", "geomancyCounsel", "result"],
      viz: "geomancy",
      castCta: { en: "Read the geomancy counsel", zh: "读取土占指引", hant: "讀取土占指引" },
      buildCast(state, rng) {
        const figure = pick(rng, FIGURES);
        return { figure, lean: loc(figure.lean) };
      },
      generate(q, cast) {
        const n = loc({ en: cast.figure.en, zh: cast.figure.zh });
        return pack({
          title: n,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学西方土占得「${n}」，倾向「${cast.lean}」。真土占需完整十六卦与宫位。`, `教學西方土占得「${n}」，傾向「${cast.lean}」。真土占需完整十六卦與宮位。`)
            : `Teaching Western geomancy yields “${n}”, leaning “${cast.lean}”. Real work needs the full sixteen and houses.`,
          interpret: interpretQ(q, cast.lean, isZh() ? "土占卦象" : "the geomantic figure"),
          details: [n],
          doList: [isZh() ? zhText(`按「${cast.lean}」推进一件可验证的下一步。`, `按「${cast.lean}」推進一件可驗證的下一步。`) : `Advance one verifiable next step matching “${cast.lean}”.`],
          dontList: [isZh() ? zhText("不要用土占恐吓他人财务或健康。", "不要用土占恐嚇他人財務或健康。") : "Do not frighten others about money or health with geomancy."],
          tone: /carcer|stuck|牢|卡住|amissio|失去/i.test(n + cast.lean) ? "caution" : "mixed",
          vizData: cast,
        });
      },
    }),
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
            "本站为教育性游玩——不能替代受训祭司／占卜、医疗、法律或安全判断。",
            "本站為教育性遊玩——不能替代受訓祭司／占卜、醫療、法律或安全判斷。"
          )
        : "Educational play on this site — not a substitute for trained priestly/divinatory practice, medicine, law, or safety judgment.",
    };
  }
  function runCast(id, state) {
    const rite = RITES[id];
    if (!rite) return null;
    const rng = mulberry32(seedFrom(state.question || state.focus, state.nonce, id));
    const cast = Object.assign({}, state.cast || {}, rite.buildCast(state, rng) || {});
    return rite.generate(state.question || state.focus || "", cast, rng);
  }

  window.FatumClassicalEuroOracles = { IDS, has, get, howFor, runCast, loc };
})();
