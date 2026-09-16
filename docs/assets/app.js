(function () {
  const app = document.getElementById("app");
  const navLinks = document.querySelectorAll(".nav a");
  const menuBtn = document.querySelector(".menu-btn");
  const nav = document.querySelector(".nav");
  const LANG_KEY = "trn-lang";

  const backdrop = document.querySelector(".nav-backdrop");

  function setMenu(open) {
    nav.classList.toggle("open", open);
    document.body.classList.toggle("menu-open", open);
    if (backdrop) backdrop.hidden = !open;
    if (menuBtn) {
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      const ui = (window.TRN_UI && TRN_UI[lang]) || {};
      menuBtn.setAttribute("aria-label", open ? (ui.menuClose || "Close menu") : (ui.menu || "Open menu"));
    }
  }

  menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    setMenu(!nav.classList.contains("open"));
  });
  nav.addEventListener("click", (e) => {
    if (e.target.closest("a")) setMenu(false);
  });
  if (backdrop) backdrop.addEventListener("click", () => setMenu(false));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setMenu(false);
  });

  const PRODUCTS = {
    cfd: ["spot", "margin", "perps", "futures"],
    crypto: ["tokens", "perps", "tokenised"]
  };

  function detectLang() {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved === "zh" || saved === "en") return saved;
    } catch (e) { /* private mode */ }
    const navLang = (navigator.language || navigator.userLanguage || "en").toLowerCase();
    return navLang.indexOf("zh") === 0 ? "zh" : "en";
  }

  let lang = detectLang();

  function t() {
    const ui = (window.TRN_UI && TRN_UI[lang]) || (window.TRN_UI && TRN_UI.en) || {};
    return ui;
  }

  function pack() {
    if (lang === "zh" && window.TRN_ZH) return TRN_ZH;
    return window.TRN_EN || window.TRN;
  }

  function measurePack() {
    if (lang === "zh" && window.TRN_MEASURES_ZH) return TRN_MEASURES_ZH;
    return window.TRN_MEASURES_EN || window.TRN_MEASURES || {};
  }

  function severityPack() {
    if (lang === "zh" && window.TRN_SEVERITY_ZH) return TRN_SEVERITY_ZH;
    return window.TRN_SEVERITY_EN || window.TRN_SEVERITY || [];
  }

  function englishPack() {
    return window.TRN_EN || window.TRN;
  }

  function allPlaybooks() {
    const p = pack();
    return [
      ...p.cfd.map((x) => ({ ...x, venue: "cfd" })),
      ...p.crypto.map((x) => ({ ...x, venue: "crypto" }))
    ];
  }

  function findPlaybook(id) {
    return allPlaybooks().find((p) => p.id === id);
  }

  function findEnglishPlaybook(id) {
    const p = englishPack();
    return [...p.cfd, ...p.crypto].find((x) => x.id === id);
  }

  function parseHash() {
    const raw = (location.hash || "#/").replace(/^#/, "");
    const parts = raw.split("/").filter(Boolean);
    if (!parts.length) return { view: "home" };
    if (parts[0] === "playbook" && parts[1]) return { view: "dossier", id: parts[1] };
    return { view: parts[0] };
  }

  function setActiveNav(view) {
    navLinks.forEach((a) => {
      const href = a.getAttribute("href");
      const key = href === "#/" ? "home" : href.replace("#/", "");
      a.classList.toggle("active", key === view);
    });
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function productLabel(key) {
    return (t().products && t().products[key]) || key;
  }

  function severityLabel(key) {
    return (t().severity && t().severity[key]) || key;
  }

  function venueTitle(venue) {
    return venue === "cfd" ? t().cfdTitle : t().cryptoTitle;
  }

  function chips(list) {
    return `<div class="products">${list.map((x) => `<span>${esc(productLabel(x))}</span>`).join("")}</div>`;
  }

  function nodeKind(who, action) {
    const w = String(who || "").toLowerCase();
    const a = String(action || "");
    if (/^(if |when a |optional)/i.test(a) || /accept.*reject|reject or requote/i.test(a)) return "decision";
    if (/market|victim|retail|outer ring|holder|borrower|adl victim|scavenger/i.test(w)) return "market";
    if (/engine|platform|sys|index|oracle|liq engine|cascade/i.test(w)) return "system";
    if (/broker|b-book|finance|privilege|house|issuer|attestor|custodian|venue \(worst|staff/i.test(w)) return "house";
    return "actor";
  }

  function nodeKindFor(p, step, index) {
    const en = findEnglishPlaybook(p.id);
    const src = (en && en.workflow && en.workflow[index]) || step;
    return nodeKind(src.who, src.action);
  }

  function flowchart(p) {
    const ui = t();
    const kinds = ui.kind || {};
    const start = `
      <div class="chart-row">
        <div class="chart-spine"><div class="chart-dot start">IN</div><div class="chart-line"></div></div>
        <div class="chart-box actor"><span class="who">${esc(ui.start)}</span><span class="act">${esc(p.name)}</span></div>
        <div class="chart-tell"><b>${esc(ui.setup)}</b>${esc(p.summary)}</div>
      </div>`;
    const rows = p.workflow.map((s, i) => {
      const last = i === p.workflow.length - 1;
      const kind = nodeKindFor(p, s, i);
      const kindLabel = kinds[kind] || kind;
      return `
        <div class="chart-row">
          <div class="chart-spine">
            <div class="chart-dot">${esc(s.n)}</div>
            <div class="chart-line"></div>
            ${last ? `<div class="chart-dot end">OUT</div>` : ""}
          </div>
          <div class="chart-box ${kind}">
            <span class="who">${esc(s.who)} · ${esc(kindLabel)}</span>
            <span class="act">${esc(s.action)}</span>
          </div>
          <div class="chart-tell"><b>${esc(ui.tapeTell)}</b>${esc(s.tell)}</div>
        </div>`;
    }).join("");
    return `
      <div class="chart-legend">
        <span class="actor"><i></i>${esc(ui.legendActor)}</span>
        <span class="system"><i></i>${esc(ui.legendSystem)}</span>
        <span class="market"><i></i>${esc(ui.legendMarket)}</span>
        <span class="house"><i></i>${esc(ui.legendHouse)}</span>
      </div>
      <div class="chart" role="img" aria-label="${esc(ui.flowchart)} — ${esc(p.name)}">${start}${rows}</div>`;
  }

  function measuresFor(id, fallback) {
    const mapped = measurePack()[id] || [];
    if (mapped.length) return mapped;
    return (fallback || []).map((text) => ({
      text,
      severity: "standing",
      trigger: lang === "zh" ? "常开" : "Always on",
      owner: lang === "zh" ? "交易台" : "Desk",
      event: lang === "zh" ? "未映射" : "Unmapped"
    }));
  }

  function measureList(id, fallback) {
    const ui = t();
    const rows = measuresFor(id, fallback);
    const order = ["standing", "elevated", "high", "critical"];
    return order.map((sev) => {
      const items = rows.filter((r) => r.severity === sev);
      if (!items.length) return "";
      const label = severityPack().find((s) => s.id === sev);
      return `
        <h3 style="margin-top:18px">${esc(label ? label.title : severityLabel(sev))} · ${esc(ui.firesAt)} ${esc(label ? label.when : sev)}</h3>
        ${items.map((m) => `
          <div class="cm-card">
            <div class="meta">
              <span class="badge ${sev}">${esc(m.trigger)}</span>
              <span>${esc(m.owner)}</span>
              <span>${esc(m.event)}</span>
            </div>
            <div>${esc(m.text)}</div>
          </div>`).join("")}`;
    }).join("");
  }

  function card(p) {
    const ui = t();
    return `
      <a class="card" href="#/playbook/${p.id}">
        <div class="card-top">
          <span class="code">${esc(p.code)}</span>
          <span class="badge ${p.severity}">${esc(severityLabel(p.severity))}</span>
        </div>
        <h3>${esc(p.name)}</h3>
        ${chips(p.products)}
        <p>${esc(p.summary)}</p>
        <span class="more">${esc(ui.openDossier)}</span>
      </a>`;
  }

  function home() {
    const ui = t();
    const h = ui.home;
    const p = pack();
    return `
      <section class="hero">
        <div>
          <div class="kicker">${esc(h.kicker)}</div>
          <h1>${esc(h.title1)}<br>${esc(h.title2)}</h1>
          <p class="lede">${esc(h.lede)}</p>
        </div>
        <div class="hero-meta">
          <div><b>CFD</b> ${esc(h.metaCfd)}</div>
          <div><b>Crypto</b> ${esc(h.metaCrypto)}</div>
          <div><b>${p.meta.playbooks}</b> ${esc(h.metaCount)}</div>
          <div>${esc(h.metaNote)}</div>
        </div>
      </section>
      <section class="doors">
        <a class="door" href="#/cfd">
          <div class="tag">${esc(h.door1Tag)}</div>
          <h2>${esc(h.door1Title)}</h2>
          <p>${esc(h.door1Body)}</p>
        </a>
        <a class="door crypto" href="#/crypto">
          <div class="tag">${esc(h.door2Tag)}</div>
          <h2>${esc(h.door2Title)}</h2>
          <p>${esc(h.door2Body)}</p>
        </a>
      </section>
      <section class="stats">
        <div class="stat"><b>${p.cfd.length}</b><span>${esc(h.statCfd)}</span></div>
        <div class="stat"><b>${p.crypto.length}</b><span>${esc(h.statCrypto)}</span></div>
        <div class="stat"><b>6</b><span>${esc(h.statLevels)}</span></div>
        <div class="stat"><b>24/7</b><span>${esc(h.stat247)}</span></div>
      </section>
      <section class="section">
        <h3>${esc(h.howTitle)}</h3>
        <ol class="list">
          ${h.how.map((item) => `<li>${esc(item)}</li>`).join("")}
        </ol>
      </section>`;
  }

  function catalogue(venue) {
    const ui = t();
    const p = pack();
    const rows = venue === "cfd" ? p.cfd : p.crypto;
    const title = venueTitle(venue);
    const lede = venue === "cfd" ? ui.cfdLede : ui.cryptoLede;
    const productSet = PRODUCTS[venue];
    const tag = venue === "cfd" ? ui.home.door1Tag : ui.home.door2Tag;
    return `
      <div class="kicker">${esc(tag)}</div>
      <h1>${esc(title)}</h1>
      <p class="lede">${esc(lede)}</p>
      <div class="toolbar" data-venue="${venue}">
        <input class="search" type="search" placeholder="${esc(ui.search)}" />
        ${productSet.map((key) => `<button class="chip on" data-product="${key}">${esc(productLabel(key))}</button>`).join("")}
        <button class="sev on" data-sev="critical">${esc(severityLabel("critical"))}</button>
        <button class="sev on" data-sev="high">${esc(severityLabel("high"))}</button>
        <button class="sev on" data-sev="elevated">${esc(severityLabel("elevated"))}</button>
      </div>
      <div class="grid" id="catalogue">${rows.map((x) => card({ ...x, venue })).join("")}</div>`;
  }

  function bindCatalogue(venue) {
    const ui = t();
    const p = pack();
    const rows = venue === "cfd" ? p.cfd : p.crypto;
    const root = document.querySelector(".toolbar");
    const grid = document.getElementById("catalogue");
    const search = root.querySelector(".search");

    function selected(sel) {
      return [...root.querySelectorAll(sel + ".on")].map((b) => b.dataset.product || b.dataset.sev);
    }

    function renderGrid() {
      const q = search.value.trim().toLowerCase();
      const products = selected(".chip");
      const sevs = selected(".sev");
      const hit = rows.filter((item) => {
        const hitProduct = item.products.some((x) => products.includes(x));
        const hitSev = sevs.includes(item.severity);
        const blob = [
          item.name, item.summary, item.why, item.code,
          ...(item.participants || []).map((x) => x.role)
        ].join(" ").toLowerCase();
        const hitQ = !q || blob.includes(q);
        return hitProduct && hitSev && hitQ;
      });
      grid.innerHTML = hit.length
        ? hit.map((x) => card({ ...x, venue })).join("")
        : `<p class="empty">${esc(ui.empty)}</p>`;
    }

    root.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      btn.classList.toggle("on");
      renderGrid();
    });
    search.addEventListener("input", renderGrid);
  }

  function dossier(p) {
    const ui = t();
    const back = p.venue === "cfd" ? "#/cfd" : "#/crypto";
    return `
      <a class="back" href="${back}">← ${esc(venueTitle(p.venue))}</a>
      <div class="dossier">
        <div class="dossier-head">
          <div>
            <div class="kicker">${esc(p.code)} · ${esc(venueTitle(p.venue))}</div>
            <h1>${esc(p.name)}</h1>
            <p class="lede">${esc(p.summary)}</p>
            ${chips(p.products)}
          </div>
          <span class="badge ${p.severity}">${esc(severityLabel(p.severity))}</span>
        </div>
        <section class="section">
          <h3>${esc(ui.why)}</h3>
          <p>${esc(p.why)}</p>
        </section>
        <section class="section">
          <h3>${esc(ui.flowchart)}</h3>
          ${flowchart(p)}
        </section>
        <section class="section">
          <h3>${esc(ui.people)}</h3>
          <div class="people">
            ${p.participants.map((x) => `<div class="person"><b>${esc(x.role)}</b><span>${esc(x.incentive)}</span></div>`).join("")}
          </div>
        </section>
        <section class="section">
          <h3>${esc(ui.detection)}</h3>
          <p class="lede" style="font-size:15px">${esc(ui.tools)}: ${p.detection.tools.map(esc).join(" · ")}</p>
          <div class="matrix">
            <table>
              <thead>
                <tr>
                  <th>${esc(ui.thMetric)}</th>
                  <th>${esc(ui.thWindow)}</th>
                  <th>${esc(ui.thWarn)}</th>
                  <th>${esc(ui.thBreach)}</th>
                  <th>${esc(ui.thNotes)}</th>
                </tr>
              </thead>
              <tbody>
                ${p.detection.parameters.map((r) => `
                  <tr>
                    <td>${esc(r.metric)}</td>
                    <td>${esc(r.window)}</td>
                    <td class="warn">${esc(r.warn)}</td>
                    <td class="breach">${esc(r.breach)}</td>
                    <td>${esc(r.notes)}</td>
                  </tr>`).join("")}
              </tbody>
            </table>
          </div>
        </section>
        <section class="section">
          <h3>${esc(ui.escPath)}</h3>
          <div class="escalation">
            ${p.escalation.map((e) => `
              <div class="esc">
                <div class="lvl">${esc(e.lvl)}<br>${esc(e.when)}</div>
                <div><b>${esc(e.who)}</b> — ${esc(e.action)}</div>
              </div>`).join("")}
          </div>
        </section>
        <section class="section">
          <h3>${esc(ui.cmTitle)}</h3>
          <p class="lede" style="font-size:15px">${esc(ui.cmLede)}</p>
          ${measureList(p.id, p.countermeasures)}
        </section>
      </div>`;
  }

  function stack() {
    const ui = t();
    const p = pack();
    return `
      <div class="kicker">${esc(ui.stackKicker)}</div>
      <h1>${esc(ui.stackTitle)}</h1>
      <p class="lede">${esc(p.stack.intro)}</p>
      <div class="two" style="margin-top:28px">
        ${p.stack.layers.map((l) => `
          <article class="tool">
            <div class="fit">${esc(l.fit)}</div>
            <h3>${esc(l.name)}</h3>
            <ul class="list">${l.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>
          </article>`).join("")}
      </div>
      <section class="section" style="margin-top:16px">
        <h3>${esc(ui.paramTitle)}</h3>
        <ul class="list">
          ${ui.param.map((item) => `<li>${esc(item)}</li>`).join("")}
        </ul>
      </section>`;
  }

  function escalation() {
    const ui = t();
    const p = pack();
    return `
      <div class="kicker">${esc(ui.escKicker)}</div>
      <h1>${esc(ui.escTitle)}</h1>
      <p class="lede">${esc(p.escalationHub.intro)}</p>
      <div class="matrix" style="margin:24px 0">
        <table>
          <thead>
            <tr>
              <th>${esc(ui.thLevel)}</th>
              <th>${esc(ui.thSla)}</th>
              <th>${esc(ui.thOwner)}</th>
              <th>${esc(ui.cfdTitle)}</th>
              <th>${esc(ui.cryptoTitle)}</th>
            </tr>
          </thead>
          <tbody>
            ${p.escalationHub.steps.map((s) => `
              <tr>
                <td><b>${esc(s.lvl)}</b><br>${esc(s.title)}</td>
                <td>${esc(s.sla)}</td>
                <td>${esc(s.owner)}</td>
                <td>${esc(s.cfd)}</td>
                <td>${esc(s.crypto)}</td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>
      <section class="section">
        <h3>${esc(ui.commsTitle)}</h3>
        <ul class="list">${p.escalationHub.comms.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>
      </section>
      <p class="note">${esc(ui.escNote)}</p>`;
  }

  function responseMap() {
    const ui = t();
    const all = allPlaybooks().flatMap((p) =>
      measuresFor(p.id, p.countermeasures).map((m) => ({
        ...m, id: p.id, code: p.code, name: p.name, dossier: p.severity
      }))
    );
    const bands = severityPack().map((s) => `
      <div class="sev-band ${s.id}">
        <div class="fit">${esc(s.when)}</div>
        <h3>${esc(s.title)}</h3>
        <p>${esc(s.meaning)}</p>
        <p style="margin-top:8px">${esc(s.apply)}</p>
      </div>`).join("");
    const order = ["standing", "elevated", "high", "critical"];
    const tables = order.map((sev) => {
      const rows = all.filter((m) => m.severity === sev);
      return `
        <section class="section" style="margin-top:16px">
          <h3>${esc(severityLabel(sev))} · ${rows.length} ${esc(ui.controls)}</h3>
          <div class="matrix">
            <table>
              <thead>
                <tr>
                  <th>${esc(ui.thDossier)}</th>
                  <th>${esc(ui.thTrigger)}</th>
                  <th>${esc(ui.thOwner)}</th>
                  <th>${esc(ui.thEvent)}</th>
                  <th>${esc(ui.thMeasure)}</th>
                </tr>
              </thead>
              <tbody>
                ${rows.map((m) => `
                  <tr>
                    <td><a href="#/playbook/${esc(m.id)}">${esc(m.code)}</a><br>${esc(m.name)}</td>
                    <td class="${sev === "critical" || sev === "high" ? "breach" : "warn"}">${esc(m.trigger)}</td>
                    <td>${esc(m.owner)}</td>
                    <td>${esc(m.event)}</td>
                    <td>${esc(m.text)}</td>
                  </tr>`).join("")}
              </tbody>
            </table>
          </div>
        </section>`;
    }).join("");
    return `
      <div class="kicker">${esc(ui.respKicker)}</div>
      <h1>${esc(ui.respTitle)}</h1>
      <p class="lede">${esc(ui.respLede)}</p>
      <div class="sev-bands">${bands}</div>
      ${tables}`;
  }

  function applyChrome() {
    const ui = t();
    document.documentElement.lang = lang === "zh" ? "zh-Hans" : "en";
    document.body.classList.toggle("lang-zh", lang === "zh");
    document.title = lang === "zh"
      ? "Trading Risk Ninja — 市场操纵监察手册"
      : "Trading Risk Ninja — Market Manipulation Surveillance Playbooks";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) {
      desc.setAttribute("content", lang === "zh"
        ? "面向 CFD 经纪商与加密交易所的监察手册：操纵行为、流程、参与方、监测参数、升级路径与应对措施。"
        : "Surveillance playbooks for CFD brokers and crypto exchanges: manipulative behaviours, workflows, participants, detection parameters, escalation, and countermeasures.");
    }
    const sub = document.querySelector(".brand-copy em");
    if (sub) sub.textContent = ui.brandSub;
    const navMap = {
      "#/": ui.nav.home,
      "#/cfd": ui.nav.cfd,
      "#/crypto": ui.nav.crypto,
      "#/stack": ui.nav.stack,
      "#/escalation": ui.nav.escalation,
      "#/response": ui.nav.response
    };
    navLinks.forEach((a) => {
      const href = a.getAttribute("href");
      if (navMap[href]) a.textContent = navMap[href];
    });
    if (menuBtn) {
      menuBtn.setAttribute("aria-label", nav.classList.contains("open") ? (ui.menuClose || ui.menu) : ui.menu);
    }
    const feet = document.querySelectorAll(".foot p");
    if (feet[0]) feet[0].textContent = ui.foot1;
    if (feet[1]) feet[1].textContent = ui.foot2;
    document.querySelectorAll(".lang-switch button").forEach((b) => {
      const on = b.dataset.lang === lang;
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.classList.toggle("on", on);
    });
  }

  function setLang(next) {
    if (next !== "en" && next !== "zh") return;
    if (next === lang) return;
    lang = next;
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* ignore */ }
    applyChrome();
    render();
  }

  function render() {
    setMenu(false);
    applyChrome();
    const route = parseHash();
    setActiveNav(route.view);
    if (route.view === "home") {
      app.innerHTML = home();
      return;
    }
    if (route.view === "cfd" || route.view === "crypto") {
      app.innerHTML = catalogue(route.view);
      bindCatalogue(route.view);
      return;
    }
    if (route.view === "stack") {
      app.innerHTML = stack();
      return;
    }
    if (route.view === "escalation") {
      app.innerHTML = escalation();
      return;
    }
    if (route.view === "response") {
      app.innerHTML = responseMap();
      return;
    }
    if (route.view === "dossier") {
      const p = findPlaybook(route.id);
      app.innerHTML = p
        ? dossier(p)
        : `<p class="empty">${esc(t().unknown)}</p><p><a class="back" href="#/">${esc(t().backHome)}</a></p>`;
      window.scrollTo(0, 0);
      return;
    }
    app.innerHTML = home();
  }

  document.querySelector(".lang-switch").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-lang]");
    if (btn) setLang(btn.dataset.lang);
  });

  window.addEventListener("hashchange", render);
  render();
})();
