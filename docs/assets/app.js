(function () {
  const app = document.getElementById("app");
  const navLinks = document.querySelectorAll(".nav a");
  const menuBtn = document.querySelector(".menu-btn");
  const nav = document.querySelector(".nav");

  menuBtn.addEventListener("click", () => nav.classList.toggle("open"));
  nav.addEventListener("click", () => nav.classList.remove("open"));

  const PRODUCTS = {
    cfd: ["spot", "margin", "perps", "futures"],
    crypto: ["tokens", "perps", "tokenised"]
  };

  function allPlaybooks() {
    return [
      ...TRN.cfd.map((p) => ({ ...p, venue: "cfd" })),
      ...TRN.crypto.map((p) => ({ ...p, venue: "crypto" }))
    ];
  }

  function findPlaybook(id) {
    return allPlaybooks().find((p) => p.id === id);
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
      a.classList.toggle("active", key === view || (view === "dossier" && false));
    });
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function chips(list) {
    return `<div class="products">${list.map((x) => `<span>${esc(x)}</span>`).join("")}</div>`;
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

  function flowchart(p) {
    const start = `
      <div class="chart-row">
        <div class="chart-spine"><div class="chart-dot start">IN</div><div class="chart-line"></div></div>
        <div class="chart-box actor"><span class="who">Start</span><span class="act">${esc(p.name)}</span></div>
        <div class="chart-tell"><b>Setup</b>${esc(p.summary)}</div>
      </div>`;
    const rows = p.workflow.map((s, i) => {
      const last = i === p.workflow.length - 1;
      const kind = nodeKind(s.who, s.action);
      return `
        <div class="chart-row">
          <div class="chart-spine">
            <div class="chart-dot">${esc(s.n)}</div>
            <div class="chart-line"></div>
            ${last ? `<div class="chart-dot end">OUT</div>` : ""}
          </div>
          <div class="chart-box ${kind}">
            <span class="who">${esc(s.who)} · ${kind}</span>
            <span class="act">${esc(s.action)}</span>
          </div>
          <div class="chart-tell"><b>Tape tell</b>${esc(s.tell)}</div>
        </div>`;
    }).join("");
    return `
      <div class="chart-legend">
        <span class="actor"><i></i>Actor / predator</span>
        <span class="system"><i></i>Engine / platform</span>
        <span class="market"><i></i>Market / victims</span>
        <span class="house"><i></i>House / issuer / conflict</span>
      </div>
      <div class="chart" role="img" aria-label="Workflow flowchart for ${esc(p.name)}">${start}${rows}</div>`;
  }

  function measuresFor(id, fallback) {
    const mapped = (window.TRN_MEASURES && TRN_MEASURES[id]) || [];
    if (mapped.length) return mapped;
    return (fallback || []).map((text) => ({
      text,
      severity: "standing",
      trigger: "Always on",
      owner: "Desk",
      event: "Unmapped"
    }));
  }

  function measureList(id, fallback) {
    const rows = measuresFor(id, fallback);
    const order = ["standing", "elevated", "high", "critical"];
    return order.map((sev) => {
      const items = rows.filter((r) => r.severity === sev);
      if (!items.length) return "";
      const label = (window.TRN_SEVERITY || []).find((s) => s.id === sev);
      return `
        <h3 style="margin-top:18px">${esc(label ? label.title : sev)} · fires at ${esc(label ? label.when : sev)}</h3>
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
    return `
      <a class="card" href="#/playbook/${p.id}">
        <div class="card-top">
          <span class="code">${esc(p.code)}</span>
          <span class="badge ${p.severity}">${esc(p.severity)}</span>
        </div>
        <h3>${esc(p.name)}</h3>
        ${chips(p.products)}
        <p>${esc(p.summary)}</p>
        <span class="more">Open dossier →</span>
      </a>`;
  }

  function home() {
    return `
      <section class="hero">
        <div>
          <div class="kicker">Command centre</div>
          <h1>See the strike<br>before it lands.</h1>
          <p class="lede">Surveillance playbooks for CFD brokers and crypto exchanges. Each dossier walks the behaviour, the participants, the exact monitors, the escalation ladder, and the countermeasures.</p>
        </div>
        <div class="hero-meta">
          <div><b>CFD</b> spot · margin · perps · futures</div>
          <div><b>Crypto</b> tokens · perps · tokenised assets</div>
          <div><b>${TRN.meta.playbooks}</b> dossiers · <b>L0–L5</b> escalation</div>
          <div>Handbook for surveillance, risk, and compliance — not a how-to for abuse.</div>
        </div>
      </section>
      <section class="doors">
        <a class="door" href="#/cfd">
          <div class="tag">Venue 01</div>
          <h2>CFD broker</h2>
          <p>Last look, B-book conflict, DMA spoofing, stop hunts, marks, funding, and liquidation cascades on leveraged books.</p>
        </a>
        <a class="door crypto" href="#/crypto">
          <div class="tag">Venue 02</div>
          <h2>Crypto exchange</h2>
          <p>Wash volume, pumps, oracle/mark games, unlock dumps, sandwiches, and tokenised-asset reserve fraud.</p>
        </a>
      </section>
      <section class="stats">
        <div class="stat"><b>${TRN.cfd.length}</b><span>CFD dossiers</span></div>
        <div class="stat"><b>${TRN.crypto.length}</b><span>Crypto dossiers</span></div>
        <div class="stat"><b>6</b><span>Escalation levels</span></div>
        <div class="stat"><b>24/7</b><span>Assume the tape never sleeps</span></div>
      </section>
      <section class="section">
        <h3>How to use this handbook</h3>
        <ol class="list">
          <li>Pick the venue. Filter by product. Open a dossier when the tape rhymes with the summary.</li>
          <li>Work the workflow backwards: the last step is usually the profit; the first step is usually the map.</li>
          <li>Copy the parameter table into your rule engine, then retune on two weeks of your own data before you page anyone.</li>
          <li>Escalate on the L0–L5 ladder. Containment (L4) can outrun the case file (L3) when clients are being liquidated on a bad mark.</li>
          <li>Countermeasures are product design, not just alerts. If the mark is a single last trade, you will keep hunting ghosts.</li>
          <li>Open a dossier for the workflow flowchart. Use the Response Map to see which controls fire at standing / warn / breach / cascade.</li>
        </ol>
      </section>`;
  }

  function catalogue(venue) {
    const pack = venue === "cfd" ? TRN.cfd : TRN.crypto;
    const title = venue === "cfd" ? "CFD broker" : "Crypto exchange";
    const lede = venue === "cfd"
      ? "Behaviours that show up on spot CFDs, margined FX/index books, perpetual CFDs, and dated futures. Several dossiers are really conflicts of the house — last look, B-book routing, house marks — not just client abuse."
      : "Behaviours on spot tokens, perpetual futures, and tokenised assets (stables, wrappers, gold, T-bills, fund shares). If the token is a balance sheet, start with reserves, not the candle.";
    const productSet = PRODUCTS[venue];
    return `
      <div class="kicker">${venue === "cfd" ? "Venue 01" : "Venue 02"}</div>
      <h1>${title}</h1>
      <p class="lede">${lede}</p>
      <div class="toolbar" data-venue="${venue}">
        <input class="search" type="search" placeholder="Search behaviours, participants, tools…" />
        ${productSet.map((p) => `<button class="chip on" data-product="${p}">${p}</button>`).join("")}
        <button class="sev on" data-sev="critical">Critical</button>
        <button class="sev on" data-sev="high">High</button>
        <button class="sev on" data-sev="elevated">Elevated</button>
      </div>
      <div class="grid" id="catalogue">${pack.map(card).join("")}</div>`;
  }

  function bindCatalogue(venue) {
    const pack = venue === "cfd" ? TRN.cfd : TRN.crypto;
    const root = document.querySelector(".toolbar");
    const grid = document.getElementById("catalogue");
    const search = root.querySelector(".search");

    function selected(sel) {
      return [...root.querySelectorAll(sel + ".on")].map((b) => b.dataset.product || b.dataset.sev);
    }

    function render() {
      const q = search.value.trim().toLowerCase();
      const products = selected(".chip");
      const sevs = selected(".sev");
      const rows = pack.filter((p) => {
        const hitProduct = p.products.some((x) => products.includes(x));
        const hitSev = sevs.includes(p.severity);
        const blob = [p.name, p.summary, p.why, p.code, ...p.participants.map((x) => x.role)].join(" ").toLowerCase();
        const hitQ = !q || blob.includes(q);
        return hitProduct && hitSev && hitQ;
      });
      grid.innerHTML = rows.length ? rows.map(card).join("") : `<p class="empty">No dossiers match those filters.</p>`;
    }

    root.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      btn.classList.toggle("on");
      render();
    });
    search.addEventListener("input", render);
  }

  function dossier(p) {
    const venueLabel = p.venue === "cfd" ? "CFD broker" : "Crypto exchange";
    const back = p.venue === "cfd" ? "#/cfd" : "#/crypto";
    return `
      <a class="back" href="${back}">← ${venueLabel}</a>
      <div class="dossier">
        <div class="dossier-head">
          <div>
            <div class="kicker">${esc(p.code)} · ${esc(p.venue)}</div>
            <h1>${esc(p.name)}</h1>
            <p class="lede">${esc(p.summary)}</p>
            ${chips(p.products)}
          </div>
          <span class="badge ${p.severity}">${esc(p.severity)}</span>
        </div>
        <section class="section">
          <h3>Why this works on this venue</h3>
          <p>${esc(p.why)}</p>
        </section>
        <section class="section">
          <h3>Workflow flowchart</h3>
          ${flowchart(p)}
        </section>
        <section class="section">
          <h3>Participants and incentives</h3>
          <div class="people">
            ${p.participants.map((x) => `<div class="person"><b>${esc(x.role)}</b><span>${esc(x.incentive)}</span></div>`).join("")}
          </div>
        </section>
        <section class="section">
          <h3>Detection and monitoring</h3>
          <p class="lede" style="font-size:15px">Tools: ${p.detection.tools.map(esc).join(" · ")}</p>
          <div class="matrix">
            <table>
              <thead>
                <tr><th>Metric</th><th>Window</th><th>Warn</th><th>Breach</th><th>Notes</th></tr>
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
          <h3>Escalation path</h3>
          <div class="escalation">
            ${p.escalation.map((e) => `
              <div class="esc">
                <div class="lvl">${esc(e.lvl)}<br>${esc(e.when)}</div>
                <div><b>${esc(e.who)}</b> — ${esc(e.action)}</div>
              </div>`).join("")}
          </div>
        </section>
        <section class="section">
          <h3>Countermeasures by event severity</h3>
          <p class="lede" style="font-size:15px">Standing controls stay on. Elevated fires at warn. High fires at confirmed breach. Critical fires when the engine itself is doing harm (bad mark, cascade, missing reserves).</p>
          ${measureList(p.id, p.countermeasures)}
        </section>
      </div>`;
  }

  function stack() {
    return `
      <div class="kicker">Tooling</div>
      <h1>Detection stack</h1>
      <p class="lede">${esc(TRN.stack.intro)}</p>
      <div class="two" style="margin-top:28px">
        ${TRN.stack.layers.map((l) => `
          <article class="tool">
            <div class="fit">${esc(l.fit)}</div>
            <h3>${esc(l.name)}</h3>
            <ul class="list">${l.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>
          </article>`).join("")}
      </div>
      <section class="section" style="margin-top:16px">
        <h3>Parameter discipline</h3>
        <ul class="list">
          <li>Every warn/breach pair in the dossiers is a <em>starting prior</em>. Fit on two quiet weeks and one stressed week. If your false-positive rate at L1 is above ~30%, you will train analysts to ignore the tape.</li>
          <li>Always join a news/unlock/econ calendar before L2. The same impulse is ignition on a blank tape and legitimate on NFP.</li>
          <li>Run OTR, self-match, and funding-share on the beneficial-owner graph, not the login.</li>
          <li>Marks and last-look clocks are first-class instruments. If they are wrong, every downstream alert is theatre.</li>
        </ul>
      </section>`;
  }

  function escalation() {
    return `
      <div class="kicker">Operating model</div>
      <h1>Escalation ladder</h1>
      <p class="lede">${esc(TRN.escalationHub.intro)}</p>
      <div class="matrix" style="margin:24px 0">
        <table>
          <thead>
            <tr><th>Level</th><th>SLA</th><th>Owner</th><th>CFD broker</th><th>Crypto exchange</th></tr>
          </thead>
          <tbody>
            ${TRN.escalationHub.steps.map((s) => `
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
        <h3>Comms and evidence</h3>
        <ul class="list">${TRN.escalationHub.comms.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>
      </section>
      <p class="note">If a mark is bad, freeze liquidations before you finish the case narrative. Equity you wipe on a single-venue smash is rarely recoverable in the time it takes to write a tidy L3 memo.</p>`;
  }

  function responseMap() {
    const all = allPlaybooks().flatMap((p) => measuresFor(p.id, p.countermeasures).map((m) => ({ ...m, id: p.id, code: p.code, name: p.name, dossier: p.severity })));
    const bands = (window.TRN_SEVERITY || []).map((s) => `
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
          <h3>${esc(sev)} · ${rows.length} controls</h3>
          <div class="matrix">
            <table>
              <thead><tr><th>Dossier</th><th>Trigger</th><th>Owner</th><th>Event that fires it</th><th>Countermeasure</th></tr></thead>
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
      <div class="kicker">Containment</div>
      <h1>Countermeasure map</h1>
      <p class="lede">Map every control to the severity of the event that should fire it. Standing stays on. Elevated is warn. High is breach. Critical is cascade — freeze the engine, then write the file.</p>
      <div class="sev-bands">${bands}</div>
      ${tables}`;
  }

  function render() {
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
      app.innerHTML = p ? dossier(p) : `<p class="empty">Unknown dossier.</p><p><a class="back" href="#/">Back to command</a></p>`;
      window.scrollTo(0, 0);
      return;
    }
    app.innerHTML = home();
  }

  window.addEventListener("hashchange", render);
  render();
})();
