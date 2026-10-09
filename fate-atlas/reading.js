(function () {
  "use strict";

  const G = () => window.FATE_GUIDED;

  function buildMethodIndex() {
    const map = Object.create(null);
    (window.FATE_METHODS || []).forEach((m) => {
      map[m.id] = m;
    });
    // Prefer featured definitions (richer names / guided flags)
    (window.FATE_FEATURED_METHODS || []).forEach((m) => {
      map[m.id] = Object.assign({}, map[m.id] || {}, m);
    });
    return map;
  }

  let methodsById = buildMethodIndex();

  let state = null;

  const studio = document.getElementById("reading-studio");
  const body = document.getElementById("reading-body");
  const titleEl = document.getElementById("reading-title");
  const stepEl = document.getElementById("reading-step");

  function escapeHTML(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function guidedKind(method) {
    if (method.guided) return method.guided;
    if (window.FatumChinaClassic?.has?.(method.id)) return "classic";
    if (window.FatumChinaForm?.has?.(method.id)) return "formchina";
    if (window.FatumKoreaVietnam?.has?.(method.id)) return "koreavn";
    if (window.FatumJapanOracles?.has?.(method.id)) return "japan";
    if (window.FatumSouthAsiaOracles?.has?.(method.id)) return "southasia";
    if (window.FatumHimalayaSeaOracles?.has?.(method.id)) return "himalayasea";
    if (window.FatumNearEastOracles?.has?.(method.id)) return "neareast";
    if (window.FatumWestAstroOracles?.has?.(method.id)) return "westastro";
    if (window.FatumCartomancyOracles?.has?.(method.id)) return "cartomancy";
    if (window.FatumClassicalEuroOracles?.has?.(method.id)) return "classicaleuro";
    if (window.FatumFolkScryOracles?.has?.(method.id)) return "folkscry";
    if (method.id === "bagua") return "bagua";
    if (method.id === "tarot") return "tarot";
    if (method.id === "mbti") return "mbti";
    if (window.FatumAfricaOracles?.has?.(method.id)) return "africa";
    if (window.FatumChinaDestiny?.has?.(method.id)) return "china";
    return null;
  }

  function openStudio(methodId) {
    methodsById = buildMethodIndex();
    let method = methodsById[methodId];
    if (!method) return;

    const kind = guidedKind(method);

    if (kind) {
      state = makeGuidedState(method, kind);
    } else {
      const process = window.fateProcessForMethod(method);
      state = {
        mode: "generic",
        method,
        process,
        stepIndex: 0,
        input: {
          question: "",
          birthDate: "",
          bloodType: "",
          personName: "",
          dayDate: new Date().toISOString().slice(0, 10),
          dayPurpose: "",
          formTrait: "",
          formFocus: "",
          photoDataUrl: "",
          photoName: "",
          photoMeta: null,
          nonce: Date.now() % 100000,
        },
        reading: null,
        journalSaved: false,
        journalTitle: "",
        photoConfig: window.fatePhotoSubjectFor ? window.fatePhotoSubjectFor(method) : null,
      };
    }

    studio.hidden = false;
    document.body.classList.add("studio-open");
    studio.setAttribute("aria-hidden", "false");
    window.FatumPlay?.setQuestProgress?.(0);
    window.FatumPlay?.showToast?.(
      (window.FatumI18n
        ? window.FatumI18n.t("toast.questStarted", {
            name: window.FatumMethodText
              ? window.FatumMethodText.localize(method).name
              : method.name,
          })
        : `Quest started · ${method.name}`),
      { ms: window.matchMedia("(max-width: 720px)").matches ? 1200 : 1800 }
    );
    render();
    studio.querySelector(".studio__close")?.focus();
  }

  function makeGuidedState(method, kind) {
    const base = {
      mode: "guided",
      kind,
      method,
      stepIndex: 0,
      reading: null,
      journalSaved: false,
      journalTitle: "",
      nonce: Date.now() % 100000,
    };
    if (kind === "bagua") {
      return {
        ...base,
        steps: ["intent", "question", "coins", "cast", "result"],
        question: "",
        lines: [],
        castingIndex: 0,
      };
    }
    if (kind === "classic") {
      const rite = window.FatumChinaClassic.get(method.id);
      return {
        ...base,
        steps: (rite && rite.steps) || ["intent", "question", "cast", "result"],
        question: "",
        cast: {},
        birthDate: "",
        numbers: "",
        sight: "plum",
        era: "personal",
        glyph: "",
        casting: false,
      };
    }
    if (kind === "formchina") {
      const rite = window.FatumChinaForm.get(method.id);
      return {
        ...base,
        steps: (rite && rite.steps) || ["intent", "site", "facing", "qi", "result"],
        question: "",
        focus: "",
        cast: {},
        site: "home",
        facing: "S",
        gua: 1,
        period: "9",
        faceZone: "forehead",
        hand: "active",
        palmLine: "life",
        bodyZone: "face",
        casting: false,
      };
    }
    if (kind === "koreavn") {
      const rite = window.FatumKoreaVietnam.get(method.id);
      return {
        ...base,
        steps: (rite && rite.steps) || ["intent", "birth", "sajuHour", "sijusin", "result"],
        question: "",
        focus: "",
        cast: {},
        birthDate: "",
        birthYear: "",
        partnerBirth: "",
        hourIndex: 0,
        gender: "unspecified",
        casting: false,
      };
    }
    if (kind === "japan") {
      const rite = window.FatumJapanOracles.get(method.id);
      return {
        ...base,
        steps: (rite && rite.steps) || ["intent", "question", "shakeTube", "drawSlip", "result"],
        question: "",
        focus: "",
        cast: {},
        birthDate: "",
        birthYear: "",
        dayDate: "",
        personName: "",
        hourIndex: 0,
        houi: "E",
        facing: "S",
        housePlan: "house",
        gogyo: "Wood",
        mansion: "Krittikā-like lodge",
        casting: false,
      };
    }
    if (kind === "southasia") {
      const rite = window.FatumSouthAsiaOracles.get(method.id);
      return {
        ...base,
        steps: (rite && rite.steps) || ["intent", "birth", "nakshatraPick", "dashaReveal", "result"],
        question: "",
        focus: "",
        cast: {},
        birthDate: "",
        dayDate: "",
        personName: "",
        formTrait: "",
        nakshatra: "Aśvinī",
        sublord: "Venus sub",
        bodyZone: "hand",
        breathSide: "right",
        vastuPlan: "home",
        facing: "E",
        nekathHour: "Good nekatha hour",
        casting: false,
      };
    }
    if (kind === "himalayasea") {
      const rite = window.FatumHimalayaSeaOracles.get(method.id);
      return {
        ...base,
        steps: (rite && rite.steps) || ["intent", "birth", "elementAnimal", "tibetanBoard", "result"],
        question: "",
        focus: "",
        cast: {},
        birthDate: "",
        birthYear: "",
        dayDate: "",
        weekday: 0,
        tibElement: "Wood",
        tibAnimal: "Tiger",
        horaHouse: "Self house",
        khmerSign: "Meṣa-like",
        pasaran: "Legi",
        ukuWeek: "Sinta week",
        casting: false,
      };
    }
    if (kind === "neareast") {
      const rite = window.FatumNearEastOracles.get(method.id);
      return {
        ...base,
        steps: (rite && rite.steps) || ["intent", "question", "openDivan", "hafezVerse", "result"],
        question: "",
        focus: "",
        cast: {},
        birthDate: "",
        dayDate: "",
        personName: "",
        planetHour: "Mercury hour",
        manzil: "Al-Sharaṭān",
        firdariaLord: "Sun period",
        mazalSign: "Ṭaleh (Aries)",
        dreamNote: "",
        casting: false,
      };
    }
    if (kind === "westastro") {
      const rite = window.FatumWestAstroOracles.get(method.id);
      return {
        ...base,
        steps: (rite && rite.steps) || ["intent", "birth", "sunSignPick", "westChart", "result"],
        question: "",
        focus: "",
        cast: {},
        birthDate: "",
        personName: "",
        sunSign: "Aries",
        celticTree: "Oak",
        askMoment: "",
        casting: false,
      };
    }
    if (kind === "cartomancy") {
      const rite = window.FatumCartomancyOracles.get(method.id);
      return {
        ...base,
        steps: (rite && rite.steps) || ["intent", "question", "shuffleLenormand", "drawThreeLen", "lenormandSpread", "result"],
        question: "",
        focus: "",
        cast: {},
        suitFocus: "Hearts focus",
        paloFocus: "Oros",
        casting: false,
      };
    }
    if (kind === "classicaleuro") {
      const rite = window.FatumClassicalEuroOracles.get(method.id);
      return {
        ...base,
        steps: (rite && rite.steps) || ["intent", "question", "castYounger", "runeReveal", "youngerCounsel", "result"],
        question: "",
        focus: "",
        cast: {},
        casting: false,
      };
    }
    if (kind === "folkscry") {
      const rite = window.FatumFolkScryOracles.get(method.id);
      return {
        ...base,
        steps: (rite && rite.steps) || ["intent", "question", "gazeCrystal", "scryImage", "scryCounsel", "result"],
        question: "",
        focus: "",
        cast: {},
        dreamNote: "",
        casting: false,
      };
    }
    if (kind === "tarot") {
      return {
        ...base,
        steps: ["intent", "question", "shuffle", "reveal", "result"],
        question: "",
        deck: null,
        drawn: [],
        revealIndex: 0,
      };
    }
    if (kind === "mbti") {
      return {
        ...base,
        steps: ["intent", "focus", "quiz", "result"],
        focus: "",
        answers: {},
        quizIndex: 0,
      };
    }
    if (kind === "africa") {
      const rite = window.FatumAfricaOracles.get(method.id);
      return {
        ...base,
        steps: (rite && rite.steps) || ["intent", "question", "cast", "result"],
        question: "",
        cast: {},
        offering: "water",
        domain: "kin",
        people: "self",
        weekday: 0,
        birthDate: "",
        letters: "",
        dialLetter: "A",
        casting: false,
      };
    }
    if (kind === "china") {
      const rite = window.FatumChinaDestiny.get(method.id);
      return {
        ...base,
        steps: (rite && rite.steps) || ["intent", "birth", "cast", "result"],
        question: "",
        cast: {},
        birthDate: "",
        birthYear: "",
        targetYear: String(new Date().getFullYear()),
        hourIndex: 0,
        gender: "unspecified",
        activity: "travel",
        dayDate: "",
        casting: false,
      };
    }
    return base;
  }

  function closeStudio() {
    studio.hidden = true;
    document.body.classList.remove("studio-open");
    studio.setAttribute("aria-hidden", "true");
    window.FatumPlay?.setQuestProgress?.(0);
  }

  function ti(key, vars) {
    return window.FatumI18n ? window.FatumI18n.t(key, vars) : key;
  }

  function stepMeta() {
    if (!state) return { label: "", total: 0, idx: 0 };
    if (state.mode === "guided") {
      if (state.kind === "bagua") {
        const total = 5;
        let idx = state.stepIndex + 1;
        const coinsLabel = String(window.FatumI18n?.getLocale?.() || "").startsWith("zh")
          ? "备好铜钱"
          : "Ready the coins";
        let label = [
          ti("studio.step.learn"),
          ti("studio.step.question"),
          coinsLabel,
          ti("studio.step.cast"),
          ti("studio.step.reading"),
        ][state.stepIndex] || ti("studio.step.reading");
        if (state.steps[state.stepIndex] === "cast") {
          label = ti("studio.step.castLine", { n: Math.min(state.castingIndex + 1, 6) });
        }
        return { label, total, idx };
      }
      if (state.kind === "classic") {
        const how = window.FatumChinaClassic?.howFor?.(state.method.id);
        const howStep = how?.steps?.[Math.min(state.stepIndex, (how?.steps || []).length - 1)];
        return {
          label: howStep?.title || state.steps[state.stepIndex] || ti("studio.step.learn"),
          total: state.steps.length,
          idx: state.stepIndex + 1,
        };
      }
      if (state.kind === "formchina") {
        const how = window.FatumChinaForm?.howFor?.(state.method.id);
        const howStep = how?.steps?.[Math.min(state.stepIndex, (how?.steps || []).length - 1)];
        return {
          label: howStep?.title || state.steps[state.stepIndex] || ti("studio.step.learn"),
          total: state.steps.length,
          idx: state.stepIndex + 1,
        };
      }
      if (state.kind === "koreavn") {
        const how = window.FatumKoreaVietnam?.howFor?.(state.method.id);
        const howStep = how?.steps?.[Math.min(state.stepIndex, (how?.steps || []).length - 1)];
        return {
          label: howStep?.title || state.steps[state.stepIndex] || ti("studio.step.learn"),
          total: state.steps.length,
          idx: state.stepIndex + 1,
        };
      }
      if (state.kind === "japan") {
        const how = window.FatumJapanOracles?.howFor?.(state.method.id);
        const howStep = how?.steps?.[Math.min(state.stepIndex, (how?.steps || []).length - 1)];
        return {
          label: howStep?.title || state.steps[state.stepIndex] || ti("studio.step.learn"),
          total: state.steps.length,
          idx: state.stepIndex + 1,
        };
      }
      if (state.kind === "southasia") {
        const how = window.FatumSouthAsiaOracles?.howFor?.(state.method.id);
        const howStep = how?.steps?.[Math.min(state.stepIndex, (how?.steps || []).length - 1)];
        return {
          label: howStep?.title || state.steps[state.stepIndex] || ti("studio.step.learn"),
          total: state.steps.length,
          idx: state.stepIndex + 1,
        };
      }
      if (state.kind === "himalayasea") {
        const how = window.FatumHimalayaSeaOracles?.howFor?.(state.method.id);
        const howStep = how?.steps?.[Math.min(state.stepIndex, (how?.steps || []).length - 1)];
        return {
          label: howStep?.title || state.steps[state.stepIndex] || ti("studio.step.learn"),
          total: state.steps.length,
          idx: state.stepIndex + 1,
        };
      }
      if (state.kind === "neareast") {
        const how = window.FatumNearEastOracles?.howFor?.(state.method.id);
        const howStep = how?.steps?.[Math.min(state.stepIndex, (how?.steps || []).length - 1)];
        return {
          label: howStep?.title || state.steps[state.stepIndex] || ti("studio.step.learn"),
          total: state.steps.length,
          idx: state.stepIndex + 1,
        };
      }
      if (state.kind === "westastro") {
        const how = window.FatumWestAstroOracles?.howFor?.(state.method.id);
        const howStep = how?.steps?.[Math.min(state.stepIndex, (how?.steps || []).length - 1)];
        return {
          label: howStep?.title || state.steps[state.stepIndex] || ti("studio.step.learn"),
          total: state.steps.length,
          idx: state.stepIndex + 1,
        };
      }
      if (state.kind === "cartomancy") {
        const how = window.FatumCartomancyOracles?.howFor?.(state.method.id);
        const howStep = how?.steps?.[Math.min(state.stepIndex, (how?.steps || []).length - 1)];
        return {
          label: howStep?.title || state.steps[state.stepIndex] || ti("studio.step.learn"),
          total: state.steps.length,
          idx: state.stepIndex + 1,
        };
      }
      if (state.kind === "classicaleuro") {
        const how = window.FatumClassicalEuroOracles?.howFor?.(state.method.id);
        const howStep = how?.steps?.[Math.min(state.stepIndex, (how?.steps || []).length - 1)];
        return {
          label: howStep?.title || state.steps[state.stepIndex] || ti("studio.step.learn"),
          total: state.steps.length,
          idx: state.stepIndex + 1,
        };
      }
      if (state.kind === "folkscry") {
        const how = window.FatumFolkScryOracles?.howFor?.(state.method.id);
        const howStep = how?.steps?.[Math.min(state.stepIndex, (how?.steps || []).length - 1)];
        return {
          label: howStep?.title || state.steps[state.stepIndex] || ti("studio.step.learn"),
          total: state.steps.length,
          idx: state.stepIndex + 1,
        };
      }
      if (state.kind === "tarot") {
        const labels = [
          ti("studio.step.learn"),
          ti("studio.step.question"),
          ti("studio.step.shuffle"),
          ti("studio.step.reveal"),
          ti("studio.step.reading"),
        ];
        let label = labels[state.stepIndex] || ti("studio.step.reading");
        if (state.steps[state.stepIndex] === "reveal") {
          label = ti("studio.step.revealCard", { n: Math.min(state.revealIndex + 1, 3) });
        }
        return { label, total: 5, idx: state.stepIndex + 1 };
      }
      if (state.kind === "mbti") {
        const qTotal = G().MBTI_QUESTIONS.length;
        if (state.steps[state.stepIndex] === "quiz") {
          return {
            label: ti("studio.step.questionOf", { n: state.quizIndex + 1, total: qTotal }),
            total: qTotal + 3,
            idx: state.quizIndex + 3,
          };
        }
        const labels = [
          ti("studio.step.learn"),
          ti("studio.step.focus"),
          ti("studio.step.quiz"),
          ti("studio.step.typeReading"),
        ];
        return { label: labels[state.stepIndex], total: 4, idx: state.stepIndex + 1 };
      }
      if (state.kind === "africa") {
        const how = window.FatumAfricaOracles?.howFor?.(state.method.id);
        const howStep = how?.steps?.[Math.min(state.stepIndex, (how?.steps || []).length - 1)];
        return {
          label: howStep?.title || state.steps[state.stepIndex] || ti("studio.step.learn"),
          total: state.steps.length,
          idx: state.stepIndex + 1,
        };
      }
      if (state.kind === "china") {
        const how = window.FatumChinaDestiny?.howFor?.(state.method.id);
        const howStep = how?.steps?.[Math.min(state.stepIndex, (how?.steps || []).length - 1)];
        return {
          label: howStep?.title || state.steps[state.stepIndex] || ti("studio.step.learn"),
          total: state.steps.length,
          idx: state.stepIndex + 1,
        };
      }
    }
    const process = state.process;
    return {
      label: process.label,
      total: process.steps.length,
      idx: state.stepIndex + 1,
    };
  }

  function questRatio() {
    if (!state) return 0;
    if (state.mode === "guided" && state.kind === "mbti" && state.steps[state.stepIndex] === "quiz") {
      const total = G().MBTI_QUESTIONS.length;
      return total ? (state.quizIndex + 0.15) / (total + 1) : 0;
    }
    const n =
      state.mode === "guided"
        ? state.steps.length
        : state.process?.steps?.length || 1;
    const on = state.stepIndex;
    if (state.mode === "guided" && state.kind === "bagua" && state.steps[state.stepIndex] === "cast") {
      return (state.stepIndex + state.castingIndex / 6) / n;
    }
    if (state.mode === "guided" && state.kind === "tarot" && state.steps[state.stepIndex] === "reveal") {
      return (state.stepIndex + (state.revealIndex || 0) / 3) / n;
    }
    // Complete on result
    if (
      (state.mode === "guided" && state.steps[state.stepIndex] === "result") ||
      (state.mode !== "guided" && state.process?.steps?.[state.stepIndex] === "result")
    ) {
      return 1;
    }
    return n > 1 ? on / (n - 1) : 0;
  }

  function render() {
    if (!state) return;
    const meta = stepMeta();
    {
      const name = window.FatumMethodText
        ? window.FatumMethodText.localize(state.method).name
        : state.method.name;
      titleEl.textContent = name;
    }
    stepEl.textContent = ti("studio.questStep", {
      label: meta.label,
      idx: meta.idx,
      total: meta.total,
    });

    window.FatumPlay?.setQuestProgress?.(questRatio());

    const prog = document.getElementById("reading-progress");
    if (prog) {
      const n = state.mode === "guided" && state.kind === "mbti" && state.steps[state.stepIndex] === "quiz"
        ? G().MBTI_QUESTIONS.length
        : state.mode === "guided"
          ? state.steps.length
          : state.process.steps.length;
      const on = state.mode === "guided" && state.kind === "mbti" && state.steps[state.stepIndex] === "quiz"
        ? state.quizIndex
        : state.stepIndex;
      prog.innerHTML = Array.from({ length: Math.min(n, 12) }, (_, i) => {
        const active = i <= on;
        return `<span class="prog-dot${active ? " is-on" : ""}"></span>`;
      }).join("");
    }

    if (state.mode === "guided") {
      if (state.kind === "bagua") renderBagua();
      else if (state.kind === "tarot") renderTarot();
      else if (state.kind === "mbti") renderMbti();
      else if (state.kind === "africa") renderAfrica();
      else if (state.kind === "china") renderChina();
      else if (state.kind === "classic") renderClassic();
      else if (state.kind === "formchina") renderFormChina();
      else if (state.kind === "koreavn") renderKoreaVietnam();
      else if (state.kind === "japan") renderJapan();
      else if (state.kind === "southasia") renderSouthAsia();
      else if (state.kind === "himalayasea") renderHimalayaSea();
      else if (state.kind === "neareast") renderNearEast();
      else if (state.kind === "westastro") renderWestAstro();
      else if (state.kind === "cartomancy") renderCartomancy();
      else if (state.kind === "classicaleuro") renderClassicalEuro();
      else if (state.kind === "folkscry") renderFolkScry();
      return;
    }
    renderGeneric();
  }

  // ——— Bagua ———
  function renderBagua() {
    const step = state.steps[state.stepIndex];
    if (step === "intent") {
      body.innerHTML = `
        <p class="studio__eyebrow">${escapeHTML(ti("studio.bagua.eyebrow"))}</p>
        <h3 class="studio__heading">${escapeHTML(ti("studio.bagua.howTitle"))}</h3>
        ${riteExplanationHTML(state.method)}
        ${howItWorksHTML(state.method, { id: "cast" })}
        <div class="bagua-strip" aria-hidden="true">
          ${Object.values(G().TRIGRAMS).map((t) => `<span title="${escapeHTML(t.name)}">${t.symbol}<small>${escapeHTML(t.name.split(" ")[0])}</small></span>`).join("")}
        </div>
        <p class="studio__copy studio__copy--soft"><strong>${escapeHTML(ti("studio.headsWord"))} = 3</strong> · <strong>${escapeHTML(ti("studio.tailsWord"))} = 2</strong> · sums <strong>6 / 7 / 8 / 9</strong></p>
        ${sciencePanelHTML(state.method)}
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="close">${escapeHTML(ti("studio.cancel"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.understand"))}</button>
        </div>`;
    } else if (step === "question") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(ti("studio.bagua.qTitle"))}</h3>
        <p class="studio__copy">${escapeHTML(ti("studio.bagua.qBody"))}</p>
        <div class="field">
          <label for="r-question">${escapeHTML(ti("studio.bagua.qLabel"))}</label>
          <textarea id="r-question" rows="3" maxlength="280" placeholder="${escapeHTML(ti("studio.bagua.qPh"))}">${escapeHTML(state.question)}</textarea>
        </div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
    } else if (step === "coins") {
      const zh = String(window.FatumI18n?.getLocale?.() || "").startsWith("zh");
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "备好三枚铜钱" : "Ready three coins")}</h3>
        <p class="studio__copy">${escapeHTML(zh ? "正面为三、背面为二。自下而上装六爻——与蓍草周易流程不同。" : "Heads = 3, tails = 2. Build six lines bottom-up — distinct from the yarrow Zhou Yi flow.")}</p>
        <div class="coin-stage" aria-hidden="true">
          <div class="coin" data-face="H">H</div>
          <div class="coin" data-face="T">T</div>
          <div class="coin" data-face="H">H</div>
        </div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.beginCast"))}</button>
        </div>`;
    } else if (step === "cast") {
      const i = state.castingIndex;
      const built = state.lines
        .map((l, idx) => `<li class="yao${l.changing ? " yao--move" : ""}"><span>Line ${idx + 1}</span><strong>${l.symbol}</strong> <em>${l.sum}</em></li>`)
        .reverse()
        .join("");
      body.innerHTML = `
        <h3 class="studio__heading">Cast line ${i + 1} of 6</h3>
        <p class="studio__copy">${i === 0 ? "First toss becomes the <strong>bottom</strong> line." : i < 5 ? "Building upward…" : "Final toss — the top line."}</p>
        <div class="coin-stage" id="coin-stage">
          <div class="coin" data-face="?"></div>
          <div class="coin" data-face="?"></div>
          <div class="coin" data-face="?"></div>
        </div>
        <p class="coin-sum" id="coin-sum">Ready when you are.</p>
        <ol class="yao-stack">${built || "<li class='yao yao--empty'>No lines yet</li>"}</ol>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back" ${i > 0 ? "" : ""}>${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="toss-coins">${escapeHTML(ti("studio.tossCoins"))}</button>
        </div>`;
    } else if (step === "result" && state.reading) {
      renderGuidedResult(state.reading, true);
    }
  }

  function tossBaguaLine() {
    const rng = G().mulberry32(G().hashSeed(`toss|${state.nonce}|${state.castingIndex}|${Date.now()}`));
    const coins = G().tossThreeCoins(rng);
    const line = G().lineFromCoins(coins);
    // Animate coins
    const coinEls = body.querySelectorAll(".coin");
    const sumEl = body.querySelector("#coin-sum");
    coinEls.forEach((el, i) => {
      el.classList.add("is-spinning");
      setTimeout(() => {
        el.classList.remove("is-spinning");
        el.dataset.face = coins[i] === 3 ? "H" : "T";
        el.textContent = coins[i] === 3 ? ti("studio.heads") : ti("studio.tails");
      }, 280 + i * 120);
    });
    const sum = coins.reduce((a, b) => a + b, 0);
    if (sumEl) sumEl.textContent = `Sum ${sum} → ${line.yang ? "yang" : "yin"}${line.changing ? " (changing)" : ""}`;

    setTimeout(() => {
      state.lines.push(line);
      state.castingIndex += 1;
      if (state.castingIndex >= 6) {
        state.reading = G().generateBaguaReading({
          question: state.question,
          lines: state.lines,
          nonce: state.nonce,
        });
        state.stepIndex = state.steps.indexOf("result");
      }
      render();
    }, 900);
  }

  // ——— Tarot ———
  function renderTarot() {
    const step = state.steps[state.stepIndex];
    if (step === "intent") {
      body.innerHTML = `
        <p class="studio__eyebrow">${escapeHTML(ti("studio.tarot.eyebrow"))}</p>
        <h3 class="studio__heading">${escapeHTML(ti("studio.tarot.howTitle"))}</h3>
        ${riteExplanationHTML(state.method)}
        ${howItWorksHTML(state.method, { id: "cards" })}
        ${sciencePanelHTML(state.method)}
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="close">${escapeHTML(ti("studio.cancel"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
    } else if (step === "question") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(ti("studio.tarot.seekTitle"))}</h3>
        <p class="studio__copy">${escapeHTML(ti("studio.tarot.seekCopy"))}</p>
        <div class="field">
          <label for="r-question">${escapeHTML(ti("studio.bagua.qLabel"))}</label>
          <textarea id="r-question" rows="3" maxlength="280" placeholder="${escapeHTML(ti("studio.tarot.qPh"))}">${escapeHTML(state.question)}</textarea>
        </div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.shuffleDeck"))}</button>
        </div>`;
    } else if (step === "shuffle") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(ti("studio.tarot.shuffleTitle"))}</h3>
        <p class="studio__copy">${escapeHTML(ti("studio.tarot.shuffleCopy"))}</p>
        <div class="deck-stage">
          <div class="deck-pile ${state.deck ? "is-ready" : "is-shuffling"}" id="deck-pile"></div>
          <p class="coin-sum">${state.deck ? escapeHTML(ti("studio.tarot.deckReady")) : escapeHTML(ti("studio.tarot.shuffling"))}</p>
        </div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          ${
            state.deck
              ? `<button type="button" class="btn btn--primary" data-action="cut-deck">${escapeHTML(ti("studio.cutDraw"))}</button>`
              : `<button type="button" class="btn btn--primary" data-action="do-shuffle">${escapeHTML(ti("studio.shuffle"))}</button>`
          }
        </div>`;
      if (!state._shuffleStarted) {
        state._shuffleStarted = true;
        // auto visual
      }
    } else if (step === "reveal") {
      const pos = G().TAROT_POSITIONS[state.revealIndex];
      const shown = state.drawn.slice(0, state.revealIndex);
      const cardsHtml = shown
        .map((c, i) => {
          const p = G().TAROT_POSITIONS[i];
          return `<div class="tarot-card is-open"><div class="tarot-card__name">${escapeHTML(tarotCardLabel(c))}</div><div class="tarot-card__pos">${escapeHTML(tarotPosLabel(p))}</div>${c.reversed ? `<div class="tarot-card__rx">${escapeHTML(ti("studio.tarot.reversed"))}</div>` : ""}</div>`;
        })
        .join("");
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(ti("studio.tarot.reveal"))}: ${escapeHTML(tarotPosLabel(pos))}</h3>
        <p class="studio__copy">${escapeHTML(tarotPosHint(pos))}</p>
        <div class="tarot-row">${cardsHtml}<div class="tarot-card is-back" aria-hidden="true"></div></div>
        <div class="studio__actions">
          <button type="button" class="btn btn--primary" data-action="reveal-one">${escapeHTML(ti("studio.flipCard", { n: state.revealIndex + 1 }))}</button>
        </div>`;
    } else if (step === "result" && state.reading) {
      renderGuidedResult(state.reading, true);
    }
  }

  function doTarotShuffle() {
    const rng = G().mulberry32(G().hashSeed(`shuffle|${state.nonce}|${state.question}`));
    const pile = body.querySelector("#deck-pile");
    pile?.classList.add("is-shuffling");
    setTimeout(() => {
      state.deck = G().shuffle(G().MAJOR, rng);
      state._shuffleStarted = true;
      render();
    }, 1100);
  }

  function cutTarotDeck() {
    const rng = G().mulberry32(G().hashSeed(`cut|${state.nonce}|${Date.now()}`));
    // cut: rotate deck
    const cutAt = 1 + Math.floor(rng() * (state.deck.length - 2));
    const deck = state.deck.slice(cutAt).concat(state.deck.slice(0, cutAt));
    state.drawn = [0, 1, 2].map((i) => {
      const card = deck[i];
      const isReversed = rng() < 0.28;
      return G().drawTarotCard
        ? G().drawTarotCard(card, isReversed)
        : {
            id: card.id,
            name: card.name,
            nameZh: card.nameZh,
            upright: card.upright,
            revMeaning: card.reversed,
            isReversed,
            reversed: isReversed,
          };
    });
    state.revealIndex = 0;
    state.stepIndex = state.steps.indexOf("reveal");
    render();
  }

  function revealTarotOne() {
    state.revealIndex += 1;
    if (state.revealIndex >= 3) {
      state.reading = G().generateTarotReading({
        question: state.question,
        drawn: state.drawn,
        nonce: state.nonce,
      });
      // prepend question to details
      if (state.question) {
        state.reading.details.unshift(`Question held: “${state.question}”`);
      }
      state.stepIndex = state.steps.indexOf("result");
    }
    render();
  }

  // ——— West & Central African oracles ———
  function africaZh() {
    try {
      return String(window.FatumI18n?.getLocale?.() || "").startsWith("zh");
    } catch (_) {
      return false;
    }
  }

  function africaStageHTML(rite, casting) {
    const viz = rite.viz;
    const cast = state.cast || {};
    const anim = casting ? " is-casting" : "";
    if (viz === "opele") {
      const bits = cast.bits || Array(8).fill("?");
      return `<div class="africa-stage africa-stage--opele${anim}">${bits
        .map((b, i) => `<span class="opele-nut${b === "1" ? " is-open" : b === "0" ? " is-closed" : ""}" style="--i:${i}"></span>`)
        .join("")}</div>`;
    }
    if (viz === "cowrie16") {
      const shells = cast.shells || Array(16).fill(-1);
      return `<div class="africa-stage africa-stage--cowrie${anim}">${shells
        .map((s, i) => `<span class="cowrie${s === 1 ? " is-up" : s === 0 ? " is-down" : ""}" style="--i:${i}"></span>`)
        .join("")}</div>`;
    }
    if (viz === "obi4") {
      const faces = cast.faces || ["?", "?", "?", "?"];
      return `<div class="africa-stage africa-stage--obi${anim}">${faces
        .map((f, i) => `<span class="obi-lobe${f === "A" ? " is-a" : f === "B" ? " is-b" : ""}" style="--i:${i}">${escapeHTML(f)}</span>`)
        .join("")}</div>`;
    }
    if (viz === "afa4") {
      const rows = cast.rows || ["??", "??", "??", "??"];
      return `<div class="africa-stage africa-stage--afa${anim}">${rows
        .map((r, i) => `<div class="afa-string" style="--i:${i}"><span></span><span></span><em>${escapeHTML(r)}</em></div>`)
        .join("")}</div>`;
    }
    if (viz === "fa-board") {
      const cols = cast.cols || ["----", "----"];
      return `<div class="africa-stage africa-stage--fa${anim}"><div class="fa-board">${cols
        .map((c) => `<div class="fa-col">${c.split("").map((ch) => `<i class="${ch === "1" ? "on" : ""}"></i>`).join("")}</div>`)
        .join("")}</div></div>`;
    }
    if (viz === "sikidy") {
      const cols = cast.cols || ["??", "??", "??", "??"];
      return `<div class="africa-stage africa-stage--sikidy${anim}">${cols
        .map((c, i) => `<div class="sikidy-col" style="--i:${i}">${c.split("").map((ch) => `<span class="seed seed--${ch}"></span>`).join("")}</div>`)
        .join("")}</div>`;
    }
    if (viz === "hakata4") {
      const faces = cast.faces || [null, null, null, null];
      return `<div class="africa-stage africa-stage--hakata${anim}">${faces
        .map((f, i) => {
          const label = f ? (africaZh() ? f.zh : f.en) : "·";
          return `<span class="hakata-tab" style="--i:${i}">${escapeHTML(label)}</span>`;
        })
        .join("")}</div>`;
    }
    if (viz === "ngombo") {
      const pts = cast.points || [];
      return `<div class="africa-stage africa-stage--ngombo${anim}"><div class="ngombo-basket">${pts
        .map((p, i) => `<span class="ngombo-bit" style="--i:${i};left:${p.x}%;top:${p.y}%"></span>`)
        .join("")}</div></div>`;
    }
    if (viz === "sand") {
      const rows = cast.rows || ["…", "…", "…", "…"];
      return `<div class="africa-stage africa-stage--sand${anim}">${rows
        .map((r, i) => `<div class="sand-row" style="--i:${i}"><i></i><i></i><i></i><i></i><em>${escapeHTML(r)}</em></div>`)
        .join("")}</div>`;
    }
    if (viz === "crab") {
      return `<div class="africa-stage africa-stage--crab${anim}">
        <div class="crab-field"><span class="crab-zone" data-z="water"></span><span class="crab-zone" data-z="sand"></span><span class="crab-zone" data-z="shard"></span>
        <span class="crab-bug"></span></div>
        <p class="africa-stage__hint">${escapeHTML(cast.path || (africaZh() ? "路径待启…" : "Path pending…"))}</p>
      </div>`;
    }
    if (viz === "benge-safe") {
      return `<div class="africa-stage africa-stage--benge${anim}">
        <button type="button" class="benge-bowl" data-action="africa-cast" data-bowl="affirm">${africaZh() ? "肯定碗" : "Affirm"}</button>
        <button type="button" class="benge-bowl" data-action="africa-cast" data-bowl="deny">${africaZh() ? "否定碗" : "Deny"}</button>
      </div>`;
    }
    if (viz === "council") {
      return `<div class="africa-stage africa-stage--council${anim}"><span class="council-token">${escapeHTML(cast.token || "·")}</span></div>`;
    }
    if (viz === "spider") {
      const moved = new Set(cast.moved || []);
      return `<div class="africa-stage africa-stage--spider${anim}"><div class="leaf-grid">${Array.from({ length: 9 }, (_, i) => {
        const n = i + 1;
        return `<span class="leaf${moved.has(n) ? " is-moved" : ""}" style="--i:${i}">${n}</span>`;
      }).join("")}<span class="spider-bug"></span></div></div>`;
    }
    if (viz === "fox") {
      const order = cast.order || [];
      return `<div class="africa-stage africa-stage--fox${anim}">
        <div class="fox-table"><span data-z="village"></span><span data-z="bush"></span><span data-z="sky"></span>
        <svg class="fox-path" viewBox="0 0 100 60" aria-hidden="true"><path d="M8 40 C 25 10, 45 50, 70 20 S 95 35, 92 28" fill="none"/></svg></div>
        <p class="africa-stage__hint">${escapeHTML(order.join(" → ") || (africaZh() ? "夜径待揭…" : "Night path pending…"))}</p>
      </div>`;
    }
    if (viz === "amathambo") {
      const L = cast.layout || {};
      return `<div class="africa-stage africa-stage--amathambo${anim}">
        <span class="bone bone--me" data-pos="${escapeHTML(L.me || "")}">me</span>
        <span class="bone bone--other" data-pos="${escapeHTML(L.other || "")}">you</span>
        <span class="bone bone--path" data-pos="${escapeHTML(L.path || "")}">path</span>
        <span class="bone bone--block" data-pos="${escapeHTML(L.block || "")}">block</span>
      </div>`;
    }
    if (viz === "weekday7") {
      const day = typeof cast.day === "number" ? cast.day : state.weekday;
      const name = cast.name ? (africaZh() ? cast.name.zh : cast.name.en) : "";
      return `<div class="africa-stage africa-stage--weekday${anim}">
        <div class="weekday-ring">${["S", "M", "T", "W", "T", "F", "S"]
          .map((d, i) => `<span class="weekday-pip${day === i ? " is-on" : ""}" style="--i:${i}">${d}</span>`)
          .join("")}</div>
        ${name ? `<p class="africa-stage__hint">${escapeHTML(name)}</p>` : ""}
      </div>`;
    }
    if (viz === "starcounter") {
      const stars = cast.stars || Array.from({ length: 18 }, (_, i) => ({ x: (i * 37) % 100, y: (i * 53) % 100, bright: i % 2 }));
      return `<div class="africa-stage africa-stage--stars${anim}"><div class="star-field">${stars
        .map((s, i) => `<span class="sky-star${s.bright ? " is-bright" : ""}" style="--i:${i};left:${s.x}%;top:${s.y}%"></span>`)
        .join("")}</div>
        <p class="africa-stage__hint">${cast.count != null ? escapeHTML(String(cast.count)) : "· · ·"}</p>
      </div>`;
    }
    if (viz === "falak-chart") {
      const keys = cast.keys || ["·", "·", "·"];
      const house = cast.house ? (africaZh() ? cast.house.zh : cast.house.en) : "";
      return `<div class="africa-stage africa-stage--falak${anim}">
        <div class="falak-keys">${keys.map((k, i) => `<span style="--i:${i}">${escapeHTML(k)}</span>`).join("")}</div>
        <div class="falak-house">${escapeHTML(house || (africaZh() ? "宫位待开…" : "House pending…"))}</div>
      </div>`;
    }
    if (viz === "dream-incubation") {
      const omen = cast.omen ? (africaZh() ? cast.omen.zh : cast.omen.en) : "";
      return `<div class="africa-stage africa-stage--dream${anim}">
        <div class="dream-couch"><span class="dream-flame"></span><span class="dream-flame"></span></div>
        <p class="africa-stage__hint">${escapeHTML(omen || (africaZh() ? "孵梦中…" : "Incubating…"))}</p>
      </div>`;
    }
    if (viz === "decan-wheel") {
      const title = cast.decan ? (africaZh() ? cast.decan.zh : cast.decan.en) : "";
      return `<div class="africa-stage africa-stage--decan${anim}">
        <div class="decan-wheel"><i></i><i></i><i></i><i></i><i></i><i></i></div>
        <p class="africa-stage__hint">${escapeHTML(title || (africaZh() ? "旬星轮…" : "Decan wheel…"))}</p>
      </div>`;
    }
    if (viz === "zairja-dial") {
      return `<div class="africa-stage africa-stage--zairja${anim}">
        <div class="zairja-rings"><span class="z-ring z-ring--outer">${escapeHTML(cast.seed || state.dialLetter || "A")}</span>
        <span class="z-ring z-ring--mid"></span><span class="z-ring z-ring--inner">${escapeHTML((cast.strand || "").slice(0, 3) || "···")}</span></div>
        <p class="africa-stage__hint">${escapeHTML(cast.strand || "")}</p>
      </div>`;
    }
    return `<div class="africa-stage${anim}"></div>`;
  }

  function renderAfrica() {
    const rite = window.FatumAfricaOracles.get(state.method.id);
    if (!rite) return;
    const step = state.steps[state.stepIndex];
    const how = window.FatumAfricaOracles.howFor(state.method.id);
    const text = window.FatumMethodText ? window.FatumMethodText.localize(state.method) : state.method;
    const zh = africaZh();

    if (step === "intent" || step === "learn") {
      body.innerHTML = `
        <p class="studio__eyebrow">${escapeHTML(ti(`continent.${state.method.continent}`) || "Africa")} · ${escapeHTML(text.name || state.method.name)}</p>
        <h3 class="studio__heading">${escapeHTML(how?.steps?.[0]?.title || (zh ? "认识这个仪式" : "Meet this rite"))}</h3>
        <p class="studio__copy">${escapeHTML(how?.intro || text.summary || "")}</p>
        ${riteExplanationHTML(state.method, text)}
        ${howItWorksHTML(state.method, { id: "africa", label: "Africa oracle" })}
        ${sciencePanelHTML(state.method)}
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="close">${escapeHTML(ti("studio.cancel"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }

    if (step === "question") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "你要问什么？" : "What do you ask?")}</h3>
        <p class="studio__copy">${escapeHTML(how?.steps?.[1]?.body || "")}</p>
        <div class="field"><label for="r-question">${escapeHTML(ti("studio.generic.qLabel"))}</label>
        <textarea id="r-question" rows="3" maxlength="280">${escapeHTML(state.question || "")}</textarea></div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }

    if (
      step === "bless" ||
      step === "lobes" ||
      step === "strings" ||
      step === "faces" ||
      step === "sow" ||
      step === "basket" ||
      step === "sand" ||
      step === "field" ||
      step === "lay" ||
      step === "table" ||
      step === "scatter" ||
      step === "sky" ||
      step === "incubate" ||
      step === "wheel" ||
      step === "dial"
    ) {
      const idx = state.steps.indexOf(step);
      const hs = how?.steps?.[Math.min(idx, (how.steps || []).length - 1)];
      let extra = africaStageHTML(rite, false);
      if (step === "dial") {
        const letters = "ABJDHWZHTYKLMN".split("");
        extra = `
          <div class="africa-choice-row">
            ${letters.map((L) => `<button type="button" class="africa-choice${state.dialLetter === L ? " is-on" : ""}" data-action="africa-dial" data-letter="${L}">${L}</button>`).join("")}
          </div>
          ${africaStageHTML(rite, false)}`;
      }
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(hs?.title || step)}</h3>
        <p class="studio__copy">${escapeHTML(hs?.body || "")}</p>
        ${extra}
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }

    if (step === "weekday") {
      const days = zh
        ? ["周日", "周一", "周二", "周三", "周四", "周五", "周六"]
        : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "选择出生星期" : "Pick your birth weekday")}</h3>
        <p class="studio__copy">${escapeHTML(zh ? "阿坎日名来自你进入世界的那一天。" : "Akan day-names come from the weekday you entered the world.")}</p>
        <div class="africa-choice-row">
          ${days.map((d, i) => `<button type="button" class="africa-choice${state.weekday === i ? " is-on" : ""}" data-action="africa-weekday" data-day="${i}">${escapeHTML(d)}</button>`).join("")}
        </div>
        ${africaStageHTML(rite, false)}
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }

    if (step === "birth") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "输入出生标记" : "Enter a birth mark")}</h3>
        <p class="studio__copy">${escapeHTML(zh ? "日期用于教学盘的本命点——不是精确天宫图。" : "Date marks a teaching radix — not a precise natal chart.")}</p>
        <div class="field"><label for="r-birth">${escapeHTML(ti("studio.generic.birthDate") || "Birth date")}</label>
        <input type="date" id="r-birth" value="${escapeHTML(state.birthDate || "")}" /></div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }

    if (step === "letters") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "推出字母键" : "Derive letter keys")}</h3>
        <p class="studio__copy">${escapeHTML(zh ? "输入姓名或短语的拉丁首字母（最多三字）。" : "Enter up to three Latin initials from a name or phrase.")}</p>
        <div class="field"><label for="r-letters">${escapeHTML(zh ? "字母键" : "Letter keys")}</label>
        <input type="text" id="r-letters" maxlength="3" value="${escapeHTML(state.letters || "")}" placeholder="FLK" /></div>
        ${africaStageHTML(rite, false)}
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }

    if (step === "offering") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "放一件象征供物" : "Place a token offering")}</h3>
        <p class="studio__copy">${escapeHTML(zh ? "仅教育象征——不是真实献祭。" : "Educational symbol only — not a real sacrifice.")}</p>
        <div class="africa-choice-row">
          ${["water", "cola", "cloth"].map((o) => `<button type="button" class="africa-choice${state.offering === o ? " is-on" : ""}" data-action="africa-offer" data-offer="${o}">${escapeHTML(o)}</button>`).join("")}
        </div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }

    if (step === "domain") {
      const domains = [
        { id: "kin", en: "Kin", zh: "亲属" },
        { id: "land", en: "Land", zh: "土地" },
        { id: "work", en: "Work", zh: "工作" },
        { id: "illness", en: "Illness worry", zh: "病忧" },
      ];
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "选择领域" : "Choose a domain")}</h3>
        <div class="africa-choice-row">
          ${domains.map((d) => `<button type="button" class="africa-choice${state.domain === d.id ? " is-on" : ""}" data-action="africa-domain" data-domain="${d.id}">${escapeHTML(zh ? d.zh : d.en)}</button>`).join("")}
        </div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }

    if (step === "people") {
      const opts = [
        { id: "self", en: "Self", zh: "自己" },
        { id: "family", en: "Family", zh: "家人" },
        { id: "rival", en: "Rival", zh: "对手" },
        { id: "ancestor", en: "Ancestor memory", zh: "祖先记忆" },
      ];
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "点名涉及谁" : "Who is involved?")}</h3>
        <div class="africa-choice-row">
          ${opts.map((d) => `<button type="button" class="africa-choice${state.people === d.id ? " is-on" : ""}" data-action="africa-people" data-people="${d.id}">${escapeHTML(zh ? d.zh : d.en)}</button>`).join("")}
        </div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }

    if (step === "bowls") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "安全思想实验" : "Safe thought-experiment")}</h3>
        <p class="studio__copy">${escapeHTML(zh ? "两个密封碗——无动物、无毒物。点选其一。" : "Two sealed bowls — no animals, no toxins. Choose one.")}</p>
        ${africaStageHTML(rite, false)}
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
        </div>`;
      return;
    }

    if (step === "cast" || step === "count" || step === "chart" || step === "dream" || step === "rising" || step === "spin") {
      const cta = window.FatumAfricaOracles.loc(rite.castCta);
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(cta)}</h3>
        <p class="studio__copy">${escapeHTML(state.question ? (zh ? `问题：「${state.question}」` : `Holding: “${state.question}”`) : "")}</p>
        ${africaStageHTML(rite, !!state.casting)}
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="africa-cast">${escapeHTML(cta)}</button>
        </div>`;
      return;
    }

    if (step === "result" && state.reading) {
      renderGuidedResult(state.reading, true);
    }
  }

  function doAfricaCast(forcedAnswer) {
    const rite = window.FatumAfricaOracles.get(state.method.id);
    if (!rite) return;
    state.casting = true;
    render();
    window.setTimeout(() => {
      const reading = window.FatumAfricaOracles.runCast(state.method.id, {
        question: state.question,
        nonce: state.nonce,
        offering: state.offering,
        domain: state.domain,
        people: state.people,
        weekday: state.weekday,
        birthDate: state.birthDate,
        letters: state.letters,
        dialLetter: state.dialLetter,
        cast: forcedAnswer ? { answer: forcedAnswer } : {},
      });
      state.cast = reading.vizData || {};
      if (forcedAnswer) state.cast.answer = forcedAnswer;
      state.reading = reading;
      state.casting = false;
      state.stepIndex = state.steps.indexOf("result");
      render();
    }, 900);
  }

  // ——— Chinese destiny oracles ———
  function chinaZh() {
    try {
      return String(window.FatumI18n?.getLocale?.() || "").startsWith("zh");
    } catch (_) {
      return false;
    }
  }

  function chinaStageHTML(rite, casting) {
    const viz = rite.viz;
    const cast = state.cast || {};
    const anim = casting ? " is-casting" : "";
    if (viz === "bazi-pillars") {
      const pillars = cast.pillars || [
        { label: "Y", stem: "·", branch: "·" },
        { label: "M", stem: "·", branch: "·" },
        { label: "D", stem: "·", branch: "·" },
        { label: "H", stem: "·", branch: "·" },
      ];
      return `<div class="china-stage china-stage--bazi${anim}"><div class="bazi-row">${pillars
        .map(
          (p, i) =>
            `<div class="bazi-pillar" style="--i:${i}"><em>${escapeHTML(p.label)}</em><strong>${escapeHTML(p.stem || "·")}</strong><span>${escapeHTML(p.branch || "·")}</span></div>`
        )
        .join("")}</div></div>`;
    }
    if (viz === "ziwei-palaces") {
      const palace = cast.palace ? (chinaZh() ? cast.palace.zh : cast.palace.en) : "·";
      const star = cast.star ? (chinaZh() ? cast.star.zh : cast.star.en) : "·";
      return `<div class="china-stage china-stage--ziwei${anim}"><div class="ziwei-grid">${Array.from({ length: 12 }, (_, i) => `<span class="ziwei-cell${cast.palace && i === 0 ? " is-on" : ""}" style="--i:${i}"></span>`).join("")}</div>
        <p class="china-stage__hint">${escapeHTML(star)} · ${escapeHTML(palace)}</p></div>`;
    }
    if (viz === "zodiac-ring") {
      const a = cast.animal;
      const name = a ? (chinaZh() ? a.zh : a.en) : "·";
      return `<div class="china-stage china-stage--zodiac${anim}"><div class="zodiac-ring">${Array.from({ length: 12 }, (_, i) => `<span class="zodiac-pip${a && a.idx === i ? " is-on" : ""}" style="--i:${i}"></span>`).join("")}</div>
        <p class="china-stage__hint">${escapeHTML(name)}${cast.year ? " · " + cast.year : ""}</p></div>`;
    }
    if (viz === "taisui") {
      const b = cast.birthA ? (chinaZh() ? cast.birthA.zh : cast.birthA.en) : "·";
      const y = cast.yearA ? (chinaZh() ? cast.yearA.zh : cast.yearA.en) : "·";
      return `<div class="china-stage china-stage--taisui${anim}"><div class="taisui-compare"><span>${escapeHTML(b)}</span><i>⇄</i><span>${escapeHTML(y)}</span></div>
        <p class="china-stage__hint">${escapeHTML(cast.status || "")}</p></div>`;
    }
    if (viz === "almanac") {
      const v = cast.verdict ? (chinaZh() ? cast.verdict.zh : cast.verdict.en) : "·";
      return `<div class="china-stage china-stage--almanac${anim}"><div class="almanac-seal">${escapeHTML(v)}</div>
        <p class="china-stage__hint">${escapeHTML(cast.day || "")}</p></div>`;
    }
    if (viz === "iron-plate") {
      const digits = cast.digits || [0, 0, 0, 0, 0, 0];
      return `<div class="china-stage china-stage--iron${anim}"><div class="iron-digits">${digits
        .map((d, i) => `<span style="--i:${i}">${d}</span>`)
        .join("")}</div>
        <p class="china-stage__hint">${escapeHTML(cast.verse || "")}</p></div>`;
    }
    if (viz === "qizheng-board") {
      const govs = cast.governors || [];
      return `<div class="china-stage china-stage--qizheng${anim}"><div class="qizheng-board">${govs
        .map((g, i) => `<span class="gov${cast.lead === g.name ? " is-lead" : ""}" style="--i:${i}">${escapeHTML(g.name)}</span>`)
        .join("")}</div></div>`;
    }
    if (viz === "bone-scale") {
      return `<div class="china-stage china-stage--bones${anim}"><div class="bone-scale"><span class="bone-pan bone-pan--l"></span><span class="bone-beam"></span><span class="bone-pan bone-pan--r"></span></div>
        <p class="china-stage__hint">${escapeHTML(cast.poem?.w || "")}</p></div>`;
    }
    return `<div class="china-stage${anim}"></div>`;
  }

  function renderChina() {
    const rite = window.FatumChinaDestiny.get(state.method.id);
    if (!rite) return;
    const step = state.steps[state.stepIndex];
    const how = window.FatumChinaDestiny.howFor(state.method.id);
    const text = window.FatumMethodText ? window.FatumMethodText.localize(state.method) : state.method;
    const zh = chinaZh();

    if (step === "intent") {
      body.innerHTML = `
        <p class="studio__eyebrow">${escapeHTML(ti(`continent.${state.method.continent}`) || "Asia")} · ${escapeHTML(text.name || state.method.name)}</p>
        <h3 class="studio__heading">${escapeHTML(how?.steps?.[0]?.title || (zh ? "认识这个仪式" : "Meet this rite"))}</h3>
        <p class="studio__copy">${escapeHTML(how?.intro || text.summary || "")}</p>
        ${riteExplanationHTML(state.method, text)}
        ${howItWorksHTML(state.method, { id: "china", label: "China destiny" })}
        ${sciencePanelHTML(state.method)}
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="close">${escapeHTML(ti("studio.cancel"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }

    if (step === "question") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "你要问什么？" : "What do you ask?")}</h3>
        <div class="field"><label for="r-question">${escapeHTML(ti("studio.generic.qLabel"))}</label>
        <textarea id="r-question" rows="3" maxlength="280">${escapeHTML(state.question || "")}</textarea></div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }

    if (step === "birth") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "输入出生日期" : "Enter birth date")}</h3>
        <div class="field"><label for="r-birth">${escapeHTML(ti("studio.generic.birthDate") || "Birth date")}</label>
        <input type="date" id="r-birth" value="${escapeHTML(state.birthDate || "")}" /></div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }

    if (step === "hour") {
      const hours = zh
        ? ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"]
        : ["Zi", "Chou", "Yin", "Mao", "Chen", "Si", "Wu", "Wei", "Shen", "You", "Xu", "Hai"];
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "选择时辰" : "Choose birth hour")}</h3>
        <p class="studio__copy">${escapeHTML(zh ? "十二时辰补全时柱。" : "Twelve double-hours complete the hour pillar.")}</p>
        <div class="africa-choice-row">
          ${hours.map((h, i) => `<button type="button" class="africa-choice${state.hourIndex === i ? " is-on" : ""}" data-action="china-hour" data-hour="${i}">${escapeHTML(h)}</button>`).join("")}
        </div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }

    if (step === "gender") {
      const opts = [
        { id: "yang", en: "Yang chart flag", zh: "阳盘标记" },
        { id: "yin", en: "Yin chart flag", zh: "阴盘标记" },
        { id: "unspecified", en: "Unspecified", zh: "不标注" },
      ];
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "标注性别传统" : "Note gender tradition")}</h3>
        <div class="africa-choice-row">
          ${opts.map((o) => `<button type="button" class="africa-choice${state.gender === o.id ? " is-on" : ""}" data-action="china-gender" data-gender="${o.id}">${escapeHTML(zh ? o.zh : o.en)}</button>`).join("")}
        </div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }

    if (step === "year" || step === "birthyear") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "输入出生年" : "Enter birth year")}</h3>
        <div class="field"><label for="r-year">${escapeHTML(zh ? "出生年" : "Birth year")}</label>
        <input type="number" id="r-year" min="1900" max="2100" value="${escapeHTML(state.birthYear || "")}" placeholder="1990" /></div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }

    if (step === "yearcheck") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "设定所问之年" : "Set the year in view")}</h3>
        <div class="field"><label for="r-target-year">${escapeHTML(zh ? "流年" : "Target year")}</label>
        <input type="number" id="r-target-year" min="1900" max="2100" value="${escapeHTML(state.targetYear || "")}" /></div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }

    if (step === "activity") {
      const acts = [
        { id: "travel", en: "Travel", zh: "出行" },
        { id: "marriage", en: "Marriage / contract", zh: "婚嫁／签约" },
        { id: "open", en: "Open business", zh: "开市" },
        { id: "move", en: "Moving house", zh: "移徙" },
        { id: "bury", en: "Burial / ancestor", zh: "安葬／祭祀" },
      ];
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "选择事宜" : "Choose an activity")}</h3>
        <div class="africa-choice-row">
          ${acts.map((a) => `<button type="button" class="africa-choice${state.activity === a.id ? " is-on" : ""}" data-action="china-activity" data-activity="${a.id}">${escapeHTML(zh ? a.zh : a.en)}</button>`).join("")}
        </div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }

    if (step === "daypick") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "点选候选日" : "Pick a candidate day")}</h3>
        <div class="field"><label for="r-day">${escapeHTML(zh ? "日期" : "Date")}</label>
        <input type="date" id="r-day" value="${escapeHTML(state.dayDate || "")}" /></div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }

    if (step === "animal" || step === "digits" || step === "governors" || step === "bones") {
      const idx = state.steps.indexOf(step);
      const hs = how?.steps?.[Math.min(idx, (how.steps || []).length - 1)];
      // Pre-build cast preview for animal step
      if (step === "animal" && !state.cast?.animal && state.birthYear) {
        const preview = window.FatumChinaDestiny.runCast(state.method.id, {
          birthYear: state.birthYear,
          nonce: state.nonce,
          question: "",
        });
        state.cast = preview.vizData || {};
      }
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(hs?.title || step)}</h3>
        <p class="studio__copy">${escapeHTML(hs?.body || "")}</p>
        ${chinaStageHTML(rite, false)}
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }

    if (
      step === "pillars" ||
      step === "palaces" ||
      step === "clash" ||
      step === "verdict" ||
      step === "ironplate" ||
      step === "skyboard" ||
      step === "poem" ||
      step === "cast"
    ) {
      const cta = window.FatumChinaDestiny.loc(rite.castCta);
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(cta)}</h3>
        <p class="studio__copy">${escapeHTML(state.question ? (zh ? `问题：「${state.question}」` : `Holding: “${state.question}”`) : "")}</p>
        ${chinaStageHTML(rite, !!state.casting)}
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="china-cast">${escapeHTML(cta)}</button>
        </div>`;
      return;
    }

    if (step === "result" && state.reading) {
      renderGuidedResult(state.reading, true);
    }
  }

  function doChinaCast() {
    const rite = window.FatumChinaDestiny.get(state.method.id);
    if (!rite) return;
    state.casting = true;
    render();
    window.setTimeout(() => {
      const reading = window.FatumChinaDestiny.runCast(state.method.id, {
        question: state.question,
        nonce: state.nonce,
        birthDate: state.birthDate,
        birthYear: state.birthYear,
        targetYear: state.targetYear,
        hourIndex: state.hourIndex,
        gender: state.gender,
        activity: state.activity,
        dayDate: state.dayDate,
      });
      state.cast = reading.vizData || {};
      state.reading = reading;
      state.casting = false;
      state.stepIndex = state.steps.indexOf("result");
      render();
    }, 900);
  }

  // ——— Classical Chinese oracles ———
  function classicZh() {
    try {
      return String(window.FatumI18n?.getLocale?.() || "").startsWith("zh");
    } catch (_) {
      return false;
    }
  }

  function classicStageHTML(rite, casting) {
    const viz = rite.viz;
    const cast = state.cast || {};
    const anim = casting ? " is-casting" : "";
    if (viz === "yarrow") {
      return `<div class="classic-stage classic-stage--yarrow${anim}"><div class="yarrow-piles"><span></span><span></span><span></span></div>
        <p class="classic-stage__hint">${escapeHTML(cast.title || (classicZh() ? "分蓍中…" : "Dividing…"))}</p></div>`;
    }
    if (viz === "liuyao") {
      const lines = cast.lines || Array.from({ length: 6 }, () => ({ yang: false, branch: "·" }));
      return `<div class="classic-stage classic-stage--liuyao${anim}"><ol class="liuyao-stack">${[...lines]
        .reverse()
        .map(
          (l, i) =>
            `<li class="${l.yang ? "is-yang" : "is-yin"}" style="--i:${i}"><em>${escapeHTML(l.branch || "")}</em><span>${l.yang ? "━━━━━━" : "━━  ━━"}</span></li>`
        )
        .join("")}</ol></div>`;
    }
    if (viz === "meihua") {
      return `<div class="classic-stage classic-stage--meihua${anim}"><div class="meihua-bloom"></div>
        <p class="classic-stage__hint">${escapeHTML(cast.title || cast.sight || "·")}</p></div>`;
    }
    if (viz === "qimen-board") {
      return `<div class="classic-stage classic-stage--qimen${anim}"><div class="qimen-grid">${Array.from({ length: 9 }, (_, i) => `<span class="${cast.palace === i + 1 ? "is-on" : ""}" style="--i:${i}">${i + 1}</span>`).join("")}</div>
        <p class="classic-stage__hint">${escapeHTML(cast.gate ? (classicZh() ? cast.gate.zh : cast.gate.en) : "")}</p></div>`;
    }
    if (viz === "daliuren") {
      return `<div class="classic-stage classic-stage--daliuren${anim}"><div class="liu-discs"><i class="disc disc--h"></i><i class="disc disc--e"></i></div>
        <p class="classic-stage__hint">${escapeHTML(cast.lean || "")}</p></div>`;
    }
    if (viz === "xiaoliuren") {
      const names = classicZh()
        ? ["大安", "留连", "速喜", "赤口", "小吉", "空亡"]
        : ["Peace", "Hold", "Joy", "Mouth", "Luck", "Void"];
      return `<div class="classic-stage classic-stage--xiaoliuren${anim}"><div class="finger-palaces">${names
        .map((n, i) => `<span class="${cast.palace && (classicZh() ? cast.palace.zh : cast.palace.en).includes(n.slice(0, 2)) ? "is-on" : ""}" style="--i:${i}">${escapeHTML(n)}</span>`)
        .join("")}</div></div>`;
    }
    if (viz === "taiyi") {
      return `<div class="classic-stage classic-stage--taiyi${anim}"><div class="taiyi-circle"><i style="--s:${cast.sector || 1}"></i></div>
        <p class="classic-stage__hint">${escapeHTML(cast.sector ? String(cast.sector) : "·")}</p></div>`;
    }
    if (viz === "lingqi") {
      const tokens = cast.tokens || [];
      return `<div class="classic-stage classic-stage--lingqi${anim}"><div class="lingqi-board">${tokens
        .map((t, i) => `<span style="--i:${i};left:${t.x}%;top:${t.y}%"></span>`)
        .join("")}</div>
        <p class="classic-stage__hint">${escapeHTML(cast.fig?.t || "")}</p></div>`;
    }
    if (viz === "oracle-bone") {
      return `<div class="classic-stage classic-stage--bone${anim}"><div class="plastron"><svg viewBox="0 0 100 70" aria-hidden="true"><path class="crack" d="M20 40 Q40 20 55 35 T85 25"/></svg></div>
        <p class="classic-stage__hint">${escapeHTML(cast.pattern?.t || "")}</p></div>`;
    }
    if (viz === "kau-chim") {
      return `<div class="classic-stage classic-stage--kauchim${anim}"><div class="chim-cylinder"><span></span><span></span><span></span><span></span></div>
        <p class="classic-stage__hint">${cast.number != null ? "#" + cast.number : "·"}</p></div>`;
    }
    if (viz === "jiaobei") {
      const faces = cast.faces || ["?", "?"];
      return `<div class="classic-stage classic-stage--jiaobei${anim}"><div class="poe-row">${faces
        .map((f, i) => `<span class="poe ${f}" style="--i:${i}"></span>`)
        .join("")}</div>
        <p class="classic-stage__hint">${escapeHTML(cast.pattern ? (classicZh() ? cast.pattern.zh : cast.pattern.en) : "")}</p></div>`;
    }
    if (viz === "cezi") {
      return `<div class="classic-stage classic-stage--cezi${anim}"><div class="cezi-glyph">${escapeHTML(cast.ch || state.glyph || "字")}</div>
        <div class="cezi-parts">${(cast.parts || []).map((p) => `<span>${escapeHTML(p)}</span>`).join("")}</div></div>`;
    }
    return `<div class="classic-stage${anim}"></div>`;
  }

  function renderClassic() {
    const rite = window.FatumChinaClassic.get(state.method.id);
    if (!rite) return;
    const step = state.steps[state.stepIndex];
    const how = window.FatumChinaClassic.howFor(state.method.id);
    const text = window.FatumMethodText ? window.FatumMethodText.localize(state.method) : state.method;
    const zh = classicZh();

    if (step === "intent") {
      body.innerHTML = `
        <p class="studio__eyebrow">${escapeHTML(ti(`continent.${state.method.continent}`) || "Asia")} · ${escapeHTML(text.name || state.method.name)}</p>
        <h3 class="studio__heading">${escapeHTML(how?.steps?.[0]?.title || (zh ? "认识这个仪式" : "Meet this rite"))}</h3>
        <p class="studio__copy">${escapeHTML(how?.intro || text.summary || "")}</p>
        ${riteExplanationHTML(state.method, text)}
        ${howItWorksHTML(state.method, { id: "classic", label: "Classic oracle" })}
        ${sciencePanelHTML(state.method)}
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="close">${escapeHTML(ti("studio.cancel"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }

    if (step === "question") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "你要问什么？" : "What do you ask?")}</h3>
        <div class="field"><label for="r-question">${escapeHTML(ti("studio.generic.qLabel"))}</label>
        <textarea id="r-question" rows="3" maxlength="280">${escapeHTML(state.question || "")}</textarea></div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }

    if (step === "birth") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "输入出生或年代标记" : "Enter a birth or era mark")}</h3>
        <div class="field"><label for="r-birth">${escapeHTML(ti("studio.generic.birthDate") || "Date")}</label>
        <input type="date" id="r-birth" value="${escapeHTML(state.birthDate || "")}" /></div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }

    if (step === "numbers") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "输入种子数" : "Enter seed numbers")}</h3>
        <div class="field"><label for="r-numbers">${escapeHTML(zh ? "数字（逗号分隔）" : "Numbers (comma-separated)")}</label>
        <input type="text" id="r-numbers" value="${escapeHTML(state.numbers || "")}" placeholder="3,8,5" /></div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }

    if (step === "sight") {
      const sights = zh ? ["梅", "风", "人", "鸟", "月"] : ["plum", "wind", "person", "bird", "moon"];
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "记下所见" : "Note a sight")}</h3>
        <div class="africa-choice-row">
          ${sights.map((s) => `<button type="button" class="africa-choice${state.sight === s ? " is-on" : ""}" data-action="classic-sight" data-sight="${escapeHTML(s)}">${escapeHTML(s)}</button>`).join("")}
        </div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }

    if (step === "era") {
      const eras = [
        { id: "personal", en: "Personal", zh: "个人" },
        { id: "house", en: "Household", zh: "家庭" },
        { id: "public", en: "Public", zh: "公共" },
      ];
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "设定格局尺度" : "Set the era lens")}</h3>
        <div class="africa-choice-row">
          ${eras.map((e) => `<button type="button" class="africa-choice${state.era === e.id ? " is-on" : ""}" data-action="classic-era" data-era="${e.id}">${escapeHTML(zh ? e.zh : e.en)}</button>`).join("")}
        </div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }

    if (step === "glyph") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "出示字形" : "Offer a glyph")}</h3>
        <p class="studio__copy">${escapeHTML(zh ? "输入一个汉字；留空则由我们建议。" : "Type one Chinese character; leave blank to let us suggest.")}</p>
        <div class="field"><label for="r-glyph">${escapeHTML(zh ? "汉字" : "Character")}</label>
        <input type="text" id="r-glyph" maxlength="2" value="${escapeHTML(state.glyph || "")}" placeholder="安" /></div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }

    if (
      step === "yarrow" ||
      step === "cast6" ||
      step === "moment" ||
      step === "timeboard" ||
      step === "finger" ||
      step === "tokens" ||
      step === "heat" ||
      step === "cylinder" ||
      step === "blocks"
    ) {
      const idx = state.steps.indexOf(step);
      const hs = how?.steps?.[Math.min(idx, (how.steps || []).length - 1)];
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(hs?.title || step)}</h3>
        <p class="studio__copy">${escapeHTML(hs?.body || "")}</p>
        ${classicStageHTML(rite, false)}
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }

    if (
      step === "hexagram" ||
      step === "najia" ||
      step === "hexderive" ||
      step === "board" ||
      step === "course" ||
      step === "palace" ||
      step === "circle" ||
      step === "figure" ||
      step === "crack" ||
      step === "stick" ||
      step === "toss" ||
      step === "dissect"
    ) {
      const cta = window.FatumChinaClassic.loc(rite.castCta);
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(cta)}</h3>
        <p class="studio__copy">${escapeHTML(state.question ? (zh ? `问题：「${state.question}」` : `Holding: “${state.question}”`) : "")}</p>
        ${classicStageHTML(rite, !!state.casting)}
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="classic-cast">${escapeHTML(cta)}</button>
        </div>`;
      return;
    }

    if (step === "result" && state.reading) {
      renderGuidedResult(state.reading, true);
    }
  }

  function doClassicCast() {
    const rite = window.FatumChinaClassic.get(state.method.id);
    if (!rite) return;
    state.casting = true;
    render();
    window.setTimeout(() => {
      const reading = window.FatumChinaClassic.runCast(state.method.id, {
        question: state.question,
        nonce: state.nonce,
        birthDate: state.birthDate,
        numbers: state.numbers,
        sight: state.sight,
        era: state.era,
        glyph: state.glyph,
      });
      state.cast = reading.vizData || {};
      state.reading = reading;
      state.casting = false;
      state.stepIndex = state.steps.indexOf("result");
      render();
    }, 900);
  }

  // ——— Chinese form / feng shui / physiognomy ———
  function formZh() {
    try {
      return String(window.FatumI18n?.getLocale?.() || "").startsWith("zh");
    } catch (_) {
      return false;
    }
  }

  function formStageHTML(rite, casting) {
    const viz = rite.viz;
    const cast = state.cast || {};
    const anim = casting ? " is-casting" : "";
    const zh = formZh();
    if (viz === "fengshui-qi") {
      const face = cast.facing?.id || state.facing || "S";
      return `<div class="form-stage form-stage--fengshui${anim}" data-facing="${escapeHTML(face)}">
        <div class="fs-compass"><span class="fs-n">N</span><span class="fs-e">E</span><span class="fs-s">S</span><span class="fs-w">W</span>
          <i class="fs-arrow" style="--rot:${face === "N" ? 0 : face === "E" ? 90 : face === "S" ? 180 : 270}deg"></i>
        </div>
        <p class="form-stage__hint">${escapeHTML(cast.flow || (zh ? "气机流动…" : "Qi flowing…"))}</p></div>`;
    }
    if (viz === "bazhai-map") {
      const dirs = ["NW", "N", "NE", "W", "·", "E", "SW", "S", "SE"];
      const best = cast.best || "";
      const caution = cast.caution || "";
      return `<div class="form-stage form-stage--bazhai${anim}"><div class="bz-grid">${dirs
        .map((d) => {
          const cls = d === best ? " is-best" : d === caution ? " is-caution" : "";
          return `<span class="bz-cell${cls}">${escapeHTML(d)}</span>`;
        })
        .join("")}</div>
        <p class="form-stage__hint">${escapeHTML(
          cast.gua ? (zh ? `${cast.gua.zh || ""}命` : `${cast.gua.en || ""} gua`) : zh ? "八宅平面" : "Eight Mansions plan"
        )}</p></div>`;
    }
    if (viz === "flying-star") {
      const cells = Array.from({ length: 9 }, (_, i) => i + 1);
      const hit = Number(cast.palace || 0);
      const sname = cast.star ? (zh ? cast.star.zh : cast.star.en) : "";
      return `<div class="form-stage form-stage--flystar${anim}"><div class="fly-grid">${cells
        .map((n) => `<span class="fly-cell${n === hit ? " is-hit" : ""}">${n === hit && cast.star ? escapeHTML(String(cast.star.n)) : n}</span>`)
        .join("")}</div>
        <p class="form-stage__hint">${escapeHTML(sname || (zh ? `${state.period || "9"}运` : `Period ${state.period || "9"}`))}</p></div>`;
    }
    if (viz === "mianxiang") {
      const zone = cast.zone?.id || state.faceZone || "forehead";
      return `<div class="form-stage form-stage--face${anim}" data-zone="${escapeHTML(zone)}">
        <div class="face-sil"><i class="fz fz-forehead"></i><i class="fz fz-brows"></i><i class="fz fz-eyes"></i><i class="fz fz-nose"></i><i class="fz fz-mouth"></i></div>
        <p class="form-stage__hint">${escapeHTML(
          cast.zone ? (zh ? cast.zone.zh : cast.zone.en) : zh ? "面部宫位" : "Face palace"
        )}</p></div>`;
    }
    if (viz === "shouxiang") {
      const line = cast.line?.id || state.palmLine || "life";
      return `<div class="form-stage form-stage--palm${anim}" data-line="${escapeHTML(line)}">
        <div class="palm-sil"><i class="pl pl-life"></i><i class="pl pl-head"></i><i class="pl pl-heart"></i><i class="pl pl-fate"></i></div>
        <p class="form-stage__hint">${escapeHTML(
          cast.mount || (cast.line ? (zh ? cast.line.zh : cast.line.en) : zh ? "掌纹" : "Palm lines")
        )}</p></div>`;
    }
    if (viz === "mogu") {
      return `<div class="form-stage form-stage--mogu${anim}">
        <div class="bone-hand"><i></i><i></i><i></i><i></i><i></i></div>
        <p class="form-stage__hint">${escapeHTML(cast.tag?.t || (zh ? "骨感…" : "Bone feel…"))}</p></div>`;
    }
    if (viz === "mole") {
      const zone = cast.zone?.id || state.bodyZone || "face";
      return `<div class="form-stage form-stage--mole${anim}" data-zone="${escapeHTML(zone)}">
        <div class="body-sil"><i class="mole-dot"></i></div>
        <p class="form-stage__hint">${escapeHTML(
          cast.tone || (cast.zone ? (zh ? cast.zone.zh : cast.zone.en) : zh ? "痣位" : "Mole zone")
        )}</p></div>`;
    }
    return `<div class="form-stage${anim}"></div>`;
  }

  function renderFormChina() {
    const rite = window.FatumChinaForm.get(state.method.id);
    if (!rite) return;
    const step = state.steps[state.stepIndex];
    const how = window.FatumChinaForm.howFor(state.method.id);
    const text = window.FatumMethodText ? window.FatumMethodText.localize(state.method) : state.method;
    const zh = formZh();

    if (step === "intent") {
      body.innerHTML = `
        <p class="studio__eyebrow">${escapeHTML(ti(`continent.${state.method.continent}`) || "Asia")} · ${escapeHTML(text.name || state.method.name)}</p>
        <h3 class="studio__heading">${escapeHTML(how?.steps?.[0]?.title || (zh ? "认识这个仪式" : "Meet this rite"))}</h3>
        <p class="studio__copy">${escapeHTML(how?.intro || text.summary || "")}</p>
        ${riteExplanationHTML(state.method, text)}
        ${howItWorksHTML(state.method, { id: "formchina", label: "Form & physiognomy" })}
        ${sciencePanelHTML(state.method)}
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="close">${escapeHTML(ti("studio.cancel"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }

    if (step === "site") {
      const sites = [
        { id: "home", en: "Home", zh: "住宅" },
        { id: "shop", en: "Shop", zh: "店铺" },
        { id: "desk", en: "Desk / office", zh: "书桌／办公室" },
        { id: "studio", en: "Studio", zh: "工作室室" },
      ];
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "点名场所" : "Name the site")}</h3>
        <p class="studio__copy">${escapeHTML(zh ? "选择你要读的尺度。" : "Pick the scale you want read.")}</p>
        <div class="africa-choice-row">
          ${sites.map((s) => `<button type="button" class="africa-choice${state.site === s.id ? " is-on" : ""}" data-action="form-site" data-site="${s.id}">${escapeHTML(zh ? s.zh : s.en)}</button>`).join("")}
        </div>
        <div class="field" style="margin-top:1rem"><label for="r-question">${escapeHTML(zh ? "你关心什么？（可选）" : "What concerns you? (optional)")}</label>
        <textarea id="r-question" rows="2" maxlength="280">${escapeHTML(state.question || "")}</textarea></div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }

    if (step === "facing") {
      const faces = [
        { id: "N", en: "North", zh: "北" },
        { id: "E", en: "East", zh: "东" },
        { id: "S", en: "South", zh: "南" },
        { id: "W", en: "West", zh: "西" },
      ];
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "设定朝向" : "Set the facing")}</h3>
        <p class="studio__copy">${escapeHTML(zh ? "主要开口朝哪边？" : "Which way does the main opening look?")}</p>
        ${formStageHTML(rite, false)}
        <div class="africa-choice-row">
          ${faces.map((f) => `<button type="button" class="africa-choice${state.facing === f.id ? " is-on" : ""}" data-action="form-facing" data-facing="${f.id}">${escapeHTML(zh ? f.zh : f.en)}</button>`).join("")}
        </div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }

    if (step === "gua") {
      const guas = [
        { n: 1, en: "Kan 1", zh: "坎 1" },
        { n: 2, en: "Kun 2", zh: "坤 2" },
        { n: 3, en: "Zhen 3", zh: "震 3" },
        { n: 4, en: "Xun 4", zh: "巽 4" },
        { n: 6, en: "Qian 6", zh: "乾 6" },
        { n: 7, en: "Dui 7", zh: "兑 7" },
        { n: 8, en: "Gen 8", zh: "艮 8" },
        { n: 9, en: "Li 9", zh: "离 9" },
      ];
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "选择命卦" : "Pick a personal gua")}</h3>
        <p class="studio__copy">${escapeHTML(zh ? "教学用卦数（无 5）。" : "Teaching gua numbers (skip 5).")}</p>
        <div class="africa-choice-row">
          ${guas.map((g) => `<button type="button" class="africa-choice${Number(state.gua) === g.n ? " is-on" : ""}" data-action="form-gua" data-gua="${g.n}">${escapeHTML(zh ? g.zh : g.en)}</button>`).join("")}
        </div>
        <div class="field" style="margin-top:1rem"><label for="r-question">${escapeHTML(zh ? "你关心什么？（可选）" : "What concerns you? (optional)")}</label>
        <textarea id="r-question" rows="2" maxlength="280">${escapeHTML(state.question || "")}</textarea></div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }

    if (step === "sectors") {
      const idx = state.steps.indexOf(step);
      const hs = how?.steps?.[Math.min(idx, (how.steps || []).length - 1)];
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(hs?.title || (zh ? "查看宅位" : "See house sectors"))}</h3>
        <p class="studio__copy">${escapeHTML(hs?.body || "")}</p>
        ${formStageHTML(rite, false)}
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }

    if (step === "period") {
      const periods = [
        { id: "8", en: "Period 8", zh: "八运" },
        { id: "9", en: "Period 9", zh: "九运" },
      ];
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "选择运局视角" : "Choose a period lens")}</h3>
        <div class="africa-choice-row">
          ${periods.map((p) => `<button type="button" class="africa-choice${state.period === p.id ? " is-on" : ""}" data-action="form-period" data-period="${p.id}">${escapeHTML(zh ? p.zh : p.en)}</button>`).join("")}
        </div>
        <div class="field" style="margin-top:1rem"><label for="r-question">${escapeHTML(zh ? "你关心什么？（可选）" : "What concerns you? (optional)")}</label>
        <textarea id="r-question" rows="2" maxlength="280">${escapeHTML(state.question || "")}</textarea></div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }

    if (step === "chart") {
      const idx = state.steps.indexOf(step);
      const hs = how?.steps?.[Math.min(idx, (how.steps || []).length - 1)];
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(hs?.title || (zh ? "打开星盘" : "Open the star chart"))}</h3>
        <p class="studio__copy">${escapeHTML(hs?.body || "")}</p>
        ${formStageHTML(rite, false)}
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }

    if (step === "focus") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "说出焦点" : "Name your focus")}</h3>
        <p class="studio__copy">${escapeHTML(zh ? "事业、亲属、健康忧虑——只留一个。" : "Career, kin, health worry — one theme.")}</p>
        <div class="field"><label for="r-focus">${escapeHTML(zh ? "焦点" : "Focus")}</label>
        <input type="text" id="r-focus" maxlength="120" value="${escapeHTML(state.focus || "")}" placeholder="${escapeHTML(zh ? "例如：事业升迁" : "e.g. career promotion")}" /></div>
        <div class="field" style="margin-top:1rem"><label for="r-question">${escapeHTML(zh ? "补充问题（可选）" : "Optional question")}</label>
        <textarea id="r-question" rows="2" maxlength="280">${escapeHTML(state.question || "")}</textarea></div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }

    if (step === "facezones") {
      const zones = [
        { id: "forehead", en: "Forehead", zh: "额" },
        { id: "brows", en: "Brows", zh: "眉" },
        { id: "eyes", en: "Eyes", zh: "目" },
        { id: "nose", en: "Nose", zh: "鼻" },
        { id: "mouth", en: "Mouth", zh: "口" },
      ];
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "选择面部区域" : "Choose a face zone")}</h3>
        ${formStageHTML(rite, false)}
        <div class="africa-choice-row">
          ${zones.map((z) => `<button type="button" class="africa-choice${state.faceZone === z.id ? " is-on" : ""}" data-action="form-facezone" data-zone="${z.id}">${escapeHTML(zh ? z.zh : z.en)}</button>`).join("")}
        </div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }

    if (step === "hand") {
      const hands =
        state.method.id === "mogu"
          ? [
              { id: "left", en: "Left", zh: "左手" },
              { id: "right", en: "Right", zh: "右手" },
            ]
          : [
              { id: "active", en: "Active hand", zh: "主动手" },
              { id: "passive", en: "Passive hand", zh: "被动手" },
            ];
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? (state.method.id === "mogu" ? "出示手" : "选择哪只手") : state.method.id === "mogu" ? "Present a hand" : "Choose which hand")}</h3>
        ${formStageHTML(rite, false)}
        <div class="africa-choice-row">
          ${hands.map((h) => `<button type="button" class="africa-choice${state.hand === h.id ? " is-on" : ""}" data-action="form-hand" data-hand="${h.id}">${escapeHTML(zh ? h.zh : h.en)}</button>`).join("")}
        </div>
        <div class="field" style="margin-top:1rem"><label for="r-question">${escapeHTML(zh ? "你关心什么？（可选）" : "What concerns you? (optional)")}</label>
        <textarea id="r-question" rows="2" maxlength="280">${escapeHTML(state.question || "")}</textarea></div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }

    if (step === "lines") {
      const lines = [
        { id: "life", en: "Life line", zh: "生命线" },
        { id: "head", en: "Head line", zh: "智慧线" },
        { id: "heart", en: "Heart line", zh: "感情线" },
        { id: "fate", en: "Fate line", zh: "事业线" },
      ];
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "描一条主线" : "Trace a major line")}</h3>
        ${formStageHTML(rite, false)}
        <div class="africa-choice-row">
          ${lines.map((l) => `<button type="button" class="africa-choice${state.palmLine === l.id ? " is-on" : ""}" data-action="form-line" data-line="${l.id}">${escapeHTML(zh ? l.zh : l.en)}</button>`).join("")}
        </div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }

    if (step === "bones") {
      const idx = state.steps.indexOf(step);
      const hs = how?.steps?.[Math.min(idx, (how.steps || []).length - 1)];
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(hs?.title || (zh ? "绘出骨架" : "Map the bone frame"))}</h3>
        <p class="studio__copy">${escapeHTML(hs?.body || "")}</p>
        ${formStageHTML(rite, false)}
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }

    if (step === "bodyzone") {
      const zones = [
        { id: "face", en: "Face", zh: "面部" },
        { id: "neck", en: "Neck", zh: "颈项" },
        { id: "hand", en: "Hand", zh: "手部" },
        { id: "shoulder", en: "Shoulder", zh: "肩背" },
      ];
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "选择身体区域" : "Pick a body zone")}</h3>
        ${formStageHTML(rite, false)}
        <div class="africa-choice-row">
          ${zones.map((z) => `<button type="button" class="africa-choice${state.bodyZone === z.id ? " is-on" : ""}" data-action="form-bodyzone" data-zone="${z.id}">${escapeHTML(zh ? z.zh : z.en)}</button>`).join("")}
        </div>
        <div class="field" style="margin-top:1rem"><label for="r-question">${escapeHTML(zh ? "你关心什么？（可选）" : "What concerns you? (optional)")}</label>
        <textarea id="r-question" rows="2" maxlength="280">${escapeHTML(state.question || "")}</textarea></div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }

    if (step === "molepick") {
      const idx = state.steps.indexOf(step);
      const hs = how?.steps?.[Math.min(idx, (how.steps || []).length - 1)];
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(hs?.title || (zh ? "标记痣点" : "Mark the mole"))}</h3>
        <p class="studio__copy">${escapeHTML(hs?.body || "")}</p>
        ${formStageHTML(rite, false)}
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }

    if (step === "qi" || step === "map" || step === "stars" || step === "palace" || step === "mounts" || step === "structure" || step === "omen") {
      const cta = window.FatumChinaForm.loc(rite.castCta);
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(cta)}</h3>
        <p class="studio__copy">${escapeHTML(
          state.question || state.focus
            ? zh
              ? `持念：「${state.question || state.focus}」`
              : `Holding: “${state.question || state.focus}”`
            : ""
        )}</p>
        ${formStageHTML(rite, !!state.casting)}
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="form-cast">${escapeHTML(cta)}</button>
        </div>`;
      return;
    }

    if (step === "result" && state.reading) {
      renderGuidedResult(state.reading, true);
    }
  }

  function doFormChinaCast() {
    const rite = window.FatumChinaForm.get(state.method.id);
    if (!rite) return;
    state.casting = true;
    render();
    window.setTimeout(() => {
      const reading = window.FatumChinaForm.runCast(state.method.id, {
        question: state.question,
        focus: state.focus,
        nonce: state.nonce,
        site: state.site,
        facing: state.facing,
        gua: state.gua,
        period: state.period,
        faceZone: state.faceZone,
        hand: state.hand,
        palmLine: state.palmLine,
        bodyZone: state.bodyZone,
      });
      state.cast = reading.vizData || {};
      state.reading = reading;
      state.casting = false;
      state.stepIndex = state.steps.indexOf("result");
      render();
    }, 900);
  }

  // ——— Korean / Vietnamese destiny & Kiều ———
  function koreavnZh() {
    try {
      return String(window.FatumI18n?.getLocale?.() || "").startsWith("zh");
    } catch (_) {
      return false;
    }
  }

  function koreavnStageHTML(rite, casting) {
    const viz = rite.viz;
    const cast = state.cast || {};
    const anim = casting ? " is-casting" : "";
    const zh = koreavnZh();
    if (viz === "saju-board" || viz === "tutru-board") {
      const cols = [
        { k: zh ? "年" : "Y", v: cast.yearP || "··" },
        { k: zh ? "月" : "M", v: cast.monthP || "··" },
        { k: zh ? "日" : "D", v: cast.dayP || "··" },
        { k: zh ? "时" : "H", v: cast.hourP || "··" },
      ];
      return `<div class="kv-stage kv-stage--pillars${anim}"><div class="kv-pillars">${cols
        .map((c, i) => `<span class="kv-pillar" style="--i:${i}"><em>${escapeHTML(c.k)}</em><strong>${escapeHTML(c.v)}</strong></span>`)
        .join("")}</div>
        <p class="kv-stage__hint">${escapeHTML(
          cast.god ? (zh ? cast.god.zh : cast.god.en) : cast.tag?.t || (zh ? "四柱" : "Pillars")
        )}</p></div>`;
    }
    if (viz === "tojeong-scroll") {
      return `<div class="kv-stage kv-stage--scroll${anim}"><div class="kv-scroll"><span class="kv-scroll__num">${escapeHTML(
        String(cast.code || "·")
      )}</span></div>
        <p class="kv-stage__hint">${escapeHTML(
          cast.lot ? (zh ? cast.lot.zh : cast.lot.en) : zh ? "年签…" : "Year lot…"
        )}</p></div>`;
    }
    if (viz === "gunghap-rings") {
      return `<div class="kv-stage kv-stage--hap${anim}"><div class="kv-hap"><i class="kv-ring kv-ring--a"></i><i class="kv-ring kv-ring--b"></i><span class="kv-hap__score">${escapeHTML(
        String(cast.score || "·")
      )}</span></div>
        <p class="kv-stage__hint">${escapeHTML(
          cast.band ? (zh ? cast.band.zh : cast.band.en) : zh ? "合盘…" : "Harmony…"
        )}</p></div>`;
    }
    if (viz === "tuvi-cung") {
      const cells = Array.from({ length: 12 }, (_, i) => i);
      const hit = cast.cung ? CUNG_INDEX_SAFE(cast.cung) : -1;
      return `<div class="kv-stage kv-stage--cung${anim}"><div class="kv-cung">${cells
        .map((i) => `<span class="kv-cung-cell${i === hit ? " is-hit" : ""}">${i === hit ? "★" : ""}</span>`)
        .join("")}</div>
        <p class="kv-stage__hint">${escapeHTML(
          cast.cung ? (zh ? cast.cung.zh : cast.cung.en) : cast.star || (zh ? "十二宫" : "Twelve cung")
        )}</p></div>`;
    }
    if (viz === "kieu-book") {
      return `<div class="kv-stage kv-stage--book${anim}"><div class="kv-book"><span class="kv-book__page">${escapeHTML(
        String(cast.page || "…")
      )}</span></div>
        <p class="kv-stage__hint">${escapeHTML(
          cast.verse ? (zh ? cast.verse.zh : cast.verse.en) : zh ? "翻开翘传…" : "Opening Kiều…"
        )}</p></div>`;
    }
    return `<div class="kv-stage${anim}"></div>`;
  }

  function CUNG_INDEX_SAFE(cung) {
    const names = ["Mệnh", "Quan", "Tài", "Phu", "Phúc", "Self", "Career", "Wealth", "Partner", "Fortune", "命", "官", "财", "夫", "福"];
    const en = String(cung?.en || "");
    if (/Mệnh|Self/i.test(en)) return 0;
    if (/Quan|Career/i.test(en)) return 3;
    if (/Tài|Wealth/i.test(en)) return 5;
    if (/Phu|Partner/i.test(en)) return 7;
    if (/Phúc|Fortune/i.test(en)) return 10;
    return Math.abs((en.charCodeAt(0) || 0) % 12);
  }

  function renderKoreaVietnam() {
    const rite = window.FatumKoreaVietnam.get(state.method.id);
    if (!rite) return;
    const step = state.steps[state.stepIndex];
    const how = window.FatumKoreaVietnam.howFor(state.method.id);
    const text = window.FatumMethodText ? window.FatumMethodText.localize(state.method) : state.method;
    const zh = koreavnZh();

    if (step === "intent") {
      body.innerHTML = `
        <p class="studio__eyebrow">${escapeHTML(ti(`continent.${state.method.continent}`) || "Asia")} · ${escapeHTML(text.name || state.method.name)}</p>
        <h3 class="studio__heading">${escapeHTML(how?.steps?.[0]?.title || (zh ? "认识这个仪式" : "Meet this rite"))}</h3>
        <p class="studio__copy">${escapeHTML(how?.intro || text.summary || "")}</p>
        ${riteExplanationHTML(state.method, text)}
        ${howItWorksHTML(state.method, { id: "koreavn", label: "Korea / Vietnam" })}
        ${sciencePanelHTML(state.method)}
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="close">${escapeHTML(ti("studio.cancel"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }

    if (step === "question") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "抱定问题" : "Hold your question")}</h3>
        <div class="field"><label for="r-question">${escapeHTML(ti("studio.generic.qLabel"))}</label>
        <textarea id="r-question" rows="3" maxlength="280">${escapeHTML(state.question || "")}</textarea></div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }

    if (step === "birth" || step === "selfbirth") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(
          step === "selfbirth" ? (zh ? "你的出生日期" : "Your birth date") : zh ? "输入出生日期" : "Enter birth date"
        )}</h3>
        <div class="field"><label for="r-birth">${escapeHTML(ti("studio.generic.birthDate") || "Birth date")}</label>
        <input type="date" id="r-birth" value="${escapeHTML(state.birthDate || "")}" /></div>
        <div class="field" style="margin-top:1rem"><label for="r-question">${escapeHTML(zh ? "焦点（可选）" : "Focus (optional)")}</label>
        <input type="text" id="r-question" maxlength="120" value="${escapeHTML(state.question || "")}" /></div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }

    if (step === "partnerbirth") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "对方出生日期" : "Partner birth date")}</h3>
        <div class="field"><label for="r-partner">${escapeHTML(zh ? "对方日期" : "Partner date")}</label>
        <input type="date" id="r-partner" value="${escapeHTML(state.partnerBirth || "")}" /></div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }

    if (step === "birthyear") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "输入出生年" : "Enter birth year")}</h3>
        <div class="field"><label for="r-year">${escapeHTML(zh ? "出生年" : "Birth year")}</label>
        <input type="number" id="r-year" min="1900" max="2100" value="${escapeHTML(state.birthYear || "")}" placeholder="1990" /></div>
        <div class="field" style="margin-top:1rem"><label for="r-question">${escapeHTML(zh ? "你关心什么？（可选）" : "What concerns you? (optional)")}</label>
        <textarea id="r-question" rows="2" maxlength="280">${escapeHTML(state.question || "")}</textarea></div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }

    if (step === "sajuHour" || step === "canchi") {
      const hours = zh
        ? ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"]
        : ["Zi", "Chou", "Yin", "Mao", "Chen", "Si", "Wu", "Wei", "Shen", "You", "Xu", "Hai"];
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(
          step === "canchi" ? (zh ? "设定干支时辰" : "Set Can Chi hour") : zh ? "选择时柱" : "Choose the hour pillar"
        )}</h3>
        <div class="africa-choice-row">
          ${hours.map((h, i) => `<button type="button" class="africa-choice${Number(state.hourIndex) === i ? " is-on" : ""}" data-action="kv-hour" data-hour="${i}">${escapeHTML(h)}</button>`).join("")}
        </div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }

    if (step === "tuviGender") {
      const opts = [
        { id: "yang", en: "Yang chart flag", zh: "阳盘标记" },
        { id: "yin", en: "Yin chart flag", zh: "阴盘标记" },
        { id: "unspecified", en: "Unspecified", zh: "不标注" },
      ];
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "标注性别传统" : "Note gender tradition")}</h3>
        <div class="africa-choice-row">
          ${opts.map((o) => `<button type="button" class="africa-choice${state.gender === o.id ? " is-on" : ""}" data-action="kv-gender" data-gender="${o.id}">${escapeHTML(zh ? o.zh : o.en)}</button>`).join("")}
        </div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }

    if (step === "tojeongLot" || step === "openKieu") {
      const idx = state.steps.indexOf(step);
      const hs = how?.steps?.[Math.min(idx, (how.steps || []).length - 1)];
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(hs?.title || step)}</h3>
        <p class="studio__copy">${escapeHTML(hs?.body || "")}</p>
        ${koreavnStageHTML(rite, false)}
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }

    if (step === "sijusin" || step === "almanac" || step === "hapscore" || step === "tutruPillars" || step === "cungBan" || step === "versePick") {
      const cta = window.FatumKoreaVietnam.loc(rite.castCta);
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(cta)}</h3>
        <p class="studio__copy">${escapeHTML(
          state.question
            ? zh
              ? `持念：「${state.question}」`
              : `Holding: “${state.question}”`
            : ""
        )}</p>
        ${koreavnStageHTML(rite, !!state.casting)}
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="kv-cast">${escapeHTML(cta)}</button>
        </div>`;
      return;
    }

    if (step === "result" && state.reading) {
      renderGuidedResult(state.reading, true);
    }
  }

  function doKoreaVietnamCast() {
    const rite = window.FatumKoreaVietnam.get(state.method.id);
    if (!rite) return;
    state.casting = true;
    render();
    window.setTimeout(() => {
      const reading = window.FatumKoreaVietnam.runCast(state.method.id, {
        question: state.question,
        focus: state.focus,
        nonce: state.nonce,
        birthDate: state.birthDate,
        birthYear: state.birthYear,
        partnerBirth: state.partnerBirth,
        hourIndex: state.hourIndex,
        gender: state.gender,
      });
      state.cast = reading.vizData || {};
      state.reading = reading;
      state.casting = false;
      state.stepIndex = state.steps.indexOf("result");
      render();
    }, 900);
  }

  // ——— Japanese oracles ———
  function japanZh() {
    try {
      return String(window.FatumI18n?.getLocale?.() || "").startsWith("zh");
    } catch (_) {
      return false;
    }
  }

  function japanStageHTML(rite, casting) {
    const viz = rite.viz;
    const cast = state.cast || {};
    const anim = casting ? " is-casting" : "";
    const zh = japanZh();
    if (viz === "omikuji") {
      return `<div class="jp-stage jp-stage--omikuji${anim}"><div class="jp-tube"><span></span><span></span><span></span></div>
        <p class="jp-stage__hint">${escapeHTML(cast.slip ? (zh ? cast.slip.zh : cast.slip.en) : zh ? "摇签中…" : "Shaking…")}</p></div>`;
    }
    if (viz === "onmyodo" || viz === "kaso") {
      const face = cast.dir?.id || cast.facing?.id || state.houi || state.facing || "E";
      return `<div class="jp-stage jp-stage--houi${anim}" data-dir="${escapeHTML(face)}"><div class="jp-compass"><i style="--rot:${face === "N" || face === "NE" ? 0 : face === "E" ? 90 : face === "S" || face === "SW" ? 180 : 270}deg"></i></div>
        <p class="jp-stage__hint">${escapeHTML(face)}</p></div>`;
    }
    if (viz === "rokuyo") {
      return `<div class="jp-stage jp-stage--roku${anim}"><div class="jp-roku">${["大安", "赤口", "先胜", "友引", "先负", "佛灭"]
        .map((l, i) => `<span class="${cast.label && (zh ? cast.label.zh : cast.label.en)?.includes?.(l.slice(0, 1)) || (cast.label && i === ["taian","shakko","sensho","tomobiki","senbu","butsumetsu"].indexOf(cast.label.id)) ? " is-on" : ""}">${escapeHTML(l)}</span>`)
        .join("")}</div></div>`;
    }
    if (viz === "seimei") {
      return `<div class="jp-stage jp-stage--seimei${anim}"><div class="jp-strokes">${escapeHTML(String(cast.strokes || "·"))}</div>
        <p class="jp-stage__hint">${escapeHTML(cast.name || state.personName || "")}</p></div>`;
    }
    if (viz === "sanmei" || viz === "shichu") {
      const cols = [cast.yearP || "··", cast.monthP || "··", cast.dayP || "··", cast.hourP || "··"];
      return `<div class="jp-stage jp-stage--pillars${anim}"><div class="jp-pillars">${cols
        .map((v, i) => `<span style="--i:${i}">${escapeHTML(v)}</span>`)
        .join("")}</div>
        <p class="jp-stage__hint">${escapeHTML(cast.el ? (zh ? cast.el.zh : cast.el.en) : cast.tag?.t || "")}</p></div>`;
    }
    if (viz === "ninestar") {
      return `<div class="jp-stage jp-stage--stars${anim}"><div class="jp-stars">${Array.from({ length: 9 }, (_, i) => {
        const n = i + 1;
        return `<span class="${cast.star?.n === n ? " is-on" : ""}">${n}</span>`;
      }).join("")}</div>
        <p class="jp-stage__hint">${escapeHTML(cast.star ? (zh ? cast.star.zh : cast.star.en) : "")}</p></div>`;
    }
    if (viz === "futomani" || viz === "kiboku") {
      return `<div class="jp-stage jp-stage--crack${anim}"><div class="jp-bone ${viz === "kiboku" ? "is-shell" : ""}"><i></i><i></i></div>
        <p class="jp-stage__hint">${escapeHTML(cast.crack?.t || (zh ? "灼裂中…" : "Heating…"))}</p></div>`;
    }
    if (viz === "chabashira") {
      return `<div class="jp-stage jp-stage--tea${anim}"><div class="jp-cup"><i class="${cast.upright ? "is-up" : ""}"></i></div>
        <p class="jp-stage__hint">${escapeHTML(cast.upright == null ? (zh ? "观察中…" : "Watching…") : cast.upright ? (zh ? "直立" : "Stands") : zh ? "平漂" : "Drifts")}</p></div>`;
    }
    if (viz === "sukuyo") {
      return `<div class="jp-stage jp-stage--mansion${anim}"><div class="jp-mansion">宿</div>
        <p class="jp-stage__hint">${escapeHTML(cast.mansion ? (zh ? cast.mansion.zh : cast.mansion.en) : zh ? "宿曜…" : "Lodge…")}</p></div>`;
    }
    return `<div class="jp-stage${anim}"></div>`;
  }

  function renderJapan() {
    const rite = window.FatumJapanOracles.get(state.method.id);
    if (!rite) return;
    const step = state.steps[state.stepIndex];
    const how = window.FatumJapanOracles.howFor(state.method.id);
    const text = window.FatumMethodText ? window.FatumMethodText.localize(state.method) : state.method;
    const zh = japanZh();
    const backNext = (extra = "") => `
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>${extra}`;

    if (step === "intent") {
      body.innerHTML = `
        <p class="studio__eyebrow">${escapeHTML(ti(`continent.${state.method.continent}`) || "Asia")} · ${escapeHTML(text.name || state.method.name)}</p>
        <h3 class="studio__heading">${escapeHTML(how?.steps?.[0]?.title || (zh ? "认识这个仪式" : "Meet this rite"))}</h3>
        <p class="studio__copy">${escapeHTML(how?.intro || text.summary || "")}</p>
        ${riteExplanationHTML(state.method, text)}
        ${howItWorksHTML(state.method, { id: "japan", label: "Japan" })}
        ${sciencePanelHTML(state.method)}
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="close">${escapeHTML(ti("studio.cancel"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }
    if (step === "question") {
      const qTitle =
        state.method.id === "chabashira"
          ? zh
            ? "写下今日心愿"
            : "Name today’s wish"
          : zh
            ? "抱定问题"
            : "Hold your question";
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(qTitle)}</h3>
        <div class="field"><label for="r-question">${escapeHTML(ti("studio.generic.qLabel"))}</label>
        <textarea id="r-question" rows="3" maxlength="280">${escapeHTML(state.question || "")}</textarea></div>
        ${backNext()}`;
      return;
    }
    if (step === "birth") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "输入出生日期" : "Enter birth date")}</h3>
        <div class="field"><label for="r-birth">${escapeHTML(ti("studio.generic.birthDate") || "Birth date")}</label>
        <input type="date" id="r-birth" value="${escapeHTML(state.birthDate || "")}" /></div>
        <div class="field" style="margin-top:1rem"><label for="r-question">${escapeHTML(zh ? "焦点（可选）" : "Focus (optional)")}</label>
        <input type="text" id="r-question" maxlength="120" value="${escapeHTML(state.question || "")}" /></div>
        ${backNext()}`;
      return;
    }
    if (step === "birthyear") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "输入出生年" : "Enter birth year")}</h3>
        <div class="field"><label for="r-year">${escapeHTML(zh ? "出生年" : "Birth year")}</label>
        <input type="number" id="r-year" min="1900" max="2100" value="${escapeHTML(state.birthYear || "")}" /></div>
        ${backNext()}`;
      return;
    }
    if (step === "dayDate" || step === "daypickRoku") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "点选日期" : "Pick a day")}</h3>
        <div class="field"><label for="r-day">${escapeHTML(zh ? "日期" : "Date")}</label>
        <input type="date" id="r-day" value="${escapeHTML(state.dayDate || "")}" /></div>
        <div class="field" style="margin-top:1rem"><label for="r-question">${escapeHTML(zh ? "目的（可选）" : "Purpose (optional)")}</label>
        <input type="text" id="r-question" maxlength="120" value="${escapeHTML(state.question || "")}" /></div>
        ${backNext()}`;
      return;
    }
    if (step === "nameIn") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "输入姓名" : "Enter a name")}</h3>
        <div class="field"><label for="r-name">${escapeHTML(zh ? "姓名" : "Name")}</label>
        <input type="text" id="r-name" maxlength="40" value="${escapeHTML(state.personName || "")}" /></div>
        <div class="field" style="margin-top:1rem"><label for="r-question">${escapeHTML(zh ? "问题（可选）" : "Question (optional)")}</label>
        <textarea id="r-question" rows="2" maxlength="280">${escapeHTML(state.question || "")}</textarea></div>
        ${backNext()}`;
      return;
    }
    if (step === "houi" || step === "kasoFacing") {
      const dirs = [
        { id: "N", en: "North", zh: "北" },
        { id: "E", en: "East", zh: "东" },
        { id: "S", en: "South", zh: "南" },
        { id: "W", en: "West", zh: "西" },
        { id: "NE", en: "Northeast", zh: "东北" },
        { id: "SW", en: "Southwest", zh: "西南" },
      ].filter((d) => (step === "kasoFacing" ? ["N", "E", "S", "W"].includes(d.id) : true));
      const cur = step === "kasoFacing" ? state.facing : state.houi;
      const act = step === "kasoFacing" ? "jp-facing" : "jp-houi";
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "设定方位／朝向" : "Set direction / facing")}</h3>
        ${japanStageHTML(rite, false)}
        <div class="africa-choice-row">
          ${dirs.map((d) => `<button type="button" class="africa-choice${cur === d.id ? " is-on" : ""}" data-action="${act}" data-dir="${d.id}">${escapeHTML(zh ? d.zh : d.en)}</button>`).join("")}
        </div>
        ${backNext()}`;
      return;
    }
    if (step === "housePlan") {
      const plans = [
        { id: "house", en: "House", zh: "一户建" },
        { id: "apartment", en: "Apartment", zh: "公寓" },
        { id: "shop", en: "Shop", zh: "店铺" },
      ];
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "标记平面类型" : "Mark the plan type")}</h3>
        <div class="africa-choice-row">
          ${plans.map((p) => `<button type="button" class="africa-choice${state.housePlan === p.id ? " is-on" : ""}" data-action="jp-plan" data-plan="${p.id}">${escapeHTML(zh ? p.zh : p.en)}</button>`).join("")}
        </div>
        ${backNext()}`;
      return;
    }
    if (step === "gogyo") {
      const els = ["Wood", "Fire", "Earth", "Metal", "Water"];
      const zhEls = { Wood: "木", Fire: "火", Earth: "土", Metal: "金", Water: "水" };
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "选择五行视角" : "Choose a gogyō lens")}</h3>
        <div class="africa-choice-row">
          ${els.map((e) => `<button type="button" class="africa-choice${state.gogyo === e ? " is-on" : ""}" data-action="jp-gogyo" data-el="${e}">${escapeHTML(zh ? zhEls[e] : e)}</button>`).join("")}
        </div>
        ${backNext()}`;
      return;
    }
    if (step === "shichuHour") {
      const hours = zh
        ? ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"]
        : ["Zi", "Chou", "Yin", "Mao", "Chen", "Si", "Wu", "Wei", "Shen", "You", "Xu", "Hai"];
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "设定时柱" : "Set the hour pillar")}</h3>
        <div class="africa-choice-row">
          ${hours.map((h, i) => `<button type="button" class="africa-choice${Number(state.hourIndex) === i ? " is-on" : ""}" data-action="jp-hour" data-hour="${i}">${escapeHTML(h)}</button>`).join("")}
        </div>
        ${backNext()}`;
      return;
    }
    if (step === "mansionPick") {
      const mansions = [
        { en: "Krittikā-like lodge", zh: "昴宿意" },
        { en: "Rohiṇī-like lodge", zh: "毕宿意" },
        { en: "Mṛga-like lodge", zh: "参宿意" },
        { en: "Punarvasu-like lodge", zh: "井宿意" },
      ];
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "选择宿视角" : "Pick a mansion lens")}</h3>
        <div class="africa-choice-row">
          ${mansions.map((m) => `<button type="button" class="africa-choice${state.mansion === m.en ? " is-on" : ""}" data-action="jp-mansion" data-mansion="${escapeHTML(m.en)}">${escapeHTML(zh ? m.zh : m.en)}</button>`).join("")}
        </div>
        ${backNext()}`;
      return;
    }
    if (
      step === "shakeTube" ||
      step === "strokeCount" ||
      step === "rokuLabel" ||
      step === "starHouse" ||
      step === "heatBone" ||
      step === "shellHeat" ||
      step === "brewTea" ||
      step === "watchStalk"
    ) {
      const idx = state.steps.indexOf(step);
      const hs = how?.steps?.[Math.min(idx, (how.steps || []).length - 1)];
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(hs?.title || step)}</h3>
        <p class="studio__copy">${escapeHTML(hs?.body || "")}</p>
        ${japanStageHTML(rite, false)}
        ${backNext()}`;
      return;
    }
    if (
      step === "drawSlip" ||
      step === "almanacNote" ||
      step === "counselRoku" ||
      step === "seimeiGrade" ||
      step === "sanmeiBoard" ||
      step === "shichuPillars" ||
      step === "houiStar" ||
      step === "crackRead" ||
      step === "kibokuCrack" ||
      step === "kasoMap" ||
      step === "teaOmen" ||
      step === "sukuyoHost"
    ) {
      const cta = window.FatumJapanOracles.loc(rite.castCta);
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(cta)}</h3>
        <p class="studio__copy">${escapeHTML(state.question ? (zh ? `持念：「${state.question}」` : `Holding: “${state.question}”`) : "")}</p>
        ${japanStageHTML(rite, !!state.casting)}
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="jp-cast">${escapeHTML(cta)}</button>
        </div>`;
      return;
    }
    if (step === "result" && state.reading) renderGuidedResult(state.reading, true);
  }

  function doJapanCast() {
    const rite = window.FatumJapanOracles.get(state.method.id);
    if (!rite) return;
    state.casting = true;
    render();
    window.setTimeout(() => {
      const reading = window.FatumJapanOracles.runCast(state.method.id, {
        question: state.question,
        focus: state.focus,
        nonce: state.nonce,
        birthDate: state.birthDate,
        birthYear: state.birthYear,
        dayDate: state.dayDate,
        personName: state.personName,
        hourIndex: state.hourIndex,
        houi: state.houi,
        facing: state.facing,
        housePlan: state.housePlan,
        gogyo: state.gogyo,
        mansion: state.mansion,
      });
      state.cast = reading.vizData || {};
      state.reading = reading;
      state.casting = false;
      state.stepIndex = state.steps.indexOf("result");
      render();
    }, 900);
  }


  function saZh() {
    try {
      return String(window.FatumI18n?.getLocale?.() || "").startsWith("zh");
    } catch (_) {
      return false;
    }
  }

  function saStageHTML(rite, casting) {
    const cast = state.cast || {};
    const viz = rite.viz || state.method.id;
    const anim = casting ? " is-casting" : "";
    const zh = saZh();
    if (viz === "jyotish") {
      return `<div class="sa-stage sa-stage--jyotish${anim}"><div class="sa-wheel"><i></i></div>
        <p class="sa-stage__hint">${escapeHTML(cast.nak ? (zh ? cast.nak.zh : cast.nak.en) : zh ? "月宿…" : "Nakṣatra…")}</p></div>`;
    }
    if (viz === "kp") {
      return `<div class="sa-stage sa-stage--kp${anim}"><div class="sa-cusps">${Array.from({ length: 12 }, (_, i) => `<span class="${cast.cusp === i + 1 ? "is-on" : ""}">${i + 1}</span>`).join("")}</div>
        <p class="sa-stage__hint">${escapeHTML(cast.sub ? (zh ? cast.sub.zh : cast.sub.en) : "KP")}</p></div>`;
    }
    if (viz === "panchanga") {
      return `<div class="sa-stage sa-stage--panch${anim}"><div class="sa-limbs"><span>T</span><span>N</span><span>Y</span><span>K</span><span>V</span></div>
        <p class="sa-stage__hint">${escapeHTML(cast.tithi ? (zh ? cast.tithi.zh : cast.tithi.en) : zh ? "五历…" : "Limbs…")}</p></div>`;
    }
    if (viz === "ashtamangala") {
      return `<div class="sa-stage sa-stage--eight${anim}"><div class="sa-eight">${["灯", "镜", "螺", "瓶", "花", "布", "果", "金"].map((x) => `<span>${x}</span>`).join("")}</div>
        <p class="sa-stage__hint">${escapeHTML(cast.item ? (zh ? cast.item.zh : cast.item.en) : zh ? "八吉祥…" : "Eight…")}</p></div>`;
    }
    if (viz === "ramala") {
      const rows = cast.rows || [1, 2, 1, 2];
      return `<div class="sa-stage sa-stage--ramala${anim}"><div class="sa-dots">${rows.map((n) => `<span data-n="${n}"></span>`).join("")}</div>
        <p class="sa-stage__hint">${escapeHTML(cast.fig ? (zh ? cast.fig.zh : cast.fig.en) : zh ? "点阵…" : "Dots…")}</p></div>`;
    }
    if (viz === "samudrika") {
      return `<div class="sa-stage sa-stage--body${anim}"><div class="sa-body" data-zone="${escapeHTML(cast.zone?.id || state.bodyZone || "hand")}"></div>
        <p class="sa-stage__hint">${escapeHTML(cast.zone ? (zh ? cast.zone.zh : cast.zone.en) : "")}</p></div>`;
    }
    if (viz === "svara") {
      return `<div class="sa-stage sa-stage--svara${anim}"><div class="sa-breath" data-side="${escapeHTML(cast.side?.id || state.breathSide || "right")}"><i></i><i></i></div>
        <p class="sa-stage__hint">${escapeHTML(cast.side ? (zh ? cast.side.zh : cast.side.en) : zh ? "息…" : "Breath…")}</p></div>`;
    }
    if (viz === "tamil" || viz === "anka") {
      return `<div class="sa-stage sa-stage--num${anim}"><div class="sa-num">${escapeHTML(String(cast.total || cast.planet?.n || "·"))}</div>
        <p class="sa-stage__hint">${escapeHTML(cast.name || cast.planet ? (cast.planet ? (zh ? cast.planet.zh : cast.planet.en) : cast.name) : "")}</p></div>`;
    }
    if (viz === "vastu") {
      return `<div class="sa-stage sa-stage--vastu${anim}"><div class="sa-vastu" data-dir="${escapeHTML(cast.facing?.id || state.facing || "E")}"><i></i></div>
        <p class="sa-stage__hint">${escapeHTML(cast.facing ? (zh ? cast.facing.zh : cast.facing.en) : "")}</p></div>`;
    }
    if (viz === "parrot") {
      return `<div class="sa-stage sa-stage--parrot${anim}"><div class="sa-parrot"><i></i></div>
        <p class="sa-stage__hint">${escapeHTML(cast.card ? (zh ? cast.card.zh : cast.card.en) : zh ? "召唤中…" : "Calling…")}</p></div>`;
    }
    if (viz === "nekath") {
      return `<div class="sa-stage sa-stage--nekath${anim}"><div class="sa-hours"><span></span><span></span><span></span></div>
        <p class="sa-stage__hint">${escapeHTML(cast.hour ? (zh ? cast.hour.zh : cast.hour.en) : zh ? "择时…" : "Hour…")}</p></div>`;
    }
    if (viz === "sarvatobhadra") {
      return `<div class="sa-stage sa-stage--sbc${anim}"><div class="sa-chakra"><i></i></div>
        <p class="sa-stage__hint">${escapeHTML(cast.spoke ? (zh ? cast.spoke.zh : cast.spoke.en) : zh ? "星盘…" : "Chakra…")}</p></div>`;
    }
    return `<div class="sa-stage${anim}"></div>`;
  }

  function renderSouthAsia() {
    const rite = window.FatumSouthAsiaOracles.get(state.method.id);
    if (!rite) return;
    const step = state.steps[state.stepIndex];
    const how = window.FatumSouthAsiaOracles.howFor(state.method.id);
    const text = window.FatumMethodText ? window.FatumMethodText.localize(state.method) : state.method;
    const zh = saZh();
    const backNext = () => `
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;

    if (step === "intent") {
      body.innerHTML = `
        <p class="studio__eyebrow">${escapeHTML(ti(`continent.${state.method.continent}`) || "Asia")} · ${escapeHTML(text.name || state.method.name)}</p>
        <h3 class="studio__heading">${escapeHTML(how?.steps?.[0]?.title || (zh ? "认识这个仪式" : "Meet this rite"))}</h3>
        <p class="studio__copy">${escapeHTML(how?.intro || text.summary || "")}</p>
        ${riteExplanationHTML(state.method, text)}
        ${howItWorksHTML(state.method, { id: "southasia", label: "South Asia" })}
        ${sciencePanelHTML(state.method)}
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="close">${escapeHTML(ti("studio.cancel"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }
    if (step === "question") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "抱定问题" : "Hold your question")}</h3>
        <div class="field"><label for="r-question">${escapeHTML(ti("studio.generic.qLabel"))}</label>
        <textarea id="r-question" rows="3" maxlength="280">${escapeHTML(state.question || "")}</textarea></div>
        ${backNext()}`;
      return;
    }
    if (step === "birth") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "输入出生日期" : "Enter birth date")}</h3>
        <div class="field"><label for="r-birth">${escapeHTML(ti("studio.generic.birthDate") || "Birth date")}</label>
        <input type="date" id="r-birth" value="${escapeHTML(state.birthDate || "")}" /></div>
        <div class="field" style="margin-top:1rem"><label for="r-question">${escapeHTML(zh ? "焦点（可选）" : "Focus (optional)")}</label>
        <input type="text" id="r-question" maxlength="120" value="${escapeHTML(state.question || "")}" /></div>
        ${backNext()}`;
      return;
    }
    if (step === "daypickPanch" || step === "daypickNekath" || step === "daypickSbc") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "点选日期" : "Pick a day")}</h3>
        <div class="field"><label for="r-day">${escapeHTML(zh ? "日期" : "Date")}</label>
        <input type="date" id="r-day" value="${escapeHTML(state.dayDate || "")}" /></div>
        <div class="field" style="margin-top:1rem"><label for="r-question">${escapeHTML(zh ? "目的（可选）" : "Purpose (optional)")}</label>
        <input type="text" id="r-question" maxlength="120" value="${escapeHTML(state.question || "")}" /></div>
        ${backNext()}`;
      return;
    }
    if (step === "nameInTamil") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "输入姓名" : "Enter a name")}</h3>
        <div class="field"><label for="r-name">${escapeHTML(zh ? "姓名" : "Name")}</label>
        <input type="text" id="r-name" maxlength="40" value="${escapeHTML(state.personName || "")}" /></div>
        <div class="field" style="margin-top:1rem"><label for="r-question">${escapeHTML(zh ? "问题（可选）" : "Question (optional)")}</label>
        <textarea id="r-question" rows="2" maxlength="280">${escapeHTML(state.question || "")}</textarea></div>
        ${backNext()}`;
      return;
    }
    if (step === "nakshatraPick") {
      const opts = ["Aśvinī", "Rohiṇī", "Punarvasu", "Maghā", "Hasta", "Śravaṇa"];
      const zhMap = { "Aśvinī": "娄宿意", "Rohiṇī": "毕宿意", "Punarvasu": "井宿意", "Maghā": "星宿意", "Hasta": "翼宿意", "Śravaṇa": "女宿意" };
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "选择月宿视角" : "Pick a nakṣatra lens")}</h3>
        ${saStageHTML(rite, false)}
        <div class="africa-choice-row">
          ${opts.map((o) => `<button type="button" class="africa-choice${state.nakshatra === o ? " is-on" : ""}" data-action="sa-nak" data-nak="${escapeHTML(o)}">${escapeHTML(zh ? zhMap[o] : o)}</button>`).join("")}
        </div>
        ${backNext()}`;
      return;
    }
    if (step === "sublordPick") {
      const opts = ["Ketu sub", "Venus sub", "Sun sub", "Moon sub", "Mars sub", "Rahu sub"];
      const zhMap = { "Ketu sub": "计都次主", "Venus sub": "金星次主", "Sun sub": "太阳次主", "Moon sub": "月亮次主", "Mars sub": "火星次主", "Rahu sub": "罗睺次主" };
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "选择次主星视角" : "Pick a sub-lord lens")}</h3>
        ${saStageHTML(rite, false)}
        <div class="africa-choice-row">
          ${opts.map((o) => `<button type="button" class="africa-choice${state.sublord === o ? " is-on" : ""}" data-action="sa-sub" data-sub="${escapeHTML(o)}">${escapeHTML(zh ? zhMap[o] : o)}</button>`).join("")}
        </div>
        ${backNext()}`;
      return;
    }
    if (step === "bodyZone") {
      const zones = [
        { id: "hand", en: "Hand", zh: "手" },
        { id: "face", en: "Face", zh: "面" },
        { id: "feet", en: "Feet", zh: "足" },
        { id: "brow", en: "Brow", zh: "眉" },
      ];
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "选择部位" : "Pick a body zone")}</h3>
        ${saStageHTML(rite, false)}
        <div class="africa-choice-row">
          ${zones.map((z) => `<button type="button" class="africa-choice${state.bodyZone === z.id ? " is-on" : ""}" data-action="sa-zone" data-zone="${z.id}">${escapeHTML(zh ? z.zh : z.en)}</button>`).join("")}
        </div>
        ${backNext()}`;
      return;
    }
    if (step === "markTrait") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "标注教学特征" : "Mark a teaching trait")}</h3>
        <div class="field"><label for="r-trait">${escapeHTML(zh ? "可见特征" : "Visible trait")}</label>
        <input type="text" id="r-trait" maxlength="80" value="${escapeHTML(state.formTrait || "")}" placeholder="${escapeHTML(zh ? "如：清晰掌纹" : "e.g. clear palm line")}" /></div>
        ${backNext()}`;
      return;
    }
    if (step === "breathSide") {
      const sides = [
        { id: "right", en: "Right (sūrya)", zh: "右息（日）" },
        { id: "left", en: "Left (candra)", zh: "左息（月）" },
        { id: "both", en: "Even (suṣumnā)", zh: "双平（中脉）" },
      ];
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "觉察鼻息侧" : "Notice the breath side")}</h3>
        ${saStageHTML(rite, false)}
        <div class="africa-choice-row">
          ${sides.map((s) => `<button type="button" class="africa-choice${state.breathSide === s.id ? " is-on" : ""}" data-action="sa-breath" data-side="${s.id}">${escapeHTML(zh ? s.zh : s.en)}</button>`).join("")}
        </div>
        ${backNext()}`;
      return;
    }
    if (step === "vastuPlan") {
      const plans = [
        { id: "home", en: "Home", zh: "住宅" },
        { id: "shop", en: "Shop", zh: "店铺" },
        { id: "office", en: "Office", zh: "办公" },
      ];
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "标注空间类型" : "Mark the space type")}</h3>
        <div class="africa-choice-row">
          ${plans.map((p) => `<button type="button" class="africa-choice${state.vastuPlan === p.id ? " is-on" : ""}" data-action="sa-plan" data-plan="${p.id}">${escapeHTML(zh ? p.zh : p.en)}</button>`).join("")}
        </div>
        ${backNext()}`;
      return;
    }
    if (step === "vastuFacing") {
      const dirs = [
        { id: "E", en: "East", zh: "东" },
        { id: "NE", en: "Northeast", zh: "东北" },
        { id: "N", en: "North", zh: "北" },
        { id: "W", en: "West", zh: "西" },
        { id: "S", en: "South", zh: "南" },
      ];
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "设定朝向" : "Set the facing")}</h3>
        ${saStageHTML(rite, false)}
        <div class="africa-choice-row">
          ${dirs.map((d) => `<button type="button" class="africa-choice${state.facing === d.id ? " is-on" : ""}" data-action="sa-facing" data-dir="${d.id}">${escapeHTML(zh ? d.zh : d.en)}</button>`).join("")}
        </div>
        ${backNext()}`;
      return;
    }
    if (step === "nekathHour") {
      const hours = [
        { en: "Good nekatha hour", zh: "吉时" },
        { en: "Neutral nekatha", zh: "平流时" },
        { en: "Care nekatha", zh: "慎时" },
      ];
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "选择择时色带" : "Choose a nekath hour")}</h3>
        ${saStageHTML(rite, false)}
        <div class="africa-choice-row">
          ${hours.map((h) => `<button type="button" class="africa-choice${state.nekathHour === h.en ? " is-on" : ""}" data-action="sa-nekath" data-hour="${escapeHTML(h.en)}">${escapeHTML(zh ? h.zh : h.en)}</button>`).join("")}
        </div>
        ${backNext()}`;
      return;
    }
    if (
      step === "fiveLimbs" ||
      step === "placeEight" ||
      step === "ramalaDots" ||
      step === "uyirMei" ||
      step === "planetNumber" ||
      step === "callParrot" ||
      step === "chakraSpin"
    ) {
      const idx = state.steps.indexOf(step);
      const hs = how?.steps?.[Math.min(idx, (how.steps || []).length - 1)];
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(hs?.title || step)}</h3>
        <p class="studio__copy">${escapeHTML(hs?.body || "")}</p>
        ${saStageHTML(rite, false)}
        ${backNext()}`;
      return;
    }
    if (
      step === "dashaReveal" ||
      step === "kpCusp" ||
      step === "panchCounsel" ||
      step === "prasnaRead" ||
      step === "figureRead" ||
      step === "samudrikaMap" ||
      step === "svaraOmen" ||
      step === "tamilNumber" ||
      step === "ankaBoard" ||
      step === "vastuMap" ||
      step === "cardPick" ||
      step === "nekathCounsel" ||
      step === "sbcCounsel"
    ) {
      const cta = window.FatumSouthAsiaOracles.loc(rite.castCta);
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(cta)}</h3>
        <p class="studio__copy">${escapeHTML(state.question ? (zh ? `持念：「${state.question}」` : `Holding: “${state.question}”`) : "")}</p>
        ${saStageHTML(rite, !!state.casting)}
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="sa-cast">${escapeHTML(cta)}</button>
        </div>`;
      return;
    }
    if (step === "result" && state.reading) renderGuidedResult(state.reading, true);
  }

  function doSouthAsiaCast() {
    const rite = window.FatumSouthAsiaOracles.get(state.method.id);
    if (!rite) return;
    state.casting = true;
    render();
    window.setTimeout(() => {
      const reading = window.FatumSouthAsiaOracles.runCast(state.method.id, {
        question: state.question,
        focus: state.focus,
        nonce: state.nonce,
        birthDate: state.birthDate,
        dayDate: state.dayDate,
        personName: state.personName,
        formTrait: state.formTrait,
        nakshatra: state.nakshatra,
        sublord: state.sublord,
        bodyZone: state.bodyZone,
        breathSide: state.breathSide,
        vastuPlan: state.vastuPlan,
        facing: state.facing,
        nekathHour: state.nekathHour,
      });
      state.cast = reading.vizData || {};
      state.reading = reading;
      state.casting = false;
      state.stepIndex = state.steps.indexOf("result");
      render();
    }, 900);
  }


  function hsZh() {
    try {
      return String(window.FatumI18n?.getLocale?.() || "").startsWith("zh");
    } catch (_) {
      return false;
    }
  }

  function hsStageHTML(rite, casting) {
    const cast = state.cast || {};
    const viz = rite.viz || state.method.id;
    const anim = casting ? " is-casting" : "";
    const zh = hsZh();
    if (viz === "tibetan" || viz === "zurhai") {
      return `<div class="hs-stage hs-stage--tib${anim}"><div class="hs-seal"><span>${escapeHTML(cast.el ? (zh ? cast.el.zh : cast.el.en[0]) : "·")}</span><span>${escapeHTML(cast.an ? (zh ? cast.an.zh : cast.an.en[0]) : "·")}</span></div>
        <p class="hs-stage__hint">${escapeHTML([cast.el && (zh ? cast.el.zh : cast.el.en), cast.an && (zh ? cast.an.zh : cast.an.en)].filter(Boolean).join(" · ") || (zh ? "五行生肖…" : "Element–animal…"))}</p></div>`;
    }
    if (viz === "mo") {
      return `<div class="hs-stage hs-stage--mo${anim}"><div class="hs-dice"><span></span><span></span></div>
        <p class="hs-stage__hint">${escapeHTML(cast.dice || (zh ? "掷骰…" : "Rolling…"))}</p></div>`;
    }
    if (viz === "shagai") {
      return `<div class="hs-stage hs-stage--shagai${anim}"><div class="hs-bones"><span></span><span></span><span></span><span></span></div>
        <p class="hs-stage__hint">${escapeHTML(cast.faces ? cast.faces.map((f) => (zh ? f.zh : f.en)).join(" · ") : zh ? "抛掷…" : "Tossing…")}</p></div>`;
    }
    if (viz === "scapula") {
      return `<div class="hs-stage hs-stage--scapula${anim}"><div class="hs-blade"><i></i></div>
        <p class="hs-stage__hint">${escapeHTML(cast.crack?.t || (zh ? "灼裂中…" : "Heating…"))}</p></div>`;
    }
    if (viz === "mahabote" || viz === "hora" || viz === "khmer") {
      return `<div class="hs-stage hs-stage--houses${anim}"><div class="hs-houses">${Array.from({ length: 8 }, (_, i) => `<span class="${i === (cast.day?.id ?? 0) % 8 ? "is-on" : ""}"></span>`).join("")}</div>
        <p class="hs-stage__hint">${escapeHTML(cast.house ? (zh ? cast.house.zh : cast.house.en) : cast.sign ? (zh ? cast.sign.zh : cast.sign.en) : "")}</p></div>`;
    }
    if (viz === "thaiday" || viz === "taksa") {
      return `<div class="hs-stage hs-stage--color${anim}"><div class="hs-swatch" data-day="${escapeHTML(String(cast.day?.id ?? state.weekday ?? 0))}"></div>
        <p class="hs-stage__hint">${escapeHTML(cast.color ? (zh ? cast.color.zh : cast.color.en) : cast.band ? (zh ? cast.band.zh : cast.band.en) : "")}</p></div>`;
    }
    if (viz === "lao" || viz === "pawukon") {
      return `<div class="hs-stage hs-stage--cal${anim}"><div class="hs-cal"><i></i></div>
        <p class="hs-stage__hint">${escapeHTML(cast.q ? (zh ? cast.q.zh : cast.q.en) : cast.uku ? (zh ? cast.uku.zh : cast.uku.en) : zh ? "历注…" : "Almanac…")}</p></div>`;
    }
    if (viz === "weton") {
      return `<div class="hs-stage hs-stage--weton${anim}"><div class="hs-weight">${escapeHTML(String(cast.weight || "·"))}</div>
        <p class="hs-stage__hint">${escapeHTML(cast.pas ? cast.pas.en : "Pasaran")}</p></div>`;
    }
    return `<div class="hs-stage${anim}"></div>`;
  }

  function renderHimalayaSea() {
    const rite = window.FatumHimalayaSeaOracles.get(state.method.id);
    if (!rite) return;
    const step = state.steps[state.stepIndex];
    const how = window.FatumHimalayaSeaOracles.howFor(state.method.id);
    const textM = window.FatumMethodText ? window.FatumMethodText.localize(state.method) : state.method;
    const zh = hsZh();
    const backNext = () => `
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
    if (step === "intent") {
      body.innerHTML = `
        <p class="studio__eyebrow">${escapeHTML(ti(`continent.${state.method.continent}`) || "Asia")} · ${escapeHTML(textM.name || state.method.name)}</p>
        <h3 class="studio__heading">${escapeHTML(how?.steps?.[0]?.title || (zh ? "认识这个仪式" : "Meet this rite"))}</h3>
        <p class="studio__copy">${escapeHTML(how?.intro || textM.summary || "")}</p>
        ${riteExplanationHTML(state.method, textM)}
        ${howItWorksHTML(state.method, { id: "himalayasea", label: "Himalaya / SE Asia" })}
        ${sciencePanelHTML(state.method)}
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="close">${escapeHTML(ti("studio.cancel"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }
    if (step === "question") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "抱定问题" : "Hold your question")}</h3>
        <div class="field"><label for="r-question">${escapeHTML(ti("studio.generic.qLabel"))}</label>
        <textarea id="r-question" rows="3" maxlength="280">${escapeHTML(state.question || "")}</textarea></div>
        ${backNext()}`;
      return;
    }
    if (step === "birth") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "输入出生日期" : "Enter birth date")}</h3>
        <div class="field"><label for="r-birth">${escapeHTML(ti("studio.generic.birthDate") || "Birth date")}</label>
        <input type="date" id="r-birth" value="${escapeHTML(state.birthDate || "")}" /></div>
        <div class="field" style="margin-top:1rem"><label for="r-question">${escapeHTML(zh ? "焦点（可选）" : "Focus (optional)")}</label>
        <input type="text" id="r-question" maxlength="120" value="${escapeHTML(state.question || "")}" /></div>
        ${backNext()}`;
      return;
    }
    if (step === "birthyear") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "输入出生年" : "Enter birth year")}</h3>
        <div class="field"><label for="r-year">${escapeHTML(zh ? "出生年" : "Birth year")}</label>
        <input type="number" id="r-year" min="1900" max="2100" value="${escapeHTML(state.birthYear || "")}" /></div>
        ${backNext()}`;
      return;
    }
    if (step === "daypickLao" || step === "daypickPawukon") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "点选日期" : "Pick a day")}</h3>
        <div class="field"><label for="r-day">${escapeHTML(zh ? "日期" : "Date")}</label>
        <input type="date" id="r-day" value="${escapeHTML(state.dayDate || "")}" /></div>
        <div class="field" style="margin-top:1rem"><label for="r-question">${escapeHTML(zh ? "目的（可选）" : "Purpose (optional)")}</label>
        <input type="text" id="r-question" maxlength="120" value="${escapeHTML(state.question || "")}" /></div>
        ${backNext()}`;
      return;
    }
    if (step === "weekdayPick" || step === "weekdayThai" || step === "weekdayTaksa") {
      const days = [
        { id: 0, en: "Sunday", zh: "星期日" },
        { id: 1, en: "Monday", zh: "星期一" },
        { id: 2, en: "Tuesday", zh: "星期二" },
        { id: 3, en: "Wednesday", zh: "星期三" },
        { id: 4, en: "Thursday", zh: "星期四" },
        { id: 5, en: "Friday", zh: "星期五" },
        { id: 6, en: "Saturday", zh: "星期六" },
      ];
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "点选星期" : "Pick a weekday")}</h3>
        <div class="africa-choice-row">
          ${days.map((d) => `<button type="button" class="africa-choice${Number(state.weekday) === d.id ? " is-on" : ""}" data-action="hs-weekday" data-day="${d.id}">${escapeHTML(zh ? d.zh : d.en)}</button>`).join("")}
        </div>
        ${backNext()}`;
      return;
    }
    if (step === "elementAnimal" || step === "zurhaiMark") {
      const els = ["Wood", "Fire", "Earth", "Iron", "Water"];
      const ans = ["Tiger", "Hare", "Dragon", "Snake", "Horse", "Sheep"];
      const zhE = { Wood: "木", Fire: "火", Earth: "土", Iron: "铁", Water: "水" };
      const zhA = { Tiger: "虎", Hare: "兔", Dragon: "龙", Snake: "蛇", Horse: "马", Sheep: "羊" };
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "设定五行－生肖" : "Set element–animal")}</h3>
        ${hsStageHTML(rite, false)}
        <p class="studio__copy">${escapeHTML(zh ? "五行" : "Element")}</p>
        <div class="africa-choice-row">
          ${els.map((e) => `<button type="button" class="africa-choice${state.tibElement === e ? " is-on" : ""}" data-action="hs-el" data-el="${e}">${escapeHTML(zh ? zhE[e] : e)}</button>`).join("")}
        </div>
        <p class="studio__copy" style="margin-top:0.8rem">${escapeHTML(zh ? "生肖" : "Animal")}</p>
        <div class="africa-choice-row">
          ${ans.map((a) => `<button type="button" class="africa-choice${state.tibAnimal === a ? " is-on" : ""}" data-action="hs-an" data-an="${a}">${escapeHTML(zh ? zhA[a] : a)}</button>`).join("")}
        </div>
        ${backNext()}`;
      return;
    }
    if (step === "horaHouse") {
      const houses = ["Self house", "Wealth house", "Sibling house", "Home house", "Child house", "Work house"];
      const zhH = { "Self house": "命宫", "Wealth house": "财宫", "Sibling house": "兄弟宫", "Home house": "田宅宫", "Child house": "子女宫", "Work house": "奴仆宫" };
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "选择时宫" : "Pick a hora house")}</h3>
        <div class="africa-choice-row">
          ${houses.map((h) => `<button type="button" class="africa-choice${state.horaHouse === h ? " is-on" : ""}" data-action="hs-hora" data-hora="${escapeHTML(h)}">${escapeHTML(zh ? zhH[h] : h)}</button>`).join("")}
        </div>
        ${backNext()}`;
      return;
    }
    if (step === "khmerSign") {
      const signs = ["Meṣa-like", "Vṛṣabha-like", "Mithuna-like", "Karka-like", "Siṃha-like", "Kanyā-like"];
      const zhS = { "Meṣa-like": "白羊意", "Vṛṣabha-like": "金牛意", "Mithuna-like": "双子意", "Karka-like": "巨蟹意", "Siṃha-like": "狮子意", "Kanyā-like": "处女意" };
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "选择高棉星座" : "Pick a Khmer sign")}</h3>
        <div class="africa-choice-row">
          ${signs.map((s) => `<button type="button" class="africa-choice${state.khmerSign === s ? " is-on" : ""}" data-action="hs-khmer" data-sign="${escapeHTML(s)}">${escapeHTML(zh ? zhS[s] : s)}</button>`).join("")}
        </div>
        ${backNext()}`;
      return;
    }
    if (step === "pasaranPick") {
      const pas = ["Legi", "Pahing", "Pon", "Wagé", "Kliwon"];
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "选择市集日" : "Pick a pasaran day")}</h3>
        <div class="africa-choice-row">
          ${pas.map((p) => `<button type="button" class="africa-choice${state.pasaran === p ? " is-on" : ""}" data-action="hs-pasaran" data-pas="${p}">${escapeHTML(p)}</button>`).join("")}
        </div>
        ${backNext()}`;
      return;
    }
    if (step === "ukuWeek") {
      const ukus = ["Sinta week", "Landep week", "Ukir week", "Kulantir week"];
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "查看乌库周" : "See the uku week")}</h3>
        ${hsStageHTML(rite, false)}
        <div class="africa-choice-row">
          ${ukus.map((u) => `<button type="button" class="africa-choice${state.ukuWeek === u ? " is-on" : ""}" data-action="hs-uku" data-uku="${escapeHTML(u)}">${escapeHTML(u)}</button>`).join("")}
        </div>
        ${backNext()}`;
      return;
    }
    if (
      step === "rollMo" ||
      step === "tossBones" ||
      step === "heatScapula" ||
      step === "mahaboteHouse" ||
      step === "colorBuddha" ||
      step === "letterBand" ||
      step === "laoQuality"
    ) {
      const i = state.steps.indexOf(step);
      const hs = how?.steps?.[Math.min(i, (how.steps || []).length - 1)];
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(hs?.title || step)}</h3>
        <p class="studio__copy">${escapeHTML(hs?.body || "")}</p>
        ${hsStageHTML(rite, false)}
        ${backNext()}`;
      return;
    }
    if (
      step === "tibetanBoard" ||
      step === "moVerse" ||
      step === "zurhaiChart" ||
      step === "shagaiFaces" ||
      step === "asiaCrack" ||
      step === "mahaboteLean" ||
      step === "horaReveal" ||
      step === "thaiDayCounsel" ||
      step === "taksaName" ||
      step === "khmerBoard" ||
      step === "laoCounsel" ||
      step === "wetonWeight" ||
      step === "pawukonCounsel"
    ) {
      const cta = window.FatumHimalayaSeaOracles.loc(rite.castCta);
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(cta)}</h3>
        <p class="studio__copy">${escapeHTML(state.question ? (zh ? `持念：「${state.question}」` : `Holding: “${state.question}”`) : "")}</p>
        ${hsStageHTML(rite, !!state.casting)}
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="hs-cast">${escapeHTML(cta)}</button>
        </div>`;
      return;
    }
    if (step === "result" && state.reading) renderGuidedResult(state.reading, true);
  }

  function doHimalayaSeaCast() {
    const rite = window.FatumHimalayaSeaOracles.get(state.method.id);
    if (!rite) return;
    state.casting = true;
    render();
    window.setTimeout(() => {
      const reading = window.FatumHimalayaSeaOracles.runCast(state.method.id, {
        question: state.question,
        focus: state.focus,
        nonce: state.nonce,
        birthDate: state.birthDate,
        birthYear: state.birthYear,
        dayDate: state.dayDate,
        weekday: state.weekday,
        tibElement: state.tibElement,
        tibAnimal: state.tibAnimal,
        horaHouse: state.horaHouse,
        khmerSign: state.khmerSign,
        pasaran: state.pasaran,
        ukuWeek: state.ukuWeek,
      });
      state.cast = reading.vizData || {};
      state.reading = reading;
      state.casting = false;
      state.stepIndex = state.steps.indexOf("result");
      render();
    }, 900);
  }

  // ——— Near East / Abrahamic / Mesopotamian ———
  function neZh() {
    try {
      return String(window.FatumI18n?.getLocale?.() || "").startsWith("zh");
    } catch (_) {
      return false;
    }
  }

  function neStageHTML(rite, casting) {
    const cast = state.cast || {};
    const zh = neZh();
    const anim = casting ? " is-casting" : "";
    const viz = rite?.viz || "";
    if (viz === "islamic" || viz === "elect" || viz === "firdaria") {
      const label =
        cast.hour ? (zh ? cast.hour.zh : cast.hour.en) : cast.lord ? (zh ? cast.lord.zh : cast.lord.en) : zh ? "行星时…" : "Hour…";
      return `<div class="ne-stage ne-stage--chart${anim}"><div class="ne-ring"><i></i><i></i><i></i></div>
        <p class="ne-stage__hint">${escapeHTML(label)}</p></div>`;
    }
    if (viz === "manazil") {
      return `<div class="ne-stage ne-stage--mansions${anim}"><div class="ne-mansions">${Array.from({ length: 7 }, (_, i) => `<span class="${i === 2 ? "is-on" : ""}"></span>`).join("")}</div>
        <p class="ne-stage__hint">${escapeHTML(cast.m ? (zh ? cast.m.zh : cast.m.en) : zh ? "月宿…" : "Manzil…")}</p></div>`;
    }
    if (viz === "hafez") {
      return `<div class="ne-stage ne-stage--book${anim}"><div class="ne-book"><span></span><span></span></div>
        <p class="ne-stage__hint">${escapeHTML(cast.verse ? (zh ? cast.verse.zh : cast.verse.en) : zh ? "诗集…" : "Divan…")}</p></div>`;
    }
    if (viz === "istikhara") {
      return `<div class="ne-stage ne-stage--ease${anim}"><div class="ne-ease"></div>
        <p class="ne-stage__hint">${escapeHTML(cast.sign ? (zh ? cast.sign.zh : cast.sign.en) : zh ? "心安…" : "Ease…")}</p></div>`;
    }
    if (viz === "abjad" || viz === "gematria") {
      return `<div class="ne-stage ne-stage--num${anim}"><div class="ne-num">${escapeHTML(String(cast.total || "·"))}</div>
        <p class="ne-stage__hint">${escapeHTML(cast.band ? (zh ? cast.band.zh : cast.band.en) : cast.name || (zh ? "数值…" : "Sum…"))}</p></div>`;
    }
    if (viz === "jafr") {
      return `<div class="ne-stage ne-stage--table${anim}"><div class="ne-grid">${Array.from({ length: 9 }, () => "<span></span>").join("")}</div>
        <p class="ne-stage__hint">${escapeHTML(cast.phrase ? (zh ? cast.phrase.zh : cast.phrase.en) : zh ? "字母表…" : "Table…")}</p></div>`;
    }
    if (viz === "arrow") {
      return `<div class="ne-stage ne-stage--arrow${anim}"><div class="ne-arrow"><i></i></div>
        <p class="ne-stage__hint">${escapeHTML(cast.arrow ? (zh ? cast.arrow.zh : cast.arrow.en) : zh ? "抽箭…" : "Arrow…")}</p></div>`;
    }
    if (viz === "mazalot") {
      return `<div class="ne-stage ne-stage--zodiac${anim}"><div class="ne-zodiac"><span></span><span></span><span></span></div>
        <p class="ne-stage__hint">${escapeHTML(cast.sign ? (zh ? cast.sign.zh : cast.sign.en) : zh ? "黄道…" : "Mazal…")}</p></div>`;
    }
    if (viz === "urim") {
      return `<div class="ne-stage ne-stage--lots${anim}"><div class="ne-lots"><span></span><span></span></div>
        <p class="ne-stage__hint">${escapeHTML(cast.reply ? (zh ? cast.reply.zh : cast.reply.en) : zh ? "签石…" : "Lots…")}</p></div>`;
    }
    if (viz === "goral") {
      return `<div class="ne-stage ne-stage--goral${anim}"><div class="ne-spin"></div>
        <p class="ne-stage__hint">${escapeHTML(cast.page ? (zh ? cast.page.zh : cast.page.en) : zh ? "签图…" : "Goral…")}</p></div>`;
    }
    if (viz === "coffee") {
      return `<div class="ne-stage ne-stage--cup${anim}"><div class="ne-cup"><i></i></div>
        <p class="ne-stage__hint">${escapeHTML(cast.shape ? (zh ? cast.shape.zh : cast.shape.en) : zh ? "渣形…" : "Grounds…")}</p></div>`;
    }
    if (viz === "lead") {
      return `<div class="ne-stage ne-stage--lead${anim}"><div class="ne-lead"><i></i></div>
        <p class="ne-stage__hint">${escapeHTML(cast.shape ? (zh ? cast.shape.zh : cast.shape.en) : zh ? "铅形…" : "Lead…")}</p></div>`;
    }
    if (viz === "liver") {
      return `<div class="ne-stage ne-stage--liver${anim}"><div class="ne-liver"></div>
        <p class="ne-stage__hint">${escapeHTML(cast.omen ? (zh ? cast.omen.zh : cast.omen.en) : zh ? "肝图…" : "Liver…")}</p></div>`;
    }
    if (viz === "dream") {
      return `<div class="ne-stage ne-stage--dream${anim}"><div class="ne-tablet"><span></span><span></span></div>
        <p class="ne-stage__hint">${escapeHTML(cast.omen ? (zh ? cast.omen.zh : cast.omen.en) : cast.note || (zh ? "泥板…" : "Tablet…"))}</p></div>`;
    }
    return `<div class="ne-stage${anim}"></div>`;
  }

  function renderNearEast() {
    const rite = window.FatumNearEastOracles.get(state.method.id);
    if (!rite) return;
    const step = state.steps[state.stepIndex];
    const how = window.FatumNearEastOracles.howFor(state.method.id);
    const textM = window.FatumMethodText ? window.FatumMethodText.localize(state.method) : state.method;
    const zh = neZh();
    const backNext = () => `
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
    if (step === "intent") {
      body.innerHTML = `
        <p class="studio__eyebrow">${escapeHTML(ti(`continent.${state.method.continent}`) || "Asia")} · ${escapeHTML(textM.name || state.method.name)}</p>
        <h3 class="studio__heading">${escapeHTML(how?.steps?.[0]?.title || (zh ? "认识这个仪式" : "Meet this rite"))}</h3>
        <p class="studio__copy">${escapeHTML(how?.intro || textM.summary || "")}</p>
        ${riteExplanationHTML(state.method, textM)}
        ${howItWorksHTML(state.method, { id: "neareast", label: "Near East" })}
        ${sciencePanelHTML(state.method)}
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="close">${escapeHTML(ti("studio.cancel"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }
    if (step === "question") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "抱定问题" : "Hold your question")}</h3>
        <div class="field"><label for="r-question">${escapeHTML(ti("studio.generic.qLabel"))}</label>
        <textarea id="r-question" rows="3" maxlength="280">${escapeHTML(state.question || "")}</textarea></div>
        ${backNext()}`;
      return;
    }
    if (step === "birth") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "输入出生日期" : "Enter birth date")}</h3>
        <div class="field"><label for="r-birth">${escapeHTML(ti("studio.generic.birthDate") || "Birth date")}</label>
        <input type="date" id="r-birth" value="${escapeHTML(state.birthDate || "")}" /></div>
        <div class="field" style="margin-top:1rem"><label for="r-question">${escapeHTML(zh ? "焦点（可选）" : "Focus (optional)")}</label>
        <input type="text" id="r-question" maxlength="120" value="${escapeHTML(state.question || "")}" /></div>
        ${backNext()}`;
      return;
    }
    if (step === "daypickManzil" || step === "daypickElect") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "点选日期" : "Pick a day")}</h3>
        <div class="field"><label for="r-day">${escapeHTML(zh ? "日期" : "Date")}</label>
        <input type="date" id="r-day" value="${escapeHTML(state.dayDate || "")}" /></div>
        <div class="field" style="margin-top:1rem"><label for="r-question">${escapeHTML(zh ? "目的（可选）" : "Purpose (optional)")}</label>
        <input type="text" id="r-question" maxlength="120" value="${escapeHTML(state.question || "")}" /></div>
        ${backNext()}`;
      return;
    }
    if (step === "planetHour" || step === "electHour") {
      const hours = ["Saturn hour", "Jupiter hour", "Mars hour", "Sun hour", "Venus hour", "Mercury hour", "Moon hour"];
      const zhH = {
        "Saturn hour": "土星时",
        "Jupiter hour": "木星时",
        "Mars hour": "火星时",
        "Sun hour": "太阳时",
        "Venus hour": "金星时",
        "Mercury hour": "水星时",
        "Moon hour": "月亮时",
      };
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "选择行星时" : "Pick a planetary hour")}</h3>
        ${neStageHTML(rite, false)}
        <div class="africa-choice-row">
          ${hours.map((h) => `<button type="button" class="africa-choice${state.planetHour === h ? " is-on" : ""}" data-action="ne-hour" data-hour="${escapeHTML(h)}">${escapeHTML(zh ? zhH[h] : h)}</button>`).join("")}
        </div>
        ${backNext()}`;
      return;
    }
    if (step === "mansionManzil") {
      const mansions = ["Al-Sharaṭān", "Al-Thurayyā", "Al-Dabarān", "Al-Haçal", "Al-Nathra", "Al-Balda"];
      const zhM = {
        "Al-Sharaṭān": "两角宿",
        "Al-Thurayyā": "昴宿",
        "Al-Dabarān": "毕宿",
        "Al-Haçal": "觜宿意",
        "Al-Nathra": "鬼宿意",
        "Al-Balda": "危宿意",
      };
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "查看月宿" : "See the manzil")}</h3>
        ${neStageHTML(rite, false)}
        <div class="africa-choice-row">
          ${mansions.map((m) => `<button type="button" class="africa-choice${state.manzil === m ? " is-on" : ""}" data-action="ne-manzil" data-manzil="${escapeHTML(m)}">${escapeHTML(zh ? zhM[m] : m)}</button>`).join("")}
        </div>
        ${backNext()}`;
      return;
    }
    if (step === "nameInAbjad" || step === "nameInHebrew") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "输入姓名或词语" : "Enter a name or word")}</h3>
        <div class="field"><label for="r-name">${escapeHTML(zh ? "姓名／词语" : "Name / word")}</label>
        <input type="text" id="r-name" maxlength="80" value="${escapeHTML(state.personName || "")}" /></div>
        <div class="field" style="margin-top:1rem"><label for="r-question">${escapeHTML(zh ? "焦点（可选）" : "Focus (optional)")}</label>
        <input type="text" id="r-question" maxlength="120" value="${escapeHTML(state.question || "")}" /></div>
        ${backNext()}`;
      return;
    }
    if (step === "firdariaLord") {
      const lords = ["Sun period", "Moon period", "Mars period", "Mercury period", "Jupiter period", "Venus period", "Saturn period"];
      const zhL = {
        "Sun period": "日周期",
        "Moon period": "月周期",
        "Mars period": "火周期",
        "Mercury period": "水周期",
        "Jupiter period": "木周期",
        "Venus period": "金周期",
        "Saturn period": "土周期",
      };
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "查看时主" : "See the firdaria lord")}</h3>
        ${neStageHTML(rite, false)}
        <div class="africa-choice-row">
          ${lords.map((l) => `<button type="button" class="africa-choice${state.firdariaLord === l ? " is-on" : ""}" data-action="ne-firdaria" data-lord="${escapeHTML(l)}">${escapeHTML(zh ? zhL[l] : l)}</button>`).join("")}
        </div>
        ${backNext()}`;
      return;
    }
    if (step === "mazalSign") {
      const signs = ["Ṭaleh (Aries)", "Shor (Taurus)", "Teomim (Gemini)", "Sartan (Cancer)", "Aryeh (Leo)", "Betulah (Virgo)"];
      const zhS = {
        "Ṭaleh (Aries)": "白羊",
        "Shor (Taurus)": "金牛",
        "Teomim (Gemini)": "双子",
        "Sartan (Cancer)": "巨蟹",
        "Aryeh (Leo)": "狮子",
        "Betulah (Virgo)": "处女",
      };
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "选择希伯来星座" : "Pick a mazal sign")}</h3>
        ${neStageHTML(rite, false)}
        <div class="africa-choice-row">
          ${signs.map((s) => `<button type="button" class="africa-choice${state.mazalSign === s ? " is-on" : ""}" data-action="ne-mazal" data-sign="${escapeHTML(s)}">${escapeHTML(zh ? zhS[s] : s)}</button>`).join("")}
        </div>
        ${backNext()}`;
      return;
    }
    if (step === "dreamNote") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "记录梦象" : "Note a dream image")}</h3>
        <div class="field"><label for="r-dream">${escapeHTML(zh ? "梦中最醒目的景象" : "What stood out in the dream?")}</label>
        <input type="text" id="r-dream" maxlength="120" value="${escapeHTML(state.dreamNote || "")}" /></div>
        <div class="field" style="margin-top:1rem"><label for="r-question">${escapeHTML(zh ? "焦点（可选）" : "Focus (optional)")}</label>
        <input type="text" id="r-question" maxlength="120" value="${escapeHTML(state.question || "")}" /></div>
        ${backNext()}`;
      return;
    }
    if (
      step === "prayEase" ||
      step === "openDivan" ||
      step === "jafrTable" ||
      step === "drawArrow" ||
      step === "holdLots" ||
      step === "spinGoral" ||
      step === "brewCup" ||
      step === "pourLead" ||
      step === "inspectLiver" ||
      step === "tabletMatch" ||
      step === "abjadSum" ||
      step === "gematriaSum"
    ) {
      const i = state.steps.indexOf(step);
      const hs = how?.steps?.[Math.min(i, (how.steps || []).length - 1)];
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(hs?.title || step)}</h3>
        <p class="studio__copy">${escapeHTML(hs?.body || "")}</p>
        ${neStageHTML(rite, false)}
        ${backNext()}`;
      return;
    }
    if (
      step === "islamicChart" ||
      step === "manazilCounsel" ||
      step === "hafezVerse" ||
      step === "istikharaSign" ||
      step === "abjadLean" ||
      step === "jafrPhrase" ||
      step === "firdariaTone" ||
      step === "electCounsel" ||
      step === "arrowLot" ||
      step === "gematriaLean" ||
      step === "mazalotBoard" ||
      step === "urimReply" ||
      step === "goralPage" ||
      step === "groundsRead" ||
      step === "leadShape" ||
      step === "liverOmen" ||
      step === "dreamOmen"
    ) {
      const cta = window.FatumNearEastOracles.loc(rite.castCta);
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(cta)}</h3>
        <p class="studio__copy">${escapeHTML(state.question ? (zh ? `持念：「${state.question}」` : `Holding: “${state.question}”`) : "")}</p>
        ${neStageHTML(rite, !!state.casting)}
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="ne-cast">${escapeHTML(cta)}</button>
        </div>`;
      return;
    }
    if (step === "result" && state.reading) renderGuidedResult(state.reading, true);
  }

  function doNearEastCast() {
    const rite = window.FatumNearEastOracles.get(state.method.id);
    if (!rite) return;
    state.casting = true;
    render();
    window.setTimeout(() => {
      const reading = window.FatumNearEastOracles.runCast(state.method.id, {
        question: state.question,
        focus: state.focus,
        nonce: state.nonce,
        birthDate: state.birthDate,
        dayDate: state.dayDate,
        personName: state.personName,
        planetHour: state.planetHour,
        manzil: state.manzil,
        firdariaLord: state.firdariaLord,
        mazalSign: state.mazalSign,
        dreamNote: state.dreamNote,
      });
      state.cast = reading.vizData || {};
      state.reading = reading;
      state.casting = false;
      state.stepIndex = state.steps.indexOf("result");
      render();
    }, 900);
  }

  // ——— Western astrology / Hellenic numbers ———
  function waZh() {
    try {
      return String(window.FatumI18n?.getLocale?.() || "").startsWith("zh");
    } catch (_) {
      return false;
    }
  }

  function waStageHTML(rite, casting) {
    const cast = state.cast || {};
    const zh = waZh();
    const anim = casting ? " is-casting" : "";
    const viz = rite?.viz || "";
    if (viz === "westchart" || viz === "horary") {
      const label = cast.sign
        ? zh
          ? cast.sign.zh
          : cast.sign.en
        : cast.figure
          ? zh
            ? cast.figure.zh
            : cast.figure.en
          : zh
            ? "星盘…"
            : "Chart…";
      return `<div class="wa-stage wa-stage--chart${anim}"><div class="wa-wheel"><i></i><i></i><i></i><i></i></div>
        <p class="wa-stage__hint">${escapeHTML(label)}</p></div>`;
    }
    if (viz === "tree") {
      return `<div class="wa-stage wa-stage--tree${anim}"><div class="wa-tree"><span></span><span></span></div>
        <p class="wa-stage__hint">${escapeHTML(cast.tree ? (zh ? cast.tree.zh : cast.tree.en) : zh ? "圣树…" : "Tree…")}</p></div>`;
    }
    if (viz === "lifepath") {
      return `<div class="wa-stage wa-stage--path${anim}"><div class="wa-path">${escapeHTML(String(cast.pathN || "·"))}</div>
        <p class="wa-stage__hint">${escapeHTML(cast.path ? (zh ? cast.path.zh : cast.path.en) : zh ? "生命数…" : "Path…")}</p></div>`;
    }
    if (viz === "isop") {
      return `<div class="wa-stage wa-stage--isop${anim}"><div class="wa-isop">${escapeHTML(String(cast.total || "·"))}</div>
        <p class="wa-stage__hint">${escapeHTML(cast.band ? (zh ? cast.band.zh : cast.band.en) : cast.name || (zh ? "数值…" : "Sum…"))}</p></div>`;
    }
    return `<div class="wa-stage${anim}"></div>`;
  }

  function renderWestAstro() {
    const rite = window.FatumWestAstroOracles.get(state.method.id);
    if (!rite) return;
    const step = state.steps[state.stepIndex];
    const how = window.FatumWestAstroOracles.howFor(state.method.id);
    const textM = window.FatumMethodText ? window.FatumMethodText.localize(state.method) : state.method;
    const zh = waZh();
    const backNext = () => `
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
    if (step === "intent") {
      body.innerHTML = `
        <p class="studio__eyebrow">${escapeHTML(ti(`continent.${state.method.continent}`) || "Europe")} · ${escapeHTML(textM.name || state.method.name)}</p>
        <h3 class="studio__heading">${escapeHTML(how?.steps?.[0]?.title || (zh ? "认识这个仪式" : "Meet this rite"))}</h3>
        <p class="studio__copy">${escapeHTML(how?.intro || textM.summary || "")}</p>
        ${riteExplanationHTML(state.method, textM)}
        ${howItWorksHTML(state.method, { id: "westastro", label: "Western Astrology" })}
        ${sciencePanelHTML(state.method)}
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="close">${escapeHTML(ti("studio.cancel"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }
    if (step === "question") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "抱定问题" : "Hold your question")}</h3>
        <div class="field"><label for="r-question">${escapeHTML(ti("studio.generic.qLabel"))}</label>
        <textarea id="r-question" rows="3" maxlength="280">${escapeHTML(state.question || "")}</textarea></div>
        ${backNext()}`;
      return;
    }
    if (step === "birth") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "输入出生日期" : "Enter birth date")}</h3>
        <div class="field"><label for="r-birth">${escapeHTML(ti("studio.generic.birthDate") || "Birth date")}</label>
        <input type="date" id="r-birth" value="${escapeHTML(state.birthDate || "")}" /></div>
        <div class="field" style="margin-top:1rem"><label for="r-question">${escapeHTML(zh ? "焦点（可选）" : "Focus (optional)")}</label>
        <input type="text" id="r-question" maxlength="120" value="${escapeHTML(state.question || "")}" /></div>
        ${backNext()}`;
      return;
    }
    if (step === "askMoment") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "记录提问时刻" : "Note the ask moment")}</h3>
        ${waStageHTML(rite, false)}
        <div class="field"><label for="r-moment">${escapeHTML(zh ? "提问日期时间" : "Ask date & time")}</label>
        <input type="datetime-local" id="r-moment" value="${escapeHTML(state.askMoment || "")}" /></div>
        ${backNext()}`;
      return;
    }
    if (step === "sunSignPick") {
      const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio"];
      const zhS = { Aries: "白羊", Taurus: "金牛", Gemini: "双子", Cancer: "巨蟹", Leo: "狮子", Virgo: "处女", Libra: "天秤", Scorpio: "天蝎" };
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "选择太阳星座" : "Pick a sun-sign lens")}</h3>
        ${waStageHTML(rite, false)}
        <div class="africa-choice-row">
          ${signs.map((s) => `<button type="button" class="africa-choice${state.sunSign === s ? " is-on" : ""}" data-action="wa-sign" data-sign="${s}">${escapeHTML(zh ? zhS[s] : s)}</button>`).join("")}
        </div>
        ${backNext()}`;
      return;
    }
    if (step === "treePick") {
      const trees = ["Birch", "Rowan", "Ash", "Alder", "Willow", "Oak", "Holly", "Hazel"];
      const zhT = { Birch: "桦树", Rowan: "花楸", Ash: "梣树", Alder: "赤杨", Willow: "柳树", Oak: "橡树", Holly: "冬青", Hazel: "榛树" };
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "选择圣树" : "Pick a tree")}</h3>
        ${waStageHTML(rite, false)}
        <div class="africa-choice-row">
          ${trees.map((t) => `<button type="button" class="africa-choice${state.celticTree === t ? " is-on" : ""}" data-action="wa-tree" data-tree="${t}">${escapeHTML(zh ? zhT[t] : t)}</button>`).join("")}
        </div>
        ${backNext()}`;
      return;
    }
    if (step === "nameInGreek") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "输入姓名或词语" : "Enter a name or word")}</h3>
        <div class="field"><label for="r-name">${escapeHTML(zh ? "姓名／词语" : "Name / word")}</label>
        <input type="text" id="r-name" maxlength="80" value="${escapeHTML(state.personName || "")}" /></div>
        <div class="field" style="margin-top:1rem"><label for="r-question">${escapeHTML(zh ? "焦点（可选）" : "Focus (optional)")}</label>
        <input type="text" id="r-question" maxlength="120" value="${escapeHTML(state.question || "")}" /></div>
        ${backNext()}`;
      return;
    }
    if (step === "lifePathSum" || step === "isopSum") {
      const i = state.steps.indexOf(step);
      const hs = how?.steps?.[Math.min(i, (how.steps || []).length - 1)];
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(hs?.title || step)}</h3>
        <p class="studio__copy">${escapeHTML(hs?.body || "")}</p>
        ${waStageHTML(rite, false)}
        ${backNext()}`;
      return;
    }
    if (step === "westChart" || step === "horaryChart" || step === "treeCounsel" || step === "lifePathLean" || step === "isopLean") {
      const cta = window.FatumWestAstroOracles.loc(rite.castCta);
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(cta)}</h3>
        <p class="studio__copy">${escapeHTML(state.question ? (zh ? `持念：「${state.question}」` : `Holding: “${state.question}”`) : "")}</p>
        ${waStageHTML(rite, !!state.casting)}
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="wa-cast">${escapeHTML(cta)}</button>
        </div>`;
      return;
    }
    if (step === "result" && state.reading) renderGuidedResult(state.reading, true);
  }

  function doWestAstroCast() {
    const rite = window.FatumWestAstroOracles.get(state.method.id);
    if (!rite) return;
    state.casting = true;
    render();
    window.setTimeout(() => {
      const reading = window.FatumWestAstroOracles.runCast(state.method.id, {
        question: state.question,
        focus: state.focus,
        nonce: state.nonce,
        birthDate: state.birthDate,
        personName: state.personName,
        sunSign: state.sunSign,
        celticTree: state.celticTree,
        askMoment: state.askMoment,
      });
      state.cast = reading.vizData || {};
      state.reading = reading;
      state.casting = false;
      state.stepIndex = state.steps.indexOf("result");
      render();
    }, 900);
  }

  // ——— Cartomancy decks (non-tarot) ———
  function cmZh() {
    try {
      return String(window.FatumI18n?.getLocale?.() || "").startsWith("zh");
    } catch (_) {
      return false;
    }
  }

  function cmStageHTML(rite, casting) {
    const cast = state.cast || {};
    const zh = cmZh();
    const anim = casting ? " is-casting" : "";
    const cards = cast.cards || (cast.card ? [cast.card] : []);
    const labels = cards.map((c) => (zh ? c.zh : c.en)).join(" · ") || (zh ? "洗牌…" : "Cards…");
    const viz = rite?.viz || "cards";
    return `<div class="cm-stage cm-stage--${escapeHTML(viz)}${anim}"><div class="cm-fan">${Array.from({ length: Math.max(3, cards.length || 3) }, (_, i) => `<span class="${i < (cards.length || 0) ? "is-on" : ""}"></span>`).join("")}</div>
      <p class="cm-stage__hint">${escapeHTML(labels)}</p></div>`;
  }

  function renderCartomancy() {
    const rite = window.FatumCartomancyOracles.get(state.method.id);
    if (!rite) return;
    const step = state.steps[state.stepIndex];
    const how = window.FatumCartomancyOracles.howFor(state.method.id);
    const textM = window.FatumMethodText ? window.FatumMethodText.localize(state.method) : state.method;
    const zh = cmZh();
    const backNext = () => `
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
    if (step === "intent") {
      body.innerHTML = `
        <p class="studio__eyebrow">${escapeHTML(ti(`continent.${state.method.continent}`) || "Europe")} · ${escapeHTML(textM.name || state.method.name)}</p>
        <h3 class="studio__heading">${escapeHTML(how?.steps?.[0]?.title || (zh ? "认识这个仪式" : "Meet this rite"))}</h3>
        <p class="studio__copy">${escapeHTML(how?.intro || textM.summary || "")}</p>
        ${riteExplanationHTML(state.method, textM)}
        ${howItWorksHTML(state.method, { id: "cartomancy", label: "Cartomancy" })}
        ${sciencePanelHTML(state.method)}
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="close">${escapeHTML(ti("studio.cancel"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }
    if (step === "question") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "抱定问题" : "Hold your question")}</h3>
        <div class="field"><label for="r-question">${escapeHTML(ti("studio.generic.qLabel"))}</label>
        <textarea id="r-question" rows="3" maxlength="280">${escapeHTML(state.question || "")}</textarea></div>
        ${backNext()}`;
      return;
    }
    if (step === "suitFocus") {
      const suits = ["Hearts focus", "Clubs focus", "Diamonds focus", "Spades focus"];
      const zhS = { "Hearts focus": "红心焦点", "Clubs focus": "梅花焦点", "Diamonds focus": "方块焦点", "Spades focus": "黑桃焦点" };
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "选择花色焦点" : "Pick a suit focus")}</h3>
        ${cmStageHTML(rite, false)}
        <div class="africa-choice-row">
          ${suits.map((s) => `<button type="button" class="africa-choice${state.suitFocus === s ? " is-on" : ""}" data-action="cm-suit" data-suit="${escapeHTML(s)}">${escapeHTML(zh ? zhS[s] : s)}</button>`).join("")}
        </div>
        ${backNext()}`;
      return;
    }
    if (step === "paloPick") {
      const palos = ["Oros", "Copas", "Espadas", "Bastos"];
      const zhP = { Oros: "金币", Copas: "金杯", Espadas: "宝剑", Bastos: "权杖" };
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "选择花色" : "Pick a palo")}</h3>
        ${cmStageHTML(rite, false)}
        <div class="africa-choice-row">
          ${palos.map((p) => `<button type="button" class="africa-choice${state.paloFocus === p ? " is-on" : ""}" data-action="cm-palo" data-palo="${p}">${escapeHTML(zh ? zhP[p] : p)}</button>`).join("")}
        </div>
        ${backNext()}`;
      return;
    }
    if (
      step === "shuffleLenormand" ||
      step === "shuffleKipper" ||
      step === "cutSibilla" ||
      step === "shufflePlaying" ||
      step === "shuffleBaraja" ||
      step === "breatheOracle" ||
      step === "drawThreeLen" ||
      step === "kipperLayout" ||
      step === "sibillaTrio" ||
      step === "drawOracle"
    ) {
      const i = state.steps.indexOf(step);
      const hs = how?.steps?.[Math.min(i, (how.steps || []).length - 1)];
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(hs?.title || step)}</h3>
        <p class="studio__copy">${escapeHTML(hs?.body || "")}</p>
        ${cmStageHTML(rite, false)}
        ${backNext()}`;
      return;
    }
    if (
      step === "lenormandSpread" ||
      step === "kipperCounsel" ||
      step === "sibillaCounsel" ||
      step === "playingSpread" ||
      step === "barajaSpread" ||
      step === "oracleMessage"
    ) {
      const cta = window.FatumCartomancyOracles.loc(rite.castCta);
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(cta)}</h3>
        <p class="studio__copy">${escapeHTML(state.question ? (zh ? `持念：「${state.question}」` : `Holding: “${state.question}”`) : "")}</p>
        ${cmStageHTML(rite, !!state.casting)}
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="cm-cast">${escapeHTML(cta)}</button>
        </div>`;
      return;
    }
    if (step === "result" && state.reading) renderGuidedResult(state.reading, true);
  }

  function doCartomancyCast() {
    const rite = window.FatumCartomancyOracles.get(state.method.id);
    if (!rite) return;
    state.casting = true;
    render();
    window.setTimeout(() => {
      const reading = window.FatumCartomancyOracles.runCast(state.method.id, {
        question: state.question,
        focus: state.focus,
        nonce: state.nonce,
        suitFocus: state.suitFocus,
        paloFocus: state.paloFocus,
      });
      state.cast = reading.vizData || {};
      state.reading = reading;
      state.casting = false;
      state.stepIndex = state.steps.indexOf("result");
      render();
    }, 900);
  }

  // ——— Classical European oracles ———
  function ceZh() {
    try {
      return String(window.FatumI18n?.getLocale?.() || "").startsWith("zh");
    } catch (_) {
      return false;
    }
  }

  function ceStageHTML(rite, casting) {
    const cast = state.cast || {};
    const zh = ceZh();
    const anim = casting ? " is-casting" : "";
    const viz = rite?.viz || "";
    const glyph =
      cast.rune?.glyph ||
      cast.fid?.glyph ||
      "";
    const hint =
      (cast.rune && (zh ? cast.rune.zh : cast.rune.en)) ||
      (cast.fid && (zh ? cast.fid.zh : cast.fid.en)) ||
      (cast.bird && (zh ? cast.bird.zh : cast.bird.en)) ||
      (cast.omen && (zh ? cast.omen.zh : cast.omen.en)) ||
      (cast.verse && (zh ? cast.verse.zh : cast.verse.en)) ||
      (cast.lot && (zh ? cast.lot.zh : cast.lot.en)) ||
      (cast.face && (zh ? cast.face.zh : cast.face.en)) ||
      (cast.figure && (zh ? cast.figure.zh : cast.figure.en)) ||
      (zh ? "征兆…" : "Omen…");
    if (viz === "younger" || viz === "futhorc" || viz === "ogham") {
      return `<div class="ce-stage ce-stage--rune${anim}"><div class="ce-glyph">${escapeHTML(glyph || "ᚠ")}</div>
        <p class="ce-stage__hint">${escapeHTML(hint)}</p></div>`;
    }
    if (viz === "augury") {
      return `<div class="ce-stage ce-stage--sky${anim}"><div class="ce-sky"><i></i><i></i></div>
        <p class="ce-stage__hint">${escapeHTML(hint)}</p></div>`;
    }
    if (viz === "haruspex") {
      return `<div class="ce-stage ce-stage--liver${anim}"><div class="ce-liver"></div>
        <p class="ce-stage__hint">${escapeHTML(hint)}</p></div>`;
    }
    if (viz === "delphi" || viz === "sortes") {
      return `<div class="ce-stage ce-stage--book${anim}"><div class="ce-book"><span></span><span></span></div>
        <p class="ce-stage__hint">${escapeHTML(hint)}</p></div>`;
    }
    if (viz === "lots") {
      return `<div class="ce-stage ce-stage--lots${anim}"><div class="ce-lots"><span></span><span></span><span></span></div>
        <p class="ce-stage__hint">${escapeHTML(hint)}</p></div>`;
    }
    if (viz === "astragal") {
      return `<div class="ce-stage ce-stage--bones${anim}"><div class="ce-bones"><span></span><span></span><span></span><span></span></div>
        <p class="ce-stage__hint">${escapeHTML(hint)}</p></div>`;
    }
    if (viz === "geomancy") {
      return `<div class="ce-stage ce-stage--dots${anim}"><div class="ce-dots">${Array.from({ length: 16 }, () => "<i></i>").join("")}</div>
        <p class="ce-stage__hint">${escapeHTML(hint)}</p></div>`;
    }
    return `<div class="ce-stage${anim}"></div>`;
  }

  const CE_CAST = new Set([
    "youngerCounsel",
    "futhorcCounsel",
    "oghamCounsel",
    "auguryCounsel",
    "haruspexCounsel",
    "pythiaVerse",
    "bibliomancyCounsel",
    "cleromancyCounsel",
    "astragalCounsel",
    "geomancyCounsel",
  ]);

  function renderClassicalEuro() {
    const rite = window.FatumClassicalEuroOracles.get(state.method.id);
    if (!rite) return;
    const step = state.steps[state.stepIndex];
    const how = window.FatumClassicalEuroOracles.howFor(state.method.id);
    const textM = window.FatumMethodText ? window.FatumMethodText.localize(state.method) : state.method;
    const zh = ceZh();
    const backNext = () => `
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
    if (step === "intent") {
      body.innerHTML = `
        <p class="studio__eyebrow">${escapeHTML(ti(`continent.${state.method.continent}`) || "Europe")} · ${escapeHTML(textM.name || state.method.name)}</p>
        <h3 class="studio__heading">${escapeHTML(how?.steps?.[0]?.title || (zh ? "认识这个仪式" : "Meet this rite"))}</h3>
        <p class="studio__copy">${escapeHTML(how?.intro || textM.summary || "")}</p>
        ${riteExplanationHTML(state.method, textM)}
        ${howItWorksHTML(state.method, { id: "classicaleuro", label: "Classical Europe" })}
        ${sciencePanelHTML(state.method)}
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="close">${escapeHTML(ti("studio.cancel"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }
    if (step === "question") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "抱定问题" : "Hold your question")}</h3>
        <div class="field"><label for="r-question">${escapeHTML(ti("studio.generic.qLabel"))}</label>
        <textarea id="r-question" rows="3" maxlength="280">${escapeHTML(state.question || "")}</textarea></div>
        ${backNext()}`;
      return;
    }
    if (CE_CAST.has(step)) {
      const cta = window.FatumClassicalEuroOracles.loc(rite.castCta);
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(cta)}</h3>
        <p class="studio__copy">${escapeHTML(state.question ? (zh ? `持念：「${state.question}」` : `Holding: “${state.question}”`) : "")}</p>
        ${ceStageHTML(rite, !!state.casting)}
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="ce-cast">${escapeHTML(cta)}</button>
        </div>`;
      return;
    }
    if (step === "result" && state.reading) {
      renderGuidedResult(state.reading, true);
      return;
    }
    const i = state.steps.indexOf(step);
    const hs = how?.steps?.[Math.min(i, (how.steps || []).length - 1)];
    body.innerHTML = `
      <h3 class="studio__heading">${escapeHTML(hs?.title || step)}</h3>
      <p class="studio__copy">${escapeHTML(hs?.body || "")}</p>
      ${ceStageHTML(rite, false)}
      ${backNext()}`;
  }

  function doClassicalEuroCast() {
    const rite = window.FatumClassicalEuroOracles.get(state.method.id);
    if (!rite) return;
    state.casting = true;
    render();
    window.setTimeout(() => {
      const reading = window.FatumClassicalEuroOracles.runCast(state.method.id, {
        question: state.question,
        focus: state.focus,
        nonce: state.nonce,
      });
      state.cast = reading.vizData || {};
      state.reading = reading;
      state.casting = false;
      state.stepIndex = state.steps.indexOf("result");
      render();
    }, 900);
  }

  // ——— Folk scrying oracles ———
  const FS_CAST = new Set([
    "scryCounsel",
    "teaCounsel",
    "dowsingCounsel",
    "waxCounsel",
    "slavicCounsel",
    "svyatkiCounsel",
    "balticCounsel",
    "mordovianCounsel",
    "appleCounsel",
    "oomancyCounsel",
    "cloudCounsel",
    "smokeCounsel",
    "fireCounsel",
    "waterCounsel",
    "dominoCounsel",
    "dreamFolkCounsel",
  ]);

  function fsStageHTML(viz, pulse) {
    const F = window.FatumFolkScryOracles;
    const cast = state.cast || {};
    const name = cast.item ? F.loc({ en: cast.item.en, zh: cast.item.zh }) : "";
    const pulseCls = pulse ? " fs-stage--pulse" : "";
    if (viz === "scry") {
      return `<div class="fs-stage fs-stage--scry${pulseCls}" aria-hidden="true"><div class="fs-crystal"><span>${escapeHTML(name || "◇")}</span></div></div>`;
    }
    if (viz === "tea") {
      return `<div class="fs-stage fs-stage--tea${pulseCls}" aria-hidden="true"><div class="fs-cup"><span class="fs-leaves">${escapeHTML(name || "···")}</span></div></div>`;
    }
    if (viz === "pendulum") {
      return `<div class="fs-stage fs-stage--pendulum${pulseCls}" aria-hidden="true"><div class="fs-pendulum"><span class="fs-bob"></span></div><p class="fs-label">${escapeHTML(name || "⋯")}</p></div>`;
    }
    if (viz === "wax") {
      return `<div class="fs-stage fs-stage--wax${pulseCls}" aria-hidden="true"><div class="fs-wax"><span>${escapeHTML(name || "⬡")}</span></div></div>`;
    }
    if (viz === "slavic" || viz === "svyatki" || viz === "baltic" || viz === "mordovian") {
      return `<div class="fs-stage fs-stage--folk${pulseCls}" aria-hidden="true"><div class="fs-folk-glyph">${escapeHTML(name || "✧")}</div></div>`;
    }
    if (viz === "apple") {
      return `<div class="fs-stage fs-stage--apple${pulseCls}" aria-hidden="true"><div class="fs-apple"><span>${escapeHTML(name || "🍎")}</span></div></div>`;
    }
    if (viz === "egg") {
      return `<div class="fs-stage fs-stage--egg${pulseCls}" aria-hidden="true"><div class="fs-egg"><span>${escapeHTML(name || "○")}</span></div></div>`;
    }
    if (viz === "cloud") {
      return `<div class="fs-stage fs-stage--cloud${pulseCls}" aria-hidden="true"><div class="fs-cloud"><span>${escapeHTML(name || "☁")}</span></div></div>`;
    }
    if (viz === "smoke") {
      return `<div class="fs-stage fs-stage--smoke${pulseCls}" aria-hidden="true"><div class="fs-smoke"><span>${escapeHTML(name || "〰")}</span></div></div>`;
    }
    if (viz === "fire") {
      return `<div class="fs-stage fs-stage--fire${pulseCls}" aria-hidden="true"><div class="fs-flame"><span>${escapeHTML(name || "△")}</span></div></div>`;
    }
    if (viz === "water") {
      return `<div class="fs-stage fs-stage--water${pulseCls}" aria-hidden="true"><div class="fs-basin"><span>${escapeHTML(name || "≈")}</span></div></div>`;
    }
    if (viz === "domino") {
      return `<div class="fs-stage fs-stage--domino${pulseCls}" aria-hidden="true"><div class="fs-tile"><span>${escapeHTML(name || "⠿")}</span></div></div>`;
    }
    if (viz === "dreamfolk") {
      return `<div class="fs-stage fs-stage--dream${pulseCls}" aria-hidden="true"><div class="fs-dream"><span>${escapeHTML(name || "☾")}</span></div></div>`;
    }
    return `<div class="fs-stage${pulseCls}" aria-hidden="true"><div class="fs-folk-glyph">${escapeHTML(name || "✦")}</div></div>`;
  }

  function fsZh() {
    try {
      return String(window.FatumI18n?.getLocale?.() || "").startsWith("zh");
    } catch (_) {
      return false;
    }
  }

  function renderFolkScry() {
    const F = window.FatumFolkScryOracles;
    const rite = F.get(state.method.id);
    if (!rite) return renderGeneric();
    const step = state.steps[state.stepIndex];
    const how = F.howFor(state.method.id);
    const zh = fsZh();
    const backNext = () => `
      <div class="studio__actions">
        <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
        <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
      </div>`;

    if (step === "intent") {
      const textM = window.FatumMethodText ? window.FatumMethodText.localize(state.method) : state.method;
      const hs = how?.steps?.[0];
      body.innerHTML = `
        <p class="studio__eyebrow">${escapeHTML(ti(`continent.${state.method.continent}`) || "Europe")} · ${escapeHTML(textM.name || state.method.name)}</p>
        <h3 class="studio__heading">${escapeHTML(hs?.title || (zh ? "认识这个仪式" : "Meet this rite"))}</h3>
        <p class="studio__copy">${escapeHTML(how?.intro || textM.summary || "")}</p>
        ${riteExplanationHTML(state.method, textM)}
        ${howItWorksHTML(state.method, { id: "folkscry", label: "Folk · Scrying" })}
        ${sciencePanelHTML(state.method)}
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="close">${escapeHTML(ti("studio.cancel"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
      return;
    }
    if (step === "question") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "抱定问题" : "Hold your question")}</h3>
        <div class="field"><label for="r-question">${escapeHTML(ti("studio.generic.qLabel"))}</label>
        <textarea id="r-question" rows="3" maxlength="280">${escapeHTML(state.question || "")}</textarea></div>
        ${backNext()}`;
      return;
    }
    if (step === "dreamNoteFolk") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(zh ? "记录梦象" : "Note a dream image")}</h3>
        <div class="field"><label for="r-dream-folk">${escapeHTML(zh ? "梦象" : "Dream image")}</label>
        <textarea id="r-dream-folk" rows="3" maxlength="280" placeholder="${escapeHTML(zh ? "例如：流水、房屋、追逐…" : "e.g. running water, a house, a chase…")}">${escapeHTML(state.dreamNote || "")}</textarea></div>
        ${backNext()}`;
      return;
    }
    if (FS_CAST.has(step)) {
      const cta = F.loc(rite.castCta);
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(cta)}</h3>
        <p class="studio__copy">${escapeHTML(
          state.question
            ? zh
              ? `持念：「${state.question}」`
              : `Holding: “${state.question}”`
            : state.dreamNote
              ? zh
                ? `梦象：「${state.dreamNote}」`
                : `Dream: “${state.dreamNote}”`
              : ""
        )}</p>
        ${fsStageHTML(rite.viz, !!state.casting)}
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="fs-cast">${escapeHTML(cta)}</button>
        </div>`;
      return;
    }
    if (step === "result" && state.reading) {
      renderGuidedResult(state.reading, true);
      return;
    }
    const i = state.steps.indexOf(step);
    const hs = how?.steps?.[Math.min(i, (how.steps || []).length - 1)];
    body.innerHTML = `
      <h3 class="studio__heading">${escapeHTML(hs?.title || step)}</h3>
      <p class="studio__copy">${escapeHTML(hs?.body || "")}</p>
      ${fsStageHTML(rite.viz, true)}
      ${backNext()}`;
  }

  function doFolkScryCast() {
    const rite = window.FatumFolkScryOracles.get(state.method.id);
    if (!rite) return;
    state.casting = true;
    render();
    window.setTimeout(() => {
      const reading = window.FatumFolkScryOracles.runCast(state.method.id, {
        question: state.question,
        focus: state.focus,
        dreamNote: state.dreamNote,
        nonce: state.nonce,
      });
      state.cast = reading.vizData || {};
      state.reading = reading;
      state.casting = false;
      state.stepIndex = state.steps.indexOf("result");
      render();
    }, 900);
  }

  // ——— MBTI ———
  function renderMbti() {
    const step = state.steps[state.stepIndex];
    if (step === "intent") {
      body.innerHTML = `
        <p class="studio__eyebrow">${escapeHTML(ti("studio.mbti.eyebrow") || "MBTI · Preference map")}</p>
        <h3 class="studio__heading">Four letters, four choices</h3>
        ${riteExplanationHTML(state.method)}
        ${howItWorksHTML(state.method, { id: "form" })}
        ${sciencePanelHTML(state.method)}
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="close">${escapeHTML(ti("studio.cancel"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.continue"))}</button>
        </div>`;
    } else if (step === "focus") {
      body.innerHTML = `
        <h3 class="studio__heading">Optional focus</h3>
        <p class="studio__copy">What area should the fate-style counsel speak to?</p>
        <div class="field">
          <label for="r-focus">Focus</label>
          <input type="text" id="r-focus" maxlength="120" placeholder="Career, love, creative work, leadership…" value="${escapeHTML(state.focus)}" />
        </div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.startQuestions"))}</button>
        </div>`;
    } else if (step === "quiz") {
      const q = G().MBTI_QUESTIONS[state.quizIndex];
      const progress = Math.round(((state.quizIndex) / G().MBTI_QUESTIONS.length) * 100);
      body.innerHTML = `
        <div class="quiz-bar"><span style="width:${progress}%"></span></div>
        <p class="studio__eyebrow">${escapeHTML(q.dim)} · ${state.quizIndex + 1}/${G().MBTI_QUESTIONS.length}</p>
        <h3 class="studio__heading">${escapeHTML(mbtiQuestionText(q))}</h3>
        <div class="choice-grid">
          <button type="button" class="choice-btn" data-action="mbti-pick" data-side="${q.a.side}">${escapeHTML(mbtiChoiceLabel(q.a))}</button>
          <button type="button" class="choice-btn" data-action="mbti-pick" data-side="${q.b.side}">${escapeHTML(mbtiChoiceLabel(q.b))}</button>
        </div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
        </div>`;
    } else if (step === "result" && state.reading) {
      renderGuidedResult(state.reading, true);
    }
  }

  function mbtiPick(side) {
    const q = G().MBTI_QUESTIONS[state.quizIndex];
    state.answers[q.id] = side;
    state.quizIndex += 1;
    if (state.quizIndex >= G().MBTI_QUESTIONS.length) {
      state.reading = G().generateMbtiReading({ answers: state.answers, focus: state.focus });
      state.stepIndex = state.steps.indexOf("result");
    }
    render();
  }

  function riteExplanationHTML(method, text) {
    const t = text || (window.FatumMethodText ? window.FatumMethodText.localize(method) : method) || {};
    const explain =
      t.explanation ||
      (window.FatumExplanations && window.FatumExplanations.for(method)) ||
      t.summary ||
      method?.summary ||
      "";
    if (!explain) return "";
    const title = ti("rite.explainTitle") || "About this rite";
    return `<section class="rite-explain" aria-label="${escapeHTML(title)}">
        <h4 class="rite-explain__title">${escapeHTML(title)}</h4>
        <p class="rite-explain__body">${escapeHTML(explain)}</p>
      </section>`;
  }

  function howItWorksHTML(method, process) {
    const how = window.FatumHowItWorks?.for(method, process);
    if (!how || !how.steps?.length) return "";
    const title = ti("howrite.title") || how.title || "How this rite works";
    const steps = how.steps
      .map(
        (s, i) => `<li class="how-rite__step">
          <span class="how-rite__num" aria-hidden="true">${i + 1}</span>
          <div>
            <strong class="how-rite__step-title">${escapeHTML(s.title)}</strong>
            <p class="how-rite__step-body">${escapeHTML(s.body)}</p>
          </div>
        </li>`
      )
      .join("");
    return `<section class="how-rite" aria-label="${escapeHTML(title)}">
        <h4 class="how-rite__title">${escapeHTML(title)}</h4>
        ${how.intro ? `<p class="how-rite__intro">${escapeHTML(how.intro)}</p>` : ""}
        <ol class="how-rite__steps">${steps}</ol>
        ${how.note ? `<p class="how-rite__note">${escapeHTML(how.note)}</p>` : ""}
      </section>`;
  }

  function accuracyAdvisoryHTML() {
    const adv = window.FATE_GLOBAL_ADVISORY;
    const title = ti("advisory.eyebrow") || adv?.title || "Accuracy advisory";
    const body = ti("advisory.body") || adv?.body || "";
    const i18nBullets = [1, 2, 3, 4]
      .map((n) => ti(`advisory.bullet${n}`))
      .filter((b) => b && !/^advisory\.bullet/.test(b));
    const bullets = i18nBullets.length
      ? i18nBullets
      : Array.isArray(adv?.bullets)
        ? adv.bullets
        : [];
    const list = bullets.length
      ? `<ul class="advisory__list">${bullets.map((b) => `<li>${escapeHTML(b)}</li>`).join("")}</ul>`
      : "";
    return `<details class="advisory advisory--compact advisory--collapse">
        <summary class="advisory__summary">
          <span class="advisory__eyebrow">${escapeHTML(title)}</span>
          <span class="advisory__hint" data-closed="${escapeHTML(ti("advisory.show") || "Show")}" data-open="${escapeHTML(ti("advisory.hide") || "Hide")}"></span>
        </summary>
        <div class="advisory__panel">
          <p class="advisory__body">${escapeHTML(body)}</p>
          ${list}
        </div>
      </details>`;
  }

  function sciencePanelHTML(method) {
    const sci = window.fateScienceStatusFor?.(method);
    if (!sci) return accuracyAdvisoryHTML();
    return `<details class="science-box science-box--collapse science-box--${escapeHTML(sci.levelId)}">
        <summary class="science-box__summary">
          <span class="science-box__label">${escapeHTML(ti("science.label") || "Scientific reasoning")} · ${escapeHTML(sci.label)}</span>
          <span class="advisory__hint" data-closed="${escapeHTML(ti("advisory.show") || "Show")}" data-open="${escapeHTML(ti("advisory.hide") || "Hide")}"></span>
        </summary>
        <p class="science-box__text">${escapeHTML(sci.reasoning)}</p>
      </details>
      ${accuracyAdvisoryHTML()}`;
  }

  function resultDisclaimerHTML(method, custom) {
    // Accuracy advisory lives in the collapsed panel — only show rite-specific disclaimer here
    if (!custom) return "";
    return `<p class="reading__disclaimer">${escapeHTML(custom)}</p>`;
  }

  function journalActionsHTML(saved, againLabel) {
    const again = againLabel || ti("action.playAgain");
    if (saved) {
      return `<p class="journal-saved-note" role="status">${escapeHTML(ti("seal.locked", { title: state.journalTitle || "entry" }))} · <a href="#/journal" data-nav="journal" data-action="goto-journal">${escapeHTML(ti("journal.title"))}</a></p>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="again">${escapeHTML(again)}</button>
          <button type="button" class="btn btn--primary" data-action="close">${escapeHTML(ti("action.done"))}</button>
        </div>`;
    }
    return `<div class="studio__actions studio__actions--reward">
        <button type="button" class="btn btn--ghost studio__btn-muted" data-action="again">${escapeHTML(again)}</button>
        <button type="button" class="btn btn--primary btn--seal" data-action="save-journal">◎ ${escapeHTML(ti("action.collectSeal"))}</button>
        <button type="button" class="btn btn--ghost studio__btn-muted" data-action="close">${escapeHTML(ti("action.skip"))}</button>
      </div>`;
  }

  function localePrefersZh() {
    const loc = window.FatumI18n ? window.FatumI18n.getLocale() : "en";
    return String(loc).startsWith("zh");
  }

  function monoText(text) {
    if (window.FatumMethodText) {
      return window.FatumMethodText.scrubForeignScripts(
        window.FatumMethodText.pickBilingual(text, window.FatumI18n ? window.FatumI18n.getLocale() : "en"),
        window.FatumI18n ? window.FatumI18n.getLocale() : "en"
      );
    }
    return text || "";
  }

  function tarotCardLabel(c) {
    if (!c) return "";
    return localePrefersZh() ? c.nameZh || c.name : c.name || c.nameZh;
  }

  function tarotPosLabel(pos) {
    if (!pos) return "";
    return monoText(pos.label || "");
  }

  function tarotPosHint(pos) {
    if (!pos) return "";
    if (localePrefersZh() && pos.hintZh) return pos.hintZh;
    return pos.hint || "";
  }

  function mbtiQuestionText(q) {
    if (!q) return "";
    if (localePrefersZh() && q.textZh) return q.textZh;
    return q.text || "";
  }

  function mbtiChoiceLabel(choice) {
    if (!choice) return "";
    if (localePrefersZh() && choice.labelZh) return choice.labelZh;
    return choice.label || "";
  }

  function readingBlock(titleKey, fallback, bodyHtml) {
    if (!bodyHtml) return "";
    return `<div class="reading__block">
        <h4>${escapeHTML(ti(titleKey) || fallback)}</h4>
        ${bodyHtml}
      </div>`;
  }

  function readingList(items) {
    if (!items || !items.length) return "";
    return `<ul class="reading__guide">${items.map((x) => `<li>${escapeHTML(x)}</li>`).join("")}</ul>`;
  }

  function enrichedReadingHTML(r, opts) {
    const o = opts || {};
    const resultText = r.result || r.omen || "";
    const explainText = r.explain || r.verdict || "";
    const interpretText = r.interpret || "";
    const doList = r.doList || [];
    const dontList = r.dontList || [];
    const details = r.details || [];
    const hasStructured = !!(r.result || r.explain || r.interpret || doList.length || dontList.length);

    if (!hasStructured) {
      return `
        <p class="reading__omen">${escapeHTML(r.omen || "")}</p>
        <p class="reading__verdict">${escapeHTML(r.verdict || "")}</p>
        <ul class="reading__details">${details.map((d) => `<li>${escapeHTML(d)}</li>`).join("")}</ul>
        ${r.counsel ? readingBlock("result.counsel", "Counsel", `<p>${escapeHTML(r.counsel)}</p>`) : ""}
        ${r.timing ? readingBlock("result.next", "Next", `<p>${escapeHTML(r.timing)}</p>`) : ""}
      `;
    }

    return `
      ${readingBlock("result.show", "Your result", `<p class="reading__result">${escapeHTML(monoText(resultText))}</p>`)}
      ${
        details.length
          ? readingBlock(
              "result.facts",
              "What was cast",
              `<ul class="reading__details">${details.map((d) => `<li>${escapeHTML(d)}</li>`).join("")}</ul>`
            )
          : ""
      }
      ${readingBlock("result.explain", "What it means", `<p>${escapeHTML(explainText)}</p>`)}
      ${readingBlock("result.interpret", "For your input", `<p>${escapeHTML(interpretText)}</p>`)}
      ${
        doList.length || dontList.length
          ? `<div class="reading__guidance">
              ${doList.length ? readingBlock("result.do", "Consider doing", readingList(doList)) : ""}
              ${dontList.length ? readingBlock("result.dont", "Consider not doing", readingList(dontList)) : ""}
            </div>`
          : ""
      }
      ${o.extraAfter || ""}
    `;
  }

  function runTypewriter(root) {
    if (!root) return;
    const targets = root.querySelectorAll(".reading__result, .reading__block p, .reading__guide li");
    let delay = 0;
    targets.forEach((el) => {
      const full = el.textContent || "";
      if (!full.trim()) return;
      el.setAttribute("data-full", full);
      el.textContent = "";
      el.classList.add("is-typing");
      const startAt = delay;
      delay += Math.min(1200, 28 * full.length);
      window.setTimeout(() => {
        let i = 0;
        const tick = () => {
          i += 1;
          el.textContent = full.slice(0, i);
          if (i < full.length) {
            window.setTimeout(tick, full.length > 180 ? 8 : 14);
          } else {
            el.classList.remove("is-typing");
          }
        };
        tick();
      }, startAt);
    });
  }

  function renderGuidedResult(r, allowAgain) {
    const africaExtra =
      r.kind === "africa" && state.kind === "africa"
        ? (() => {
            const rite = window.FatumAfricaOracles?.get?.(state.method.id);
            return rite ? africaStageHTML(rite, false) : "";
          })()
        : "";
    const chinaExtra =
      r.kind === "china" && state.kind === "china"
        ? (() => {
            const rite = window.FatumChinaDestiny?.get?.(state.method.id);
            return rite ? chinaStageHTML(rite, false) : "";
          })()
        : "";
    const classicExtra =
      r.kind === "classic" && state.kind === "classic"
        ? (() => {
            const rite = window.FatumChinaClassic?.get?.(state.method.id);
            return rite ? classicStageHTML(rite, false) : "";
          })()
        : "";
    const formExtra =
      r.kind === "formchina" && state.kind === "formchina"
        ? (() => {
            const rite = window.FatumChinaForm?.get?.(state.method.id);
            return rite ? formStageHTML(rite, false) : "";
          })()
        : "";
    const kvExtra =
      r.kind === "koreavn" && state.kind === "koreavn"
        ? (() => {
            const rite = window.FatumKoreaVietnam?.get?.(state.method.id);
            return rite ? koreavnStageHTML(rite, false) : "";
          })()
        : "";
    const japanExtra =
      r.kind === "japan" && state.kind === "japan"
        ? (() => {
            const rite = window.FatumJapanOracles?.get?.(state.method.id);
            return rite ? japanStageHTML(rite, false) : "";
          })()
        : "";
    const saExtra =
      r.kind === "southasia" && state.kind === "southasia"
        ? (() => {
            const rite = window.FatumSouthAsiaOracles?.get?.(state.method.id);
            return rite ? saStageHTML(rite, false) : "";
          })()
        : "";
    const hsExtra =
      r.kind === "himalayasea" && state.kind === "himalayasea"
        ? (() => {
            const rite = window.FatumHimalayaSeaOracles?.get?.(state.method.id);
            return rite ? hsStageHTML(rite, false) : "";
          })()
        : "";
    const neExtra =
      r.kind === "neareast" && state.kind === "neareast"
        ? (() => {
            const rite = window.FatumNearEastOracles?.get?.(state.method.id);
            return rite ? neStageHTML(rite, false) : "";
          })()
        : "";
    const waExtra =
      r.kind === "westastro" && state.kind === "westastro"
        ? (() => {
            const rite = window.FatumWestAstroOracles?.get?.(state.method.id);
            return rite ? waStageHTML(rite, false) : "";
          })()
        : "";
    const cmExtra =
      r.kind === "cartomancy" && state.kind === "cartomancy"
        ? (() => {
            const rite = window.FatumCartomancyOracles?.get?.(state.method.id);
            return rite ? cmStageHTML(rite, false) : "";
          })()
        : "";
    const ceExtra =
      r.kind === "classicaleuro" && state.kind === "classicaleuro"
        ? (() => {
            const rite = window.FatumClassicalEuroOracles?.get?.(state.method.id);
            return rite ? ceStageHTML(rite, false) : "";
          })()
        : "";
    const fsExtra =
      r.kind === "folkscry" && state.kind === "folkscry"
        ? (() => {
            const rite = window.FatumFolkScryOracles?.get?.(state.method.id);
            return rite ? fsStageHTML(rite.viz, false) : "";
          })()
        : "";
    const extra =
      r.kind === "bagua" && r.hex
        ? `<div class="hex-display"><div class="hex-display__gua">${r.hex.upper.symbol}${r.hex.lower.symbol}</div><div class="yao-final">${[...r.lines].reverse().map((l) => `<div class="yao-line${l.changing ? " is-move" : ""}">${l.yang ? "━━━━━━" : "━━  ━━"}${l.changing ? " ·" : ""}</div>`).join("")}</div></div>`
        : r.kind === "tarot" && r.drawn
          ? `<div class="tarot-row tarot-row--result">${r.drawn.map((c, i) => `<div class="tarot-card is-open"><div class="tarot-card__name">${escapeHTML(tarotCardLabel(c))}</div><div class="tarot-card__pos">${escapeHTML(r.positions[i].label)}</div>${c.reversed ? '<div class="tarot-card__rx">Rx</div>' : ""}</div>`).join("")}</div>`
          : r.kind === "mbti"
            ? `<div class="mbti-badge">${escapeHTML(r.title.split("—")[0].trim())}</div>`
            : africaExtra || chinaExtra || classicExtra || formExtra || kvExtra || japanExtra || saExtra || hsExtra || neExtra || waExtra || cmExtra || ceExtra || fsExtra;

    body.innerHTML = `
      <div class="reading reading--typed">
        <p class="studio__eyebrow">${escapeHTML(ti("studio.yourReading"))}</p>
        ${extra}
        <div class="reading__symbol" aria-hidden="true">${r.kind === "bagua" ? "☰" : r.kind === "tarot" ? "✦" : r.kind === "africa" ? "◉" : r.kind === "china" ? "☯" : r.kind === "classic" ? "☰" : r.kind === "formchina" ? "◈" : r.kind === "koreavn" ? "✧" : r.kind === "japan" ? "⛩" : r.kind === "southasia" ? "ॐ" : r.kind === "himalayasea" ? "✧" : r.kind === "neareast" ? "☪" : r.kind === "westastro" ? "☉" : r.kind === "cartomancy" ? "🂠" : r.kind === "classicaleuro" ? "ᚱ" : r.kind === "folkscry" ? "✧" : "◎"}</div>
        <h3 class="studio__heading">${escapeHTML(monoText(r.title))}</h3>
        ${enrichedReadingHTML(r)}
        ${sciencePanelHTML(state.method)}
        ${resultDisclaimerHTML(state.method, r.disclaimer)}
      </div>
      ${journalActionsHTML(!!state.journalSaved, allowAgain ? ti("action.startOver") : ti("action.done"))}`;
    runTypewriter(body);
  }

  // ——— Generic (existing) ———
  function currentGenericStep() {
    return state.process.steps[state.stepIndex];
  }

  function renderGeneric() {
    const method = state.method;
    const process = state.process;
    const step = currentGenericStep();

    if (step === "intent") {
      const photo = state.photoConfig || window.fatePhotoSubjectFor?.(method);
      state.photoConfig = photo;
      const text = window.FatumMethodText ? window.FatumMethodText.localize(method) : method;
      body.innerHTML = `
        <p class="studio__eyebrow">${escapeHTML(ti(`continent.${method.continent}`) || method.continent)} · ${escapeHTML(ti(`type.${method.type}`) || method.type)}</p>
        <h3 class="studio__heading">${escapeHTML(text.name || method.name)}</h3>
        <p class="studio__copy">${escapeHTML(text.summary || method.summary || "")}</p>
        ${riteExplanationHTML(method, text)}
        ${howItWorksHTML(method, process)}
        ${sciencePanelHTML(method)}
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="close">${escapeHTML(ti("studio.cancel"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(ti("studio.startProcess"))}</button>
        </div>`;
    } else if (step === "question") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(ti("studio.generic.holdTitle"))}</h3>
        <div class="field"><label for="r-question">${escapeHTML(ti("studio.generic.qLabel"))}</label>
        <textarea id="r-question" rows="3" maxlength="280">${escapeHTML(state.input.question)}</textarea></div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(process.cta)}</button>
        </div>`;
    } else if (step === "birth") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(ti("studio.generic.birthTitle"))}</h3>
        <div class="field"><label for="r-birth">${escapeHTML(ti("studio.generic.birthDate"))}</label>
        <input type="date" id="r-birth" value="${escapeHTML(state.input.birthDate)}" /></div>
        <div class="field" style="margin-top:1rem"><label for="r-question">${escapeHTML(ti("studio.generic.focusOptional"))}</label>
        <input type="text" id="r-question" value="${escapeHTML(state.input.question)}" /></div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(process.cta)}</button>
        </div>`;
    } else if (step === "blood") {
      const types = ["A", "B", "O", "AB"];
      const selected = state.input.bloodType || "";
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(ti("studio.generic.bloodTitle"))}</h3>
        <p class="studio__copy">${escapeHTML(ti("studio.generic.bloodCopy"))}</p>
        <div class="blood-type-grid" role="radiogroup" aria-label="${escapeHTML(ti("studio.generic.bloodType"))}">
          ${types
            .map(
              (t) => `<button type="button" class="choice-btn blood-type-btn${selected === t ? " is-on" : ""}" data-blood="${t}" aria-pressed="${selected === t ? "true" : "false"}">${t}</button>`
            )
            .join("")}
        </div>
        <div class="field" style="margin-top:1rem"><label for="r-question">${escapeHTML(ti("studio.generic.focusOptional"))}</label>
        <input type="text" id="r-question" value="${escapeHTML(state.input.question)}" placeholder="${escapeHTML(ti("studio.generic.bloodFocusPh"))}" /></div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(process.cta)}</button>
        </div>`;
      body.querySelectorAll("[data-blood]").forEach((btn) => {
        btn.addEventListener("click", () => {
          state.input.bloodType = btn.getAttribute("data-blood") || "";
          body.querySelectorAll("[data-blood]").forEach((b) => {
            const on = b === btn;
            b.classList.toggle("is-on", on);
            b.setAttribute("aria-pressed", on ? "true" : "false");
          });
        });
      });
    } else if (step === "name") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(ti("studio.generic.nameTitle"))}</h3>
        <p class="studio__copy">${escapeHTML(ti("studio.generic.nameCopy"))}</p>
        <div class="field"><label for="r-name">${escapeHTML(ti("studio.generic.personName"))}</label>
        <input type="text" id="r-name" maxlength="80" value="${escapeHTML(state.input.personName)}" placeholder="${escapeHTML(ti("studio.generic.namePh"))}" autocomplete="name" /></div>
        <div class="field" style="margin-top:1rem"><label for="r-question">${escapeHTML(ti("studio.generic.focusOptional"))}</label>
        <input type="text" id="r-question" value="${escapeHTML(state.input.question)}" /></div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(process.cta)}</button>
        </div>`;
    } else if (step === "day") {
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(ti("studio.generic.dayTitle"))}</h3>
        <div class="field"><label for="r-day">${escapeHTML(ti("studio.generic.date"))}</label>
        <input type="date" id="r-day" value="${escapeHTML(state.input.dayDate)}" /></div>
        <div class="field" style="margin-top:1rem"><label for="r-purpose">${escapeHTML(ti("studio.generic.purpose"))}</label>
        <input type="text" id="r-purpose" value="${escapeHTML(state.input.dayPurpose)}" /></div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(process.cta)}</button>
        </div>`;
    } else if (step === "form") {
      const photo = state.photoConfig || window.fatePhotoSubjectFor?.(method);
      state.photoConfig = photo;
      const preview = state.input.photoDataUrl
        ? `<div class="photo-preview"><img src="${state.input.photoDataUrl}" alt="Upload preview" /><button type="button" class="photo-preview__clear" data-action="clear-photo" aria-label="Remove photo">×</button></div>`
        : `<div class="photo-drop" id="photo-drop">
            <p class="photo-drop__label">${escapeHTML(photo ? photo.label : "Upload a photo")}</p>
            <p class="photo-drop__hint">${escapeHTML(photo ? photo.hint : "Optional reference image")}</p>
            <label class="btn btn--ghost studio__btn-muted photo-drop__btn">
              Choose image
              <input type="file" id="r-photo" accept="${escapeHTML(photo?.accept || "image/*")}" hidden />
            </label>
          </div>`;
      body.innerHTML = `
        <h3 class="studio__heading">${escapeHTML(photo ? photo.label.replace(/^Upload a photo of your /i, "Your ").replace(/^Upload /i, "") : "Describe the form")}</h3>
        <p class="studio__copy">${escapeHTML(photo ? photo.hint : "Note the trait you want read.")}</p>
        <div class="photo-field" data-required="${photo && photo.required ? "true" : "false"}">
          ${preview}
          ${state.input.photoDataUrl ? `<p class="photo-filename">${escapeHTML(state.input.photoName || "Photo attached")}</p><label class="btn btn--ghost btn--small studio__btn-muted">Replace<input type="file" id="r-photo" accept="image/*" hidden /></label>` : ""}
        </div>
        <div class="field" style="margin-top:1rem"><label for="r-trait">Trait / observation ${photo?.required ? "" : "(required)"}</label>
        <input type="text" id="r-trait" maxlength="120" placeholder="${escapeHTML(photo?.placeholderTrait || "Describe the main trait…")}" value="${escapeHTML(state.input.formTrait)}" /></div>
        <div class="field" style="margin-top:1rem"><label for="r-focus">Reading focus</label>
        <input type="text" id="r-focus" maxlength="80" placeholder="Character, career, love, health…" value="${escapeHTML(state.input.formFocus)}" /></div>
        <p class="photo-privacy">Photos stay in this browser only (compressed for the reading &amp; journal). Nothing is uploaded to a server.</p>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">${escapeHTML(ti("studio.back"))}</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(process.cta)}</button>
        </div>`;
      bindPhotoInput();
    } else if (step === "ritual") {
      body.innerHTML = `<div class="ritual"><div class="ritual__orb" data-process="${escapeHTML(process.id)}"></div><p class="ritual__label">${escapeHTML(process.ritualLabel)}</p></div>`;
      setTimeout(() => {
        state.input.nonce += 1;
        state.reading = window.fateGenerateReading(state.method, state.process, state.input);
        state.stepIndex = state.process.steps.length - 1;
        render();
      }, 1800);
    } else if (step === "result" && state.reading) {
      const r = state.reading;
      const photoHtml = r.photoDataUrl
        ? `<div class="reading-photo"><img src="${r.photoDataUrl}" alt="Submitted photo for this reading" /></div>`
        : "";
      body.innerHTML = `
        <div class="reading reading--typed tone-${escapeHTML(r.tone || "mixed")}">
          <p class="studio__eyebrow">${escapeHTML(ti("studio.yourReading"))}</p>
          ${photoHtml}
          <div class="reading__symbol">${escapeHTML(r.symbol || "◎")}</div>
          <h3 class="studio__heading">${escapeHTML(r.title)}</h3>
          ${enrichedReadingHTML(r)}
          ${sciencePanelHTML(method)}
          ${resultDisclaimerHTML(method, r.disclaimer)}
        </div>
        ${journalActionsHTML(!!state.journalSaved, ti("studio.readAgain"))}`;
      runTypewriter(body);
    }
  }

  function bindPhotoInput() {
    const input = body.querySelector("#r-photo");
    if (!input) return;
    input.addEventListener("change", async () => {
      const file = input.files && input.files[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        alert("Please choose an image file (JPG, PNG, WEBP, etc.).");
        return;
      }
      try {
        const dataUrl = await compressImageFile(file, 900, 0.72);
        state.input.photoDataUrl = dataUrl;
        state.input.photoName = file.name;
        const cfg = state.photoConfig;
        state.input.photoMeta = cfg
          ? { subjectId: cfg.id, subjectLabel: cfg.label }
          : { subjectId: "form", subjectLabel: "Reference photo" };
        render();
      } catch (err) {
        console.error(err);
        alert("Could not read that image. Try another photo.");
      }
    });
  }

  function compressImageFile(file, maxEdge, quality) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("read failed"));
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          const scale = Math.min(1, maxEdge / Math.max(width, height));
          width = Math.round(width * scale);
          height = Math.round(height * scale);
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = () => reject(new Error("image decode failed"));
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function saveCurrentToJournal() {
    if (!state?.reading || state.journalSaved) return null;
    if (!window.FatumJournal) return null;
    // Keep photo on reading object for journal snapshot
    if (state.input?.photoDataUrl && state.reading && !state.reading.photoDataUrl) {
      state.reading.photoDataUrl = state.input.photoDataUrl;
    }
    const entry = window.FatumJournal.collect({
      methodId: state.method.id,
      methodName: window.FatumMethodText
        ? window.FatumMethodText.localize(state.method).name
        : state.method.name,
      kind: state.reading.kind || state.kind || "generic",
      question: state.question || state.input?.question || "",
      focus: state.focus || state.input?.formFocus || state.input?.dayPurpose || "",
      reading: state.reading,
      photoDataUrl: state.reading.photoDataUrl || state.input?.photoDataUrl || "",
    });
    state.journalSaved = true;
    state.journalEntryId = entry.id;
    state.journalTitle = entry.title;
    document.dispatchEvent(
      new CustomEvent("fatum:seal-collected", { detail: { title: entry.title, id: entry.id } })
    );
    render();
    return entry;
  }

  function captureGeneric() {
    const q = body.querySelector("#r-question");
    const b = body.querySelector("#r-birth");
    const n = body.querySelector("#r-name");
    const d = body.querySelector("#r-day");
    const p = body.querySelector("#r-purpose");
    const ft = body.querySelector("#r-trait");
    const ff = body.querySelector("#r-focus");
    if (q) state.input.question = q.value.trim();
    if (b) state.input.birthDate = b.value;
    if (n) state.input.personName = n.value.trim();
    if (d) state.input.dayDate = d.value;
    if (p) state.input.dayPurpose = p.value.trim();
    if (ft) state.input.formTrait = ft.value.trim();
    if (ff) state.input.formFocus = ff.value.trim();
    const step = currentGenericStep();
    if (step === "question" && !state.input.question) return fail(q);
    if (step === "birth" && !state.input.birthDate) return fail(b);
    if (step === "blood" && !state.input.bloodType) {
      const grid = body.querySelector(".blood-type-grid");
      if (grid) {
        grid.classList.add("field-error");
        setTimeout(() => grid.classList.remove("field-error"), 700);
      }
      return false;
    }
    if (step === "name" && !state.input.personName) return fail(n);
    if (step === "day" && !state.input.dayDate) return fail(d);
    if (step === "form") {
      if (!state.input.formTrait) return fail(ft);
      const needsPhoto = state.photoConfig?.required;
      if (needsPhoto && !state.input.photoDataUrl) {
        const drop = body.querySelector(".photo-drop, .photo-field");
        if (drop) {
          drop.classList.add("field-error");
          setTimeout(() => drop.classList.remove("field-error"), 700);
        }
        return false;
      }
    }
    return true;
  }

  function fail(el) {
    if (el) {
      el.focus();
      el.classList.add("field-error");
      setTimeout(() => el.classList.remove("field-error"), 600);
    }
    return false;
  }

  function goNext() {
    if (state.mode === "guided") {
      const step = state.steps[state.stepIndex];
      if (step === "question") {
        const q = body.querySelector("#r-question");
        state.question = (q?.value || "").trim();
        if (!state.question) return fail(q);
      }
      if (step === "focus") {
        const f = body.querySelector("#r-focus");
        state.focus = (f?.value || "").trim();
      }
      if (step === "birth" && (state.kind === "africa" || state.kind === "china")) {
        const b = body.querySelector("#r-birth");
        state.birthDate = (b?.value || "").trim();
        if (!state.birthDate) return fail(b);
      }
      if (step === "letters" && state.kind === "africa") {
        const L = body.querySelector("#r-letters");
        state.letters = (L?.value || "").trim().toUpperCase();
        if (!state.letters) return fail(L);
      }
      if (state.kind === "china") {
        if (step === "year" || step === "birthyear") {
          const y = body.querySelector("#r-year");
          state.birthYear = String(y?.value || "").trim();
          if (!state.birthYear) return fail(y);
        }
        if (step === "yearcheck") {
          const y = body.querySelector("#r-target-year");
          state.targetYear = String(y?.value || "").trim();
          if (!state.targetYear) return fail(y);
        }
        if (step === "daypick") {
          const d = body.querySelector("#r-day");
          state.dayDate = (d?.value || "").trim();
          if (!state.dayDate) return fail(d);
        }
        const chinaCast = ["pillars", "palaces", "clash", "verdict", "ironplate", "skyboard", "poem", "cast"];
        if (chinaCast.includes(step)) return;
        const next = state.steps[state.stepIndex + 1];
        if (next === "result") return doChinaCast();
      }
      if (state.kind === "classic") {
        if (step === "birth") {
          const b = body.querySelector("#r-birth");
          state.birthDate = (b?.value || "").trim();
          if (!state.birthDate) return fail(b);
        }
        if (step === "numbers") {
          const n = body.querySelector("#r-numbers");
          state.numbers = (n?.value || "").trim();
          if (!state.numbers) return fail(n);
        }
        if (step === "glyph") {
          const g = body.querySelector("#r-glyph");
          state.glyph = (g?.value || "").trim();
        }
        const classicCast = [
          "hexagram",
          "najia",
          "hexderive",
          "board",
          "course",
          "palace",
          "circle",
          "figure",
          "crack",
          "stick",
          "toss",
          "dissect",
        ];
        if (classicCast.includes(step)) return;
      }
      if (state.kind === "formchina") {
        if (step === "site" || step === "gua" || step === "period" || step === "hand" || step === "bodyzone" || step === "focus") {
          const q = body.querySelector("#r-question");
          if (q) state.question = (q.value || "").trim();
        }
        if (step === "focus") {
          const f = body.querySelector("#r-focus");
          state.focus = (f?.value || "").trim();
        }
        const formCast = ["qi", "map", "stars", "palace", "mounts", "structure", "omen"];
        if (formCast.includes(step)) return;
      }
      if (state.kind === "koreavn") {
        if (step === "birth" || step === "selfbirth") {
          const b = body.querySelector("#r-birth");
          state.birthDate = (b?.value || "").trim();
          if (!state.birthDate) return fail(b);
          const q = body.querySelector("#r-question");
          if (q) state.question = (q.value || "").trim();
        }
        if (step === "partnerbirth") {
          const p = body.querySelector("#r-partner");
          state.partnerBirth = (p?.value || "").trim();
          if (!state.partnerBirth) return fail(p);
        }
        if (step === "birthyear") {
          const y = body.querySelector("#r-year");
          state.birthYear = String(y?.value || "").trim();
          if (!state.birthYear) return fail(y);
          const q = body.querySelector("#r-question");
          if (q) state.question = (q.value || "").trim();
        }
        const kvCast = ["sijusin", "almanac", "hapscore", "tutruPillars", "cungBan", "versePick"];
        if (kvCast.includes(step)) return;
      }
      if (state.kind === "japan") {
        if (step === "birth") {
          const b = body.querySelector("#r-birth");
          state.birthDate = (b?.value || "").trim();
          if (!state.birthDate) return fail(b);
          const q = body.querySelector("#r-question");
          if (q) state.question = (q.value || "").trim();
        }
        if (step === "birthyear") {
          const y = body.querySelector("#r-year");
          state.birthYear = String(y?.value || "").trim();
          if (!state.birthYear) return fail(y);
        }
        if (step === "dayDate" || step === "daypickRoku") {
          const d = body.querySelector("#r-day");
          state.dayDate = (d?.value || "").trim();
          if (!state.dayDate) return fail(d);
          const q = body.querySelector("#r-question");
          if (q) state.question = (q.value || "").trim();
        }
        if (step === "nameIn") {
          const n = body.querySelector("#r-name");
          state.personName = (n?.value || "").trim();
          if (!state.personName) return fail(n);
          const q = body.querySelector("#r-question");
          if (q) state.question = (q.value || "").trim();
        }
        const jpCast = [
          "drawSlip",
          "almanacNote",
          "counselRoku",
          "seimeiGrade",
          "sanmeiBoard",
          "shichuPillars",
          "houiStar",
          "crackRead",
          "kibokuCrack",
          "kasoMap",
          "teaOmen",
          "sukuyoHost",
        ];
        if (jpCast.includes(step)) return;
      }
      if (state.kind === "southasia") {
        if (step === "birth") {
          const b = body.querySelector("#r-birth");
          state.birthDate = (b?.value || "").trim();
          if (!state.birthDate) return fail(b);
          const q = body.querySelector("#r-question");
          if (q) state.question = (q.value || "").trim();
        }
        if (step === "daypickPanch" || step === "daypickNekath" || step === "daypickSbc") {
          const d = body.querySelector("#r-day");
          state.dayDate = (d?.value || "").trim();
          if (!state.dayDate) return fail(d);
          const q = body.querySelector("#r-question");
          if (q) state.question = (q.value || "").trim();
        }
        if (step === "nameInTamil") {
          const n = body.querySelector("#r-name");
          state.personName = (n?.value || "").trim();
          if (!state.personName) return fail(n);
          const q = body.querySelector("#r-question");
          if (q) state.question = (q.value || "").trim();
        }
        if (step === "markTrait") {
          const t = body.querySelector("#r-trait");
          state.formTrait = (t?.value || "").trim();
          if (!state.formTrait) return fail(t);
        }
        const saCast = [
          "dashaReveal",
          "kpCusp",
          "panchCounsel",
          "prasnaRead",
          "figureRead",
          "samudrikaMap",
          "svaraOmen",
          "tamilNumber",
          "ankaBoard",
          "vastuMap",
          "cardPick",
          "nekathCounsel",
          "sbcCounsel",
        ];
        if (saCast.includes(step)) return;
      }
      if (state.kind === "himalayasea") {
        if (step === "birth") {
          const b = body.querySelector("#r-birth");
          state.birthDate = (b?.value || "").trim();
          if (!state.birthDate) return fail(b);
          const q = body.querySelector("#r-question");
          if (q) state.question = (q.value || "").trim();
        }
        if (step === "birthyear") {
          const y = body.querySelector("#r-year");
          state.birthYear = String(y?.value || "").trim();
          if (!state.birthYear) return fail(y);
        }
        if (step === "daypickLao" || step === "daypickPawukon") {
          const d = body.querySelector("#r-day");
          state.dayDate = (d?.value || "").trim();
          if (!state.dayDate) return fail(d);
          const q = body.querySelector("#r-question");
          if (q) state.question = (q.value || "").trim();
        }
        const hsCast = [
          "tibetanBoard",
          "moVerse",
          "zurhaiChart",
          "shagaiFaces",
          "asiaCrack",
          "mahaboteLean",
          "horaReveal",
          "thaiDayCounsel",
          "taksaName",
          "khmerBoard",
          "laoCounsel",
          "wetonWeight",
          "pawukonCounsel",
        ];
        if (hsCast.includes(step)) return;
      }
      if (state.kind === "neareast") {
        if (step === "question") {
          const q = body.querySelector("#r-question");
          state.question = (q?.value || "").trim();
          if (!state.question) return fail(q);
        }
        if (step === "birth") {
          const b = body.querySelector("#r-birth");
          state.birthDate = (b?.value || "").trim();
          if (!state.birthDate) return fail(b);
          const q = body.querySelector("#r-question");
          if (q) state.question = (q.value || "").trim();
        }
        if (step === "daypickManzil" || step === "daypickElect") {
          const d = body.querySelector("#r-day");
          state.dayDate = (d?.value || "").trim();
          if (!state.dayDate) return fail(d);
          const q = body.querySelector("#r-question");
          if (q) state.question = (q.value || "").trim();
        }
        if (step === "nameInAbjad" || step === "nameInHebrew") {
          const n = body.querySelector("#r-name");
          state.personName = (n?.value || "").trim();
          if (!state.personName) return fail(n);
          const q = body.querySelector("#r-question");
          if (q) state.question = (q.value || "").trim();
        }
        if (step === "dreamNote") {
          const d = body.querySelector("#r-dream");
          state.dreamNote = (d?.value || "").trim();
          if (!state.dreamNote) return fail(d);
          const q = body.querySelector("#r-question");
          if (q) state.question = (q.value || "").trim();
        }
        const neCast = [
          "islamicChart",
          "manazilCounsel",
          "hafezVerse",
          "istikharaSign",
          "abjadLean",
          "jafrPhrase",
          "firdariaTone",
          "electCounsel",
          "arrowLot",
          "gematriaLean",
          "mazalotBoard",
          "urimReply",
          "goralPage",
          "groundsRead",
          "leadShape",
          "liverOmen",
          "dreamOmen",
        ];
        if (neCast.includes(step)) return;
      }
      if (state.kind === "westastro") {
        if (step === "birth") {
          const b = body.querySelector("#r-birth");
          state.birthDate = (b?.value || "").trim();
          if (!state.birthDate) return fail(b);
          const q = body.querySelector("#r-question");
          if (q) state.question = (q.value || "").trim();
        }
        if (step === "askMoment") {
          const m = body.querySelector("#r-moment");
          state.askMoment = (m?.value || "").trim().replace("T", " ");
          if (!state.askMoment) return fail(m);
        }
        if (step === "nameInGreek") {
          const n = body.querySelector("#r-name");
          state.personName = (n?.value || "").trim();
          if (!state.personName) return fail(n);
          const q = body.querySelector("#r-question");
          if (q) state.question = (q.value || "").trim();
        }
        const waCast = ["westChart", "horaryChart", "treeCounsel", "lifePathLean", "isopLean"];
        if (waCast.includes(step)) return;
      }
      if (state.kind === "cartomancy") {
        const cmCast = ["lenormandSpread", "kipperCounsel", "sibillaCounsel", "playingSpread", "barajaSpread", "oracleMessage"];
        if (cmCast.includes(step)) return;
      }
      if (state.kind === "classicaleuro") {
        if (CE_CAST.has(step)) return;
      }
      if (state.kind === "folkscry") {
        if (step === "dreamNoteFolk") {
          const d = body.querySelector("#r-dream-folk");
          state.dreamNote = (d?.value || "").trim();
          if (!state.dreamNote) return fail(d);
        }
        if (FS_CAST.has(step)) return;
      }
      // Africa cast-like steps are user-driven
      if (
        state.kind === "africa" &&
        (step === "cast" ||
          step === "bowls" ||
          step === "count" ||
          step === "chart" ||
          step === "dream" ||
          step === "rising" ||
          step === "spin")
      )
        return;
      if (state.kind !== "africa" && state.kind !== "formchina" && (step === "cast" || step === "bowls" || step === "count" || step === "dream" || step === "rising" || step === "spin"))
        return;
      if (state.stepIndex < state.steps.length - 1) {
        state.stepIndex += 1;
        // skip auto for cast/reveal/quiz — user drives
        render();
      }
      return;
    }
    if (!captureGeneric()) return;
    if (state.stepIndex < state.process.steps.length - 1) {
      state.stepIndex += 1;
      render();
    }
  }

  function goBack() {
    if (state.mode === "guided") {
      if (state.kind === "bagua" && state.steps[state.stepIndex] === "cast" && state.castingIndex > 0) {
        state.lines.pop();
        state.castingIndex -= 1;
        render();
        return;
      }
      if (state.kind === "mbti" && state.steps[state.stepIndex] === "quiz" && state.quizIndex > 0) {
        state.quizIndex -= 1;
        const prev = G().MBTI_QUESTIONS[state.quizIndex];
        delete state.answers[prev.id];
        render();
        return;
      }
      if (state.stepIndex <= 0) return;
      if (state.steps[state.stepIndex] === "result") {
        state = makeGuidedState(state.method, state.kind);
        render();
        return;
      }
      state.stepIndex -= 1;
      if (state.kind === "tarot" && state.steps[state.stepIndex] === "shuffle") {
        state.deck = null;
        state._shuffleStarted = false;
      }
      render();
      return;
    }
    if (state.stepIndex <= 0) return;
    if (currentGenericStep() === "result") {
      state.stepIndex = 0;
      state.reading = null;
      render();
      return;
    }
    state.stepIndex -= 1;
    render();
  }

  function onAction(action, el) {
    if (action === "close") return closeStudio();
    if (action === "next") return goNext();
    if (action === "back") return goBack();
    if (action === "save-journal") return saveCurrentToJournal();
    if (action === "clear-photo") {
      if (state?.input) {
        state.input.photoDataUrl = "";
        state.input.photoName = "";
        state.input.photoMeta = null;
      }
      return render();
    }
    if (action === "goto-journal") {
      closeStudio();
      if (window.FatumRouter) window.FatumRouter.navigate("journal");
      else document.getElementById("journal")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (action === "again") {
      if (state.mode === "guided") state = makeGuidedState(state.method, state.kind);
      else {
        state.stepIndex = 0;
        state.reading = null;
        state.journalSaved = false;
        state.input.nonce = Date.now() % 100000;
      }
      return render();
    }
    if (action === "toss-coins") return tossBaguaLine();
    if (action === "do-shuffle") return doTarotShuffle();
    if (action === "cut-deck") return cutTarotDeck();
    if (action === "reveal-one") return revealTarotOne();
    if (action === "africa-cast") return doAfricaCast(el?.dataset?.bowl || null);
    if (action === "africa-offer") {
      state.offering = el.dataset.offer || "water";
      return render();
    }
    if (action === "africa-domain") {
      state.domain = el.dataset.domain || "kin";
      return render();
    }
    if (action === "africa-people") {
      state.people = el.dataset.people || "self";
      return render();
    }
    if (action === "africa-weekday") {
      state.weekday = Number(el.dataset.day || 0);
      return render();
    }
    if (action === "africa-dial") {
      state.dialLetter = el.dataset.letter || "A";
      return render();
    }
    if (action === "china-cast") return doChinaCast();
    if (action === "classic-cast") return doClassicCast();
    if (action === "form-cast") return doFormChinaCast();
    if (action === "kv-cast") return doKoreaVietnamCast();
    if (action === "jp-cast") return doJapanCast();
    if (action === "jp-houi") {
      state.houi = el.dataset.dir || "E";
      return render();
    }
    if (action === "jp-facing") {
      state.facing = el.dataset.dir || "S";
      return render();
    }
    if (action === "jp-plan") {
      state.housePlan = el.dataset.plan || "house";
      return render();
    }
    if (action === "jp-gogyo") {
      state.gogyo = el.dataset.el || "Wood";
      return render();
    }
    if (action === "jp-hour") {
      state.hourIndex = Number(el.dataset.hour || 0);
      return render();
    }
    if (action === "jp-mansion") {
      state.mansion = el.dataset.mansion || "";
      return render();
    }
    if (action === "sa-cast") return doSouthAsiaCast();
    if (action === "sa-nak") {
      state.nakshatra = el.dataset.nak || "Aśvinī";
      return render();
    }
    if (action === "sa-sub") {
      state.sublord = el.dataset.sub || "Venus sub";
      return render();
    }
    if (action === "sa-zone") {
      state.bodyZone = el.dataset.zone || "hand";
      return render();
    }
    if (action === "sa-breath") {
      state.breathSide = el.dataset.side || "right";
      return render();
    }
    if (action === "sa-plan") {
      state.vastuPlan = el.dataset.plan || "home";
      return render();
    }
    if (action === "sa-facing") {
      state.facing = el.dataset.dir || "E";
      return render();
    }
    if (action === "sa-nekath") {
      state.nekathHour = el.dataset.hour || "Good nekatha hour";
      return render();
    }
    if (action === "hs-cast") return doHimalayaSeaCast();
    if (action === "hs-weekday") {
      state.weekday = Number(el.dataset.day || 0);
      return render();
    }
    if (action === "hs-el") {
      state.tibElement = el.dataset.el || "Wood";
      return render();
    }
    if (action === "hs-an") {
      state.tibAnimal = el.dataset.an || "Tiger";
      return render();
    }
    if (action === "hs-hora") {
      state.horaHouse = el.dataset.hora || "Self house";
      return render();
    }
    if (action === "hs-khmer") {
      state.khmerSign = el.dataset.sign || "Meṣa-like";
      return render();
    }
    if (action === "hs-pasaran") {
      state.pasaran = el.dataset.pas || "Legi";
      return render();
    }
    if (action === "hs-uku") {
      state.ukuWeek = el.dataset.uku || "Sinta week";
      return render();
    }
    if (action === "ne-cast") return doNearEastCast();
    if (action === "ne-hour") {
      state.planetHour = el.dataset.hour || "Mercury hour";
      return render();
    }
    if (action === "ne-manzil") {
      state.manzil = el.dataset.manzil || "Al-Sharaṭān";
      return render();
    }
    if (action === "ne-firdaria") {
      state.firdariaLord = el.dataset.lord || "Sun period";
      return render();
    }
    if (action === "ne-mazal") {
      state.mazalSign = el.dataset.sign || "Ṭaleh (Aries)";
      return render();
    }
    if (action === "wa-cast") return doWestAstroCast();
    if (action === "wa-sign") {
      state.sunSign = el.dataset.sign || "Aries";
      return render();
    }
    if (action === "wa-tree") {
      state.celticTree = el.dataset.tree || "Oak";
      return render();
    }
    if (action === "cm-cast") return doCartomancyCast();
    if (action === "cm-suit") {
      state.suitFocus = el.dataset.suit || "Hearts focus";
      return render();
    }
    if (action === "cm-palo") {
      state.paloFocus = el.dataset.palo || "Oros";
      return render();
    }
    if (action === "ce-cast") return doClassicalEuroCast();
    if (action === "fs-cast") return doFolkScryCast();

    if (action === "kv-hour") {
      state.hourIndex = Number(el.dataset.hour || 0);
      return render();
    }
    if (action === "kv-gender") {
      state.gender = el.dataset.gender || "unspecified";
      return render();
    }
    if (action === "form-site") {
      state.site = el.dataset.site || "home";
      return render();
    }
    if (action === "form-facing") {
      state.facing = el.dataset.facing || "S";
      return render();
    }
    if (action === "form-gua") {
      state.gua = Number(el.dataset.gua || 1);
      return render();
    }
    if (action === "form-period") {
      state.period = el.dataset.period || "9";
      return render();
    }
    if (action === "form-facezone") {
      state.faceZone = el.dataset.zone || "forehead";
      return render();
    }
    if (action === "form-hand") {
      state.hand = el.dataset.hand || "active";
      return render();
    }
    if (action === "form-line") {
      state.palmLine = el.dataset.line || "life";
      return render();
    }
    if (action === "form-bodyzone") {
      state.bodyZone = el.dataset.zone || "face";
      return render();
    }
    if (action === "classic-sight") {
      state.sight = el.dataset.sight || "plum";
      return render();
    }
    if (action === "classic-era") {
      state.era = el.dataset.era || "personal";
      return render();
    }
    if (action === "china-hour") {
      state.hourIndex = Number(el.dataset.hour || 0);
      return render();
    }
    if (action === "china-gender") {
      state.gender = el.dataset.gender || "unspecified";
      return render();
    }
    if (action === "china-activity") {
      state.activity = el.dataset.activity || "travel";
      return render();
    }
    if (action === "mbti-pick") return mbtiPick(el.dataset.side);
  }

  function initReadingUI() {
    if (!studio) return;
    studio.addEventListener("click", (e) => {
      if (e.target === studio) closeStudio();
      const btn = e.target.closest("[data-action]");
      if (btn) onAction(btn.dataset.action, btn);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !studio.hidden) closeStudio();
    });
    document.getElementById("reading-close")?.addEventListener("click", closeStudio);

    document.addEventListener("click", (e) => {
      const launch = e.target.closest("[data-read]");
      if (!launch) return;
      e.preventDefault();
      openStudio(launch.dataset.read);
    });

    // Merge featured into catalog data
    const featured = window.FATE_FEATURED_METHODS || [];
    featured.forEach((fm) => {
      const idx = (window.FATE_METHODS || []).findIndex((m) => m.id === fm.id);
      if (idx >= 0) window.FATE_METHODS[idx] = Object.assign({}, window.FATE_METHODS[idx], fm);
      else window.FATE_METHODS.push(fm);
    });
    // Ensure iching can launch bagua flow via button aliases
    methodsById = buildMethodIndex();

    const picker = document.getElementById("method-picker");
    const startBtn = document.getElementById("start-reading-btn");
    const trigger = document.getElementById("method-picker-trigger");
    const panel = document.getElementById("method-picker-panel");
    const listEl = document.getElementById("method-picker-list");
    const searchEl = document.getElementById("method-picker-search");
    const labelText = document.getElementById("method-picker-label-text");
    const flagsEl = document.getElementById("method-picker-flags");

    if (picker && startBtn) {
      const sorted = (window.FATE_METHODS || []).slice().sort((a, b) => {
        const af = a.featured ? 0 : 1;
        const bf = b.featured ? 0 : 1;
        if (af !== bf) return af - bf;
        return a.name.localeCompare(b.name);
      });

      function contLabel(id) {
        return window.FatumI18n ? window.FatumI18n.t(`continent.${id}`) : id;
      }

      function flagsFor(m) {
        return window.FatumCountries
          ? window.FatumCountries.flagsStripHTML(m.countries, m.region, 4)
          : "";
      }

      function setTrigger(method) {
        if (!labelText) return;
        if (!method) {
          labelText.textContent = ti("begin.placeholder");
          if (flagsEl) flagsEl.innerHTML = "";
          return;
        }
        const text = window.FatumMethodText
          ? window.FatumMethodText.localize(method)
          : method;
        labelText.textContent = text.name;
        if (flagsEl) {
          const icon = window.FatumRiteIcons
            ? window.FatumRiteIcons.iconHTML(method, "rite-icon rite-icon--picker")
            : "";
          flagsEl.innerHTML = icon + flagsFor(method);
        }
      }

      function closePanel() {
        if (!panel || !trigger) return;
        panel.hidden = true;
        trigger.setAttribute("aria-expanded", "false");
        const root = document.getElementById("rite-picker");
        root?.classList.remove("is-open", "rite-picker--drop-up");
        panel.style.maxHeight = "";
        panel.style.top = "";
        panel.style.bottom = "";
        panel.style.left = "";
        panel.style.width = "";
      }

      function positionPanel() {
        const root = document.getElementById("rite-picker");
        if (!panel || !trigger || !root || panel.hidden) return;
        const rect = trigger.getBoundingClientRect();
        const gap = 8;
        const edge = 12;
        const spaceBelow = Math.max(0, window.innerHeight - rect.bottom - gap - edge);
        const spaceAbove = Math.max(0, rect.top - gap - edge);
        const preferUp = spaceBelow < 220 && spaceAbove > spaceBelow;
        root.classList.toggle("rite-picker--drop-up", preferUp);
        const room = Math.max(160, preferUp ? spaceAbove : spaceBelow);
        const maxH = Math.min(room, window.innerHeight * 0.55, 22 * 16);
        panel.style.maxHeight = `${maxH}px`;

        // Fixed to the viewport — escapes footer stacking contexts
        const width = Math.min(Math.max(rect.width, 240), window.innerWidth - edge * 2);
        let left = Math.min(Math.max(edge, rect.left), window.innerWidth - width - edge);
        panel.style.width = `${width}px`;
        panel.style.left = `${left}px`;
        panel.style.right = "auto";
        if (preferUp) {
          panel.style.top = "auto";
          panel.style.bottom = `${Math.max(edge, window.innerHeight - rect.top + gap)}px`;
        } else {
          panel.style.bottom = "auto";
          panel.style.top = `${Math.min(rect.bottom + gap, window.innerHeight - maxH - edge)}px`;
        }
      }

      function openPanel() {
        if (!panel || !trigger) return;
        panel.hidden = false;
        trigger.setAttribute("aria-expanded", "true");
        document.getElementById("rite-picker")?.classList.add("is-open");
        positionPanel();
        // Nudge the trigger into view, then re-pin the fixed panel
        trigger.scrollIntoView({ block: "nearest", inline: "nearest" });
        positionPanel();
        searchEl?.focus();
      }

      function selectMethod(id) {
        picker.value = id;
        const method = sorted.find((m) => m.id === id) || null;
        setTrigger(method);
        listEl?.querySelectorAll(".rite-picker__option").forEach((li) => {
          li.setAttribute("aria-selected", li.dataset.id === id ? "true" : "false");
        });
        closePanel();
      }

      function renderList(filter) {
        if (!listEl) return;
        const fold = (s) =>
          String(s || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
        const q = fold(filter || "").trim();
        const cont = contLabel;
        const groups = [
          { label: ti("begin.featuredGroup"), items: sorted.filter((m) => m.featured) },
          { label: ti("begin.allGroup"), items: sorted.filter((m) => !m.featured) },
        ];
        // Keep native select in sync for accessibility / form value
        picker.innerHTML =
          `<option value="">${escapeHTML(ti("begin.placeholder"))}</option>` +
          groups
            .map(
              (g) =>
                `<optgroup label="${escapeHTML(g.label)}">` +
                g.items
                  .map((m) => {
                    const text = window.FatumMethodText
                      ? window.FatumMethodText.localize(m)
                      : m;
                    // Never prefix with flag emoji — regional indicators render as "US"/"CA" on many OSes.
                    return `<option value="${escapeHTML(m.id)}">${escapeHTML(text.name)}</option>`;
                  })
                  .join("") +
                `</optgroup>`
            )
            .join("");

        listEl.innerHTML = groups
          .map((g) => {
            const items = g.items.filter((m) => {
              if (!q) return true;
              const text = window.FatumMethodText
                ? window.FatumMethodText.localize(m)
                : m;
              const hay = fold(
                [
                  text.name,
                  text.region,
                  text.summary,
                  m.name,
                  m.region,
                  m.summary,
                  m.continent,
                  cont(m.continent),
                  ...(m.countries || []),
                ].join(" ")
              );
              return hay.includes(q);
            });
            if (!items.length) return "";
            return `<li class="rite-picker__group" role="presentation"><div class="rite-picker__group-label">${escapeHTML(g.label)}</div><ul>${items
              .map((m) => {
                const selected = picker.value === m.id;
                const text = window.FatumMethodText
                  ? window.FatumMethodText.localize(m)
                  : m;
                const countryBits = (m.countries || [])
                  .slice(0, 3)
                  .map((c) =>
                    window.FatumCountries
                      ? window.FatumCountries.localizedCountryName(c)
                      : c
                  )
                  .join(", ");
                const icon = window.FatumRiteIcons
                  ? window.FatumRiteIcons.iconHTML(m, "rite-icon rite-icon--picker")
                  : "";
                return `<li class="rite-picker__option${selected ? " is-selected" : ""}" role="option" tabindex="-1" data-id="${escapeHTML(m.id)}" aria-selected="${selected ? "true" : "false"}">
                  ${icon}
                  ${flagsFor(m)}
                  <span class="rite-picker__option-main">
                    <span class="rite-picker__option-name">${escapeHTML(text.name)}</span>
                    <span class="rite-picker__option-meta">${escapeHTML(cont(m.continent))}${countryBits ? " · " + escapeHTML(countryBits) : ""}</span>
                  </span>
                </li>`;
              })
              .join("")}</ul></li>`;
          })
          .join("");
      }

      function fillPicker() {
        const prev = picker.value;
        renderList(searchEl?.value || "");
        if (prev) {
          picker.value = prev;
          const method = sorted.find((m) => m.id === prev);
          setTrigger(method || null);
        } else {
          setTrigger(null);
        }
      }

      fillPicker();
      document.addEventListener("fatum:locale-changed", fillPicker);

      trigger?.addEventListener("click", () => {
        if (panel?.hidden) openPanel();
        else closePanel();
      });
      searchEl?.addEventListener("input", () => renderList(searchEl.value));
      listEl?.addEventListener("click", (e) => {
        const opt = e.target.closest(".rite-picker__option");
        if (!opt) return;
        selectMethod(opt.dataset.id);
      });
      document.addEventListener("click", (e) => {
        if (!e.target.closest("#rite-picker")) closePanel();
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && panel && !panel.hidden) closePanel();
      });
      window.addEventListener(
        "resize",
        () => {
          if (panel && !panel.hidden) positionPanel();
        },
        { passive: true }
      );
      window.addEventListener(
        "scroll",
        () => {
          if (panel && !panel.hidden) positionPanel();
        },
        { passive: true }
      );

      startBtn.addEventListener("click", () => {
        if (!picker.value) {
          trigger?.focus();
          trigger?.classList.add("field-error");
          setTimeout(() => trigger?.classList.remove("field-error"), 600);
          openPanel();
          return;
        }
        openStudio(picker.value);
      });
    }

    // Rotating recommended rites
    const featuredEl = document.getElementById("featured-guides");
    if (featuredEl) {
      function renderFeatured(opts) {
        const forceRotate = !!(opts && opts.forceRotate);
        const questMeta = {
          bagua: { badge: ti("feature.badge.bagua"), moves: ti("feature.moves.bagua"), icon: "☰" },
          tarot: { badge: ti("feature.badge.tarot"), moves: ti("feature.moves.tarot"), icon: "✦" },
          mbti: { badge: ti("feature.badge.mbti"), moves: ti("feature.moves.mbti"), icon: "◎" },
        };
        const recs = window.FatumPlayRecs
          ? forceRotate
            ? window.FatumPlayRecs.rotate()
            : window.FatumPlayRecs.current()
          : window.FATE_FEATURED_METHODS || [];
        featuredEl.classList.remove("is-rotating");
        void featuredEl.offsetWidth;
        featuredEl.classList.add("is-rotating");
        featuredEl.innerHTML = recs
          .map((m) => {
            const continent =
              window.FatumI18n?.t?.(`continent.${m.continent}`) || m.continent || ti("play.eyebrow");
            const typeKey = m.type ? `type.${m.type}` : "";
            const typeLabel = typeKey ? window.FatumI18n?.t?.(typeKey) : "";
            const movesFallback =
              typeLabel && typeLabel !== typeKey ? typeLabel : m.type || ti("studio.quest");
            const meta = questMeta[m.guided] || {
              badge: continent,
              moves: movesFallback,
              icon: "◇",
            };
            const sci = window.fateScienceStatusFor?.(m);
            const cover = window.FatumCovers
              ? window.FatumCovers.coverHTML(m, "feature-card__cover")
              : "";
            const text = window.FatumMethodText
              ? window.FatumMethodText.localize(m)
              : { name: m.name, summary: m.summary };
            const playLabel = m.guided ? ti("play.quest") : ti("catalog.play");
            return `<article class="feature-card feature-card--quest" data-read="${escapeHTML(m.id)}" tabindex="0" role="button" aria-label="${escapeHTML(playLabel)} ${escapeHTML(text.name)}">
            ${cover}
            <div class="feature-card__body">
              <div class="feature-card__top">
                <p class="feature-card__eyebrow">${escapeHTML(meta.badge)}</p>
              </div>
              <h3 class="feature-card__title">${escapeHTML(text.name)}</h3>
              <p class="feature-card__copy">${escapeHTML(text.summary)}</p>
              <p class="feature-card__moves">${escapeHTML(meta.moves)}${sci ? ` · ${escapeHTML(sci.tag)}` : ""}</p>
              <button type="button" class="btn btn--primary btn--small btn--play" data-read="${escapeHTML(m.id)}">▶ ${escapeHTML(playLabel)}</button>
            </div>
          </article>`;
          })
          .join("");
      }

      renderFeatured();
      document.addEventListener("fatum:locale-changed", () => renderFeatured());
      document.addEventListener("fatum:play-recs-changed", () => renderFeatured());
      document.addEventListener("fatum:auth-changed", () => renderFeatured());

      document.getElementById("play-recs-refresh")?.addEventListener("click", () => {
        renderFeatured({ forceRotate: true });
        if (window.FatumPlay?.showToast) {
          window.FatumPlay.showToast(ti("play.refreshToast"));
        }
      });

      // Auto-rotate recommended rites on the home page every ~5 seconds.
      let autoRotateTimer = null;
      let featuredInView = true;
      let featuredHovered = false;
      const AUTO_ROTATE_MS = 5000;
      const featuredSection = document.getElementById("play") || featuredEl;
      function shouldAutoRotate() {
        if (document.hidden) return false;
        if (document.body.classList.contains("studio-open")) return false;
        if (featuredHovered) return false;
        if (!featuredInView) return false;
        const page = document.body.dataset.page || window.FatumRouter?.getPage?.();
        return page === "home" || page === "play";
      }
      function tickAutoRotate() {
        if (!shouldAutoRotate()) return;
        renderFeatured({ forceRotate: true });
      }
      function startAutoRotate() {
        if (autoRotateTimer) clearInterval(autoRotateTimer);
        autoRotateTimer = setInterval(tickAutoRotate, AUTO_ROTATE_MS);
      }
      startAutoRotate();
      featuredEl.addEventListener("mouseenter", () => {
        featuredHovered = true;
      });
      featuredEl.addEventListener("mouseleave", () => {
        featuredHovered = false;
      });
      // Touch: pause while a finger is down on the carousel
      featuredEl.addEventListener(
        "touchstart",
        () => {
          featuredHovered = true;
        },
        { passive: true }
      );
      featuredEl.addEventListener(
        "touchend",
        () => {
          setTimeout(() => {
            featuredHovered = false;
          }, 1200);
        },
        { passive: true }
      );
      featuredEl.addEventListener(
        "focusin",
        () => {
          featuredHovered = true;
        },
        true
      );
      featuredEl.addEventListener(
        "focusout",
        () => {
          // Defer so focus moving between cards inside the grid does not resume early
          setTimeout(() => {
            featuredHovered = featuredEl.contains(document.activeElement);
          }, 0);
        },
        true
      );
      if ("IntersectionObserver" in window && featuredSection) {
        const io = new IntersectionObserver(
          (entries) => {
            featuredInView = entries.some((e) => e.isIntersecting && e.intersectionRatio > 0.15);
          },
          { threshold: [0, 0.15, 0.4] }
        );
        io.observe(featuredSection);
      }
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) startAutoRotate();
      });
      document.addEventListener("fatum:route", () => startAutoRotate());
      window.FatumRouter?.onChange?.(() => startAutoRotate());

      featuredEl.addEventListener("keydown", (e) => {
        const card = e.target.closest(".feature-card--quest");
        if (!card || (e.key !== "Enter" && e.key !== " ")) return;
        e.preventDefault();
        openStudio(card.dataset.read);
      });
    }
  }

  window.FatumReading = { open: openStudio, close: closeStudio };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initReadingUI);
  } else {
    initReadingUI();
  }
})();
