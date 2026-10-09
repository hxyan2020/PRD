/**
 * South Asian Vedic / folk oracles — unique steps, visuals, readings.
 * Jyotish · KP · Panchanga · Aṣṭamaṅgala · Ramala · Sāmudrika · Svara ·
 * Tamil Numerology · Aṅka Jyotiṣa · Vastu · Parrot · Sinhala Nekath · Sarvatobhadra
 */
(function () {
  "use strict";

  const IDS = [
    "jyotish",
    "kp-astrology",
    "panchanga",
    "ashtamangala",
    "ramala",
    "samudrika",
    "svarasastra",
    "tamil-numerology",
    "anka-jyotisha",
    "vastu",
    "parrot-astrology",
    "sinhala-nekath",
    "sarvatobhadra",
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
      kind: "southasia",
      ...r,
      disclaimer: isZh()
        ? zhText(
            "教育性模拟——不能替代受训吠陀／择日／相学实践，也不能替代医疗、法律或安全判断。可能不准确；无法预测黑天鹅事件。",
            "教育性模擬——不能替代受訓吠陀／擇日／相學實踐，也不能替代醫療、法律或安全判斷。可能不準確；無法預測黑天鵝事件。"
          )
        : "Educational simulation — not a substitute for trained jyotiṣa/muhūrta/śāstra practice, medicine, law, or safety judgment. May be inaccurate; cannot predict black swan events.",
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

  const NAKSHATRAS = [
    { en: "Aśvinī", zh: "娄宿意", lean: { en: "swift start · heal", zh: "迅起·疗愈", hant: "迅起·療癒" } },
    { en: "Rohiṇī", zh: "毕宿意", lean: { en: "nourish · stay", zh: "滋养·安住", hant: "滋養·安住" } },
    { en: "Punarvasu", zh: "井宿意", lean: { en: "return · renew", zh: "回返·更新", hant: "回返·更新" } },
    { en: "Maghā", zh: "星宿意", lean: { en: "honor · ancestors", zh: "尊荣·祖荫", hant: "尊榮·祖蔭" } },
    { en: "Hasta", zh: "翼宿意", lean: { en: "craft · hands", zh: "手艺·实作", hant: "手藝·實作" } },
    { en: "Śravaṇa", zh: "女宿意", lean: { en: "listen · learn", zh: "倾听·学习", hant: "傾聽·學習" } },
  ];
  const DASHAS = [
    { en: "Sun daśā tone", zh: "日周期意", lean: { en: "visibility · duty", zh: "可见·职分", hant: "可見·職分" } },
    { en: "Moon daśā tone", zh: "月周期意", lean: { en: "care · mood pace", zh: "照护·情绪节奏", hant: "照護·情緒節奏" } },
    { en: "Mars daśā tone", zh: "火周期意", lean: { en: "drive · cut clean", zh: "驱动·利落切割", hant: "驅動·利落切割" } },
    { en: "Mercury daśā tone", zh: "水周期意", lean: { en: "talk · trade", zh: "言谈·交易", hant: "言談·交易" } },
    { en: "Jupiter daśā tone", zh: "木周期意", lean: { en: "grow · teach", zh: "成长·教导", hant: "成長·教導" } },
    { en: "Saturn daśā tone", zh: "土周期意", lean: { en: "structure · patience", zh: "结构·耐心", hant: "結構·耐心" } },
  ];
  const SUBLORDS = [
    { en: "Ketu sub", zh: "计都次主", lean: { en: "release · simplify", zh: "放下·做减法", hant: "放下·做減法" } },
    { en: "Venus sub", zh: "金星次主", lean: { en: "harmonize · value", zh: "调和·看价值", hant: "調和·看價值" } },
    { en: "Sun sub", zh: "太阳次主", lean: { en: "lead lightly", zh: "轻领", hant: "輕領" } },
    { en: "Moon sub", zh: "月亮次主", lean: { en: "feel · nest", zh: "感受·筑巢", hant: "感受·築巢" } },
    { en: "Mars sub", zh: "火星次主", lean: { en: "act · defend", zh: "行动·护界", hant: "行動·護界" } },
    { en: "Rahu sub", zh: "罗睺次主", lean: { en: "stretch · watch excess", zh: "延展·防过火", hant: "延展·防過火" } },
  ];
  const PANCHA = {
    tithi: [
      { en: "Śukla pratipad", zh: "白分一日", lean: { en: "seed the ask", zh: "播种所问", hant: "播種所問" } },
      { en: "Kṛṣṇa ekādaśī", zh: "黑分十一", lean: { en: "fast noise · clear mind", zh: "减噪·清心", hant: "減噪·清心" } },
      { en: "Pūrṇimā tone", zh: "望月意", lean: { en: "full share", zh: "满盈分享", hant: "滿盈分享" } },
      { en: "Amāvāsyā tone", zh: "朔日意", lean: { en: "close · reset", zh: "收束·重置", hant: "收束·重置" } },
    ],
    yoga: [
      { en: "Siddha yoga", zh: "成就瑜伽", lean: { en: "finish one skill", zh: "完成一技", hant: "完成一技" } },
      { en: "Śubha yoga", zh: "吉祥瑜伽", lean: { en: "kind timing", zh: "温和时机", hant: "溫和時機" } },
      { en: "Vyaghāta care", zh: "违碍意", lean: { en: "delay hard talks", zh: "延后硬谈", hant: "延後硬談" } },
    ],
  };
  const EIGHT = [
    { en: "Lamp", zh: "灯", lean: { en: "clarity · witness", zh: "清明·见证", hant: "清明·見證" } },
    { en: "Mirror", zh: "镜", lean: { en: "reflect · check", zh: "反观·核对", hant: "反觀·核對" } },
    { en: "Conch", zh: "螺", lean: { en: "announce · call help", zh: "宣告·求助", hant: "宣告·求助" } },
    { en: "Water pot", zh: "满瓶", lean: { en: "fill · sustain", zh: "注满·续力", hant: "注滿·續力" } },
    { en: "Flower", zh: "花", lean: { en: "offer · soften", zh: "供养·柔化", hant: "供養·柔化" } },
    { en: "Cloth", zh: "布", lean: { en: "cover · protect", zh: "遮护·保护", hant: "遮護·保護" } },
    { en: "Fruit", zh: "果", lean: { en: "harvest · share", zh: "收获·分享", hant: "收穫·分享" } },
    { en: "Gold token", zh: "金符", lean: { en: "value · vow", zh: "价值·誓愿", hant: "價值·誓願" } },
  ];
  const RAMALA = [
    { en: "Via", zh: "通路", lean: { en: "path opens if paced", zh: "路开但要有节奏", hant: "路開但要有節奏" } },
    { en: "Populus", zh: "众象", lean: { en: "crowd energy · choose allies", zh: "众力·择友", hant: "眾力·擇友" } },
    { en: "Fortuna Major", zh: "大运", lean: { en: "strong start · stay humble", zh: "强起·守谦", hant: "強起·守謙" } },
    { en: "Carcer", zh: "囚象", lean: { en: "hold · finish inside work", zh: "按兵·完成内务", hant: "按兵·完成內務" } },
    { en: "Acquisitio", zh: "得象", lean: { en: "gain by fair exchange", zh: "公平交换得之", hant: "公平交換得之" } },
    { en: "Amissio", zh: "失象", lean: { en: "release a sunk cost", zh: "放下沉没成本", hant: "放下沉沒成本" } },
  ];
  const BODY_ZONES = [
    { id: "hand", en: "Hand", zh: "手", lean: { en: "craft · give", zh: "手艺·给予", hant: "手藝·給予" } },
    { id: "face", en: "Face", zh: "面", lean: { en: "presence · tone", zh: "仪态·语气", hant: "儀態·語氣" } },
    { id: "feet", en: "Feet", zh: "足", lean: { en: "path · grounding", zh: "路径·落地", hant: "路徑·落地" } },
    { id: "brow", en: "Brow", zh: "眉", lean: { en: "focus · resolve", zh: "专注·决意", hant: "專注·決意" } },
  ];
  const SVARA = [
    { id: "right", en: "Right (sūrya)", zh: "右息（日）", lean: { en: "act · outbound", zh: "行动·外向", hant: "行動·外向" } },
    { id: "left", en: "Left (candra)", zh: "左息（月）", lean: { en: "receive · wait", zh: "收纳·等待", hant: "收納·等待" } },
    { id: "both", en: "Even (suṣumnā)", zh: "双平（中脉）", lean: { en: "meditate · don’t force", zh: "静坐·勿强推", hant: "靜坐·勿強推" } },
  ];
  const PLANETS_NUM = [
    { n: 1, en: "Sun · 1", zh: "日·1", lean: { en: "identity · warmth", zh: "身份·温暖", hant: "身份·溫暖" } },
    { n: 2, en: "Moon · 2", zh: "月·2", lean: { en: "mood · home", zh: "情绪·家", hant: "情緒·家" } },
    { n: 3, en: "Jupiter · 3", zh: "木·3", lean: { en: "growth · counsel", zh: "成长·建言", hant: "成長·建言" } },
    { n: 4, en: "Rahu · 4", zh: "罗·4", lean: { en: "stretch · novelty", zh: "延展·新奇", hant: "延展·新奇" } },
    { n: 5, en: "Mercury · 5", zh: "水·5", lean: { en: "words · links", zh: "言辞·连结", hant: "言辭·連結" } },
    { n: 6, en: "Venus · 6", zh: "金·6", lean: { en: "beauty · bond", zh: "美感·连结", hant: "美感·連結" } },
    { n: 7, en: "Ketu · 7", zh: "计·7", lean: { en: "release · insight", zh: "放下·洞见", hant: "放下·洞見" } },
    { n: 8, en: "Saturn · 8", zh: "土·8", lean: { en: "duty · time", zh: "责任·时间", hant: "責任·時間" } },
    { n: 9, en: "Mars · 9", zh: "火·9", lean: { en: "courage · cut", zh: "勇气·切割", hant: "勇氣·切割" } },
  ];
  const VASTU_FACES = [
    { id: "E", en: "East", zh: "东", lean: { en: "dawn growth", zh: "朝发生发", hant: "朝發生發" } },
    { id: "NE", en: "Northeast", zh: "东北", lean: { en: "sacred corner care", zh: "神位角落慎护", hant: "神位角落慎護" } },
    { id: "N", en: "North", zh: "北", lean: { en: "flow · wealth path", zh: "流通·财路", hant: "流通·財路" } },
    { id: "W", en: "West", zh: "西", lean: { en: "completion · rest", zh: "完成·歇息", hant: "完成·歇息" } },
    { id: "S", en: "South", zh: "南", lean: { en: "heat · protect sleep", zh: "热气·护眠", hant: "熱氣·護眠" } },
  ];
  const PARROT_CARDS = [
    { en: "Lotus card", zh: "莲花签", lean: { en: "rise clean from mud", zh: "出淤泥而不染", hant: "出淤泥而不染" } },
    { en: "Peacock card", zh: "孔雀签", lean: { en: "show gift · stay kind", zh: "展才·保善", hant: "展才·保善" } },
    { en: "River card", zh: "河流签", lean: { en: "go around · don’t force", zh: "绕行·勿硬撞", hant: "繞行·勿硬撞" } },
    { en: "Lamp card", zh: "油灯签", lean: { en: "one small light enough", zh: "一盏小灯已够", hant: "一盞小燈已夠" } },
    { en: "Tree card", zh: "大树签", lean: { en: "root before branch", zh: "先根后枝", hant: "先根後枝" } },
  ];
  const NEKATH = [
    { en: "Good nekatha hour", zh: "吉时", lean: { en: "schedule the hard ask", zh: "安排难谈之事", hant: "安排難談之事" } },
    { en: "Neutral nekatha", zh: "平流时", lean: { en: "routine · no big bets", zh: "例行·勿豪赌", hant: "例行·勿豪賭" } },
    { en: "Care nekatha", zh: "慎时", lean: { en: "delay contracts", zh: "延后签约", hant: "延後簽約" } },
  ];
  const SBC = [
    { en: "East spoke lit", zh: "东辐亮", lean: { en: "begin · travel light", zh: "起程·轻装", hant: "起程·輕裝" } },
    { en: "Center calm", zh: "中宫静", lean: { en: "hold the axis", zh: "守住中轴", hant: "守住中軸" } },
    { en: "South heat", zh: "南热", lean: { en: "protect energy", zh: "护住精力", hant: "護住精力" } },
    { en: "West harvest", zh: "西成", lean: { en: "close loops", zh: "收尾闭环", hant: "收尾閉環" } },
  ];

  const RITES = {
    jyotish: {
      summary: {
        en: "Jyotiṣa reads destiny from the sidereal zodiac, lunar mansions (nakṣatras), and planetary periods (daśā).",
        zh: "吠陀占星（乔蒂什）以恒星黄道、月宿与行星周期（达沙）解读出生星盘。",
        hant: "吠陀占星（喬蒂什）以恆星黃道、月宿與行星週期（達沙）解讀出生星盤。",
      },
      how: howPack(
        {
          intro: "You’ll enter birth date, pick a nakṣatra lens, then reveal a teaching daśā lean.",
          steps: [
            { title: "Meet Jyotiṣa", body: "Sidereal chart · nakṣatra · daśā." },
            { title: "Enter birth date", body: "Chart seed." },
            { title: "Pick a nakṣatra lens", body: "Teaching mansion choice." },
            { title: "Reveal the daśā tone", body: "Period lean appears." },
            { title: "Jyotiṣa counsel", body: "Nakṣatra + daśā for your focus." },
          ],
        },
        {
          intro: "你将输入生辰、选择月宿视角，再揭示教学达沙倾向。",
          steps: [
            { title: "认识吠陀占星", body: "恒星盘 · 月宿 · 达沙。" },
            { title: "输入出生日期", body: "盘种。" },
            { title: "选择月宿视角", body: "教学宿选择。" },
            { title: "揭示达沙色调", body: "周期倾向出现。" },
            { title: "乔蒂什指引", body: "月宿与达沙对照焦点。" },
          ],
        },
        {
          intro: "你將輸入生辰、選擇月宿視角，再揭示教學達沙傾向。",
          steps: [
            { title: "認識吠陀占星", body: "恆星盤 · 月宿 · 達沙。" },
            { title: "輸入出生日期", body: "盤種。" },
            { title: "選擇月宿視角", body: "教學宿選擇。" },
            { title: "揭示達沙色調", body: "週期傾向出現。" },
            { title: "喬蒂什指引", body: "月宿與達沙對照焦點。" },
          ],
        }
      ),
      steps: ["intent", "birth", "nakshatraPick", "dashaReveal", "result"],
      viz: "jyotish",
      castCta: { en: "Reveal the daśā tone", zh: "揭示达沙色调", hant: "揭示達沙色調" },
      buildCast(state, rng) {
        const nak = NAKSHATRAS.find((n) => n.en === state.nakshatra) || pick(rng, NAKSHATRAS);
        const dasha = pick(rng, DASHAS);
        return {
          birth: state.birthDate || "",
          nak,
          dasha,
          lean: loc({ en: `${loc(nak.lean)} · ${loc(dasha.lean)}`, zh: `${loc(nak.lean)}·${loc(dasha.lean)}` }),
        };
      },
      generate(q, cast) {
        const n = loc({ en: cast.nak.en, zh: cast.nak.zh });
        const d = loc({ en: cast.dasha.en, zh: cast.dasha.zh });
        return pack({
          title: `${n} · ${d}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学乔蒂什以生辰「${cast.birth || "—"}」见「${n}」与「${d}」，倾向「${cast.lean}」。真盘需精确时辰与星历。`, `教學喬蒂什以生辰「${cast.birth || "—"}」見「${n}」與「${d}」，傾向「${cast.lean}」。真盤需精確時辰與星曆。`)
            : `Teaching jyotiṣa for “${cast.birth || "—"}” shows “${n}” with “${d}”, leaning “${cast.lean}”. Real charts need exact time and ephemeris.`,
          interpret: interpretQ(q, cast.lean, isZh() ? zhText("月宿与达沙", "月宿與達沙") : "nakṣatra and daśā"),
          details: [cast.birth || "—", n, d],
          doList: [isZh() ? zhText(`围绕「${cast.lean}」安排本周一次专注时段。`, `圍繞「${cast.lean}」安排本週一次專注時段。`) : `Book one focus block this week around “${cast.lean}”.`],
          dontList: [isZh() ? zhText("不要用简化盘恐吓他人做重大医疗或财务决定。", "不要用簡化盤恐嚇他人做重大醫療或財務決定。") : "Do not scare others into major medical or money moves from a teaching chart."],
          tone: "deep",
          vizData: cast,
        });
      },
    },

    "kp-astrology": {
      summary: {
        en: "KP (Krishnamurti Paddhati) refines Vedic timing with sub-lords on each cusp — a South Indian school of precise event timing.",
        zh: "KP（克里希纳穆提）占星以次主星细分宫头，精细化吠陀时机推演。",
        hant: "KP（克裡希納穆提）占星以次主星細分宮頭，精細化吠陀時機推演。",
      },
      how: howPack(
        {
          intro: "You’ll enter birth date, pick a sub-lord lens, then read a teaching KP cusp lean.",
          steps: [
            { title: "Meet KP", body: "Cusps · sub-lords · timing." },
            { title: "Enter birth date", body: "Chart seed." },
            { title: "Pick a sub-lord lens", body: "Teaching ruler choice." },
            { title: "Read the KP cusp", body: "Cusp lean appears." },
            { title: "KP counsel", body: "Sub-lord lean for your ask." },
          ],
        },
        {
          intro: "你将输入生辰、选择次主星视角，再读教学KP宫头倾向。",
          steps: [
            { title: "认识KP", body: "宫头 · 次主 · 时机。" },
            { title: "输入出生日期", body: "盘种。" },
            { title: "选择次主星视角", body: "教学主星选择。" },
            { title: "读取KP宫头", body: "宫头倾向出现。" },
            { title: "KP指引", body: "次主倾向对照所问。" },
          ],
        },
        {
          intro: "你將輸入生辰、選擇次主星視角，再讀教學KP宮頭傾向。",
          steps: [
            { title: "認識KP", body: "宮頭 · 次主 · 時機。" },
            { title: "輸入出生日期", body: "盤種。" },
            { title: "選擇次主星視角", body: "教學主星選擇。" },
            { title: "讀取KP宮頭", body: "宮頭傾向出現。" },
            { title: "KP指引", body: "次主傾向對照所問。" },
          ],
        }
      ),
      steps: ["intent", "birth", "sublordPick", "kpCusp", "result"],
      viz: "kp",
      castCta: { en: "Read the KP cusp", zh: "读取KP宫头", hant: "讀取KP宮頭" },
      buildCast(state, rng) {
        const sub = SUBLORDS.find((s) => s.en === state.sublord) || pick(rng, SUBLORDS);
        const cusp = 1 + Math.floor(rng() * 12);
        return { birth: state.birthDate || "", sub, cusp, lean: loc(sub.lean) };
      },
      generate(q, cast) {
        const s = loc({ en: cast.sub.en, zh: cast.sub.zh });
        return pack({
          title: `Cusp ${cast.cusp} · ${s}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学KP以生辰「${cast.birth || "—"}」看第${cast.cusp}宫次主「${s}」，倾向「${cast.lean}」。真KP需精确时区与次主表。`, `教學KP以生辰「${cast.birth || "—"}」看第${cast.cusp}宮次主「${s}」，傾向「${cast.lean}」。真KP需精確時區與次主表。`)
            : `Teaching KP for “${cast.birth || "—"}” on cusp ${cast.cusp} with sub-lord “${s}” leans “${cast.lean}”. Real KP needs exact timezone and sub-lord tables.`,
          interpret: interpretQ(q, cast.lean, isZh() ? "KP次主" : "the KP sub-lord"),
          details: [cast.birth || "—", `Cusp ${cast.cusp}`, s],
          doList: [isZh() ? zhText(`按「${cast.lean}」只推进一件可验证的下一步。`, `按「${cast.lean}」只推進一件可驗證的下一步。`) : `Advance only one verifiable next step matching “${cast.lean}”.`],
          dontList: [isZh() ? zhText("不要把教学次主当成绝对事件时刻表。", "不要把教學次主當成絕對事件時刻表。") : "Do not treat a teaching sub-lord as an absolute event clock."],
          tone: "mixed",
          vizData: cast,
        });
      },
    },

    panchanga: {
      summary: {
        en: "Pañcāṅga (“five limbs”) names tithi, vāra, nakṣatra, yoga, and karaṇa — used to choose days for starts and rites.",
        zh: "五历（Panchanga）含月相日、星期、月宿、瑜伽与羯腊那——用于择日与仪轨时机。",
        hant: "五曆（Panchanga）含月相日、星期、月宿、瑜伽與羯臘那——用於擇日與儀軌時機。",
      },
      how: howPack(
        {
          intro: "You’ll pick a candidate day, open the five limbs, then read the pañcāṅga counsel.",
          steps: [
            { title: "Meet Pañcāṅga", body: "Five limbs · day quality." },
            { title: "Pick a candidate day", body: "Date under review." },
            { title: "Open the five limbs", body: "Tithi and yoga light." },
            { title: "Read the day counsel", body: "Limb lean appears." },
            { title: "Pañcāṅga counsel", body: "Lean for your purpose." },
          ],
        },
        {
          intro: "你将点选候选日、打开五历要素，再读日辰指引。",
          steps: [
            { title: "认识五历", body: "五肢 · 日辰。" },
            { title: "点选候选日", body: "所问之日。" },
            { title: "打开五历要素", body: "月相日与瑜伽点亮。" },
            { title: "读取日辰指引", body: "要素倾向出现。" },
            { title: "五历指引", body: "倾向对照目的。" },
          ],
        },
        {
          intro: "你將點選候選日、打開五曆要素，再讀日辰指引。",
          steps: [
            { title: "認識五曆", body: "五肢 · 日辰。" },
            { title: "點選候選日", body: "所問之日。" },
            { title: "打開五曆要素", body: "月相日與瑜伽點亮。" },
            { title: "讀取日辰指引", body: "要素傾向出現。" },
            { title: "五曆指引", body: "傾向對照目的。" },
          ],
        }
      ),
      steps: ["intent", "daypickPanch", "fiveLimbs", "panchCounsel", "result"],
      viz: "panchanga",
      castCta: { en: "Read the day counsel", zh: "读取日辰指引", hant: "讀取日辰指引" },
      buildCast(state, rng) {
        const tithi = pick(rng, PANCHA.tithi);
        const yoga = pick(rng, PANCHA.yoga);
        return {
          date: state.dayDate || "",
          tithi,
          yoga,
          lean: loc({ en: `${loc(tithi.lean)} · ${loc(yoga.lean)}`, zh: `${loc(tithi.lean)}·${loc(yoga.lean)}` }),
        };
      },
      generate(q, cast) {
        const t = loc({ en: cast.tithi.en, zh: cast.tithi.zh });
        const y = loc({ en: cast.yoga.en, zh: cast.yoga.zh });
        return pack({
          title: `${cast.date || "—"} · ${t}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学五历于「${cast.date || "未选日"}」示「${t}」与「${y}」，倾向「${cast.lean}」。真五历依当地历算。`, `教學五曆於「${cast.date || "未選日"}」示「${t}」與「${y}」，傾向「${cast.lean}」。真五曆依當地曆算。`)
            : `Teaching pañcāṅga on “${cast.date || "unset day"}” shows “${t}” and “${y}”, leaning “${cast.lean}”. Real limbs follow a local almanac.`,
          interpret: interpretQ(q || cast.date, cast.lean, isZh() ? "五历" : "pañcāṅga"),
          details: [cast.date || "—", t, y],
          doList: [isZh() ? zhText(`若倾向偏慎，把大事挪到下一可验证窗口。`, `若傾向偏慎，把大事挪到下一可驗證窗口。`) : `If the lean cautions, move a big ask to the next verifiable window.`],
          dontList: [isZh() ? zhText("不要因择日羞辱他人必要行程。", "不要因擇日羞辱他人必要行程。") : "Do not shame others’ needed travel over day-picking."],
          tone: /慎|care|delay|违|Vyagh/i.test(cast.lean + y) ? "caution" : "mixed",
          vizData: cast,
        });
      },
    },

    ashtamangala: {
      summary: {
        en: "Aṣṭamaṅgala Praśna is Kerala temple question-divination arranged around eight auspicious items and a complex praśna chart.",
        zh: "八吉祥占（Aṣṭamaṅgala Praśna）是喀拉拉神庙问事传统，环绕八种吉祥物与复杂占盘。",
        hant: "八吉祥占（Aṣṭamaṅgala Praśna）是喀拉拉神廟問事傳統，環繞八種吉祥物與複雜占盤。",
      },
      how: howPack(
        {
          intro: "You’ll hold a question, place the eight signs, then read a teaching praśna lean.",
          steps: [
            { title: "Meet Aṣṭamaṅgala", body: "Eight signs · temple praśna." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Place the eight signs", body: "Lamp, conch, flower…" },
            { title: "Read the praśna", body: "Sign lean appears." },
            { title: "Praśna counsel", body: "Omen lean for your question." },
          ],
        },
        {
          intro: "你将抱定问题、安放八吉祥，再读教学问事倾向。",
          steps: [
            { title: "认识八吉祥占", body: "八物 · 神庙问事。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "安放八吉祥", body: "灯、螺、花…" },
            { title: "读取问事", body: "物象倾向出现。" },
            { title: "问事指引", body: "兆意对照问题。" },
          ],
        },
        {
          intro: "你將抱定問題、安放八吉祥，再讀教學問事傾向。",
          steps: [
            { title: "認識八吉祥占", body: "八物 · 神廟問事。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "安放八吉祥", body: "燈、螺、花…" },
            { title: "讀取問事", body: "物象傾向出現。" },
            { title: "問事指引", body: "兆意對照問題。" },
          ],
        }
      ),
      steps: ["intent", "question", "placeEight", "prasnaRead", "result"],
      viz: "ashtamangala",
      castCta: { en: "Read the praśna", zh: "读取问事", hant: "讀取問事" },
      buildCast(state, rng) {
        const item = pick(rng, EIGHT);
        return { item, lean: loc(item.lean) };
      },
      generate(q, cast) {
        const name = loc({ en: cast.item.en, zh: cast.item.zh });
        return pack({
          title: name,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学八吉祥问事落在「${name}」，倾向「${cast.lean}」。真占需庙祭司与完整盘。`, `教學八吉祥問事落在「${name}」，傾向「${cast.lean}」。真占需廟祭司與完整盤。`)
            : `Teaching aṣṭamaṅgala settles on “${name}”, leaning “${cast.lean}”. Real praśna needs a temple astrologer and full chart.`,
          interpret: interpretQ(q, cast.lean, isZh() ? "八吉祥问事" : "aṣṭamaṅgala praśna"),
          details: [name],
          doList: [isZh() ? zhText(`把「${cast.lean}」变成今天一件可完成的供养式行动。`, `把「${cast.lean}」變成今天一件可完成的供養式行動。`) : `Turn “${cast.lean}” into one completable offering-style action today.`],
          dontList: [isZh() ? zhText("不要伪造神庙权威或恐吓信众。", "不要偽造神廟權威或恐嚇信眾。") : "Do not fake temple authority or frighten devotees."],
          tone: "deep",
          vizData: cast,
        });
      },
    },

    ramala: {
      summary: {
        en: "Ramala Śāstra is Arabic geomancy remade in Sanskrit at North Indian sultanate courts — sixteen figures from dotted lots.",
        zh: "拉玛拉土占是阿拉伯土占在北印度苏丹宫廷的梵语化传统——由点阵得十六象。",
        hant: "拉瑪拉土占是阿拉伯土占在北印度蘇丹宮廷的梵語化傳統——由點陣得十六象。",
      },
      how: howPack(
        {
          intro: "You’ll hold a question, cast ramala dots, then read the teaching figure.",
          steps: [
            { title: "Meet Ramala", body: "Dots · figures · counsel." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Cast the dots", body: "Four mothers form." },
            { title: "Read the figure", body: "Named lean appears." },
            { title: "Ramala counsel", body: "Figure lean for your question." },
          ],
        },
        {
          intro: "你将抱定问题、掷下拉玛拉点阵，再读教学土象。",
          steps: [
            { title: "认识拉玛拉", body: "点阵 · 土象 · 指引。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "掷下点阵", body: "四母象成形。" },
            { title: "读取土象", body: "名象倾向出现。" },
            { title: "拉玛拉指引", body: "象意对照问题。" },
          ],
        },
        {
          intro: "你將抱定問題、擲下拉瑪拉點陣，再讀教學土象。",
          steps: [
            { title: "認識拉瑪拉", body: "點陣 · 土象 · 指引。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "擲下點陣", body: "四母象成形。" },
            { title: "讀取土象", body: "名象傾向出現。" },
            { title: "拉瑪拉指引", body: "象意對照問題。" },
          ],
        }
      ),
      steps: ["intent", "question", "ramalaDots", "figureRead", "result"],
      viz: "ramala",
      castCta: { en: "Read the figure", zh: "读取土象", hant: "讀取土象" },
      buildCast(state, rng) {
        const fig = pick(rng, RAMALA);
        const rows = Array.from({ length: 4 }, () => (rng() > 0.5 ? 2 : 1));
        return { fig, rows, lean: loc(fig.lean) };
      },
      generate(q, cast) {
        const name = loc({ en: cast.fig.en, zh: cast.fig.zh });
        return pack({
          title: name,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学拉玛拉得「${name}」，倾向「${cast.lean}」。真土占需完整十六象推演。`, `教學拉瑪拉得「${name}」，傾向「${cast.lean}」。真土占需完整十六象推演。`)
            : `Teaching ramala yields “${name}”, leaning “${cast.lean}”. Real geomancy unfolds a full sixteen-figure chart.`,
          interpret: interpretQ(q, cast.lean, isZh() ? "拉玛拉土象" : "the ramala figure"),
          details: [name, (cast.rows || []).join("-")],
          doList: [isZh() ? zhText(`按「${cast.lean}」调整今天一个约定。`, `按「${cast.lean}」調整今天一個約定。`) : `Adjust one plan today to match “${cast.lean}”.`],
          dontList: [isZh() ? zhText("不要用土象强迫他人服从。", "不要用土象強迫他人服從。") : "Do not coerce others with a geomantic figure."],
          tone: /失|囚|Carcer|Amissio|release|hold/i.test(name + cast.lean) ? "caution" : "mixed",
          vizData: cast,
        });
      },
    },

    samudrika: {
      summary: {
        en: "Sāmudrika Śāstra reads body marks — hands, face, feet, physique — as character and fortune themes (not medicine).",
        zh: "相学（萨穆德里卡）依手、面、足与体态纹记论性情与运势主题——不是医学诊断。",
        hant: "相學（薩穆德里卡）依手、面、足與體態紋記論性情與運勢主題——不是醫學診斷。",
      },
      how: howPack(
        {
          intro: "You’ll pick a body zone, mark a teaching trait, then map a sāmudrika lean.",
          steps: [
            { title: "Meet Sāmudrika", body: "Marks · zones · counsel." },
            { title: "Pick a body zone", body: "Hand, face, feet…" },
            { title: "Mark a teaching trait", body: "What stands out?" },
            { title: "Map the reading", body: "Trait lean appears." },
            { title: "Sāmudrika counsel", body: "Lean for your focus." },
          ],
        },
        {
          intro: "你将选择部位、标注教学特征，再映射相学倾向。",
          steps: [
            { title: "认识相学", body: "纹记 · 部位 · 指引。" },
            { title: "选择部位", body: "手、面、足…" },
            { title: "标注教学特征", body: "什么最醒目？" },
            { title: "映射解读", body: "特征倾向出现。" },
            { title: "相学指引", body: "倾向对照焦点。" },
          ],
        },
        {
          intro: "你將選擇部位、標註教學特徵，再映射相學傾向。",
          steps: [
            { title: "認識相學", body: "紋記 · 部位 · 指引。" },
            { title: "選擇部位", body: "手、面、足…" },
            { title: "標註教學特徵", body: "什麼最醒目？" },
            { title: "映射解讀", body: "特徵傾向出現。" },
            { title: "相學指引", body: "傾向對照焦點。" },
          ],
        }
      ),
      steps: ["intent", "bodyZone", "markTrait", "samudrikaMap", "result"],
      viz: "samudrika",
      castCta: { en: "Map the reading", zh: "映射解读", hant: "映射解讀" },
      buildCast(state, rng) {
        const zone = BODY_ZONES.find((z) => z.id === state.bodyZone) || pick(rng, BODY_ZONES);
        const trait = state.formTrait || (isZh() ? zhText("清晰纹线", "清晰紋線") : "clear line");
        return { zone, trait, lean: loc(zone.lean) };
      },
      generate(q, cast) {
        const z = loc({ en: cast.zone.en, zh: cast.zone.zh });
        return pack({
          title: `${z} · ${cast.trait}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学相学看「${z}」标注「${cast.trait}」，倾向「${cast.lean}」。不是皮肤科或骨科诊断。`, `教學相學看「${z}」標註「${cast.trait}」，傾向「${cast.lean}」。不是皮膚科或骨科診斷。`)
            : `Teaching sāmudrika reads “${z}” marked “${cast.trait}”, leaning “${cast.lean}”. Not dermatology or orthopedics.`,
          interpret: interpretQ(q || cast.trait, cast.lean, isZh() ? "相学纹记" : "sāmudrika marks"),
          details: [z, cast.trait],
          doList: [isZh() ? zhText(`用「${cast.lean}」关照今天一种自我表达。`, `用「${cast.lean}」關照今天一種自我表達。`) : `Apply “${cast.lean}” to one self-expression today.`],
          dontList: [isZh() ? zhText("不要因相学羞辱身体差异。", "不要因相學羞辱身體差異。") : "Do not shame body differences with physiognomy."],
          tone: "mixed",
          vizData: cast,
        });
      },
    },

    svarasastra: {
      summary: {
        en: "Svara Śāstra reads which nostril carries the breath (sūrya/candra/suṣumnā) as a living timing oracle for action.",
        zh: "声相／息相学（Svara）以左右鼻息主导（日／月／中脉）作为行动时机的活体占问。",
        hant: "聲相／息相學（Svara）以左右鼻息主導（日／月／中脈）作為行動時機的活體占問。",
      },
      how: howPack(
        {
          intro: "You’ll hold a question, notice the breath side, then read a teaching svara omen.",
          steps: [
            { title: "Meet Svara Śāstra", body: "Breath side · timing." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Notice the breath side", body: "Right, left, or even." },
            { title: "Read the svara omen", body: "Side lean appears." },
            { title: "Svara counsel", body: "Breath lean for your ask." },
          ],
        },
        {
          intro: "你将抱定问题、觉察鼻息侧，再读教学息兆。",
          steps: [
            { title: "认识息相学", body: "鼻息侧 · 时机。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "觉察鼻息侧", body: "右、左或双平。" },
            { title: "读取息兆", body: "侧息倾向出现。" },
            { title: "息相指引", body: "息意对照所问。" },
          ],
        },
        {
          intro: "你將抱定問題、覺察鼻息側，再讀教學息兆。",
          steps: [
            { title: "認識息相學", body: "鼻息側 · 時機。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "覺察鼻息側", body: "右、左或雙平。" },
            { title: "讀取息兆", body: "側息傾向出現。" },
            { title: "息相指引", body: "息意對照所問。" },
          ],
        }
      ),
      steps: ["intent", "question", "breathSide", "svaraOmen", "result"],
      viz: "svara",
      castCta: { en: "Read the svara omen", zh: "读取息兆", hant: "讀取息兆" },
      buildCast(state, rng) {
        const side = SVARA.find((s) => s.id === state.breathSide) || pick(rng, SVARA);
        return { side, lean: loc(side.lean) };
      },
      generate(q, cast) {
        const s = loc({ en: cast.side.en, zh: cast.side.zh });
        return pack({
          title: s,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学息相示「${s}」，倾向「${cast.lean}」。这是时机镜子，不是肺活量诊断。`, `教學息相示「${s}」，傾向「${cast.lean}」。這是時機鏡子，不是肺活量診斷。`)
            : `Teaching svara shows “${s}”, leaning “${cast.lean}”. A timing mirror — not a lung diagnosis.`,
          interpret: interpretQ(q, cast.lean, isZh() ? "息相" : "svara"),
          details: [s],
          doList: [isZh() ? zhText(`若倾向偏等待，先做三分钟呼吸再决定。`, `若傾向偏等待，先做三分鐘呼吸再決定。`) : `If the lean waits, take three calm breaths before deciding.`],
          dontList: [isZh() ? zhText("不要因息相延误紧急医疗。", "不要因息相延誤緊急醫療。") : "Do not delay emergency care over breath-side lore."],
          tone: /wait|等待|meditat|静/i.test(cast.lean) ? "caution" : "bright",
          vizData: cast,
        });
      },
    },

    "tamil-numerology": {
      summary: {
        en: "Tamil numerology maps names through uyir/mei letter values — a lineage distinct from northern Aṅka jyotiṣa.",
        zh: "泰米尔数字命理依乌伊尔／梅伊字母数值论姓名——有别于北印数字占星。",
        hant: "泰米爾數字命理依烏伊爾／梅伊字母數值論姓名——有別於北印數字占星。",
      },
      how: howPack(
        {
          intro: "You’ll enter a name, see uyir–mei totals, then read a teaching Tamil number lean.",
          steps: [
            { title: "Meet Tamil numerology", body: "Letters · totals · counsel." },
            { title: "Enter a name", body: "Latin or Tamil romanization." },
            { title: "See uyir–mei totals", body: "Teaching sum lights." },
            { title: "Read the number lean", body: "Band appears." },
            { title: "Name counsel", body: "Number lean for your ask." },
          ],
        },
        {
          intro: "你将输入姓名、查看乌伊尔－梅伊合计，再读教学泰米尔数倾向。",
          steps: [
            { title: "认识泰米尔数理", body: "字母 · 合计 · 指引。" },
            { title: "输入姓名", body: "拉丁或泰米尔罗马字。" },
            { title: "查看乌伊尔－梅伊合计", body: "教学总和点亮。" },
            { title: "读取数理倾向", body: "色带出现。" },
            { title: "姓名指引", body: "数理对照所问。" },
          ],
        },
        {
          intro: "你將輸入姓名、查看烏伊爾－梅伊合計，再讀教學泰米爾數傾向。",
          steps: [
            { title: "認識泰米爾數理", body: "字母 · 合計 · 指引。" },
            { title: "輸入姓名", body: "拉丁或泰米爾羅馬字。" },
            { title: "查看烏伊爾－梅伊合計", body: "教學總和點亮。" },
            { title: "讀取數理傾向", body: "色帶出現。" },
            { title: "姓名指引", body: "數理對照所問。" },
          ],
        }
      ),
      steps: ["intent", "nameInTamil", "uyirMei", "tamilNumber", "result"],
      viz: "tamil",
      castCta: { en: "Read the number lean", zh: "读取数理倾向", hant: "讀取數理傾向" },
      buildCast(state, rng) {
        const name = state.personName || "A";
        let uyir = 0;
        let mei = 0;
        for (let i = 0; i < name.length; i++) {
          const c = name.charCodeAt(i);
          if (/[aeiouAEIOU]/.test(name[i])) uyir += 1 + (c % 5);
          else mei += 1 + (c % 7);
        }
        const total = 1 + ((uyir + mei) % 9);
        const bands = [
          { en: "Rising band", zh: "升势带", lean: { en: "grow the craft", zh: "滋养技艺", hant: "滋養技藝" } },
          { en: "Steady band", zh: "稳健带", lean: { en: "keep pace · protect rest", zh: "稳节奏·护休息", hant: "穩節奏·護休息" } },
          { en: "Refine band", zh: "精炼带", lean: { en: "edit the signature", zh: "精炼署名", hant: "精煉署名" } },
        ];
        const band = bands[(total - 1) % bands.length];
        return { name, uyir, mei, total, band, lean: loc(band.lean) };
      },
      generate(q, cast) {
        const b = loc({ en: cast.band.en, zh: cast.band.zh });
        return pack({
          title: `${cast.name} · ${cast.total} · ${b}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学泰米尔数理以「${cast.name}」得乌伊尔 ${cast.uyir}、梅伊 ${cast.mei}、合 ${cast.total}（${b}），倾向「${cast.lean}」。`, `教學泰米爾數理以「${cast.name}」得烏伊爾 ${cast.uyir}、梅伊 ${cast.mei}、合 ${cast.total}（${b}），傾向「${cast.lean}」。`)
            : `Teaching Tamil numerology for “${cast.name}” shows uyir ${cast.uyir}, mei ${cast.mei}, total ${cast.total} (${b}), leaning “${cast.lean}”.`,
          interpret: interpretQ(q || cast.name, cast.lean, isZh() ? "泰米尔数理" : "Tamil numerology"),
          details: [cast.name, `uyir ${cast.uyir}`, `mei ${cast.mei}`, String(cast.total)],
          doList: [isZh() ? zhText(`试一句更清晰的自我介绍，呼应「${cast.lean}」。`, `試一句更清晰的自我介紹，呼應「${cast.lean}」。`) : `Try one clearer self-intro matching “${cast.lean}”.`],
          dontList: [isZh() ? zhText("不要因数理羞辱姓名。", "不要因數理羞辱姓名。") : "Do not shame a name over number totals."],
          tone: "mixed",
          vizData: cast,
        });
      },
    },

    "anka-jyotisha": {
      summary: {
        en: "Aṅka Jyotiṣa links numbers 1–9 to planets for birth and name analysis in northern Indian traditions.",
        zh: "数字占星（Aṅka Jyotiṣa）将 1–9 与行星对应，用于北印出生与姓名分析。",
        hant: "數字占星（Aṅka Jyotiṣa）將 1–9 與行星對應，用於北印出生與姓名分析。",
      },
      how: howPack(
        {
          intro: "You’ll enter birth date, see the planet-number, then open a teaching aṅka board.",
          steps: [
            { title: "Meet Aṅka Jyotiṣa", body: "Numbers · planets · counsel." },
            { title: "Enter birth date", body: "Number seed." },
            { title: "See the planet-number", body: "1–9 lights." },
            { title: "Open the aṅka board", body: "Planet lean appears." },
            { title: "Aṅka counsel", body: "Number lean for your focus." },
          ],
        },
        {
          intro: "你将输入生辰、查看行星数，再打开教学数字盘。",
          steps: [
            { title: "认识数字占星", body: "数 · 行星 · 指引。" },
            { title: "输入出生日期", body: "数种。" },
            { title: "查看行星数", body: "1–9 点亮。" },
            { title: "打开数字盘", body: "行星倾向出现。" },
            { title: "数字占星指引", body: "数理对照焦点。" },
          ],
        },
        {
          intro: "你將輸入生辰、查看行星數，再打開教學數字盤。",
          steps: [
            { title: "認識數字占星", body: "數 · 行星 · 指引。" },
            { title: "輸入出生日期", body: "數種。" },
            { title: "查看行星數", body: "1–9 點亮。" },
            { title: "打開數字盤", body: "行星傾向出現。" },
            { title: "數字占星指引", body: "數理對照焦點。" },
          ],
        }
      ),
      steps: ["intent", "birth", "planetNumber", "ankaBoard", "result"],
      viz: "anka",
      castCta: { en: "Open the aṅka board", zh: "打开数字盘", hant: "打開數字盤" },
      buildCast(state, rng) {
        const d = state.birthDate ? new Date(state.birthDate + "T12:00:00") : new Date();
        const sum = String(d.getFullYear() || 2000)
          .split("")
          .concat(String((d.getMonth?.() ?? 0) + 1), String(d.getDate?.() || 1))
          .reduce((a, c) => a + (parseInt(c, 10) || 0), 0);
        const n = 1 + (sum % 9);
        const planet = PLANETS_NUM.find((p) => p.n === n) || pick(rng, PLANETS_NUM);
        return { birth: state.birthDate || "", planet, lean: loc(planet.lean) };
      },
      generate(q, cast) {
        const p = loc({ en: cast.planet.en, zh: cast.planet.zh });
        return pack({
          title: `${cast.birth || "—"} · ${p}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学数字占星以「${cast.birth || "—"}」得「${p}」，倾向「${cast.lean}」。真算需完整姓名与宫位。`, `教學數字占星以「${cast.birth || "—"}」得「${p}」，傾向「${cast.lean}」。真算需完整姓名與宮位。`)
            : `Teaching aṅka jyotiṣa for “${cast.birth || "—"}” shows “${p}”, leaning “${cast.lean}”. Real work needs full name and house maps.`,
          interpret: interpretQ(q, cast.lean, isZh() ? "数字占星" : "aṅka jyotiṣa"),
          details: [cast.birth || "—", p],
          doList: [isZh() ? zhText(`围绕「${cast.lean}」做一件本周可验证的小事。`, `圍繞「${cast.lean}」做一件本週可驗證的小事。`) : `Do one verifiable small act this week around “${cast.lean}”.`],
          dontList: [isZh() ? zhText("不要用数字恐吓他人改名。", "不要用數字恐嚇他人改名。") : "Do not scare others into renaming over numbers."],
          tone: "mixed",
          vizData: cast,
        });
      },
    },

    vastu: {
      summary: {
        en: "Vāstu Śāstra reads architectural orientation and layout as household and enterprise fortune — related to, but distinct from, Chinese feng shui.",
        zh: "梵宅学（Vastu）依建筑朝向与布局论家运与事业气场——与风水相关而自成系统。",
        hant: "梵宅學（Vastu）依建築朝向與佈局論家運與事業氣場——與風水相關而自成系統。",
      },
      how: howPack(
        {
          intro: "You’ll mark a space type, set facing, then map a teaching vāstu lean.",
          steps: [
            { title: "Meet Vāstu", body: "Plan · facing · household qi." },
            { title: "Mark the space type", body: "Home, shop, office…" },
            { title: "Set the facing", body: "Main opening direction." },
            { title: "Map the vāstu", body: "Teaching sectors light." },
            { title: "Vāstu counsel", body: "Facing lean for your ask." },
          ],
        },
        {
          intro: "你将标注空间类型、设定朝向，再映射教学梵宅倾向。",
          steps: [
            { title: "认识梵宅学", body: "平面 · 朝向 · 家气。" },
            { title: "标注空间类型", body: "住宅、店铺、办公…" },
            { title: "设定朝向", body: "主要开口方向。" },
            { title: "映射梵宅", body: "教学区位点亮。" },
            { title: "梵宅指引", body: "朝向倾向对照所问。" },
          ],
        },
        {
          intro: "你將標註空間類型、設定朝向，再映射教學梵宅傾向。",
          steps: [
            { title: "認識梵宅學", body: "平面 · 朝向 · 家氣。" },
            { title: "標註空間類型", body: "住宅、店鋪、辦公…" },
            { title: "設定朝向", body: "主要開口方向。" },
            { title: "映射梵宅", body: "教學區位點亮。" },
            { title: "梵宅指引", body: "朝向傾向對照所問。" },
          ],
        }
      ),
      steps: ["intent", "vastuPlan", "vastuFacing", "vastuMap", "result"],
      viz: "vastu",
      castCta: { en: "Map the vāstu", zh: "映射梵宅", hant: "映射梵宅" },
      buildCast(state, rng) {
        const plans = {
          home: { en: "Home", zh: "住宅", hant: "住宅" },
          shop: { en: "Shop", zh: "店铺", hant: "店鋪" },
          office: { en: "Office", zh: "办公", hant: "辦公" },
        };
        const plan = plans[state.vastuPlan] || plans.home;
        const facing = VASTU_FACES.find((f) => f.id === state.facing) || pick(rng, VASTU_FACES);
        return { plan, facing, lean: loc(facing.lean) };
      },
      generate(q, cast) {
        const p = loc(cast.plan);
        const f = loc({ en: cast.facing.en, zh: cast.facing.zh });
        return pack({
          title: `${p} · ${f}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学梵宅以「${p}」朝「${f}」，倾向「${cast.lean}」。真梵宅需实地平面图。`, `教學梵宅以「${p}」朝「${f}」，傾向「${cast.lean}」。真梵宅需實地平面圖。`)
            : `Teaching vāstu for “${p}” facing “${f}” leans “${cast.lean}”. Real vāstu needs a floor plan on site.`,
          interpret: interpretQ(q || p, cast.lean, isZh() ? "梵宅" : "vāstu"),
          details: [p, cast.facing.id],
          doList: [isZh() ? zhText(`只改一件可逆摆设呼应「${cast.lean}」。`, `只改一件可逆擺設呼應「${cast.lean}」。`) : `Change only one reversible layout item matching “${cast.lean}”.`],
          dontList: [isZh() ? zhText("不要因教学盘大拆承重结构。", "不要因教學盤大拆承重結構。") : "Do not gut load-bearing structure from a teaching map."],
          tone: /慎|care|protect|护/i.test(cast.lean) ? "caution" : "mixed",
          vizData: cast,
        });
      },
    },

    "parrot-astrology": {
      summary: {
        en: "Kili Josiyam (parrot astrology) is a South Indian street/temple craft where a trained parrot picks a fortune card or shell.",
        zh: "鹦鹉占星（Kili Josiyam）是南印度街头／庙会传统——训练鹦鹉叼出签卡或贝壳。",
        hant: "鸚鵡占星（Kili Josiyam）是南印度街頭／廟會傳統——訓練鸚鵡叼出簽卡或貝殼。",
      },
      how: howPack(
        {
          intro: "You’ll hold a question, call the teaching parrot, then read the picked card.",
          steps: [
            { title: "Meet Kili Josiyam", body: "Parrot · cards · verse." },
            { title: "Hold your question", body: "One clear ask." },
            { title: "Call the parrot", body: "Teaching bird hops." },
            { title: "Read the picked card", body: "Card lean appears." },
            { title: "Parrot counsel", body: "Card lean for your question." },
          ],
        },
        {
          intro: "你将抱定问题、召唤教学鹦鹉，再读叼出的签卡。",
          steps: [
            { title: "认识鹦鹉占", body: "鹦鹉 · 签卡 · 签文。" },
            { title: "抱定问题", body: "只留一个清楚的问。" },
            { title: "召唤鹦鹉", body: "教学鸟跳近。" },
            { title: "读取签卡", body: "签卡倾向出现。" },
            { title: "鹦鹉指引", body: "签意对照问题。" },
          ],
        },
        {
          intro: "你將抱定問題、召喚教學鸚鵡，再讀叼出的簽卡。",
          steps: [
            { title: "認識鸚鵡占", body: "鸚鵡 · 簽卡 · 簽文。" },
            { title: "抱定問題", body: "只留一個清楚的問。" },
            { title: "召喚鸚鵡", body: "教學鳥跳近。" },
            { title: "讀取簽卡", body: "簽卡傾向出現。" },
            { title: "鸚鵡指引", body: "簽意對照問題。" },
          ],
        }
      ),
      steps: ["intent", "question", "callParrot", "cardPick", "result"],
      viz: "parrot",
      castCta: { en: "Read the picked card", zh: "读取签卡", hant: "讀取簽卡" },
      buildCast(state, rng) {
        const card = pick(rng, PARROT_CARDS);
        return { card, lean: loc(card.lean) };
      },
      generate(q, cast) {
        const c = loc({ en: cast.card.en, zh: cast.card.zh });
        return pack({
          title: c,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学鹦鹉占叼得「${c}」，倾向「${cast.lean}」。真表演需训练鸟与签师；此处为签意教育。`, `教學鸚鵡占叼得「${c}」，傾向「${cast.lean}」。真表演需訓練鳥與簽師；此處為簽意教育。`)
            : `Teaching parrot astrology picks “${c}”, leaning “${cast.lean}”. Live craft needs a trained bird and reader; card meaning education here.`,
          interpret: interpretQ(q, cast.lean, isZh() ? "鹦鹉签卡" : "the parrot card"),
          details: [c],
          doList: [isZh() ? zhText(`把「${cast.lean}」写成今天一句可执行的提醒。`, `把「${cast.lean}」寫成今天一句可執行的提醒。`) : `Write “${cast.lean}” as one doable reminder today.`],
          dontList: [isZh() ? zhText("不要虐待或强迫真实鹦鹉表演。", "不要虐待或強迫真實鸚鵡表演。") : "Do not mistreat or coerce real parrots for performance."],
          tone: "bright",
          vizData: cast,
        });
      },
    },

    "sinhala-nekath": {
      summary: {
        en: "Sinhala nekath is Sri Lanka’s almanac of auspicious hours — used for starts, travel, and marriage timing.",
        zh: "僧伽罗择时（Nekath）是斯里兰卡吉时通书——用于开事、出行与婚嫁择时。",
        hant: "僧伽羅擇時（Nekath）是斯里蘭卡吉時通書——用於開事、出行與婚嫁擇時。",
      },
      how: howPack(
        {
          intro: "You’ll pick a day, choose a nekath hour band, then read the counsel.",
          steps: [
            { title: "Meet Sinhala Nekath", body: "Hours · almanac · starts." },
            { title: "Pick a day", body: "Date under review." },
            { title: "Choose a nekath hour", body: "Good / neutral / care." },
            { title: "Read the hour counsel", body: "Band lean appears." },
            { title: "Nekath counsel", body: "Hour lean for your purpose." },
          ],
        },
        {
          intro: "你将点选日期、选择择时色带，再读时辰指引。",
          steps: [
            { title: "认识僧伽罗择时", body: "时辰 · 通书 · 开事。" },
            { title: "点选日期", body: "所问之日。" },
            { title: "选择择时色带", body: "吉／平／慎。" },
            { title: "读取时辰指引", body: "色带倾向出现。" },
            { title: "择时指引", body: "时辰倾向对照目的。" },
          ],
        },
        {
          intro: "你將點選日期、選擇擇時色帶，再讀時辰指引。",
          steps: [
            { title: "認識僧伽羅擇時", body: "時辰 · 通書 · 開事。" },
            { title: "點選日期", body: "所問之日。" },
            { title: "選擇擇時色帶", body: "吉／平／慎。" },
            { title: "讀取時辰指引", body: "色帶傾向出現。" },
            { title: "擇時指引", body: "時辰傾向對照目的。" },
          ],
        }
      ),
      steps: ["intent", "daypickNekath", "nekathHour", "nekathCounsel", "result"],
      viz: "nekath",
      castCta: { en: "Read the hour counsel", zh: "读取时辰指引", hant: "讀取時辰指引" },
      buildCast(state, rng) {
        const hour = NEKATH.find((n) => n.en === state.nekathHour) || pick(rng, NEKATH);
        return { date: state.dayDate || "", hour, lean: loc(hour.lean) };
      },
      generate(q, cast) {
        const h = loc({ en: cast.hour.en, zh: cast.hour.zh });
        return pack({
          title: `${cast.date || "—"} · ${h}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学僧伽罗择时于「${cast.date || "未选日"}」示「${h}」，倾向「${cast.lean}」。真择时依当地历书。`, `教學僧伽羅擇時於「${cast.date || "未選日"}」示「${h}」，傾向「${cast.lean}」。真擇時依當地曆書。`)
            : `Teaching sinhala nekath on “${cast.date || "unset day"}” shows “${h}”, leaning “${cast.lean}”. Real hours follow a local almanac.`,
          interpret: interpretQ(q || cast.date, cast.lean, isZh() ? "僧伽罗择时" : "sinhala nekath"),
          details: [cast.date || "—", h],
          doList: [isZh() ? zhText(`按「${cast.lean}」安排今天一个时间块。`, `按「${cast.lean}」安排今天一個時間塊。`) : `Schedule one time block today matching “${cast.lean}”.`],
          dontList: [isZh() ? zhText("不要因择时取消必要医疗预约。", "不要因擇時取消必要醫療預約。") : "Do not cancel needed medical appointments over hours."],
          tone: /慎|Care|delay|延/i.test(h + cast.lean) ? "caution" : "bright",
          vizData: cast,
        });
      },
    },

    sarvatobhadra: {
      summary: {
        en: "Sarvatobhadra Chakra is a North Indian muhūrta diagram — spokes and letters counsel day quality for starts and travel.",
        zh: "全方位吉凶盘（Sarvatobhadra）是北印择日星盘——辐条与字母论开事与出行日质。",
        hant: "全方位吉凶盤（Sarvatobhadra）是北印擇日星盤——輻條與字母論開事與出行日質。",
      },
      how: howPack(
        {
          intro: "You’ll pick a day, spin the teaching chakra, then read the sarvatobhadra counsel.",
          steps: [
            { title: "Meet Sarvatobhadra", body: "Chakra · spokes · muhūrta." },
            { title: "Pick a day", body: "Date under review." },
            { title: "Spin the chakra", body: "Spokes light." },
            { title: "Read the chakra counsel", body: "Spoke lean appears." },
            { title: "Sarvatobhadra counsel", body: "Lean for your purpose." },
          ],
        },
        {
          intro: "你将点选日期、旋转教学星盘，再读全方位指引。",
          steps: [
            { title: "认识全方位盘", body: "星盘 · 辐条 · 择时。" },
            { title: "点选日期", body: "所问之日。" },
            { title: "旋转星盘", body: "辐条点亮。" },
            { title: "读取星盘指引", body: "辐条倾向出现。" },
            { title: "全方位指引", body: "倾向对照目的。" },
          ],
        },
        {
          intro: "你將點選日期、旋轉教學星盤，再讀全方位指引。",
          steps: [
            { title: "認識全方位盤", body: "星盤 · 輻條 · 擇時。" },
            { title: "點選日期", body: "所問之日。" },
            { title: "旋轉星盤", body: "輻條點亮。" },
            { title: "讀取星盤指引", body: "輻條傾向出現。" },
            { title: "全方位指引", body: "傾向對照目的。" },
          ],
        }
      ),
      steps: ["intent", "daypickSbc", "chakraSpin", "sbcCounsel", "result"],
      viz: "sarvatobhadra",
      castCta: { en: "Read the chakra counsel", zh: "读取星盘指引", hant: "讀取星盤指引" },
      buildCast(state, rng) {
        const spoke = pick(rng, SBC);
        return { date: state.dayDate || "", spoke, lean: loc(spoke.lean) };
      },
      generate(q, cast) {
        const s = loc({ en: cast.spoke.en, zh: cast.spoke.zh });
        return pack({
          title: `${cast.date || "—"} · ${s}`,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学全方位盘于「${cast.date || "未选日"}」亮「${s}」，倾向「${cast.lean}」。真盘需完整字母与行星标注。`, `教學全方位盤於「${cast.date || "未選日"}」亮「${s}」，傾向「${cast.lean}」。真盤需完整字母與行星標註。`)
            : `Teaching sarvatobhadra on “${cast.date || "unset day"}” lights “${s}”, leaning “${cast.lean}”. Real chakras need full letter and planet marks.`,
          interpret: interpretQ(q || cast.date, cast.lean, isZh() ? "全方位盘" : "sarvatobhadra"),
          details: [cast.date || "—", s],
          doList: [isZh() ? zhText(`按「${cast.lean}」安排一次可逆试探。`, `按「${cast.lean}」安排一次可逆試探。`) : `Schedule one reversible trial matching “${cast.lean}”.`],
          dontList: [isZh() ? zhText("不要因星盘恐吓他人取消必要行程。", "不要因星盤恐嚇他人取消必要行程。") : "Do not scare others into canceling needed travel over the chakra."],
          tone: "mixed",
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
            "本站为教育性游玩——不能替代受训吠陀／择日／相学、医疗、法律或安全判断。",
            "本站為教育性遊玩——不能替代受訓吠陀／擇日／相學、醫療、法律或安全判斷。"
          )
        : "Educational play on this site — not a substitute for trained jyotiṣa/muhūrta/śāstra practice, medicine, law, or safety judgment.",
    };
  }
  function runCast(id, state) {
    const rite = RITES[id];
    if (!rite) return null;
    const rng = mulberry32(
      seedFrom(state.question || state.personName || state.birthDate || state.dayDate, state.nonce, id)
    );
    const cast = Object.assign({}, state.cast || {}, rite.buildCast(state, rng) || {});
    return rite.generate(state.question || state.focus || state.personName || "", cast, rng);
  }

  window.FatumSouthAsiaOracles = { IDS, has, get, howFor, runCast, loc };
})();
