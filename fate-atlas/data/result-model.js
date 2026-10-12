/**
 * Shared helpers for honest, structured reading results.
 * Never invent predictive facts — frame symbols as reflective prompts.
 */
(function () {
  "use strict";

  function clip(str, n) {
    const s = String(str || "").trim();
    if (!s) return "";
    return s.length <= n ? s : s.slice(0, n - 1).trimEnd() + "…";
  }

  function questionOf(input) {
    if (!input) return "";
    return (
      String(input.question || input.focus || input.formFocus || input.dayPurpose || "").trim()
    );
  }

  function focusLabel(input) {
    const q = questionOf(input);
    if (q) return q;
    if (input?.formTrait) return `form noted as “${input.formTrait}”`;
    if (input?.birthDate) return `birth date ${input.birthDate}`;
    if (input?.dayDate) return `day ${input.dayDate}`;
    return "";
  }

  /**
   * Build a structured reading payload. Legacy fields (omen/verdict/counsel/timing/details)
   * stay filled for journal compatibility.
   */
  function structuredReading(base) {
    const result = String(base.result || base.title || "").trim();
    const explain = String(base.explain || "").trim();
    const interpret = String(base.interpret || "").trim();
    const doList = Array.isArray(base.doList) ? base.doList.filter(Boolean) : [];
    const dontList = Array.isArray(base.dontList) ? base.dontList.filter(Boolean) : [];
    const details = Array.isArray(base.details) ? base.details.filter(Boolean) : [];

    return {
      ...base,
      result,
      explain,
      interpret,
      doList,
      dontList,
      details,
      // Legacy mirrors — keep UI/journal from going blank on old code paths
      omen: base.omen || result,
      verdict: base.verdict || explain,
      counsel: base.counsel || (doList[0] || interpret),
      timing: base.timing || (dontList[0] || ""),
      title: base.title || result,
    };
  }

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

  function aboutQuestion(q) {
    if (isZh()) {
      if (!q) {
        return isHant()
          ? "未持定具體問題。請把符號當作心中已有之事的鏡子——而非預報。"
          : "未持定具体问题。请把符号当作心中已有之事的镜子——而非预报。";
      }
      return isHant()
        ? `放在你的輸入「${clip(q, 160)}」旁，下列符號是反思框架，不是將發生之事的證據。`
        : `放在你的输入「${clip(q, 160)}」旁，下列符号是反思框架，不是将发生之事的证据。`;
    }
    if (!q) {
      return "No specific question was held. Read the symbols as a general mirror for whatever is already on your mind — not as a forecast.";
    }
    return `Held beside your input “${clip(q, 160)}”, the symbols below are a reflective frame, not evidence of what will happen.`;
  }

  function interpretWithQuestion(q, body) {
    const lead = aboutQuestion(q);
    const core = String(body || "").trim();
    return core ? `${lead} ${core}` : lead;
  }

  /** Soft reflective guidance by tone — never timed predictions. */
  function reflectiveGuidance(tone) {
    if (isZh()) {
      const h = isHant();
      switch (tone) {
        case "bright":
          return {
            doList: [
              h
                ? "說出一個已覺真實的具體下一步，不必等更強的兆頭再行動。"
                : "说出一个已觉真实的具体下一步，不必等更强的兆头再行动。",
              h
                ? "把計畫告訴一位能溫和現實檢驗你的人。"
                : "把计划告诉一位能温和现实检验你的人。",
            ],
            dontList: [
              h
                ? "不要把有利符號當成跳過盡職調查的許可。"
                : "不要把有利符号当成跳过尽职调查的许可。",
              h
                ? "不要把金錢、健康、法律或安全決策綁在這次解讀上。"
                : "不要把金钱、健康、法律或安全决策绑在这次解读上。",
            ],
          };
        case "caution":
          return {
            doList: [
              h ? "停一拍，列出若倉促會失去什麼。" : "停一拍，列出若仓促会失去什么。",
              h ? "先守護已奏效之事，再擴張。" : "先守护已奏效之事，再扩张。",
            ],
            dontList: [
              h
                ? "格局在請你等待或修復時，不要硬逼出「是」。"
                : "格局在请你等待或修复时，不要硬逼出「是」。",
              h
                ? "不要用「等待」解讀永遠迴避必要的艱難對話。"
                : "不要用「等待」解读永远回避必要的艰难对话。",
            ],
          };
        case "deep":
          return {
            doList: [
              h
                ? "行動前用一句話寫下問題底下的感受。"
                : "行动前用一句话写下问题底下的感受。",
              h
                ? "讓問題過一夜；留意清晨仍留下什麼。"
                : "让问题过一夜；留意清晨仍留下什么。",
            ],
            dontList: [
              h ? "不要把判斷外包給單次抽取。" : "不要把判断外包给单次抽取。",
              h
                ? "不要發明符號並未要求的緊迫感。"
                : "不要发明符号并未要求的紧迫感。",
            ],
          };
        case "mixed":
        default:
          return {
            doList: [
              h
                ? "在兩股拉力中選一，做一次小而可逆的試驗。"
                : "在两股拉力中选一，做一次小而可逆的试验。",
              h
                ? "用文字釐清取捨：你得到什麼、放下什麼。"
                : "用文字厘清取舍：你得到什么、放下什么。",
            ],
            dontList: [
              h
                ? "不要同時全力抓住兩個對立動作。"
                : "不要同时全力抓住两个对立动作。",
              h
                ? "不要把含糊讀成隱藏的保證。"
                : "不要把含糊读成隐藏的保证。",
            ],
          };
      }
    }
    switch (tone) {
      case "bright":
        return {
          doList: [
            "Name one concrete next step that already feels true, and take it without waiting for a stronger omen.",
            "Share the plan with one person who can reality-check you kindly.",
          ],
          dontList: [
            "Do not treat a favorable symbol as permission to skip due diligence.",
            "Do not bind money, health, legal, or safety decisions to this reading.",
          ],
        };
      case "caution":
        return {
          doList: [
            "Pause one beat and list what you would lose if you rush.",
            "Protect what already works before expanding.",
          ],
          dontList: [
            "Do not force a yes where the pattern is asking for wait or repair.",
            "Do not use a ‘wait’ reading as an excuse to avoid a needed hard conversation forever.",
          ],
        };
      case "deep":
        return {
          doList: [
            "Write the feeling under the question in one sentence before acting.",
            "Give the question a night’s sleep; notice what remains in the morning.",
          ],
          dontList: [
            "Do not outsource your judgment to a single draw.",
            "Do not invent urgency the symbols did not ask for.",
          ],
        };
      case "mixed":
      default:
        return {
          doList: [
            "Choose one of the two pulls and give it a small, reversible trial.",
            "Clarify the trade-off in writing: what you gain vs what you set down.",
          ],
          dontList: [
            "Do not try to hold both opposing moves at full force.",
            "Do not read ambiguity as a hidden guarantee.",
          ],
        };
    }
  }

  function honestyFooter(methodName) {
    if (isZh()) {
      const n = methodName || (isHant() ? "此儀式" : "此仪式");
      return isHant()
        ? `以「${n}」精神所作的教育模擬。僅象徵／反思——非已驗證的預報、診斷或命令。可能不準；無法預測黑天鵝事件。`
        : `以「${n}」精神所作的教育模拟。仅象征／反思——非已验证的预报、诊断或命令。可能不准；无法预测黑天鹅事件。`;
    }
    return `Educational simulation in the spirit of ${methodName || "this rite"}. Symbolic / reflective only — not a validated forecast, diagnosis, or command. May be inaccurate; cannot predict black swan events.`;
  }

  window.FatumResultModel = {
    clip,
    questionOf,
    focusLabel,
    structuredReading,
    aboutQuestion,
    interpretWithQuestion,
    reflectiveGuidance,
    honestyFooter,
  };
})();
