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
  function interpretQ(q, lean, mechanic) {
    const RM = window.FatumResultModel;
    const body = isZh()
      ? zhText(
          `你关注的是「${q || "未写明的事"}」。以${mechanic}给出的「${lean}」倾向为镜：先改一件你能控制的安排，再用日常证据核对。`,
          `你關注的是「${q || "未寫明的事"}」。以${mechanic}給出的「${lean}」傾向為鏡：先改一件你能控制的安排，再用日常證據核對。`
        )
      : `You focused on “${q || "an unnamed matter"}”. Hold the “${lean}” lean from ${mechanic} as a mirror: change one arrangement you control, then check ordinary evidence.`;
    return RM ? RM.interpretWithQuestion(q, body) : body;
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
        if (G?.generateMbtiReading) {
          const r = G.generateMbtiReading({
            answers: cast._answers || stateAnswersFromCast(cast),
            focus: cast.focus || q,
          });
          return pack({
            ...r,
            kind: "modernpersonality",
            vizData: cast,
            type: cast.type || r.type,
          });
        }
        const n = cast.type || "????";
        const lean = cast.meta?.title || n;
        return pack({
          title: `${n} — ${lean}`,
          result: `${n} — ${lean}`,
          explain: isZh()
            ? zhText(`教学偏好图示「${n}」。偏好不是命运。`, `教學偏好圖示「${n}」。偏好不是命運。`)
            : `Teaching preference map shows “${n}”. Preferences are not destiny.`,
          interpret: interpretQ(q || cast.focus, lean, isZh() ? "偏好字母" : "the preference letters"),
          details: [n, cast.focus].filter(Boolean),
          doList: [
            cast.meta?.path ||
              (isZh() ? zhText("用字母对命名此刻的动力。", "用字母對命名此刻的動力。") : "Name which letter-pair is driving you."),
          ],
          dontList: [
            isZh()
              ? zhText("不要用类型当招聘／诊断／命运判决。", "不要用類型當招聘／診斷／命運判決。")
              : "Do not use type as hiring filter, diagnosis, or fate sentence.",
          ],
          tone: "mixed",
          vizData: cast,
          type: n,
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
        return pack({
          title: cast.focus ? `${cast.focus} · ${n}` : n,
          result: cast.lean,
          explain: isZh()
            ? zhText(
                `教学血型民俗示「${n}」，倾向「${cast.lean}」。医学 ABO 与性格命运说法请分开。`,
                `教學血型民俗示「${n}」，傾向「${cast.lean}」。醫學 ABO 與性格命運說法請分開。`
              )
            : `Teaching blood-type folklore shows “${n}”, leaning “${cast.lean}”. Keep medical ABO separate from personality fate claims.`,
          interpret: interpretQ(ask, cast.lean, isZh() ? "血型民俗" : "blood-type folklore"),
          details: [cast.bloodType, cast.focus, n].filter(Boolean),
          doList: [
            isZh()
              ? zhText(`按「${cast.lean}」做一件今天可完成的小事。`, `按「${cast.lean}」做一件今天可完成的小事。`)
              : `Do one small today-action matching “${cast.lean}”.`,
          ],
          dontList: [
            isZh()
              ? zhText("不要用血型筛选恋爱、招聘或排斥他人。", "不要用血型篩選戀愛、招聘或排斥他人。")
              : "Do not hire, date, or exclude people by ABO type.",
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
        return pack({
          title: cast.focus ? `${cast.focus} · ${title}` : title,
          result: cast.lean,
          explain: isZh()
            ? zhText(
                `教学正弦图：生理23／情绪28／智力33。今日标签「${cast.lean}」。科学检验不支持其预测力。`,
                `教學正弦圖：生理23／情緒28／智力33。今日標籤「${cast.lean}」。科學檢驗不支持其預測力。`
              )
            : `Teaching sine chart: physical 23 / emotional 28 / intellectual 33. Today’s labels “${cast.lean}”. Controlled tests do not support predictive power.`,
          interpret: interpretQ(ask, cast.lean, isZh() ? "生物节律波形" : "the biorhythm waves"),
          details: [
            cast.birthDate,
            cast.focus,
            isZh()
              ? zhText(`出生后第 ${cast.days} 天`, `出生後第 ${cast.days} 天`)
              : `Day ${cast.days} since birth`,
          ].filter(Boolean),
          doList: [
            isZh()
              ? zhText("把“临界日”当作提醒休息／复查计划的便签，而非命运判决。", "把「臨界日」當作提醒休息／複查計劃的便簽，而非命運判決。")
              : "Treat a “critical” day as a sticky note to rest or recheck plans — not a fate sentence.",
          ],
          dontList: [
            isZh()
              ? zhText("不要用生物节律决定手术、投资或重大风险。", "不要用生物節律決定手術、投資或重大風險。")
              : "Do not schedule surgery, investments, or high-stakes risks by biorhythm.",
          ],
          tone: /low|低/i.test(cast.lean) ? "caution" : "mixed",
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
        return pack({
          title: cast.focus ? `${cast.focus} · ${tn}` : tn,
          result: `${tn} · ${an}`,
          explain: isZh()
            ? zhText(
                `教学人类图示类型「${tn}」、权威「${an}」，倾向「${cast.lean}」。混成象征图，不是天文／医学预报。`,
                `教學人類圖示類型「${tn}」、權威「${an}」，傾向「${cast.lean}」。混成象徵圖，不是天文／醫學預報。`
              )
            : `Teaching Human Design shows Type “${tn}”, Authority “${an}”, leaning “${cast.lean}”. A hybrid symbolic map, not an astronomical or medical forecast.`,
          interpret: interpretQ(ask, cast.lean, isZh() ? "人类图权威" : "Human Design Authority"),
          details: [cast.birthDate, cast.focus, tn, an].filter(Boolean),
          doList: [
            isZh()
              ? zhText(`按「${cast.lean}」试一次小决定，再记录体感。`, `按「${cast.lean}」試一次小決定，再記錄體感。`)
              : `Try one small decision with “${cast.lean}”, then note how your body felt.`,
          ],
          dontList: [
            isZh()
              ? zhText("不要用人类图否定他人价值或回避责任。", "不要用人類圖否定他人價值或迴避責任。")
              : "Do not use Human Design to deny others’ worth or dodge responsibility.",
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
        return pack({
          title: ask ? `${ask} · ${n}` : n,
          result: cast.lean,
          explain: isZh()
            ? zhText(
                `教学星图线示「${n}」，倾向「${cast.lean}」。地点象征主题，不是搬迁保证。`,
                `教學星圖線示「${n}」，傾向「${cast.lean}」。地點象徵主題，不是搬遷保證。`
              )
            : `Teaching map line shows “${n}”, leaning “${cast.lean}”. Place symbolism, not a relocation guarantee.`,
          interpret: interpretQ(ask, cast.lean, isZh() ? "星图地理线" : "the astrocartography line"),
          details: [cast.birthDate, cast.placeFocus, n].filter(Boolean),
          doList: [
            isZh()
              ? zhText(`若考虑「${ask || "该地"}」，先列三条生活证据（成本、人脉、节奏）再对照倾向。`, `若考慮「${ask || "該地"}」，先列三條生活證據（成本、人脈、節奏）再對照傾向。`)
              : `If weighing “${ask || "that place"}”, list three ordinary facts (cost, people, pace) before the lean.`,
          ],
          dontList: [
            isZh()
              ? zhText("不要仅凭行星线搬家、投资房产或断绝关系。", "不要僅憑行星線搬家、投資房產或斷絕關係。")
              : "Do not move, buy property, or end ties on a planet line alone.",
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
        return pack({
          title: ask ? `${ask} · ${n}` : n,
          result: cast.lean,
          explain: isZh()
            ? zhText(
                `教学天使数字示「${n}」，倾向「${cast.lean}」。重复数字很常见；意义是你赋予的提醒，不是宇宙电报。`,
                `教學天使數字示「${n}」，傾向「${cast.lean}」。重複數字很常見；意義是你賦予的提醒，不是宇宙電報。`
              )
            : `Teaching angel number shows “${n}”, leaning “${cast.lean}”. Repeating digits are common; meaning is a reminder you assign, not a cosmic telegram.`,
          interpret: interpretQ(ask, cast.lean, isZh() ? "天使数字" : "the angel number"),
          details: [cast.sighting, n].filter(Boolean),
          doList: [
            isZh()
              ? zhText(`按「${cast.lean}」做一件具体小事，再观察是否仍需要“数字确认”。`, `按「${cast.lean}」做一件具體小事，再觀察是否仍需要「數字確認」。`)
              : `Do one concrete action matching “${cast.lean}”, then notice if you still need a number for permission.`,
          ],
          dontList: [
            isZh()
              ? zhText("不要把重复数字当作投资、医疗或关系的最终指令。", "不要把重複數字當作投資、醫療或關係的最終指令。")
              : "Do not treat repeating digits as final orders for money, medicine, or relationships.",
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
