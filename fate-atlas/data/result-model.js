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

  function aboutQuestion(q) {
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
