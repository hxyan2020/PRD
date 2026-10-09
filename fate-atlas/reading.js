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
    if (method.id === "bagua" || method.id === "iching") return "bagua";
    if (method.id === "tarot") return "tarot";
    if (method.id === "mbti") return "mbti";
    if (window.FatumAfricaOracles?.has?.(method.id)) return "africa";
    if (window.FatumChinaDestiny?.has?.(method.id)) return "china";
    return null;
  }

  function openStudio(methodId) {
    methodsById = buildMethodIndex();
    let method = methodsById[methodId];
    if (!method && methodId === "iching") {
      method = methodsById.bagua || methodId;
    }
    if (!method) return;

    // If user picks I Ching, offer the full Bagua coin rite
    const kind = method.id === "iching" ? "bagua" : guidedKind(method);
    if (kind === "bagua" && method.id === "iching") {
      method = Object.assign({}, method, {
        guided: "bagua",
      });
    }

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
        steps: ["intent", "question", "cast", "result"],
        question: "",
        lines: [],
        castingIndex: 0,
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
        const total = 4;
        let idx = state.stepIndex + 1;
        let label = [
          ti("studio.step.learn"),
          ti("studio.step.question"),
          ti("studio.step.cast"),
          ti("studio.step.reading"),
        ][state.stepIndex] || ti("studio.step.reading");
        if (state.steps[state.stepIndex] === "cast") {
          label = ti("studio.step.castLine", { n: Math.min(state.castingIndex + 1, 6) });
        }
        return { label, total, idx };
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
    const extra =
      r.kind === "bagua" && r.hex
        ? `<div class="hex-display"><div class="hex-display__gua">${r.hex.upper.symbol}${r.hex.lower.symbol}</div><div class="yao-final">${[...r.lines].reverse().map((l) => `<div class="yao-line${l.changing ? " is-move" : ""}">${l.yang ? "━━━━━━" : "━━  ━━"}${l.changing ? " ·" : ""}</div>`).join("")}</div></div>`
        : r.kind === "tarot" && r.drawn
          ? `<div class="tarot-row tarot-row--result">${r.drawn.map((c, i) => `<div class="tarot-card is-open"><div class="tarot-card__name">${escapeHTML(tarotCardLabel(c))}</div><div class="tarot-card__pos">${escapeHTML(r.positions[i].label)}</div>${c.reversed ? '<div class="tarot-card__rx">Rx</div>' : ""}</div>`).join("")}</div>`
          : r.kind === "mbti"
            ? `<div class="mbti-badge">${escapeHTML(r.title.split("—")[0].trim())}</div>`
            : africaExtra || chinaExtra;

    body.innerHTML = `
      <div class="reading reading--typed">
        <p class="studio__eyebrow">${escapeHTML(ti("studio.yourReading"))}</p>
        ${extra}
        <div class="reading__symbol" aria-hidden="true">${r.kind === "bagua" ? "☰" : r.kind === "tarot" ? "✦" : r.kind === "africa" ? "◉" : r.kind === "china" ? "☯" : "◎"}</div>
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
      // Africa cast-like steps are user-driven
      if (step === "cast" || step === "bowls" || step === "count" || step === "chart" || step === "dream" || step === "rising" || step === "spin") return;
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
