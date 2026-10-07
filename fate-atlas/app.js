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

  function fillSelect(select, options) {
    select.innerHTML = options
      .map((o) => `<option value="${o.id}">${o.label}</option>`)
      .join("");
  }

  function renderContinentNav() {
    const counts = countByContinent();
    const items = continents.filter((c) => c.id !== "all");
    els.continentNav.innerHTML = items
      .map((c) => {
        const n = counts[c.id] || 0;
        return `<button type="button" class="continent-btn" data-continent="${c.id}">
          <span class="continent-btn__name">${c.label}</span>
          <span class="continent-btn__count">${n} methods</span>
        </button>`;
      })
      .join("");

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
  }

  function methodMatches(m, q, continent, type) {
    if (continent !== "all" && m.continent !== continent) return false;
    if (type !== "all" && m.type !== type) return false;
    if (!q) return true;
    const hay = [
      m.name,
      m.region,
      m.summary,
      m.continent,
      m.type,
      ...(m.countries || []),
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  }

  function methodHTML(m) {
    const countries = (m.countries || []).join(", ");
    return `<li class="method" id="method-${m.id}">
      <div>
        <h3 class="method__name">${escapeHTML(m.name)}</h3>
        <div class="method__meta">
          <span class="tag tag--type">${escapeHTML(m.type)}</span>
          <span class="tag">${escapeHTML(m.continent)}</span>
        </div>
        <p class="method__region">${escapeHTML(m.region || "")}</p>
      </div>
      <div>
        <p class="method__summary">${escapeHTML(m.summary)}</p>
        <p class="method__countries"><strong>Countries:</strong> ${escapeHTML(countries)}</p>
        <p class="method__source"><strong>Source:</strong> ${escapeHTML(m.source || "Compiled research")}</p>
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

    els.count.textContent = `Showing ${filtered.length} method${filtered.length === 1 ? "" : "s"}`;
    els.list.innerHTML = filtered.map(methodHTML).join("");
    els.empty.hidden = filtered.length > 0;
    els.list.hidden = filtered.length === 0;

    document.querySelectorAll(".continent-btn").forEach((b) => {
      b.classList.toggle("is-active", b.dataset.continent === continent);
    });
  }

  function drawLot() {
    const pick = methods[Math.floor(Math.random() * methods.length)];
    els.oracleResult.hidden = false;
    els.oracleResult.innerHTML = `
      <p class="section__eyebrow" style="margin-bottom:0.5rem">Your lot</p>
      <h3 class="method__name">${escapeHTML(pick.name)}</h3>
      <div class="method__meta" style="margin:0.5rem 0 1rem">
        <span class="tag tag--type">${escapeHTML(pick.type)}</span>
        <span class="tag">${escapeHTML(pick.continent)}</span>
        <span class="tag">${escapeHTML((pick.countries || []).slice(0, 3).join(", "))}</span>
      </div>
      <p class="method__summary">${escapeHTML(pick.summary)}</p>
      <p style="margin-top:1rem"><a href="#method-${pick.id}">View in catalog →</a></p>
    `;
    // Ensure the catalog item exists even if filtered out
    els.search.value = "";
    els.continent.value = "all";
    els.type.value = "all";
    renderList();
  }

  function initStats() {
    els.statMethods.textContent = String(methods.length);
    els.statCountries.textContent = String(uniqueCountries(methods).size);
  }

  function init() {
    fillSelect(els.continent, continents);
    fillSelect(els.type, types);
    renderContinentNav();
    initStats();
    renderList();

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
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
