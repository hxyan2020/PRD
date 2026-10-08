/**
 * Plain-language, step-by-step “how this rite works” for the studio intro.
 * Educational — describes this site’s play flow, not initiatory training.
 */
(function () {
  "use strict";

  function placeOf(method) {
    if (method.region) return method.region;
    if (method.countries && method.countries.length) return method.countries.slice(0, 2).join(", ");
    return method.continent || "";
  }

  function firstSentence(summary) {
    const s = String(summary || "").replace(/\s+/g, " ").trim();
    if (!s) return "";
    const cut = s.split(/(?<=[.!?])\s+/)[0] || s;
    return cut.length > 180 ? cut.slice(0, 177).trimEnd() + "…" : cut;
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
  };

  function t(key, vars) {
    return window.FatumI18n ? window.FatumI18n.t(key, vars) : "";
  }

  function locSteps(prefix, count, fallback) {
    const steps = [];
    for (let i = 1; i <= count; i++) {
      const title = t(`${prefix}.${i}t`);
      const body = t(`${prefix}.${i}b`);
      if (title && title !== `${prefix}.${i}t`) steps.push({ title, body });
      else if (fallback && fallback[i - 1]) steps.push(fallback[i - 1]);
    }
    return steps;
  }

  function stepsForProcess(method, process) {
    const m = method || {};
    const text = window.FatumMethodText ? window.FatumMethodText.localize(m) : m;
    const name = text.name || m.name || t("howrite.thisRite") || "this rite";
    const place = placeOf(m);
    const where = place ? t("howrite.where", { place }) : "";
    const summary = text.summary || m.summary;
    const bitRaw = firstSentence(summary);
    const bit = bitRaw ? ` ${bitRaw}` : "";
    const photo = window.fatePhotoSubjectFor?.(method);

    const procId = process?.id || "omen";
    const prefix = `howrite.${procId}`;
    const intro = t(`${prefix}.intro`, { name, where, bit }) || `${name}${where}`;
    const steps = locSteps(prefix, 3);
    if (procId === "form" && photo && steps[0]) {
      steps[0] = {
        title: photo.label,
        body: t("howrite.form.photoBody", { hint: photo.hint }),
      };
    }
    return { intro, steps };
  }

  const FEATURED_COUNTS = { bagua: 5, tarot: 4, mbti: 4, ifa: 3 };

  function howItWorksFor(method, process) {
    const id = method?.id;
    const featuredCount = FEATURED_COUNTS[id];
    if (featuredCount) {
      const fallback = BY_ID[id];
      return {
        title: t("howrite.title") || fallback.title || "How this rite works",
        intro: t(`howrite.${id}.intro`) || fallback.intro,
        steps: locSteps(`howrite.${id}`, featuredCount, fallback.steps),
        note: t("howrite.note"),
      };
    }
    const base = stepsForProcess(method || {}, process || window.fateProcessForMethod?.(method));
    return {
      title: t("howrite.title") || "How this rite works",
      intro: base.intro,
      steps: base.steps,
      note: t("howrite.note"),
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
