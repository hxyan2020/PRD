/**
 * Western form / physiognomy oracles — unique steps, visuals, readings.
 * Palmistry · Physiognomy · Metoposcopy · Graphology · Onychomancy · Aura
 */
(function () {
  "use strict";

  const IDS = [
    "palmistry",
    "physiognomy-eu",
    "metoposcopy",
    "graphology",
    "onychomancy",
    "aura-reading",
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
      kind: "physioform",
      ...r,
      disclaimer: isZh()
        ? zhText(
            "教育性模拟——不能替代受训相术／笔迹／气场实践，也不能替代医疗、法律或安全判断。可能不准确；无法预测黑天鹅事件。",
            "教育性模擬——不能替代受訓相術／筆跡／氣場實踐，也不能替代醫療、法律或安全判斷。可能不準確；無法預測黑天鵝事件。"
          )
        : "Educational simulation — not a substitute for trained physiognomy/handwriting/aura practice, medicine, law, or safety judgment. May be inaccurate; cannot predict black swan events.",
    };
    return RM ? RM.structuredReading(base) : base;
  }
  function interpretQ(q, lean, mechanic) {
    const RM = window.FatumResultModel;
    const body = isZh()
      ? zhText(
          `你关注的是「${q || "未写明的事"}」。以${mechanic}给出的「${lean}」倾向为镜：先改一件你能控制的安排，再用日常证据核对——不要把模拟形相当作外在命令。`,
          `你關注的是「${q || "未寫明的事"}」。以${mechanic}給出的「${lean}」傾向為鏡：先改一件你能控制的安排，再用日常證據核對——不要把模擬形相當作外在命令。`
        )
      : `You focused on “${q || "an unnamed matter"}”. Hold the “${lean}” lean from ${mechanic} as a mirror: change one arrangement you control, then check ordinary evidence — do not treat a simulated form reading as an external order.`;
    return RM ? RM.interpretWithQuestion(q, body) : body;
  }
  function howPack(en, zh, hant) {
    return { en, zh, hant: hant || zh };
  }
  function omen(en, zh, leanEn, leanZh, leanHant) {
    return { en, zh, lean: { en: leanEn, zh: leanZh, hant: leanHant || leanZh } };
  }

  const PALM = [
    omen("Heart line deep", "感情线深", "tend bonds · speak kindly", "关照关系·温和说", "關照關係·溫和說"),
    omen("Head line long", "智慧线长", "plan first · then act", "先规划·再行动", "先規劃·再行動"),
    omen("Life line broad", "生命线宽", "pace energy · rest well", "控节奏·好好休息", "控節奏·好好休息"),
    omen("Fate line faint", "事业线淡", "self-author · invent path", "自创路径", "自創路徑"),
  ];
  const FACE = [
    omen("Open brow", "开朗眉", "welcome · stay curious", "开放·保持好奇", "開放·保持好奇"),
    omen("Steady gaze", "稳目", "hold focus · finish one", "守焦点·完成一件", "守焦點·完成一件"),
    omen("Soft mouth", "柔口", "soften speech · repair", "软化语气·修复", "軟化語氣·修復"),
    omen("Strong jaw", "强颌", "persist · set a boundary", "坚持·设界", "堅持·設界"),
  ];
  const BROW = [
    omen("Three mid lines", "三中纹", "mid-life theme · recalibrate", "中年主题·校准", "中年主題·校準"),
    omen("High cross wrinkle", "高横纹", "ambition · pace climbs", "志向·控攀登", "志向·控攀登"),
    omen("Soft verticals", "柔竖纹", "care · protect quiet time", "关怀·保护静时", "關懷·保護靜時"),
    omen("Clear forehead", "额净", "begin · clean slate", "起势·白纸", "起勢·白紙"),
  ];
  const SCRIPT = [
    omen("Upright slant", "正直斜度", "steady · keep commitments", "稳·守承诺", "穩·守承諾"),
    omen("Wide spacing", "宽间距", "leave room · don't crowd", "留空间·勿拥挤", "留空間·勿擁擠"),
    omen("Heavy press", "重压笔", "intensity · channel force", "强度高·引导力", "強度高·引導力"),
    omen("Looping y", "环状y", "imagination · draft freely", "想象·自由起草", "想像·自由起草"),
  ];
  const NAIL = [
    omen("Pink clear nail", "粉净甲", "vitality · keep routine", "活力·守例行", "活力·守例行"),
    omen("White fleck", "白点", "stress mark · rest more", "压力痕·多休息", "壓力痕·多休息"),
    omen("Long almond", "长杏仁", "refine · polish one skill", "打磨·精炼一技", "打磨·精煉一技"),
    omen("Ridged nail", "纵脊甲", "rebuild · strengthen base", "重建·加固根基", "重建·加固根基"),
  ];
  const AURA = [
    omen("Gold field", "金气场", "clarity · lead kindly", "清明·善意带领", "清明·善意帶領"),
    omen("Blue calm", "蓝静", "soothe · listen first", "安抚·先听", "安撫·先聽"),
    omen("Green growth", "绿长", "grow · tend one habit", "生长·照料一习惯", "生長·照料一習慣"),
    omen("Violet intuition", "紫直觉", "trust gut · verify later", "信直觉·后核实", "信直覺·後核實"),
  ];

  function rite(summary, how, steps, viz, castCta, pool, mechanicEn, mechanicZh, noteKey) {
    return {
      summary,
      how,
      steps,
      viz,
      castCta,
      noteKey: noteKey || "formNote",
      buildCast(state, rng) {
        const item = pick(rng, pool);
        const note = state.formNote || state.question || "";
        return { item, note, lean: loc(item.lean), pick: state.formPick || "" };
      },
      generate(q, cast) {
        const n = loc({ en: cast.item.en, zh: cast.item.zh });
        const ask = q || cast.note || "";
        const details = [n];
        if (cast.note) details.unshift(cast.note);
        if (cast.pick) details.push(cast.pick);
        return pack({
          title: cast.note ? `${cast.note} · ${n}` : n,
          result: cast.lean,
          explain: isZh()
            ? zhText(`教学形相示「${n}」，倾向「${cast.lean}」。形相镜子，不是科学诊断。`, `教學形相示「${n}」，傾向「${cast.lean}」。形相鏡子，不是科學診斷。`)
            : `Teaching form reading shows “${n}”, leaning “${cast.lean}”. A form mirror, not a scientific diagnosis.`,
          interpret: interpretQ(ask, cast.lean, isZh() ? mechanicZh : mechanicEn),
          details,
          doList: [
            isZh()
              ? zhText(`按「${cast.lean}」做一件今天可完成的小事。`, `按「${cast.lean}」做一件今天可完成的小事。`)
              : `Do one small today-action matching “${cast.lean}”.`,
          ],
          dontList: [
            isZh()
              ? zhText("不要用形相羞辱外貌或健康差异。", "不要用形相羞辱外貌或健康差異。")
              : "Do not shame appearance or health differences with form reading.",
          ],
          tone: /rest|pace|soften|unclear|stress|淡|柔|休息|压力/i.test(n + cast.lean) ? "caution" : "mixed",
          vizData: cast,
        });
      },
    };
  }

  const RITES = {
    palmistry: rite(
      {
        en: "Palmistry (chiromancy) reads hand lines and mounts for character and fortune themes — arose independently in several cultures; symbolic, not medical.",
        zh: "手相（西式）解读掌纹与掌丘论性情与运势主题——多地独立起源；象征性，非医疗。",
        hant: "手相（西式）解讀掌紋與掌丘論性情與運勢主題——多地獨立起源；象徵性，非醫療。",
      },
      howPack(
        {
          intro: "You’ll note a hand trait, pick a teaching line, then read a mount lean.",
          steps: [
            { title: "Meet Palmistry", body: "Lines · mounts · character themes." },
            { title: "Note a hand trait", body: "What stands out?" },
            { title: "Pick a palm line", body: "Heart · head · life · fate." },
            { title: "Read the mount lean", body: "Mount counsel appears." },
            { title: "Palm counsel", body: "Lean for your focus." },
            { title: "Palm reading", body: "Counsel for your note." },
          ],
        },
        {
          intro: "你将记录手部特征、选择教学主线，再读掌丘倾向。",
          steps: [
            { title: "认识手相", body: "纹 · 丘 · 性情主题。" },
            { title: "记录手部特征", body: "什么最醒目？" },
            { title: "选择掌纹主线", body: "感情 · 智慧 · 生命 · 事业。" },
            { title: "读取掌丘倾向", body: "掌丘指引出现。" },
            { title: "手相指引", body: "对照你的关注。" },
            { title: "手相结果", body: "对照笔记给出指引。" },
          ],
        },
        {
          intro: "你將記錄手部特徵、選擇教學主線，再讀掌丘傾向。",
          steps: [
            { title: "認識手相", body: "紋 · 丘 · 性情主題。" },
            { title: "記錄手部特徵", body: "什麼最醒目？" },
            { title: "選擇掌紋主線", body: "感情 · 智慧 · 生命 · 事業。" },
            { title: "讀取掌丘傾向", body: "掌丘指引出現。" },
            { title: "手相指引", body: "對照你的關注。" },
            { title: "手相結果", body: "對照筆記給出指引。" },
          ],
        }
      ),
      ["intent", "handNoteWest", "linePickWest", "mountReadWest", "palmCounselWest", "result"],
      "palmwest",
      { en: "Read the palm counsel", zh: "读取手相指引", hant: "讀取手相指引" },
      PALM,
      "the palm line",
      "掌纹"
    ),

    "physiognomy-eu": rite(
      {
        en: "Western physiognomy infers character from facial features in Greek and Renaissance treatises — everyday emotion cues exist; fate systems do not forecast scientifically.",
        zh: "西方面相由面容特征推断性格——日常情绪线索可知，命运体系并无科学预报效力。",
        hant: "西方面相由面容特徵推斷性格——日常情緒線索可知，命運體系並無科學預報效力。",
      },
      howPack(
        {
          intro: "You’ll note a facial trait, pick a teaching feature, then read a visage lean.",
          steps: [
            { title: "Meet Western Physiognomy", body: "Face · character treatises." },
            { title: "Note a facial trait", body: "What stands out?" },
            { title: "Pick a face feature", body: "Brow · eye · mouth · jaw." },
            { title: "Read the visage lean", body: "Feature counsel appears." },
            { title: "Physiognomy counsel", body: "Lean for your focus." },
            { title: "Visage reading", body: "Counsel for your note." },
          ],
        },
        {
          intro: "你将记录面容特征、选择教学部位，再读面相倾向。",
          steps: [
            { title: "认识西方面相", body: "面 · 性格论著。" },
            { title: "记录面容特征", body: "什么最醒目？" },
            { title: "选择面部部位", body: "眉 · 目 · 口 · 颌。" },
            { title: "读取面相倾向", body: "部位指引出现。" },
            { title: "面相指引", body: "对照你的关注。" },
            { title: "面相结果", body: "对照笔记给出指引。" },
          ],
        },
        {
          intro: "你將記錄面容特徵、選擇教學部位，再讀面相傾向。",
          steps: [
            { title: "認識西方面相", body: "面 · 性格論著。" },
            { title: "記錄面容特徵", body: "什麼最醒目？" },
            { title: "選擇面部部位", body: "眉 · 目 · 口 · 頜。" },
            { title: "讀取面相傾向", body: "部位指引出現。" },
            { title: "面相指引", body: "對照你的關注。" },
            { title: "面相結果", body: "對照筆記給出指引。" },
          ],
        }
      ),
      ["intent", "faceNoteWest", "featurePickWest", "visageLean", "physioCounselWest", "result"],
      "facewest",
      { en: "Read the physiognomy counsel", zh: "读取面相指引", hant: "讀取面相指引" },
      FACE,
      "the facial feature",
      "面相部位"
    ),

    metoposcopy: rite(
      {
        en: "Metoposcopy counts and positions forehead wrinkles for character reading — a Renaissance European form art.",
        zh: "额纹相清点并定位额纹以论性格——文艺复兴欧洲形相术。",
        hant: "額紋相清點並定位額紋以論性格——文藝復興歐洲形相術。",
      },
      howPack(
        {
          intro: "You’ll note a brow trait, count teaching wrinkles, then read a brow-map lean.",
          steps: [
            { title: "Meet Metoposcopy", body: "Forehead · wrinkles · character." },
            { title: "Note a brow trait", body: "What stands out?" },
            { title: "Count the wrinkles", body: "Teaching count." },
            { title: "Map the brow lines", body: "Position counsel." },
            { title: "Metoposcopy counsel", body: "Lean for your focus." },
            { title: "Brow reading", body: "Counsel for your note." },
          ],
        },
        {
          intro: "你将记录额部特征、清点教学额纹，再读额图倾向。",
          steps: [
            { title: "认识额纹相", body: "额 · 纹 · 性格。" },
            { title: "记录额部特征", body: "什么最醒目？" },
            { title: "清点额纹", body: "教学计数。" },
            { title: "映射额纹位置", body: "位置指引。" },
            { title: "额纹指引", body: "对照你的关注。" },
            { title: "额纹结果", body: "对照笔记给出指引。" },
          ],
        },
        {
          intro: "你將記錄額部特徵、清點教學額紋，再讀額圖傾向。",
          steps: [
            { title: "認識額紋相", body: "額 · 紋 · 性格。" },
            { title: "記錄額部特徵", body: "什麼最醒目？" },
            { title: "清點額紋", body: "教學計數。" },
            { title: "映射額紋位置", body: "位置指引。" },
            { title: "額紋指引", body: "對照你的關注。" },
            { title: "額紋結果", body: "對照筆記給出指引。" },
          ],
        }
      ),
      ["intent", "browNote", "wrinkleCount", "browMap", "metopoCounsel", "result"],
      "metopo",
      { en: "Read the metoposcopy counsel", zh: "读取额纹指引", hant: "讀取額紋指引" },
      BROW,
      "the brow map",
      "额纹图"
    ),

    graphology: rite(
      {
        en: "Graphology interprets handwriting traits as personality indicators — culturally familiar; unreliable as fate diagnosis.",
        zh: "笔迹性格学以笔迹特征论性情——文化上熟悉；作为命运诊断并不可靠。",
        hant: "筆跡性格學以筆跡特徵論性情——文化上熟悉；作為命運診斷並不可靠。",
      },
      howPack(
        {
          intro: "You’ll note a writing sample, pick a teaching stroke, then read a script lean.",
          steps: [
            { title: "Meet Graphology", body: "Script · slant · pressure." },
            { title: "Note a writing sample", body: "A word or signature feel." },
            { title: "Pick a stroke trait", body: "Slant · spacing · press." },
            { title: "Read the script lean", body: "Stroke counsel appears." },
            { title: "Graphology counsel", body: "Lean for your focus." },
            { title: "Script reading", body: "Counsel for your note." },
          ],
        },
        {
          intro: "你将记录笔迹样本、选择教学笔势，再读笔迹倾向。",
          steps: [
            { title: "认识笔迹学", body: "字 · 斜度 · 压力。" },
            { title: "记录笔迹样本", body: "一词或签名感觉。" },
            { title: "选择笔势特征", body: "斜度 · 间距 · 压力。" },
            { title: "读取笔迹倾向", body: "笔势指引出现。" },
            { title: "笔迹指引", body: "对照你的关注。" },
            { title: "笔迹结果", body: "对照笔记给出指引。" },
          ],
        },
        {
          intro: "你將記錄筆跡樣本、選擇教學筆勢，再讀筆跡傾向。",
          steps: [
            { title: "認識筆跡學", body: "字 · 斜度 · 壓力。" },
            { title: "記錄筆跡樣本", body: "一詞或簽名感覺。" },
            { title: "選擇筆勢特徵", body: "斜度 · 間距 · 壓力。" },
            { title: "讀取筆跡傾向", body: "筆勢指引出現。" },
            { title: "筆跡指引", body: "對照你的關注。" },
            { title: "筆跡結果", body: "對照筆記給出指引。" },
          ],
        }
      ),
      ["intent", "writeSample", "strokePick", "scriptLean", "graphCounsel", "result"],
      "graph",
      { en: "Read the graphology counsel", zh: "读取笔迹指引", hant: "讀取筆跡指引" },
      SCRIPT,
      "the handwriting trait",
      "笔迹特征"
    ),

    onychomancy: rite(
      {
        en: "Onychomancy reads nail shape, color, and marks as omens — folk form reading, not dermatology.",
        zh: "指甲占以甲形、颜色与斑点作兆——民俗形相，不是皮肤科。",
        hant: "指甲占以甲形、顏色與斑點作兆——民俗形相，不是皮膚科。",
      },
      howPack(
        {
          intro: "You’ll note a nail trait, mark a teaching spot, then read a nail lean.",
          steps: [
            { title: "Meet Onychomancy", body: "Nail · shape · marks." },
            { title: "Note a nail trait", body: "What stands out?" },
            { title: "Mark a nail spot", body: "Fleck · ridge · tip." },
            { title: "Read the nail lean", body: "Mark counsel appears." },
            { title: "Onychomancy counsel", body: "Lean for your focus." },
            { title: "Nail reading", body: "Counsel for your note." },
          ],
        },
        {
          intro: "你将记录指甲特征、标记教学位点，再读甲兆倾向。",
          steps: [
            { title: "认识指甲占", body: "甲 · 形 · 斑。" },
            { title: "记录指甲特征", body: "什么最醒目？" },
            { title: "标记甲位点", body: "白点 · 纵脊 · 甲尖。" },
            { title: "读取甲兆倾向", body: "位点指引出现。" },
            { title: "指甲指引", body: "对照你的关注。" },
            { title: "指甲结果", body: "对照笔记给出指引。" },
          ],
        },
        {
          intro: "你將記錄指甲特徵、標記教學位點，再讀甲兆傾向。",
          steps: [
            { title: "認識指甲占", body: "甲 · 形 · 斑。" },
            { title: "記錄指甲特徵", body: "什麼最醒目？" },
            { title: "標記甲位點", body: "白點 · 縱脊 · 甲尖。" },
            { title: "讀取甲兆傾向", body: "位點指引出現。" },
            { title: "指甲指引", body: "對照你的關注。" },
            { title: "指甲結果", body: "對照筆記給出指引。" },
          ],
        }
      ),
      ["intent", "nailNote", "nailMark", "nailLean", "onychCounsel", "result"],
      "nail",
      { en: "Read the onychomancy counsel", zh: "读取指甲指引", hant: "讀取指甲指引" },
      NAIL,
      "the nail mark",
      "甲位点"
    ),

    "aura-reading": rite(
      {
        en: "Aura reading interprets color imagery around the body for mental and physical state themes — Theosophical / modern symbolic play, not instrument measurement.",
        zh: "气场解读以身体周围的色彩意象论身心状态主题——神智学／现代象征游玩，不是仪器测量。",
        hant: "氣場解讀以身體周圍的色彩意象論身心狀態主題——神智學／現代象徵遊玩，不是儀器測量。",
      },
      howPack(
        {
          intro: "You’ll pick an aura focus, sense a teaching color field, then read a hue lean.",
          steps: [
            { title: "Meet Aura Reading", body: "Color field · state themes." },
            { title: "Pick an aura focus", body: "Head · heart · whole." },
            { title: "Sense the color field", body: "Teaching hues." },
            { title: "Read the aura hue", body: "Hue counsel appears." },
            { title: "Aura counsel", body: "Lean for your focus." },
            { title: "Aura reading", body: "Counsel for your note." },
          ],
        },
        {
          intro: "你将选择气场焦点、感受教学色场，再读色相倾向。",
          steps: [
            { title: "认识气场解读", body: "色场 · 状态主题。" },
            { title: "选择气场焦点", body: "头 · 心 · 全身。" },
            { title: "感受色场", body: "教学色相。" },
            { title: "读取气场色相", body: "色相指引出现。" },
            { title: "气场指引", body: "对照你的关注。" },
            { title: "气场结果", body: "对照笔记给出指引。" },
          ],
        },
        {
          intro: "你將選擇氣場焦點、感受教學色場，再讀色相傾向。",
          steps: [
            { title: "認識氣場解讀", body: "色場 · 狀態主題。" },
            { title: "選擇氣場焦點", body: "頭 · 心 · 全身。" },
            { title: "感受色場", body: "教學色相。" },
            { title: "讀取氣場色相", body: "色相指引出現。" },
            { title: "氣場指引", body: "對照你的關注。" },
            { title: "氣場結果", body: "對照筆記給出指引。" },
          ],
        }
      ),
      ["intent", "auraFocus", "colorField", "auraHue", "auraCounsel", "result"],
      "aura",
      { en: "Read the aura counsel", zh: "读取气场指引", hant: "讀取氣場指引" },
      AURA,
      "the aura hue",
      "气场色相"
    ),
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
            "本站为教育性游玩——不能替代受训相术／笔迹／气场、医疗、法律或安全判断。",
            "本站為教育性遊玩——不能替代受訓相術／筆跡／氣場、醫療、法律或安全判斷。"
          )
        : "Educational play on this site — not a substitute for trained physiognomy/handwriting/aura practice, medicine, law, or safety judgment.",
    };
  }
  function runCast(id, state) {
    const riteObj = RITES[id];
    if (!riteObj) return null;
    const rng = mulberry32(seedFrom(state.formNote || state.question || state.focus, state.nonce, id));
    const cast = Object.assign({}, state.cast || {}, riteObj.buildCast(state, rng) || {});
    return riteObj.generate(state.question || state.focus || state.formNote || "", cast, rng);
  }

  window.FatumPhysioFormOracles = { IDS, has, get, howFor, runCast, loc };
})();
