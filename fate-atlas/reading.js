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
        name: "I Ching / 周易 · 铜钱起卦",
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
    return base;
  }

  function closeStudio() {
    studio.hidden = true;
    document.body.classList.remove("studio-open");
    studio.setAttribute("aria-hidden", "true");
  }

  function stepMeta() {
    if (!state) return { label: "", total: 0, idx: 0 };
    if (state.mode === "guided") {
      if (state.kind === "bagua") {
        const total = 4;
        let idx = state.stepIndex + 1;
        let label = ["Learn", "Question", "Cast coins", "Reading"][state.stepIndex] || "Reading";
        if (state.steps[state.stepIndex] === "cast") {
          label = `Cast line ${Math.min(state.castingIndex + 1, 6)} of 6`;
        }
        return { label, total, idx };
      }
      if (state.kind === "tarot") {
        const labels = ["Learn", "Question", "Shuffle", "Reveal", "Reading"];
        let label = labels[state.stepIndex] || "Reading";
        if (state.steps[state.stepIndex] === "reveal") {
          label = `Reveal card ${Math.min(state.revealIndex + 1, 3)} of 3`;
        }
        return { label, total: 5, idx: state.stepIndex + 1 };
      }
      if (state.kind === "mbti") {
        const qTotal = G().MBTI_QUESTIONS.length;
        if (state.steps[state.stepIndex] === "quiz") {
          return {
            label: `Question ${state.quizIndex + 1} of ${qTotal}`,
            total: qTotal + 3,
            idx: state.quizIndex + 3,
          };
        }
        const labels = ["Learn", "Focus", "Quiz", "Type reading"];
        return { label: labels[state.stepIndex], total: 4, idx: state.stepIndex + 1 };
      }
    }
    const process = state.process;
    return {
      label: process.label,
      total: process.steps.length,
      idx: state.stepIndex + 1,
    };
  }

  function render() {
    if (!state) return;
    const meta = stepMeta();
    titleEl.textContent = state.method.name;
    stepEl.textContent = `${meta.label} · Step ${meta.idx}`;

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
      return;
    }
    renderGeneric();
  }

  // ——— Bagua ———
  function renderBagua() {
    const step = state.steps[state.stepIndex];
    if (step === "intent") {
      body.innerHTML = `
        <p class="studio__eyebrow">八卦 · Eight Trigrams</p>
        <h3 class="studio__heading">How 铜钱起卦 works</h3>
        <p class="studio__copy">The Yijing builds a hexagram from <strong>six lines</strong>, drawn <strong>bottom → top</strong>. Each line comes from tossing <strong>three coins</strong> once.</p>
        <ul class="guide-list">
          <li><strong>Heads = 3</strong>, <strong>Tails = 2</strong>. Sum is 6, 7, 8, or 9.</li>
          <li><strong>7</strong> young yang ⚊ · <strong>8</strong> young yin ⚋ (stable)</li>
          <li><strong>9</strong> old yang · <strong>6</strong> old yin (changing lines → 变卦)</li>
          <li>Lower three lines = 下卦 · Upper three = 上卦 · together one of 64 hexagrams</li>
        </ul>
        <div class="bagua-strip" aria-hidden="true">
          ${Object.values(G().TRIGRAMS).map((t) => `<span title="${escapeHTML(t.name)}">${t.symbol}<small>${escapeHTML(t.name.split(" ")[0])}</small></span>`).join("")}
        </div>
        ${sciencePanelHTML(state.method)}
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="close">Cancel</button>
          <button type="button" class="btn btn--primary" data-action="next">I understand — continue</button>
        </div>`;
    } else if (step === "question") {
      body.innerHTML = `
        <h3 class="studio__heading">Hold one clear question</h3>
        <p class="studio__copy">Classical advice: one matter per hexagram. Focus while the coins are cast.</p>
        <div class="field">
          <label for="r-question">Your question / 所问之事</label>
          <textarea id="r-question" rows="3" maxlength="280" placeholder="e.g. Is this the right time to change roles?">${escapeHTML(state.question)}</textarea>
        </div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">Back</button>
          <button type="button" class="btn btn--primary" data-action="next">Begin casting</button>
        </div>`;
    } else if (step === "cast") {
      const i = state.castingIndex;
      const built = state.lines
        .map((l, idx) => `<li class="yao${l.changing ? " yao--move" : ""}"><span>Line ${idx + 1}${idx === 0 ? " 初" : idx === 5 ? " 上" : ""}</span><strong>${l.symbol}</strong> <em>${l.sum}</em></li>`)
        .reverse()
        .join("");
      body.innerHTML = `
        <h3 class="studio__heading">Cast line ${i + 1} of 6</h3>
        <p class="studio__copy">${i === 0 ? "First toss becomes the <strong>bottom</strong> line (初爻)." : i < 5 ? "Building upward…" : "Final toss — the top line (上爻)."}</p>
        <div class="coin-stage" id="coin-stage">
          <div class="coin" data-face="?"></div>
          <div class="coin" data-face="?"></div>
          <div class="coin" data-face="?"></div>
        </div>
        <p class="coin-sum" id="coin-sum">Ready when you are.</p>
        <ol class="yao-stack">${built || "<li class='yao yao--empty'>No lines yet</li>"}</ol>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back" ${i > 0 ? "" : ""}>Back</button>
          <button type="button" class="btn btn--primary" data-action="toss-coins">Toss three coins</button>
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
        el.textContent = coins[i] === 3 ? "正" : "反";
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
        <p class="studio__eyebrow">塔罗牌 · Major Arcana</p>
        <h3 class="studio__heading">Three-card path spread</h3>
        <p class="studio__copy">We use the <strong>22 Major Arcana</strong>—archetypal cards from The Fool (0) to The World (21). You will:</p>
        <ol class="guide-list guide-list--numbered">
          <li>Name a question</li>
          <li>Shuffle &amp; cut the deck</li>
          <li>Reveal <strong>Past · Present · Path</strong> one card at a time</li>
          <li>Read upright or reversed meanings together</li>
        </ol>
        ${sciencePanelHTML(state.method)}
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="close">Cancel</button>
          <button type="button" class="btn btn--primary" data-action="next">Continue</button>
        </div>`;
    } else if (step === "question") {
      body.innerHTML = `
        <h3 class="studio__heading">What do you seek?</h3>
        <p class="studio__copy">Open questions work better than yes/no for tarot (“What surrounds…”, “How can I…” ).</p>
        <div class="field">
          <label for="r-question">Question / 问题</label>
          <textarea id="r-question" rows="3" maxlength="280" placeholder="What energy surrounds my next decision?">${escapeHTML(state.question)}</textarea>
        </div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">Back</button>
          <button type="button" class="btn btn--primary" data-action="next">Shuffle the deck</button>
        </div>`;
    } else if (step === "shuffle") {
      body.innerHTML = `
        <h3 class="studio__heading">Shuffle &amp; cut</h3>
        <p class="studio__copy">Hold your question. When ready, shuffle. Then cut the deck once.</p>
        <div class="deck-stage">
          <div class="deck-pile ${state.deck ? "is-ready" : "is-shuffling"}" id="deck-pile"></div>
          <p class="coin-sum">${state.deck ? "Deck ready. Cut to draw." : "Shuffling Major Arcana…"}</p>
        </div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">Back</button>
          ${
            state.deck
              ? `<button type="button" class="btn btn--primary" data-action="cut-deck">Cut &amp; draw three</button>`
              : `<button type="button" class="btn btn--primary" data-action="do-shuffle">Shuffle</button>`
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
          return `<div class="tarot-card is-open"><div class="tarot-card__name">${escapeHTML(c.nameZh)}<br>${escapeHTML(c.name)}</div><div class="tarot-card__pos">${escapeHTML(p.label)}</div>${c.reversed ? '<div class="tarot-card__rx">Reversed</div>' : ""}</div>`;
        })
        .join("");
      body.innerHTML = `
        <h3 class="studio__heading">Reveal: ${escapeHTML(pos.label)}</h3>
        <p class="studio__copy">${escapeHTML(pos.hint)}</p>
        <div class="tarot-row">${cardsHtml}<div class="tarot-card is-back" aria-hidden="true"></div></div>
        <div class="studio__actions">
          <button type="button" class="btn btn--primary" data-action="reveal-one">Flip card ${state.revealIndex + 1}</button>
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
      return { ...card, reversed: rng() < 0.28 };
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

  // ——— MBTI ———
  function renderMbti() {
    const step = state.steps[state.stepIndex];
    if (step === "intent") {
      body.innerHTML = `
        <p class="studio__eyebrow">MBTI · Preference map</p>
        <h3 class="studio__heading">Four letters, four choices</h3>
        <p class="studio__copy">MBTI describes <strong>preferred</strong> ways of attending to the world—not ability or destiny in a fatal sense. You will answer 12 forced-choice items:</p>
        <ul class="guide-list">
          <li><strong>E / I</strong> — Extraversion · Introversion (energy source)</li>
          <li><strong>S / N</strong> — Sensing · Intuition (information)</li>
          <li><strong>T / F</strong> — Thinking · Feeling (decisions)</li>
          <li><strong>J / P</strong> — Judging · Perceiving (lifestyle)</li>
        </ul>
        <p class="studio__copy studio__copy--soft">Then we map your type to a reflective “path” reading—not a forecast of events.</p>
        ${sciencePanelHTML(state.method)}
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="close">Cancel</button>
          <button type="button" class="btn btn--primary" data-action="next">Continue</button>
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
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">Back</button>
          <button type="button" class="btn btn--primary" data-action="next">Start questions</button>
        </div>`;
    } else if (step === "quiz") {
      const q = G().MBTI_QUESTIONS[state.quizIndex];
      const progress = Math.round(((state.quizIndex) / G().MBTI_QUESTIONS.length) * 100);
      body.innerHTML = `
        <div class="quiz-bar"><span style="width:${progress}%"></span></div>
        <p class="studio__eyebrow">${escapeHTML(q.dim)} · ${state.quizIndex + 1}/${G().MBTI_QUESTIONS.length}</p>
        <h3 class="studio__heading">${escapeHTML(q.text)}</h3>
        <div class="choice-grid">
          <button type="button" class="choice-btn" data-action="mbti-pick" data-side="${q.a.side}">${escapeHTML(q.a.label)}</button>
          <button type="button" class="choice-btn" data-action="mbti-pick" data-side="${q.b.side}">${escapeHTML(q.b.label)}</button>
        </div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">Back</button>
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

  function sciencePanelHTML(method) {
    const sci = window.fateScienceStatusFor?.(method);
    const adv = window.FATE_GLOBAL_ADVISORY;
    if (!sci) return "";
    return `<div class="science-box science-box--${escapeHTML(sci.levelId)}">
        <p class="science-box__label">Scientific reasoning · ${escapeHTML(sci.label)}</p>
        <p class="science-box__text">${escapeHTML(sci.reasoning)}</p>
      </div>
      <div class="advisory advisory--compact">
        <p class="advisory__eyebrow">${escapeHTML(adv?.title || "Accuracy advisory")}</p>
        <p class="advisory__body">${escapeHTML(adv?.body || "")}</p>
      </div>`;
  }

  function resultDisclaimerHTML(method, custom) {
    const sci = window.fateScienceStatusFor?.(method);
    const adv = window.FATE_GLOBAL_ADVISORY?.body || "";
    const parts = [
      custom || "",
      sci ? `Scientific status: ${sci.label}. ${sci.reasoning}` : "",
      adv,
    ].filter(Boolean);
    return `<p class="reading__disclaimer">${escapeHTML(parts.join(" "))}</p>`;
  }

  function journalActionsHTML(saved, againLabel) {
    const again = againLabel || "Start over";
    if (saved) {
      return `<p class="journal-saved-note" role="status">Saved as “${escapeHTML(state.journalTitle || "entry")}” · <a href="#journal" data-action="goto-journal">View journal</a></p>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="again">${escapeHTML(again)}</button>
          <button type="button" class="btn btn--primary" data-action="close">Done</button>
        </div>`;
    }
    return `<div class="studio__actions">
        <button type="button" class="btn btn--ghost studio__btn-muted" data-action="again">${escapeHTML(again)}</button>
        <button type="button" class="btn btn--ghost studio__btn-muted" data-action="save-journal">Save to journal</button>
        <button type="button" class="btn btn--primary" data-action="close">Done</button>
      </div>`;
  }

  function renderGuidedResult(r, allowAgain) {
    const extra =
      r.kind === "bagua" && r.hex
        ? `<div class="hex-display"><div class="hex-display__gua">${r.hex.upper.symbol}${r.hex.lower.symbol}</div><div class="yao-final">${[...r.lines].reverse().map((l) => `<div class="yao-line${l.changing ? " is-move" : ""}">${l.yang ? "━━━━━━" : "━━  ━━"}${l.changing ? " ·" : ""}</div>`).join("")}</div></div>`
        : r.kind === "tarot" && r.drawn
          ? `<div class="tarot-row tarot-row--result">${r.drawn.map((c, i) => `<div class="tarot-card is-open"><div class="tarot-card__name">${escapeHTML(c.nameZh)}<br>${escapeHTML(c.name)}</div><div class="tarot-card__pos">${escapeHTML(r.positions[i].label)}</div>${c.reversed ? '<div class="tarot-card__rx">Rx</div>' : ""}</div>`).join("")}</div>`
          : r.kind === "mbti"
            ? `<div class="mbti-badge">${escapeHTML(r.title.split("—")[0].trim())}</div>`
            : "";

    body.innerHTML = `
      <div class="reading">
        <p class="studio__eyebrow">Your reading</p>
        ${extra}
        <div class="reading__symbol" aria-hidden="true">${r.kind === "bagua" ? "☰" : r.kind === "tarot" ? "✦" : "◎"}</div>
        <h3 class="studio__heading">${escapeHTML(r.title)}</h3>
        <p class="reading__omen">${escapeHTML(r.omen)}</p>
        <p class="reading__verdict">${escapeHTML(r.verdict)}</p>
        <ul class="reading__details">${r.details.map((d) => `<li>${escapeHTML(d)}</li>`).join("")}</ul>
        <div class="reading__block"><h4>Counsel</h4><p>${escapeHTML(r.counsel)}</p></div>
        <div class="reading__block"><h4>Timing / Next</h4><p>${escapeHTML(r.timing)}</p></div>
        ${sciencePanelHTML(state.method)}
        ${resultDisclaimerHTML(state.method, r.disclaimer)}
      </div>
      ${journalActionsHTML(!!state.journalSaved, allowAgain ? "Start over" : "Done")}`;
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
      body.innerHTML = `
        <p class="studio__eyebrow">${escapeHTML(method.continent)} · ${escapeHTML(method.type)}</p>
        <h3 class="studio__heading">Begin with ${escapeHTML(method.name)}</h3>
        <p class="studio__copy">${escapeHTML(method.summary)}</p>
        <p class="studio__copy studio__copy--soft">${escapeHTML(process.blurb)}</p>
        ${sciencePanelHTML(method)}
        ${
          photo
            ? `<p class="studio__copy"><strong>Photo step:</strong> ${escapeHTML(photo.label)}. ${photo.required ? "A clear image is required." : "A photo is optional but helpful."}</p>`
            : ""
        }
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="close">Cancel</button>
          <button type="button" class="btn btn--primary" data-action="next">Start process</button>
        </div>`;
    } else if (step === "question") {
      body.innerHTML = `
        <h3 class="studio__heading">Hold your question</h3>
        <div class="field"><label for="r-question">Your question</label>
        <textarea id="r-question" rows="3" maxlength="280">${escapeHTML(state.input.question)}</textarea></div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">Back</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(process.cta)}</button>
        </div>`;
    } else if (step === "birth") {
      body.innerHTML = `
        <h3 class="studio__heading">Birth moment</h3>
        <div class="field"><label for="r-birth">Birth date</label>
        <input type="date" id="r-birth" value="${escapeHTML(state.input.birthDate)}" /></div>
        <div class="field" style="margin-top:1rem"><label for="r-question">Optional focus</label>
        <input type="text" id="r-question" value="${escapeHTML(state.input.question)}" /></div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">Back</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(process.cta)}</button>
        </div>`;
    } else if (step === "day") {
      body.innerHTML = `
        <h3 class="studio__heading">Choose the day</h3>
        <div class="field"><label for="r-day">Date</label>
        <input type="date" id="r-day" value="${escapeHTML(state.input.dayDate)}" /></div>
        <div class="field" style="margin-top:1rem"><label for="r-purpose">Purpose</label>
        <input type="text" id="r-purpose" value="${escapeHTML(state.input.dayPurpose)}" /></div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">Back</button>
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
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">Back</button>
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
        <div class="reading tone-${escapeHTML(r.tone)}">
          <p class="studio__eyebrow">Your reading</p>
          ${photoHtml}
          <div class="reading__symbol">${escapeHTML(r.symbol)}</div>
          <h3 class="studio__heading">${escapeHTML(r.title)}</h3>
          <p class="reading__omen">${escapeHTML(r.omen)}</p>
          <p class="reading__verdict">${escapeHTML(r.verdict)}</p>
          <ul class="reading__details">${r.details.map((d) => `<li>${escapeHTML(d)}</li>`).join("")}</ul>
          <div class="reading__block"><h4>Counsel</h4><p>${escapeHTML(r.counsel)}</p></div>
          <div class="reading__block"><h4>Timing</h4><p>${escapeHTML(r.timing)}</p></div>
          ${sciencePanelHTML(method)}
          ${resultDisclaimerHTML(method, r.disclaimer)}
        </div>
        ${journalActionsHTML(!!state.journalSaved, "Read again")}`;
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
      methodName: state.method.name,
      kind: state.reading.kind || state.kind || "generic",
      question: state.question || state.input?.question || "",
      focus: state.focus || state.input?.formFocus || state.input?.dayPurpose || "",
      reading: state.reading,
      photoDataUrl: state.reading.photoDataUrl || state.input?.photoDataUrl || "",
    });
    state.journalSaved = true;
    state.journalEntryId = entry.id;
    state.journalTitle = entry.title;
    render();
    return entry;
  }

  function captureGeneric() {
    const q = body.querySelector("#r-question");
    const b = body.querySelector("#r-birth");
    const d = body.querySelector("#r-day");
    const p = body.querySelector("#r-purpose");
    const ft = body.querySelector("#r-trait");
    const ff = body.querySelector("#r-focus");
    if (q) state.input.question = q.value.trim();
    if (b) state.input.birthDate = b.value;
    if (d) state.input.dayDate = d.value;
    if (p) state.input.dayPurpose = p.value.trim();
    if (ft) state.input.formTrait = ft.value.trim();
    if (ff) state.input.formFocus = ff.value.trim();
    const step = currentGenericStep();
    if (step === "question" && !state.input.question) return fail(q);
    if (step === "birth" && !state.input.birthDate) return fail(b);
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
      document.getElementById("journal")?.scrollIntoView({ behavior: "smooth" });
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
    if (picker && startBtn) {
      const sorted = (window.FATE_METHODS || []).slice().sort((a, b) => {
        const af = a.featured ? 0 : 1;
        const bf = b.featured ? 0 : 1;
        if (af !== bf) return af - bf;
        return a.name.localeCompare(b.name);
      });
      picker.innerHTML =
        `<option value="">Choose a method…</option>` +
        `<optgroup label="Featured guides">` +
        sorted
          .filter((m) => m.featured)
          .map((m) => `<option value="${m.id}">${escapeHTML(m.name)}</option>`)
          .join("") +
        `</optgroup>` +
        `<optgroup label="All methods">` +
        sorted
          .filter((m) => !m.featured)
          .map((m) => `<option value="${m.id}">${escapeHTML(m.name)} (${escapeHTML(m.continent)})</option>`)
          .join("") +
        `</optgroup>`;
      startBtn.addEventListener("click", () => {
        if (!picker.value) {
          picker.focus();
          picker.classList.add("field-error");
          setTimeout(() => picker.classList.remove("field-error"), 600);
          return;
        }
        openStudio(picker.value);
      });
    }

    // Featured cards
    const featuredEl = document.getElementById("featured-guides");
    if (featuredEl) {
      featuredEl.innerHTML = (window.FATE_FEATURED_METHODS || [])
        .map((m) => {
          const sci = window.fateScienceStatusFor?.(m);
          return `<article class="feature-card">
          <p class="feature-card__eyebrow">${escapeHTML(m.guided === "bagua" ? "八卦" : m.guided === "tarot" ? "塔罗" : "MBTI")}</p>
          <h3 class="feature-card__title">${escapeHTML(m.name)}</h3>
          <p class="feature-card__copy">${escapeHTML(m.summary)}</p>
          ${
            sci
              ? `<div class="science-box science-box--${escapeHTML(sci.levelId)}"><p class="science-box__label">${escapeHTML(sci.tag)}</p><p class="science-box__text">${escapeHTML(sci.reasoning)}</p></div>`
              : ""
          }
          <button type="button" class="btn btn--primary btn--small" data-read="${escapeHTML(m.id)}">Start guided rite</button>
        </article>`;
        })
        .join("");
    }
  }

  window.FatumReading = { open: openStudio, close: closeStudio };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initReadingUI);
  } else {
    initReadingUI();
  }
})();
