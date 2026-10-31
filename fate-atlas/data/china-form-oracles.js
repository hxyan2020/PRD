/**
 * Chinese feng shui & physiognomy oracles — unique steps, visuals, readings.
 * Feng Shui · Ba Zhai · Flying Star · Mian Xiang · Shou Xiang · Mogu · Moleosophy
 */
(function () {
  "use strict";

  const IDS = [
    "fengshui",
    "bazhai",
    "flying-star",
    "mianxiang",
    "shouxiang",
    "mogu",
    "mole-reading",
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

  /** Pick Hans vs Hant when both are provided. */
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
      kind: "formchina",
      ...r,
      disclaimer: isZh()
        ? isHant()
          ? "教育性模擬——不能替代受訓風水／相術實踐，也不能替代醫療、法律、建築或安全判斷。可能不準確；無法預測黑天鵝事件。"
          : "教育性模拟——不能替代受训风水／相术实践，也不能替代医疗、法律、建筑或安全判断。可能不准确；无法预测黑天鹅事件。"
        : "Educational simulation — not a substitute for trained feng shui/physiognomy practice, medicine, law, architecture, or safety judgment. May be inaccurate; cannot predict black swan events.",
    };
    return RM ? RM.structuredReading(base) : base;
  }

  function interpretQ(q, lean, mechanic) {
    const RM = window.FatumResultModel;
    const body = isZh()
      ? isHant()
        ? `你問的是「${q || "未寫明的事"}」。以${mechanic}給出的「${lean}」傾向為鏡：先改一件你能控制的環境或習慣，再用日常證據核對——不要把模擬格局當成外在命令。`
        : `你问的是「${q || "未写明的事"}」。以${mechanic}给出的「${lean}」倾向为镜：先改一件你能控制的环境或习惯，再用日常证据核对——不要把模拟格局当成外在命令。`
      : `You asked about “${q || "an unnamed matter"}”. Hold the “${lean}” lean from ${mechanic} as a mirror: change one environment or habit you control, then check ordinary evidence — do not treat a simulated pattern as an external order.`;
    return RM ? RM.interpretWithQuestion(q, body) : body;
  }

  const FACINGS = [
    { id: "N", en: "North", zh: "坐北朝南倾向", lean: { en: "gather · settle", zh: "收纳·安住" } },
    { id: "E", en: "East", zh: "东向气口", lean: { en: "grow · begin", zh: "生发·起势" } },
    { id: "S", en: "South", zh: "南向明堂", lean: { en: "show · brighten", zh: "显扬·开明" } },
    { id: "W", en: "West", zh: "西向收敛", lean: { en: "harvest · refine", zh: "收敛·精製" } },
  ];

  const GUAS = [
    { n: 1, en: "Kan", zh: "坎", group: "east", lean: { en: "career water flow", zh: "事业水流" } },
    { n: 2, en: "Kun", zh: "坤", group: "west", lean: { en: "earth nurture", zh: "厚土滋养" } },
    { n: 3, en: "Zhen", zh: "震", group: "east", lean: { en: "thunder start", zh: "雷动起步" } },
    { n: 4, en: "Xun", zh: "巽", group: "east", lean: { en: "wind entry", zh: "风入渗透" } },
    { n: 6, en: "Qian", zh: "乾", group: "west", lean: { en: "metal lead", zh: "金令主导" } },
    { n: 7, en: "Dui", zh: "兑", group: "west", lean: { en: "lake exchange", zh: "泽口交换" } },
    { n: 8, en: "Gen", zh: "艮", group: "west", lean: { en: "mountain hold", zh: "山止守界" } },
    { n: 9, en: "Li", zh: "离", group: "east", lean: { en: "fire clarity", zh: "火明照见" } },
  ];

  const STARS = [
    { n: 1, en: "One White", zh: "一白", lean: { en: "support · talk", zh: "贵人·言谈" } },
    { n: 2, en: "Two Black", zh: "二黑", lean: { en: "illness caution", zh: "病符慎养" } },
    { n: 3, en: "Three Jade", zh: "三碧", lean: { en: "dispute risk", zh: "口舌争执" } },
    { n: 4, en: "Four Green", zh: "四绿", lean: { en: "study · romance", zh: "文昌·桃花" } },
    { n: 5, en: "Five Yellow", zh: "五黄", lean: { en: "heavy · reduce", zh: "压迫·宜减" } },
    { n: 6, en: "Six White", zh: "六白", lean: { en: "authority · travel", zh: "权位·远行" } },
    { n: 7, en: "Seven Red", zh: "七赤", lean: { en: "metal edge", zh: "金锐变动" } },
    { n: 8, en: "Eight White", zh: "八白", lean: { en: "wealth build", zh: "财山积累" } },
    { n: 9, en: "Nine Purple", zh: "九紫", lean: { en: "joy · visibility", zh: "喜庆·可见" } },
  ];

  const FACE_ZONES = [
    { id: "forehead", en: "Forehead / career palace", zh: "额·官禄宫", lean: { en: "public path", zh: "公开之路" } },
    { id: "brows", en: "Brows / sibling palace", zh: "眉·兄弟宫", lean: { en: "allies & rivalry", zh: "手足与竞争" } },
    { id: "eyes", en: "Eyes / exploration", zh: "目·探视", lean: { en: "what you seek", zh: "你所寻视" } },
    { id: "nose", en: "Nose / wealth palace", zh: "鼻·财帛宫", lean: { en: "resource center", zh: "资源中宫" } },
    { id: "mouth", en: "Mouth / servant palace", zh: "口·奴仆宫", lean: { en: "speech & support", zh: "言语与助力" } },
  ];

  const PALM_LINES = [
    { id: "life", en: "Life line", zh: "生命线", lean: { en: "vitality pacing", zh: "活力节奏" } },
    { id: "head", en: "Head line", zh: "智慧线", lean: { en: "thinking style", zh: "思考方式" } },
    { id: "heart", en: "Heart line", zh: "感情线", lean: { en: "bond pattern", zh: "连结模式" } },
    { id: "fate", en: "Fate line", zh: "事业线", lean: { en: "path pressure", zh: "道路压力" } },
  ];

  const MOLE_ZONES = [
    { id: "face", en: "Face", zh: "面部", lean: { en: "visible reputation", zh: "可见名声" } },
    { id: "neck", en: "Neck", zh: "颈项", lean: { en: "transition zone", zh: "过渡地带" } },
    { id: "hand", en: "Hand", zh: "手部", lean: { en: "action mark", zh: "行动印记" } },
    { id: "shoulder", en: "Shoulder", zh: "肩背", lean: { en: "burden / duty", zh: "负荷／职责" } },
  ];

  const RITES = {
    fengshui: {
      summary: {
        en: "Classical feng shui reads site orientation, landform, and qi flow as environmental fortune — form and facing before interior décor myths.",
        zh: "经典风水论形势、坐向与气机流动为环境之运——先形峦与朝向，而非只谈摆设传说。",
      },
      how: {
        en: {
          intro: "Feng shui starts with site and facing. You’ll mark a place type, choose a facing, then read a qi lean.",
          steps: [
            { title: "Meet environmental qi", body: "Landform · facing · mouth of qi." },
            { title: "Name the site", body: "Home, shop, desk — pick the scale." },
            { title: "Set the facing", body: "Which way does the main opening look?" },
            { title: "Trace the qi flow", body: "A teaching arrow shows gather / scatter." },
            { title: "Read the site counsel", body: "Facing lean for your question." },
          ],
        },
        zh: {
          intro: "风水始于地与向。你将标记场所类型、选择朝向，再读气机倾向。",
          steps: [
            { title: "认识环境气机", body: "形峦 · 朝向 · 气口。" },
            { title: "点名场所", body: "住宅、店铺、书桌——选尺度。" },
            { title: "设定朝向", body: "主要开口朝哪边？" },
            { title: "描摹气机", body: "教学箭头示意聚／散。" },
            { title: "读场所指引", body: "朝向倾向对照你的问题。" },
          ],
        },
        hant: {
          intro: "風水始於地與向。你將標記場所類型、選擇朝向，再讀氣機傾向。",
          steps: [
            { title: "認識環境氣機", body: "形巒 · 朝向 · 氣口。" },
            { title: "點名場所", body: "住宅、店鋪、書桌——選尺度。" },
            { title: "設定朝向", body: "主要開口朝哪邊？" },
            { title: "描摹氣機", body: "教學箭頭示意聚／散。" },
            { title: "讀場所指引", body: "朝向傾向對照你的問題。" },
          ],
        },
      },
      steps: ["intent", "site", "facing", "qi", "result"],
      viz: "fengshui-qi",
      castCta: { en: "Trace the qi flow", zh: "描摹气机", hant: "描摹氣機" },
      buildCast(state, rng) {
        const facing = FACINGS.find((f) => f.id === state.facing) || pick(rng, FACINGS);
        const site = state.site || "home";
        return {
          site,
          facing,
          flow: pick(rng, isZh() ? ["气聚明堂", "气散宜挡", "气顺可留"] : ["qi gathers", "qi scatters — buffer", "qi flows clean"]),
          lean: loc(facing.lean),
        };
      },
      generate(q, cast) {
        const face = loc({ en: cast.facing.en, zh: cast.facing.zh });
        return pack({
          title: `${face} · ${cast.flow}`,
          result: isZh()
            ? `场所「${cast.site}」· 朝向 ${cast.facing.id}`
            : `Site “${cast.site}” · facing ${cast.facing.id}`,
          explain: isZh()
            ? `教学风水示「${face}」，气机「${cast.flow}」，倾向「${cast.lean}」。真风水需实地；此处为朝向教育。`
            : `Teaching feng shui shows “${face}”, flow “${cast.flow}”, leaning “${cast.lean}”. Real feng shui needs the site; facing education here.`,
          interpret: interpretQ(q || cast.site, cast.lean, isZh() ? "风水朝向" : "the feng shui facing"),
          details: [
            isZh() ? `场所：${cast.site}` : `Site: ${cast.site}`,
            isZh() ? `朝向：${cast.facing.id}` : `Facing: ${cast.facing.id}`,
            cast.flow,
          ],
          doList: [
            isZh()
              ? `只改一件与「${cast.lean}」相符的摆设或动线（可逆）。`
              : `Change only one reversible layout/path matching “${cast.lean}”.`,
          ],
          dontList: [
            isZh() ? "不要因教学盘大拆承重墙或违规改建。" : "Do not gut load-bearing walls or break codes from a teaching board.",
          ],
          tone: /散|scatter/.test(cast.flow) ? "caution" : "bright",
          vizData: cast,
        });
      },
    },

    bazhai: {
      summary: {
        en: "Ba Zhai matches eight house sectors to a personal gua number — favorable and unfavorable directions for sitting and sleeping.",
        zh: "八宅把住宅八个方位与个人卦命配对——论有利／不利的坐卧朝向。",
      },
      how: {
        en: {
          intro: "Eight Mansions uses your gua to color house sectors. Teaching map only.",
          steps: [
            { title: "Meet Ba Zhai", body: "East/west house groups · four good / four bad." },
            { title: "Pick a personal gua", body: "Teaching gua 1–9 (skip 5)." },
            { title: "See house sectors", body: "Eight directions light on the plan." },
            { title: "Map good vs caution", body: "Sheng qi / fu wei vs hazards highlight." },
            { title: "Read the mansion counsel", body: "Best sector lean for your ask." },
          ],
        },
        zh: {
          intro: "八宅用命卦为住宅方位上色。仅教学平面图。",
          steps: [
            { title: "认识八宅", body: "东四／西四命 · 四吉四凶。" },
            { title: "选择命卦", body: "教学用卦数 1–9（无 5）。" },
            { title: "查看宅位", body: "平面上点亮八个方位。" },
            { title: "标出吉凶", body: "生气／伏位与凶位对照。" },
            { title: "读宅法指引", body: "最佳方位倾向对照所问。" },
          ],
        },
        hant: {
          intro: "八宅用命卦為住宅方位上色。僅教學平面圖。",
          steps: [
            { title: "認識八宅", body: "東四／西四命 · 四吉四凶。" },
            { title: "選擇命卦", body: "教學用卦數 1–9（無 5）。" },
            { title: "查看宅位", body: "平面上點亮八個方位。" },
            { title: "標出吉凶", body: "生氣／伏位與凶位對照。" },
            { title: "讀宅法指引", body: "最佳方位傾向對照所問。" },
          ],
        },
      },
      steps: ["intent", "gua", "sectors", "map", "result"],
      viz: "bazhai-map",
      castCta: { en: "Map good vs caution", zh: "标出吉凶", hant: "標出吉凶" },
      buildCast(state, rng) {
        const gua = GUAS.find((g) => g.n === Number(state.gua)) || pick(rng, GUAS);
        const best = pick(rng, ["N", "E", "S", "W", "NE", "SE", "SW", "NW"]);
        const caution = pick(rng, ["N", "E", "S", "W", "NE", "SE", "SW", "NW"].filter((d) => d !== best));
        return { gua, best, caution, lean: loc(gua.lean) };
      },
      generate(q, cast) {
        const gname = loc({ en: cast.gua.en, zh: cast.gua.zh });
        return pack({
          title: isZh()
            ? `${gname}命 · 宜 ${cast.best} · 慎 ${cast.caution}`
            : `${gname} gua · favor ${cast.best} · caution ${cast.caution}`,
          result: cast.lean,
          explain: isZh()
            ? `教学八宅以「${gname}」命论宅，宜坐向「${cast.best}」，慎「${cast.caution}」。真推命卦需出生年与性别规则；此处为方位教育。`
            : `Teaching Ba Zhai with “${gname}” favors “${cast.best}”, cautions “${cast.caution}”. Real gua needs birth year/gender rules; direction education here.`,
          interpret: interpretQ(q, cast.lean, isZh() ? "八宅方位" : "Ba Zhai sectors"),
          details: [
            isZh() ? `命卦：${gname} (${cast.gua.n})` : `Gua: ${gname} (${cast.gua.n})`,
            isZh() ? `宜：${cast.best}` : `Favor: ${cast.best}`,
            isZh() ? `慎：${cast.caution}` : `Caution: ${cast.caution}`,
          ],
          doList: [
            isZh()
              ? `把书桌或床头试移向「${cast.best}」一侧一周，观察睡眠／专注。`
              : `Trial-shift desk or bedhead toward “${cast.best}” for a week; watch sleep/focus.`,
          ],
          dontList: [
            isZh() ? "不要只因凶位标签赶走家人或退租。" : "Do not evict family or break a lease only because of a ‘bad’ sector label.",
          ],
          tone: "mixed",
          vizData: cast,
        });
      },
    },

    "flying-star": {
      summary: {
        en: "Xuan Kong Flying Star moves time-based star numbers through house sectors to time fortune and caution.",
        zh: "玄空飞星把时令星数飞入宅卦各宫，用以择时论吉凶。",
      },
      how: {
        en: {
          intro: "Flying stars change with periods. You’ll set a period, open a chart, then read the visiting star.",
          steps: [
            { title: "Meet Flying Star", body: "Period · mountain/facing · annual stars." },
            { title: "Choose a period lens", body: "Period 8 / 9 teaching toggle." },
            { title: "Open the star chart", body: "Nine palaces fill with numbers." },
            { title: "Watch a star land", body: "One star highlights in a sector." },
            { title: "Read the star counsel", body: "Star lean for your question." },
          ],
        },
        zh: {
          intro: "飞星随运而变。你将设定运局、打开星盘，再读到访之星。",
          steps: [
            { title: "认识飞星", body: "运 · 山向 · 流年星。" },
            { title: "选择运局视角", body: "八运／九运教学切换。" },
            { title: "打开星盘", body: "九宫填入星数。" },
            { title: "看星落入", body: "一星在某宫点亮。" },
            { title: "读星指引", body: "星意倾向对照问题。" },
          ],
        },
        hant: {
          intro: "飛星隨運而變。你將設定運局、打開星盤，再讀到訪之星。",
          steps: [
            { title: "認識飛星", body: "運 · 山向 · 流年星。" },
            { title: "選擇運局視角", body: "八運／九運教學切換。" },
            { title: "打開星盤", body: "九宮填入星數。" },
            { title: "看星落入", body: "一星在某宮點亮。" },
            { title: "讀星指引", body: "星意傾向對照問題。" },
          ],
        },
      },
      steps: ["intent", "period", "chart", "stars", "result"],
      viz: "flying-star",
      castCta: { en: "Watch a star land", zh: "看星落入", hant: "看星落入" },
      buildCast(state, rng) {
        const star = pick(rng, STARS);
        const period = state.period || "9";
        const palace = 1 + Math.floor(rng() * 9);
        return { star, period, palace, lean: loc(star.lean) };
      },
      generate(q, cast) {
        const sname = loc({ en: cast.star.en, zh: cast.star.zh });
        return pack({
          title: isZh()
            ? `${cast.period}运 · ${sname} 入 ${cast.palace} 宫`
            : `Period ${cast.period} · ${sname} in palace ${cast.palace}`,
          result: cast.lean,
          explain: isZh()
            ? `教学飞星在${cast.period}运示「${sname}」入第 ${cast.palace} 宫，倾向「${cast.lean}」。真玄空需山向与年月日飞星；此处为星意教育。`
            : `Teaching Flying Star in period ${cast.period} shows “${sname}” in palace ${cast.palace}, leaning “${cast.lean}”. Real Xuan Kong needs facing and date flies; star education here.`,
          interpret: interpretQ(q, cast.lean, isZh() ? "飞星星意" : "the flying star"),
          details: [
            isZh() ? `运：${cast.period}` : `Period: ${cast.period}`,
            isZh() ? `星：${sname}` : `Star: ${sname}`,
            isZh() ? `宫：${cast.palace}` : `Palace: ${cast.palace}`,
          ],
          doList: [
            isZh()
              ? `若星意偏慎，减少该宫一周的长时间停留或堆放。`
              : `If the star cautions, reduce long stays or clutter in that sector for a week.`,
          ],
          dontList: [
            isZh() ? "不要用五黄恐吓他人或勒索改风水费。" : "Do not scare people with Five Yellow or extort feng shui fees.",
          ],
          tone: /病|争|压|illness|dispute|heavy|五黄|二黑|三碧/.test(sname + cast.lean) ? "caution" : "bright",
          vizData: cast,
        });
      },
    },

    mianxiang: {
      summary: {
        en: "Mian Xiang reads facial features and ‘palaces’ for character, health lean, and fortune themes — observation, not diagnosis.",
        zh: "面相观面部特征与十二宫，论性情、健康倾向与运势主题——是观察，不是诊断。",
      },
      how: {
        en: {
          intro: "Face reading maps zones (‘palaces’) to life themes. Educational observation only.",
          steps: [
            { title: "Meet Mian Xiang", body: "Palaces · features · timing by age bands." },
            { title: "Name your focus", body: "Career, kin, health worry — one theme." },
            { title: "Choose a face zone", body: "Forehead, brows, eyes, nose, mouth…" },
            { title: "Open the palace", body: "A teaching palace lights." },
            { title: "Read the face counsel", body: "Zone lean for your focus." },
          ],
        },
        zh: {
          intro: "面相把面部「宫位」映射到人生主题。仅教育观察。",
          steps: [
            { title: "认识面相", body: "宫位 · 部位 · 年龄带。" },
            { title: "说出焦点", body: "事业、亲属、健康忧虑——只留一个。" },
            { title: "选择面部区域", body: "额、眉、目、鼻、口…" },
            { title: "打开宫位", body: "教学宫位点亮。" },
            { title: "读面相指引", body: "区域倾向对照焦点。" },
          ],
        },
        hant: {
          intro: "面相把面部「宮位」映射到人生主題。僅教育觀察。",
          steps: [
            { title: "認識面相", body: "宮位 · 部位 · 年齡帶。" },
            { title: "說出焦點", body: "事業、親屬、健康憂慮——只留一個。" },
            { title: "選擇面部區域", body: "額、眉、目、鼻、口…" },
            { title: "打開宮位", body: "教學宮位點亮。" },
            { title: "讀面相指引", body: "區域傾向對照焦點。" },
          ],
        },
      },
      steps: ["intent", "focus", "facezones", "palace", "result"],
      viz: "mianxiang",
      castCta: { en: "Open the palace", zh: "打开宫位", hant: "打開宮位" },
      buildCast(state, rng) {
        const zone = FACE_ZONES.find((z) => z.id === state.faceZone) || pick(rng, FACE_ZONES);
        return { zone, lean: loc(zone.lean), focus: state.focus || state.question || "" };
      },
      generate(q, cast) {
        const z = loc({ en: cast.zone.en, zh: cast.zone.zh });
        const ask = q || cast.focus;
        return pack({
          title: z,
          result: cast.lean,
          explain: isZh()
            ? `教学面相聚焦「${z}」，倾向「${cast.lean}」。相术不能替代医疗诊断；请把面部当象征地图。`
            : `Teaching Mian Xiang focuses on “${z}”, leaning “${cast.lean}”. Physiognomy is not medical diagnosis — treat the face as a symbolic map.`,
          interpret: interpretQ(ask, cast.lean, isZh() ? "面相宫位" : "the face palace"),
          details: [z, cast.lean],
          doList: [
            isZh()
              ? `就「${cast.lean}」做一次诚实的自我记录（三天）。`
              : `Keep an honest three-day note on “${cast.lean}”.`,
          ],
          dontList: [
            isZh() ? "不要用面相标签歧视外貌或疾病。" : "Do not discriminate by looks or illness using face labels.",
          ],
          tone: "deep",
          vizData: cast,
        });
      },
    },

    shouxiang: {
      summary: {
        en: "Shou Xiang (Chinese palmistry) reads palm lines, mounts, and hand shape for destiny themes — symbolic, not medical.",
        zh: "手相观掌纹、丘位与手型论命运主题——是象征，不是医学。",
      },
      how: {
        en: {
          intro: "Palmistry traces major lines and mounts. You’ll pick a hand, mark a line, then read the mount lean.",
          steps: [
            { title: "Meet Shou Xiang", body: "Lines · mounts · hand shape." },
            { title: "Choose which hand", body: "Active / passive teaching flag." },
            { title: "Trace a major line", body: "Life, head, heart, or fate." },
            { title: "Read the mounts", body: "A mount beneath the fingers highlights." },
            { title: "Palm counsel", body: "Line lean for your question." },
          ],
        },
        zh: {
          intro: "手相看主线与丘。你将选手、点线，再读丘位倾向。",
          steps: [
            { title: "认识手相", body: "纹 · 丘 · 手型。" },
            { title: "选择哪只手", body: "主动／被动教学标记。" },
            { title: "描一条主线", body: "生命、智慧、感情或事业。" },
            { title: "读取丘位", body: "指下某丘点亮。" },
            { title: "手相指引", body: "线意倾向对照问题。" },
          ],
        },
        hant: {
          intro: "手相看主線與丘。你將選手、點線，再讀丘位傾向。",
          steps: [
            { title: "認識手相", body: "紋 · 丘 · 手型。" },
            { title: "選擇哪隻手", body: "主動／被動教學標記。" },
            { title: "描一條主線", body: "生命、智慧、感情或事業。" },
            { title: "讀取丘位", body: "指下某丘點亮。" },
            { title: "手相指引", body: "線意傾向對照問題。" },
          ],
        },
      },
      steps: ["intent", "hand", "lines", "mounts", "result"],
      viz: "shouxiang",
      castCta: { en: "Read the mounts", zh: "读取丘位", hant: "讀取丘位" },
      buildCast(state, rng) {
        const line = PALM_LINES.find((l) => l.id === state.palmLine) || pick(rng, PALM_LINES);
        const mounts = isZh()
          ? ["木星丘", "土星丘", "太阳丘", "水星丘"]
          : ["Jupiter mount", "Saturn mount", "Apollo mount", "Mercury mount"];
        return {
          hand: state.hand || "active",
          line,
          mount: pick(rng, mounts),
          lean: loc(line.lean),
        };
      },
      generate(q, cast) {
        const lname = loc({ en: cast.line.en, zh: cast.line.zh });
        return pack({
          title: `${lname} · ${cast.mount}`,
          result: cast.lean,
          explain: isZh()
            ? `教学手相在「${cast.hand}」手看「${lname}」，丘位「${cast.mount}」，倾向「${cast.lean}」。掌纹因人而异；不作医疗承诺。`
            : `Teaching palmistry on the “${cast.hand}” hand reads “${lname}” with mount “${cast.mount}”, leaning “${cast.lean}”. Palms vary; no medical claims.`,
          interpret: interpretQ(q, cast.lean, isZh() ? "手相主线" : "the palm line"),
          details: [
            isZh() ? `手：${cast.hand}` : `Hand: ${cast.hand}`,
            isZh() ? `线：${lname}` : `Line: ${lname}`,
            isZh() ? `丘：${cast.mount}` : `Mount: ${cast.mount}`,
          ],
          doList: [
            isZh()
              ? `针对「${cast.lean}」调整一个习惯一周。`
              : `Adjust one habit for a week around “${cast.lean}”.`,
          ],
          dontList: [
            isZh() ? "不要用手相断人寿命或疾病。" : "Do not use palmistry to declare lifespan or disease.",
          ],
          tone: "mixed",
          vizData: cast,
        });
      },
    },

    mogu: {
      summary: {
        en: "Mogu emphasizes hand-bone structure over surface lines — ‘feeling the bones’ for constitution and fate lean.",
        zh: "摸骨重手骨结构多于皮表纹路——以「摸骨」论体质与命运倾向。",
      },
      how: {
        en: {
          intro: "Bone palmistry weighs joints and bone feel. Teaching structure map only — no real pressure pain.",
          steps: [
            { title: "Meet Mogu", body: "Bone mass · joints · spacing." },
            { title: "Present a hand", body: "Left or right teaching choice." },
            { title: "Map the bone frame", body: "Joints light on a hand outline." },
            { title: "Weigh the structure", body: "Heavy / fine / uneven teaching tags." },
            { title: "Bone counsel", body: "Structure lean for your ask." },
          ],
        },
        zh: {
          intro: "摸骨看关节与骨感。仅教学结构图——无真实施压疼痛。",
          steps: [
            { title: "认识摸骨", body: "骨量 · 关节 · 间距。" },
            { title: "出示手", body: "左或右教学选择。" },
            { title: "绘出骨架", body: "手轮廓上点亮关节。" },
            { title: "衡量结构", body: "厚重／纤细／不匀教学标签。" },
            { title: "骨法指引", body: "结构倾向对照所问。" },
          ],
        },
        hant: {
          intro: "摸骨看關節與骨感。僅教學結構圖——無真實施壓疼痛。",
          steps: [
            { title: "認識摸骨", body: "骨量 · 關節 · 間距。" },
            { title: "出示手", body: "左或右教學選擇。" },
            { title: "繪出骨架", body: "手輪廓上點亮關節。" },
            { title: "衡量結構", body: "厚重／纖細／不勻教學標籤。" },
            { title: "骨法指引", body: "結構傾向對照所問。" },
          ],
        },
      },
      steps: ["intent", "hand", "bones", "structure", "result"],
      viz: "mogu",
      castCta: { en: "Weigh the structure", zh: "衡量结构", hant: "衡量結構" },
      buildCast(state, rng) {
        const tags = isZh()
          ? [
              { t: "骨厚", l: "负荷能力强·宜稳进" },
              { t: "骨细", l: "灵敏·宜护边界" },
              { t: "骨匀", l: "平衡·可持续" },
              { t: "骨突", l: "锋芒·防过劳" },
            ]
          : [
              { t: "Heavy bone", l: "load capacity · steady advance" },
              { t: "Fine bone", l: "sensitivity · guard borders" },
              { t: "Even bone", l: "balance · sustain" },
              { t: "Prominent bone", l: "edge · avoid overwork" },
            ];
        const tag = pick(rng, tags);
        return { hand: state.hand || "left", tag };
      },
      generate(q, cast) {
        return pack({
          title: cast.tag.t,
          result: cast.tag.l,
          explain: isZh()
            ? `教学摸骨在「${cast.hand}」手示「${cast.tag.t}」，倾向「${cast.tag.l}」。不作医学骨科判断。`
            : `Teaching mogu on the “${cast.hand}” hand shows “${cast.tag.t}”, leaning “${cast.tag.l}”. Not orthopedic medicine.`,
          interpret: interpretQ(q, cast.tag.l, isZh() ? "摸骨结构" : "the bone structure"),
          details: [
            isZh() ? `手：${cast.hand}` : `Hand: ${cast.hand}`,
            cast.tag.t,
          ],
          doList: [
            isZh()
              ? `按「${cast.tag.l}」安排本周负荷（加或减一档）。`
              : `Set this week’s load up or down one notch per “${cast.tag.l}”.`,
          ],
          dontList: [
            isZh() ? "不要用力按压他人关节造成疼痛。" : "Do not press others’ joints hard enough to cause pain.",
          ],
          tone: /突|锋|Prominent|edge|过劳/.test(cast.tag.t + cast.tag.l) ? "caution" : "mixed",
          vizData: cast,
        });
      },
    },

    "mole-reading": {
      summary: {
        en: "Moleosophy reads mole position and type for character and fortune themes — folklore symbols, not dermatology.",
        zh: "痣相依位置与形态论性情与运势主题——是民俗象征，不是皮肤科。",
      },
      how: {
        en: {
          intro: "Mole reading maps body zones to folk meanings. Educational only — see a doctor for real skin concerns.",
          steps: [
            { title: "Meet mole lore", body: "Zone · color · raised/flat folklore." },
            { title: "Pick a body zone", body: "Face, neck, hand, shoulder…" },
            { title: "Mark the mole", body: "Place a teaching spot on the silhouette." },
            { title: "Read the omen", body: "A folk lean appears." },
            { title: "Mole counsel", body: "Zone lean for your question." },
          ],
        },
        zh: {
          intro: "痣相把身体区域映射到民俗义。仅教育——皮肤问题请就医。",
          steps: [
            { title: "认识痣相", body: "部位 · 色泽 · 凸平民俗。" },
            { title: "选择身体区域", body: "面、颈、手、肩…" },
            { title: "标记痣点", body: "在剪影上点一教学标记。" },
            { title: "读取兆意", body: "出现民俗倾向。" },
            { title: "痣相指引", body: "部位倾向对照问题。" },
          ],
        },
        hant: {
          intro: "痣相把身體區域映射到民俗義。僅教育——皮膚問題請就醫。",
          steps: [
            { title: "認識痣相", body: "部位 · 色澤 · 凸平民俗。" },
            { title: "選擇身體區域", body: "面、頸、手、肩…" },
            { title: "標記痣點", body: "在剪影上點一教學標記。" },
            { title: "讀取兆意", body: "出現民俗傾向。" },
            { title: "痣相指引", body: "部位傾向對照問題。" },
          ],
        },
      },
      steps: ["intent", "bodyzone", "molepick", "omen", "result"],
      viz: "mole",
      castCta: { en: "Read the omen", zh: "读取兆意", hant: "讀取兆意" },
      buildCast(state, rng) {
        const zone = MOLE_ZONES.find((z) => z.id === state.bodyZone) || pick(rng, MOLE_ZONES);
        const tone = pick(rng, isZh() ? ["明痣", "暗痣", "高痣"] : ["bright mole", "hidden mole", "raised mole"]);
        return { zone, tone, lean: loc(zone.lean) };
      },
      generate(q, cast) {
        const z = loc({ en: cast.zone.en, zh: cast.zone.zh });
        return pack({
          title: `${z} · ${cast.tone}`,
          result: cast.lean,
          explain: isZh()
            ? `教学痣相在「${z}」见「${cast.tone}」，倾向「${cast.lean}」。变色、出血、快速增大的痣请就医，勿用民俗替代。`
            : `Teaching mole lore on “${z}” as “${cast.tone}” leans “${cast.lean}”. Changing, bleeding, or fast-growing moles need a doctor — not folklore.`,
          interpret: interpretQ(q, cast.lean, isZh() ? "痣相部位" : "the mole zone"),
          details: [z, cast.tone, cast.lean],
          doList: [
            isZh()
              ? `把「${cast.lean}」写成一个与自我形象相关的小行动。`
              : `Turn “${cast.lean}” into one small self-image action.`,
          ],
          dontList: [
            isZh() ? "不要自行挖除或灼烧痣点。" : "Do not dig out or burn moles yourself.",
          ],
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
            "本站为教育性游玩——不能替代受训风水／相术、医疗、法律、建筑或安全判断。",
            "本站為教育性遊玩——不能替代受訓風水／相術、醫療、法律、建築或安全判斷。"
          )
        : "Educational play on this site — not a substitute for trained feng shui/physiognomy, medicine, law, architecture, or safety judgment.",
    };
  }

  function runCast(id, state) {
    const rite = RITES[id];
    if (!rite) return null;
    const rng = mulberry32(
      seedFrom(state.question || state.focus || state.site || state.gua, state.nonce, id)
    );
    const cast = Object.assign({}, state.cast || {}, rite.buildCast(state, rng) || {});
    return rite.generate(state.question || state.focus || "", cast, rng);
  }

  window.FatumChinaForm = {
    IDS,
    has,
    get,
    howFor,
    runCast,
    loc,
  };
})();
