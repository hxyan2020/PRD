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

  function stepsForProcess(method, process) {
    const name = method.name || "this rite";
    const place = placeOf(method);
    const where = place ? ` from ${place}` : "";
    const bit = firstSentence(method.summary);
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

  function howItWorksFor(method, process) {
    const override = BY_ID[method?.id];
    const base = override || stepsForProcess(method || {}, process || window.fateProcessForMethod?.(method));
    return {
      title: "How this rite works",
      intro: base.intro,
      steps: base.steps,
      note: "Educational play on this site — not a substitute for trained initiatory practice, medicine, law, or safety judgment.",
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
