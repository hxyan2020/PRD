/**
 * Plain-language, step-by-step “how this rite works” for the studio intro.
 * Educational — describes this site’s play flow, not initiatory training.
 */
(function () {
  "use strict";

  function locale() {
    try {
      return window.FatumI18n ? window.FatumI18n.getLocale() : "en";
    } catch (_) {
      return "en";
    }
  }

  function isZh() {
    return String(locale() || "").startsWith("zh");
  }

  function isHant() {
    return String(locale() || "").startsWith("zh-Hant");
  }

  function ti(key, fallback) {
    if (window.FatumI18n) {
      const v = window.FatumI18n.t(key);
      if (v && v !== key) return v;
    }
    return fallback || key;
  }

  function methodPlace(method) {
    if (window.FatumMethodText) {
      const text = window.FatumMethodText.localize(method);
      if (text.region) return text.region;
    }
    if (method.region) return method.region;
    if (method.countries && method.countries.length) {
      return method.countries
        .slice(0, 2)
        .map((c) =>
          window.FatumCountries
            ? window.FatumCountries.localizedCountryName(c, locale())
            : c
        )
        .join(isZh() ? "、" : ", ");
    }
    if (method.continent && window.FatumI18n) {
      return window.FatumI18n.t(`continent.${method.continent}`) || method.continent;
    }
    return method.continent || "";
  }

  function methodName(method) {
    if (window.FatumMethodText) return window.FatumMethodText.localize(method).name;
    return method.name || (isZh() ? "此仪式" : "this rite");
  }

  function firstSentence(summary) {
    const s = String(summary || "").replace(/\s+/g, " ").trim();
    if (!s) return "";
    const cut = s.split(/(?<=[.!?。！？])\s*/)[0] || s;
    return cut.length > 180 ? cut.slice(0, 177).trimEnd() + "…" : cut;
  }

  function methodSummary(method) {
    if (window.FatumMethodText) return window.FatumMethodText.localize(method).summary;
    return method.summary || "";
  }

  /** Hand-tuned plain steps for featured / distinctive rites. */
  const BY_ID = {
    bagua: {
      intro:
        "This is the three-coin Yijing method: six coin tosses build one hexagram from the bottom up. You will play it step by step here.",
      steps: [
        {
          title: "Hold one clear question",
          body: "Classical practice: one matter per hexagram. Keep it in mind while the coins are cast.",
        },
        {
          title: "Toss three coins, six times",
          body: "Each toss makes one line. Heads = 3, tails = 2. The sums 6 / 7 / 8 / 9 decide yin or yang, and whether the line is changing.",
        },
        {
          title: "Stack lines from bottom to top",
          body: "Line 1 is the bottom (beginning). Line 6 is the top (outer face). Together they form two trigrams — lower and upper.",
        },
        {
          title: "Read primary, then change",
          body: "If any line is changing (6 or 9), read the primary hexagram first (present condition), then the transformed figure (direction of change).",
        },
        {
          title: "Get a plain-language reading",
          body: "We explain the symbols, relate them to your question as a reflective mirror, and offer consider-doing / consider-not-doing notes — not a guaranteed forecast.",
        },
      ],
    },
    tarot: {
      intro:
        "A three-card Major Arcana spread. Only the 22 big archetypal cards are used (The Fool through The World).",
      steps: [
        {
          title: "Name what you seek",
          body: "Open questions work best (“What surrounds…”, “How can I…”). Strict yes/no is usually too narrow for tarot.",
        },
        {
          title: "Shuffle and cut",
          body: "The deck is shuffled with your question held. You cut once; three cards are set aside as Past · Present · Path.",
        },
        {
          title: "Reveal one card at a time",
          body: "Each card may be upright or reversed. You flip Past, then Present, then Path, so the story builds in order.",
        },
        {
          title: "Read the story together",
          body: "We explain each card’s meaning, weave them with your question, and suggest reflective do / don’t notes. Cards are random; meanings are symbolic.",
        },
      ],
    },
    mbti: {
      intro:
        "A short preference quiz inspired by MBTI. It describes how you tend to attend to the world — not ability, worth, or a fixed destiny.",
      steps: [
        {
          title: "Optional focus",
          body: "You may name an area (work, relationship, creative path) so the closing counsel can speak to it.",
        },
        {
          title: "Answer 12 forced choices",
          body: "Each item picks one side of a letter pair: E/I (energy), S/N (information), T/F (decisions), J/P (lifestyle).",
        },
        {
          title: "Tally your four letters",
          body: "Majorities on each pair become a type code (for example ENFP). Ties lean toward one side for a clean code.",
        },
        {
          title: "Reflective path note",
          body: "You get a plain explanation of the pattern plus do / don’t style prompts. This is self-description for reflection — not a forecast of events.",
        },
      ],
    },
    ifa: {
      intro:
        "Ifá is a Yoruba oracular tradition. On this site you play an educational lot simulation — not a babaláwo initiation or real Odù consultation.",
      steps: [
        {
          title: "Hold your question",
          body: "Name the matter you want counsel on. In living practice, a trained priest would cast and recite verses; here we simulate the cast for learning.",
        },
        {
          title: "Cast the lots",
          body: "Traditionally palm nuts or an ọ̀pẹ̀lẹ̀ chain produce one of 256 Odù. This app settles a symbolic figure in that spirit.",
        },
        {
          title: "Read the figure plainly",
          body: "We explain what appeared, how it can be read as a mirror for your question, and reflective do / don’t notes — clearly labeled as educational.",
        },
      ],
    },
    "blood-type": {
      intro:
        "Blood-type personality (ketsueki-gata) maps ABO groups onto popular character stereotypes. Medicine uses ABO for transfusion; fate claims are unsupported.",
      steps: [
        {
          title: "Choose A, B, O, or AB",
          body: "Pick the antigen type you know from a medical test or donor card. Optional: name a focus (work, love, self-image).",
        },
        {
          title: "See the folklore lean",
          body: "We show the common stereotype tags linked to that type in East Asian pop culture — not a lab report about your character.",
        },
        {
          title: "Keep medicine and folklore apart",
          body: "Use any resonance as optional reflection. Do not hire, date, or exclude people by ABO type.",
        },
      ],
    },
  };

  const BY_ID_ZH = {
    bagua: {
      intro: "这是三钱《周易》起卦法：六次掷币自下而上组成一卦。你将在此逐步体验。",
      steps: [
        { title: "抱定一个清楚的问题", body: "古典做法：一卦一事。掷币时把问题放在心里。" },
        {
          title: "掷三枚铜钱，共六次",
          body: "每次得一线。正面＝3、背面＝2。总和 6／7／8／9 决定阴阳与是否变爻。",
        },
        {
          title: "自下而上叠爻",
          body: "初爻在最下（开始），上爻在最上（外层）。上下各成一卦（内卦／外卦）。",
        },
        {
          title: "先读本卦，再看之卦",
          body: "若有变爻（6 或 9），先读本卦（当下），再读变后之卦（变化方向）。",
        },
        {
          title: "得到白话解读",
          body: "我们解释符号、对照你的问题作反思之镜，并给出可做／慎做提示——不是保证应验的预言。",
        },
      ],
    },
    tarot: {
      intro: "三张大阿卡纳牌阵。仅用二十二张原型牌（愚者至世界）。",
      steps: [
        {
          title: "说出你所求",
          body: "开放式问题最合适（「围绕……的是什么」「我可以如何……」）。硬性是否题对塔罗通常过窄。",
        },
        {
          title: "洗牌与切牌",
          body: "心中抱定问题洗牌。你切一次；抽出三张，对应过去 · 现在 · 道路。",
        },
        {
          title: "逐张翻开",
          body: "每张可能正位或逆位。依次翻开过去、现在、道路，故事按序展开。",
        },
        {
          title: "一起读故事",
          body: "我们说明每张含义、织入你的问题，并给出反思性可做／慎做提示。牌序随机；含义是象征。",
        },
      ],
    },
    mbti: {
      intro: "受 MBTI 启发的短偏好测验。描述你倾向如何关注世界——不是能力、价值或固定命运。",
      steps: [
        { title: "可选焦点", body: "可写一个领域（工作、关系、创作路径），让收尾建议更有针对性。" },
        {
          title: "回答 12 道迫选题",
          body: "每题选字母对的一侧：E/I（能量）、S/N（信息）、T/F（决策）、J/P（生活方式）。",
        },
        {
          title: "汇总四个字母",
          body: "每对多数成为类型码（如 ENFP）。平手时倾向一侧以给出完整编码。",
        },
        {
          title: "反思路径提示",
          body: "你得到模式说明与可做／慎做式提示。这是自我描述供反思——不是事件预报。",
        },
      ],
    },
    ifa: {
      intro:
        "伊法是约鲁巴神谕传统。本站提供教育性抽签模拟——不是祭司入门或真实奥杜问询。",
      steps: [
        {
          title: "抱定问题",
          body: "说出你想请教的事。活态传统中由受训祭司起卦诵经；此处仅作学习模拟。",
        },
        {
          title: "掷签起卦",
          body: "传统上以棕榈坚果或欧佩勒链得到二百五十六种奥杜之一。本应用给出同精神的象征结果。",
        },
        {
          title: "白话读图",
          body: "我们说明出现了什么、如何作问题之镜，以及反思性可做／慎做——并标明为教育用途。",
        },
      ],
    },
    "blood-type": {
      intro:
        "血型性格把 ABO 血型对应到流行的性格刻板印象。医学用血型做输血匹配；命运说法并无可靠证据。",
      steps: [
        {
          title: "选择 A、B、O 或 AB",
          body: "选择你从化验或献血卡得知的抗原型。可选：写一个关注点（工作、感情、自我形象）。",
        },
        {
          title: "查看民俗倾向",
          body: "我们展示东亚流行文化里该血型的常见标签——不是关于你性格的化验报告。",
        },
        {
          title: "把医学与民俗分开",
          body: "若有共鸣，仅作可选反思。不要用血型来招聘、相亲或排斥他人。",
        },
      ],
    },
  };

  const BY_ID_ZH_HANT = {
    bagua: {
      intro: "這是三錢《周易》起卦法：六次擲幣自下而上組成一卦。你將在此逐步體驗。",
      steps: [
        { title: "抱定一個清楚的問題", body: "古典做法：一卦一事。擲幣時把問題放在心裡。" },
        {
          title: "擲三枚銅錢，共六次",
          body: "每次得一線。正面＝3、背面＝2。總和 6／7／8／9 決定陰陽與是否變爻。",
        },
        {
          title: "自下而上疊爻",
          body: "初爻在最下（開始），上爻在最上（外層）。上下各成一卦（內卦／外卦）。",
        },
        {
          title: "先讀本卦，再看之卦",
          body: "若有變爻（6 或 9），先讀本卦（當下），再讀變後之卦（變化方向）。",
        },
        {
          title: "得到白話解讀",
          body: "我們解釋符號、對照你的問題作反思之鏡，並給出可做／慎做提示——不是保證應驗的預言。",
        },
      ],
    },
    tarot: {
      intro: "三張大阿卡納牌陣。僅用二十二張原型牌（愚者至世界）。",
      steps: [
        {
          title: "說出你所求",
          body: "開放式問題最適合（「圍繞……的是什麼」「我可以如何……」）。硬性是否題對塔羅通常過窄。",
        },
        {
          title: "洗牌與切牌",
          body: "心中抱定問題洗牌。你切一次；抽出三張，對應過去 · 現在 · 道路。",
        },
        {
          title: "逐張翻開",
          body: "每張可能正位或逆位。依次翻開過去、現在、道路，故事按序展開。",
        },
        {
          title: "一起讀故事",
          body: "我們說明每張含義、織入你的問題，並給出反思性可做／慎做提示。牌序隨機；含義是象徵。",
        },
      ],
    },
    mbti: {
      intro: "受 MBTI 啟發的短偏好測驗。描述你傾向如何關注世界——不是能力、價值或固定命運。",
      steps: [
        { title: "可選焦點", body: "可寫一個領域（工作、關係、創作路徑），讓收尾建議更有針對性。" },
        {
          title: "回答 12 道迫選題",
          body: "每題選字母對的一側：E/I（能量）、S/N（資訊）、T/F（決策）、J/P（生活方式）。",
        },
        {
          title: "彙總四個字母",
          body: "每對多數成為類型碼（如 ENFP）。平手時傾向一側以給出完整編碼。",
        },
        {
          title: "反思路徑提示",
          body: "你得到模式說明與可做／慎做式提示。這是自我描述供反思——不是事件預報。",
        },
      ],
    },
    ifa: {
      intro:
        "伊法是約魯巴神諭傳統。本站提供教育性抽籤模擬——不是祭司入門或真實奧杜問詢。",
      steps: [
        {
          title: "抱定問題",
          body: "說出你想請教的事。活態傳統中由受訓祭司起卦誦經；此處僅作學習模擬。",
        },
        {
          title: "擲籤起卦",
          body: "傳統上以棕櫚堅果或歐佩勒鏈得到二百五十六種奧杜之一。本應用給出同精神的象徵結果。",
        },
        {
          title: "白話讀圖",
          body: "我們說明出現了什麼、如何作問題之鏡，以及反思性可做／慎做——並標明為教育用途。",
        },
      ],
    },
    "blood-type": {
      intro:
        "血型性格把 ABO 血型對應到流行的性格刻板印象。醫學用血型做輸血匹配；命運說法並無可靠證據。",
      steps: [
        {
          title: "選擇 A、B、O 或 AB",
          body: "選擇你從化驗或獻血卡得知的抗原型。可選：寫一個關注點（工作、感情、自我形象）。",
        },
        {
          title: "查看民俗傾向",
          body: "我們展示東亞流行文化裡該血型的常見標籤——不是關於你性格的化驗報告。",
        },
        {
          title: "把醫學與民俗分開",
          body: "若有共鳴，僅作可選反思。不要用血型來招聘、相親或排斥他人。",
        },
      ],
    },
  };

  function stepsForProcessEn(method, process) {
    const name = methodName(method);
    const place = methodPlace(method);
    const where = place ? ` from ${place}` : "";
    const bit = firstSentence(methodSummary(method));
    const photo = window.fatePhotoSubjectFor?.(method);

    switch (process?.id) {
      case "birth":
        return {
          intro: `${name}${where} builds a symbolic birth signature from a date you enter. ${bit}`,
          steps: [
            {
              title: "Enter a birth date",
              body: "Use your own date (or another you have permission to explore). Optional: add a focus for the reading.",
            },
            {
              title: "Derive tradition-style labels",
              body: "We compute simplified calendrical / zodiac-style tags in the spirit of this method (not a full professional chart).",
            },
            {
              title: "Read as a mirror",
              body: "You get what was computed, what it traditionally suggests as symbolism, and reflective do / don’t notes — not a scientific forecast.",
            },
          ],
        };
      case "blood":
        return {
          intro: `${name}${where} maps an ABO blood type onto popular personality folklore. ${bit}`,
          steps: [
            {
              title: "Choose your blood type",
              body: "Pick A, B, O, or AB — the antigen group used in transfusion medicine. Optional: add a focus (work, relationship, self-image).",
            },
            {
              title: "See the folklore tags",
              body: "We show the common East Asian stereotype lean for that type. This is cultural pop lore, not a lab result about character.",
            },
            {
              title: "Read as a mirror — not medicine",
              body: "ABO type is medically real; personality and fate claims are not validated. Use any resonance as optional reflection only.",
            },
          ],
        };
      case "name":
        return {
          intro: `${name}${where} weighs a name’s letters or strokes as a symbolic signature. ${bit}`,
          steps: [
            {
              title: "Enter a name",
              body: "Use your own name (or another you have permission to explore). Optional: add a focus for the reading.",
            },
            {
              title: "Derive name-style labels",
              body: "We compute simple counts and a reduced “name number” in the spirit of this method — not a professional onomantic chart.",
            },
            {
              title: "Read as a mirror",
              body: "You get symbolic tags and reflective do / don’t notes — not a guarantee about marriage, career, or destiny.",
            },
          ],
        };
      case "cards":
        return {
          intro: `${name}${where} draws symbolic cards and reads them together. ${bit}`,
          steps: [
            { title: "Hold a question", body: "Name what you want the cards to speak to." },
            {
              title: "Draw three cards",
              body: "A simulated shuffle sets Past · Present · Path (or a similar three-beat spread).",
            },
            {
              title: "Explain and relate",
              body: "Each card is explained in plain language, then tied to your question as reflection — not a dated prediction.",
            },
          ],
        };
      case "cast":
        return {
          intro: `${name}${where} settles an answer by casting lots, tokens, or figures. ${bit}`,
          steps: [
            {
              title: "Ask one clear question",
              body: "Keep a single matter in mind. Changing the question mid-cast confuses the reading.",
            },
            {
              title: "Cast in this tradition’s style",
              body: "Coins, shells, bones, slips, or boards — we simulate the cast that belongs to this rite.",
            },
            {
              title: "Read the pattern",
              body: "We show what appeared, explain the symbols, relate them to your question, and offer consider-doing / consider-not-doing prompts.",
            },
          ],
        };
      case "dice":
        return {
          intro: `${name}${where} lets thrown faces speak. ${bit}`,
          steps: [
            { title: "Ask", body: "State the question you want the throw to address." },
            { title: "Throw", body: "Dice or bone faces are cast (simulated here)." },
            {
              title: "Interpret the numbers",
              body: "We explain the faces/sum as a symbolic lean and relate it to your question without inventing timed prophecies.",
            },
          ],
        };
      case "book":
        return {
          intro: `${name}${where} opens a text as if at random and reads the line beside your question. ${bit}`,
          steps: [
            { title: "Hold your question", body: "Name what you want the opened line to sit beside." },
            { title: "Open the page", body: "A verse or lot slip is selected (bibliomancy-style simulation)." },
            {
              title: "Let the line speak as a prompt",
              body: "We explain the drawn line and how you might use it as reflection — not as a literal prophecy.",
            },
          ],
        };
      case "form":
        return {
          intro: `${name}${where} reads visible form. ${bit}`,
          steps: [
            {
              title: photo ? photo.label : "Note what you see",
              body: photo
                ? `${photo.hint} Then write the trait you want emphasized.`
                : "Describe the main trait or observation you want read.",
            },
            {
              title: "Name a focus",
              body: "Career, character, relationship, health curiosity, etc. — so the counsel has a target.",
            },
            {
              title: "Reflective form reading",
              body: "We treat your notes (and photo, if any) as conversation starters. This is not medical diagnosis or proven destiny science.",
            },
          ],
        };
      case "pendulum":
        return {
          intro: `${name}${where} answers a yes/no question with a swing. ${bit}`,
          steps: [
            {
              title: "Ask a true yes/no question",
              body: "About something you can act on. Avoid stacked questions (“Should I quit and move abroad?”).",
            },
            {
              title: "Watch the swing",
              body: "A simulated pendulum settles yes or no (with a soft/clear/strong lean).",
            },
            {
              title: "Notice your reaction",
              body: "We explain that ideomotor motion can drive real pendulums. Use the answer as a prompt to notice bias — not as proof about the world.",
            },
          ],
        };
      case "day":
        return {
          intro: `${name}${where} checks whether a date favors a purpose. ${bit}`,
          steps: [
            { title: "Pick a date and purpose", body: "Travel, signing, ceremony, general affairs — be specific." },
            {
              title: "Consult the almanac lean",
              body: "We show a tradition-style auspicious / mixed / inauspicious lean for learning (not an astronomical guarantee).",
            },
            {
              title: "Plan with ordinary evidence too",
              body: "Keep logistics, safety, and commitments grounded in real-world checks either way.",
            },
          ],
        };
      case "omen":
      default:
        return {
          intro: `${name}${where} watches for signs in its symbolic field. ${bit}`,
          steps: [
            { title: "Name what you seek", body: "Say what kind of guidance or sign you are asking for." },
            {
              title: "Gather a sign",
              body: "In tradition this might be birds, smoke, dreams, tracks, or other omens. Here we simulate a sign in that spirit.",
            },
            {
              title: "Interpret plainly",
              body: "We explain the sign, relate it to your question as a mirror, and suggest reflective do / don’t notes — not a black-swan forecast.",
            },
          ],
        };
    }
  }

  function stepsForProcessZh(method, process, hant) {
    const name = methodName(method);
    const place = methodPlace(method);
    const where = place ? (hant ? `（來自${place}）` : `（来自${place}）`) : "";
    const bit = firstSentence(methodSummary(method));
    const photo = window.fatePhotoSubjectFor?.(method);

    const S = hant
      ? {
          birth: {
            intro: `${name}${where}會依你輸入的日期生成象徵性的命盤標籤。${bit}`,
            steps: [
              { title: "輸入出生日期", body: "使用你自己的日期（或你有權探索的日期）。可選：加上解讀焦點。" },
              {
                title: "推導傳統風格標籤",
                body: "我們計算簡化的曆法／生肖式標籤，取其精神（非完整專業命盤）。",
              },
              {
                title: "當作鏡子來讀",
                body: "你會看到計算結果、傳統象徵含義，以及反思性可做／慎做——不是科學預報。",
              },
            ],
          },
          blood: {
            intro: `${name}${where}把 ABO 血型對應到流行的性格說法。${bit}`,
            steps: [
              {
                title: "選擇你的血型",
                body: "選擇 A、B、O 或 AB——醫學輸血用的抗原分型。可選：加上關注點（工作、關係、自我形象）。",
              },
              {
                title: "查看民俗標籤",
                body: "我們展示該血型在東亞流行文化中的常見刻板印象。這是民俗流行說法，不是性格化驗單。",
              },
              {
                title: "當作鏡子來讀——不是醫學",
                body: "血型在醫學上真實；性格／命運說法並無可靠證據。若有共鳴，僅作可選反思。",
              },
            ],
          },
          name: {
            intro: `${name}${where}以姓名的字音、筆畫或字母作象徵簽名。${bit}`,
            steps: [
              {
                title: "輸入姓名",
                body: "使用你自己的名字（或你有權探索的名字）。可選：加上解讀焦點。",
              },
              {
                title: "推導姓名風格標籤",
                body: "我們計算簡化的字數／字母計數與「姓名數」，取其精神——非專業姓名學命盤。",
              },
              {
                title: "當作鏡子來讀",
                body: "你會得到象徵標籤與反思性可做／慎做——不是婚配、事業或命運的保證。",
              },
            ],
          },
          cards: {
            intro: `${name}${where}抽出象徵紙牌並一起解讀。${bit}`,
            steps: [
              { title: "抱定問題", body: "說出你希望紙牌回應的事。" },
              { title: "抽三張牌", body: "模擬洗牌後設為過去 · 現在 · 道路（或類似三拍結構）。" },
              {
                title: "解釋並聯繫",
                body: "每張牌用白話說明，再對照你的問題作反思——不是標註日期的預言。",
              },
            ],
          },
          cast: {
            intro: `${name}${where}以擲簽、籌碼或格局來定答。${bit}`,
            steps: [
              { title: "問一個清楚的問題", body: "心中只留一件事。中途改題會讓解讀混亂。" },
              {
                title: "依此傳統起卦",
                body: "銅錢、貝殼、骨塊、籤條或盤式——我們模擬屬於此儀式的起卦方式。",
              },
              {
                title: "讀出格局",
                body: "我們展示結果、解釋符號、對照問題，並給出可做／慎做提示。",
              },
            ],
          },
          dice: {
            intro: `${name}${where}讓擲出的點面說話。${bit}`,
            steps: [
              { title: "提問", body: "說出你希望這次投擲回應的問題。" },
              { title: "投擲", body: "骰子或骨面被擲出（此處為模擬）。" },
              {
                title: "解讀數字",
                body: "我們把點面／總和解釋為象徵傾向，並聯繫你的問題，不編造定時預言。",
              },
            ],
          },
          book: {
            intro: `${name}${where}彷彿隨機翻開文本，把句子放在問題旁來讀。${bit}`,
            steps: [
              { title: "抱定問題", body: "說出你希望翻開的句子坐在哪件事旁邊。" },
              { title: "翻開書頁", body: "選出一句經文或籤詩（書卷占模擬）。" },
              {
                title: "讓句子作提示",
                body: "我們說明抽到的句子，以及你如何把它當反思——而非字面預言。",
              },
            ],
          },
          form: {
            intro: `${name}${where}閱讀可見的形相。${bit}`,
            steps: [
              {
                title: photo ? photo.label : "記下你所見",
                body: photo
                  ? `${photo.hint} 然後寫下你想強調的特質。`
                  : "描述你希望被解讀的主要特質或觀察。",
              },
              { title: "說出焦點", body: "事業、性格、關係、健康好奇等——讓建議有對象。" },
              {
                title: "反思性形相解讀",
                body: "我們把你的筆記（與照片，如有）當對話起點。這不是醫療診斷或已驗證的命運科學。",
              },
            ],
          },
          pendulum: {
            intro: `${name}${where}以擺動回答是否題。${bit}`,
            steps: [
              {
                title: "問真正的是否題",
                body: "關於你能採取行動的事。避免疊加問題（「我該離職並移居國外嗎？」）。",
              },
              { title: "觀察擺動", body: "模擬擺錘給出是或否（帶柔／清／強傾向）。" },
              {
                title: "留意你的反應",
                body: "我們說明真實擺錘常受意動效應影響。把答案當察覺偏見的提示——不是世界證據。",
              },
            ],
          },
          day: {
            intro: `${name}${where}查看某日是否利於某事。${bit}`,
            steps: [
              { title: "選日期與目的", body: "旅行、簽約、儀式、一般事務——請具體。" },
              {
                title: "查閱曆書傾向",
                body: "我們展示傳統風格的吉／平／凶傾向供學習（非天文保證）。",
              },
              {
                title: "仍用日常證據規劃",
                body: "無論如何，行程、安全與承諾仍要以現實核對為準。",
              },
            ],
          },
          omen: {
            intro: `${name}${where}在其象徵場域中觀兆。${bit}`,
            steps: [
              { title: "說出你所求", body: "說明你想要哪種指引或徵兆。" },
              {
                title: "收集一個徵兆",
                body: "傳統中可能是鳥、煙、夢、足跡等。此處模擬同精神的徵兆。",
              },
              {
                title: "白話解讀",
                body: "我們解釋徵兆、作問題之鏡，並給出反思性可做／慎做——不是黑天鵝預報。",
              },
            ],
          },
        }
      : {
          birth: {
            intro: `${name}${where}会依你输入的日期生成象征性的命盘标签。${bit}`,
            steps: [
              { title: "输入出生日期", body: "使用你自己的日期（或你有权探索的日期）。可选：加上解读焦点。" },
              {
                title: "推导传统风格标签",
                body: "我们计算简化的历法／生肖式标签，取其精神（非完整专业命盘）。",
              },
              {
                title: "当作镜子来读",
                body: "你会看到计算结果、传统象征含义，以及反思性可做／慎做——不是科学预报。",
              },
            ],
          },
          blood: {
            intro: `${name}${where}把 ABO 血型对应到流行的性格说法。${bit}`,
            steps: [
              {
                title: "选择你的血型",
                body: "选择 A、B、O 或 AB——医学输血用的抗原分型。可选：加上关注点（工作、关系、自我形象）。",
              },
              {
                title: "查看民俗标签",
                body: "我们展示该血型在东亚流行文化中的常见刻板印象。这是民俗流行说法，不是性格化验单。",
              },
              {
                title: "当作镜子来读——不是医学",
                body: "血型在医学上真实；性格／命运说法并无可靠证据。若有共鸣，仅作可选反思。",
              },
            ],
          },
          name: {
            intro: `${name}${where}以姓名的字音、笔画或字母作象征签名。${bit}`,
            steps: [
              {
                title: "输入姓名",
                body: "使用你自己的名字（或你有权探索的名字）。可选：加上解读焦点。",
              },
              {
                title: "推导姓名风格标签",
                body: "我们计算简化的字数／字母计数与「姓名数」，取其精神——非专业姓名学命盘。",
              },
              {
                title: "当作镜子来读",
                body: "你会得到象征标签与反思性可做／慎做——不是婚配、事业或命运的保证。",
              },
            ],
          },
          cards: {
            intro: `${name}${where}抽出象征纸牌并一起解读。${bit}`,
            steps: [
              { title: "抱定问题", body: "说出你希望纸牌回应的事。" },
              { title: "抽三张牌", body: "模拟洗牌后设为过去 · 现在 · 道路（或类似三拍结构）。" },
              {
                title: "解释并联系",
                body: "每张牌用白话说明，再对照你的问题作反思——不是标注日期的预言。",
              },
            ],
          },
          cast: {
            intro: `${name}${where}以掷签、筹码或格局来定答。${bit}`,
            steps: [
              { title: "问一个清楚的问题", body: "心中只留一件事。中途改题会让解读混乱。" },
              {
                title: "依此传统起卦",
                body: "铜钱、贝壳、骨块、签条或盘式——我们模拟属于此仪式的起卦方式。",
              },
              {
                title: "读出格局",
                body: "我们展示结果、解释符号、对照问题，并给出可做／慎做提示。",
              },
            ],
          },
          dice: {
            intro: `${name}${where}让掷出的点面说话。${bit}`,
            steps: [
              { title: "提问", body: "说出你希望这次投掷回应的问题。" },
              { title: "投掷", body: "骰子或骨面被掷出（此处为模拟）。" },
              {
                title: "解读数字",
                body: "我们把点面／总和解释为象征倾向，并联系你的问题，不编造定时预言。",
              },
            ],
          },
          book: {
            intro: `${name}${where}仿佛随机翻开文本，把句子放在问题旁来读。${bit}`,
            steps: [
              { title: "抱定问题", body: "说出你希望翻开的句子坐在哪件事旁边。" },
              { title: "翻开书页", body: "选出一句经文或签诗（书卷占模拟）。" },
              {
                title: "让句子作提示",
                body: "我们说明抽到的句子，以及你如何把它当反思——而非字面预言。",
              },
            ],
          },
          form: {
            intro: `${name}${where}阅读可见的形相。${bit}`,
            steps: [
              {
                title: photo ? photo.label : "记下你所见",
                body: photo
                  ? `${photo.hint} 然后写下你想强调的特质。`
                  : "描述你希望被解读的主要特质或观察。",
              },
              { title: "说出焦点", body: "事业、性格、关系、健康好奇等——让建议有对象。" },
              {
                title: "反思性形相解读",
                body: "我们把你的笔记（与照片，如有）当对话起点。这不是医疗诊断或已验证的命运科学。",
              },
            ],
          },
          pendulum: {
            intro: `${name}${where}以摆动回答是否题。${bit}`,
            steps: [
              {
                title: "问真正的是否题",
                body: "关于你能采取行动的事。避免叠加问题（「我该离职并移居国外吗？」）。",
              },
              { title: "观察摆动", body: "模拟摆锤给出是或否（带柔／清／强倾向）。" },
              {
                title: "留意你的反应",
                body: "我们说明真实摆锤常受意动效应影响。把答案当察觉偏见的提示——不是世界证据。",
              },
            ],
          },
          day: {
            intro: `${name}${where}查看某日是否利于某事。${bit}`,
            steps: [
              { title: "选日期与目的", body: "旅行、签约、仪式、一般事务——请具体。" },
              {
                title: "查阅历书倾向",
                body: "我们展示传统风格的吉／平／凶倾向供学习（非天文保证）。",
              },
              {
                title: "仍用日常证据规划",
                body: "无论如何，行程、安全与承诺仍要以现实核对为准。",
              },
            ],
          },
          omen: {
            intro: `${name}${where}在其象征场域中观兆。${bit}`,
            steps: [
              { title: "说出你所求", body: "说明你想要哪种指引或征兆。" },
              {
                title: "收集一个征兆",
                body: "传统中可能是鸟、烟、梦、足迹等。此处模拟同精神的征兆。",
              },
              {
                title: "白话解读",
                body: "我们解释征兆、作问题之镜，并给出反思性可做／慎做——不是黑天鹅预报。",
              },
            ],
          },
        };

    const id = process?.id || "omen";
    return S[id] || S.omen;
  }

  function stepsForProcess(method, process) {
    if (isZh()) return stepsForProcessZh(method, process, isHant());
    return stepsForProcessEn(method, process);
  }

  function howItWorksFor(method, process) {
    const id = method?.id;
    // Prefer dedicated Africa-oracle how-to when present (unique per-rite steps)
    if (id && window.FatumAfricaOracles?.howFor?.(id)) {
      const a = window.FatumAfricaOracles.howFor(id);
      return {
        title: ti("howrite.title", a.title || "How this rite works"),
        intro: a.intro,
        steps: a.steps,
        note: a.note || ti(
          "howrite.note",
          "Educational play on this site — not a substitute for trained initiatory practice, medicine, law, or safety judgment."
        ),
      };
    }
    if (id && window.FatumChinaDestiny?.howFor?.(id)) {
      const a = window.FatumChinaDestiny.howFor(id);
      return {
        title: ti("howrite.title", a.title || "How this rite works"),
        intro: a.intro,
        steps: a.steps,
        note: a.note || ti(
          "howrite.note",
          "Educational play on this site — not a substitute for trained initiatory practice, medicine, law, or safety judgment."
        ),
      };
    }
    if (id && window.FatumChinaClassic?.howFor?.(id)) {
      const a = window.FatumChinaClassic.howFor(id);
      return {
        title: ti("howrite.title", a.title || "How this rite works"),
        intro: a.intro,
        steps: a.steps,
        note: a.note || ti(
          "howrite.note",
          "Educational play on this site — not a substitute for trained initiatory practice, medicine, law, or safety judgment."
        ),
      };
    }
    if (id && window.FatumChinaForm?.howFor?.(id)) {
      const a = window.FatumChinaForm.howFor(id);
      return {
        title: ti("howrite.title", a.title || "How this rite works"),
        intro: a.intro,
        steps: a.steps,
        note: a.note || ti(
          "howrite.note",
          "Educational play on this site — not a substitute for trained initiatory practice, medicine, law, or safety judgment."
        ),
      };
    }
    if (id && window.FatumKoreaVietnam?.howFor?.(id)) {
      const a = window.FatumKoreaVietnam.howFor(id);
      return {
        title: ti("howrite.title", a.title || "How this rite works"),
        intro: a.intro,
        steps: a.steps,
        note: a.note || ti(
          "howrite.note",
          "Educational play on this site — not a substitute for trained initiatory practice, medicine, law, or safety judgment."
        ),
      };
    }
    if (id && window.FatumJapanOracles?.howFor?.(id)) {
      const a = window.FatumJapanOracles.howFor(id);
      return {
        title: ti("howrite.title", a.title || "How this rite works"),
        intro: a.intro,
        steps: a.steps,
        note: a.note || ti(
          "howrite.note",
          "Educational play on this site — not a substitute for trained initiatory practice, medicine, law, or safety judgment."
        ),
      };
    }
    if (id && window.FatumSouthAsiaOracles?.howFor?.(id)) {
      const a = window.FatumSouthAsiaOracles.howFor(id);
      return {
        title: ti("howrite.title", a.title || "How this rite works"),
        intro: a.intro,
        steps: a.steps,
        note: a.note || ti(
          "howrite.note",
          "Educational play on this site — not a substitute for trained initiatory practice, medicine, law, or safety judgment."
        ),
      };
    }
    if (id && window.FatumHimalayaSeaOracles?.howFor?.(id)) {
      const a = window.FatumHimalayaSeaOracles.howFor(id);
      return {
        title: ti("howrite.title", a.title || "How this rite works"),
        intro: a.intro,
        steps: a.steps,
        note: a.note || ti(
          "howrite.note",
          "Educational play on this site — not a substitute for trained initiatory practice, medicine, law, or safety judgment."
        ),
      };
    }
    if (id && window.FatumNearEastOracles?.howFor?.(id)) {
      const a = window.FatumNearEastOracles.howFor(id);
      return {
        title: ti("howrite.title", a.title || "How this rite works"),
        intro: a.intro,
        steps: a.steps,
        note: a.note || ti(
          "howrite.note",
          "Educational play on this site — not a substitute for trained initiatory practice, medicine, law, or safety judgment."
        ),
      };
    }
    if (id && window.FatumWestAstroOracles?.howFor?.(id)) {
      const a = window.FatumWestAstroOracles.howFor(id);
      return {
        title: ti("howrite.title", a.title || "How this rite works"),
        intro: a.intro,
        steps: a.steps,
        note: a.note || ti(
          "howrite.note",
          "Educational play on this site — not a substitute for trained initiatory practice, medicine, law, or safety judgment."
        ),
      };
    }
    if (id && window.FatumCartomancyOracles?.howFor?.(id)) {
      const a = window.FatumCartomancyOracles.howFor(id);
      return {
        title: ti("howrite.title", a.title || "How this rite works"),
        intro: a.intro,
        steps: a.steps,
        note: a.note || ti(
          "howrite.note",
          "Educational play on this site — not a substitute for trained initiatory practice, medicine, law, or safety judgment."
        ),
      };
    }
    if (id && window.FatumClassicalEuroOracles?.howFor?.(id)) {
      const a = window.FatumClassicalEuroOracles.howFor(id);
      return {
        title: ti("howrite.title", a.title || "How this rite works"),
        intro: a.intro,
        steps: a.steps,
        note: a.note || ti(
          "howrite.note",
          "Educational play on this site — not a substitute for trained initiatory practice, medicine, law, or safety judgment."
        ),
      };
    }
    if (id && window.FatumFolkScryOracles?.howFor?.(id)) {
      const a = window.FatumFolkScryOracles.howFor(id);
      return {
        title: ti("howrite.title", a.title || "How this rite works"),
        intro: a.intro,
        steps: a.steps,
        note: a.note || ti(
          "howrite.note",
          "Educational play on this site — not a substitute for trained initiatory practice, medicine, law, or safety judgment."
        ),
      };
    }
    let base;
    if (isZh() && id) {
      const pack = isHant() ? BY_ID_ZH_HANT : BY_ID_ZH;
      base = pack[id] || stepsForProcess(method || {}, process || window.fateProcessForMethod?.(method));
    } else {
      base = BY_ID[id] || stepsForProcess(method || {}, process || window.fateProcessForMethod?.(method));
    }
    return {
      title: ti("howrite.title", "How this rite works"),
      intro: base.intro,
      steps: base.steps,
      note: ti(
        "howrite.note",
        "Educational play on this site — not a substitute for trained initiatory practice, medicine, law, or safety judgment."
      ),
    };
  }

  function stepsToPlainList(how) {
    return (how.steps || []).map((s, i) => `${i + 1}. ${s.title}: ${s.body}`);
  }

  window.FatumHowItWorks = {
    for: howItWorksFor,
    stepsToPlainList,
    BY_ID,
  };
})();
