const STORAGE_KEY = "six-hours-progress-v1";

const PATH_LABEL = {
  trading: "Trading risk",
  product: "Risk product",
  platform: "Risk platform",
  quant: "Quant risk",
  airisk: "AI risk",
  multi: "Multi-asset",
  pb: "Buy-side risk",
  tpm: "Trading product",
  tokenised: "Tokenised assets",
  murex: "Murex risk tech",
  aieng: "AI engineer",
  network: "Industry",
};

const state = {
  plan: null,
  view: "plan",
  filter: "all",
  open: new Set(),
  checked: {},
  editingNoteId: null,
};

const app = document.querySelector("#app");
const chipsShell = document.querySelector("#chips-shell");
const chips = document.querySelector("#chips");
const chipsPrev = document.querySelector("#chips-prev");
const chipsNext = document.querySelector("#chips-next");
const toast = document.querySelector("#toast");
let toastTimer = 0;
let chipsScrollBound = false;

function syncStickyOffsets() {
  const dock = document.querySelector(".dock");
  if (!dock || !chipsShell || chipsShell.hidden) return;
  const height = Math.ceil(dock.getBoundingClientRect().height);
  chipsShell.style.top = `${Math.max(0, height)}px`;
}

function updateChipsScrollState() {
  if (!chips || chipsShell?.hidden) return;
  syncStickyOffsets();
  const maxScroll = Math.max(0, chips.scrollWidth - chips.clientWidth);
  const left = chips.scrollLeft;
  const canLeft = left > 2;
  const canRight = left < maxScroll - 2;
  chips.classList.toggle("can-scroll-left", canLeft);
  chips.classList.toggle("can-scroll-right", canRight);
  if (chipsPrev) {
    chipsPrev.hidden = maxScroll <= 2;
    chipsPrev.disabled = !canLeft;
  }
  if (chipsNext) {
    chipsNext.hidden = maxScroll <= 2;
    chipsNext.disabled = !canRight;
  }
}

function bindChipsScroll() {
  if (!chips || chipsScrollBound) return;
  chipsScrollBound = true;
  chips.addEventListener("scroll", updateChipsScrollState, { passive: true });
  chips.addEventListener(
    "wheel",
    (event) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      if (chips.scrollWidth <= chips.clientWidth + 2) return;
      event.preventDefault();
      chips.scrollLeft += event.deltaY;
      updateChipsScrollState();
    },
    { passive: false }
  );
  let drag = null;
  let suppressChipClick = false;
  chips.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    drag = { id: event.pointerId, x: event.clientX, left: chips.scrollLeft, moved: false };
  });
  chips.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) < 4) return;
    drag.moved = true;
    chips.setPointerCapture?.(event.pointerId);
    chips.scrollLeft = drag.left - dx;
    updateChipsScrollState();
  });
  const endDrag = (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    if (drag.moved) suppressChipClick = true;
    drag = null;
  };
  chips.addEventListener("pointerup", endDrag);
  chips.addEventListener("pointercancel", endDrag);
  chips.addEventListener(
    "click",
    (event) => {
      if (!suppressChipClick) return;
      suppressChipClick = false;
      event.preventDefault();
      event.stopPropagation();
    },
    true
  );
  window.addEventListener("resize", () => {
    syncStickyOffsets();
    updateChipsScrollState();
  });
}

function scrollChipsBy(direction) {
  if (!chips) return;
  const delta = Math.max(180, Math.round(chips.clientWidth * 0.75)) * direction;
  chips.scrollBy({ left: delta, behavior: "smooth" });
  window.setTimeout(updateChipsScrollState, 280);
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.checked) state.checked = parsed.checked;
  } catch (_) {
    state.checked = {};
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ checked: state.checked }));
}

function key(week, index) {
  return `${week.n}-${index}`;
}

function weekDone(week) {
  return week.criteria.every((_, index) => state.checked[key(week, index)]);
}

function doneWeeks() {
  return state.plan.weeks.filter(weekDone);
}

function criteriaDone(week) {
  return week.criteria.filter((_, index) => state.checked[key(week, index)]).length;
}

function weeksFor(id) {
  if (id === "aieng") return state.plan.weeks.filter((week) => week.aiEngineer);
  if (id === "network") return state.plan.weeks;
  return state.plan.weeks.filter((week) => week.paths.includes(id));
}

function pct(done, total) {
  if (!total) return 0;
  return Math.round((done / total) * 100);
}

function formatRange(startIso, weekNumber) {
  const start = new Date(`${startIso}T00:00:00`);
  const from = new Date(start);
  from.setDate(start.getDate() + (weekNumber - 1) * 7);
  const to = new Date(from);
  to.setDate(from.getDate() + 6);
  const fmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
  const year = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return `${fmt.format(from)} – ${year.format(to)}`;
}

function currentWeekNumber() {
  const start = new Date(`${state.plan.start}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (today < start) return 1;
  const diff = Math.floor((today - start) / 86400000);
  return Math.min(26, Math.floor(diff / 7) + 1);
}

function showToast(message) {
  toast.hidden = false;
  toast.textContent = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 3200);
}

function setBar(fillId, barId, done, total) {
  const fill = document.querySelector(fillId);
  const bar = document.querySelector(barId);
  const value = pct(done, total);
  fill.style.width = `${value}%`;
  bar.setAttribute("aria-valuenow", String(done));
  bar.setAttribute("aria-valuemax", String(total));
  bar.classList.remove("pulse");
  void bar.offsetWidth;
  bar.classList.add("pulse");
}

function renderOverall(pulse) {
  const done = doneWeeks().length;
  const hours = done * 6;
  document.querySelector("#overall-label").textContent = `${done} of 26 weeks`;
  document.querySelector("#overall-pct").textContent = `${pct(done, 26)}%`;
  document.querySelector("#overall-sub").textContent =
    `${hours} of 156 hours logged. The bar moves when every box in a week is checked.`;
  const fill = document.querySelector("#overall-fill");
  const bar = document.querySelector("#overall-bar");
  fill.style.width = `${pct(done, 26)}%`;
  bar.setAttribute("aria-valuenow", String(done));
  if (pulse) {
    bar.classList.remove("pulse");
    void bar.offsetWidth;
    bar.classList.add("pulse");
  }
}

function renderChips() {
  const items = [
    ["all", "All weeks"],
    ...state.plan.paths.map((path) => [path.id, PATH_LABEL[path.id]]),
    ["aieng", "AI engineer"],
    ["network", "Industry"],
  ];
  chips.innerHTML = items
    .map(
      ([id, label]) =>
        `<button type="button" data-filter="${id}" class="${id === state.filter ? "is-on" : ""}">${label}</button>`
    )
    .join("");
  const onPlan = state.view === "plan";
  if (chipsShell) chipsShell.hidden = !onPlan;
  chips.hidden = !onPlan;
  bindChipsScroll();
  requestAnimationFrame(() => {
    chips.querySelector(".is-on")?.scrollIntoView({ inline: "nearest", block: "nearest", behavior: "smooth" });
    updateChipsScrollState();
    requestAnimationFrame(updateChipsScrollState);
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatText(value) {
  return window.SixHoursFormulas?.formatCourseText
    ? window.SixHoursFormulas.formatCourseText(value)
    : escapeHtml(value);
}

function pathTags(week) {
  const labels = [
    ...week.paths.map((id) => PATH_LABEL[id] || id),
    ...(week.aiEngineer ? ["AI engineer"] : []),
    "Industry",
  ];
  const narrow = window.matchMedia("(max-width: 640px)").matches;
  const shown = narrow ? labels.slice(0, 3) : labels;
  const extra = labels.length - shown.length;
  return (
    shown.map((label) => `<span class="tag">${escapeHtml(label)}</span>`).join("") +
    (extra > 0 ? `<span class="tag tag-more" title="${escapeHtml(labels.slice(3).join(", "))}">+${extra}</span>` : "")
  );
}

function renderList(items) {
  return `<ol class="steps">${items.map((item) => `<li>${formatText(item)}</li>`).join("")}</ol>`;
}

function renderCourseware(week) {
  if (!week.lessons) {
    return week.sessions
      .map(
        (session) =>
          `<div class="session"><div class="kind">${escapeHtml(session.kind)}<br>${session.h.toFixed(1)} h</div><div>${escapeHtml(session.text)}</div></div>`
      )
      .join("");
  }
  const timeBudget = week.sessions
    .map((session) => `<li><strong>${escapeHtml(session.kind)}</strong> · ${session.h.toFixed(1)} h — ${escapeHtml(session.text)}</li>`)
    .join("");
  const vizSlot = (slot) =>
    `<div class="viz-mount" data-viz-week="${week.n}" data-viz-slot="${slot}" aria-label="Interactive diagram"></div>`;
  const lessons = week.lessons
    .map((lesson, index) => {
      const body = lesson.body.map((paragraph) => `<p>${formatText(paragraph)}</p>`).join("");
      const example = lesson.example
        ? `<div class="example">
            <p class="example-label">Worked example · ${escapeHtml(lesson.example.title)}</p>
            <p>${formatText(lesson.example.story)}</p>
            <p class="takeaway"><strong>Takeaway.</strong> ${formatText(lesson.example.takeaway)}</p>
          </div>`
        : "";
      // slot 0 = after goal; lessons start at slot 1
      return `<section class="lesson">
          <h3>Lesson ${index + 1}. ${escapeHtml(lesson.title)}</h3>
          ${body}
          ${example}
          ${vizSlot(index + 1)}
        </section>`;
    })
    .join("");
  const labSlot = 1 + (week.lessons ? week.lessons.length : 0);
  const formulaPanel = window.SixHoursFormulas?.renderFormulaPanel?.(week.n) || "";
  const lenses = week.pathLenses
    ? `<section class="block path-lenses">
        <h3>Path lenses this week</h3>
        <p class="block-label">Same six hours — sharper angle if you are on these paths</p>
        <ul class="lens-list">
          ${Object.entries(week.pathLenses)
            .map(
              ([id, text]) =>
                `<li><span class="tag">${escapeHtml(PATH_LABEL[id] || id)}</span><span>${formatText(text)}</span></li>`
            )
            .join("")}
        </ul>
      </section>`
    : "";
  const lab = week.lab
    ? `<section class="block lab-block" id="lab-week-${week.n}">
        <h3>Lab · do the work</h3>
        <p><strong>Goal.</strong> ${formatText(week.lab.goal)}</p>
        <p><strong>Why this lab.</strong> ${formatText(week.lab.why)}</p>
        <p class="lab-ide-jump-wrap"><a class="lab-ide-jump" href="#lab-ide-week-${week.n}">↓ Open live IDE (run code &amp; see results)</a></p>
        <p class="block-label">Steps</p>
        ${renderList(week.lab.steps)}
        <p class="block-label">What good looks like</p>
        ${renderList(week.lab.expected)}
        ${vizSlot(labSlot)}
        <div class="lab-ide" id="lab-ide-week-${week.n}" data-lab-ide="${week.n}"></div>
      </section>`
    : `<section class="block">${vizSlot(labSlot)}</section>`;
  const write = week.writeGuide
    ? `<section class="block">
        <h3>Write</h3>
        <p>${formatText(week.writeGuide.prompt)}</p>
        <p class="block-label">Cover these points</p>
        ${renderList(week.writeGuide.structure)}
        <p><strong>Done when.</strong> ${formatText(week.writeGuide.goodLooksLike)}</p>
      </section>`
    : "";
  const industry = week.industryGuide
    ? `<section class="block">
        <h3>Industry connection</h3>
        <p>${formatText(week.industryGuide.prompt)}</p>
        <p class="block-label">Use this script</p>
        ${renderList(week.industryGuide.script)}
        <p><strong>Log after.</strong> ${formatText(week.industryGuide.log)}</p>
      </section>`
    : "";
  return `<div class="courseware">
      <section class="block goal">
        <h3>This week’s goal</h3>
        <p>${formatText(week.goal)}</p>
        <p class="big-idea">${formatText(week.bigIdea)}</p>
        ${vizSlot(0)}
      </section>
      ${formulaPanel}
      <section class="block">
        <h3>Six-hour budget</h3>
        <ol class="steps">${timeBudget}</ol>
      </section>
      ${lessons}
      ${lenses}
      ${lab}
      ${write}
      ${industry}
      <section class="block">
        <h3>Mark the week done</h3>
        <p>Check every box when the evidence exists. The top bar moves only after all three are checked, or when you tap Finish week.</p>
      </section>
    </div>`;
}

function renderPlan() {
  const current = currentWeekNumber();
  const weeks = state.plan.weeks.filter((week) => {
    if (state.filter === "all") return true;
    if (state.filter === "aieng") return week.aiEngineer;
    if (state.filter === "network") return true;
    return week.paths.includes(state.filter);
  });
  const intro = `<article class="note note-compact">
      <p class="note-lead">Open a week for courseware. Select text for <strong>AI</strong> or <strong>Note</strong>. Check boxes or Finish week — progress stays in this browser.</p>
      <details>
        <summary>How study works</summary>
        <p>Select any text — including tutor answers — to show <strong>AI</strong> or <strong>Note</strong>. Notes keep a timestamp and an auto caption. Check every box, or tap Finish week.</p>
      </details>
      <details>
        <summary>What this 156 hours is for</summary>
        <p>${escapeHtml(state.plan.stance)}</p>
        <p>${escapeHtml(state.plan.hardLimit)}</p>
        <p>${escapeHtml(state.plan.privacy)}</p>
      </details>
    </article>`;
  app.innerHTML =
    intro +
    `<div class="stack">` +
    weeks
      .map((week) => {
        const done = weekDone(week);
        const partial = criteriaDone(week);
        const open = state.open.has(week.n);
        return `<article class="card${done ? " is-done" : ""}${week.n === current ? " is-current" : ""}" data-week="${week.n}">
          <p class="week-no">Week ${week.n}${week.n === current ? " · this week" : ""}${done ? " · finished" : ""}</p>
          <div class="card-head">
            <h2>${escapeHtml(week.title)}</h2>
          </div>
          <p class="meta">${formatRange(state.plan.start, week.n)} · ${escapeHtml(week.block)} · 6 hours · ${partial}/${week.criteria.length} done</p>
          <div class="tags">${pathTags(week)}</div>
          <div class="bar mini" aria-hidden="true"><span style="width:${pct(partial, week.criteria.length)}%"></span></div>
          <div class="card-actions">
            <button type="button" class="text-btn" data-toggle="${week.n}">${open ? "Hide courseware" : "Open courseware"}</button>
            <button type="button" class="finish" data-finish="${week.n}" ${done ? "disabled" : ""}>${done ? "Week finished" : "Finish week"}</button>
          </div>
          ${
            open
              ? `<div class="detail">
            ${renderCourseware(week)}
            <ul class="checks">
              ${week.criteria
                .map(
                  (criterion, index) => `<li><label>
                    <input type="checkbox" data-check="${week.n}:${index}" ${state.checked[key(week, index)] ? "checked" : ""}>
                    <span>${escapeHtml(criterion)}</span>
                  </label></li>`
                )
                .join("")}
            </ul>
          </div>`
              : ""
          }
        </article>`;
      })
      .join("") +
    `</div>`;
}

function renderPaths() {
  const pathCount = state.plan.paths.length;
  const pathRail = `<div class="path-rail" role="navigation" aria-label="All ${pathCount} career paths — scroll sideways">
      <p class="path-rail-hint">Scroll sideways · ${pathCount} paths</p>
      <div class="path-rail-track">
        ${state.plan.paths
          .map(
            (path, index) =>
              `<a class="path-rail-item" href="#path-${escapeHtml(path.id)}"><span class="path-rail-num">${index + 1}/${pathCount}</span><span>${escapeHtml(PATH_LABEL[path.id] || path.name)}</span></a>`
          )
          .join("")}
      </div>
    </div>`;
  const syllabusOpen = window.matchMedia("(min-width: 720px)").matches ? " open" : "";
  app.innerHTML = `<h2 class="section">${pathCount} paths, two backups</h2>
    <article class="note note-compact">
      <p class="note-lead"><strong>${pathCount}</strong> career paths on one 26-week calendar (incl. Tokenised + Murex). Filter a path to see its weeks — nothing is added to the timeline.</p>
    </article>
    ${pathRail}
    <div class="stack">
      ${state.plan.paths
        .map((path) => {
          const scoped = weeksFor(path.id);
          const done = scoped.filter(weekDone).length;
          const trends = Array.isArray(path.trends) ? path.trends : [];
          const issues = Array.isArray(path.practitionerIssues) ? path.practitionerIssues : [];
          return `<article class="path-card" id="path-${escapeHtml(path.id)}">
            <h3>${escapeHtml(path.name)}</h3>
            <p class="role">${escapeHtml(path.role)} · fit ${path.fitNow}→${path.fitAfter}</p>
            <p class="path-summary">${escapeHtml(path.summary)}</p>
            <div class="path-actions path-actions-top"><button type="button" class="text-btn" data-jump="${path.id}">Show these weeks</button></div>
            <div class="fit-row"><span>Study progress</span><span>${done}/${scoped.length} weeks · ${pct(done, scoped.length)}%</span></div>
            <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="${scoped.length}" aria-valuenow="${done}" aria-label="${escapeHtml(path.name)} study progress"><span style="width:${pct(done, scoped.length)}%"></span></div>
            ${
              trends.length
                ? `<details class="path-syllabus"${syllabusOpen}>
              <summary>Latest developments &amp; trends</summary>
              <ul class="path-syllabus-list">${trends
                .map((item) => `<li>${escapeHtml(item)}</li>`)
                .join("")}</ul>
            </details>`
                : ""
            }
            ${
              issues.length
                ? `<details class="path-syllabus"${syllabusOpen}>
              <summary>Top practitioner issues &amp; roadmap</summary>
              <ul class="path-issue-list">${issues
                .map(
                  (item) => `<li>
                  <p class="path-issue"><strong>Issue.</strong> ${escapeHtml(item.issue || "")}</p>
                  <p class="path-roadmap"><strong>Roadmap.</strong> ${escapeHtml(item.roadmap || item.solution || "")}</p>
                </li>`
                )
                .join("")}</ul>
            </details>`
                : ""
            }
            <details class="path-syllabus path-fit-details">
              <summary>Fit scores &amp; study gaps</summary>
              <div class="fit-row"><span>Analysis fit now</span><span>${path.fitNow}/100</span></div>
              <div class="bar" aria-hidden="true"><span style="width:${path.fitNow}%"></span></div>
              <div class="fit-row"><span>Target fit after this plan</span><span>${path.fitAfter}/100</span></div>
              <div class="bar" aria-hidden="true"><span style="width:${path.fitAfter}%"></span></div>
              ${path.gaps
                .map(
                  (gap) =>
                    `<div class="gap"><strong>${escapeHtml(gap.name)}</strong><span class="gap-weeks">Weeks ${gap.weeks.join(", ")}</span></div>`
                )
                .join("")}
            </details>
          </article>`;
        })
        .join("")}
      <article class="path-card">
        <h3>AI engineer</h3>
        <p class="role">Woven through the first backup · weeks ${weeksFor("aieng").map((week) => week.n).join(", ")}</p>
        <p>This is not a general model-training course. The syllabus is the production loop a risk team can defend: a metric with a threshold, retrieval that cites a source, a tool list that cannot approve, an eval score, and a written override.</p>
        <div class="fit-row"><span>Study progress</span><span>${weeksFor("aieng").filter(weekDone).length}/${weeksFor("aieng").length} weeks</span></div>
        <div class="bar"><span style="width:${pct(weeksFor("aieng").filter(weekDone).length, weeksFor("aieng").length)}%"></span></div>
      </article>
      <article class="path-card">
        <h3>Industry connections</h3>
        <p class="role">30 to 60 minutes inside every week · ${doneWeeks().length}/26 touches</p>
        <p>Week 1 builds the list of eight. Week 2 sends two notes. Week 4 asks for one conversation. Later weeks log one real exchange. Week 26 turns that into six named conversations, two communities, and one public note with no employer data.</p>
        <div class="bar"><span style="width:${pct(doneWeeks().length, 26)}%"></span></div>
      </article>
    </div>
    <h2 class="section">Sources</h2>
    <div class="stack">
      ${state.plan.sources
        .map(
          (source) =>
            `<article class="source"><a href="${source.url}">${source.name}</a><p>${source.use}</p></article>`
        )
        .join("")}
    </div>`;
}

function renderProgress() {
  const done = doneWeeks().length;
  const blocks = [];
  for (const week of state.plan.weeks) {
    const found = blocks.find((block) => block.name === week.block);
    if (found) found.weeks.push(week);
    else blocks.push({ name: week.block, weeks: [week] });
  }
  const tracks = [
    ["Overall", done, 26],
    ...state.plan.paths.map((path) => {
      const scoped = weeksFor(path.id);
      return [path.name, scoped.filter(weekDone).length, scoped.length];
    }),
    ["AI engineer", weeksFor("aieng").filter(weekDone).length, weeksFor("aieng").length],
    ["Industry connections", done, 26],
  ];
  app.innerHTML = `<h2 class="section">Progress</h2>
    <article class="note">
      <p>${done} weeks finished, ${done * 6} hours logged, ${26 - done} weeks left. Calendar week ${currentWeekNumber()} is highlighted on the plan.</p>
    </article>
    <div class="stack">
      ${tracks
        .map(
          ([name, have, total]) => `<article class="path-card">
            <div class="fit-row"><strong>${name}</strong><span>${have}/${total} · ${pct(have, total)}%</span></div>
            <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${have}" aria-label="${name}"><span style="width:${pct(have, total)}%"></span></div>
          </article>`
        )
        .join("")}
      <article class="path-card">
        <h3>Hours by block</h3>
        ${blocks
          .map((block) => {
            const have = block.weeks.filter(weekDone).length;
            return `<div class="gap"><strong>${block.name}</strong><span class="gap-weeks">${have * 6} of ${block.weeks.length * 6} hours</span>
              <div class="bar"><span style="width:${pct(have, block.weeks.length)}%"></span></div></div>`;
          })
          .join("")}
      </article>
      <article class="path-card">
        <h3>Backup this browser</h3>
        <p>Progress and notebook notes live in local storage on this phone or computer. Copy them out before you clear browser data, then paste them back here.</p>
        <textarea class="backup" id="backup" spellcheck="false">${JSON.stringify({
          checked: state.checked,
          notes: window.SixHoursNotebook?.loadNotes?.() || [],
        })}</textarea>
        <div class="card-actions">
          <button type="button" class="finish" id="copy-backup">Copy backup</button>
          <button type="button" class="text-btn" id="restore-backup">Restore</button>
          <button type="button" class="text-btn" id="reset-progress">Reset</button>
        </div>
      </article>
    </div>`;
}

function renderNotebook() {
  app.innerHTML = window.SixHoursNotebook
    ? window.SixHoursNotebook.renderNotebookHtml(state.editingNoteId)
    : `<article class="note"><p>Notebook failed to load.</p></article>`;
  if (state.editingNoteId) {
    const body = app.querySelector(`[data-edit-body="${state.editingNoteId}"]`);
    body?.focus();
    if (body) {
      const end = body.value.length;
      body.setSelectionRange(end, end);
    }
  }
}

function render(pulse) {
  document.querySelectorAll(".tabbar button").forEach((button) => {
    button.classList.toggle("is-on", button.dataset.view === state.view);
  });
  renderChips();
  renderOverall(Boolean(pulse));
  if (state.view === "plan") renderPlan();
  else if (state.view === "paths") renderPaths();
  else if (state.view === "notebook") renderNotebook();
  else renderProgress();
  window.SixHoursLabIde?.bindLabIde?.(app);
  window.SixHoursViz?.bindViz?.(app);
  window.SixHoursFormulas?.typeset?.(app);
}

function setChecked(week, index, value) {
  const id = key(week, index);
  const wasDone = weekDone(week);
  if (value) state.checked[id] = true;
  else delete state.checked[id];
  save();
  const nowDone = weekDone(week);
  render(!wasDone && nowDone);
  if (!wasDone && nowDone) {
    showToast(`Week ${week.n} finished. ${doneWeeks().length} of 26 weeks. ${doneWeeks().length * 6} hours logged.`);
  }
}

document.body.addEventListener("click", async (event) => {
  const chipsNav = event.target.closest("[data-chips-nav]");
  if (chipsNav && !chipsNav.disabled) {
    event.preventDefault();
    scrollChipsBy(Number(chipsNav.dataset.chipsNav) || 0);
    return;
  }
  const viewButton = event.target.closest(".tabbar button");
  if (viewButton) {
    state.view = viewButton.dataset.view;
    if (state.view !== "notebook") state.editingNoteId = null;
    document.querySelector("#tutor-sheet")?.setAttribute("hidden", "");
    document.body.classList.remove("tutor-open");
    render();
    window.scrollTo(0, 0);
    return;
  }
  const filterButton = event.target.closest("[data-filter]");
  if (filterButton) {
    state.filter = filterButton.dataset.filter;
    render();
    return;
  }
  const toggle = event.target.closest("[data-toggle]");
  if (toggle) {
    const number = Number(toggle.dataset.toggle);
    if (state.open.has(number)) state.open.delete(number);
    else state.open.add(number);
    render();
    return;
  }
  const finish = event.target.closest("[data-finish]");
  if (finish) {
    const week = state.plan.weeks.find((item) => item.n === Number(finish.dataset.finish));
    const wasDone = weekDone(week);
    week.criteria.forEach((_, index) => {
      state.checked[key(week, index)] = true;
    });
    state.open.add(week.n);
    save();
    render(!wasDone);
    if (!wasDone) {
      showToast(`Week ${week.n} finished. ${doneWeeks().length} of 26 weeks. ${doneWeeks().length * 6} hours logged.`);
    }
    return;
  }
  const jump = event.target.closest("[data-jump]");
  if (jump) {
    state.view = "plan";
    state.filter = jump.dataset.jump;
    render();
    window.scrollTo(0, 0);
    return;
  }
  if (event.target.id === "copy-backup") {
    const text = document.querySelector("#backup").value;
    try {
      await navigator.clipboard.writeText(text);
      showToast("Backup copied.");
    } catch (_) {
      showToast("Select the text and copy it manually.");
    }
    return;
  }
  if (event.target.id === "restore-backup") {
    try {
      const parsed = JSON.parse(document.querySelector("#backup").value);
      if (!parsed || typeof parsed.checked !== "object") throw new Error("bad");
      state.checked = parsed.checked;
      if (Array.isArray(parsed.notes)) {
        localStorage.setItem("six-hours-notebook-v1", JSON.stringify(parsed.notes));
      }
      save();
      render();
      showToast(`Restored. ${doneWeeks().length} of 26 weeks finished.`);
    } catch (_) {
      showToast("That backup could not be read.");
    }
    return;
  }
  if (event.target.id === "reset-progress") {
    if (window.confirm("Clear every finished week on this browser?")) {
      state.checked = {};
      save();
      render();
      showToast("Progress cleared.");
    }
  }
  const editNote = event.target.closest("[data-edit-note]");
  if (editNote) {
    state.editingNoteId = editNote.dataset.editNote;
    render();
    return;
  }
  const cancelEdit = event.target.closest("[data-cancel-edit-note]");
  if (cancelEdit) {
    state.editingNoteId = null;
    render();
    return;
  }
  const saveNote = event.target.closest("[data-save-note]");
  if (saveNote) {
    const id = saveNote.dataset.saveNote;
    const captionEl = app.querySelector(`[data-edit-caption="${id}"]`);
    const bodyEl = app.querySelector(`[data-edit-body="${id}"]`);
    try {
      const updated = window.SixHoursNotebook.updateNote(id, {
        caption: captionEl?.value ?? "",
        text: bodyEl?.value ?? "",
      });
      state.editingNoteId = null;
      render();
      showToast(`Note saved · ${updated.caption}`);
    } catch (error) {
      showToast(error.message || "Could not save that note.");
    }
    return;
  }
  const copyNote = event.target.closest("[data-copy-note]");
  if (copyNote) {
    const id = copyNote.dataset.copyNote;
    const note = window.SixHoursNotebook?.loadNotes?.().find((item) => item.id === id);
    if (note) {
      navigator.clipboard?.writeText(`${note.caption}\n${note.createdAt}\n\n${note.text}`).then(
        () => showToast("Note copied."),
        () => showToast("Could not copy. Select the note text manually.")
      );
    }
    return;
  }
  const deleteNote = event.target.closest("[data-delete-note]");
  if (deleteNote) {
    if (window.confirm("Delete this notebook entry?")) {
      const id = deleteNote.dataset.deleteNote;
      if (state.editingNoteId === id) state.editingNoteId = null;
      window.SixHoursNotebook.deleteNote(id);
      render();
      showToast("Note deleted.");
    }
  }
});

document.body.addEventListener("change", (event) => {
  const box = event.target.closest("[data-check]");
  if (!box) return;
  const [weekNumber, index] = box.dataset.check.split(":").map(Number);
  const week = state.plan.weeks.find((item) => item.n === weekNumber);
  setChecked(week, index, box.checked);
});

window.SixHours = {
  getPlan: () => state.plan,
  getView: () => state.view,
  refresh: () => render(false),
  getOpenWeek: () => {
    if (!state.plan) return null;
    const open = [...state.open];
    if (open.length) {
      const newest = open[open.length - 1];
      return state.plan.weeks.find((week) => week.n === newest) || null;
    }
    return state.plan.weeks.find((week) => week.n === currentWeekNumber()) || null;
  },
};

async function main() {
  try {
    load();
    const response = await fetch("plan.json?v=20260927j");
    if (!response.ok) throw new Error(`plan.json ${response.status}`);
    state.plan = await response.json();
    const start = new Date(`${state.plan.start}T00:00:00`);
    const end = new Date(start);
    end.setDate(start.getDate() + 25 * 7 + 6);
    const full = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
    document.querySelector("#date-range").textContent = `${full.format(start)} – ${full.format(end)}`;
    render();
  } catch (error) {
    app.textContent = `The plan did not load. ${error.message}`;
  }
}

main();
