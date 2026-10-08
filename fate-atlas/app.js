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

  // Compact line marks — readable at card size, distinct per continent.
  const CONTINENT_ICONS = {
    Africa: `<svg class="continent-btn__svg" viewBox="0 0 40 40" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M20 6.5c3.2 0 5.8 2.2 6.4 5.2 2.2.8 3.6 3 3.2 5.4-.2 1.8-1.4 3.2-3 3.8.4 2.8-.8 5.6-3.4 6.8-1.4.6-3 .6-4.4 0-2.6-1.2-3.8-4-3.4-6.8-1.6-.6-2.8-2-3-3.8-.4-2.4 1-4.6 3.2-5.4C16.2 8.7 18 6.5 20 6.5z"/><circle cx="20" cy="18" r="2.2" fill="currentColor"/></svg>`,
    Asia: `<svg class="continent-btn__svg" viewBox="0 0 40 40" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M7.5 29.5 20 8.5l12.5 21H7.5z"/><circle cx="29" cy="11" r="2" fill="currentColor"/><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M8 33.5h24"/></svg>`,
    Europe: `<svg class="continent-btn__svg" viewBox="0 0 40 40" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M12 33V9h7c3.6 0 6 2.2 6 5.4 0 2.4-1.4 4.2-3.6 5L28 33"/><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M12 19.5h8.5"/></svg>`,
    "North America": `<svg class="continent-btn__svg" viewBox="0 0 40 40" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M20 7 9 28h6.5l1.8-3.6h5.4L24.5 28H31L20 7z"/><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M13 33h14"/></svg>`,
    "South America": `<svg class="continent-btn__svg" viewBox="0 0 40 40" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M20 6.5c4.6 0 8 3 8 7.2 0 2.8-1.4 5.2-3.8 6.6L22 34h-4l-2.2-13.7c-2.4-1.4-3.8-3.8-3.8-6.6 0-4.2 3.4-7.2 8-7.2z"/></svg>`,
    Oceania: `<svg class="continent-btn__svg" viewBox="0 0 40 40" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M7 24c2.4-1.5 4.7-2.2 7-2.2s4.6.7 7 2.2 4.7 2.2 7 2.2 4.6-.7 7-2.2"/><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M7 30c2.4-1.5 4.7-2.2 7-2.2s4.6.7 7 2.2 4.7 2.2 7 2.2 4.6-.7 7-2.2"/><circle cx="20" cy="12" r="3.6" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="28.5" cy="9.5" r="1.4" fill="currentColor"/><circle cx="12.2" cy="10.5" r="1.1" fill="currentColor"/></svg>`,
  };

  function continentIcon(id) {
    return CONTINENT_ICONS[id] || "";
  }

  function renderContinentNav() {
    const counts = countByContinent();
    const items = continents.filter((c) => c.id !== "all");
    els.continentNav.innerHTML = items
      .map((c) => {
        const n = counts[c.id] || 0;
        return `<button type="button" class="continent-btn" data-continent="${c.id}">
          <span class="continent-btn__text">
            <span class="continent-btn__name">${continentLabel(c.id)}</span>
            <span class="continent-btn__count">${t("catalog.ritesCount", { n })}</span>
          </span>
          <span class="continent-btn__icon" aria-hidden="true">${continentIcon(c.id)}</span>
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
    const text = methodText(m);
    const hay = [
      text.name,
      text.region,
      text.summary,
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
    if (window.FatumMethodText) return window.FatumMethodText.processLabel(m);
    try {
      const photo = window.fatePhotoSubjectFor ? window.fatePhotoSubjectFor(m) : null;
      if (photo) return photo.required ? "Photo · form reading" : "Form (+ optional photo)";
      return window.fateProcessForMethod ? window.fateProcessForMethod(m).label : m.type;
    } catch (_) {
      return m.type;
    }
  }

  function methodText(m) {
    return window.FatumMethodText ? window.FatumMethodText.localize(m) : m;
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
    const text = methodText(m);
    const cover = window.FatumCovers
      ? window.FatumCovers.coverHTML(m, "method__cover")
      : "";
    const icon = window.FatumRiteIcons
      ? window.FatumRiteIcons.iconHTML(m, "rite-icon rite-icon--method")
      : "";
    const markTitle = t("catalog.riteMarkTitle", { name: text.name, process: processLabel });
    return `<li class="method" id="method-${m.id}">
      <div class="method__media">
        ${cover}
        <div class="method__mark" title="${escapeHTML(markTitle)}">
          ${icon}
          <span class="method__mark-label">${escapeHTML(t("catalog.riteMark"))}</span>
        </div>
      </div>
      <div class="method__content">
        <div class="method__lead">
          <p class="method__kicker">${escapeHTML(continentLabel(m.continent))}${text.region ? ` · ${escapeHTML(text.region)}` : ""}</p>
          <h3 class="method__name">${escapeHTML(text.name)}</h3>
          <div class="method__meta">
            <span class="tag tag--type">${escapeHTML(typeLabel(m.type))}</span>
            <span class="tag tag--process">${escapeHTML(processLabel)}</span>
            ${sci ? `<span class="tag tag--science tag--science-${escapeHTML(sci.levelId)}">${escapeHTML(sci.tag)}</span>` : ""}
          </div>
        </div>
        <div class="method__body">
          <p class="method__summary">${escapeHTML(text.summary)}</p>
          ${
            sci
              ? `<div class="science-box science-box--${escapeHTML(sci.levelId)}">
                  <p class="science-box__label">${escapeHTML(t("science.label"))}</p>
                  <p class="science-box__text">${escapeHTML(sci.reasoning)}</p>
                </div>`
              : ""
          }
          <div class="method__foot">
            <p class="method__countries"><strong>${escapeHTML(t("catalog.countries"))}:</strong> <span class="country-chips">${countriesMarkup(m.countries, m.region)}</span></p>
            <p class="method__source"><strong>${escapeHTML(t("catalog.source"))}:</strong> ${escapeHTML(text.source || "Compiled research")}</p>
            <p class="method__actions">
              <button type="button" class="btn btn--primary btn--small btn--play" data-read="${escapeHTML(m.id)}">▶ ${escapeHTML(t("catalog.play"))}</button>
            </p>
          </div>
        </div>
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

  function showRecommendedInList(methodId) {
    if (!methodId) return;
    els.search.value = "";
    els.continent.value = "all";
    els.type.value = "all";
    renderList();
    requestAnimationFrame(() => {
      const target = document.getElementById(`method-${methodId}`);
      if (!target) return;
      target.classList.add("is-route-focus");
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => target.classList.remove("is-route-focus"), 1800);
    });
  }

  function drawLot() {
    const pick = methods[Math.floor(Math.random() * methods.length)];
    const processLabel = processLabelFor(pick);
    const sci = scienceFor(pick);
    const text = methodText(pick);
    els.oracleResult.hidden = false;
    const cover = window.FatumCovers
      ? window.FatumCovers.coverHTML(pick, "oracle__cover")
      : "";
    const icon = window.FatumRiteIcons
      ? window.FatumRiteIcons.iconHTML(pick, "rite-icon rite-icon--oracle")
      : "";
    els.oracleResult.innerHTML = `
      ${cover}
      <p class="section__eyebrow" style="margin-bottom:0.5rem">${escapeHTML(t("oracle.lot"))}</p>
      <h3 class="method__name">${icon} ${escapeHTML(text.name)}</h3>
      <div class="method__meta" style="margin:0.5rem 0 1rem">
        <span class="tag tag--type">${escapeHTML(typeLabel(pick.type))}</span>
        <span class="tag">${escapeHTML(continentLabel(pick.continent))}</span>
        <span class="tag tag--process">${escapeHTML(processLabel)}</span>
        ${sci ? `<span class="tag tag--science tag--science-${escapeHTML(sci.levelId)}">${escapeHTML(sci.tag)}</span>` : ""}
      </div>
      <p class="method__summary">${escapeHTML(text.summary)}</p>
      <p class="method__countries"><strong>${escapeHTML(t("catalog.countries"))}:</strong> <span class="country-chips">${countriesMarkup(pick.countries, pick.region)}</span></p>
      ${sci ? `<div class="science-box science-box--${escapeHTML(sci.levelId)}"><p class="science-box__label">${escapeHTML(t("science.label"))}</p><p class="science-box__text">${escapeHTML(sci.reasoning)}</p></div>` : ""}
      <p class="method__actions" style="margin-top:1rem">
        <button type="button" class="btn btn--primary btn--small btn--play" data-read="${escapeHTML(pick.id)}">▶ ${escapeHTML(t("catalog.play"))}</button>
        <button type="button" class="btn btn--ghost btn--small studio__btn-muted" data-recommend-show="${escapeHTML(pick.id)}">${escapeHTML(t("recommend.show"))}</button>
      </p>
    `;
    els.oracleResult.scrollIntoView({ behavior: "smooth", block: "nearest" });
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
      if (window.FatumRouter) {
        window.FatumRouter.navigate("atlas", { continent: id });
      } else {
        document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
      }
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

    els.drawBtn?.addEventListener("click", drawLot);

    els.oracleResult?.addEventListener("click", (e) => {
      const showBtn = e.target.closest("[data-recommend-show]");
      if (!showBtn) return;
      showRecommendedInList(showBtn.getAttribute("data-recommend-show"));
    });

    document.addEventListener("fatum:locale-changed", () => {
      refreshLocalizedChrome();
      if (!els.oracleResult.hidden && els.oracleResult.innerHTML.trim()) {
        // Keep oracle result language in sync if visible — leave as-is until redraw
      }
    });
  }

  window.FatumAtlas = {
    drawLot,
    showRecommendedInList,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
