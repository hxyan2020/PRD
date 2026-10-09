/**
 * West & Central African oracles — unique steps, cast visuals, and readings.
 * Educational simulations only; not initiatory practice.
 */
(function () {
  "use strict";

  const IDS = [
    "ifa",
    "merindinlogun",
    "obi",
    "afa",
    "benin-fa",
    "sikidy",
    "hakata",
    "ngombo",
    "ilm-al-raml-africa",
    "dlera",
    "benge",
    "giriama",
    "mambila-nggam",
    "dogon-fox",
    "zulu-bones",
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

  const ODU_NAMES = [
    { en: "Ògún-Méjì", zh: "奥贡·梅吉", gloss: { en: "iron · path-clearing", zh: "铁·开路" } },
    { en: "Ọyẹ̀kú-Méjì", zh: "奥耶库·梅吉", gloss: { en: "darkness · rest", zh: "暗·安息" } },
    { en: "Ìwòrì-Méjì", zh: "伊沃里·梅吉", gloss: { en: "insight · conscience", zh: "洞见·良知" } },
    { en: "Òdí-Méjì", zh: "奥迪·梅吉", gloss: { en: "womb · containment", zh: "子宫·收纳" } },
    { en: "Ìrosùn-Méjì", zh: "伊罗孙·梅吉", gloss: { en: "blood · ancestry", zh: "血·祖源" } },
    { en: "Ọ̀wọ́nrín-Méjì", zh: "奥翁林·梅吉", gloss: { en: "sudden change", zh: "骤变" } },
    { en: "Ọ̀bárà-Méjì", zh: "奥巴拉·梅吉", gloss: { en: "speech · reputation", zh: "言语·名声" } },
    { en: "Ọ̀kànrán-Méjì", zh: "奥坎兰·梅吉", gloss: { en: "heart · resolve", zh: "心·决断" } },
  ];

  const GEOMANTIC = [
    { en: "Via (Path)", zh: "道路", bits: "1000" },
    { en: "Populus (Crowd)", zh: "众人", bits: "0000" },
    { en: "Fortuna Major", zh: "大吉", bits: "1101" },
    { en: "Fortuna Minor", zh: "小吉", bits: "1011" },
    { en: "Conjunctio", zh: "会合", bits: "0110" },
    { en: "Carcer", zh: "束缚", bits: "1001" },
    { en: "Acquisitio", zh: "获得", bits: "0101" },
    { en: "Amissio", zh: "失落", bits: "1010" },
  ];

  const HAKATA_FACES = [
    { en: "Old Man", zh: "老者", tone: "caution" },
    { en: "Old Woman", zh: "老妇", tone: "deep" },
    { en: "Young Man", zh: "青年", tone: "bright" },
    { en: "Young Woman", zh: "少女", tone: "mixed" },
  ];

  const OBI_PATTERNS = [
    { code: "AAAA", en: "Aláfíà — peace / yes", zh: "阿拉菲亚——平安／是", tone: "bright" },
    { code: "AAAB", en: "Oyẹ̀kú — watch closely", zh: "奥耶库——需谨慎观察", tone: "caution" },
    { code: "AABB", en: "Ejifẹ́ — firm yes", zh: "埃吉费——坚定的是", tone: "bright" },
    { code: "ABAB", en: "Ejìọ̀kọ̀ — argument / no", zh: "埃吉奥科——争执／否", tone: "caution" },
    { code: "BBBB", en: "Òfún — soft no / rethink", zh: "奥丰——柔和的否／重想", tone: "deep" },
    { code: "ABBB", en: "Òkànrán — heart strain", zh: "奥坎兰——心力吃紧", tone: "mixed" },
  ];

  function loc(obj) {
    if (!obj) return "";
    if (typeof obj === "string") return obj;
    if (isZh()) return obj.zh || obj.en || "";
    return obj.en || obj.zh || "";
  }

  function interpretQ(q, lean, mechanic) {
    const RM = window.FatumResultModel;
    const body = isZh()
      ? `你问的是「${q || "未写明的事"}」。以${mechanic}给出的「${lean}」倾向为镜：先把问题拆成你能动手的一小步，再用日常证据核对——不要把模拟征兆当成外在命令。`
      : `You asked about “${q || "an unnamed matter"}”. Hold the “${lean}” lean from ${mechanic} as a mirror: name one reversible next step you control, then check it against ordinary evidence — do not treat a simulated sign as an external order.`;
    return RM ? RM.interpretWithQuestion(q, body) : body;
  }

  /** Per-rite unique step sequences + cast visuals + generators */
  const RITES = {
    ifa: {
      summary: {
        en: "A babaláwo casts palm nuts or an ọ̀pẹ̀lẹ̀ chain to open one of 256 Odù — verses and prescriptions tied to that figure.",
        zh: "祭司（Babaláwo）抛掷棕榈坚果或欧佩勒链，打开二百五十六种奥杜（Odù）之一——对应口传经文与仪轨处方。",
      },
      how: {
        en: {
          intro: "Ifá is a Yoruba oracular corpus. Here you cast a simulated ọ̀pẹ̀lẹ̀ chain — not a priestly initiation.",
          steps: [
            { title: "Name one matter", body: "Odù speak best to a single clear question." },
            { title: "Bless the chain (symbolically)", body: "Touch the on-screen ọ̀pẹ̀lẹ̀; we mark intention before the cast." },
            { title: "Cast eight half-nuts", body: "Each pair flips open/closed; the binary pattern names an Odù-style figure." },
            { title: "Hear a teaching verse", body: "You get a plain verse, how it mirrors your question, and reflective do / don’t — labeled educational." },
          ],
        },
        zh: {
          intro: "伊法是约鲁巴神谕体系。此处你模拟抛掷欧佩勒链——不是祭司入门。",
          steps: [
            { title: "只问一件事", body: "奥杜最适合回应一个清楚的问题。" },
            { title: "象征性地祝链", body: "轻触屏幕上的欧佩勒；起卦前先标记意图。" },
            { title: "抛出八瓣半果", body: "每对开合翻转；二元格局点出一个奥杜风格的卦名。" },
            { title: "听一句教义诗", body: "你得到白话诗句、对照问题的镜子，以及可做／慎做——并标明为教育用途。" },
          ],
        },
      },
      steps: ["intent", "question", "bless", "cast", "result"],
      viz: "opele",
      castCta: { en: "Cast the ọ̀pẹ̀lẹ̀", zh: "抛掷欧佩勒" },
      generate(q, cast, rng) {
        const odu = pick(rng, ODU_NAMES);
        const name = isZh() ? odu.zh : odu.en;
        const gloss = loc(odu.gloss);
        const verse = isZh()
          ? `奥杜示现「${name}」（${gloss}）。路要清，就先去掉你明知多余的铁刺——再谈远行。`
          : `Odù shows “${name}” (${gloss}). Clear the path by removing the iron splinter you already know is yours — then speak of the journey.`;
        return pack({
          title: name,
          result: isZh() ? `奥杜风格卦象：${name}` : `Odù-style figure: ${name}`,
          explain: verse + " " + (isZh() ? "此为教学模拟，非受训祭司的真实奥杜判定。" : "Teaching simulation — not an initiatory Odù by a trained babaláwo."),
          interpret: interpretQ(q, gloss, isZh() ? "欧佩勒链" : "the ọ̀pẹ̀lẹ̀ cast"),
          details: [
            isZh() ? `开合格局：${(cast.bits || []).join(" ")}` : `Open/closed pairs: ${(cast.bits || []).join(" ")}`,
            isZh() ? `主题：${gloss}` : `Theme: ${gloss}`,
          ],
          doList: [
            isZh() ? "写出一个你能本周完成、且不依赖神谕也应做的清理动作。" : "Write one clearing action you would still do this week without the oracle.",
          ],
          dontList: [
            isZh() ? "不要把模拟奥杜当成必须献祭或改名的命令。" : "Do not treat a simulated Odù as a command to sacrifice or rename yourself.",
          ],
          tone: "deep",
          vizData: cast,
        });
      },
    },

    merindinlogun: {
      summary: {
        en: "Sixteen cowries are cast; the count of mouths-up selects an Odù for interpretation — a priestly cowrie system related to Ifá.",
        zh: "抛掷十六枚贝壳；口朝上的数量对应一种奥杜，再据经文解读——与伊法相关的祭司贝壳体系。",
      },
      how: {
        en: {
          intro: "Mérìndínlógún reads destiny through sixteen cowries. You cast them here as a learning game.",
          steps: [
            { title: "State your ask", body: "Hold one question while the shells settle." },
            { title: "Prepare the cowrie cloth", body: "Sixteen shells rest on the mat before the scatter." },
            { title: "Scatter sixteen cowries", body: "Tap to cast; each shell lands mouth-up or mouth-down." },
            { title: "Count the mouths", body: "The number of open mouths points to an Odù-style counsel line." },
            { title: "Read the count", body: "We explain the count, mirror your question, and offer reflective prompts." },
          ],
        },
        zh: {
          intro: "梅林丁洛贡以十六贝壳读命运。此处作学习性抛掷。",
          steps: [
            { title: "说出你的问题", body: "贝壳落下时只抱定一个问题。" },
            { title: "铺好贝壳垫", body: "十六贝先静置于垫上，再撒。" },
            { title: "撒下十六贝", body: "点按起卦；每枚贝壳口朝上或口朝下。" },
            { title: "数开口", body: "口朝上的数量指向奥杜风格的指引。" },
            { title: "读这个数", body: "我们说明计数、对照你的问题，并给出反思提示。" },
          ],
        },
      },
      steps: ["intent", "question", "scatter", "cast", "result"],
      viz: "cowrie16",
      castCta: { en: "Cast sixteen cowries", zh: "抛十六贝" },
      generate(q, cast, rng) {
        const n = cast.openCount || 0;
        const odu = ODU_NAMES[n % ODU_NAMES.length];
        const name = isZh() ? odu.zh : odu.en;
        const lean = n >= 10 ? (isZh() ? "开阔" : "open") : n <= 5 ? (isZh() ? "收敛" : "contained") : isZh() ? "平衡" : "balanced";
        return pack({
          title: isZh() ? `${n} 口朝上 · ${name}` : `${n} mouths · ${name}`,
          result: isZh() ? `十六贝：${n} 枚口朝上` : `Sixteen cowries: ${n} mouth-up`,
          explain: isZh()
            ? `开口数 ${n} 落在奥杜风格「${name}」一带，倾向「${lean}」。贝壳落点随机；含义是象征教学。`
            : `Count ${n} maps near Odù-style “${name}”, leaning “${lean}”. Shell landings are random; meanings are symbolic teaching.`,
          interpret: interpretQ(q, lean, isZh() ? "十六贝计数" : "the cowrie count"),
          details: [isZh() ? `口朝上：${n} / 16` : `Mouth-up: ${n} / 16`, isZh() ? `关联卦名：${name}` : `Linked figure: ${name}`],
          doList: [isZh() ? `若「${lean}」有共鸣，写下一件与之匹配的具体行为。` : `If “${lean}” resonates, name one concrete behavior that matches it.`],
          dontList: [isZh() ? "不要为求另一个数字而反复重抛同一问题。" : "Do not re-cast the same question hunting a different count."],
          tone: n >= 10 ? "bright" : n <= 5 ? "caution" : "mixed",
          vizData: cast,
        });
      },
    },

    obi: {
      summary: {
        en: "Four kola (or coconut) lobes are cast for yes/no and directional answers — a quick Yoruba/diaspora oracle.",
        zh: "抛掷四瓣柯拉果（或椰子），读取是／否与方位性回答——约鲁巴／离散社群的快捷神谕。",
      },
      how: {
        en: {
          intro: "Obi answers yes/no-style questions with four lobes. Ask something truly binary.",
          steps: [
            { title: "Ask a real yes/no", body: "Avoid stacked questions (“Should I quit and move?”)." },
            { title: "Choose your lobe set", body: "Four pieces — light/dark faces stand in for kola lobes." },
            { title: "Cast the four", body: "Watch the A/B pattern; classic combinations name peace, conflict, or soft no." },
            { title: "Take the lean", body: "We translate the pattern plainly and ask you to notice your reaction." },
          ],
        },
        zh: {
          intro: "柯拉果占用四瓣回答是否题。请问真正的二选一。",
          steps: [
            { title: "问真正的是否题", body: "避免叠加问题（「我该离职并搬家吗？」）。" },
            { title: "选好四瓣", body: "四片明／暗面代替柯拉果瓣。" },
            { title: "抛出四瓣", body: "观察 A/B 格局；经典组合指向平安、争执或柔和的否。" },
            { title: "收下这个倾向", body: "我们白话说明格局，并请你留意自己的反应。" },
          ],
        },
      },
      steps: ["intent", "question", "lobes", "cast", "result"],
      viz: "obi4",
      castCta: { en: "Cast the four lobes", zh: "抛四瓣" },
      generate(q, cast, rng) {
        const pat = cast.pattern || pick(rng, OBI_PATTERNS);
        const title = loc({ en: pat.en, zh: pat.zh });
        return pack({
          title,
          result: isZh() ? `柯拉格局：${pat.code}` : `Obi pattern: ${pat.code}`,
          explain: isZh()
            ? `四瓣示现 ${pat.code} → ${pat.zh}。快捷神谕常给是否倾向；最终仍由你承担选择。`
            : `Four lobes show ${pat.code} → ${pat.en}. Quick oracles lean yes/no; you still own the choice.`,
          interpret: interpretQ(q, title, isZh() ? "柯拉四瓣" : "obi lobes"),
          details: [isZh() ? `瓣面：${pat.code}` : `Faces: ${pat.code}`, title],
          doList: [
            isZh()
              ? `若保留「${title}」，写一个不靠神谕也说得通的可逆下一步。`
              : `If you keep “${title}”, write one reversible next step that still makes sense without the oracle.`,
          ],
          dontList: [isZh() ? "不要因不喜欢答案而连抛同一题。" : "Do not re-ask the same question hoping for the opposite pattern."],
          tone: pat.tone,
          vizData: cast,
        });
      },
    },

    afa: {
      summary: {
        en: "Dibia Afa cast four strings of ugiri half-shells, yielding 256 binary configurations used for diagnosis and counsel.",
        zh: "迪比亚祭司抛掷四串乌吉里半壳，生成二百五十六种二元组合，用于诊断与指引。",
      },
      how: {
        en: {
          intro: "Igba Afa uses four strings of half-shells. Each string contributes a binary digit-set.",
          steps: [
            { title: "Name the trouble", body: "Afa often speaks to illness, conflict, or blocked path — keep it specific." },
            { title: "Prepare four strings", body: "On screen: four chains of half-shells ready to flip." },
            { title: "Cast string by string", body: "Flip each string; together they build a 4× pattern." },
            { title: "Read the configuration", body: "We name a teaching figure and mirror it to your trouble." },
          ],
        },
        zh: {
          intro: "阿法占用四串半壳。每串贡献一组二元信息。",
          steps: [
            { title: "说出困扰", body: "阿法常谈疾病、争执或受阻之路——请尽量具体。" },
            { title: "备好四串", body: "屏幕上四条半壳链待翻转。" },
            { title: "逐串起卦", body: "翻转每一串；合起来构成四行格局。" },
            { title: "读这个配置", body: "我们点出一个教学卦名，并对照你的困扰。" },
          ],
        },
      },
      steps: ["intent", "question", "strings", "cast", "result"],
      viz: "afa4",
      castCta: { en: "Cast the four strings", zh: "抛四串" },
      generate(q, cast, rng) {
        const odu = pick(rng, ODU_NAMES);
        const name = isZh() ? odu.zh : odu.en;
        const rows = cast.rows || ["10", "01", "11", "00"];
        return pack({
          title: name,
          result: isZh() ? `阿法四串格局 → ${name}` : `Afa four-string figure → ${name}`,
          explain: isZh()
            ? `四串示现 ${rows.join(" / ")}，教学上靠近「${name}」。这是伊博阿法精神的模拟，非迪比亚入门仪式。`
            : `Strings show ${rows.join(" / ")}, teaching-near “${name}”. Simulation in Afa spirit — not dibia initiation.`,
          interpret: interpretQ(q, loc(odu.gloss), isZh() ? "阿法四串" : "Afa strings"),
          details: rows.map((r, i) => (isZh() ? `第 ${i + 1} 串：${r}` : `String ${i + 1}: ${r}`)),
          doList: [isZh() ? "把困扰写成一个可观察的症状或关系事实，再决定下一步。" : "Rewrite the trouble as one observable symptom or relationship fact before acting."],
          dontList: [isZh() ? "不要用模拟阿法替代医疗诊断。" : "Do not replace medical diagnosis with simulated Afa."],
          tone: "mixed",
          vizData: cast,
        });
      },
    },

    "benin-fa": {
      summary: {
        en: "Fon Fá is the Dahomey counterpart of Ifá — destiny read through sacred signs and offerings in the Mawu-Lisa cosmos.",
        zh: "丰人法占（Fá）是达荷美对应伊法的体系——在 Mawu-Lisa 宇宙观中通过圣号与供奉读取命运。",
      },
      how: {
        en: {
          intro: "Fon Fá shares kinship with Ifá but speaks in Fon sacred grammar. We simulate a sign-board cast.",
          steps: [
            { title: "Present your petition", body: "Name what you bring before the signs." },
            { title: "Place a token offering", body: "Choose a symbolic offering on screen (water, cola, cloth) — educational only." },
            { title: "Open the Fá sign", body: "A dual-column sign flips into view." },
            { title: "Counsel in Fon spirit", body: "We give a plain reading and reflective guidance — not a Vodun initiation." },
          ],
        },
        zh: {
          intro: "丰人法占与伊法同源而用语不同。我们模拟圣号盘起卦。",
          steps: [
            { title: "呈上你的请求", body: "说出你要带到圣号前的事。" },
            { title: "放一件象征供物", body: "在屏幕上选水、柯拉或布——仅教育象征。" },
            { title: "打开法号", body: "双列圣号翻转显现。" },
            { title: "丰人精神的指引", body: "白话解读与反思建议——不是巫毒入门。" },
          ],
        },
      },
      steps: ["intent", "question", "offering", "cast", "result"],
      viz: "fa-board",
      castCta: { en: "Open the Fá sign", zh: "打开法号" },
      generate(q, cast, rng) {
        const odu = pick(rng, ODU_NAMES);
        const name = isZh() ? odu.zh : odu.en;
        const offer = cast.offering || "water";
        return pack({
          title: name,
          result: isZh() ? `法号：${name}（供物：${offer}）` : `Fá sign: ${name} (offering: ${offer})`,
          explain: isZh()
            ? `在模拟的丰人法占中，圣号靠近「${name}」。供物「${offer}」只作文脉标记，不代表真实献祭。`
            : `In this Fon Fá simulation the sign leans “${name}”. Offering “${offer}” is contextual markup only — not a real sacrifice.`,
          interpret: interpretQ(q, loc(odu.gloss), isZh() ? "丰人法号" : "Fon Fá"),
          details: [isZh() ? `供物标记：${offer}` : `Offering mark: ${offer}`, isZh() ? `圣号：${name}` : `Sign: ${name}`],
          doList: [isZh() ? "若要行动，选一个尊重他人边界的小步骤。" : "If you act, choose a small step that respects others’ boundaries."],
          dontList: [isZh() ? "不要在未受训情况下模仿真实献祭。" : "Do not imitate real sacrificial practice without training and community."],
          tone: "deep",
          vizData: cast,
        });
      },
    },

    sikidy: {
      summary: {
        en: "Malagasy sikidy arranges seeds or beans into geomantic figures to answer questions and prescribe ritual.",
        zh: "马达加斯加西基迪以种子或豆子排布出土占图形，回答问题并开仪轨处方。",
      },
      how: {
        en: {
          intro: "Sikidy builds figures from seed columns. You’ll generate a four-mother grid.",
          steps: [
            { title: "Ask", body: "One question for the seed field." },
            { title: "Sow four mothers", body: "Tap to drop seeds into four columns (odd/even = one/two marks)." },
            { title: "Derive daughters", body: "We combine columns into a teaching geomantic tableau." },
            { title: "Read the tableau", body: "Figure names + how they mirror your ask." },
          ],
        },
        zh: {
          intro: "西基迪由种子列生成图形。你将生成四母盘。",
          steps: [
            { title: "提问", body: "只给种子场一个问题。" },
            { title: "播下四母", body: "点按把种子落入四列（奇／偶＝一／二点）。" },
            { title: "推出四女", body: "我们将列组合为教学用的土占盘。" },
            { title: "读盘", body: "图形之名＋如何对照你的问题。" },
          ],
        },
      },
      steps: ["intent", "question", "sow", "cast", "result"],
      viz: "sikidy",
      castCta: { en: "Sow the seeds", zh: "播下种子" },
      generate(q, cast, rng) {
        const fig = pick(rng, GEOMANTIC);
        const name = loc({ en: fig.en, zh: fig.zh });
        return pack({
          title: name,
          result: isZh() ? `西基迪图形：${name}` : `Sikidy figure: ${name}`,
          explain: isZh()
            ? `种子列 ${JSON.stringify(cast.cols || [])} 教学上落在「${name}」。西基迪传统还会开处方；此处只给反思建议。`
            : `Seed columns ${JSON.stringify(cast.cols || [])} teach toward “${name}”. Living sikidy may prescribe ritual; here we only offer reflection.`,
          interpret: interpretQ(q, name, isZh() ? "西基迪种子盘" : "sikidy seeds"),
          details: (cast.cols || []).map((c, i) => (isZh() ? `母列 ${i + 1}：${c}` : `Mother ${i + 1}: ${c}`)),
          doList: [isZh() ? "把图形主题改写成一个可验证的假设再行动。" : "Rewrite the figure’s theme as a testable hypothesis before acting."],
          dontList: [isZh() ? "不要把教学盘当成必须献祭的处方。" : "Do not treat the teaching tableau as a required sacrifice prescription."],
          tone: /Major|大吉|Acquisitio|获得|Via|道路/.test(name) ? "bright" : /Carcer|束缚|Amissio|失落/.test(name) ? "caution" : "mixed",
          vizData: cast,
        });
      },
    },

    hakata: {
      summary: {
        en: "Four carved tablets (or bones) are thrown; face combinations yield named oracular patterns in southern African traditions.",
        zh: "抛掷四块刻骨／骨牌；正反组合对应南部非洲传统中的具名神谕格局。",
      },
      how: {
        en: {
          intro: "Hakata uses four tablets with named faces. Combinations form the speech.",
          steps: [
            { title: "Frame the question", body: "Often about illness, travel, or household — stay concrete." },
            { title: "Meet the four faces", body: "Old Man, Old Woman, Young Man, Young Woman — each tablet has two sides." },
            { title: "Throw the set", body: "Watch which faces land up." },
            { title: "Name the combination", body: "We read who speaks and how that chorus mirrors you." },
          ],
        },
        zh: {
          intro: "哈卡塔用四块具名骨牌。组合即话语。",
          steps: [
            { title: "框定问题", body: "常关疾病、出行或家事——请具体。" },
            { title: "认识四张脸", body: "老者、老妇、青年、少女——每牌两面。" },
            { title: "抛出一套", body: "看哪些面朝上。" },
            { title: "点名组合", body: "我们读谁在说话，以及这合唱如何对照你。" },
          ],
        },
      },
      steps: ["intent", "question", "faces", "cast", "result"],
      viz: "hakata4",
      castCta: { en: "Throw the tablets", zh: "抛骨牌" },
      generate(q, cast, rng) {
        const up = cast.faces || HAKATA_FACES.map((f) => f);
        const names = up.map((f) => loc({ en: f.en, zh: f.zh }));
        const tone = up[0]?.tone || "mixed";
        return pack({
          title: names.join(" · "),
          result: isZh() ? `朝上面：${names.join("、")}` : `Faces up: ${names.join(", ")}`,
          explain: isZh()
            ? `四牌朝上为 ${names.join("、")}。南部骨牌神谕用「谁出场」说话；此处为教学合唱。`
            : `Tablets show ${names.join(", ")}. Southern bone oracles speak by who appears; this is a teaching chorus.`,
          interpret: interpretQ(q, names[0], isZh() ? "哈卡塔四牌" : "hakata tablets"),
          details: names.map((n, i) => (isZh() ? `牌 ${i + 1}：${n}` : `Tablet ${i + 1}: ${n}`)),
          doList: [isZh() ? "问一位你信任的长辈或同伴同一问题，对照（非服从）神谕。" : "Ask a trusted elder or peer the same question and compare — don’t obey the oracle."],
          dontList: [isZh() ? "不要只用骨牌决定医疗或安全事项。" : "Do not decide medical or safety matters by tablets alone."],
          tone,
          vizData: cast,
        });
      },
    },

    ngombo: {
      summary: {
        en: "Bamana and neighboring diviners cast bones, shells, and objects in basket or sand — configuration diagnoses and guides.",
        zh: "巴马纳及邻近族群在篮中或沙上抛掷骨块、贝壳与杂物——配置用于诊断与指引。",
      },
      how: {
        en: {
          intro: "Ngombo reads a field of mixed objects. You’ll scatter a teaching set into a basket.",
          steps: [
            { title: "Name the imbalance", body: "What feels out of place — body, kin, work?" },
            { title: "Load the basket", body: "Bones, cowries, iron bits — tap to add to the basket." },
            { title: "Shake and cast", body: "Objects scatter; clusters and edges matter." },
            { title: "Map the field", body: "We describe clusters and relate them to your imbalance." },
          ],
        },
        zh: {
          intro: "恩贡博读取混杂物件的场域。你将向篮中撒下一套教学道具。",
          steps: [
            { title: "说出失衡", body: "哪里不对劲——身体、亲属、工作？" },
            { title: "装篮", body: "骨、贝、铁片——点按加入篮中。" },
            { title: "摇散抛出", body: "物件散落；聚簇与边缘都重要。" },
            { title: "绘制场域", body: "我们描述聚簇，并对照你的失衡。" },
          ],
        },
      },
      steps: ["intent", "question", "basket", "cast", "result"],
      viz: "ngombo",
      castCta: { en: "Shake the basket", zh: "摇篮抛出" },
      generate(q, cast, rng) {
        const cluster = cast.cluster || pick(rng, ["center", "edge", "split"]);
        const lean =
          cluster === "center"
            ? isZh()
              ? "收束·守中"
              : "gather · hold center"
            : cluster === "edge"
              ? isZh()
                ? "边缘·外推"
                : "edge · outward"
              : isZh()
                ? "分裂·需选择"
                : "split · choose";
        return pack({
          title: lean,
          result: isZh() ? `篮中格局：${cluster}` : `Basket field: ${cluster}`,
          explain: isZh()
            ? `物件偏向「${cluster}」区，读作「${lean}」。恩贡博用空间说话；此为教学散落。`
            : `Objects lean “${cluster}”, read as “${lean}”. Ngombo speaks spatially; this is a teaching scatter.`,
          interpret: interpretQ(q, lean, isZh() ? "恩贡博篮场" : "ngombo basket"),
          details: [
            isZh() ? `聚簇：${cluster}` : `Cluster: ${cluster}`,
            isZh() ? `物件数：${cast.count || 7}` : `Object count: ${cast.count || 7}`,
          ],
          doList: [isZh() ? "标出生活中与「中心／边缘」对应的真实位置（人、场所、任务）。" : "Mark a real place in your life that matches center vs edge (person, place, task)."],
          dontList: [isZh() ? "不要把散落当成对某人的指控。" : "Do not treat the scatter as an accusation against a person."],
          tone: cluster === "split" ? "caution" : cluster === "center" ? "deep" : "mixed",
          vizData: cast,
        });
      },
    },

    "ilm-al-raml-africa": {
      summary: {
        en: "Sixteen geomantic figures from random marks in sand — Islamic North African science that spread into the Sahel.",
        zh: "由沙上随机痕记导出十六种土占图形——自伊斯兰北非传入萨赫勒的学问。",
      },
      how: {
        en: {
          intro: "Ilm al-raml (sand science) turns random dots into classic geomantic mothers and daughters.",
          steps: [
            { title: "Hold the question", body: "Geomancy likes a focused ask." },
            { title: "Mark the sand", body: "Tap to make four rows of random dots; we reduce odd/even." },
            { title: "Form four mothers", body: "Each row becomes a four-bit mother figure." },
            { title: "Name the figure", body: "A teaching geomantic name + counsel for your ask." },
          ],
        },
        zh: {
          intro: "伊尔姆·拉姆勒（沙土学）把随机点变成经典土占母女卦。",
          steps: [
            { title: "抱定问题", body: "土占喜欢焦点集中的提问。" },
            { title: "在沙上点记", body: "点按生成四行随机点；我们化为奇／偶。" },
            { title: "成四母", body: "每行变成四位母卦。" },
            { title: "点名图形", body: "教学用的土占卦名＋对你问题的建议。" },
          ],
        },
      },
      steps: ["intent", "question", "sand", "cast", "result"],
      viz: "sand",
      castCta: { en: "Mark the sand", zh: "点记沙盘" },
      generate(q, cast, rng) {
        const fig = pick(rng, GEOMANTIC);
        const name = loc({ en: fig.en, zh: fig.zh });
        return pack({
          title: name,
          result: isZh() ? `沙土母卦：${name}` : `Sand mother: ${name}`,
          explain: isZh()
            ? `沙点奇偶成母卦，教学落点「${name}」（${fig.bits}）。拉姆勒是学问传统；此处简化为教育盘。`
            : `Odd/even sand marks form a mother teaching as “${name}” (${fig.bits}). Raml is a scholarly tradition; this is a simplified teaching board.`,
          interpret: interpretQ(q, name, isZh() ? "沙土占" : "sand geomancy"),
          details: [isZh() ? `比特：${fig.bits}` : `Bits: ${fig.bits}`, ...(cast.rows || []).map((r, i) => (isZh() ? `行 ${i + 1}：${r}` : `Row ${i + 1}: ${r}`))],
          doList: [isZh() ? "用一句话把卦名改成你能检验的生活命题。" : "Turn the figure name into one life proposition you can test."],
          dontList: [isZh() ? "不要用沙盘替代法律或财务专业意见。" : "Do not replace legal or financial advice with the sand board."],
          tone: /Major|大吉|Acquisitio|获得/.test(name) ? "bright" : /Carcer|束缚|Amissio|失落/.test(name) ? "caution" : "mixed",
          vizData: cast,
        });
      },
    },

    dlera: {
      summary: {
        en: "Among the Kapsiki/Higi, a crab moves through water, sand, and calabash shards; its path answers the question.",
        zh: "卡普西基／希吉人让蟹在水、沙与葫芦片间移动；其路径回答所问。",
      },
      how: {
        en: {
          intro: "Dlera watches a crab’s path as omen. We simulate a crab crossing a prepared field.",
          steps: [
            { title: "Ask aloud", body: "The crab “hears” one clear question." },
            { title: "Prepare the field", body: "Water · sand · shard zones appear on the board." },
            { title: "Release the crab", body: "Watch the animated path and where it pauses." },
            { title: "Read the path", body: "Zone + pause become the counsel mirror." },
          ],
        },
        zh: {
          intro: "蟹占观察蟹的路径为兆。我们模拟蟹穿越准备好的场地。",
          steps: [
            { title: "大声提问", body: "蟹「听」一个清楚的问题。" },
            { title: "准备场地", body: "水 · 沙 · 葫芦片区域出现在盘上。" },
            { title: "放蟹", body: "看动画路径与停驻之处。" },
            { title: "读路径", body: "区域＋停驻成为指引之镜。" },
          ],
        },
      },
      steps: ["intent", "question", "field", "cast", "result"],
      viz: "crab",
      castCta: { en: "Release the crab", zh: "放蟹" },
      generate(q, cast, rng) {
        const zone = cast.zone || pick(rng, ["water", "sand", "shard"]);
        const lean =
          zone === "water"
            ? isZh()
              ? "流动·需适应"
              : "flow · adapt"
            : zone === "sand"
              ? isZh()
                ? "摩擦·放慢"
                : "friction · slow"
              : isZh()
                ? "锋利·设界"
                : "edge · set boundary";
        return pack({
          title: lean,
          result: isZh() ? `蟹停在「${zone}」区` : `Crab paused in “${zone}”`,
          explain: isZh()
            ? `路径经 ${cast.path || "…"}，停于 ${zone}，读作「${lean}」。真实蟹占依赖活物与场地；此处为动画教学。`
            : `Path via ${cast.path || "…"}, pause in ${zone}, read as “${lean}”. Living dlera uses a real crab; this is animated teaching.`,
          interpret: interpretQ(q, lean, isZh() ? "蟹路径" : "crab path"),
          details: [isZh() ? `停驻区：${zone}` : `Pause zone: ${zone}`, isZh() ? `路径：${cast.path || "—"}` : `Path: ${cast.path || "—"}`],
          doList: [isZh() ? "按停驻区的隐喻，调整本周一个真实节奏（加速／减速／划界）。" : "Match this week’s pace to the pause metaphor (speed up / slow / bound)."],
          dontList: [isZh() ? "不要伤害动物来「验证」神谕。" : "Do not harm animals to “verify” an oracle."],
          tone: zone === "shard" ? "caution" : zone === "water" ? "bright" : "mixed",
          vizData: cast,
        });
      },
    },

    benge: {
      summary: {
        en: "Azande historical poison oracle: a fowl was given a substance; survival or death answered witchcraft questions. This site never simulates harm — only epistemology.",
        zh: "阿赞德历史中的毒谕：曾给禽类施用物品，以存活或死亡回答巫蛊等问题。本站绝不模拟伤害——只作文认识论说明。",
      },
      how: {
        en: {
          intro: "Benge is taught here as history and logic of evidence — never as a live poison trial.",
          steps: [
            { title: "Learn the historical form", body: "Evans-Pritchard described how outcomes were read as answers." },
            { title: "State a binary suspicion", body: "Old benge answered yes/no about misfortune causes — we keep it abstract." },
            { title: "Choose a safe thought-experiment", body: "Two sealed bowls: “affirm” / “deny” — no animals, no toxins." },
            { title: "Reflect on certainty", body: "We discuss how communities trusted procedures — and why you should not recreate harm." },
          ],
        },
        zh: {
          intro: "本格在此作为历史与证据逻辑来教——绝非现场毒试。",
          steps: [
            { title: "了解历史形态", body: "埃文斯-普里查德记述了如何把结果读成答案。" },
            { title: "说出一个二选一的疑虑", body: "旧本格回答灾祸原因的是否——我们保持抽象。" },
            { title: "选安全的思想实验", body: "两个密封碗：「肯定」／「否定」——无动物、无毒物。" },
            { title: "反思确定性", body: "我们讨论社群如何信任程序——以及为何不可再现伤害。" },
          ],
        },
      },
      steps: ["intent", "learn", "question", "bowls", "result"],
      viz: "benge-safe",
      castCta: { en: "Open a sealed bowl", zh: "打开密封碗" },
      generate(q, cast, rng) {
        const ans = cast.answer || (rng() < 0.5 ? "affirm" : "deny");
        const title = ans === "affirm" ? (isZh() ? "程序示「肯定」" : "Procedure leans AFFIRM") : isZh() ? "程序示「否定」" : "Procedure leans DENY";
        return pack({
          title,
          result: title,
          explain: isZh()
            ? `思想实验抽出「${ans === "affirm" ? "肯定" : "否定"}」。历史本格把程序结果当作证据；我们用它提醒：方法会塑造「真相感」——但本站禁止任何伤害模拟。`
            : `Thought-experiment drew “${ans}”. Historical benge treated procedure outcomes as evidence; we use that to show how methods shape a feeling of truth — while forbidding any harm simulation.`,
          interpret: interpretQ(q, title, isZh() ? "安全思想实验" : "the safe thought-experiment"),
          details: [
            isZh() ? "无动物、无毒物、无真实毒谕。" : "No animals, no toxins, no real poison oracle.",
            isZh() ? `抽象结果：${ans}` : `Abstract result: ${ans}`,
          ],
          doList: [
            isZh()
              ? "列出你真正能检验的证据（文件、对话、医疗）来回答疑虑。"
              : "List real evidence you can check (documents, conversations, medicine) for the suspicion.",
          ],
          dontList: [
            isZh() ? "绝不尝试任何毒谕或伤害性「验证」。" : "Never attempt any poison oracle or harmful “verification.”",
          ],
          tone: "caution",
          vizData: cast,
        });
      },
    },

    giriama: {
      summary: {
        en: "Giriama kaya elders and ritual specialists combine spirit diagnosis with community ethics and practical counsel.",
        zh: "吉里亚马卡亚长老与仪式专家结合灵诊与社群伦理、实务建议。",
      },
      how: {
        en: {
          intro: "Giriama counsel is dialogical: spirit diagnosis + elder talk. We simulate a council round.",
          steps: [
            { title: "Choose a domain", body: "Kin · land · work · illness worry — pick one." },
            { title: "Speak to the council", body: "Write what you would tell an elder." },
            { title: "Draw a council token", body: "A token marks the spirit of the reply." },
            { title: "Hear elder-style counsel", body: "Practical + ethical prompts — not possession theater." },
          ],
        },
        zh: {
          intro: "吉里亚马指引是对话式的：灵诊＋长老谈话。我们模拟一轮议事。",
          steps: [
            { title: "选择领域", body: "亲属 · 土地 · 工作 · 病忧——选一个。" },
            { title: "向议事会陈述", body: "写下你会对长老说的话。" },
            { title: "抽取议事信物", body: "信物标记回应的精神。" },
            { title: "听长老风格的建议", body: "务实＋伦理提示——不是附身表演。" },
          ],
        },
      },
      steps: ["intent", "domain", "question", "cast", "result"],
      viz: "council",
      castCta: { en: "Draw a council token", zh: "抽取议事信物" },
      generate(q, cast, rng) {
        const domain = cast.domain || "kin";
        const token = cast.token || pick(rng, ["calm", "repair", "boundary", "patience"]);
        const lean = isZh()
          ? { calm: "静·先听", repair: "修·补关系", boundary: "界·说清", patience: "忍·待时" }[token]
          : { calm: "calm · listen first", repair: "repair · mend ties", boundary: "boundary · speak clear", patience: "patience · wait the beat" }[token];
        return pack({
          title: lean,
          result: isZh() ? `领域 ${domain} · 信物 ${token}` : `Domain ${domain} · token ${token}`,
          explain: isZh()
            ? `议事信物落在「${token}」，领域是「${domain}」。吉里亚马传统重视社群伦理；此处给长老风格的反思句。`
            : `Council token “${token}” in domain “${domain}”. Giriama practice stresses communal ethics; here you get elder-style reflective lines.`,
          interpret: interpretQ(q, lean, isZh() ? "卡亚议事" : "kaya council"),
          details: [isZh() ? `领域：${domain}` : `Domain: ${domain}`, isZh() ? `信物：${token}` : `Token: ${token}`],
          doList: [isZh() ? "与一位当事人做一次短而诚实的对话（若安全）。" : "Have one short honest conversation with a involved person (if safe)."],
          dontList: [isZh() ? "不要用「灵诊」标签去公开羞辱他人。" : "Do not publicly shame someone with a “spirit diagnosis” label."],
          tone: token === "boundary" ? "caution" : token === "repair" ? "bright" : "deep",
          vizData: cast,
        });
      },
    },

    "mambila-nggam": {
      summary: {
        en: "Mambila nggàm lays leaf cards for a spider or crab to disturb; the disturbed pattern is the oracle.",
        zh: "曼比拉 nggàm 为蜘蛛或蟹铺设叶牌；被扰动的图案即为神谕。",
      },
      how: {
        en: {
          intro: "Nggàm reads disruption in a leaf-card field. You’ll lay cards, then simulate a spider pass.",
          steps: [
            { title: "Ask", body: "One question for the leaf field." },
            { title: "Lay the leaf cards", body: "A grid of leaf tokens is placed." },
            { title: "Spider crosses", body: "Watch which cards flip or shift." },
            { title: "Read the disturbance", body: "Moved cards become the symbolic answer set." },
          ],
        },
        zh: {
          intro: "Nggàm 读取叶牌场的扰动。你将铺牌，再模拟蜘蛛经过。",
          steps: [
            { title: "提问", body: "只给叶场一个问题。" },
            { title: "铺叶牌", body: "铺上一网格叶牌。" },
            { title: "蜘蛛经过", body: "看哪些牌翻转或移动。" },
            { title: "读扰动", body: "被移动的牌成为象征答案集。" },
          ],
        },
      },
      steps: ["intent", "question", "lay", "cast", "result"],
      viz: "spider",
      castCta: { en: "Send the spider", zh: "放蜘蛛经过" },
      generate(q, cast, rng) {
        const moved = cast.moved || [2, 5, 7];
        const lean = moved.length >= 4 ? (isZh() ? "大扰动·需重组" : "strong stir · reorganize") : isZh() ? "轻触·微调" : "light touch · fine-tune";
        return pack({
          title: lean,
          result: isZh() ? `被移动叶牌：${moved.join(", ")}` : `Moved leaves: ${moved.join(", ")}`,
          explain: isZh()
            ? `蜘蛛扰动了 ${moved.length} 张叶牌（位置 ${moved.join(", ")}），读作「${lean}」。真实 nggàm 用活物；此处为动画。`
            : `Spider disturbed ${moved.length} leaves (positions ${moved.join(", ")}), read as “${lean}”. Living nggàm uses animals; this is animation.`,
          interpret: interpretQ(q, lean, isZh() ? "叶牌扰动" : "leaf disturbance"),
          details: [isZh() ? `移动数：${moved.length}` : `Moves: ${moved.length}`, isZh() ? `位置：${moved.join(", ")}` : `Positions: ${moved.join(", ")}`],
          doList: [isZh() ? "只调整一件「被扰动」的真实事务，观察一周。" : "Adjust only one real “disturbed” matter and watch for a week."],
          dontList: [isZh() ? "不要用活蜘蛛／蟹做伤害性实验。" : "Do not run harmful experiments with live spiders/crabs."],
          tone: moved.length >= 4 ? "caution" : "mixed",
          vizData: cast,
        });
      },
    },

    "dogon-fox": {
      summary: {
        en: "Dogon diviners read fox tracks across prepared sand fields as cosmic and personal messages.",
        zh: "多贡占师读取整理沙场上的狐狸足迹，作为宇宙与人事讯息。",
      },
      how: {
        en: {
          intro: "Fox-track divination reads prints left overnight on a drawn sand table. We simulate a night path.",
          steps: [
            { title: "Draw the sand table", body: "Sketch zones: village · bush · sky mark." },
            { title: "Leave the question", body: "Write what you ask the night to mark." },
            { title: "Reveal the tracks", body: "Morning: a fox path appears across zones." },
            { title: "Interpret the trail", body: "Which zone was crossed first/last becomes the mirror." },
          ],
        },
        zh: {
          intro: "狐迹占读取沙盘上隔夜留下的足迹。我们模拟一夜路径。",
          steps: [
            { title: "画沙盘", body: "标出区域：村落 · 野地 · 天象标记。" },
            { title: "留下问题", body: "写下你要夜色标记的事。" },
            { title: "揭开足迹", body: "清晨：狐径穿过各区。" },
            { title: "解读足迹", body: "先／后穿过的区域成为镜子。" },
          ],
        },
      },
      steps: ["intent", "table", "question", "cast", "result"],
      viz: "fox",
      castCta: { en: "Reveal the tracks", zh: "揭开足迹" },
      generate(q, cast, rng) {
        const order = cast.order || ["village", "bush", "sky"];
        const lean = isZh()
          ? `先${order[0]} → 后${order[order.length - 1]}`
          : `first ${order[0]} → last ${order[order.length - 1]}`;
        return pack({
          title: lean,
          result: isZh() ? `狐径顺序：${order.join(" → ")}` : `Fox path order: ${order.join(" → ")}`,
          explain: isZh()
            ? `足迹顺序 ${order.join(" → ")}。多贡沙场把宇宙与人事画在同一盘；此处为模拟夜径。`
            : `Track order ${order.join(" → ")}. Dogon sand tables map cosmos and person on one board; this is a simulated night path.`,
          interpret: interpretQ(q, lean, isZh() ? "狐迹顺序" : "fox-track order"),
          details: order.map((z, i) => (isZh() ? `第 ${i + 1} 站：${z}` : `Stop ${i + 1}: ${z}`)),
          doList: [isZh() ? "按「先／后」隐喻安排本周两件真实事务的顺序。" : "Order two real tasks this week by the first/last metaphor."],
          dontList: [isZh() ? "不要惊扰野生动物来制造足迹。" : "Do not disturb wildlife to manufacture tracks."],
          tone: order[0] === "bush" ? "caution" : order[0] === "village" ? "bright" : "deep",
          vizData: cast,
        });
      },
    },

    "zulu-bones": {
      summary: {
        en: "Sangomas cast mixed bones, shells, and objects (amathambo); the configuration diagnoses misfortune and relationships.",
        zh: "桑戈马抛掷混杂骨块、贝壳与物件（amathambo）；配置用于诊断灾厄与关系。",
      },
      how: {
        en: {
          intro: "Amathambo is a mixed-object throw. You’ll cast a sangoma-style teaching set.",
          steps: [
            { title: "Name who is involved", body: "Self · family · rival · ancestor memory — pick the focus person-set." },
            { title: "State the misfortune", body: "What went wrong or feels blocked?" },
            { title: "Cast the bones", body: "Objects scatter with roles (me / other / path / block)." },
            { title: "Diagnose the layout", body: "Relative positions become the relational map." },
          ],
        },
        zh: {
          intro: "阿马坦博是混杂物件抛掷。你将抛一套桑戈马风格的教学道具。",
          steps: [
            { title: "点名涉及谁", body: "自己 · 家人 · 对手 · 祖先记忆——选焦点人群。" },
            { title: "说出灾厄／阻滞", body: "哪里出了错或卡住？" },
            { title: "抛骨", body: "物件散落并带角色（我／他／路／阻）。" },
            { title: "诊断布局", body: "相对位置成为关系地图。" },
          ],
        },
      },
      steps: ["intent", "people", "question", "cast", "result"],
      viz: "amathambo",
      castCta: { en: "Cast the bones", zh: "抛骨" },
      generate(q, cast, rng) {
        const layout = cast.layout || { me: "center", other: "left", path: "open", block: "far" };
        const lean =
          layout.block === "near"
            ? isZh()
              ? "阻滞近·先清障"
              : "block near · clear first"
            : layout.path === "open"
              ? isZh()
                ? "路开·可谈"
                : "path open · talk"
              : isZh()
                ? "关系侧移·需对齐"
                : "relation offset · realign";
        return pack({
          title: lean,
          result: isZh()
            ? `我:${layout.me} · 他:${layout.other} · 路:${layout.path} · 阻:${layout.block}`
            : `me:${layout.me} · other:${layout.other} · path:${layout.path} · block:${layout.block}`,
          explain: isZh()
            ? `骨场示现「${lean}」。阿马坦博用物件角色读关系；此为教学散落，非桑戈马入门。`
            : `Bone field shows “${lean}”. Amathambo reads relationship via object roles; teaching scatter — not sangoma initiation.`,
          interpret: interpretQ(q, lean, isZh() ? "祖鲁骨场" : "amathambo layout"),
          details: Object.entries(layout).map(([k, v]) => `${k}: ${v}`),
          doList: [isZh() ? "只处理「阻滞」对应的一件实事，并告知相关的人你的边界。" : "Handle one real matter matching the “block,” and tell involved people your boundary."],
          dontList: [isZh() ? "不要用骨掷结果公开指认「谁下了咒」。" : "Do not publicly accuse someone of cursing based on a bone throw."],
          tone: layout.block === "near" ? "caution" : "mixed",
          vizData: cast,
        });
      },
    },
  };

  function pack(r) {
    const RM = window.FatumResultModel;
    const base = {
      kind: "africa",
      ...r,
      disclaimer: isZh()
        ? "教育性模拟——不能替代受训祭司／疗愈者实践，也不能替代医疗、法律或安全判断。可能不准确；无法预测黑天鹅事件。"
        : "Educational simulation — not a substitute for trained priestly/healing practice, medicine, law, or safety judgment. May be inaccurate; cannot predict black swan events.",
    };
    return RM ? RM.structuredReading(base) : base;
  }

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
        ? "本站为教育性游玩——不能替代受训入门仪式、医疗、法律或安全判断。"
        : "Educational play on this site — not a substitute for trained initiatory practice, medicine, law, or safety judgment.",
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
    const rng = mulberry32(seedFrom(state.question, state.nonce, id));
    let cast = { ...(state.cast || {}) };

    if (typeof rite.buildCast === "function") {
      cast = Object.assign(cast, rite.buildCast(state, rng) || {});
      return rite.generate(state.question || "", cast, rng);
    }

    switch (rite.viz) {
      case "opele": {
        const bits = [];
        for (let i = 0; i < 8; i++) bits.push(rng() < 0.5 ? "1" : "0");
        cast.bits = bits;
        break;
      }
      case "cowrie16": {
        const shells = [];
        let open = 0;
        for (let i = 0; i < 16; i++) {
          const up = rng() < 0.5;
          shells.push(up ? 1 : 0);
          if (up) open++;
        }
        cast.shells = shells;
        cast.openCount = open;
        break;
      }
      case "obi4": {
        const faces = [0, 1, 2, 3].map(() => (rng() < 0.5 ? "A" : "B"));
        const code = faces.join("");
        cast.faces = faces;
        cast.pattern = OBI_PATTERNS.find((p) => p.code === code) || pick(rng, OBI_PATTERNS);
        cast.patternCode = code;
        break;
      }
      case "afa4": {
        cast.rows = [0, 1, 2, 3].map(() => (rng() < 0.5 ? "1" : "0") + (rng() < 0.5 ? "1" : "0"));
        break;
      }
      case "fa-board": {
        cast.cols = [0, 1].map(() =>
          Array.from({ length: 4 }, () => (rng() < 0.5 ? "1" : "0")).join("")
        );
        cast.offering = state.offering || "water";
        break;
      }
      case "sikidy": {
        cast.cols = [0, 1, 2, 3].map(() => (rng() < 0.5 ? "1" : "2") + (rng() < 0.5 ? "1" : "2"));
        break;
      }
      case "hakata4": {
        cast.faces = HAKATA_FACES.map((f) => {
          const flip = rng() < 0.5;
          return flip ? f : { en: f.en + " (rev)", zh: f.zh + "（背）", tone: f.tone };
        });
        break;
      }
      case "ngombo": {
        cast.count = 5 + Math.floor(rng() * 5);
        cast.cluster = pick(rng, ["center", "edge", "split"]);
        cast.points = Array.from({ length: cast.count }, () => ({
          x: Math.round(rng() * 100),
          y: Math.round(rng() * 100),
        }));
        break;
      }
      case "sand": {
        cast.rows = [0, 1, 2, 3].map(() => {
          const n = 4 + Math.floor(rng() * 9);
          return n % 2 === 0 ? "even" : "odd";
        });
        break;
      }
      case "crab": {
        const zones = ["water", "sand", "shard"];
        const path = [];
        let z = pick(rng, zones);
        path.push(z);
        for (let i = 0; i < 2; i++) {
          z = pick(rng, zones);
          path.push(z);
        }
        cast.path = path.join(" → ");
        cast.zone = path[path.length - 1];
        break;
      }
      case "benge-safe": {
        cast.answer = rng() < 0.5 ? "affirm" : "deny";
        break;
      }
      case "council": {
        cast.domain = state.domain || "kin";
        cast.token = pick(rng, ["calm", "repair", "boundary", "patience"]);
        break;
      }
      case "spider": {
        const n = 2 + Math.floor(rng() * 4);
        const moved = [];
        while (moved.length < n) {
          const x = 1 + Math.floor(rng() * 9);
          if (!moved.includes(x)) moved.push(x);
        }
        cast.moved = moved.sort((a, b) => a - b);
        break;
      }
      case "fox": {
        const zones = ["village", "bush", "sky"];
        const order = zones.slice();
        for (let i = order.length - 1; i > 0; i--) {
          const j = Math.floor(rng() * (i + 1));
          [order[i], order[j]] = [order[j], order[i]];
        }
        cast.order = order;
        break;
      }
      case "amathambo": {
        cast.layout = {
          me: pick(rng, ["center", "left", "right"]),
          other: pick(rng, ["left", "right", "far"]),
          path: pick(rng, ["open", "narrow", "bent"]),
          block: pick(rng, ["near", "far", "none"]),
        };
        cast.people = state.people || "self";
        break;
      }
      default:
        break;
    }

    return rite.generate(state.question || "", cast, rng);
  }


  // Align how-to copy length with play steps (1:1 titles for studio chrome)
  (function alignHowSteps() {
    const LABEL = {
      intent: { en: { title: "Meet the rite", body: "Learn what this oracle traditionally does." }, zh: { title: "认识仪式", body: "了解这个神谕传统上做什么。" } },
      learn: { en: { title: "Learn the historical form", body: "Read how outcomes were historically framed — without recreating harm." }, zh: { title: "了解历史形态", body: "了解历史上如何框定结果——但不再现伤害。" } },
      question: { en: { title: "Hold your question", body: "One clear question works best." }, zh: { title: "抱定问题", body: "一个清楚的问题效果最好。" } },
      bless: { en: { title: "Bless the chain", body: "Touch the ọ̀pẹ̀lẹ̀ to mark intention before casting." }, zh: { title: "祝链", body: "轻触欧佩勒以标记意图，再起卦。" } },
      scatter: { en: { title: "Prepare the cowrie cloth", body: "Sixteen shells rest on the mat before the scatter." }, zh: { title: "铺好贝壳垫", body: "十六贝先静置于垫上，再撒。" } },
      lobes: { en: { title: "Choose your lobe set", body: "Four pieces — light/dark faces stand in for kola lobes." }, zh: { title: "选好四瓣", body: "四片明／暗面代替柯拉果瓣。" } },
      strings: { en: { title: "Prepare four strings", body: "Four chains of half-shells ready to flip." }, zh: { title: "备好四串", body: "四条半壳链待翻转。" } },
      offering: { en: { title: "Place a token offering", body: "Symbolic water, cola, or cloth — educational only." }, zh: { title: "放象征供物", body: "象征性的水、柯拉或布——仅教育用途。" } },
      sow: { en: { title: "Sow four mothers", body: "Drop seeds into four columns (odd/even marks)." }, zh: { title: "播下四母", body: "把种子落入四列（奇／偶点）。" } },
      faces: { en: { title: "Meet the four faces", body: "Old Man, Old Woman, Young Man, Young Woman." }, zh: { title: "认识四张脸", body: "老者、老妇、青年、少女。" } },
      basket: { en: { title: "Load the basket", body: "Bones, cowries, iron bits ready to shake." }, zh: { title: "装篮", body: "骨、贝、铁片待摇散。" } },
      sand: { en: { title: "Mark the sand", body: "Four rows of random dots become odd/even mothers." }, zh: { title: "点记沙盘", body: "四行随机点化为奇／偶母卦。" } },
      field: { en: { title: "Prepare the field", body: "Water · sand · shard zones on the board." }, zh: { title: "准备场地", body: "水 · 沙 · 葫芦片区域。" } },
      bowls: { en: { title: "Open a sealed bowl", body: "Affirm or deny — no animals, no toxins." }, zh: { title: "打开密封碗", body: "肯定或否定——无动物、无毒物。" } },
      domain: { en: { title: "Choose a domain", body: "Kin · land · work · illness worry." }, zh: { title: "选择领域", body: "亲属 · 土地 · 工作 · 病忧。" } },
      people: { en: { title: "Who is involved?", body: "Self · family · rival · ancestor memory." }, zh: { title: "点名涉及谁", body: "自己 · 家人 · 对手 · 祖先记忆。" } },
      lay: { en: { title: "Lay the leaf cards", body: "A grid of leaf tokens is placed." }, zh: { title: "铺叶牌", body: "铺上一网格叶牌。" } },
      table: { en: { title: "Draw the sand table", body: "Zones: village · bush · sky mark." }, zh: { title: "画沙盘", body: "区域：村落 · 野地 · 天象标记。" } },
      cast: { en: { title: "Cast", body: "Watch the interactive stage settle." }, zh: { title: "起卦", body: "观看互动舞台落定。" } },
      result: { en: { title: "Read the counsel", body: "A teaching reading mirrored to your question." }, zh: { title: "读指引", body: "对照你问题的教学解读。" } },
    };
    for (const id of IDS) {
      const rite = RITES[id];
      if (!rite) continue;
      const build = (lang) =>
        rite.steps.map((sid) => {
          const L = LABEL[sid] || LABEL.cast;
          const pack = L[lang] || L.en;
          // Prefer existing how body when same title family
          return { title: pack.title, body: pack.body };
        });
      // Keep intro; replace steps with 1:1 play alignment
      rite.how.en = { intro: rite.how.en.intro, steps: build("en") };
      rite.how.zh = { intro: rite.how.zh.intro, steps: build("zh") };
      // Override cast label with rite castCta
      const ci = rite.steps.indexOf("cast");
      if (ci >= 0) {
        rite.how.en.steps[ci] = { title: rite.castCta.en, body: rite.how.en.steps[ci].body };
        rite.how.zh.steps[ci] = { title: rite.castCta.zh, body: rite.how.zh.steps[ci].body };
      }
      const bi = rite.steps.indexOf("bowls");
      if (bi >= 0) {
        rite.how.en.steps[bi] = { title: rite.castCta.en, body: rite.how.en.steps[bi].body };
        rite.how.zh.steps[bi] = { title: rite.castCta.zh, body: rite.how.zh.steps[bi].body };
      }
    }
  })();

  function register(extraIds, extraRites) {
    (extraIds || []).forEach((id) => {
      if (!IDS.includes(id)) IDS.push(id);
      if (extraRites && extraRites[id]) RITES[id] = extraRites[id];
    });
  }

  window.FatumAfricaOracles = {
    IDS,
    has,
    get,
    howFor,
    summaryFor,
    runCast,
    register,
    loc,
    pick,
    mulberry32,
    seedFrom,
  };
})();
