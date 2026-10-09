/**
 * Classical Chinese oracles — unique steps, visuals, readings.
 * I Ching · Liu Yao · Mei Hua · Qimen · Da/Xiao Liu Ren · Tai Yi ·
 * Ling Qi Jing · Oracle Bones · Kau Chim · Jiaobei · Cezi
 * (Bagua coin hexagram stays on its dedicated guided flow.)
 */
(function () {
  "use strict";

  const IDS = [
    "iching",
    "liuyao",
    "meihua",
    "qimen",
    "daliuren",
    "xiaoliuren",
    "taiyi",
    "lingqijing",
    "oracle-bones",
    "kau-chim",
    "jiaobei",
    "cezi",
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
      kind: "classic",
      ...r,
      disclaimer: isZh()
        ? isHant()
          ? "教育性模擬——不能替代受訓易學／術數實踐，也不能替代醫療、法律或安全判斷。可能不準確；無法預測黑天鵝事件。"
          : "教育性模拟——不能替代受训易学／术数实践，也不能替代医疗、法律或安全判断。可能不准确；无法预测黑天鹅事件。"
        : "Educational simulation — not a substitute for trained Yijing/shushu practice, medicine, law, or safety judgment. May be inaccurate; cannot predict black swan events.",
    };
    return RM ? RM.structuredReading(base) : base;
  }

  function interpretQ(q, lean, mechanic) {
    const RM = window.FatumResultModel;
    const body = isZh()
      ? isHant()
        ? `你問的是「${q || "未寫明的事"}」。以${mechanic}給出的「${lean}」傾向為鏡：先拆成你能動手的一小步，再用日常證據核對——不要把模擬卦象當成外在命令。`
        : `你问的是「${q || "未写明的事"}」。以${mechanic}给出的「${lean}」倾向为镜：先拆成你能动手的一小步，再用日常证据核对——不要把模拟卦象当成外在命令。`
      : `You asked about “${q || "an unnamed matter"}”. Hold the “${lean}” lean from ${mechanic} as a mirror: name one reversible next step you control, then check it against ordinary evidence — do not treat a simulated figure as an external order.`;
    return RM ? RM.interpretWithQuestion(q, body) : body;
  }

  const TRIGRAMS = [
    { bits: "111", en: "Qián ☰", zh: "乾 ☰", lean: { en: "initiate", zh: "开创" } },
    { bits: "000", en: "Kūn ☷", zh: "坤 ☷", lean: { en: "receive", zh: "承载" } },
    { bits: "100", en: "Zhèn ☳", zh: "震 ☳", lean: { en: "awaken", zh: "惊动" } },
    { bits: "011", en: "Xùn ☴", zh: "巽 ☴", lean: { en: "enter gently", zh: "潜入" } },
    { bits: "010", en: "Kǎn ☵", zh: "坎 ☵", lean: { en: "hold sincerity", zh: "守诚" } },
    { bits: "101", en: "Lí ☲", zh: "离 ☲", lean: { en: "clarify", zh: "明照" } },
    { bits: "001", en: "Gèn ☶", zh: "艮 ☶", lean: { en: "stop well", zh: "知止" } },
    { bits: "110", en: "Duì ☱", zh: "兑 ☱", lean: { en: "speak & share", zh: "说悦" } },
  ];

  const DIRECTIONS = [
    { en: "North", zh: "北" },
    { en: "NE", zh: "东北" },
    { en: "East", zh: "东" },
    { en: "SE", zh: "东南" },
    { en: "South", zh: "南" },
    { en: "SW", zh: "西南" },
    { en: "West", zh: "西" },
    { en: "NW", zh: "西北" },
  ];

  const GATES = [
    { en: "Rest gate", zh: "休门", lean: { en: "pause & recover", zh: "休整" } },
    { en: "Life gate", zh: "生门", lean: { en: "grow & begin", zh: "生发" } },
    { en: "Harm gate", zh: "伤门", lean: { en: "cut & compete", zh: "争伤" } },
    { en: "Delusion gate", zh: "杜门", lean: { en: "hide & block", zh: "闭藏" } },
    { en: "Scene gate", zh: "景门", lean: { en: "show & announce", zh: "显扬" } },
    { en: "Death gate", zh: "死门", lean: { en: "end & release", zh: "终结" } },
    { en: "Fear gate", zh: "惊门", lean: { en: "alert & shake", zh: "惊变" } },
    { en: "Open gate", zh: "开门", lean: { en: "open & proceed", zh: "开通" } },
  ];

  const LIUREN = [
    { en: "Great Peace", zh: "大安", lean: { en: "steady yes", zh: "安稳可" } },
    { en: "Retention", zh: "留连", lean: { en: "delay / tangle", zh: "拖延纠缠" } },
    { en: "Quick Joy", zh: "速喜", lean: { en: "swift good news", zh: "喜讯速来" } },
    { en: "Red Mouth", zh: "赤口", lean: { en: "quarrel risk", zh: "口舌之争" } },
    { en: "Small Luck", zh: "小吉", lean: { en: "small favorable", zh: "小有利" } },
    { en: "Emptiness", zh: "空亡", lean: { en: "void / wait", zh: "空亡静待" } },
  ];

  const JIAO_PATTERNS = [
    { code: "sheng", en: "Holy — yes", zh: "圣筊 — 是", tone: "bright" },
    { code: "yin", en: "Negative — no", zh: "阴筊 — 否", tone: "caution" },
    { code: "xiao", en: "Laughing — unclear", zh: "笑筊 — 未明", tone: "mixed" },
  ];

  function randomTrigram(rng) {
    return pick(rng, TRIGRAMS);
  }

  function hexPair(rng) {
    const lower = randomTrigram(rng);
    const upper = randomTrigram(rng);
    return { lower, upper, title: `${loc({ en: upper.en, zh: upper.zh })} / ${loc({ en: lower.en, zh: lower.zh })}` };
  }

  const RITES = {
    iching: {
      summary: {
        en: "The Zhou Yi / I Ching forms one of 64 hexagrams via yarrow stalks (or coins); classic commentaries counsel the query.",
        zh: "周易以蓍草（或铜钱）成六十四卦之一，依经传文辞回答所问。",
      },
      how: {
        en: {
          intro: "Zhou Yi traditionally counts yarrow stalks into a hexagram. Here you simulate a yarrow divide — distinct from the coin Bagua quest.",
          steps: [
            { title: "Meet Zhou Yi", body: "Sixty-four hexagrams · changing lines · Wing commentaries." },
            { title: "Hold one question", body: "The classic asks for a sincere, single inquiry." },
            { title: "Divide the yarrow", body: "Stalks split into teaching piles on screen." },
            { title: "Form the hexagram", body: "Six lines rise from bottom to top." },
            { title: "Read the counsel", body: "Figure + lean mirrored to your question." },
          ],
        },
        zh: {
          intro: "周易传统以蓍草成卦。此处模拟分蓍——与铜钱八卦流程不同。",
          steps: [
            { title: "认识周易", body: "六十四卦 · 变爻 · 十翼文辞。" },
            { title: "只抱一个问题", body: "经典要求诚敬、单一的提问。" },
            { title: "分蓍", body: "蓍草在屏幕上分成教学份。" },
            { title: "成卦", body: "六爻自下而上生成。" },
            { title: "读指引", body: "卦象倾向对照你的问题。" },
          ],
        },
      },
      steps: ["intent", "question", "yarrow", "hexagram", "result"],
      viz: "yarrow",
      castCta: { en: "Form the hexagram", zh: "成卦" },
      buildCast(state, rng) {
        const hex = hexPair(rng);
        const changing = Math.floor(rng() * 6);
        return { ...hex, changing, stalks: 49 - Math.floor(rng() * 8) };
      },
      generate(q, cast) {
        const lean = loc(cast.upper.lean) + " / " + loc(cast.lower.lean);
        return pack({
          title: cast.title,
          result: isZh()
            ? `蓍草卦：${cast.title}（变爻示意第 ${cast.changing + 1} 爻）`
            : `Yarrow hexagram: ${cast.title} (changing hint line ${cast.changing + 1})`,
          explain: isZh()
            ? `教学分蓍得「${cast.title}」，倾向「${lean}」。真蓍法繁复；此处教育映射，不是师传筮法。`
            : `Teaching yarrow yields “${cast.title}”, leaning “${lean}”. Real yarrow procedure is elaborate; educational mapping only.`,
          interpret: interpretQ(q, lean, isZh() ? "周易卦象" : "the Zhou Yi figure"),
          details: [
            isZh() ? `上卦：${loc({ en: cast.upper.en, zh: cast.upper.zh })}` : `Upper: ${cast.upper.en}`,
            isZh() ? `下卦：${loc({ en: cast.lower.en, zh: cast.lower.zh })}` : `Lower: ${cast.lower.en}`,
            isZh() ? `蓍数示意：${cast.stalks}` : `Stalk count mark: ${cast.stalks}`,
          ],
          doList: [
            isZh()
              ? `按「${lean}」写一个本周可逆的下一步。`
              : `Write one reversible weekly step matching “${lean}”.`,
          ],
          dontList: [
            isZh() ? "不要连占同一问题以求改卦。" : "Do not re-cast the same question hunting a different hexagram.",
          ],
          tone: "deep",
          vizData: cast,
        });
      },
    },

    liuyao: {
      summary: {
        en: "Liu Yao / Na Jia links hexagram lines to Earthly Branches and Five Elements for practical timed readings.",
        zh: "六爻纳甲把爻位配地支与五行，用于实务与时机判断。",
      },
      how: {
        en: {
          intro: "Six Lines builds a hexagram then ‘nails’ branches to each line (Na Jia).",
          steps: [
            { title: "Meet Liu Yao", body: "Six lines · branches · elements · world/response." },
            { title: "State the matter", body: "Practical questions fit Liu Yao well." },
            { title: "Cast six lines", body: "Lines light from bottom to top." },
            { title: "Nail the branches", body: "Each line receives a teaching branch tag." },
            { title: "Read the timed counsel", body: "World/response lean for your matter." },
          ],
        },
        zh: {
          intro: "六爻成卦后再纳甲安支。",
          steps: [
            { title: "认识六爻", body: "六爻 · 地支 · 五行 · 世应。" },
            { title: "说出事宜", body: "实务问题较适合六爻。" },
            { title: "装出六爻", body: "爻自下而上点亮。" },
            { title: "纳甲安支", body: "每爻安上教学地支。" },
            { title: "读时机指引", body: "世应倾向对照事宜。" },
          ],
        },
      },
      steps: ["intent", "question", "cast6", "najia", "result"],
      viz: "liuyao",
      castCta: { en: "Nail the branches", zh: "纳甲安支" },
      buildCast(state, rng) {
        const branches = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
        const lines = Array.from({ length: 6 }, (_, i) => ({
          yang: rng() < 0.5,
          branch: branches[Math.floor(rng() * 12)],
          i,
        }));
        const world = Math.floor(rng() * 6);
        const response = (world + 3) % 6;
        return {
          lines,
          world,
          response,
          lean: pick(rng, isZh() ? ["世旺·可进", "应动·看对方", "世衰·宜守", "爻冲·生变"] : ["world strong · advance", "response moves · watch other", "world weak · hold", "clash · change coming"]),
        };
      },
      generate(q, cast) {
        return pack({
          title: cast.lean,
          result: isZh()
            ? `世在第 ${cast.world + 1} 爻 · 应在第 ${cast.response + 1} 爻`
            : `World line ${cast.world + 1} · Response line ${cast.response + 1}`,
          explain: isZh()
            ? `教学六爻纳甲示「${cast.lean}」。真盘需动爻、用神与月日建；此处为结构教育。`
            : `Teaching Liu Yao Na Jia shows “${cast.lean}”. Real charts need moving lines, useful gods, and month/day; structure education here.`,
          interpret: interpretQ(q, cast.lean, isZh() ? "六爻世应" : "Liu Yao world/response"),
          details: (cast.lines || []).map(
            (l, i) =>
              `${i + 1}: ${l.yang ? (isZh() ? "阳" : "yang") : isZh() ? "阴" : "yin"} · ${l.branch}`
          ),
          doList: [
            isZh()
              ? `按「${cast.lean}」调整与对方／时机相关的一步。`
              : `Adjust one step about the other party / timing per “${cast.lean}”.`,
          ],
          dontList: [
            isZh() ? "不要忽略现实证据只盯世应标签。" : "Do not ignore real evidence and stare only at world/response labels.",
          ],
          tone: /守|hold|衰|weak/.test(cast.lean) ? "caution" : "mixed",
          vizData: cast,
        });
      },
    },

    meihua: {
      summary: {
        en: "Mei Hua Yi Shu (Plum Blossom) derives hexagrams from numbers, sights, or moments — Shao Yong’s observational numerology.",
        zh: "梅花易数由数字、见闻或时间起卦——邵雍一系的观物术数。",
      },
      how: {
        en: {
          intro: "Plum Blossom starts from numbers or a noticed moment, not classic yarrow.",
          steps: [
            { title: "Meet Plum Blossom", body: "Number · image · time → hexagram." },
            { title: "Enter seed numbers", body: "Two or three numbers you noticed (teaching)." },
            { title: "Note a sight", body: "Pick a simple image that caught you." },
            { title: "Derive the hexagram", body: "Upper/lower from number math." },
            { title: "Read the image counsel", body: "Figure lean for your focus." },
          ],
        },
        zh: {
          intro: "梅花由数字或见闻起卦，不必蓍草。",
          steps: [
            { title: "认识梅花易数", body: "数 · 象 · 时 → 卦。" },
            { title: "输入种子数", body: "你注意到的两三个数（教学）。" },
            { title: "记下所见", body: "选一个抓住你的简单物象。" },
            { title: "推出卦象", body: "由数术得上下卦。" },
            { title: "读象意指引", body: "卦象倾向对照焦点。" },
          ],
        },
      },
      steps: ["intent", "numbers", "sight", "hexderive", "result"],
      viz: "meihua",
      castCta: { en: "Derive the hexagram", zh: "推出卦象" },
      buildCast(state, rng) {
        const nums = (state.numbers || "3,8,5")
          .split(/[,，\s]+/)
          .map((n) => parseInt(n, 10))
          .filter((n) => !Number.isNaN(n));
        const a = nums[0] || 3;
        const b = nums[1] || 8;
        const upper = TRIGRAMS[a % 8];
        const lower = TRIGRAMS[b % 8];
        const sight = state.sight || pick(rng, isZh() ? ["梅", "风", "人", "鸟"] : ["plum", "wind", "person", "bird"]);
        return {
          nums: [a, b, nums[2] || Math.floor(rng() * 9) + 1],
          upper,
          lower,
          sight,
          title: `${loc({ en: upper.en, zh: upper.zh })} / ${loc({ en: lower.en, zh: lower.zh })}`,
          lean: loc(upper.lean) + " · " + loc(lower.lean),
        };
      },
      generate(q, cast) {
        return pack({
          title: cast.title,
          result: isZh()
            ? `梅花：数 ${cast.nums.join("·")} · 象「${cast.sight}」→ ${cast.title}`
            : `Mei Hua: nums ${cast.nums.join("·")} · sight “${cast.sight}” → ${cast.title}`,
          explain: isZh()
            ? `由种子数与物象「${cast.sight}」推出「${cast.title}」，倾向「${cast.lean}」。梅花重观物；请把象当镜子。`
            : `From seed numbers and sight “${cast.sight}” comes “${cast.title}”, leaning “${cast.lean}”. Plum Blossom prizes observation — use the image as a mirror.`,
          interpret: interpretQ(q || cast.sight, cast.lean, isZh() ? "梅花卦象" : "the Plum Blossom figure"),
          details: [
            isZh() ? `数：${cast.nums.join(", ")}` : `Numbers: ${cast.nums.join(", ")}`,
            isZh() ? `象：${cast.sight}` : `Sight: ${cast.sight}`,
          ],
          doList: [
            isZh()
              ? `把「${cast.sight}」与问题的关联写成一句可验证的假设。`
              : `Write one testable hypothesis linking “${cast.sight}” to your question.`,
          ],
          dontList: [
            isZh() ? "不要为求美卦而篡改所见之数。" : "Do not fudge the numbers you actually noticed to get a prettier figure.",
          ],
          tone: "mixed",
          vizData: cast,
        });
      },
    },

    qimen: {
      summary: {
        en: "Qimen Dunjia casts a directional ‘奇门’ board from the moment of the question for strategy and timing.",
        zh: "奇门遁甲依问事时刻排出九宫奇门盘，用于策略与择时。",
      },
      how: {
        en: {
          intro: "Qimen builds a nine-palace board at the ask-moment. Teaching board only.",
          steps: [
            { title: "Meet Qimen", body: "Nine palaces · gates · stems · stars." },
            { title: "State the strategy ask", body: "Timing, direction, approach." },
            { title: "Mark the moment", body: "We stamp a teaching time token." },
            { title: "Open the Qimen board", body: "A gate lights in a palace." },
            { title: "Read the gate counsel", body: "Gate lean for your strategy." },
          ],
        },
        zh: {
          intro: "奇门在问事时刻排九宫盘。仅教学盘。",
          steps: [
            { title: "认识奇门", body: "九宫 · 八门 · 天干 · 九星。" },
            { title: "说出策略之问", body: "时机、方位、进退。" },
            { title: "标记时刻", body: "盖上教学时辰印。" },
            { title: "打开奇门盘", body: "一门在某宫点亮。" },
            { title: "读门指引", body: "门意倾向对照策略。" },
          ],
        },
      },
      steps: ["intent", "question", "moment", "board", "result"],
      viz: "qimen-board",
      castCta: { en: "Open the Qimen board", zh: "打开奇门盘" },
      buildCast(state, rng) {
        const gate = pick(rng, GATES);
        const dir = pick(rng, DIRECTIONS);
        const palace = 1 + Math.floor(rng() * 9);
        return { gate, dir, palace, lean: loc(gate.lean) };
      },
      generate(q, cast) {
        const gate = loc({ en: cast.gate.en, zh: cast.gate.zh });
        const dir = loc(cast.dir);
        return pack({
          title: `${gate} · ${dir}`,
          result: isZh() ? `第 ${cast.palace} 宫 · ${gate}` : `Palace ${cast.palace} · ${gate}`,
          explain: isZh()
            ? `教学奇门盘示「${gate}」在第 ${cast.palace} 宫（${dir}），倾向「${cast.lean}」。真奇门需节气超接；此处为门盘教育。`
            : `Teaching Qimen shows “${gate}” in palace ${cast.palace} (${dir}), leaning “${cast.lean}”. Real Qimen needs solar-term structure; gate-board education here.`,
          interpret: interpretQ(q, cast.lean, isZh() ? "奇门八门" : "the Qimen gate"),
          details: [
            isZh() ? `宫：${cast.palace}` : `Palace: ${cast.palace}`,
            isZh() ? `门：${gate}` : `Gate: ${gate}`,
            isZh() ? `方：${dir}` : `Direction: ${dir}`,
          ],
          doList: [
            isZh()
              ? `按「${cast.lean}」选一个方向性的小动作（进／退／藏／显）。`
              : `Pick one directional micro-move (advance / retreat / hide / show) matching “${cast.lean}”.`,
          ],
          dontList: [
            isZh() ? "不要用单门决策战争、医疗或违法之事。" : "Do not decide war, medicine, or illegal acts by one gate.",
          ],
          tone: /死|伤|Fear|Harm|Death|惊|争/.test(gate) ? "caution" : "bright",
          vizData: cast,
        });
      },
    },

    daliuren: {
      summary: {
        en: "Da Liu Ren, one of the Three Styles, builds a celestial board from the exact time of the inquiry.",
        zh: "大六壬为三式之一，依问事精确时刻排布天地盘。",
      },
      how: {
        en: {
          intro: "Da Liu Ren courses heaven and earth discs from the ask-time.",
          steps: [
            { title: "Meet Da Liu Ren", body: "Heaven disc · earth disc · four charges." },
            { title: "Pose the inquiry", body: "Clear matter, clear moment." },
            { title: "Build the time board", body: "A teaching disc pair appears." },
            { title: "Course the matter", body: "A noble / messenger line highlights." },
            { title: "Read the course counsel", body: "Lean for your inquiry." },
          ],
        },
        zh: {
          intro: "大六壬依时刻转天地盘。",
          steps: [
            { title: "认识大六壬", body: "天盘 · 地盘 · 四课。" },
            { title: "提出问事", body: "事宜清楚、时刻清楚。" },
            { title: "排布时盘", body: "出现教学天地盘。" },
            { title: "发用课传", body: "贵人／传线点亮。" },
            { title: "读课传指引", body: "倾向对照问事。" },
          ],
        },
      },
      steps: ["intent", "question", "timeboard", "course", "result"],
      viz: "daliuren",
      castCta: { en: "Course the matter", zh: "发用课传" },
      buildCast(state, rng) {
        const leans = isZh()
          ? ["贵人临门·可托", "传出逢空·缓行", "课逆·宜改道", "三传顺·可推进"]
          : ["noble at gate · entrust", "void in course · slow", "reversed lesson · reroute", "smooth triple · advance"];
        return {
          heaven: Math.floor(rng() * 12),
          earth: Math.floor(rng() * 12),
          lean: pick(rng, leans),
        };
      },
      generate(q, cast) {
        return pack({
          title: cast.lean,
          result: isZh()
            ? `天盘位 ${cast.heaven} · 地盘位 ${cast.earth}`
            : `Heaven idx ${cast.heaven} · Earth idx ${cast.earth}`,
          explain: isZh()
            ? `教学大六壬课传倾向「${cast.lean}」。真六壬课式深细；此处为盘局教育。`
            : `Teaching Da Liu Ren courses toward “${cast.lean}”. Real Liu Ren is deep; board education here.`,
          interpret: interpretQ(q, cast.lean, isZh() ? "六壬课传" : "the Liu Ren course"),
          details: [
            isZh() ? `天盘：${cast.heaven}` : `Heaven: ${cast.heaven}`,
            isZh() ? `地盘：${cast.earth}` : `Earth: ${cast.earth}`,
          ],
          doList: [
            isZh()
              ? `把「${cast.lean}」写成一个可核对的人际／流程动作。`
              : `Turn “${cast.lean}” into one checkable people/process action.`,
          ],
          dontList: [
            isZh() ? "不要用教学课传替代法律证据。" : "Do not replace legal evidence with a teaching course.",
          ],
          tone: /缓|void|空|改/.test(cast.lean) ? "caution" : "mixed",
          vizData: cast,
        });
      },
    },

    xiaoliuren: {
      summary: {
        en: "Xiao Liu Ren is a folk hand-counting method for quick yes/no and direction answers.",
        zh: "小六壬是民间手诀速占，用于是否与方位的快捷判断。",
      },
      how: {
        en: {
          intro: "Xiao Liu Ren counts on the hand through six palaces for a quick lean.",
          steps: [
            { title: "Meet Xiao Liu Ren", body: "Six palaces on the fingers." },
            { title: "Ask a quick question", body: "Yes/no or direction works best." },
            { title: "Count on the hand", body: "Tap along the six teaching palaces." },
            { title: "Land on a palace", body: "One of six folk outcomes." },
            { title: "Take the quick counsel", body: "Palace lean for your ask." },
          ],
        },
        zh: {
          intro: "小六壬在手上数过六宫，得快捷倾向。",
          steps: [
            { title: "认识小六壬", body: "指上六宫。" },
            { title: "问一个快捷问题", body: "是否或方位最合适。" },
            { title: "手数六宫", body: "沿教学六宫点按。" },
            { title: "落在一宫", body: "六种民俗结果之一。" },
            { title: "收下快捷指引", body: "宫意对照所问。" },
          ],
        },
      },
      steps: ["intent", "question", "finger", "palace", "result"],
      viz: "xiaoliuren",
      castCta: { en: "Land on a palace", zh: "落定一宫" },
      buildCast(state, rng) {
        const pal = pick(rng, LIUREN);
        return { palace: pal, lean: loc(pal.lean) };
      },
      generate(q, cast) {
        const name = loc({ en: cast.palace.en, zh: cast.palace.zh });
        return pack({
          title: name,
          result: isZh() ? `小六壬：${name}` : `Xiao Liu Ren: ${name}`,
          explain: isZh()
            ? `手诀落在「${name}」，倾向「${cast.lean}」。小六壬是快捷民俗法；重大事请另核。`
            : `Hand-count lands on “${name}”, leaning “${cast.lean}”. Xiao Liu Ren is quick folk method — verify separately for major matters.`,
          interpret: interpretQ(q, cast.lean, isZh() ? "小六壬宫" : "the Xiao Liu Ren palace"),
          details: [name, cast.lean],
          doList: [
            isZh()
              ? `若是快捷倾向，只据此做一个可逆的小决定。`
              : `If you use this quick lean, make only one reversible small decision from it.`,
          ],
          dontList: [
            isZh() ? "不要用手诀替代合同细读。" : "Do not replace reading a contract with a hand-count.",
          ],
          tone: /口舌|quarrel|空亡|void|拖延|delay/.test(cast.lean) ? "caution" : "bright",
          vizData: cast,
        });
      },
    },

    taiyi: {
      summary: {
        en: "Tai Yi Shen Shu is state- and era-level astrology among the Three Styles — cycles of Tai Yi through a cosmic board.",
        zh: "太乙神数属三式，论太乙巡游之国家／时代格局。",
      },
      how: {
        en: {
          intro: "Tai Yi reads grand cycles more than private daily lots. Teaching circle only.",
          steps: [
            { title: "Meet Tai Yi", body: "Era board · Tai Yi count · host/guest." },
            { title: "Enter a birth or era mark", body: "A date seeds the teaching cycle." },
            { title: "Set the era lens", body: "Personal / household / public — pick a scale." },
            { title: "Turn the Tai Yi circle", body: "Tai Yi lands in a teaching sector." },
            { title: "Read the era counsel", body: "Scale lean for your mark." },
          ],
        },
        zh: {
          intro: "太乙多论大周期，而非日常琐占。仅教学圆盘。",
          steps: [
            { title: "认识太乙", body: "岁局 · 太乙计数 · 主客。" },
            { title: "输入出生或年代标记", body: "日期作教学周期种子。" },
            { title: "设定格局尺度", body: "个人／家庭／公共——选一档。" },
            { title: "转动太乙圆盘", body: "太乙落在教学宫位。" },
            { title: "读格局指引", body: "尺度倾向对照标记。" },
          ],
        },
      },
      steps: ["intent", "birth", "era", "circle", "result"],
      viz: "taiyi",
      castCta: { en: "Turn the Tai Yi circle", zh: "转动太乙圆盘" },
      buildCast(state, rng) {
        const eras = [
          { id: "personal", en: "Personal", zh: "个人" },
          { id: "house", en: "Household", zh: "家庭" },
          { id: "public", en: "Public", zh: "公共" },
        ];
        const era = eras.find((e) => e.id === state.era) || eras[0];
        const sector = 1 + Math.floor(rng() * 16);
        const leans = isZh()
          ? ["主胜·宜守成中求进", "客胜·宜观察外部", "和局·宜协调", "变局·宜留余地"]
          : ["host strong · advance within hold", "guest strong · watch outside", "balanced · coordinate", "shifting · leave slack"];
        return { birth: state.birthDate || "", era, sector, lean: pick(rng, leans) };
      },
      generate(q, cast) {
        const era = loc({ en: cast.era.en, zh: cast.era.zh });
        return pack({
          title: isZh() ? `太乙第 ${cast.sector} 局 · ${era}` : `Tai Yi sector ${cast.sector} · ${era}`,
          result: cast.lean,
          explain: isZh()
            ? `教学太乙在「${era}」尺度落第 ${cast.sector} 局，倾向「${cast.lean}」。太乙多论大势；请勿当作私事铁律。`
            : `Teaching Tai Yi on “${era}” scale lands in sector ${cast.sector}, leaning “${cast.lean}”. Tai Yi speaks to large patterns — not private iron law.`,
          interpret: interpretQ(q || cast.birth, cast.lean, isZh() ? "太乙格局" : "the Tai Yi pattern"),
          details: [
            isZh() ? `标记：${cast.birth || "—"}` : `Mark: ${cast.birth || "—"}`,
            isZh() ? `尺度：${era}` : `Scale: ${era}`,
            isZh() ? `局：${cast.sector}` : `Sector: ${cast.sector}`,
          ],
          doList: [
            isZh()
              ? `在「${era}」尺度上只调整一件与「${cast.lean}」相符的事。`
              : `On the “${era}” scale, adjust only one matter matching “${cast.lean}”.`,
          ],
          dontList: [
            isZh() ? "不要用太乙教学盘预测战争细节。" : "Do not forecast war details from a teaching Tai Yi board.",
          ],
          tone: /变|shift|客|guest/.test(cast.lean) ? "caution" : "deep",
          vizData: cast,
        });
      },
    },

    lingqijing: {
      summary: {
        en: "Ling Qi Jing is a Six Dynasties southern board oracle casting tokens into named figures.",
        zh: "灵棋经是六朝南方棋式神谕，投子成象并对照卦辞。",
      },
      how: {
        en: {
          intro: "Ling Qi casts tokens onto a board to form named oracular figures.",
          steps: [
            { title: "Meet Ling Qi Jing", body: "Tokens · board · named figures." },
            { title: "Hold the question", body: "One clear ask." },
            { title: "Place the tokens", body: "Teaching tokens scatter on the board." },
            { title: "Name the figure", body: "A classic figure title appears." },
            { title: "Read the figure counsel", body: "Title lean for your ask." },
          ],
        },
        zh: {
          intro: "灵棋投子于盘，成具名卦象。",
          steps: [
            { title: "认识灵棋经", body: "棋子 · 盘 · 具名卦象。" },
            { title: "抱定问题", body: "一个清楚的提问。" },
            { title: "投放棋子", body: "教学棋子散落盘上。" },
            { title: "点名卦象", body: "出现经典卦名。" },
            { title: "读卦象指引", body: "卦名倾向对照所问。" },
          ],
        },
      },
      steps: ["intent", "question", "tokens", "figure", "result"],
      viz: "lingqi",
      castCta: { en: "Name the figure", zh: "点名卦象" },
      buildCast(state, rng) {
        const figures = isZh()
          ? [
              { t: "大通", l: "路开·可会" },
              { t: "小往", l: "宜小步" },
              { t: "忧厄", l: "先避险" },
              { t: "喜悦", l: "宜分享" },
              { t: "阻隔", l: "暂缓强推" },
            ]
          : [
              { t: "Great Passage", l: "path open · meet" },
              { t: "Small Going", l: "small steps" },
              { t: "Worry", l: "dodge risk first" },
              { t: "Joy", l: "share the good" },
              { t: "Block", l: "ease off forcing" },
            ];
        const fig = pick(rng, figures);
        const tokens = Array.from({ length: 4 }, () => ({
          x: Math.round(rng() * 100),
          y: Math.round(rng() * 100),
        }));
        return { fig, tokens };
      },
      generate(q, cast) {
        return pack({
          title: cast.fig.t,
          result: cast.fig.l,
          explain: isZh()
            ? `灵棋教学象「${cast.fig.t}」，倾向「${cast.fig.l}」。经文传统复杂；此处给白话象意。`
            : `Ling Qi teaching figure “${cast.fig.t}”, leaning “${cast.fig.l}”. Text tradition is complex; plain figure lean here.`,
          interpret: interpretQ(q, cast.fig.l, isZh() ? "灵棋卦象" : "the Ling Qi figure"),
          details: [cast.fig.t, cast.fig.l],
          doList: [
            isZh()
              ? `按「${cast.fig.l}」做一个本周小实验。`
              : `Run one weekly micro-experiment matching “${cast.fig.l}”.`,
          ],
          dontList: [
            isZh() ? "不要把教学象名当成谶纬铁律。" : "Do not treat teaching figure names as prophetic iron law.",
          ],
          tone: /忧|阻|Worry|Block|险/.test(cast.fig.t + cast.fig.l) ? "caution" : "bright",
          vizData: cast,
        });
      },
    },

    "oracle-bones": {
      summary: {
        en: "Shang diviners heated turtle plastrons and ox scapulae; cracks answered royal queries — here a crack-pattern simulation.",
        zh: "商代贞人灼烧龟甲与牛骨，裂纹回答王室问事——此处为裂兆模拟。",
      },
      how: {
        en: {
          intro: "Oracle bones answer by crack shape after heating. Educational crack only — no real burning.",
          steps: [
            { title: "Meet Shang pyromancy", body: "Bone · heat · crack · charge." },
            { title: "Charge the question", body: "What would be carved beside the crack?" },
            { title: "Warm the plastron", body: "Symbolic heat builds on screen." },
            { title: "Read the crack", body: "A teaching crack pattern appears." },
            { title: "Interpret the charge", body: "Crack lean for your charge." },
          ],
        },
        zh: {
          intro: "甲骨以灼裂之形作答。仅教育裂兆——无真实灼烧。",
          steps: [
            { title: "认识商代灼卜", body: "骨 · 灼 · 裂 · 命辞。" },
            { title: "写下命辞", body: "裂旁会刻什么问句？" },
            { title: "温热腹甲", body: "屏幕上象征性升温。" },
            { title: "读取裂纹", body: "出现教学裂兆。" },
            { title: "解释命辞", body: "裂兆倾向对照问句。" },
          ],
        },
      },
      steps: ["intent", "question", "heat", "crack", "result"],
      viz: "oracle-bone",
      castCta: { en: "Read the crack", zh: "读取裂纹" },
      buildCast(state, rng) {
        const patterns = isZh()
          ? [
              { t: "兆顺", l: "顺势可询" },
              { t: "兆折", l: "宜改问法" },
              { t: "兆双", l: "两路并见" },
              { t: "兆晦", l: "信息不足" },
            ]
          : [
              { t: "Smooth omen", l: "ask along the grain" },
              { t: "Broken omen", l: "rephrase the charge" },
              { t: "Double omen", l: "two paths visible" },
              { t: "Dim omen", l: "not enough signal" },
            ];
        return { pattern: pick(rng, patterns), heat: Math.floor(rng() * 40) + 60 };
      },
      generate(q, cast) {
        return pack({
          title: cast.pattern.t,
          result: cast.pattern.l,
          explain: isZh()
            ? `教学裂兆「${cast.pattern.t}」，读作「${cast.pattern.l}」。商代甲骨属王室档案；此处为符号教育，绝无真实伤害。`
            : `Teaching crack “${cast.pattern.t}” reads “${cast.pattern.l}”. Shang bones were royal archives; symbol education only — never real harm.`,
          interpret: interpretQ(q, cast.pattern.l, isZh() ? "甲骨裂兆" : "the oracle-bone crack"),
          details: [
            isZh() ? `裂兆：${cast.pattern.t}` : `Crack: ${cast.pattern.t}`,
            isZh() ? `灼温示意：${cast.heat}` : `Heat mark: ${cast.heat}`,
          ],
          doList: [
            isZh()
              ? `若裂兆示信息不足，先收集一份书面证据再决定。`
              : `If the crack says signal is thin, gather one written evidence piece before deciding.`,
          ],
          dontList: [
            isZh() ? "绝不灼烧真实甲骨或动物骨骼来「复现」。" : "Never heat real oracle bones or animal remains to “recreate” this.",
          ],
          tone: /折|晦|Broken|Dim/.test(cast.pattern.t) ? "caution" : "mixed",
          vizData: cast,
        });
      },
    },

    "kau-chim": {
      summary: {
        en: "Kau Chim / chi chi sticks: a numbered fortune stick is shaken from a cylinder; temple verses match the number.",
        zh: "求签／抽签：摇出筒中一支编号竹签，对照庙签诗作答。",
      },
      how: {
        en: {
          intro: "Shake the cylinder until one stick emerges, then read its verse.",
          steps: [
            { title: "Meet the sticks", body: "Cylinder · numbered lots · verse book." },
            { title: "State your prayer-ask", body: "Temples hear one clear petition." },
            { title: "Shake the cylinder", body: "Sticks rattle on screen." },
            { title: "Draw the stick number", body: "A number locks." },
            { title: "Read the stick verse", body: "Verse lean for your petition." },
          ],
        },
        zh: {
          intro: "摇筒至一支签跃出，再读签诗。",
          steps: [
            { title: "认识签筒", body: "签筒 · 编号签 · 签诗。" },
            { title: "说出祈求", body: "庙中只听一个清楚的请求。" },
            { title: "摇动签筒", body: "签在屏幕上作响。" },
            { title: "抽出签号", body: "号码锁定。" },
            { title: "读签诗", body: "诗意倾向对照祈求。" },
          ],
        },
      },
      steps: ["intent", "question", "cylinder", "stick", "result"],
      viz: "kau-chim",
      castCta: { en: "Draw the stick", zh: "抽出签号" },
      buildCast(state, rng) {
        const n = 1 + Math.floor(rng() * 100);
        const verses = isZh()
          ? [
              "云开见月且前行",
              "静守三旬再答人",
              "贵人侧近宜开口",
              "名利路上慢一步",
            ]
          : [
              "Clouds part — step while the moon is clear",
              "Keep still three weeks before you answer",
              "A helper is near — speak",
              "On the fame road, take one slower step",
            ];
        const ranks = isZh() ? ["上签", "中签", "下签"] : ["upper", "middle", "lower"];
        return { number: n, verse: pick(rng, verses), rank: pick(rng, ranks) };
      },
      generate(q, cast) {
        return pack({
          title: isZh() ? `第 ${cast.number} 签 · ${cast.rank}` : `Stick #${cast.number} · ${cast.rank}`,
          result: cast.verse,
          explain: isZh()
            ? `摇得第 ${cast.number} 签（${cast.rank}）：「${cast.verse}」。签诗各地不同；此处教学诗句供反思。`
            : `Drawn stick #${cast.number} (${cast.rank}): “${cast.verse}”. Temple verses vary; teaching line for reflection.`,
          interpret: interpretQ(q, cast.verse, isZh() ? "签诗" : "the stick verse"),
          details: [
            isZh() ? `签号：${cast.number}` : `Number: ${cast.number}`,
            isZh() ? `等级：${cast.rank}` : `Rank: ${cast.rank}`,
          ],
          doList: [
            isZh()
              ? `把签诗改成一个本周可完成的动作。`
              : `Turn the verse into one action you can finish this week.`,
          ],
          dontList: [
            isZh() ? "不要连摇同一问题直到上签。" : "Do not keep shaking the same question until you get an ‘upper’ stick.",
          ],
          tone: /下|lower|慢|still/.test(cast.rank + cast.verse) ? "caution" : "bright",
          vizData: cast,
        });
      },
    },

    jiaobei: {
      summary: {
        en: "Jiaobei (poe blocks): crescent wooden blocks tossed for holy yes, negative no, or laughing unclear answers.",
        zh: "筊杯（跋杯）抛掷新月形木块，得圣筊（是）、阴筊（否）或笑筊（未明）。",
      },
      how: {
        en: {
          intro: "Toss two crescent blocks for a three-way divine lean.",
          steps: [
            { title: "Meet jiaobei", body: "Two blocks · three outcomes." },
            { title: "Ask a yes/no", body: "Keep it binary, then accept unclear." },
            { title: "Hold the blocks", body: "Crescents ready in hand." },
            { title: "Toss the poe", body: "Watch flat/round faces land." },
            { title: "Read the answer", body: "Holy / negative / laughing." },
          ],
        },
        zh: {
          intro: "抛两块筊杯，得三种神谕倾向。",
          steps: [
            { title: "认识筊杯", body: "两块 · 三种结果。" },
            { title: "问是否题", body: "保持二选一，并接受未明。" },
            { title: "持筊", body: "新月形木块在手。" },
            { title: "抛筊", body: "看平／圆面如何落地。" },
            { title: "读答案", body: "圣／阴／笑。" },
          ],
        },
      },
      steps: ["intent", "question", "blocks", "toss", "result"],
      viz: "jiaobei",
      castCta: { en: "Toss the poe blocks", zh: "抛筊" },
      buildCast(state, rng) {
        const pat = pick(rng, JIAO_PATTERNS);
        const faces = [rng() < 0.5 ? "flat" : "round", rng() < 0.5 ? "flat" : "round"];
        return { pattern: pat, faces };
      },
      generate(q, cast) {
        const title = loc({ en: cast.pattern.en, zh: cast.pattern.zh });
        return pack({
          title,
          result: isZh()
            ? `筊面：${cast.faces.join(" / ")}`
            : `Faces: ${cast.faces.join(" / ")}`,
          explain: isZh()
            ? `抛得「${title}」。圣筊倾向肯定，阴筊否定，笑筊请重问或改问。民俗神谕；请自行负责决定。`
            : `Toss shows “${title}”. Holy leans yes, negative no, laughing means rephrase. Folk oracle — you still own the decision.`,
          interpret: interpretQ(q, title, isZh() ? "筊杯" : "jiaobei"),
          details: [
            isZh() ? `结果：${title}` : `Outcome: ${title}`,
            isZh() ? `面：${cast.faces.join(", ")}` : `Faces: ${cast.faces.join(", ")}`,
          ],
          doList: [
            isZh()
              ? `若是笑筊，把问题改写成更干净的是否句再问一次（只一次）。`
              : `If laughing, rewrite into a cleaner yes/no and ask once more (once only).`,
          ],
          dontList: [
            isZh() ? "不要连抛直到出现你想要的圣筊。" : "Do not keep tossing until you get the holy yes you want.",
          ],
          tone: cast.pattern.tone,
          vizData: cast,
        });
      },
    },

    cezi: {
      summary: {
        en: "Cezi dissects a written Chinese character into components whose meanings answer the question.",
        zh: "测字把书写的汉字拆成部件，以部件之义回答所问。",
      },
      how: {
        en: {
          intro: "Offer a character; we dissect radicals and strokes into counsel.",
          steps: [
            { title: "Meet cezi", body: "Character · radicals · stroke tales." },
            { title: "State the question", body: "What the character should speak to." },
            { title: "Offer a glyph", body: "Type one Chinese character (or we suggest one)." },
            { title: "Dissect the character", body: "Parts separate on screen." },
            { title: "Read the glyph counsel", body: "Part meanings for your ask." },
          ],
        },
        zh: {
          intro: "出示一字；我们拆解部首与笔画成指引。",
          steps: [
            { title: "认识测字", body: "字 · 部首 · 笔意。" },
            { title: "说出问题", body: "这个字要回应什么。" },
            { title: "出示字形", body: "输入一个汉字（或由我们建议）。" },
            { title: "拆字", body: "部件在屏幕上分开。" },
            { title: "读字义指引", body: "部件之义对照所问。" },
          ],
        },
      },
      steps: ["intent", "question", "glyph", "dissect", "result"],
      viz: "cezi",
      castCta: { en: "Dissect the character", zh: "拆字" },
      buildCast(state, rng) {
        const pool = [
          { ch: "安", parts: isZh() ? ["宀 屋", "女 人"] : ["roof", "person"], lean: isZh() ? "先安内" : "secure the inside first" },
          { ch: "困", parts: isZh() ? ["囗 围", "木 阻"] : ["enclosure", "wood block"], lean: isZh() ? "困中求隙" : "find a gap in the bind" },
          { ch: "明", parts: isZh() ? ["日", "月"] : ["sun", "moon"], lean: isZh() ? "双照明见" : "see by two lights" },
          { ch: "武", parts: isZh() ? ["止", "戈"] : ["stop", "spear"], lean: isZh() ? "止戈为武" : "true force stops the spear" },
          { ch: "盼", parts: isZh() ? ["目", "分"] : ["eye", "divide"], lean: isZh() ? "分目细看" : "look by separating views" },
        ];
        const chosen = pool.find((p) => p.ch === state.glyph) || pick(rng, pool);
        return { ...chosen };
      },
      generate(q, cast) {
        return pack({
          title: isZh() ? `测字「${cast.ch}」` : `Cezi “${cast.ch}”`,
          result: cast.lean,
          explain: isZh()
            ? `字「${cast.ch}」拆为 ${cast.parts.join(" · ")}，倾向「${cast.lean}」。测字重联想；请与问题并读，而非断章。`
            : `Character “${cast.ch}” splits into ${cast.parts.join(" · ")}, leaning “${cast.lean}”. Cezi is associative — read with the question, not in isolation.`,
          interpret: interpretQ(q, cast.lean, isZh() ? "测字拆形" : "the dissected character"),
          details: [
            isZh() ? `字：${cast.ch}` : `Glyph: ${cast.ch}`,
            ...(cast.parts || []).map((p) => p),
          ],
          doList: [
            isZh()
              ? `用「${cast.lean}」改写问题中的一个动词为更可执行的动作。`
              : `Rewrite one verb in your question into a more executable action using “${cast.lean}”.`,
          ],
          dontList: [
            isZh() ? "不要为求吉拆而强改字形联想。" : "Do not force glyph associations just to hear good news.",
          ],
          tone: /困|bind|阻/.test(cast.ch + cast.lean) ? "caution" : "mixed",
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
        ? "本站为教育性游玩——不能替代受训易学／术数实践、医疗、法律或安全判断。"
        : "Educational play on this site — not a substitute for trained Yijing/shushu practice, medicine, law, or safety judgment.",
    };
  }

  function runCast(id, state) {
    const rite = RITES[id];
    if (!rite) return null;
    const rng = mulberry32(
      seedFrom(state.question || state.birthDate || state.numbers || state.glyph, state.nonce, id)
    );
    const cast = Object.assign({}, state.cast || {}, rite.buildCast(state, rng) || {});
    return rite.generate(state.question || "", cast, rng);
  }

  window.FatumChinaClassic = {
    IDS,
    has,
    get,
    howFor,
    runCast,
    loc,
  };
})();
