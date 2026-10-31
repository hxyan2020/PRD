/**
 * Modern personality & New Age fate rites — unique steps, visuals, readings.
 * MBTI · Blood Type · Biorhythm · Human Design · Astrocartography · Angel Numbers
 */
(function () {
  "use strict";

  const IDS = [
    "mbti",
    "blood-type",
    "biorhythm",
    "human-design",
    "astrocartography",
    "angel-numbers",
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
      kind: "modernpersonality",
      ...r,
      disclaimer: isZh()
        ? zhText(
            "教育性现代性格／新纪元模拟——不是临床评估、医学诊断或事件预报。可能不准确；无法预测黑天鹅事件。",
            "教育性現代性格／新紀元模擬——不是臨床評估、醫學診斷或事件預報。可能不準確；無法預測黑天鵝事件。"
          )
        : "Educational modern personality / New Age simulation — not a clinical assessment, medical diagnosis, or event forecast. May be inaccurate; cannot predict black swan events.",
    };
    return RM ? RM.structuredReading(base) : base;
  }
  /** One clear paragraph: what the symbol says about the user's focus (single locale). */
  function sayForFocus(focus, symbol, lean, howToUse) {
    const f = focus || (isZh() ? zhText("你未写明的事", "你未寫明的事") : "what you left unnamed");
    const leanClean = String(lean || "").replace(/[。.\s]+$/u, "");
    const howClean = String(howToUse || "").trim();
    if (isZh()) {
      return zhText(
        `你问的是「${f}」。此仪式给出「${symbol}」，核心意思是：${leanClean}。${howClean ? howClean + (howClean.endsWith("。") ? "" : "。") : ""}这不是预报“会怎样”，而是提醒你对照日常证据，改一件你能控制的事。`,
        `你問的是「${f}」。此儀式給出「${symbol}」，核心意思是：${leanClean}。${howClean ? howClean + (howClean.endsWith("。") ? "" : "。") : ""}這不是預報「會怎樣」，而是提醒你對照日常證據，改一件你能控制的事。`
      );
    }
    return `You asked about “${f}”. This rite showed “${symbol}”, which means: ${leanClean}. ${howClean} That is not a forecast of what will happen — it is a prompt to change one thing you control and check ordinary evidence.`;
  }
  function detailLine(labelEn, labelZh, value) {
    if (!value) return "";
    return isZh() ? `${labelZh}：${value}` : `${labelEn}: ${value}`;
  }
  function howPack(en, zh, hant) {
    return { en, zh, hant: hant || zh };
  }
  function stepsHow(enIntro, enSteps, zhIntro, zhSteps, hantIntro, hantSteps) {
    return howPack(
      { intro: enIntro, steps: enSteps.map(([t, b]) => ({ title: t, body: b })) },
      { intro: zhIntro, steps: zhSteps.map(([t, b]) => ({ title: t, body: b })) },
      { intro: hantIntro, steps: hantSteps.map(([t, b]) => ({ title: t, body: b })) }
    );
  }
  function omen(en, zh, leanEn, leanZh, leanHant) {
    return { en, zh, lean: { en: leanEn, zh: leanZh, hant: leanHant || leanZh } };
  }

  const BLOOD = {
    A: omen("Type A · careful planner", "A型 · 谨慎规划", "plan · care for detail", "规划·顾细节", "規劃·顧細節"),
    B: omen("Type B · curious freestyle", "B型 · 好奇自在", "explore · keep one anchor", "探索·留一锚", "探索·留一錨"),
    O: omen("Type O · bold starter", "O型 · 大胆开局", "lead · rest the edge", "带头·收锋芒", "帶頭·收鋒芒"),
    AB: omen("Type AB · dual lens", "AB型 · 双重视角", "bridge · name both needs", "桥梁·点明双需", "橋樑·點明雙需"),
  };

  const HD_TYPES = [
    omen("Manifestor spark", "投射者火花", "inform · then act", "告知·再行动", "告知·再行動"),
    omen("Generator response", "生产者回应", "wait to respond · then work", "等待回应·再投入", "等待回應·再投入"),
    omen("Projector guide", "引导者指引", "wait for invite · then advise", "等待邀请·再建议", "等待邀請·再建議"),
    omen("Reflector moon", "反射者月", "sample · decide slowly", "取样·慢决定", "取樣·慢決定"),
  ];

  const HD_AUTH = [
    omen("Sacral gut yes/no", "荐骨是／否", "body yes · trust the flash", "身体是·信闪感", "身體是·信閃感"),
    omen("Emotional wave", "情绪波", "ride the wave · no snap call", "乘波·勿急决", "乘波·勿急決"),
    omen("Splenic instinct", "脾直觉", "quiet alarm · check safety", "轻警·查安全", "輕警·查安全"),
    omen("Self-projected voice", "自我投射声", "speak to hear yourself", "说出口·听自己", "說出口·聽自己"),
  ];

  const AC_LINES = [
    omen("Sun / MC line", "太阳／中天线", "visibility · public craft", "可见度·公开技艺", "可見度·公開技藝"),
    omen("Moon line", "月亮线", "mood · belonging", "情绪·归属", "情緒·歸屬"),
    omen("Venus line", "金星线", "ease · beauty · bonds", "安适·美·纽带", "安適·美·紐帶"),
    omen("Mars line", "火星线", "drive · spar carefully", "动力·慎冲突", "動力·慎衝突"),
    omen("Saturn line", "土星线", "structure · long work", "结构·长工", "結構·長工"),
  ];

  const ANGELS = [
    omen("111 · fresh start", "111 · 新开端", "begin · one clear seed", "开始·一颗清楚的种", "開始·一顆清楚的種"),
    omen("222 · balance", "222 · 平衡", "pair · steady the middle", "配对·稳住中间", "配對·穩住中間"),
    omen("333 · support", "333 · 支持", "ask help · share the load", "求援·分担", "求援·分擔"),
    omen("444 · foundation", "444 · 根基", "build base · keep routine", "筑基·守节律", "築基·守節律"),
    omen("555 · change", "555 · 变化", "adapt · release one old grip", "适应·松一旧握", "適應·鬆一舊握"),
    omen("777 · insight", "777 · 洞见", "study · trust the quiet cue", "研习·信静提示", "研習·信靜提示"),
    omen("888 · flow", "888 · 流动", "cycle resources · give/receive", "循环资源·给与收", "循環資源·給與收"),
    omen("999 · completion", "999 · 完成", "close a chapter · thank it", "收束一章·致谢", "收束一章·致謝"),
  ];

  function bioPhase(days, cycle) {
    const angle = ((days % cycle) / cycle) * Math.PI * 2;
    const v = Math.sin(angle);
    if (v > 0.5) return { en: "high", zh: "高", hant: "高", v };
    if (v < -0.5) return { en: "low", zh: "低", hant: "低", v };
    return { en: "critical", zh: "临界", hant: "臨界", v };
  }

  function daysSinceBirth(iso) {
    if (!iso) return 0;
    const b = new Date(iso + "T12:00:00");
    if (Number.isNaN(b.getTime())) return 0;
    const now = new Date();
    return Math.max(0, Math.floor((now - b) / 86400000));
  }

  const RITES = {
    mbti: {
      summary: {
        en: "MBTI-inspired preference quiz maps E/I, S/N, T/F, J/P sides into a four-letter pattern and path-style counsel — a self-report mirror, not a clinical test or fate forecast.",
        zh: "MBTI 风格偏好测验把 E/I、S/N、T/F、J/P 整理成四字母类型与路径式指引——自我报告之镜，不是临床测验或命运预报。",
        hant: "MBTI 風格偏好測驗把 E/I、S/N、T/F、J/P 整理成四字母類型與路徑式指引——自我報告之鏡，不是臨床測驗或命運預報。",
      },
      how: stepsHow(
        "You’ll name a focus, answer preference questions, then seal a four-letter type path.",
        [
          ["Meet MBTI Personality Fate", "Four preference pairs · path counsel."],
          ["Name a focus", "Career, love, craft, leadership…"],
          ["Answer preference questions", "E/I · S/N · T/F · J/P."],
          ["Seal the letter type", "Four letters settle."],
          ["Type path reading", "Counsel for your focus."],
        ],
        "你将写下焦点、回答偏好问题，再封存四字母类型路径。",
        [
          ["认识 MBTI 性格命运", "四组偏好 · 路径指引。"],
          ["写下焦点", "事业、感情、创作、领导……"],
          ["回答偏好问题", "E/I · S/N · T/F · J/P。"],
          ["封存字母类型", "四字母安定。"],
          ["类型路径解读", "对照你的焦点。"],
        ],
        "你將寫下焦點、回答偏好問題，再封存四字母類型路徑。",
        [
          ["認識 MBTI 性格命運", "四組偏好 · 路徑指引。"],
          ["寫下焦點", "事業、感情、創作、領導……"],
          ["回答偏好問題", "E/I · S/N · T/F · J/P。"],
          ["封存字母類型", "四字母安定。"],
          ["類型路徑解讀", "對照你的焦點。"],
        ]
      ),
      steps: ["intent", "focusNoteMbti", "dimQuiz", "typeSeal", "result"],
      viz: "mbti",
      castCta: { en: "Seal the letter type", zh: "封存字母类型", hant: "封存字母類型" },
      noteKey: "focus",
      buildCast(state) {
        const G = window.FATE_GUIDED;
        const scored = G?.scoreMbti
          ? G.scoreMbti(state.answers || {})
          : { type: "INFP", score: {}, meta: { title: "Mediator", fate: "", path: "" } };
        return {
          type: scored.type,
          score: scored.score,
          meta: scored.meta,
          focus: state.focus || "",
          _answers: state.answers || {},
        };
      },
      generate(q, cast) {
        const G = window.FATE_GUIDED;
        const focus = cast.focus || q || "";
        const type = cast.type || "????";
        const titleLabel = isZh()
          ? cast.meta?.titleZh || cast.meta?.title || type
          : cast.meta?.title || type;
        const path = isZh() ? cast.meta?.pathZh || cast.meta?.path || "" : cast.meta?.path || "";
        const fate = isZh() ? cast.meta?.fateZh || cast.meta?.fate || "" : cast.meta?.fate || "";
        const score = cast.score || {};
        const result = isZh()
          ? zhText(
              `对照「${focus || "未写焦点"}」：你的偏好类型是 ${type}（${titleLabel}）——用你擅长的一侧做事，并留意相反字母的盲区。`,
              `對照「${focus || "未寫焦點"}」：你的偏好類型是 ${type}（${titleLabel}）——用你擅長的一側做事，並留意相反字母的盲區。`
            )
          : `For “${focus || "your focus"}”: your preference type is ${type} (${titleLabel}) — lean on that side’s strengths, and watch the blind spots of the opposite letters.`;
        const explain = isZh()
          ? zhText(
              `${type} 来自四组多数侧：E/I、S/N、T/F、J/P（计分 E${score.E || 0}/I${score.I || 0}，S${score.S || 0}/N${score.N || 0}，T${score.T || 0}/F${score.F || 0}，J${score.J || 0}/P${score.P || 0}）。${fate} 这是自我报告偏好，不是能力高低或命运判决。`,
              `${type} 來自四組多數側：E/I、S/N、T/F、J/P（計分 E${score.E || 0}/I${score.I || 0}，S${score.S || 0}/N${score.N || 0}，T${score.T || 0}/F${score.F || 0}，J${score.J || 0}/P${score.P || 0}）。${fate} 這是自我報告偏好，不是能力高低或命運判決。`
            )
          : `${type} comes from majority sides on E/I, S/N, T/F, J/P (tallies E${score.E || 0}/I${score.I || 0}, S${score.S || 0}/N${score.N || 0}, T${score.T || 0}/F${score.F || 0}, J${score.J || 0}/P${score.P || 0}). ${fate} This is a self-reported preference pattern, not ability or destiny.`;
        const interpret = sayForFocus(
          focus,
          `${type} · ${titleLabel}`,
          isZh()
            ? zhText(`按 ${titleLabel} 的方式处理「${focus || "此事"}」会更顺；同时补上相反字母容易忽略的一步。`, `按 ${titleLabel} 的方式處理「${focus || "此事"}」會更順；同時補上相反字母容易忽略的一步。`)
            : `handle “${focus || "this"}” in the ${titleLabel} style, and add one step the opposite letters tend to skip.`,
          isZh()
            ? zhText(`下一步可试：${path || "先点名此刻驱动你的字母对。"}`, `下一步可試：${path || "先點名此刻驅動你的字母對。"}`)
            : `Next try: ${path || "name which letter-pair is driving you."} `
        );
        // Prefer guided scorer answers when present
        if (G?.scoreMbti && !cast.meta) {
          const scored = G.scoreMbti(cast._answers || stateAnswersFromCast(cast));
          cast.meta = scored.meta;
          cast.score = scored.score;
          cast.type = scored.type;
        }
        return pack({
          title: `${type} — ${titleLabel}`,
          result,
          explain,
          interpret,
          details: [
            detailLine("Focus", "焦点", focus),
            detailLine("Type", "类型", `${type} · ${titleLabel}`),
            isZh()
              ? zhText(`外向${score.E || 0}/内向${score.I || 0} · 感觉${score.S || 0}/直觉${score.N || 0} · 思考${score.T || 0}/情感${score.F || 0} · 判断${score.J || 0}/感知${score.P || 0}`, `外向${score.E || 0}/內向${score.I || 0} · 感覺${score.S || 0}/直覺${score.N || 0} · 思考${score.T || 0}/情感${score.F || 0} · 判斷${score.J || 0}/感知${score.P || 0}`)
              : `E${score.E || 0}/I${score.I || 0} · S${score.S || 0}/N${score.N || 0} · T${score.T || 0}/F${score.F || 0} · J${score.J || 0}/P${score.P || 0}`,
          ].filter(Boolean),
          doList: [
            path ||
              (isZh()
                ? zhText(`围绕「${focus || "焦点"}」做一件符合 ${titleLabel} 优势的具体事。`, `圍繞「${focus || "焦點"}」做一件符合 ${titleLabel} 優勢的具體事。`)
                : `Do one concrete action on “${focus || "your focus"}” that uses ${titleLabel} strengths.`),
            isZh()
              ? zhText("做选择前，先说出驱动你的字母对（如 J 对 P）。", "做選擇前，先說出驅動你的字母對（如 J 對 P）。")
              : "Before deciding, name which letter-pair is driving you (e.g. J vs P).",
          ],
          dontList: [
            isZh()
              ? zhText("不要用四个字母当招聘、诊断或“注定怎样”的判决。", "不要用四個字母當招聘、診斷或「註定怎樣」的判決。")
              : "Do not use four letters as hiring, diagnosis, or “destined to…” claims.",
            isZh()
              ? zhText(`不要因为类型标签，放弃你在「${focus || "此事"}」上仍能做的下一步。`, `不要因為類型標籤，放棄你在「${focus || "此事"}」上仍能做的下一步。`)
              : `Do not let the type label stop you from taking a next step on “${focus || "this"}”.`,
          ],
          tone: "mixed",
          vizData: cast,
          type,
        });
      },
    },

    "blood-type": {
      summary: {
        en: "Blood-type personality (ketsueki-gata) maps ABO groups onto popular East Asian temperament stereotypes — culturally familiar folklore, not medical personality science.",
        zh: "血型性格（血液型）把 ABO 血型对应东亚流行性情刻板印象——文化民俗，不是医学性格科学。",
        hant: "血型性格（血液型）把 ABO 血型對應東亞流行性情刻板印象——文化民俗，不是醫學性格科學。",
      },
      how: stepsHow(
        "You’ll name a focus, pick A/B/O/AB, then read the folklore lean.",
        [
          ["Meet Blood Type Personality", "ABO · folklore tags."],
          ["Name a focus", "Work, love, self-image…"],
          ["Pick your ABO type", "A · B · O · AB."],
          ["See the stereotype lens", "Pop-culture lean appears."],
          ["Blood-type counsel", "Lean for your focus."],
        ],
        "你将写下焦点、选择 ABO 血型，再读民俗倾向。",
        [
          ["认识血型性格", "ABO · 民俗标签。"],
          ["写下焦点", "工作、感情、自我形象……"],
          ["选择 ABO 血型", "A · B · O · AB。"],
          ["查看刻板印象透镜", "流行文化倾向出现。"],
          ["血型指引", "对照你的焦点。"],
        ],
        "你將寫下焦點、選擇 ABO 血型，再讀民俗傾向。",
        [
          ["認識血型性格", "ABO · 民俗標籤。"],
          ["寫下焦點", "工作、感情、自我形象……"],
          ["選擇 ABO 血型", "A · B · O · AB。"],
          ["查看刻板印象透鏡", "流行文化傾向出現。"],
          ["血型指引", "對照你的焦點。"],
        ]
      ),
      steps: ["intent", "focusNoteBlood", "aboPick", "stereotypeLens", "result"],
      viz: "blood",
      castCta: { en: "Read the blood-type counsel", zh: "读取血型指引", hant: "讀取血型指引" },
      noteKey: "focus",
      buildCast(state) {
        const key = (state.bloodType || "A").toUpperCase();
        const item = BLOOD[key] || BLOOD.A;
        return { item, bloodType: key, focus: state.focus || "", lean: loc(item.lean) };
      },
      generate(q, cast) {
        const n = loc({ en: cast.item.en, zh: cast.item.zh });
        const ask = q || cast.focus || "";
        const result = isZh()
          ? zhText(
              `对照「${ask || "未写焦点"}」：民俗里 ${cast.bloodType} 型常被说成「${cast.lean}」——可当行为提醒，不是验血定性格。`,
              `對照「${ask || "未寫焦點"}」：民俗裡 ${cast.bloodType} 型常被說成「${cast.lean}」——可當行為提醒，不是驗血定性格。`
            )
          : `For “${ask || "your focus"}”: folklore tags type ${cast.bloodType} as “${cast.lean}” — a behavior reminder, not a lab verdict on character.`;
        return pack({
          title: ask ? `${ask} · ${n}` : n,
          result,
          explain: isZh()
            ? zhText(
                `你选了 ABO「${cast.bloodType}」。东亚流行说法把它贴上「${n}」标签，倾向「${cast.lean}」。医学只用 ABO 做输血匹配；性格／命运说法没有可靠证据。`,
                `你選了 ABO「${cast.bloodType}」。東亞流行說法把它貼上「${n}」標籤，傾向「${cast.lean}」。醫學只用 ABO 做輸血匹配；性格／命運說法沒有可靠證據。`
              )
            : `You chose ABO “${cast.bloodType}”. East Asian pop folklore tags it “${n}”, leaning “${cast.lean}”. Medicine uses ABO for transfusion matching; personality/fate claims are unsupported.`,
          interpret: sayForFocus(
            ask,
            n,
            cast.lean,
            isZh()
              ? zhText(`谈「${ask || "此事"}」时，先认一件你已在做的、符合该倾向的行为，再决定要不要加强或收一收。`, `談「${ask || "此事"}」時，先認一件你已在做的、符合該傾向的行為，再決定要不要加強或收一收。`)
              : `On “${ask || "this"}”, first name one behavior you already do that matches the lean, then decide whether to strengthen or soften it. `
          ),
          details: [
            detailLine("Focus", "焦点", ask),
            detailLine("Blood type", "血型", cast.bloodType),
            detailLine("Folklore tag", "民俗标签", n),
          ].filter(Boolean),
          doList: [
            isZh()
              ? zhText(`围绕「${ask || "焦点"}」，按「${cast.lean}」做一件今天能完成的小事。`, `圍繞「${ask || "焦點"}」，按「${cast.lean}」做一件今天能完成的小事。`)
              : `On “${ask || "your focus"}”, do one small today-action matching “${cast.lean}”.`,
            isZh()
              ? zhText("把共鸣写成你自己的习惯，而不是抗原决定论。", "把共鳴寫成你自己的習慣，而不是抗原決定論。")
              : "Translate any resonance into a habit you choose — not antigen determinism.",
          ],
          dontList: [
            isZh()
              ? zhText("不要用血型筛选恋爱、招聘或排斥他人。", "不要用血型篩選戀愛、招聘或排斥他人。")
              : "Do not hire, date, or exclude people by ABO type.",
            isZh()
              ? zhText("不要把民俗标签当成医疗或心理诊断。", "不要把民俗標籤當成醫療或心理診斷。")
              : "Do not treat folklore tags as medical or psychological diagnosis.",
          ],
          tone: "mixed",
          vizData: cast,
        });
      },
    },

    biorhythm: {
      summary: {
        en: "Biorhythm charts claim fixed physical (23-day), emotional (28-day), and intellectual (33-day) sine cycles from birth — repeatedly tested and not predictive beyond chance.",
        zh: "生物节律宣称由出生日起算的生理（23天）、情绪（28天）、智力（33天）正弦周期——反复检验并无优于随机的预测力。",
        hant: "生物節律宣稱由出生日起算的生理（23天）、情緒（28天）、智力（33天）正弦週期——反覆檢驗並無優於隨機的預測力。",
      },
      how: stepsHow(
        "You’ll enter a birth date, dial the three cycles, then read today’s wave lean.",
        [
          ["Meet Biorhythm", "23 · 28 · 33 day waves."],
          ["Enter birth date", "Day zero for the sine claim."],
          ["Dial the three cycles", "Physical · emotional · intellectual."],
          ["Read today’s wave", "High · low · critical labels."],
          ["Biorhythm counsel", "Lean for your focus."],
        ],
        "你将输入出生日、拨动三条周期，再读今日波形倾向。",
        [
          ["认识生物节律", "23 · 28 · 33 天波。"],
          ["输入出生日", "正弦假说的零点。"],
          ["拨动三条周期", "生理 · 情绪 · 智力。"],
          ["读取今日波形", "高 · 低 · 临界标签。"],
          ["生物节律指引", "对照你的焦点。"],
        ],
        "你將輸入出生日、撥動三條週期，再讀今日波形傾向。",
        [
          ["認識生物節律", "23 · 28 · 33 天波。"],
          ["輸入出生日", "正弦假說的零點。"],
          ["撥動三條週期", "生理 · 情緒 · 智力。"],
          ["讀取今日波形", "高 · 低 · 臨界標籤。"],
          ["生物節律指引", "對照你的焦點。"],
        ]
      ),
      steps: ["intent", "birthDateBio", "cycleDial", "waveRead", "result"],
      viz: "bio",
      castCta: { en: "Read today’s wave", zh: "读取今日波形", hant: "讀取今日波形" },
      noteKey: "focus",
      buildCast(state) {
        const days = daysSinceBirth(state.birthDate);
        const phys = bioPhase(days, 23);
        const emo = bioPhase(days, 28);
        const intel = bioPhase(days, 33);
        const leanEn = `P ${phys.en} · E ${emo.en} · I ${intel.en}`;
        const leanZh = `生理${phys.zh}·情绪${emo.zh}·智力${intel.zh}`;
        const leanHant = `生理${phys.hant}·情緒${emo.hant}·智力${intel.hant}`;
        return {
          birthDate: state.birthDate || "",
          focus: state.focus || "",
          days,
          phys,
          emo,
          intel,
          lean: isZh() ? zhText(leanZh, leanHant) : leanEn,
        };
      },
      generate(q, cast) {
        const ask = q || cast.focus || "";
        const title = isZh()
          ? zhText(`生物节律 · 第 ${cast.days} 天`, `生物節律 · 第 ${cast.days} 天`)
          : `Biorhythm · day ${cast.days}`;
        const p = loc({ en: cast.phys.en, zh: cast.phys.zh, hant: cast.phys.hant });
        const e = loc({ en: cast.emo.en, zh: cast.emo.zh, hant: cast.emo.hant });
        const i = loc({ en: cast.intel.en, zh: cast.intel.zh, hant: cast.intel.hant });
        const result = isZh()
          ? zhText(
              `对照「${ask || "今日状态"}」：按出生日起算，今日生理${p}、情绪${e}、智力${i}——可当作息便签，不是科学预报。`,
              `對照「${ask || "今日狀態"}」：按出生日起算，今日生理${p}、情緒${e}、智力${i}——可當作息便簽，不是科學預報。`
            )
          : `For “${ask || "today’s energy"}”: from your birth date, today reads physical ${p}, emotional ${e}, intellectual ${i} — a schedule sticky note, not a scientific forecast.`;
        return pack({
          title: ask ? `${ask} · ${title}` : title,
          result,
          explain: isZh()
            ? zhText(
                `生物节律假说用三条固定正弦：生理23天、情绪28天、智力33天。自 ${cast.birthDate || "出生日"} 起第 ${cast.days} 天，标签为「${cast.lean}」。对照试验并未证明它能预测表现或事件。`,
                `生物節律假說用三條固定正弦：生理23天、情緒28天、智力33天。自 ${cast.birthDate || "出生日"} 起第 ${cast.days} 天，標籤為「${cast.lean}」。對照試驗並未證明它能預測表現或事件。`
              )
            : `Biorhythm claims three fixed sines: physical 23, emotional 28, intellectual 33 days. From ${cast.birthDate || "birth"} that is day ${cast.days}, labeled “${cast.lean}”. Controlled tests have not shown it predicts performance or events.`,
          interpret: sayForFocus(
            ask,
            cast.lean,
            isZh()
              ? zhText(`低或临界时优先休息与复查计划；高时仍用证据核对，别当作“必胜日”。`, `低或臨界時優先休息與複查計劃；高時仍用證據核對，別當作「必勝日」。`)
              : `on low/critical labels, prefer rest and rechecking plans; on high labels, still verify with evidence — not a “guaranteed win” day.`,
            isZh()
              ? zhText(`安排「${ask || "今天"}」时，先看睡眠、日程与身体感受，再决定要不要理会曲线。`, `安排「${ask || "今天"}」時，先看睡眠、日程與身體感受，再決定要不要理會曲線。`)
              : `When planning “${ask || "today"}”, check sleep, schedule, and how you feel first, then decide whether the curve even matters. `
          ),
          details: [
            detailLine("Focus", "焦点", ask),
            detailLine("Birth date", "出生日", cast.birthDate),
            detailLine("Day count", "天数", String(cast.days)),
            detailLine("Waves", "波形", cast.lean),
          ].filter(Boolean),
          doList: [
            isZh()
              ? zhText(`若「${ask || "今天"}」卡住，先做一件恢复体力／情绪的小事，再推进任务。`, `若「${ask || "今天"}」卡住，先做一件恢復體力／情緒的小事，再推進任務。`)
              : `If “${ask || "today"}” feels stuck, do one small recovery action, then push the task.`,
            isZh()
              ? zhText("把临界标签当作复查清单的提醒，而不是停摆命令。", "把臨界標籤當作複查清單的提醒，而不是停擺命令。")
              : "Treat a critical label as a checklist reminder, not a stop order.",
          ],
          dontList: [
            isZh()
              ? zhText("不要用生物节律决定手术、投资或重大风险。", "不要用生物節律決定手術、投資或重大風險。")
              : "Do not schedule surgery, investments, or high-stakes risks by biorhythm.",
            isZh()
              ? zhText("不要因为“高日”就忽略疲劳或安全检查。", "不要因為「高日」就忽略疲勞或安全檢查。")
              : "Do not ignore fatigue or safety checks because a wave looks “high.”",
          ],
          tone: /low|低|critical|临界|臨界/i.test(cast.lean) ? "caution" : "mixed",
          vizData: cast,
        });
      },
    },

    "human-design": {
      summary: {
        en: "Human Design (Ibiza, 1980s) synthesizes astrology, I Ching, Kabbalah, and chakras into Type, Authority, and centers — a modern hybrid map for reflection, not a verified forecast system.",
        zh: "人类图（1980年代伊维萨）叠合占星、易经、卡巴拉与脉轮成类型、内在权威与中心——现代混成图供反思，不是已验证的预报体系。",
        hant: "人類圖（1980年代伊維薩）疊合占星、易經、卡巴拉與脈輪成類型、內在權威與中心——現代混成圖供反思，不是已驗證的預報體系。",
      },
      how: stepsHow(
        "You’ll enter birth data, reveal a teaching Type, then read an Authority cue.",
        [
          ["Meet Human Design", "Type · Authority · centers."],
          ["Enter birth moment", "Date (time optional in this demo)."],
          ["Reveal teaching Type", "Manifestor · Generator · Projector · Reflector."],
          ["Read Authority cue", "How the chart “decides”."],
          ["Human Design counsel", "Lean for your focus."],
        ],
        "你将输入出生信息、揭示教学类型，再读内在权威提示。",
        [
          ["认识人类图", "类型 · 权威 · 中心。"],
          ["输入出生时刻", "日期（本演示时间可选）。"],
          ["揭示教学类型", "投射者 · 生产者 · 引导者 · 反射者。"],
          ["读取权威提示", "图如何“做决定”。"],
          ["人类图指引", "对照你的焦点。"],
        ],
        "你將輸入出生資訊、揭示教學類型，再讀內在權威提示。",
        [
          ["認識人類圖", "類型 · 權威 · 中心。"],
          ["輸入出生時刻", "日期（本演示時間可選）。"],
          ["揭示教學類型", "投射者 · 生產者 · 引導者 · 反射者。"],
          ["讀取權威提示", "圖如何「做決定」。"],
          ["人類圖指引", "對照你的焦點。"],
        ]
      ),
      steps: ["intent", "birthMomentHd", "typeCenter", "authorityCue", "result"],
      viz: "hd",
      castCta: { en: "Read the Authority cue", zh: "读取权威提示", hant: "讀取權威提示" },
      noteKey: "focus",
      buildCast(state, rng) {
        const type = pick(rng, HD_TYPES);
        const auth = pick(rng, HD_AUTH);
        return {
          birthDate: state.birthDate || "",
          focus: state.focus || "",
          type,
          auth,
          lean: loc(auth.lean),
        };
      },
      generate(q, cast) {
        const tn = loc({ en: cast.type.en, zh: cast.type.zh });
        const an = loc({ en: cast.auth.en, zh: cast.auth.zh });
        const ask = q || cast.focus || "";
        const result = isZh()
          ? zhText(
              `对照「${ask || "未写焦点"}」：教学类型是「${tn}」，做决定时可试「${an}」（${cast.lean}）。`,
              `對照「${ask || "未寫焦點"}」：教學類型是「${tn}」，做決定時可試「${an}」（${cast.lean}）。`
            )
          : `For “${ask || "your focus"}”: teaching Type is “${tn}”; try deciding with “${an}” (${cast.lean}).`;
        return pack({
          title: ask ? `${ask} · ${tn}` : tn,
          result,
          explain: isZh()
            ? zhText(
                `人类图把占星／易经等叠成类型与内在权威。本次示「${tn}」+「${an}」，倾向「${cast.lean}」。这是1980年代混成象征图，不是已验证的天文或医学预报。`,
                `人類圖把占星／易經等疊成類型與內在權威。本次示「${tn}」+「${an}」，傾向「${cast.lean}」。這是1980年代混成象徵圖，不是已驗證的天文或醫學預報。`
              )
            : `Human Design stacks astrology/I Ching-style ideas into Type and Authority. This demo shows “${tn}” + “${an}”, leaning “${cast.lean}”. It is a 1980s hybrid symbol map, not a verified astronomical or medical forecast.`,
          interpret: sayForFocus(
            ask,
            `${tn} · ${an}`,
            cast.lean,
            isZh()
              ? zhText(`处理「${ask || "此事"}」时，先按该权威方式做一次小决定，再写下身体／情绪反应是否更清楚。`, `處理「${ask || "此事"}」時，先按該權威方式做一次小決定，再寫下身體／情緒反應是否更清楚。`)
              : `On “${ask || "this"}”, make one small decision the Authority way, then note whether body/mood felt clearer. `
          ),
          details: [
            detailLine("Focus", "焦点", ask),
            detailLine("Birth date", "出生日", cast.birthDate),
            detailLine("Type", "类型", tn),
            detailLine("Authority", "权威", an),
          ].filter(Boolean),
          doList: [
            isZh()
              ? zhText(`用「${cast.lean}」为「${ask || "焦点"}」试一次可逆的小决定。`, `用「${cast.lean}」為「${ask || "焦點"}」試一次可逆的小決定。`)
              : `Try one reversible mini-decision on “${ask || "your focus"}” with “${cast.lean}”.`,
            isZh()
              ? zhText("把体感记下来，和下次匆忙决定时对比。", "把體感記下來，和下次匆忙決定時對比。")
              : "Write down the body-feel and compare it to your next rushed decision.",
          ],
          dontList: [
            isZh()
              ? zhText("不要用人类图否定他人价值或回避责任。", "不要用人類圖否定他人價值或迴避責任。")
              : "Do not use Human Design to deny others’ worth or dodge responsibility.",
            isZh()
              ? zhText("不要把类型标签当成不能改变现状的借口。", "不要把類型標籤當成不能改變現狀的藉口。")
              : "Do not use a Type label as an excuse to leave a situation unchanged.",
          ],
          tone: "mixed",
          vizData: cast,
        });
      },
    },

    astrocartography: {
      summary: {
        en: "Astrocartography (Jim Lewis) projects natal planet lines onto Earth maps for place themes — a modern relocation astrology tool for reflection, not a guarantee about cities.",
        zh: "星图地理（吉姆·刘易斯）把本命行星线投射到地球地图论地点主题——现代迁居占星反思工具，不是对城市的保证。",
        hant: "星圖地理（吉姆·劉易斯）把本命行星線投射到地球地圖論地點主題——現代遷居占星反思工具，不是對城市的保證。",
      },
      how: stepsHow(
        "You’ll enter birth data, cast a teaching planet line, then name a place focus.",
        [
          ["Meet Astrocartography", "Natal lines on the map."],
          ["Enter birth moment", "Date for the teaching chart."],
          ["Cast a planet line", "Sun · Moon · Venus · Mars · Saturn."],
          ["Name a place focus", "City, region, or move question."],
          ["Map-line counsel", "Lean for that place."],
        ],
        "你将输入出生信息、投射教学行星线，再写下地点焦点。",
        [
          ["认识星图地理", "本命线落在地图上。"],
          ["输入出生时刻", "教学盘用的日期。"],
          ["投射行星线", "日 · 月 · 金 · 火 · 土。"],
          ["写下地点焦点", "城市、地区或搬迁问题。"],
          ["地图线指引", "对照该地点。"],
        ],
        "你將輸入出生資訊、投射教學行星線，再寫下地點焦點。",
        [
          ["認識星圖地理", "本命線落在地圖上。"],
          ["輸入出生時刻", "教學盤用的日期。"],
          ["投射行星線", "日 · 月 · 金 · 火 · 土。"],
          ["寫下地點焦點", "城市、地區或搬遷問題。"],
          ["地圖線指引", "對照該地點。"],
        ]
      ),
      steps: ["intent", "birthMomentAc", "mapLine", "placeFocus", "result"],
      viz: "ac",
      castCta: { en: "Read the map-line counsel", zh: "读取地图线指引", hant: "讀取地圖線指引" },
      noteKey: "placeFocus",
      buildCast(state, rng) {
        const item = pick(rng, AC_LINES);
        return {
          birthDate: state.birthDate || "",
          placeFocus: state.placeFocus || state.focus || "",
          item,
          lean: loc(item.lean),
        };
      },
      generate(q, cast) {
        const n = loc({ en: cast.item.en, zh: cast.item.zh });
        const ask = cast.placeFocus || q || "";
        const result = isZh()
          ? zhText(
              `对照地点「${ask || "未写地点"}」：教学线是「${n}」，主题是「${cast.lean}」——先当氛围提示，再核对真实生活条件。`,
              `對照地點「${ask || "未寫地點"}」：教學線是「${n}」，主題是「${cast.lean}」——先當氛圍提示，再核對真實生活條件。`
            )
          : `For place “${ask || "unnamed"}”: teaching line “${n}” themes “${cast.lean}” — treat it as mood hint, then check real living conditions.`;
        return pack({
          title: ask ? `${ask} · ${n}` : n,
          result,
          explain: isZh()
            ? zhText(
                `星图地理把本命行星投射成地球上的线。本次示「${n}」，倾向「${cast.lean}」。它谈的是地点氛围主题，不能保证搬到那里就会怎样。`,
                `星圖地理把本命行星投射成地球上的線。本次示「${n}」，傾向「${cast.lean}」。它談的是地點氛圍主題，不能保證搬到那裡就會怎樣。`
              )
            : `Astrocartography projects natal planets as lines on Earth. This demo shows “${n}”, leaning “${cast.lean}”. It speaks to place atmosphere themes — not a guarantee of what happens if you move there.`,
          interpret: sayForFocus(
            ask,
            n,
            cast.lean,
            isZh()
              ? zhText(`若认真考虑「${ask || "该地"}」，先列出成本、人脉、工作／签证、日常节奏四条事实，再看主题是否仍有帮助。`, `若認真考慮「${ask || "該地"}」，先列出成本、人脈、工作／簽證、日常節奏四條事實，再看主題是否仍有幫助。`)
              : `If you are seriously weighing “${ask || "that place"}”, list four facts first (cost, people, work/visa, daily pace), then see if the theme still helps. `
          ),
          details: [
            detailLine("Place focus", "地点焦点", ask),
            detailLine("Birth date", "出生日", cast.birthDate),
            detailLine("Planet line", "行星线", n),
            detailLine("Theme", "主题", cast.lean),
          ].filter(Boolean),
          doList: [
            isZh()
              ? zhText(`为「${ask || "该地"}」写三条可查证的生活证据，再决定要不要深挖。`, `為「${ask || "該地"}」寫三條可查證的生活證據，再決定要不要深挖。`)
              : `Write three verifiable living facts about “${ask || "that place"}” before digging deeper.`,
            isZh()
              ? zhText(`若主题「${cast.lean}」有共鸣，把它翻译成一个可试验的小安排（短住、拜访、远程合作）。`, `若主題「${cast.lean}」有共鳴，把它翻譯成一個可試驗的小安排（短住、拜訪、遠程合作）。`)
              : `If “${cast.lean}” resonates, turn it into a small trial (short stay, visit, remote collab).`,
          ],
          dontList: [
            isZh()
              ? zhText("不要仅凭行星线搬家、买房或断绝关系。", "不要僅憑行星線搬家、買房或斷絕關係。")
              : "Do not move, buy property, or end ties on a planet line alone.",
            isZh()
              ? zhText("不要把地图线当成工作机会或签证的保证。", "不要把地圖線當成工作機會或簽證的保證。")
              : "Do not treat a map line as a job or visa guarantee.",
          ],
          tone: /mars|火|spar|慎/i.test(n + cast.lean) ? "caution" : "mixed",
          vizData: cast,
        });
      },
    },

    "angel-numbers": {
      summary: {
        en: "Angel numbers read repeating digit sequences (111, 444…) as New Age “messages” — pattern-seeking play; meaning is assigned by the reader, not transmitted by mathematics.",
        zh: "天使数字把重复数字序列（111、444…）读作新纪元“讯息”——模式寻求式游玩；意义由解读者赋予，并非数学本身传递。",
        hant: "天使數字把重複數字序列（111、444…）讀作新紀元「訊息」——模式尋求式遊玩；意義由解讀者賦予，並非數學本身傳遞。",
      },
      how: stepsHow(
        "You’ll note where you saw a number, spin a teaching sequence, then decode the message lean.",
        [
          ["Meet Angel Numbers", "Repeating digits as cues."],
          ["Note the sighting", "Clock, receipt, plate…"],
          ["Spin a teaching sequence", "111–999 style patterns."],
          ["Decode the message", "Start · balance · change…"],
          ["Angel-number counsel", "Lean for your note."],
        ],
        "你将记录看见数字的场合、转动教学序列，再解码讯息倾向。",
        [
          ["认识天使数字", "重复数字作提示。"],
          ["记录看见场合", "时钟、收据、车牌……"],
          ["转动教学序列", "111–999 式图案。"],
          ["解码讯息", "开始 · 平衡 · 变化……"],
          ["天使数字指引", "对照你的笔记。"],
        ],
        "你將記錄看見數字的場合、轉動教學序列，再解碼訊息傾向。",
        [
          ["認識天使數字", "重複數字作提示。"],
          ["記錄看見場合", "時鐘、收據、車牌……"],
          ["轉動教學序列", "111–999 式圖案。"],
          ["解碼訊息", "開始 · 平衡 · 變化……"],
          ["天使數字指引", "對照你的筆記。"],
        ]
      ),
      steps: ["intent", "sightingNote", "numberSpin", "messageDecode", "result"],
      viz: "angel",
      castCta: { en: "Decode the angel number", zh: "解码天使数字", hant: "解碼天使數字" },
      noteKey: "sighting",
      buildCast(state, rng) {
        const item = pick(rng, ANGELS);
        return {
          sighting: state.sighting || state.focus || "",
          item,
          lean: loc(item.lean),
        };
      },
      generate(q, cast) {
        const n = loc({ en: cast.item.en, zh: cast.item.zh });
        const ask = cast.sighting || q || "";
        const result = isZh()
          ? zhText(
              `你在「${ask || "某处"}」看见重复数字；教学序列「${n}」提醒：${cast.lean}——意义是你给的，不是宇宙发令。`,
              `你在「${ask || "某處"}」看見重複數字；教學序列「${n}」提醒：${cast.lean}——意義是你給的，不是宇宙發令。`
            )
          : `You noted digits at “${ask || "somewhere"}”; teaching sequence “${n}” cues: ${cast.lean} — meaning you assign, not a cosmic order.`;
        return pack({
          title: ask ? `${ask} · ${n}` : n,
          result,
          explain: isZh()
            ? zhText(
                `天使数字把 111、222 等重复序列读成“讯息”。本次示「${n}」，倾向「${cast.lean}」。重复数字在日常生活中很常见；数学本身不会传递命运指令。`,
                `天使數字把 111、222 等重複序列讀成「訊息」。本次示「${n}」，傾向「${cast.lean}」。重複數字在日常生活中很常見；數學本身不會傳遞命運指令。`
              )
            : `Angel numbers treat repeating sequences like 111 or 222 as “messages.” This demo shows “${n}”, leaning “${cast.lean}”. Repeating digits are common in daily life; mathematics itself does not send fate commands.`,
          interpret: sayForFocus(
            ask,
            n,
            cast.lean,
            isZh()
              ? zhText(`先做一件符合该提醒的具体小事；若做完仍想找数字“批准”，留意你其实在回避哪一个决定。`, `先做一件符合該提醒的具體小事；若做完仍想找數字「批准」，留意你其實在迴避哪一個決定。`)
              : `Do one concrete small action that matches the cue; if you still want a number’s “permission,” notice which decision you are avoiding. `
          ),
          details: [
            detailLine("Sighting", "看见场合", ask),
            detailLine("Sequence", "序列", n),
            detailLine("Cue", "提醒", cast.lean),
          ].filter(Boolean),
          doList: [
            isZh()
              ? zhText(`按「${cast.lean}」做一件今天能完成的具体事。`, `按「${cast.lean}」做一件今天能完成的具體事。`)
              : `Do one concrete today-action matching “${cast.lean}”.`,
            isZh()
              ? zhText("用行动代替继续搜数字确认。", "用行動代替繼續搜數字確認。")
              : "Replace further number-hunting with that action.",
          ],
          dontList: [
            isZh()
              ? zhText("不要把重复数字当作投资、医疗或关系的最终指令。", "不要把重複數字當作投資、醫療或關係的最終指令。")
              : "Do not treat repeating digits as final orders for money, medicine, or relationships.",
            isZh()
              ? zhText("不要因为没再看到“吉数”就停掉必要安排。", "不要因為沒再看到「吉數」就停掉必要安排。")
              : "Do not cancel needed plans because a “lucky” number did not reappear.",
          ],
          tone: /change|完成|变化|completion/i.test(n) ? "caution" : "mixed",
          vizData: cast,
        });
      },
    },
  };

  function stateAnswersFromCast(cast) {
    if (cast._answers) return cast._answers;
    const t = cast.type || "INFP";
    const answers = {};
    [
      ["ei1", "ei2", "ei3", t[0]],
      ["sn1", "sn2", "sn3", t[1]],
      ["tf1", "tf2", "tf3", t[2]],
      ["jp1", "jp2", "jp3", t[3]],
    ].forEach(([a, b, c, side]) => {
      answers[a] = side;
      answers[b] = side;
      answers[c] = side;
    });
    return answers;
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
    const packHow = isZh() ? (isHant() && r.how.hant ? r.how.hant : r.how.zh) : r.how.en;
    return {
      title: isZh() ? zhText("这个仪式怎么玩", "這個儀式怎麼玩") : "How this rite works",
      intro: packHow.intro,
      steps: packHow.steps,
      note: isZh()
        ? zhText(
            "本站为教育性游玩——不能替代临床评估、医疗、法律或重大人生决策。",
            "本站為教育性遊玩——不能替代臨床評估、醫療、法律或重大人生決策。"
          )
        : "Educational play on this site — not a substitute for clinical assessment, medicine, law, or major life decisions.",
    };
  }
  function runCast(id, state) {
    const riteObj = RITES[id];
    if (!riteObj) return null;
    const seed =
      state.question ||
      state.focus ||
      state.sighting ||
      state.placeFocus ||
      state.birthDate ||
      state.bloodType ||
      JSON.stringify(state.answers || {});
    const rng = mulberry32(seedFrom(seed, state.nonce, id));
    const cast = Object.assign({}, state.cast || {}, riteObj.buildCast(state, rng) || {});
    const q = state.question || state.focus || state.sighting || state.placeFocus || "";
    return riteObj.generate(q, cast, rng);
  }

  window.FatumModernPersonalityOracles = { IDS, has, get, howFor, runCast, loc };
})();
