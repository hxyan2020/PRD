/**
 * Process templates and outcome pools for interactive readings.
 * Every catalog method maps to one pre-defined ritual flow.
 */
(function () {
  "use strict";

  /** Reflective frames — symbolic prompts, not event forecasts. */
  function procZh() {
    try {
      return String(window.FatumI18n?.getLocale?.() || "").startsWith("zh");
    } catch (_) {
      return false;
    }
  }
  function procHant() {
    try {
      return String(window.FatumI18n?.getLocale?.() || "").startsWith("zh-Hant");
    } catch (_) {
      return false;
    }
  }
  function procT(hans, hant, en) {
    if (procZh()) return procHant() ? hant || hans : hans;
    return en;
  }

  const EXPLAIN_FRAMES = {
    bright: [
      "In many omen traditions, a bright lean invites clarity and forward motion — as a mirror, not a guarantee.",
      "The pattern reads as supportive of beginnings already forming in your own judgment.",
      "The symbolic field leans open: favor the step you can explain without superstition.",
    ],
    mixed: [
      "The pattern is mixed: two pulls are visible. Traditions often treat this as a call to choose one current deliberately.",
      "Ambiguity here is the message — not a hidden yes waiting to be decoded into certainty.",
      "Mixed signs usually ask for a trade-off you can name in plain language.",
    ],
    caution: [
      "The lean is cautious: slow the binding decision; protect what already works.",
      "Caution in omen language means ‘do not rush the knot,’ not ‘never act again.’",
      "The pattern warns against haste and charming shortcuts — verify before you commit.",
    ],
    deep: [
      "The pattern turns inward: the useful work may be clarifying the question itself.",
      "Deep leanings invite revision of an old pattern — reflection before spectacle.",
      "This draw behaves like a mirror more than a map; notice the feeling under the ask.",
    ],
  };
  const EXPLAIN_FRAMES_ZH = {
    bright: [
      "许多征兆传统里，明亮倾向邀请清晰与向前——当作镜子，不是保证。",
      "格局读起来支持你判断里已在成形的开端。",
      "象征场域偏开放：优先你能用不迷信的话解释清楚的那一步。",
    ],
    mixed: [
      "格局混杂：两股拉力都看得见。传统常把它当作刻意择一的提醒。",
      "含糊本身就是讯息——不是藏着一个等你解出来的“是”。",
      "混杂征兆通常要你用白话说出取舍。",
    ],
    caution: [
      "倾向谨慎：放慢会绑死的决定；先守护已奏效的事。",
      "征兆里的谨慎是“别急着打结”，不是“永远别再行动”。",
      "格局提醒你提防匆忙与诱人捷径——先核实再承诺。",
    ],
    deep: [
      "格局转向内在：有用的工作或许是先把问题本身问清楚。",
      "深向倾向邀请修订旧模式——先反思，再表演。",
      "这次抽取更像镜子而非地图；留意问题底下的感受。",
    ],
  };
  const EXPLAIN_FRAMES_HANT = {
    bright: [
      "許多徵兆傳統裡，明亮傾向邀請清晰與向前——當作鏡子，不是保證。",
      "格局讀起來支持你判斷裡已在成形的開端。",
      "象徵場域偏開放：優先你能用不迷信的話解釋清楚的那一步。",
    ],
    mixed: [
      "格局混雜：兩股拉力都看得見。傳統常把它當作刻意擇一的提醒。",
      "含糊本身就是訊息——不是藏著一個等你解出來的「是」。",
      "混雜徵兆通常要你用白話說出取捨。",
    ],
    caution: [
      "傾向謹慎：放慢會綁死的決定；先守護已奏效的事。",
      "徵兆裡的謹慎是「別急著打結」，不是「永遠別再行動」。",
      "格局提醒你提防匆忙與誘人捷徑——先核實再承諾。",
    ],
    deep: [
      "格局轉向內在：有用的工作或許是先把問題本身問清楚。",
      "深向傾向邀請修訂舊模式——先反思，再表演。",
      "這次抽取更像鏡子而非地圖；留意問題底下的感受。",
    ],
  };

  const SYMBOLS = {
    Fate: ["☉", "☾", "★", "✦", "子午", "甲", "☽"],
    Omen: ["☰", "⚏", "◆", "✧", "⬡", "⁕", "◎"],
    Form: ["✋", "◇", "▢", "◈", "◠", "○", "▣"],
  };

  const HEXAGRAMS = [
    { name: "Creative Force", lines: "䷀", meaning: "Strength gathers when will aligns with timing." },
    { name: "Receptive Field", lines: "䷁", meaning: "Yielding now multiplies later harvest." },
    { name: "Difficulty at the Beginning", lines: "䷂", meaning: "Confusion clears after the first honest step." },
    { name: "Waiting", lines: "䷄", meaning: "Nourish patience; the crossing is not yet." },
    { name: "Conflict", lines: "䷅", meaning: "Argue less with the map; adjust your route." },
    { name: "Holding Together", lines: "䷎", meaning: "Company chosen wisely becomes fortune." },
    { name: "Small Taming", lines: "䷈", meaning: "Restrain impulse; polish the detail." },
    { name: "Peace", lines: "䷊", meaning: "Heaven and earth agree—act while balance holds." },
    { name: "Standstill", lines: "䷋", meaning: "Do not force what the season withholds." },
    { name: "Fellowship", lines: "䷌", meaning: "Shared purpose lights a wider road." },
    { name: "Great Possession", lines: "䷍", meaning: "Steward gains; generosity keeps them alive." },
    { name: "Modesty", lines: "䷎", meaning: "Quiet competence outruns loud claims." },
    { name: "Enthusiasm", lines: "䷏", meaning: "Joy moves crowds—direct it with care." },
    { name: "Following", lines: "䷐", meaning: "Adapt to the living current, not the old plan." },
    { name: "Work on What Has Been Spoiled", lines: "䷑", meaning: "Repair restores more than reinvention." },
    { name: "Approach", lines: "䷒", meaning: "Help arrives; receive it without shrinking." },
  ];

  const ODU_LIKE = [
    { name: "Open Road", verse: "The path is swept. Walk without borrowing fear." },
    { name: "Twin Currents", verse: "Two truths speak; the quieter one is yours." },
    { name: "Market Crossroads", verse: "Trade what weighs you for what feeds you." },
    { name: "Closed Gate", verse: "Not denial—preparation. Return with cleaner hands." },
    { name: "Ancestral Nod", verse: "Someone before you already survived this shape of doubt." },
    { name: "Cowrie Smile", verse: "Joy is not frivolous; it is navigation." },
    { name: "Palm Kernel", verse: "Break the hard shell; the oil was always inside." },
    { name: "Night Drum", verse: "Rhythm before reason—move, then understand." },
  ];

  const TAROT_LIKE = [
    { name: "The Seeker", upright: "Curiosity becomes courage when given a destination." },
    { name: "The Keeper", upright: "Guard the threshold; not every guest is for you." },
    { name: "The Bridge", upright: "You are the crossing between what was and what will be." },
    { name: "The Well", upright: "Depth answers only those who lower a bucket." },
    { name: "The Spark", upright: "A small ignition is enough if the kindling is honest." },
    { name: "The Veil", upright: "Mystery is temporary; patience is the key." },
    { name: "The Harvest", upright: "Collect what you planted; leave the rest to weather." },
    { name: "The Compass", upright: "Direction returns when you stop arguing with north." },
  ];

  const ANIMALS = ["Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake", "Horse", "Goat", "Monkey", "Rooster", "Dog", "Pig"];
  const ELEMENTS = ["Wood", "Fire", "Earth", "Metal", "Water"];
  /** Popular East Asian blood-type stereotype tags — cultural folklore only. */
  const BLOOD_TYPE_TRAITS = {
    A: {
      title: "Type A",
      lean: "careful · orderly · considerate",
      note: "Popular stereotype: conscientious, reserved under stress, values harmony.",
    },
    B: {
      title: "Type B",
      lean: "curious · independent · flexible",
      note: "Popular stereotype: creative, goes own way, dislikes rigid rules.",
    },
    O: {
      title: "Type O",
      lean: "outgoing · decisive · energetic",
      note: "Popular stereotype: goal-driven, sociable, sometimes impatient.",
    },
    AB: {
      title: "Type AB",
      lean: "complex · dual · analytical",
      note: "Popular stereotype: mixes A and B traits; thoughtful and hard to categorize.",
    },
  };
  const RUNES = [
    { name: "Fehu", nameZh: "费胡", gloss: "movable wealth, beginning energy", glossZh: "可移动的财富、起始能量", glossHant: "可移動的財富、起始能量" },
    { name: "Uruz", nameZh: "乌鲁兹", gloss: "vital strength, recovery", glossZh: "生命力、恢复", glossHant: "生命力、恢復" },
    { name: "Thurisaz", nameZh: "图里萨兹", gloss: "threshold force, necessary conflict", glossZh: "门槛之力、必要冲突", glossHant: "門檻之力、必要衝突" },
    { name: "Ansuz", nameZh: "安苏兹", gloss: "message, breath, counsel", glossZh: "讯息、气息、建言", glossHant: "訊息、氣息、建言" },
    { name: "Raidho", nameZh: "莱多", gloss: "journey, right ordering", glossZh: "旅程、正当秩序", glossHant: "旅程、正當秩序" },
    { name: "Kenaz", nameZh: "凯纳兹", gloss: "torch, craft, revelation", glossZh: "火把、手艺、启示", glossHant: "火把、手藝、啟示" },
    { name: "Gebo", nameZh: "盖博", gloss: "gift, exchange, bond", glossZh: "礼物、交换、纽带", glossHant: "禮物、交換、紐帶" },
    { name: "Wunjo", nameZh: "温乔", gloss: "joy, belonging", glossZh: "喜悦、归属", glossHant: "喜悅、歸屬" },
  ];

  const PROCESSES = {
    birth: {
      id: "birth",
      label: "Birth chart reading",
      blurb: "Enter a birth date. The atlas derives a symbolic fate signature in the style of this tradition.",
      steps: ["intent", "birth", "ritual", "result"],
      ritualLabel: "Charting the heavens…",
      cta: "Read my fate",
    },
    blood: {
      id: "blood",
      label: "Blood type reading",
      blurb: "Choose an ABO blood type. Popular East Asian personality tags are shown as cultural stereotypes — not medical fate.",
      steps: ["intent", "blood", "ritual", "result"],
      ritualLabel: "Reading the type…",
      cta: "Read my type",
    },
    name: {
      id: "name",
      label: "Name reading",
      blurb: "Enter a name. Letters and stroke-style counts become a symbolic signature in this tradition’s spirit.",
      steps: ["intent", "name", "ritual", "result"],
      ritualLabel: "Weighing the name…",
      cta: "Read the name",
    },
    cast: {
      id: "cast",
      label: "Casting the lots",
      blurb: "Name your question. Lots, shells, sticks, or seeds are cast in a simulated rite.",
      steps: ["intent", "question", "ritual", "result"],
      ritualLabel: "Casting…",
      cta: "Cast now",
    },
    cards: {
      id: "cards",
      label: "Card draw",
      blurb: "Hold a focus in mind. Three symbolic cards are drawn and read together.",
      steps: ["intent", "question", "ritual", "result"],
      ritualLabel: "Shuffling the deck…",
      cta: "Draw cards",
    },
    dice: {
      id: "dice",
      label: "Dice / bone throw",
      blurb: "Ask, then throw. Numbers and faces become the oracle’s speech.",
      steps: ["intent", "question", "ritual", "result"],
      ritualLabel: "Throwing…",
      cta: "Throw",
    },
    book: {
      id: "book",
      label: "Opening the book",
      blurb: "A verse, poem, or lot slip opens as if at random—then is interpreted.",
      steps: ["intent", "question", "ritual", "result"],
      ritualLabel: "Opening the page…",
      cta: "Open the oracle",
    },
    form: {
      id: "form",
      label: "Form reading",
      blurb: "Upload a photo when asked (palm, face, place, etc.), note a trait, and form becomes fortune.",
      steps: ["intent", "form", "ritual", "result"],
      ritualLabel: "Reading the form…",
      cta: "Read the form",
    },
    pendulum: {
      id: "pendulum",
      label: "Yes / no pendulum",
      blurb: "Ask a yes-or-no question. The pendulum’s swing answers.",
      steps: ["intent", "question", "ritual", "result"],
      ritualLabel: "Listening to the swing…",
      cta: "Ask the pendulum",
    },
    day: {
      id: "day",
      label: "Day selection",
      blurb: "Choose a date and purpose. The almanac answers whether the day favors you.",
      steps: ["intent", "day", "ritual", "result"],
      ritualLabel: "Consulting the almanac…",
      cta: "Check this day",
    },
    omen: {
      id: "omen",
      label: "Omen watching",
      blurb: "Name what you seek. Signs are gathered from the tradition’s symbolic field.",
      steps: ["intent", "question", "ritual", "result"],
      ritualLabel: "Watching for signs…",
      cta: "Seek the omen",
    },
  };

  /** Hard overrides by method id (beats keyword heuristics). */
  const ID_PROCESS = {
    "blood-type": "blood",
    seimei: "name",
    sanmeigaku: "name",
    taksa: "name",
    abjad: "name",
    "kabbalah-numerology": "name",
    jafr: "name",
  };

  /** Keyword → process id (first match wins). */
  const KEYWORD_MAP = [
    [/blood type|ketsueki|abo blood/i, "blood"],
    [/name divination|seimei|sanmei|naming astrology|abjad|gematria|jafr/i, "name"],
    [/tarot|lenormand|kipper|sibilla|cartomancy|baraja|oracle card|parrot/i, "cards"],
    [/rune|ogham|futhorc|futhark/i, "cast"],
    [/i ching|zhou yi|hexagram|liu yao|plum blossom|qimen|liu ren|ling qi/i, "cast"],
    [/if[aá]|odu|cowrie|búzio|dilogg|mérìnd|obi|afa|sikidy|hakata|ngombo|bone|shagai|maize|coca|geomanc|ilm al-raml|ramala|jiaobei|kau chim|omikuji|cleromancy|lot|goralot|belomancy|urim/i, "cast"],
    [/dice|astragal|mo\b|domino|knuckle/i, "dice"],
    [/bibliomancy|hafez|kiều|kieu|sortes|book|poem|verse/i, "book"],
    [/pendulum|dowsing|istikh/i, "pendulum"],
    [/almanac|rokuy|zeri|day select|weekday|tongshu|nekath|weton|pawukon|maramataka|moon night|ben ming|tojeong/i, "day"],
    [/palm|face|physiognom|mian xiang|shou xiang|samudrika|grapholog|mole|nail|vastu|feng shui|kasō|kaso|house|grave|aura|handwriting|seal|metoposcop|bone palm|form/i, "form"],
    [/bazi|zi wei|astrology|jyotish|vedic|saju|horary|zodiac|numerolog|birth|pillar|hora|mahabote|decan|firdaria|human design|astrocart|biorhythm|nine star|sukuy|panchanga|manazil|mazalot|tonalpohualli|tzolk|wata|zurhai|tibetan astro/i, "birth"],
    [/dream|scry|smoke|cloud|fire|water|wax|lead|egg|apple|augur|haruspic|scapul|crab|spider|fox|star twinkl|scintill|vision|shaman|tent|incub/i, "omen"],
  ];

  function ti(key, fallback) {
    if (window.FatumI18n) {
      const v = window.FatumI18n.t(key);
      if (v && v !== key) return v;
    }
    return fallback;
  }

  function localizeProcess(proc) {
    if (!proc) return proc;
    const id = proc.id;
    const labelKey = `process.label.${proc.label}`;
    return {
      ...proc,
      label: ti(labelKey, proc.label),
      cta: ti(`process.cta.${id}`, proc.cta),
      ritualLabel: ti(`process.ritual.${id}`, proc.ritualLabel),
      blurb: proc.blurb,
    };
  }

  function processForMethod(method) {
    let proc = null;
    if (method && method.id && ID_PROCESS[method.id]) {
      proc = PROCESSES[ID_PROCESS[method.id]];
    }
    if (!proc) {
      const hay = `${method.name} ${method.summary} ${method.region || ""}`;
      for (const [re, id] of KEYWORD_MAP) {
        if (re.test(hay)) {
          proc = PROCESSES[id];
          break;
        }
      }
    }
    if (!proc) {
      if (method.type === "Fate") proc = PROCESSES.birth;
      else if (method.type === "Form") proc = PROCESSES.form;
      else proc = PROCESSES.omen;
    }
    return localizeProcess(proc);
  }

  /**
   * Photo upload guidance for methods that read from imageable subjects.
   * Returns null when upload is not relevant.
   */
  function photoSubjectForRaw(method) {
    const hay = `${method.name} ${method.summary} ${method.region || ""}`;
    if (/palm|chiromanc|shou xiang|shouxiang|mogu|bone palm|hand line/i.test(hay)) {
      return {
        id: "palm",
        label: "Upload a photo of your palm",
        accept: "image/*",
        hint: "Use the hand you want read. Good light, palm open, fingers slightly apart. Avoid heavy filters.",
        placeholderTrait: "e.g. deep life line, clear heart line, prominent Venus mount…",
        required: true,
      };
    }
    if (/face|mian xiang|mianxiang|physiognom|metoposcop/i.test(hay)) {
      return {
        id: "face",
        label: "Upload a photo of your face",
        accept: "image/*",
        hint: "Front-facing portrait, even lighting, neutral expression. Hair not covering key features.",
        placeholderTrait: "e.g. broad forehead, high cheekbones, deep-set eyes…",
        required: true,
      };
    }
    if (/mole|moleosoph/i.test(hay)) {
      return {
        id: "mole",
        label: "Upload a photo showing the mole(s)",
        accept: "image/*",
        hint: "Frame the area clearly (face, neck, hand, etc.).",
        placeholderTrait: "e.g. mole on left cheek, raised dark mole near brow…",
        required: true,
      };
    }
    if (/nail|onychomanc/i.test(hay)) {
      return {
        id: "nails",
        label: "Upload a photo of your nails / hands",
        accept: "image/*",
        hint: "Natural nails in clear light work best.",
        placeholderTrait: "e.g. almond shape, pale lunulae, vertical ridges…",
        required: true,
      };
    }
    if (/samudrika/i.test(hay)) {
      return {
        id: "body",
        label: "Upload a photo for body-mark reading",
        accept: "image/*",
        hint: "Hands, face, or the feature you want considered. Keep it respectful and clear.",
        placeholderTrait: "e.g. long fingers, marked brow, distinctive gait note…",
        required: true,
      };
    }
    if (/feng shui|vastu|kasō|kaso|house|grave|boso/i.test(hay)) {
      return {
        id: "place",
        label: "Upload a photo of the place / plan",
        accept: "image/*",
        hint: "Floor plan sketch, entrance, or room photo. North orientation helps if you know it.",
        placeholderTrait: "e.g. south-facing door, cluttered SE corner, L-shaped lot…",
        required: false,
      };
    }
    if (/grapholog|handwriting|seal|insō/i.test(hay)) {
      return {
        id: "writing",
        label: "Upload a photo of the writing / seal",
        accept: "image/*",
        hint: "Clear scan or photo of a handwriting sample or seal impression.",
        placeholderTrait: "e.g. right-slanted script, heavy pressure, open loops…",
        required: true,
      };
    }
    if (/aura/i.test(hay)) {
      return {
        id: "aura",
        label: "Optional: upload a portrait for aura focus",
        accept: "image/*",
        hint: "A calm portrait helps you hold the subject in mind (symbolic reading only).",
        placeholderTrait: "e.g. sensed gold rim, heavy grey near shoulders…",
        required: false,
      };
    }
    if (method.type === "Form") {
      return {
        id: "form",
        label: "Optional: upload a reference photo",
        accept: "image/*",
        hint: "Any clear image of the form you want read.",
        placeholderTrait: "Describe the main trait…",
        required: false,
      };
    }
    return null;
  }

  function localizePhoto(photo) {
    if (!photo) return null;
    const loc = window.FatumI18n ? window.FatumI18n.getLocale() : "en";
    if (!String(loc || "").startsWith("zh")) return photo;
    const hant = String(loc).startsWith("zh-Hant");
    const ZH = {
      palm: {
        label: hant ? "上傳手掌照片" : "上传手掌照片",
        hint: hant
          ? "使用你想解讀的那隻手。光線充足、掌心張開、手指略分開。避免重度濾鏡。"
          : "使用你想解读的那只手。光线充足、掌心张开、手指略分开。避免重度滤镜。",
        placeholderTrait: hant
          ? "例如：生命線深、感情線清晰、金星丘明顯…"
          : "例如：生命线深、感情线清晰、金星丘明显…",
      },
      face: {
        label: hant ? "上傳面部照片" : "上传面部照片",
        hint: hant
          ? "正面肖像、光線均勻、表情自然。頭髮勿遮住關鍵部位。"
          : "正面肖像、光线均匀、表情自然。头发勿遮住关键部位。",
        placeholderTrait: hant
          ? "例如：額寬、顴骨高、眼睛深邃…"
          : "例如：额宽、颧骨高、眼睛深邃…",
      },
      mole: {
        label: hant ? "上傳顯示痣的照片" : "上传显示痣的照片",
        hint: hant ? "清楚框出部位（臉、頸、手等）。" : "清楚框出部位（脸、颈、手等）。",
        placeholderTrait: hant
          ? "例如：左頰痣、眉旁凸起深色痣…"
          : "例如：左颊痣、眉旁凸起深色痣…",
      },
      nails: {
        label: hant ? "上傳指甲／手部照片" : "上传指甲／手部照片",
        hint: hant ? "自然指甲、光線清楚最佳。" : "自然指甲、光线清楚最佳。",
        placeholderTrait: hant
          ? "例如：杏仁形、月牙淡、縱向紋…"
          : "例如：杏仁形、月牙淡、纵向纹…",
      },
      body: {
        label: hant ? "上傳身體標記解讀用照片" : "上传身体标记解读用照片",
        hint: hant
          ? "手、臉或你想考量的部位。請保持尊重與清晰。"
          : "手、脸或你想考量的部位。请保持尊重与清晰。",
        placeholderTrait: hant
          ? "例如：手指長、眉有標記、步態特別…"
          : "例如：手指长、眉有标记、步态特别…",
      },
      place: {
        label: hant ? "上傳場所／平面圖照片" : "上传场所／平面图照片",
        hint: hant
          ? "平面草圖、入口或房間照片。若知方位，標出北向更佳。"
          : "平面草图、入口或房间照片。若知方位，标出北向更佳。",
        placeholderTrait: hant
          ? "例如：南向門、東南角雜亂、L 形地塊…"
          : "例如：南向门、东南角杂乱、L 形地块…",
      },
      writing: {
        label: hant ? "上傳字跡／印章照片" : "上传字迹／印章照片",
        hint: hant
          ? "清楚掃描或拍攝字跡樣本或印痕。"
          : "清楚扫描或拍摄字迹样本或印痕。",
        placeholderTrait: hant
          ? "例如：右斜字體、力道重、環圈開…"
          : "例如：右斜字体、力道重、环圈开…",
      },
      aura: {
        label: hant ? "可選：上傳肖像作為氣場焦點" : "可选：上传肖像作为气场焦点",
        hint: hant
          ? "平靜肖像有助你心中握住對象（僅象徵解讀）。"
          : "平静肖像有助你心中握住对象（仅象征解读）。",
        placeholderTrait: hant
          ? "例如：感到金邊、肩旁灰重…"
          : "例如：感到金边、肩旁灰重…",
      },
      form: {
        label: hant ? "可選：上傳參考照片" : "可选：上传参考照片",
        hint: hant ? "任何清晰的形相圖像。" : "任何清晰的形相图像。",
        placeholderTrait: hant ? "描述主要特質…" : "描述主要特质…",
      },
    };
    const z = ZH[photo.id];
    if (!z) return photo;
    return { ...photo, ...z };
  }

  function photoSubjectForLocalized(method) {
    return localizePhoto(photoSubjectForRaw(method));
  }

  function hashSeed(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function mulberry32(a) {
    return function () {
      let t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pick(rng, arr) {
    return arr[Math.floor(rng() * arr.length)];
  }

  function toneFromRng(rng) {
    const n = rng();
    if (n < 0.28) return "bright";
    if (n < 0.55) return "mixed";
    if (n < 0.78) return "caution";
    return "deep";
  }

  function zodiacWestern(month, day) {
    const signs = [
      [1, 20, "Capricorn"], [2, 19, "Aquarius"], [3, 20, "Pisces"], [4, 20, "Aries"],
      [5, 21, "Taurus"], [6, 21, "Gemini"], [7, 22, "Cancer"], [8, 23, "Leo"],
      [9, 23, "Virgo"], [10, 23, "Libra"], [11, 22, "Scorpio"], [12, 22, "Sagittarius"], [12, 32, "Capricorn"],
    ];
    for (const [m, d, s] of signs) {
      if (month < m || (month === m && day <= d)) return s;
    }
    return "Capricorn";
  }

  function lifePath(dateStr) {
    const digits = dateStr.replace(/\D/g, "").split("").map(Number);
    let sum = digits.reduce((a, b) => a + b, 0);
    while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
      sum = String(sum).split("").map(Number).reduce((a, b) => a + b, 0);
    }
    return sum;
  }

  function generateReading(method, process, input) {
    const RM = window.FatumResultModel;
    const seedStr = [
      method.id,
      process.id,
      input.question || "",
      input.birthDate || "",
      input.dayDate || "",
      input.formTrait || "",
      input.formFocus || "",
      String(input.nonce || 0),
    ].join("|");
    const rng = mulberry32(hashSeed(seedStr));
    let tone = toneFromRng(rng);
    const symbol = pick(rng, SYMBOLS[method.type] || SYMBOLS.Omen);
    const q = RM ? RM.focusLabel(input) : (input.question || input.focus || "");

    const reading = {
      methodId: method.id,
      methodName: method.name,
      processId: process.id,
      processLabel: process.label,
      tone,
      symbol,
      title: "",
      result: "",
      explain: "",
      interpret: "",
      doList: [],
      dontList: [],
      details: [],
      disclaimer: RM
        ? RM.honestyFooter(method.name)
        : "Simulated reading in the style of this tradition—for reflection and learning, not authentic initiatory practice or medical/legal/financial advice. May be inaccurate; cannot predict black swan events.",
    };

    if (process.id === "birth") {
      const d = input.birthDate ? new Date(input.birthDate + "T12:00:00") : new Date();
      const month = d.getMonth() + 1;
      const day = d.getDate();
      const year = d.getFullYear();
      const animal = ANIMALS[(year - 4 + 12 * 10) % 12];
      const element = ELEMENTS[Math.floor((((year - 4) % 10) + 10) % 10 / 2)];
      const sign = zodiacWestern(month, day);
      const path = lifePath(input.birthDate || d.toISOString().slice(0, 10));
      reading.title = `${element} ${animal} · ${sign}`;
      reading.result = `Birth signature: ${element} ${animal}, western-style sign ${sign}, life-path number ${path}.`;
      reading.explain = [
        `Computed from the date you entered (${input.birthDate || "today"}), in a simplified calendrical / zodiac style used for education — not a full traditional chart.`,
        `Animal: ${animal}; element cycle tag: ${element}; tropical sign band: ${sign}; digit-reduced life-path: ${path}.`,
        "These labels are cultural mnemonics. They do not prove personality or destiny.",
      ].join(" ");
      reading.details = [
        `Birth signature styled after ${method.name}.`,
        `Sign band: ${sign}; animal: ${animal} (${element}).`,
        `Life-path number (digit reduction): ${path}.`,
      ];
    } else if (process.id === "blood") {
      const raw = String(input.bloodType || "A").toUpperCase();
      const key = BLOOD_TYPE_TRAITS[raw] ? raw : "A";
      const trait = BLOOD_TYPE_TRAITS[key];
      const focus = String(input.question || "").trim();
      reading.title = trait.title;
      reading.result = `ABO type selected: ${key} · popular lean “${trait.lean}”`;
      reading.explain = [
        `In the popular East Asian blood-type personality frame used with ${method.name}, type ${key} is stereotyped as ${trait.lean}.`,
        trait.note,
        "ABO type is a real antigen system for medicine; it is not a validated determinant of personality or destiny. This reading is cultural folklore for reflection only.",
        focus ? `You asked the counsel to speak to: “${focus}”.` : "",
      ]
        .filter(Boolean)
        .join(" ");
      reading.details = [
        `Blood type chosen: ${key}.`,
        `Stereotype lean (folklore): ${trait.lean}.`,
        "Not a medical or psychological assessment.",
      ];
      tone = key === "A" ? "caution" : key === "O" ? "bright" : key === "B" ? "mixed" : "deep";
      reading.tone = tone;
    } else if (process.id === "name") {
      const nameIn = String(input.personName || input.question || "Seeker").trim() || "Seeker";
      const letters = nameIn.replace(/[^\p{L}\p{N}]/gu, "");
      const count = [...letters].length || nameIn.length;
      const vowelish = (letters.match(/[aeiouａｅｉｏｕあいうえお]/gi) || []).length;
      const path = ((count % 9) || 9);
      const focus = String(input.question || "").trim();
      reading.title = `${nameIn} · name number ${path}`;
      reading.result = `Name signature: “${nameIn}” · letter/character count ${count} · reduced number ${path}`;
      reading.explain = [
        `Name rites in the spirit of ${method.name} weigh sounds, strokes, or letter totals as symbolic tags.`,
        `Here “${nameIn}” yields count ${count} and a digit-style name number ${path} (with ${vowelish} vowel-like marks noted).`,
        "This is an educational name-weighing toy — not a guarantee about character, marriage, or fortune.",
        focus && focus !== nameIn ? `Focus held: “${focus}”.` : "",
      ]
        .filter(Boolean)
        .join(" ");
      reading.details = [
        `Name entered: ${nameIn}.`,
        `Count: ${count}; name number: ${path}.`,
        `Styled after ${method.name}.`,
      ];
      tone = path <= 3 ? "bright" : path >= 7 ? "deep" : "mixed";
      reading.tone = tone;
    } else if (process.id === "cards") {
      const deck = TAROT_LIKE.slice();
      const cards = [];
      for (let i = 0; i < 3 && deck.length; i++) {
        const idx = Math.floor(rng() * deck.length);
        cards.push(deck.splice(idx, 1)[0]);
      }
      const labels = ["Past", "Present", "Path"];
      reading.title = cards.map((c) => c.name).join(" · ");
      reading.result = cards.map((c, i) => `${labels[i]}: ${c.name}`).join(" · ");
      reading.explain = cards.map((c, i) => `${labels[i]} — ${c.name}: ${c.upright}`).join(" ");
      reading.details = cards.map((c, i) => `${labels[i]} — ${c.name}: ${c.upright}`);
    } else if (process.id === "cast" && /i ching|zhou|hexagram|liu yao|plum|qimen|liu ren/i.test(method.name + method.summary)) {
      const hx = pick(rng, HEXAGRAMS);
      reading.title = `${hx.lines} ${hx.name}`;
      reading.result = `Hexagram-style figure: ${hx.lines} ${hx.name}`;
      reading.explain = `${hx.meaning} Drawn in the educational spirit of ${method.name} — a symbolic counsel line, not a classical full-text Yì reading.`;
      reading.details = [hx.meaning, `Method frame: ${method.name}.`];
    } else if (process.id === "cast" && /if[aá]|odu|cowrie|búzio|dilogg|mérìnd|obi|afa|sikidy/i.test(method.name + method.summary)) {
      const odu = pick(rng, ODU_LIKE);
      reading.title = odu.name;
      reading.result = `Oracular figure (simulated): ${odu.name}`;
      reading.explain = `${odu.verse} This is a teaching-style lot figure inspired by ${method.name}, not an initiatory Odu determination by a trained priest.`;
      reading.details = [odu.verse, `Styled after ${method.name} lot-casting.`];
    } else if (process.id === "cast" && /rune|ogham|futhorc|futhark/i.test(method.name + method.summary)) {
      const r1 = pick(rng, RUNES);
      const r2 = pick(rng, RUNES);
      const n1 = procZh() ? r1.nameZh || r1.name : r1.name;
      const n2 = procZh() ? r2.nameZh || r2.name : r2.name;
      const g1 = procT(r1.glossZh, r1.glossHant, r1.gloss);
      const g2 = procT(r2.glossZh, r2.glossHant, r2.gloss);
      reading.title = `${n1} · ${n2}`;
      reading.result = procT(
        `抽到符文：${n1}（${g1}）与 ${n2}（${g2}）。合起来提醒你：把技能／启示用在能带来归属与喜悦的一步上——不是在回答“何时”，而是问你愿不愿先做那一步。`,
        `抽到符文：${n1}（${g1}）與 ${n2}（${g2}）。合起來提醒你：把技能／啟示用在能帶來歸屬與喜悅的一步上——不是在回答「何時」，而是問你願不願先做那一步。`,
        `Drawn staves: ${n1} (${g1}) and ${n2} (${g2}). Together they cue: put craft/insight into one step that can bring belonging or joy — not an answer to “when,” but a question of whether you’ll take that step.`
      );
      reading.explain = procT(
        `${n1}：${g1}。${n2}：${g2}。这些是常见的现代研习关键词，不是保证的历史一字译。结合你的问题读：符文给的是行动主题，不是日期或命运时刻表。`,
        `${n1}：${g1}。${n2}：${g2}。這些是常見的現代研習關鍵詞，不是保證的歷史一字譯。結合你的問題讀：符文給的是行動主題，不是日期或命運時刻表。`,
        `${n1}: ${g1}. ${n2}: ${g2}. Gloss meanings are common modern study keywords — not guaranteed historical one-word translations. Read beside your question: runes give an action theme, not a date or fate timetable.`
      );
      reading.details = [
        procT(`符文一：${n1} — ${g1}`, `符文一：${n1} — ${g1}`, `Stave 1: ${n1} — ${g1}`),
        procT(`符文二：${n2} — ${g2}`, `符文二：${n2} — ${g2}`, `Stave 2: ${n2} — ${g2}`),
      ];
    } else if (process.id === "cast") {
      const faces = Math.floor(rng() * 8) + 1;
      reading.title = `Pattern ${faces}`;
      reading.result = `Lots settled on pattern ${faces}`;
      reading.explain = `In this simulation of ${method.name}, pattern ${faces} is assigned a ${tone} reflective lean. The number itself carries no scientific predictive power.`;
      reading.details = [`Pattern ${faces}.`, `Reflective lean: ${tone}.`];
    } else if (process.id === "dice") {
      const a = 1 + Math.floor(rng() * 6);
      const b = 1 + Math.floor(rng() * 6);
      reading.title = `${a} + ${b} = ${a + b}`;
      reading.result = `Thrown faces: ${a} and ${b} (sum ${a + b})`;
      reading.explain = `Sum ${a + b} is mapped to a ${tone} reflective frame for ${method.name}. Dice faces are random; the mapping is educational symbolism only.`;
      reading.details = [`Faces ${a} and ${b}.`, `Sum ${a + b} → reflective lean “${tone}”.`];
    } else if (process.id === "book") {
      const verses = [
        "Wherever the river bends, the boat that listens arrives.",
        "A closed hand cannot receive the lantern.",
        "Name the fear once; it loses half its teeth.",
        "The garden remembers every seed you thought forgotten.",
        "Between two answers, choose the one that lets you sleep.",
      ];
      const v = pick(rng, verses);
      reading.title = "Opened verse";
      reading.result = `Verse drawn: “${v}”`;
      reading.explain = `Bibliomancy-style line for ${method.name}. Let the sentence sit beside your question; do not force a literal prophecy out of poetry.`;
      reading.details = [v, `Interpreted through ${method.name}.`];
    } else if (process.id === "form") {
      const photo = input.photoMeta;
      reading.title = `Form of ${input.formTrait || "the seeker"}`;
      reading.result = `Observation noted: “${input.formTrait || "unspecified"}” · focus “${input.formFocus || "overall path"}”${photo ? " · photo attached" : ""}`;
      reading.explain = [
        `Form rites in the spirit of ${method.name} treat visible traits as conversation starters.`,
        photo
          ? `A photo (${photo.subjectLabel}) was held locally as reference — the app does not run biometric prediction on it.`
          : "No photo was uploaded; only your written notes are used.",
        "Any counsel below is reflective framing from your notes, not a medical or character diagnosis.",
      ].join(" ");
      reading.details = [
        `Trait noted: ${input.formTrait || "unspecified"}.`,
        `Focus: ${input.formFocus || "overall path"}.`,
        photo
          ? `Photo received (${photo.subjectLabel}) — kept in this browser only.`
          : "No photo uploaded — reading from written notes alone.",
      ];
      reading.photoDataUrl = input.photoDataUrl || null;
      reading.photoSubject = photo?.subjectId || null;
    } else if (process.id === "pendulum") {
      const ans = rng() < 0.5 ? "Yes" : "No";
      const lean = rng() < 0.35 ? "strongly" : rng() < 0.7 ? "clearly" : "softly";
      reading.title = ans;
      reading.result = `Pendulum simulation: ${ans} (${lean})`;
      reading.explain = `A random swing was generated for teaching the yes/no pendulum format used with ${method.name}. The ${lean} ${ans} is not evidence about the real world — only a prompt to notice how you react to ${ans}.`;
      reading.details = [
        `Answer shown: ${ans} (${lean}).`,
        "Ask again only if the question changed — not if you dislike the answer.",
      ];
      tone = ans === "No" ? "caution" : "bright";
      reading.tone = tone;
    } else if (process.id === "day") {
      const score = Math.floor(rng() * 5);
      const labels = ["Inauspicious", "Mixed — caution", "Neutral", "Favorable", "Highly auspicious"];
      reading.title = labels[score];
      reading.result = `Almanac lean for ${input.dayDate || "today"} / “${input.dayPurpose || "general affairs"}”: ${labels[score]}`;
      reading.explain = `This is a simulated day-selection lean in the style of ${method.name}. Traditional almanacs use calendar rules; here the lean is generated for education and is not an astronomical or statistical claim about that date.`;
      reading.details = [
        `Date: ${input.dayDate || "today"} for “${input.dayPurpose || "general affairs"}”.`,
        `Shown lean: ${labels[score]}.`,
      ];
      tone = score >= 3 ? "bright" : score <= 1 ? "caution" : "mixed";
      reading.tone = tone;
    } else {
      const omens = [
        "Symbolic sign: movement across the field (left → right).",
        "Symbolic sign: vertical rise (smoke / vapor standing).",
        "Symbolic sign: thinning at the center (fog lifting).",
        "Symbolic sign: a sudden stillness.",
        "Symbolic sign: warmth without wind.",
      ];
      const omen = pick(rng, omens);
      reading.title = "Sign received";
      reading.result = omen;
      reading.explain = `An omen-watching simulation for ${method.name}. The sign is generated symbolically so you can practice interpretation — it is not a report of something that happened outdoors.`;
      reading.details = [omen, `Symbolic field of ${method.name}.`];
    }

    const framePack = procZh() ? (procHant() ? EXPLAIN_FRAMES_HANT : EXPLAIN_FRAMES_ZH) : EXPLAIN_FRAMES;
    const frame = pick(rng, framePack[tone] || framePack.mixed);
    reading.explain = `${reading.explain} ${frame}`.trim();
    const interpretBody =
      process.id === "pendulum"
        ? procT(
            `留意身体对「${reading.title}」的反应。若你立刻想重问，有用的信息可能是那股冲动——不是指针本身。`,
            `留意身體對「${reading.title}」的反應。若你立刻想重問，有用的資訊可能是那股衝動——不是指針本身。`,
            `Notice your body's reaction to “${reading.title}”. If you immediately want a redo, the useful data may be that urge — not the swing.`
          )
        : process.id === "form"
          ? procT(
              `把记下的特征与你的焦点对照，不要跳到固定性格结论。问自己：即便符号错了，怎样的行为仍会让这次解读有用？`,
              `把記下的特徵與你的焦點對照，不要跳到固定性格結論。問自己：即便符號錯了，怎樣的行為仍會讓這次解讀有用？`,
              `Relate the noted trait to your focus without leaping to fixed character claims. Ask: what behavior would make this reading useful even if the symbols are wrong?`
            )
          : process.id === "cast" && /rune|ogham|futhorc|futhark/i.test(method.name + method.summary)
            ? procT(
                `你问的是「${q || "未写明的事"}」。符文给的是主题与态度，不是日期表。把标题里的两符关键词，翻译成你今天能做的一步；再用日常证据核对——尤其别把“何时”类问题交给抽签。`,
                `你問的是「${q || "未寫明的事"}」。符文給的是主題與態度，不是日期表。把標題裡的兩符關鍵詞，翻譯成你今天能做的一步；再用日常證據核對——尤其別把「何時」類問題交給抽籤。`,
                `You asked about “${q || "an unnamed matter"}”. Runes give theme and stance, not a timetable. Turn the two stave keywords into one step you can take today; then check ordinary evidence — especially do not hand “when” questions to lots.`
              )
            : procT(
                `把「${tone}」倾向当作你所问之事的透镜，然后用日常证据检验任何行动。`,
                `把「${tone}」傾向當作你所問之事的透鏡，然後用日常證據檢驗任何行動。`,
                `Use the ${tone} lean as a lens on the matter you named — then test any action against ordinary evidence.`
              );

    // Avoid double bilingual lead: write a single-locale interpret paragraph.
    reading.interpret = interpretBody;
    const guide = RM ? RM.reflectiveGuidance(tone) : { doList: [], dontList: [] };
    reading.doList = guide.doList.slice();
    reading.dontList = guide.dontList.slice();

    // Process-specific do/don't overlays (still non-predictive)
    if (process.id === "pendulum") {
      reading.doList = [
        procT(
          `若保留「${reading.title}」，写下一个没有钟摆也说得通的可逆下一步。`,
          `若保留「${reading.title}」，寫下一個沒有鐘擺也說得通的可逆下一步。`,
          `If you keep the “${reading.title}”, write one reversible next step that would still make sense without the pendulum.`
        ),
        procT(
          "把问题改写成真正二元、且关于你能控制之事的问法。",
          "把問題改寫成真正二元、且關於你能控制之事的問法。",
          "Rephrase the question once so it is truly binary and about something you control."
        ),
      ];
      reading.dontList = [
        procT("不要为了相反答案而反复重问同一问题。", "不要為了相反答案而反覆重問同一問題。", "Do not re-ask the same question hoping for the opposite swing."),
        procT(
          "不要让模拟是／否压过医疗、法律、财务或安全判断。",
          "不要讓模擬是／否壓過醫療、法律、財務或安全判斷。",
          "Do not let a simulated yes/no override medical, legal, financial, or safety judgment."
        ),
      ];
    } else if (process.id === "blood") {
      reading.doList = [
        procT(
          "若刻板印象有共鸣，点名你已在选择的行为——不是抗原——让它变得有用。",
          "若刻板印象有共鳴，點名你已在選擇的行為——不是抗原——讓它變得有用。",
          "If a stereotype resonates, name the behavior you already choose — not the antigen — that makes it useful."
        ),
        procT("把医学血型事实与性格民俗分开。", "把醫學血型事實與性格民俗分開。", "Keep medical blood-type facts separate from personality folklore."),
      ];
      reading.dontList = [
        procT("不要用 ABO 血型招聘、相亲或排斥他人。", "不要用 ABO 血型招聘、相親或排斥他人。", "Do not use ABO type to hire, date, or exclude people."),
        procT("不要把这当作医疗、遗传或心理诊断。", "不要把這當作醫療、遺傳或心理診斷。", "Do not treat this as a medical, genetic, or psychological diagnosis."),
      ];
    } else if (process.id === "name") {
      reading.doList = [
        procT(
          "若姓名数触发想法，把它译成这周能试验的一个具体习惯。",
          "若姓名數觸發想法，把它譯成這週能試驗的一個具體習慣。",
          "If the name number sparks an idea, translate it into one concrete habit you can test this week."
        ),
      ];
      reading.dontList = [
        procT("不要只因玩具计算“不吉”就改名或要求他人改名。", "不要只因玩具計算「不吉」就改名或要求他人改名。", "Do not rename yourself or others solely because a toy calculation looked unlucky."),
      ];
    } else if (process.id === "day") {
      reading.doList.unshift(
        reading.tone === "caution" || reading.tone === "mixed"
          ? procT(
              "若这天重要，保持计划弹性，并用通书以外的方式核实后勤。",
              "若這天重要，保持計劃彈性，並用通書以外的方式核實後勤。",
              "If the day matters, keep plans flexible and verify logistics independently of the almanac lean."
            )
          : procT(
              "若继续推进，仍要用普通来源确认时间、出行与承诺。",
              "若繼續推進，仍要用普通來源確認時間、出行與承諾。",
              "If you proceed, still confirm times, travel, and commitments with ordinary sources."
            )
      );
      reading.dontList.unshift(
        procT(
          "不要只因模拟倾向不吉就取消必要的照护或义务。",
          "不要只因模擬傾向不吉就取消必要的照護或義務。",
          "Do not cancel necessary care or obligations solely because a simulated lean looks inauspicious."
        )
      );
    } else if (process.id === "cards") {
      reading.doList.unshift(
        procT("行动前，为每张牌的主题点出一个真实生活事实。", "行動前，為每張牌的主題點出一個真實生活事實。", "Name one real fact from your life that matches each card’s theme before acting.")
      );
      reading.dontList.unshift(
        procT("不要把“指引”牌当成带日期的预言。", "不要把「指引」牌當成帶日期的預言。", "Do not treat the Path card as a dated prediction.")
      );
    } else if (process.id === "cast" && /rune|ogham|futhorc|futhark/i.test(method.name + method.summary) && q) {
      reading.doList.unshift(
        procT(
          `围绕「${q}」，把两符关键词写成今天可做的一步（可逆、可核实）。`,
          `圍繞「${q}」，把兩符關鍵詞寫成今天可做的一步（可逆、可核實）。`,
          `Around “${q}”, turn the two stave keywords into one reversible, checkable step today.`
        )
      );
      reading.dontList.unshift(
        procT(
          "不要向符文索取准确日期或“何时一定发生”。",
          "不要向符文索取準確日期或「何時一定發生」。",
          "Do not demand an exact date or “when it must happen” from runes."
        )
      );
    }

    if (q) {
      reading.details.unshift(procT(`你的问题：「${q}」`, `你的問題：「${q}」`, `Your input: “${q}”`));
    }

    return RM ? RM.structuredReading(reading) : reading;
  }

  window.FATE_PROCESSES = PROCESSES;
  window.fateProcessForMethod = processForMethod;
  window.fatePhotoSubjectFor = photoSubjectForLocalized;
  window.fateGenerateReading = generateReading;
})();
