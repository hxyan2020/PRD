/**
 * Korean & Vietnamese destiny / bibliomancy oracles — unique steps, visuals, readings.
 * Saju · Tojeong · Gunghap · Tứ Trụ · Tử Vi · Bói Kiều
 */
(function () {
  "use strict";

  const IDS = ["saju", "tojeong", "gunghap", "tu-tru", "tu-vi", "boi-kieu"];

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
      kind: "koreavn",
      ...r,
      disclaimer: isZh()
        ? zhText(
            "教育性模拟——不能替代受训命理／合婚／签诗实践，也不能替代医疗、法律或安全判断。可能不准确；无法预测黑天鹅事件。",
            "教育性模擬——不能替代受訓命理／合婚／簽詩實踐，也不能替代醫療、法律或安全判斷。可能不準確；無法預測黑天鵝事件。"
          )
        : "Educational simulation — not a substitute for trained saju/gunghap/Kiều practice, medicine, law, or safety judgment. May be inaccurate; cannot predict black swan events.",
    };
    return RM ? RM.structuredReading(base) : base;
  }

  function interpretQ(q, lean, mechanic) {
    const RM = window.FatumResultModel;
    const body = isZh()
      ? zhText(
          `你问的是「${q || "未写明的事"}」。以${mechanic}给出的「${lean}」倾向为镜：先改一件你能控制的安排，再用日常证据核对——不要把模拟盘当成外在命令。`,
          `你問的是「${q || "未寫明的事"}」。以${mechanic}給出的「${lean}」傾向為鏡：先改一件你能控制的安排，再用日常證據核對——不要把模擬盤當成外在命令。`
        )
      : `You asked about “${q || "an unnamed matter"}”. Hold the “${lean}” lean from ${mechanic} as a mirror: change one arrangement you control, then check ordinary evidence — do not treat a simulated chart as an external order.`;
    return RM ? RM.interpretWithQuestion(q, body) : body;
  }

  const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  const SIJUSIN = [
    { en: "Bi-gyeon (peer)", zh: "比肩", lean: { en: "stand beside equals", zh: "并立同侪", hant: "並立同儕" } },
    { en: "Sik-sang (output)", zh: "食神", lean: { en: "express · create", zh: "表达·创造", hant: "表達·創造" } },
    { en: "Jae-seong (wealth)", zh: "正财", lean: { en: "steady resource", zh: "稳健资源", hant: "穩健資源" } },
    { en: "Gwan-seong (officer)", zh: "正官", lean: { en: "role · duty", zh: "职分·责任", hant: "職分·責任" } },
    { en: "In-seong (resource)", zh: "正印", lean: { en: "learn · shelter", zh: "学习·庇护", hant: "學習·庇護" } },
  ];
  const TOJEONG_LOTS = [
    { n: 1, en: "Spring turn", zh: "春机", lean: { en: "open soft starts", zh: "轻开新局", hant: "輕開新局" } },
    { n: 2, en: "Summer blaze", zh: "夏炎", lean: { en: "visible push", zh: "外显推进", hant: "外顯推進" } },
    { n: 3, en: "Autumn weigh", zh: "秋衡", lean: { en: "trim · choose", zh: "修剪·抉择", hant: "修剪·抉擇" } },
    { n: 4, en: "Winter hold", zh: "冬藏", lean: { en: "conserve strength", zh: "蓄力守成", hant: "蓄力守成" } },
  ];
  const HAP_BANDS = [
    { en: "Warm fit", zh: "温合", lean: { en: "easy rapport · still name needs", zh: "易亲近·仍要说清需要", hant: "易親近·仍要說清需要" } },
    { en: "Workable tension", zh: "可磨合", lean: { en: "friction that teaches", zh: "摩擦可教", hant: "摩擦可教" } },
    { en: "Careful pace", zh: "宜缓", lean: { en: "slow the merge", zh: "放慢合并", hant: "放慢合併" } },
    { en: "Complementary poles", zh: "相补", lean: { en: "opposite strengths", zh: "相反之长", hant: "相反之長" } },
  ];
  const CUNG = [
    { en: "Mệnh (Self)", zh: "命宫", lean: { en: "self path", zh: "自身之路", hant: "自身之路" } },
    { en: "Quan Lộc (Career)", zh: "官禄", lean: { en: "work visibility", zh: "事业可见度", hant: "事業可見度" } },
    { en: "Tài Bạch (Wealth)", zh: "财帛", lean: { en: "resource flow", zh: "资源流动", hant: "資源流動" } },
    { en: "Phu Thê (Partner)", zh: "夫妻", lean: { en: "bond pattern", zh: "伴侣模式", hant: "伴侶模式" } },
    { en: "Phúc Đức (Fortune)", zh: "福德", lean: { en: "inner weather", zh: "内在气候", hant: "內在氣候" } },
  ];
  const KIEU_VERSES = [
    {
      en: "“A hundred years — in this life — of which one can tell?”",
      zh: "「百年身世，欲说还休。」",
      hant: "「百年身世，欲說還休。」",
      lean: { en: "name the chapter you are in", zh: "先点明你所处的章节", hant: "先點明你所處的章節" },
    },
    {
      en: "“Talent and fate — often two strands that cross.”",
      zh: "「才命两途，常相交错。」",
      hant: "「才命兩途，常相交錯。」",
      lean: { en: "skill vs timing — pick one lever", zh: "才与时——只扳一个杠杆", hant: "才與時——只扳一個槓桿" },
    },
    {
      en: "“The heart still holds a bright moon over the river.”",
      zh: "「心头仍有江上明月。」",
      hant: "「心頭仍有江上明月。」",
      lean: { en: "keep one clean hope", zh: "留一盏干净的希望", hant: "留一盞乾淨的希望" },
    },
    {
      en: "“Words of parting scatter like autumn leaves.”",
      zh: "「别语如秋叶散落。」",
      hant: "「別語如秋葉散落。」",
      lean: { en: "say less · mean more", zh: "少说·说准", hant: "少說·說準" },
    },
  ];

  function pillarsFromDate(dateStr, rng) {
    const d = dateStr ? new Date(dateStr + "T12:00:00") : new Date();
    const y = d.getFullYear() || 2000;
    const m = (d.getMonth?.() ?? 0) + 1;
    const day = d.getDate?.() || 1;
    const hourIdx = Math.floor(rng() * 12);
    const yearP = STEMS[y % 10] + BRANCHES[y % 12];
    const monthP = STEMS[(y * 2 + m) % 10] + BRANCHES[(m + 1) % 12];
    const dayP = STEMS[(y + day) % 10] + BRANCHES[(day + m) % 12];
    const hourP = STEMS[(day + hourIdx) % 10] + BRANCHES[hourIdx];
    return { yearP, monthP, dayP, hourP, hourIdx };
  }

  const RITES = {
    saju: {
      summary: {
        en: "Saju Palja builds four Korean pillars from birth year, month, day, and hour — then weighs Daymaster against the other stems for destiny and timing themes.",
        zh: "韩国四柱（四柱八字）由出生年月日时立四柱，再以日主对照其余干支论格局与时机。",
        hant: "韓國四柱（四柱八字）由出生年月日時立四柱，再以日主對照其餘干支論格局與時機。",
      },
      how: {
        en: {
          intro: "Saju starts with birth data. You’ll set date and hour, then see a teaching four-pillar board and a ten-god lean.",
          steps: [
            { title: "Meet Saju Palja", body: "Four pillars · Daymaster · ten gods." },
            { title: "Enter birth date", body: "Year · month · day for the pillars." },
            { title: "Choose the hour pillar", body: "Twelve double-hours complete the chart." },
            { title: "Read the ten-god lean", body: "A teaching sijusin highlights." },
            { title: "Saju counsel", body: "Pillar lean for your focus." },
          ],
        },
        zh: {
          intro: "四柱始于生辰。你将设定日期与时辰，再看教学四柱盘与十神倾向。",
          steps: [
            { title: "认识韩国四柱", body: "四柱 · 日主 · 十神。" },
            { title: "输入出生日期", body: "年·月·日立柱。" },
            { title: "选择时柱", body: "十二时辰补全命盘。" },
            { title: "读取十神倾向", body: "教学十神点亮。" },
            { title: "四柱指引", body: "柱意对照焦点。" },
          ],
        },
        hant: {
          intro: "四柱始於生辰。你將設定日期與時辰，再看教學四柱盤與十神傾向。",
          steps: [
            { title: "認識韓國四柱", body: "四柱 · 日主 · 十神。" },
            { title: "輸入出生日期", body: "年·月·日立柱。" },
            { title: "選擇時柱", body: "十二時辰補全命盤。" },
            { title: "讀取十神傾向", body: "教學十神點亮。" },
            { title: "四柱指引", body: "柱意對照焦點。" },
          ],
        },
      },
      steps: ["intent", "birth", "sajuHour", "sijusin", "result"],
      viz: "saju-board",
      castCta: { en: "Read the ten-god lean", zh: "读取十神倾向", hant: "讀取十神傾向" },
      buildCast(state, rng) {
        const p = pillarsFromDate(state.birthDate, rng);
        if (state.hourIndex != null && state.hourIndex !== "") {
          const hi = Number(state.hourIndex);
          p.hourIdx = hi;
          p.hourP = STEMS[(p.dayP.charCodeAt(0) + hi) % 10] + BRANCHES[hi % 12];
        }
        const god = pick(rng, SIJUSIN);
        return { ...p, god, lean: loc(god.lean), focus: state.focus || state.question || "" };
      },
      generate(q, cast) {
        const ask = q || cast.focus;
        return pack({
          title: `${cast.dayP} · ${loc({ en: cast.god.en, zh: cast.god.zh })}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(
                `教学韩国四柱示日柱「${cast.dayP}」，时柱「${cast.hourP}」，十神「${cast.god.zh}」，倾向「${cast.lean}」。真推命需节气与真太阳时；此处为柱意教育。`,
                `教學韓國四柱示日柱「${cast.dayP}」，時柱「${cast.hourP}」，十神「${cast.god.zh}」，傾向「${cast.lean}」。真推命需節氣與真太陽時；此處為柱意教育。`
              )
            : `Teaching Saju shows day pillar “${cast.dayP}”, hour “${cast.hourP}”, ten-god “${cast.god.en}”, leaning “${cast.lean}”. Real charts need solar terms; pillar education here.`,
          interpret: interpretQ(ask, cast.lean, isZh() ? zhText("韩国四柱十神", "韓國四柱十神") : "Saju ten-gods"),
          details: [
            isZh() ? `年柱：${cast.yearP}` : `Year: ${cast.yearP}`,
            isZh() ? `月柱：${cast.monthP}` : `Month: ${cast.monthP}`,
            isZh() ? `日柱：${cast.dayP}` : `Day: ${cast.dayP}`,
            isZh() ? `时柱：${cast.hourP}` : `Hour: ${cast.hourP}`,
          ],
          doList: [
            isZh()
              ? zhText(`就「${cast.lean}」排一件本周可验证的小安排。`, `就「${cast.lean}」排一件本週可驗證的小安排。`)
              : `Schedule one checkable act this week matching “${cast.lean}”.`,
          ],
          dontList: [
            isZh()
              ? zhText("不要用教学盘替人决定婚嫁或解约。", "不要用教學盤替人決定婚嫁或解約。")
              : "Do not decide marriage or contracts for others from a teaching board.",
          ],
          tone: "mixed",
          vizData: cast,
        });
      },
    },

    tojeong: {
      summary: {
        en: "Tojeong Bigyeol is Yi Ji-ham’s numerological new-year fortune — still opened each January for yearly counsel themes.",
        zh: "土亭秘诀相传为李之菡的数理年运书——韩国人仍常在岁首翻查年度指引。",
        hant: "土亭秘訣相傳為李之菡的數理年運書——韓國人仍常在歲首翻查年度指引。",
      },
      how: {
        en: {
          intro: "Tojeong maps a birth year into a yearly lot. You’ll set the year, draw a teaching lot, then open the almanac lean.",
          steps: [
            { title: "Meet Tojeong Bigyeol", body: "Birth year · lot number · seasonal counsel." },
            { title: "Enter birth year", body: "The seed for this year’s teaching lot." },
            { title: "Draw the year lot", body: "A numbered scroll settles." },
            { title: "Open the almanac", body: "Seasonal lean appears." },
            { title: "Year counsel", body: "Lot lean for your ask." },
          ],
        },
        zh: {
          intro: "土亭把出生年映入年签。你将设定年份、抽教学签，再打开通书倾向。",
          steps: [
            { title: "认识土亭秘诀", body: "出生年 · 签数 · 季节指引。" },
            { title: "输入出生年", body: "作为本年教学签的种子。" },
            { title: "抽取年签", body: "编号卷轴落下。" },
            { title: "打开通书", body: "出现季节倾向。" },
            { title: "年运指引", body: "签意对照所问。" },
          ],
        },
        hant: {
          intro: "土亭把出生年映入年籤。你將設定年份、抽教學籤，再打開通書傾向。",
          steps: [
            { title: "認識土亭秘訣", body: "出生年 · 籤數 · 季節指引。" },
            { title: "輸入出生年", body: "作為本年教學籤的種子。" },
            { title: "抽取年籤", body: "編號捲軸落下。" },
            { title: "打開通書", body: "出現季節傾向。" },
            { title: "年運指引", body: "籤意對照所問。" },
          ],
        },
      },
      steps: ["intent", "birthyear", "tojeongLot", "almanac", "result"],
      viz: "tojeong-scroll",
      castCta: { en: "Open the almanac", zh: "打开通书", hant: "打開通書" },
      buildCast(state, rng) {
        const year = Number(state.birthYear) || new Date().getFullYear() - 30;
        const lot = pick(rng, TOJEONG_LOTS);
        const code = 1 + ((year * 7 + Number(state.nonce || 0)) % 64);
        return { year, lot, code, lean: loc(lot.lean) };
      },
      generate(q, cast) {
        return pack({
          title: isZh()
            ? zhText(`${cast.year}生 · 签 ${cast.code} · ${cast.lot.zh}`, `${cast.year}生 · 籤 ${cast.code} · ${cast.lot.zh}`)
            : `Born ${cast.year} · lot ${cast.code} · ${cast.lot.en}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(
                `教学土亭以${cast.year}年生得签号 ${cast.code}（「${cast.lot.zh}」），倾向「${cast.lean}」。真推演有固定数理表；此处为年运教育。`,
                `教學土亭以${cast.year}年生得籤號 ${cast.code}（「${cast.lot.zh}」），傾向「${cast.lean}」。真推演有固定數理表；此處為年運教育。`
              )
            : `Teaching Tojeong for birth year ${cast.year} draws lot ${cast.code} (“${cast.lot.en}”), leaning “${cast.lean}”. Real tables are fixed; year-counsel education here.`,
          interpret: interpretQ(q, cast.lean, isZh() ? zhText("土亭年签", "土亭年籤") : "the Tojeong lot"),
          details: [
            isZh() ? `出生年：${cast.year}` : `Birth year: ${cast.year}`,
            isZh() ? `签号：${cast.code}` : `Lot: ${cast.code}`,
            loc({ en: cast.lot.en, zh: cast.lot.zh }),
          ],
          doList: [
            isZh()
              ? zhText(`按「${cast.lean}」给本季排一个可检查的节点。`, `按「${cast.lean}」給本季排一個可檢查的節點。`)
              : `Place one checkable seasonal checkpoint per “${cast.lean}”.`,
          ],
          dontList: [
            isZh()
              ? zhText("不要因年签放弃必要医疗或法律行动。", "不要因年籤放棄必要醫療或法律行動。")
              : "Do not skip needed medical or legal action because of a year lot.",
          ],
          tone: /缓|藏|hold|conserve|trim/i.test(cast.lean) ? "caution" : "bright",
          vizData: cast,
        });
      },
    },

    gunghap: {
      summary: {
        en: "Gunghap reads marriage or partnership fit from two Saju charts — multiple layers of stem/branch harmony, not a single ‘soulmate’ score.",
        zh: "宫合用双方四柱多层看合婚／配对——是干支调和的多面观察，不是单一「命定」分数。",
        hant: "宮合用雙方四柱多層看合婚／配對——是干支調和的多面觀察，不是單一「命定」分數。",
      },
      how: {
        en: {
          intro: "Gunghap needs two birth marks. You’ll enter both dates, then see a teaching harmony band.",
          steps: [
            { title: "Meet Gunghap", body: "Two charts · harmony layers · counsel." },
            { title: "Your birth date", body: "First chart seed." },
            { title: "Partner birth date", body: "Second chart seed." },
            { title: "Weigh the hap score", body: "A teaching band lights." },
            { title: "Compatibility counsel", body: "Band lean for the bond question." },
          ],
        },
        zh: {
          intro: "宫合需要两人的生辰标记。你将输入双方日期，再看教学合盘色带。",
          steps: [
            { title: "认识宫合", body: "双盘 · 合层 · 指引。" },
            { title: "你的出生日期", body: "第一盘种子。" },
            { title: "对方出生日期", body: "第二盘种子。" },
            { title: "衡量合分", body: "教学色带点亮。" },
            { title: "合婚指引", body: "色带倾向对照关系问题。" },
          ],
        },
        hant: {
          intro: "宮合需要兩人的生辰標記。你將輸入雙方日期，再看教學合盤色帶。",
          steps: [
            { title: "認識宮合", body: "雙盤 · 合層 · 指引。" },
            { title: "你的出生日期", body: "第一盤種子。" },
            { title: "對方出生日期", body: "第二盤種子。" },
            { title: "衡量合分", body: "教學色帶點亮。" },
            { title: "合婚指引", body: "色帶傾向對照關係問題。" },
          ],
        },
      },
      steps: ["intent", "selfbirth", "partnerbirth", "hapscore", "result"],
      viz: "gunghap-rings",
      castCta: { en: "Weigh the hap score", zh: "衡量合分", hant: "衡量合分" },
      buildCast(state, rng) {
        const band = pick(rng, HAP_BANDS);
        const score = 55 + Math.floor(rng() * 40);
        return {
          self: state.birthDate || "",
          partner: state.partnerBirth || "",
          band,
          score,
          lean: loc(band.lean),
        };
      },
      generate(q, cast) {
        return pack({
          title: `${loc({ en: cast.band.en, zh: cast.band.zh })} · ${cast.score}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(
                `教学宫合以双方生辰得「${cast.band.zh}」色带（示意分 ${cast.score}），倾向「${cast.lean}」。真合婚看多层；此处为关系教育。`,
                `教學宮合以雙方生辰得「${cast.band.zh}」色帶（示意分 ${cast.score}），傾向「${cast.lean}」。真合婚看多層；此處為關係教育。`
              )
            : `Teaching Gunghap shows band “${cast.band.en}” (indicative ${cast.score}), leaning “${cast.lean}”. Real gunghap is multi-layer; relationship education here.`,
          interpret: interpretQ(q || "partnership", cast.lean, isZh() ? zhText("宫合色带", "宮合色帶") : "the Gunghap band"),
          details: [
            isZh() ? `己方：${cast.self || "—"}` : `Self: ${cast.self || "—"}`,
            isZh() ? `对方：${cast.partner || "—"}` : `Partner: ${cast.partner || "—"}`,
            `${cast.score}`,
          ],
          doList: [
            isZh()
              ? zhText(`就「${cast.lean}」与对方做一次具体协商（时间／边界／钱）。`, `就「${cast.lean}」與對方做一次具體協商（時間／邊界／錢）。`)
              : `Have one concrete talk (time / boundaries / money) matching “${cast.lean}”.`,
          ],
          dontList: [
            isZh()
              ? zhText("不要用合分羞辱或胁迫对方。", "不要用合分羞辱或脅迫對方。")
              : "Do not shame or coerce a partner with a hap score.",
          ],
          tone: /缓|Careful|friction/i.test(cast.band.en + cast.lean) ? "caution" : "bright",
          vizData: cast,
        });
      },
    },

    "tu-tru": {
      summary: {
        en: "Tứ Trụ is the Vietnamese four-pillars tradition — stems and branches from birth data, read for destiny themes in a Việt cultural frame.",
        zh: "越南四柱（Tứ Trụ）依生辰立干支四柱，在越南文化语境中论命运主题。",
        hant: "越南四柱（Tứ Trụ）依生辰立干支四柱，在越南文化語境中論命運主題。",
      },
      how: {
        en: {
          intro: "Tứ Trụ mirrors four pillars with Vietnamese naming. You’ll enter birth, pick a can chi hour lens, then read the board.",
          steps: [
            { title: "Meet Tứ Trụ", body: "Can Chi · four trụ · Daymaster." },
            { title: "Enter birth date", body: "Seed for year/month/day trụ." },
            { title: "Set Can Chi hour", body: "Twelve chi complete the hour trụ." },
            { title: "Reveal the trụ board", body: "Four teaching pillars light." },
            { title: "Tứ Trụ counsel", body: "Board lean for your question." },
          ],
        },
        zh: {
          intro: "越南四柱用干支命名。你将输入生辰、选择时辰，再读教学柱盘。",
          steps: [
            { title: "认识越南四柱", body: "干支 · 四柱 · 日主。" },
            { title: "输入出生日期", body: "年／月／日柱种子。" },
            { title: "设定干支时辰", body: "十二支配时柱。" },
            { title: "展开柱盘", body: "四柱教学点亮。" },
            { title: "四柱指引", body: "盘意对照问题。" },
          ],
        },
        hant: {
          intro: "越南四柱用干支命名。你將輸入生辰、選擇時辰，再讀教學柱盤。",
          steps: [
            { title: "認識越南四柱", body: "干支 · 四柱 · 日主。" },
            { title: "輸入出生日期", body: "年／月／日柱種子。" },
            { title: "設定干支時辰", body: "十二支配時柱。" },
            { title: "展開柱盤", body: "四柱教學點亮。" },
            { title: "四柱指引", body: "盤意對照問題。" },
          ],
        },
      },
      steps: ["intent", "birth", "canchi", "tutruPillars", "result"],
      viz: "tutru-board",
      castCta: { en: "Reveal the trụ board", zh: "展开柱盘", hant: "展開柱盤" },
      buildCast(state, rng) {
        const p = pillarsFromDate(state.birthDate, rng);
        if (state.hourIndex != null && state.hourIndex !== "") {
          const hi = Number(state.hourIndex);
          p.hourIdx = hi;
          p.hourP = STEMS[(p.dayP.charCodeAt(0) + hi) % 10] + BRANCHES[hi % 12];
        }
        const leans = isZh()
          ? [
              { t: "日主偏强", l: "宜疏泄表达" },
              { t: "日主偏弱", l: "宜得助与节奏" },
              { t: "财星透干", l: "资源可见·防贪急" },
              { t: "印星护身", l: "学习庇护·防依赖" },
            ]
          : [
              { t: "Strong Daymaster", l: "express · vent carefully" },
              { t: "Soft Daymaster", l: "seek support · pace" },
              { t: "Wealth stem shows", l: "resources visible · avoid rush" },
              { t: "Resource stem guards", l: "learn · shelter · avoid over-rely" },
            ];
        const tag = pick(rng, leans);
        return { ...p, tag };
      },
      generate(q, cast) {
        return pack({
          title: `${cast.dayP} · ${cast.tag.t}`,
          result: cast.tag.l,
          explain: isZh()
            ? zhText(
                `教学越南四柱示日柱「${cast.dayP}」、时柱「${cast.hourP}」，格局「${cast.tag.t}」，倾向「${cast.tag.l}」。真盘需历法细节；此处为柱意教育。`,
                `教學越南四柱示日柱「${cast.dayP}」、時柱「${cast.hourP}」，格局「${cast.tag.t}」，傾向「${cast.tag.l}」。真盤需曆法細節；此處為柱意教育。`
              )
            : `Teaching Tứ Trụ shows day “${cast.dayP}”, hour “${cast.hourP}”, pattern “${cast.tag.t}”, leaning “${cast.tag.l}”. Real charts need calendar detail; trụ education here.`,
          interpret: interpretQ(q, cast.tag.l, isZh() ? zhText("越南四柱", "越南四柱") : "Tứ Trụ"),
          details: [cast.yearP, cast.monthP, cast.dayP, cast.hourP, cast.tag.t],
          doList: [
            isZh()
              ? zhText(`按「${cast.tag.l}」调整本周一个习惯。`, `按「${cast.tag.l}」調整本週一個習慣。`)
              : `Adjust one habit this week per “${cast.tag.l}”.`,
          ],
          dontList: [
            isZh()
              ? zhText("不要用教学柱盘否定他人价值。", "不要用教學柱盤否定他人價值。")
              : "Do not use a teaching board to deny someone’s worth.",
          ],
          tone: "mixed",
          vizData: cast,
        });
      },
    },

    "tu-vi": {
      summary: {
        en: "Tử Vi Đẩu Số is Vietnam’s Purple Star tradition — twelve cung (palaces) and major stars for life-theme counsel.",
        zh: "越南紫微斗数以十二宫与主星论人生主题——与中华紫微同源而有越南传习。",
        hant: "越南紫微斗數以十二宮與主星論人生主題——與中華紫微同源而有越南傳習。",
      },
      how: {
        en: {
          intro: "Tử Vi charts twelve cung. You’ll enter birth, note a gender tradition flag, then open a teaching palace.",
          steps: [
            { title: "Meet Tử Vi", body: "Twelve cung · major stars · destinies." },
            { title: "Enter birth date", body: "Chart seed." },
            { title: "Note gender tradition", body: "Yang/yin chart flag for teaching." },
            { title: "Open a cung", body: "One palace highlights with a lean." },
            { title: "Tử Vi counsel", body: "Palace lean for your focus." },
          ],
        },
        zh: {
          intro: "紫微排十二宫。你将输入生辰、标注性别传统，再打开教学宫位。",
          steps: [
            { title: "认识越南紫微", body: "十二宫 · 主星 · 命途。" },
            { title: "输入出生日期", body: "命盘种子。" },
            { title: "标注性别传统", body: "阳／阴盘教学标记。" },
            { title: "打开宫位", body: "一宫点亮并示倾向。" },
            { title: "紫微指引", body: "宫意对照焦点。" },
          ],
        },
        hant: {
          intro: "紫微排十二宮。你將輸入生辰、標註性別傳統，再打開教學宮位。",
          steps: [
            { title: "認識越南紫微", body: "十二宮 · 主星 · 命途。" },
            { title: "輸入出生日期", body: "命盤種子。" },
            { title: "標註性別傳統", body: "陽／陰盤教學標記。" },
            { title: "打開宮位", body: "一宮點亮並示傾向。" },
            { title: "紫微指引", body: "宮意對照焦點。" },
          ],
        },
      },
      steps: ["intent", "birth", "tuviGender", "cungBan", "result"],
      viz: "tuvi-cung",
      castCta: { en: "Open a cung", zh: "打开宫位", hant: "打開宮位" },
      buildCast(state, rng) {
        const cung = pick(rng, CUNG);
        const stars = isZh()
          ? ["紫微", "天机", "太阳", "武曲", "天同", "廉贞"]
          : ["Tử Vi", "Thiên Cơ", "Thái Dương", "Vũ Khúc", "Thiên Đồng", "Liêm Trinh"];
        return {
          gender: state.gender || "unspecified",
          cung,
          star: pick(rng, stars),
          lean: loc(cung.lean),
          focus: state.focus || state.question || "",
        };
      },
      generate(q, cast) {
        const ask = q || cast.focus;
        const cname = loc({ en: cast.cung.en, zh: cast.cung.zh });
        return pack({
          title: `${cname} · ${cast.star}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(
                `教学越南紫微在「${cname}」见主星「${cast.star}」，倾向「${cast.lean}」。真排盘需时辰与历法；此处为宫意教育。`,
                `教學越南紫微在「${cname}」見主星「${cast.star}」，傾向「${cast.lean}」。真排盤需時辰與曆法；此處為宮意教育。`
              )
            : `Teaching Tử Vi in “${cname}” with star “${cast.star}” leans “${cast.lean}”. Real charts need hour and calendar; cung education here.`,
          interpret: interpretQ(ask, cast.lean, isZh() ? zhText("越南紫微宫位", "越南紫微宮位") : "the Tử Vi cung"),
          details: [
            isZh() ? `性别标记：${cast.gender}` : `Gender flag: ${cast.gender}`,
            cname,
            cast.star,
          ],
          doList: [
            isZh()
              ? zhText(`围绕「${cast.lean}」写三天观察笔记。`, `圍繞「${cast.lean}」寫三天觀察筆記。`)
              : `Keep a three-day note around “${cast.lean}”.`,
          ],
          dontList: [
            isZh()
              ? zhText("不要用宫位标签歧视性别或出身。", "不要用宮位標籤歧視性別或出身。")
              : "Do not discriminate by gender or birth using palace labels.",
          ],
          tone: "deep",
          vizData: cast,
        });
      },
    },

    "boi-kieu": {
      summary: {
        en: "Bói Kiều opens Nguyễn Du’s Tale of Kiều at random — the verse becomes an oracle mirror for the question.",
        zh: "咏翘诗占（Bói Kiều）随机翻开阮攸《金云翘传》诗句，以诗行为问题之镜。",
        hant: "詠翹詩占（Bói Kiều）隨機翻開阮攸《金雲翹傳》詩句，以詩行為問題之鏡。",
      },
      how: {
        en: {
          intro: "Bibliomancy with Kiều. You’ll hold a question, open the book, then read a teaching verse lean.",
          steps: [
            { title: "Meet Bói Kiều", body: "The Tale of Kiều · chance verse · counsel." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Open the book", body: "Pages flutter to a teaching place." },
            { title: "Receive the verse", body: "A couplet settles." },
            { title: "Verse counsel", body: "Line lean for your question." },
          ],
        },
        zh: {
          intro: "以《翘传》作签诗。你将抱定问题、翻开书卷，再读教学诗句倾向。",
          steps: [
            { title: "认识咏翘诗占", body: "金云翘传 · 机缘诗句 · 指引。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "翻开书卷", body: "书页翻到教学位置。" },
            { title: "领取诗句", body: "一联落下。" },
            { title: "诗句指引", body: "句意对照问题。" },
          ],
        },
        hant: {
          intro: "以《翹傳》作籤詩。你將抱定問題、翻開書卷，再讀教學詩句傾向。",
          steps: [
            { title: "認識詠翹詩占", body: "金雲翹傳 · 機緣詩句 · 指引。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "翻開書卷", body: "書頁翻到教學位置。" },
            { title: "領取詩句", body: "一聯落下。" },
            { title: "詩句指引", body: "句意對照問題。" },
          ],
        },
      },
      steps: ["intent", "question", "openKieu", "versePick", "result"],
      viz: "kieu-book",
      castCta: { en: "Receive the verse", zh: "领取诗句", hant: "領取詩句" },
      buildCast(state, rng) {
        const verse = pick(rng, KIEU_VERSES);
        return { verse, lean: loc(verse.lean), page: 10 + Math.floor(rng() * 90) };
      },
      generate(q, cast) {
        const line = loc({ en: cast.verse.en, zh: cast.verse.zh, hant: cast.verse.hant });
        return pack({
          title: line,
          result: cast.lean,
          explain: isZh()
            ? zhText(
                `教学咏翘于约第 ${cast.page} 页得「${line}」，倾向「${cast.lean}」。诗句是文学镜子，不是判决。`,
                `教學詠翹於約第 ${cast.page} 頁得「${line}」，傾向「${cast.lean}」。詩句是文學鏡子，不是判決。`
              )
            : `Teaching Bói Kiều near page ${cast.page} yields “${line}”, leaning “${cast.lean}”. Verses are literary mirrors, not verdicts.`,
          interpret: interpretQ(q, cast.lean, isZh() ? zhText("翘传诗句", "翹傳詩句") : "the Kiều verse"),
          details: [isZh() ? `页：${cast.page}` : `Page: ${cast.page}`, line],
          doList: [
            isZh()
              ? zhText(`把「${cast.lean}」写成今天可做的一句行动。`, `把「${cast.lean}」寫成今天可做的一句行動。`)
              : `Turn “${cast.lean}” into one action you can take today.`,
          ],
          dontList: [
            isZh()
              ? zhText("不要把文学签诗当成法律或医疗指示。", "不要把文學籤詩當成法律或醫療指示。")
              : "Do not treat a literary lot as legal or medical instruction.",
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
            "本站为教育性游玩——不能替代受训命理／合婚／签诗、医疗、法律或安全判断。",
            "本站為教育性遊玩——不能替代受訓命理／合婚／簽詩、醫療、法律或安全判斷。"
          )
        : "Educational play on this site — not a substitute for trained saju/gunghap/Kiều practice, medicine, law, or safety judgment.",
    };
  }

  function runCast(id, state) {
    const rite = RITES[id];
    if (!rite) return null;
    const rng = mulberry32(
      seedFrom(
        state.question || state.focus || state.birthDate || state.birthYear || state.partnerBirth,
        state.nonce,
        id
      )
    );
    const cast = Object.assign({}, state.cast || {}, rite.buildCast(state, rng) || {});
    return rite.generate(state.question || state.focus || "", cast, rng);
  }

  window.FatumKoreaVietnam = {
    IDS,
    has,
    get,
    howFor,
    runCast,
    loc,
  };
})();
