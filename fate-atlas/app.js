(function () {
  "use strict";

  const methods = (window.FATE_METHODS || []).slice().sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const continents = window.CONTINENTS || [];
  const types = window.TYPES || [];

  const els = {
    list: document.getElementById("method-list"),
    empty: document.getElementById("empty-state"),
    count: document.getElementById("results-count"),
    search: document.getElementById("search"),
    continent: document.getElementById("continent-filter"),
    type: document.getElementById("type-filter"),
    reset: document.getElementById("reset-filters"),
    continentNav: document.getElementById("continent-nav"),
    drawBtn: document.getElementById("draw-btn"),
    oracleResult: document.getElementById("oracle-result"),
    statMethods: document.getElementById("stat-methods"),
    statCountries: document.getElementById("stat-countries"),
  };

  function t(key, vars) {
    return window.FatumI18n ? window.FatumI18n.t(key, vars) : key;
  }

  function locale() {
    return window.FatumI18n ? window.FatumI18n.getLocale() : "en";
  }

  function uniqueCountries(list) {
    const set = new Set();
    list.forEach((m) => (m.countries || []).forEach((c) => set.add(c)));
    return set;
  }

  function countByContinent() {
    const counts = Object.create(null);
    methods.forEach((m) => {
      counts[m.continent] = (counts[m.continent] || 0) + 1;
    });
    return counts;
  }

  function continentLabel(id) {
    if (id === "all") return t("continent.all");
    return t(`continent.${id}`) || id;
  }

  function typeLabel(id) {
    if (id === "all") return t("type.all");
    return t(`type.${id}`) || id;
  }

  function fillSelect(select, options, labelFn) {
    const current = select.value;
    select.innerHTML = options
      .map((o) => `<option value="${o.id}">${labelFn(o.id)}</option>`)
      .join("");
    if (options.some((o) => o.id === current)) select.value = current;
  }

  function renderContinentNav() {
    const counts = countByContinent();
    const items = continents.filter((c) => c.id !== "all");
    els.continentNav.innerHTML = items
      .map((c) => {
        const n = counts[c.id] || 0;
        return `<button type="button" class="continent-btn" data-continent="${c.id}">
          <span class="continent-btn__name">${continentLabel(c.id)}</span>
          <span class="continent-btn__count">${t("catalog.ritesCount", { n })}</span>
        </button>`;
      })
      .join("");
  }

  function methodMatches(m, q, continent, type) {
    if (continent !== "all" && m.continent !== continent) return false;
    if (type !== "all" && m.type !== type) return false;
    if (!q) return true;
    const loc = locale();
    const countryNames = (m.countries || []).map((c) =>
      window.FatumCountries ? window.FatumCountries.localizedCountryName(c, loc) : c
    );
    const hay = [
      m.name,
      m.region,
      m.summary,
      m.continent,
      continentLabel(m.continent),
      m.type,
      typeLabel(m.type),
      ...(m.countries || []),
      ...countryNames,
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  }

  function processLabelFor(m) {
    if (m.guided === "bagua" || m.id === "bagua" || m.id === "iching") return "Guided · 铜钱起卦";
    if (m.guided === "tarot" || m.id === "tarot") return "Guided · 塔罗牌";
    if (m.guided === "mbti" || m.id === "mbti") return "Guided · MBTI";
    try {
      const photo = window.fatePhotoSubjectFor ? window.fatePhotoSubjectFor(m) : null;
      if (photo) return photo.required ? "Photo · form reading" : "Form (+ optional photo)";
      return window.fateProcessForMethod ? window.fateProcessForMethod(m).label : m.type;
    } catch (_) {
      return m.type;
    }
  }

  function scienceFor(m) {
    try {
      return window.fateScienceStatusFor ? window.fateScienceStatusFor(m) : null;
    } catch (_) {
      return null;
    }
  }

  function countriesMarkup(list, region) {
    if (window.FatumCountries) {
      return window.FatumCountries.countriesHTML(list, locale(), region);
    }
    return escapeHTML((list || []).join(", "));
  }

  function methodHTML(m) {
    const processLabel = processLabelFor(m);
    const sci = scienceFor(m);
    return `<li class="method" id="method-${m.id}">
      <div>
        <h3 class="method__name">${escapeHTML(m.name)}</h3>
        <div class="method__meta">
          <span class="tag tag--type">${escapeHTML(typeLabel(m.type))}</span>
          <span class="tag">${escapeHTML(continentLabel(m.continent))}</span>
          <span class="tag tag--process">${escapeHTML(processLabel)}</span>
          ${sci ? `<span class="tag tag--science tag--science-${escapeHTML(sci.levelId)}">${escapeHTML(sci.tag)}</span>` : ""}
        </div>
        <p class="method__region">${escapeHTML(m.region || "")}</p>
      </div>
      <div>
        <p class="method__summary">${escapeHTML(m.summary)}</p>
        ${
          sci
            ? `<div class="science-box science-box--${escapeHTML(sci.levelId)}">
                <p class="science-box__label">${escapeHTML(t("science.label"))}</p>
                <p class="science-box__text">${escapeHTML(sci.reasoning)}</p>
              </div>`
            : ""
        }
        <p class="method__countries"><strong>${escapeHTML(t("catalog.countries"))}:</strong> <span class="country-chips">${countriesMarkup(m.countries, m.region)}</span></p>
        <p class="method__source"><strong>${escapeHTML(t("catalog.source"))}:</strong> ${escapeHTML(m.source || "Compiled research")}</p>
        <p class="method__actions">
          <button type="button" class="btn btn--primary btn--small btn--play" data-read="${escapeHTML(m.id)}">▶ ${escapeHTML(t("catalog.play"))}</button>
        </p>
      </div>
    </li>`;
  }

  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderList() {
    const q = (els.search.value || "").trim().toLowerCase();
    const continent = els.continent.value;
    const type = els.type.value;
    const filtered = methods.filter((m) => methodMatches(m, q, continent, type));

    const key = filtered.length === 1 ? "catalog.showing" : "catalog.showingPlural";
    els.count.textContent = t(key, { n: filtered.length });
    els.list.innerHTML = filtered.map(methodHTML).join("");
    els.empty.hidden = filtered.length > 0;
    els.list.hidden = filtered.length === 0;

    document.querySelectorAll(".continent-btn").forEach((b) => {
      b.classList.toggle("is-active", b.dataset.continent === continent);
    });
  }

  function drawLot() {
    const pick = methods[Math.floor(Math.random() * methods.length)];
    const processLabel = processLabelFor(pick);
    const sci = scienceFor(pick);
    els.oracleResult.hidden = false;
    els.oracleResult.innerHTML = `
      <p class="section__eyebrow" style="margin-bottom:0.5rem">${escapeHTML(t("oracle.lot"))}</p>
      <h3 class="method__name">${escapeHTML(pick.name)}</h3>
      <div class="method__meta" style="margin:0.5rem 0 1rem">
        <span class="tag tag--type">${escapeHTML(typeLabel(pick.type))}</span>
        <span class="tag">${escapeHTML(continentLabel(pick.continent))}</span>
        <span class="tag tag--process">${escapeHTML(processLabel)}</span>
        ${sci ? `<span class="tag tag--science tag--science-${escapeHTML(sci.levelId)}">${escapeHTML(sci.tag)}</span>` : ""}
      </div>
      <p class="method__summary">${escapeHTML(pick.summary)}</p>
      <p class="method__countries"><strong>${escapeHTML(t("catalog.countries"))}:</strong> <span class="country-chips">${countriesMarkup(pick.countries, pick.region)}</span></p>
      ${sci ? `<div class="science-box science-box--${escapeHTML(sci.levelId)}"><p class="science-box__label">${escapeHTML(t("science.label"))}</p><p class="science-box__text">${escapeHTML(sci.reasoning)}</p></div>` : ""}
      <p class="method__actions" style="margin-top:1rem">
        <button type="button" class="btn btn--primary btn--small btn--play" data-read="${escapeHTML(pick.id)}">▶ ${escapeHTML(t("catalog.play"))}</button>
        <a class="btn btn--ghost btn--small studio__btn-muted" href="#method-${pick.id}">${escapeHTML(t("oracle.view"))}</a>
      </p>
    `;
  }

  function initStats() {
    els.statMethods.textContent = String(methods.length);
    els.statCountries.textContent = String(uniqueCountries(methods).size);
    const hudMethods = document.getElementById("hud-methods");
    if (hudMethods) hudMethods.textContent = String(methods.length);
  }

  function refreshLocalizedChrome() {
    fillSelect(els.continent, continents, continentLabel);
    fillSelect(els.type, types, typeLabel);
    renderContinentNav();
    renderList();
  }

  function init() {
    refreshLocalizedChrome();
    initStats();

    // Continent nav click (once)
    els.continentNav.addEventListener("click", (e) => {
      const btn = e.target.closest(".continent-btn");
      if (!btn) return;
      const id = btn.dataset.continent;
      els.continent.value = id;
      document.querySelectorAll(".continent-btn").forEach((b) => {
        b.classList.toggle("is-active", b === btn);
      });
      renderList();
      document.getElementById("catalog").scrollIntoView({ behavior: "smooth" });
    });

    ["input", "change"].forEach((evt) => {
      els.search.addEventListener(evt, renderList);
      els.continent.addEventListener(evt, renderList);
      els.type.addEventListener(evt, renderList);
    });

    els.reset.addEventListener("click", () => {
      els.search.value = "";
      els.continent.value = "all";
      els.type.value = "all";
      renderList();
    });

    els.drawBtn.addEventListener("click", drawLot);

    document.addEventListener("fatum:locale-changed", () => {
      refreshLocalizedChrome();
      if (!els.oracleResult.hidden && els.oracleResult.innerHTML.trim()) {
        // Keep oracle result language in sync if visible — leave as-is until redraw
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
