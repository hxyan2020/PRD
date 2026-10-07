(function () {
  "use strict";

  const methodsById = Object.create(null);
  (window.FATE_METHODS || []).forEach((m) => {
    methodsById[m.id] = m;
  });

  let state = {
    method: null,
    process: null,
    stepIndex: 0,
    input: { question: "", birthDate: "", dayDate: "", dayPurpose: "", formTrait: "", formFocus: "", nonce: 0 },
    reading: null,
  };

  const studio = document.getElementById("reading-studio");
  const body = document.getElementById("reading-body");
  const titleEl = document.getElementById("reading-title");
  const stepEl = document.getElementById("reading-step");

  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function openStudio(methodId) {
    const method = methodsById[methodId];
    if (!method) return;
    const process = window.fateProcessForMethod(method);
    state = {
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
        nonce: Date.now() % 100000,
      },
      reading: null,
    };
    studio.hidden = false;
    document.body.classList.add("studio-open");
    studio.setAttribute("aria-hidden", "false");
    renderStep();
    const closeBtn = studio.querySelector(".studio__close");
    if (closeBtn) closeBtn.focus();
  }

  function closeStudio() {
    studio.hidden = true;
    document.body.classList.remove("studio-open");
    studio.setAttribute("aria-hidden", "true");
  }

  function currentStep() {
    return state.process.steps[state.stepIndex];
  }

  function goNext() {
    if (!captureInputs()) return;
    if (state.stepIndex < state.process.steps.length - 1) {
      state.stepIndex += 1;
      const step = currentStep();
      if (step === "ritual") {
        renderStep();
        runRitualThenResult();
        return;
      }
      if (step === "result") {
        state.reading = window.fateGenerateReading(state.method, state.process, state.input);
      }
      renderStep();
    }
  }

  function goBack() {
    if (state.stepIndex <= 0) return;
    // Don't go back into ritual mid-flight
    if (currentStep() === "result") {
      state.stepIndex = 0;
      state.reading = null;
      renderStep();
      return;
    }
    state.stepIndex -= 1;
    renderStep();
  }

  function captureInputs() {
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

    const step = currentStep();
    if (step === "question" && !state.input.question) {
      shakeField(q);
      return false;
    }
    if (step === "birth" && !state.input.birthDate) {
      shakeField(b);
      return false;
    }
    if (step === "day" && !state.input.dayDate) {
      shakeField(d);
      return false;
    }
    if (step === "form" && !state.input.formTrait) {
      shakeField(ft);
      return false;
    }
    return true;
  }

  function shakeField(el) {
    if (!el) return;
    el.focus();
    el.classList.add("field-error");
    setTimeout(() => el.classList.remove("field-error"), 600);
  }

  function runRitualThenResult() {
    const duration = 1800 + Math.floor(Math.random() * 800);
    setTimeout(() => {
      state.input.nonce = (state.input.nonce || 0) + 1;
      state.reading = window.fateGenerateReading(state.method, state.process, state.input);
      state.stepIndex = state.process.steps.length - 1;
      renderStep();
    }, duration);
  }

  function renderStep() {
    const method = state.method;
    const process = state.process;
    const step = currentStep();
    const total = process.steps.length;
    const idx = state.stepIndex + 1;

    titleEl.textContent = method.name;
    stepEl.textContent = `Step ${Math.min(idx, total)} of ${total} · ${process.label}`;

    if (step === "intent") {
      body.innerHTML = `
        <p class="studio__eyebrow">${escapeHTML(method.continent)} · ${escapeHTML(method.type)}</p>
        <h3 class="studio__heading">Begin with ${escapeHTML(method.name)}</h3>
        <p class="studio__copy">${escapeHTML(method.summary)}</p>
        <p class="studio__copy studio__copy--soft">${escapeHTML(process.blurb)}</p>
        <p class="studio__region">${escapeHTML(method.region || "")}</p>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="close">Cancel</button>
          <button type="button" class="btn btn--primary" data-action="next">Start process</button>
        </div>
      `;
    } else if (step === "question") {
      body.innerHTML = `
        <h3 class="studio__heading">Hold your question</h3>
        <p class="studio__copy">Speak it clearly—the ritual will answer in the idiom of this method.</p>
        <div class="field">
          <label for="r-question">Your question</label>
          <textarea id="r-question" rows="3" maxlength="280" placeholder="What do I need to know about…">${escapeHTML(state.input.question)}</textarea>
        </div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">Back</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(process.cta)}</button>
        </div>
      `;
    } else if (step === "birth") {
      body.innerHTML = `
        <h3 class="studio__heading">Birth moment</h3>
        <p class="studio__copy">Fate traditions of this kind read from the day you entered the world.</p>
        <div class="field">
          <label for="r-birth">Birth date</label>
          <input type="date" id="r-birth" value="${escapeHTML(state.input.birthDate)}" required />
        </div>
        <div class="field" style="margin-top:1rem">
          <label for="r-question">Optional focus</label>
          <input type="text" id="r-question" maxlength="160" placeholder="Love, work, health, direction…" value="${escapeHTML(state.input.question)}" />
        </div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">Back</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(process.cta)}</button>
        </div>
      `;
    } else if (step === "day") {
      body.innerHTML = `
        <h3 class="studio__heading">Choose the day</h3>
        <p class="studio__copy">Almanac-style methods weigh a date against a purpose.</p>
        <div class="field">
          <label for="r-day">Date to check</label>
          <input type="date" id="r-day" value="${escapeHTML(state.input.dayDate)}" required />
        </div>
        <div class="field" style="margin-top:1rem">
          <label for="r-purpose">Purpose</label>
          <input type="text" id="r-purpose" maxlength="120" placeholder="Marriage, travel, signing, launch…" value="${escapeHTML(state.input.dayPurpose)}" />
        </div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">Back</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(process.cta)}</button>
        </div>
      `;
    } else if (step === "form") {
      body.innerHTML = `
        <h3 class="studio__heading">Describe the form</h3>
        <p class="studio__copy">Form traditions read from traits of body, place, or name—enter what you wish to offer.</p>
        <div class="field">
          <label for="r-trait">Trait, feature, or name</label>
          <input type="text" id="r-trait" maxlength="80" placeholder="e.g. long life line, south-facing door, 5-stroke name…" value="${escapeHTML(state.input.formTrait)}" required />
        </div>
        <div class="field" style="margin-top:1rem">
          <label for="r-focus">Reading focus</label>
          <input type="text" id="r-focus" maxlength="80" placeholder="Character, career, home, health…" value="${escapeHTML(state.input.formFocus)}" />
        </div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="back">Back</button>
          <button type="button" class="btn btn--primary" data-action="next">${escapeHTML(process.cta)}</button>
        </div>
      `;
    } else if (step === "ritual") {
      body.innerHTML = `
        <div class="ritual" aria-live="polite">
          <div class="ritual__orb" data-process="${escapeHTML(process.id)}"></div>
          <p class="ritual__label">${escapeHTML(process.ritualLabel)}</p>
          <p class="ritual__hint">${escapeHTML(method.name)}</p>
        </div>
      `;
    } else if (step === "result" && state.reading) {
      const r = state.reading;
      body.innerHTML = `
        <div class="reading tone-${escapeHTML(r.tone)}">
          <p class="studio__eyebrow">Your reading</p>
          <div class="reading__symbol" aria-hidden="true">${escapeHTML(r.symbol)}</div>
          <h3 class="studio__heading">${escapeHTML(r.title)}</h3>
          <p class="reading__omen">${escapeHTML(r.omen)}</p>
          <p class="reading__verdict">${escapeHTML(r.verdict)}</p>
          <ul class="reading__details">
            ${r.details.map((d) => `<li>${escapeHTML(d)}</li>`).join("")}
          </ul>
          <div class="reading__block">
            <h4>Counsel</h4>
            <p>${escapeHTML(r.counsel)}</p>
          </div>
          <div class="reading__block">
            <h4>Timing</h4>
            <p>${escapeHTML(r.timing)}</p>
          </div>
          <p class="reading__disclaimer">${escapeHTML(r.disclaimer)}</p>
        </div>
        <div class="studio__actions">
          <button type="button" class="btn btn--ghost studio__btn-muted" data-action="again">Read again</button>
          <button type="button" class="btn btn--primary" data-action="close">Done</button>
        </div>
      `;
    }

    // progress dots
    const prog = document.getElementById("reading-progress");
    if (prog) {
      prog.innerHTML = process.steps
        .map((s, i) => `<span class="prog-dot${i <= state.stepIndex ? " is-on" : ""}${s === "ritual" && step === "ritual" ? " is-pulse" : ""}" title="${s}"></span>`)
        .join("");
    }
  }

  function onStudioClick(e) {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === "close") closeStudio();
    if (action === "next") goNext();
    if (action === "back") goBack();
    if (action === "again") {
      state.stepIndex = 0;
      state.reading = null;
      state.input.nonce = Date.now() % 100000;
      renderStep();
    }
  }

  function initReadingUI() {
    if (!studio) return;
    studio.addEventListener("click", (e) => {
      if (e.target === studio) closeStudio();
      onStudioClick(e);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !studio.hidden) closeStudio();
    });
    document.getElementById("reading-close")?.addEventListener("click", closeStudio);

    // Catalog / oracle launch
    document.addEventListener("click", (e) => {
      const launch = e.target.closest("[data-read]");
      if (!launch) return;
      e.preventDefault();
      openStudio(launch.dataset.read);
    });

    // Method picker in hero area
    const picker = document.getElementById("method-picker");
    const startBtn = document.getElementById("start-reading-btn");
    if (picker && startBtn) {
      const sorted = (window.FATE_METHODS || []).slice().sort((a, b) => a.name.localeCompare(b.name));
      picker.innerHTML =
        `<option value="">Choose a method…</option>` +
        sorted.map((m) => `<option value="${m.id}">${escapeHTML(m.name)} (${escapeHTML(m.continent)})</option>`).join("");
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
  }

  window.FatumReading = { open: openStudio, close: closeStudio };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initReadingUI);
  } else {
    initReadingUI();
  }
})();
