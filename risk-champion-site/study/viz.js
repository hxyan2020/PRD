/* Extensive interactive diagrams for courseware (pure SVG/DOM). */
(function () {
  const NS = "http://www.w3.org/2000/svg";

  function el(tag, attrs = {}, text) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "className") node.className = v;
      else if (k === "html") node.innerHTML = v;
      else node.setAttribute(k, v);
    }
    if (text != null) node.textContent = text;
    return node;
  }

  function svgEl(tag, attrs = {}, text) {
    const node = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
    if (text != null) node.textContent = text;
    return node;
  }

  function shell(title, subtitle) {
    const root = el("section", { className: "viz-panel" });
    root.appendChild(el("p", { className: "viz-kicker" }, "Interactive diagram"));
    root.appendChild(el("h4", { className: "viz-title" }, title));
    if (subtitle) root.appendChild(el("p", { className: "viz-sub" }, subtitle));
    const body = el("div", { className: "viz-body" });
    root.appendChild(body);
    const read = el("p", { className: "viz-readout" }, "");
    root.appendChild(read);
    return { root, body, read };
  }

  function slider(label, min, max, step, value, onChange) {
    const wrap = el("label", { className: "viz-slider" });
    const name = el("span", {}, label);
    const input = el("input", { type: "range", min, max, step, value });
    const val = el("span", { className: "viz-slider-val" }, String(value));
    input.addEventListener("input", () => {
      val.textContent = input.value;
      onChange(Number(input.value));
    });
    wrap.append(name, input, val);
    return wrap;
  }

  function clearSvg(svg) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
  }

  function axes(svg, x0, y0, w, h) {
    svg.appendChild(svgEl("line", { x1: x0, y1: y0, x2: x0 + w, y2: y0, stroke: "#8aa39a", "stroke-width": 1 }));
    svg.appendChild(svgEl("line", { x1: x0, y1: y0, x2: x0, y2: y0 - h, stroke: "#8aa39a", "stroke-width": 1 }));
  }

  function pathLine(svg, arr, x0, y0, w, h, ymin, ymax, stroke, width = 2, dash) {
    const d = arr
      .map((y, i) => {
        const x = x0 + (i / Math.max(1, arr.length - 1)) * w;
        const yy = y0 - ((y - ymin) / (ymax - ymin || 1)) * h;
        return `${i ? "L" : "M"}${x.toFixed(1)},${yy.toFixed(1)}`;
      })
      .join(" ");
    const p = svgEl("path", { d, fill: "none", stroke, "stroke-width": width });
    if (dash) p.setAttribute("stroke-dasharray", dash);
    svg.appendChild(p);
  }

  function erf(x) {
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    const a1 = 0.254829592,
      a2 = -0.284496736,
      a3 = 1.421413741,
      a4 = -1.453152027,
      a5 = 1.061405429,
      p = 0.3275911;
    const t = 1 / (1 + p * x);
    const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return sign * y;
  }
  const Ncdf = (x) => 0.5 * (1 + erf(x / Math.SQRT2));
  const npdf = (x) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);

  function bs(S, K, r, sigma, T) {
    const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);
    return {
      price: S * Ncdf(d1) - K * Math.exp(-r * T) * Ncdf(d2),
      delta: Ncdf(d1),
      gamma: npdf(d1) / (S * sigma * Math.sqrt(T)),
      vega: S * npdf(d1) * Math.sqrt(T),
    };
  }

  function mulberry(seed) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }
  function gauss(rnd) {
    const u1 = Math.max(rnd(), 1e-12);
    const u2 = rnd();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  /* ---------- diagram builders ---------- */

  function diagramPayoff(host) {
    const { root, body, read } = shell("Call payoff vs Black–Scholes value", "Drag spot and vol. Dashed = expiry payoff; solid = BS mid.");
    const controls = el("div", { className: "viz-controls" });
    const svg = svgEl("svg", { viewBox: "0 0 360 200", class: "viz-svg" });
    body.append(controls, svg);
    let S = 100,
      sigma = 0.2,
      T = 0.5;
    const K = 100,
      r = 0.02;
    function draw() {
      clearSvg(svg);
      const spots = Array.from({ length: 61 }, (_, i) => 60 + i * 1.5);
      const pay = spots.map((s) => Math.max(s - K, 0));
      const val = spots.map((s) => bs(s, K, r, sigma, T).price);
      const ymax = Math.max(...pay, ...val, 1) * 1.1;
      axes(svg, 36, 170, 300, 140);
      pathLine(svg, pay, 36, 170, 300, 140, 0, ymax, "#0c5f4e", 2, "5 4");
      pathLine(svg, val, 36, 170, 300, 140, 0, ymax, "#c45c26");
      const sx = 36 + ((S - 60) / 90) * 300;
      svg.appendChild(svgEl("line", { x1: sx, y1: 170, x2: sx, y2: 30, stroke: "#1a3c34", "stroke-dasharray": "2 3" }));
      const g = bs(S, K, r, sigma, T);
      read.textContent = `S=${S} σ=${(sigma * 100).toFixed(0)}% T=${T}y → price ${g.price.toFixed(2)}  Δ ${g.delta.toFixed(3)}  Γ ${g.gamma.toFixed(4)}`;
    }
    controls.append(
      slider("Spot", 70, 140, 1, S, (v) => {
        S = v;
        draw();
      }),
      slider("Vol %", 5, 60, 1, sigma * 100, (v) => {
        sigma = v / 100;
        draw();
      }),
      slider("Tenor y", 0.05, 2, 0.05, T, (v) => {
        T = v;
        draw();
      })
    );
    draw();
    host.appendChild(root);
  }

  function diagramGreeks(host) {
    const { root, body, read } = shell("Greeks as you move spot", "Delta / gamma / vega vs spot for a fixed option.");
    const controls = el("div", { className: "viz-controls" });
    const svg = svgEl("svg", { viewBox: "0 0 360 200", class: "viz-svg" });
    body.append(controls, svg);
    let sigma = 0.2;
    function draw() {
      clearSvg(svg);
      const spots = Array.from({ length: 61 }, (_, i) => 60 + i * 1.5);
      const deltas = spots.map((s) => bs(s, 100, 0.02, sigma, 0.5).delta);
      const vegas = spots.map((s) => bs(s, 100, 0.02, sigma, 0.5).vega / 40);
      axes(svg, 36, 170, 300, 140);
      pathLine(svg, deltas, 36, 170, 300, 140, 0, 1, "#0c5f4e");
      pathLine(svg, vegas, 36, 170, 300, 140, 0, 1, "#c45c26");
      svg.appendChild(svgEl("text", { x: 36, y: 18, fill: "#1a3c34", "font-size": 11 }, "Teal Δ · Orange vega (scaled)"));
      read.textContent = `σ=${(sigma * 100).toFixed(0)}% · ATM Δ≈${bs(100, 100, 0.02, sigma, 0.5).delta.toFixed(3)}`;
    }
    controls.append(
      slider("Vol %", 5, 60, 1, 20, (v) => {
        sigma = v / 100;
        draw();
      })
    );
    draw();
    host.appendChild(root);
  }

  function diagramEwma(host) {
    const { root, body, read } = shell("Realized vol vs EWMA", "λ closer to 1 = slower reaction.");
    const controls = el("div", { className: "viz-controls" });
    const svg = svgEl("svg", { viewBox: "0 0 360 200", class: "viz-svg" });
    body.append(controls, svg);
    let lam = 0.94;
    const rnd = mulberry(2);
    const rets = Array.from({ length: 60 }, () => (rnd() * 2 - 1) * 0.012);
    function draw() {
      clearSvg(svg);
      const realized = [],
        ewma = [];
      let e = 0;
      for (let t = 19; t < 60; t++) {
        const win = rets.slice(t - 19, t + 1);
        const m = win.reduce((a, b) => a + b, 0) / win.length;
        const svar = win.reduce((a, b) => a + (b - m) ** 2, 0) / (win.length - 1);
        realized.push(Math.sqrt(svar * 252));
        if (t === 19) e = svar;
        else e = lam * e + (1 - lam) * rets[t] ** 2;
        ewma.push(Math.sqrt(e * 252));
      }
      const ymax = Math.max(...realized, ...ewma) * 1.15;
      axes(svg, 36, 170, 300, 140);
      pathLine(svg, realized, 36, 170, 300, 140, 0, ymax, "#0c5f4e");
      pathLine(svg, ewma, 36, 170, 300, 140, 0, ymax, "#c45c26");
      read.textContent = `λ=${lam.toFixed(2)} · last realized ${(realized.at(-1) * 100).toFixed(1)}% · EWMA ${(ewma.at(-1) * 100).toFixed(1)}%`;
    }
    controls.append(
      slider("λ×100", 80, 99, 1, 94, (v) => {
        lam = v / 100;
        draw();
      })
    );
    draw();
    host.appendChild(root);
  }

  function diagramBasis(host) {
    const { root, body, read } = shell("Futures basis = F − S", "Positive basis: future rich to spot. Hedge residual is basis risk.");
    const controls = el("div", { className: "viz-controls" });
    const svg = svgEl("svg", { viewBox: "0 0 360 180", class: "viz-svg" });
    body.append(controls, svg);
    let S = 100,
      basis = 1.2;
    function draw() {
      clearSvg(svg);
      const F = S + basis;
      const maxV = Math.max(S, F) * 1.15;
      const bar = (y, v, label, fill) => {
        const w = (v / maxV) * 280;
        svg.appendChild(svgEl("rect", { x: 40, y, width: w, height: 34, rx: 6, fill }));
        svg.appendChild(svgEl("text", { x: 48, y: y + 22, fill: "#fff", "font-size": 12 }, `${label} ${v.toFixed(2)}`));
      };
      bar(40, S, "Spot", "#0c5f4e");
      bar(90, F, "Future", "#c45c26");
      read.textContent = `Basis F−S = ${basis.toFixed(2)} (${basis >= 0 ? "contango-ish" : "backwardation-ish"}). Hedge ‘flat’ still owns this residual.`;
    }
    controls.append(
      slider("Spot", 80, 120, 1, S, (v) => {
        S = v;
        draw();
      }),
      slider("Basis", -5, 5, 0.1, basis, (v) => {
        basis = v;
        draw();
      })
    );
    draw();
    host.appendChild(root);
  }

  function diagramMargin(host) {
    const { root, body, read } = shell("Equity vs maintenance · liquidation buffer", "Buffer ≤ 0 is the liquidation zone.");
    const controls = el("div", { className: "viz-controls" });
    const svg = svgEl("svg", { viewBox: "0 0 360 190", class: "viz-svg" });
    body.append(controls, svg);
    let E = 100,
      N = 500,
      m = 0.02;
    function draw() {
      clearSvg(svg);
      const maint = m * N;
      const buffer = E - maint;
      const maxV = Math.max(E, maint) * 1.3;
      svg.appendChild(svgEl("rect", { x: 40, y: 50, width: (E / maxV) * 280, height: 32, rx: 6, fill: "#0c5f4e" }));
      svg.appendChild(svgEl("text", { x: 48, y: 70, fill: "#fff", "font-size": 12 }, `Equity ${E}`));
      svg.appendChild(svgEl("rect", { x: 40, y: 100, width: (maint / maxV) * 280, height: 32, rx: 6, fill: "#c45c26" }));
      svg.appendChild(svgEl("text", { x: 48, y: 120, fill: "#fff", "font-size": 12 }, `Maint ${maint.toFixed(1)}`));
      read.textContent = `Buffer ${buffer.toFixed(1)} · ratio ${((E / N) * 100).toFixed(1)}% · liq move ≈ ${(((E - maint) / N) * 100).toFixed(2)}%`;
    }
    controls.append(
      slider("Equity", 20, 200, 1, E, (v) => {
        E = v;
        draw();
      }),
      slider("Notional", 200, 1000, 10, N, (v) => {
        N = v;
        draw();
      }),
      slider("MMR %", 1, 10, 0.5, m * 100, (v) => {
        m = v / 100;
        draw();
      })
    );
    draw();
    host.appendChild(root);
  }

  function diagramThreshold(host) {
    const { root, body, read } = shell("Alert volume vs missed-loss tradeoff", "Wider threshold cuts fatigue; missed loss rises.");
    const controls = el("div", { className: "viz-controls" });
    const svg = svgEl("svg", { viewBox: "0 0 360 200", class: "viz-svg" });
    body.append(controls, svg);
    let thr = 4;
    const model = (t) => {
      const alerts = Math.max(10, Math.round(180 * Math.exp(-18 * (t / 100))));
      const trueEv = 16;
      return { alerts, fp: Math.max(0, (alerts - trueEv) / alerts), missed: Math.round(40000 * Math.pow(t / 3, 1.4)) };
    };
    function draw() {
      clearSvg(svg);
      const pts = [];
      for (let t = 2; t <= 8; t += 0.25) pts.push({ t, ...model(t) });
      axes(svg, 40, 170, 290, 130);
      pathLine(
        svg,
        pts.map((p) => p.alerts),
        40,
        170,
        290,
        130,
        0,
        Math.max(...pts.map((p) => p.alerts)),
        "#0c5f4e"
      );
      pathLine(
        svg,
        pts.map((p) => p.missed),
        40,
        170,
        290,
        130,
        0,
        Math.max(...pts.map((p) => p.missed)),
        "#c45c26"
      );
      const cx = 40 + ((thr - 2) / 6) * 290;
      svg.appendChild(svgEl("line", { x1: cx, y1: 170, x2: cx, y2: 40, stroke: "#1a3c34", "stroke-dasharray": "3 3" }));
      const cur = model(thr);
      read.textContent = `${thr.toFixed(1)}% → alerts≈${cur.alerts}  FP≈${(cur.fp * 100).toFixed(0)}%  missed≈$${cur.missed.toLocaleString()}`;
    }
    controls.append(
      slider("Threshold %", 2, 8, 0.1, thr, (v) => {
        thr = v;
        draw();
      })
    );
    draw();
    host.appendChild(root);
  }

  function diagramFlow(host, title, subtitle, stages, note) {
    const { root, body, read } = shell(title, subtitle);
    const svg = svgEl("svg", { viewBox: "0 0 360 120", class: "viz-svg viz-flow" });
    body.appendChild(svg);
    const n = stages.length;
    const boxW = Math.min(72, (320 - (n - 1) * 14) / n);
    const markerId = "a-" + Math.random().toString(36).slice(2, 7);
    let active = 0;
    function draw() {
      clearSvg(svg);
      const defs = svgEl("defs");
      const marker = svgEl("marker", { id: markerId, markerWidth: 6, markerHeight: 6, refX: 5, refY: 3, orient: "auto" });
      marker.appendChild(svgEl("path", { d: "M0,0 L6,3 L0,6 Z", fill: "#0c5f4e" }));
      defs.appendChild(marker);
      svg.appendChild(defs);
      stages.forEach((label, i) => {
        const x = 14 + i * (boxW + 14);
        const y = 34;
        const r = svgEl("rect", {
          x,
          y,
          width: boxW,
          height: 48,
          rx: 8,
          fill: i === active ? "#0c5f4e" : "#e7efeb",
          stroke: "#0c5f4e",
          style: "cursor:pointer",
        });
        r.addEventListener("click", () => {
          active = i;
          draw();
        });
        svg.appendChild(r);
        label.split(" ").forEach((w, wi) => {
          svg.appendChild(
            svgEl(
              "text",
              {
                x: x + boxW / 2,
                y: y + 20 + wi * 12,
                fill: i === active ? "#fff" : "#1a3c34",
                "font-size": 10,
                "text-anchor": "middle",
                style: "pointer-events:none",
              },
              w
            )
          );
        });
        if (i < n - 1) {
          svg.appendChild(
            svgEl("line", {
              x1: x + boxW,
              y1: y + 24,
              x2: x + boxW + 14,
              y2: y + 24,
              stroke: "#0c5f4e",
              "stroke-width": 2,
              "marker-end": `url(#${markerId})`,
            })
          );
        }
      });
      read.textContent = `${note} · Focus: ${stages[active]}`;
    }
    draw();
    host.appendChild(root);
  }

  function diagramVar(host) {
    const { root, body, read } = shell("Loss histogram & VaR cut", "Orange line = historical VaR on −P&L.");
    const controls = el("div", { className: "viz-controls" });
    const svg = svgEl("svg", { viewBox: "0 0 360 200", class: "viz-svg" });
    body.append(controls, svg);
    let conf = 99;
    const rnd = mulberry(7);
    const losses = Array.from({ length: 500 }, () => -gauss(rnd) * 1.2).sort((a, b) => a - b);
    function draw() {
      clearSvg(svg);
      const idx = Math.min(losses.length - 1, Math.floor((conf / 100) * (losses.length - 1)));
      const varEst = losses[idx];
      const bins = 24,
        minL = losses[0],
        maxL = losses[losses.length - 1];
      const counts = Array(bins).fill(0);
      losses.forEach((v) => {
        counts[Math.min(bins - 1, Math.floor(((v - minL) / (maxL - minL + 1e-9)) * bins))]++;
      });
      const maxC = Math.max(...counts);
      counts.forEach((c, i) => {
        const bw = 310 / bins;
        svg.appendChild(svgEl("rect", { x: 30 + i * bw, y: 170 - (c / maxC) * 140, width: bw - 1, height: (c / maxC) * 140, fill: "#0c5f4e", opacity: 0.75 }));
      });
      const vx = 30 + ((varEst - minL) / (maxL - minL)) * 310;
      svg.appendChild(svgEl("line", { x1: vx, y1: 170, x2: vx, y2: 30, stroke: "#c45c26", "stroke-width": 2 }));
      read.textContent = `${conf}% historical VaR ≈ ${varEst.toFixed(3)}`;
    }
    controls.append(
      slider("Confidence %", 90, 99.5, 0.5, conf, (v) => {
        conf = v;
        draw();
      })
    );
    draw();
    host.appendChild(root);
  }

  function diagramEs(host) {
    const { root, body, read } = shell("VaR vs expected shortfall", "ES averages the tail beyond VaR.");
    const controls = el("div", { className: "viz-controls" });
    const svg = svgEl("svg", { viewBox: "0 0 360 160", class: "viz-svg" });
    body.append(controls, svg);
    let conf = 97.5;
    const rnd = mulberry(13);
    const losses = Array.from({ length: 800 }, () => Math.abs(gauss(rnd)) * 1.1).sort((a, b) => a - b);
    function draw() {
      clearSvg(svg);
      const idx = Math.floor((conf / 100) * (losses.length - 1));
      const varEst = losses[idx];
      const tail = losses.slice(idx);
      const es = tail.reduce((a, b) => a + b, 0) / tail.length;
      const maxV = Math.max(varEst, es) * 1.25;
      svg.appendChild(svgEl("rect", { x: 50, y: 40, width: (varEst / maxV) * 280, height: 32, rx: 6, fill: "#0c5f4e" }));
      svg.appendChild(svgEl("text", { x: 58, y: 60, fill: "#fff", "font-size": 12 }, `VaR ${varEst.toFixed(3)}`));
      svg.appendChild(svgEl("rect", { x: 50, y: 90, width: (es / maxV) * 280, height: 32, rx: 6, fill: "#c45c26" }));
      svg.appendChild(svgEl("text", { x: 58, y: 110, fill: "#fff", "font-size": 12 }, `ES ${es.toFixed(3)}`));
      read.textContent = `At ${conf}%: ES−VaR=${(es - varEst).toFixed(3)} · tail n=${tail.length}`;
    }
    controls.append(
      slider("Level %", 95, 99.5, 0.5, conf, (v) => {
        conf = v;
        draw();
      })
    );
    draw();
    host.appendChild(root);
  }

  function diagramTraffic(host) {
    const { root, body, read } = shell("Kupiec-style traffic light", "Drag exceptions in 250 days at 99% VaR.");
    const controls = el("div", { className: "viz-controls" });
    const svg = svgEl("svg", { viewBox: "0 0 360 140", class: "viz-svg" });
    body.append(controls, svg);
    let exc = 4;
    function zone(e) {
      if (e <= 4) return ["green", "#0c5f4e", "Zone green — no automatic reject"];
      if (e <= 9) return ["amber", "#c45c26", "Zone amber — investigate model"];
      return ["red", "#b42318", "Zone red — model under challenge"];
    }
    function draw() {
      clearSvg(svg);
      const [name, color, msg] = zone(exc);
      svg.appendChild(svgEl("circle", { cx: 180, cy: 58, r: 36, fill: color }));
      svg.appendChild(svgEl("text", { x: 180, y: 64, fill: "#fff", "font-size": 14, "text-anchor": "middle", "font-weight": 700 }, name.toUpperCase()));
      read.textContent = `${exc} exceptions / 250d @99% · ${msg}`;
    }
    controls.append(
      slider("Exceptions", 0, 15, 1, exc, (v) => {
        exc = v;
        draw();
      })
    );
    draw();
    host.appendChild(root);
  }

  function diagramGarch(host) {
    const { root, body, read } = shell("EWMA vs GARCH(1,1) vol path", "GARCH mean-reverts to a long-run level; EWMA does not.");
    const controls = el("div", { className: "viz-controls" });
    const svg = svgEl("svg", { viewBox: "0 0 360 200", class: "viz-svg" });
    body.append(controls, svg);
    let omega = 0.00001;
    const rnd = mulberry(14);
    const rets = Array.from({ length: 80 }, () => gauss(rnd) * 0.01);
    function draw() {
      clearSvg(svg);
      let e = 0.00015,
        g = 0.00015;
      const ewma = [],
        garch = [];
      const a = 0.08,
        b = 0.9;
      for (let t = 0; t < rets.length; t++) {
        e = 0.94 * e + 0.06 * rets[t] ** 2;
        g = omega + a * rets[t] ** 2 + b * g;
        ewma.push(Math.sqrt(e * 252));
        garch.push(Math.sqrt(g * 252));
      }
      const ymax = Math.max(...ewma, ...garch) * 1.15;
      axes(svg, 36, 170, 300, 140);
      pathLine(svg, ewma, 36, 170, 300, 140, 0, ymax, "#0c5f4e");
      pathLine(svg, garch, 36, 170, 300, 140, 0, ymax, "#c45c26");
      read.textContent = `ω=${omega.toExponential(1)} · last EWMA ${(ewma.at(-1) * 100).toFixed(1)}% · GARCH ${(garch.at(-1) * 100).toFixed(1)}%`;
    }
    controls.append(
      slider("ω×1e6", 1, 50, 1, 10, (v) => {
        omega = v / 1e6;
        draw();
      })
    );
    draw();
    host.appendChild(root);
  }

  function diagramFactor(host) {
    const { root, body, read } = shell("Factor risk budget (interactive)", "Drag sleeve weights. Budget = contribution to variance story.");
    const controls = el("div", { className: "viz-controls" });
    const svg = svgEl("svg", { viewBox: "0 0 360 170", class: "viz-svg" });
    body.append(controls, svg);
    let eq = 50,
      rates = 30,
      crypto = 20;
    function draw() {
      clearSvg(svg);
      const vols = { eq: 0.16, rates: 0.08, crypto: 0.55 };
      const w = { eq: eq / 100, rates: rates / 100, crypto: crypto / 100 };
      const risk = {
        eq: w.eq * vols.eq,
        rates: w.rates * vols.rates,
        crypto: w.crypto * vols.crypto,
      };
      const total = risk.eq + risk.rates + risk.crypto;
      const colors = { eq: "#0c5f4e", rates: "#2a6f97", crypto: "#c45c26" };
      let x = 40;
      Object.entries(risk).forEach(([k, v]) => {
        const bw = (v / total) * 280;
        svg.appendChild(svgEl("rect", { x, y: 55, width: bw, height: 44, fill: colors[k] }));
        if (bw > 36) svg.appendChild(svgEl("text", { x: x + 6, y: 82, fill: "#fff", "font-size": 11 }, k));
        x += bw;
      });
      read.textContent = `Risk share — eq ${((risk.eq / total) * 100).toFixed(0)}% · rates ${((risk.rates / total) * 100).toFixed(0)}% · crypto ${((risk.crypto / total) * 100).toFixed(0)}%`;
    }
    controls.append(
      slider("Equity w%", 0, 80, 1, eq, (v) => {
        eq = v;
        draw();
      }),
      slider("Rates w%", 0, 80, 1, rates, (v) => {
        rates = v;
        draw();
      }),
      slider("Crypto w%", 0, 80, 1, crypto, (v) => {
        crypto = v;
        draw();
      })
    );
    draw();
    host.appendChild(root);
  }

  function diagramMc(host) {
    const { root, body, read } = shell("Monte Carlo P&L fan", "Path count changes the 95% loss estimate.");
    const controls = el("div", { className: "viz-controls" });
    const svg = svgEl("svg", { viewBox: "0 0 360 200", class: "viz-svg" });
    body.append(controls, svg);
    let nPaths = 200;
    const steps = 20;
    function draw() {
      clearSvg(svg);
      const rnd = mulberry(15);
      const term = [];
      for (let p = 0; p < nPaths; p++) {
        let x = 0;
        let d = "";
        for (let t = 0; t <= steps; t++) {
          if (t) x += gauss(rnd) * 0.8;
          const px = 30 + (t / steps) * 300;
          const py = 100 - x * 3;
          d += `${t ? "L" : "M"}${px.toFixed(1)},${py.toFixed(1)}`;
        }
        if (p < 40) {
          svg.appendChild(svgEl("path", { d, fill: "none", stroke: "#0c5f4e", "stroke-width": 1, opacity: 0.28 }));
        }
        term.push(-x);
      }
      term.sort((a, b) => a - b);
      const q95 = term[Math.floor(0.95 * (term.length - 1))];
      read.textContent = `${nPaths} paths · 95% loss ≈ ${q95.toFixed(2)} · mean loss ${(term.reduce((a, b) => a + b, 0) / term.length).toFixed(2)}`;
    }
    controls.append(
      slider("Paths", 50, 500, 10, nPaths, (v) => {
        nPaths = v;
        draw();
      })
    );
    draw();
    host.appendChild(root);
  }

  function diagramPr(host) {
    const { root, body, read } = shell("Precision–recall tradeoff", "Aim recall ≥ 0.80; read precision at that point.");
    const controls = el("div", { className: "viz-controls" });
    const svg = svgEl("svg", { viewBox: "0 0 360 180", class: "viz-svg" });
    body.append(controls, svg);
    let thr = 0.45;
    const rnd = mulberry(17);
    const rows = Array.from({ length: 200 }, () => {
      const y = rnd() < 0.25 ? 1 : 0;
      return { y, score: y ? 0.55 + rnd() * 0.45 : rnd() * 0.7 };
    });
    function metrics(t) {
      let tp = 0,
        fp = 0,
        fn = 0;
      rows.forEach((r) => {
        const p = r.score >= t ? 1 : 0;
        if (p && r.y) tp++;
        else if (p && !r.y) fp++;
        else if (!p && r.y) fn++;
      });
      return { prec: tp / Math.max(1, tp + fp), rec: tp / Math.max(1, tp + fn) };
    }
    function draw() {
      clearSvg(svg);
      axes(svg, 40, 150, 280, 120);
      const curve = [];
      for (let t = 0; t <= 1.001; t += 0.05) curve.push(metrics(t));
      const d = curve
        .map((c, i) => {
          const x = 40 + c.rec * 280;
          const y = 150 - c.prec * 120;
          return `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" ");
      svg.appendChild(svgEl("path", { d, fill: "none", stroke: "#0c5f4e", "stroke-width": 2 }));
      svg.appendChild(svgEl("line", { x1: 40 + 0.8 * 280, y1: 150, x2: 40 + 0.8 * 280, y2: 30, stroke: "#1a3c34", "stroke-dasharray": "3 3" }));
      const m = metrics(thr);
      svg.appendChild(svgEl("circle", { cx: 40 + m.rec * 280, cy: 150 - m.prec * 120, r: 5, fill: "#c45c26" }));
      read.textContent = `thr=${thr.toFixed(2)} → precision=${m.prec.toFixed(3)} recall=${m.rec.toFixed(3)}`;
    }
    controls.append(
      slider("Score thr×100", 5, 95, 1, thr * 100, (v) => {
        thr = v / 100;
        draw();
      })
    );
    draw();
    host.appendChild(root);
  }

  function diagramShocks(host) {
    const { root, body, read } = shell("Four shocks · dominant sleeve", "Joint intensity — which sleeve owns the loss?");
    const controls = el("div", { className: "viz-controls" });
    const svg = svgEl("svg", { viewBox: "0 0 360 170", class: "viz-svg" });
    body.append(controls, svg);
    let shock = 1;
    const base = { rates: 12, credit: 18, liquidity: 9, crypto: 14 };
    const colors = { rates: "#0c5f4e", credit: "#c45c26", liquidity: "#2a6f97", crypto: "#7a4e9d" };
    function draw() {
      clearSvg(svg);
      const mult = { rates: 1 + 0.4 * shock, credit: 1 + 0.55 * shock, liquidity: 1 + 0.7 * shock, crypto: 1 + 0.85 * shock };
      const vals = Object.fromEntries(Object.entries(base).map(([k, v]) => [k, v * mult[k]]));
      const total = Object.values(vals).reduce((a, b) => a + b, 0);
      let x = 40;
      Object.entries(vals).forEach(([k, v]) => {
        const w = (v / total) * 280;
        svg.appendChild(svgEl("rect", { x, y: 50, width: w, height: 44, fill: colors[k] }));
        if (w > 42) svg.appendChild(svgEl("text", { x: x + 4, y: 76, fill: "#fff", "font-size": 10 }, k));
        x += w;
      });
      const dom = Object.entries(vals).sort((a, b) => b[1] - a[1])[0];
      read.textContent = `Shock ×${shock.toFixed(1)} · total ${total.toFixed(1)} · dominant ${dom[0]} (${((dom[1] / total) * 100).toFixed(0)}%)`;
    }
    controls.append(
      slider("Intensity", 0.5, 3, 0.1, shock, (v) => {
        shock = v;
        draw();
      })
    );
    draw();
    host.appendChild(root);
  }

  function diagramCorr(host) {
    const { root, body, read } = shell("2-asset correlation & portfolio vol", "Drag ρ. Diversification dies as ρ → 1.");
    const controls = el("div", { className: "viz-controls" });
    const svg = svgEl("svg", { viewBox: "0 0 360 170", class: "viz-svg" });
    body.append(controls, svg);
    let rho = 0.3;
    function draw() {
      clearSvg(svg);
      const s1 = 0.2,
        s2 = 0.25,
        w = 0.5;
      const pvol = Math.sqrt(w * w * s1 * s1 + w * w * s2 * s2 + 2 * w * w * rho * s1 * s2);
      const undiv = w * s1 + w * s2;
      svg.appendChild(svgEl("rect", { x: 40, y: 40, width: pvol * 600, height: 36, rx: 6, fill: "#0c5f4e" }));
      svg.appendChild(svgEl("text", { x: 48, y: 63, fill: "#fff", "font-size": 12 }, `Port vol ${(pvol * 100).toFixed(1)}%`));
      svg.appendChild(svgEl("rect", { x: 40, y: 95, width: undiv * 600, height: 28, rx: 6, fill: "#c45c26", opacity: 0.7 }));
      svg.appendChild(svgEl("text", { x: 48, y: 114, fill: "#fff", "font-size": 11 }, `No-div floor ${(undiv * 100).toFixed(1)}%`));
      read.textContent = `ρ=${rho.toFixed(2)} · diversification benefit ${((undiv - pvol) * 100).toFixed(1)} vol points`;
    }
    controls.append(
      slider("ρ×100", -80, 99, 1, rho * 100, (v) => {
        rho = v / 100;
        draw();
      })
    );
    draw();
    host.appendChild(root);
  }

  function diagramMetrics(host) {
    const { root, body, read } = shell("Metric dictionary — computable vs blocked", "Tap a row. Blocked metrics need a missing field.");
    const rows = [
      ["Alert precision", "computable", "TP / (TP+FP) from closed alerts"],
      ["Time-to-ack p95", "computable", "From page timestamp to ack"],
      ["Avoided loss $", "blocked", "Needs counterfactual loss model"],
      ["Trader trust score", "blocked", "Needs survey instrument + N"],
      ["Param change lead time", "computable", "Propose → effective_ts"],
      ["Shadow disagreement", "computable", "Shadow vs prod alert delta"],
    ];
    const list = el("div", { className: "viz-table" });
    let active = 0;
    function draw() {
      list.innerHTML = "";
      rows.forEach((r, i) => {
        const btn = el("button", { type: "button", className: "viz-row" + (i === active ? " is-on" : "") });
        btn.innerHTML = `<strong>${r[0]}</strong><span class="viz-pill ${r[1]}">${r[1]}</span>`;
        btn.addEventListener("click", () => {
          active = i;
          draw();
        });
        list.appendChild(btn);
      });
      read.textContent = rows[active][2];
    }
    body.appendChild(list);
    draw();
    host.appendChild(root);
  }

  function diagramReplay(host) {
    const { root, body, read } = shell("Replay before vs after a parameter change", "Drag the new concentration cap.");
    const controls = el("div", { className: "viz-controls" });
    const svg = svgEl("svg", { viewBox: "0 0 360 160", class: "viz-svg" });
    body.append(controls, svg);
    let cap = 18;
    const util = [12, 14, 16, 17, 19, 21, 15, 18, 22, 13, 20, 24, 11, 17, 19, 23, 14, 16, 25, 18];
    function draw() {
      clearSvg(svg);
      const before = util.filter((u) => u > 15).length;
      const after = util.filter((u) => u > cap).length;
      const max = Math.max(before, after, 1);
      svg.appendChild(svgEl("rect", { x: 60, y: 140 - (before / max) * 100, width: 80, height: (before / max) * 100, fill: "#c45c26" }));
      svg.appendChild(svgEl("rect", { x: 200, y: 140 - (after / max) * 100, width: 80, height: (after / max) * 100, fill: "#0c5f4e" }));
      svg.appendChild(svgEl("text", { x: 100, y: 155, "text-anchor": "middle", fill: "#1a3c34", "font-size": 11 }, `Before@15% (${before})`));
      svg.appendChild(svgEl("text", { x: 240, y: 155, "text-anchor": "middle", fill: "#1a3c34", "font-size": 11 }, `After@${cap}% (${after})`));
      read.textContent = `Alert count ${before} → ${after}. Pass rule: document seed=42 and util vector.`;
    }
    controls.append(
      slider("New cap %", 12, 25, 1, cap, (v) => {
        cap = v;
        draw();
      })
    );
    draw();
    host.appendChild(root);
  }

  function diagramEval(host) {
    const { root, body, read } = shell("Eval scoreboard (15 questions)", "Drag passes. Gate is 12/15.");
    const controls = el("div", { className: "viz-controls" });
    const svg = svgEl("svg", { viewBox: "0 0 360 120", class: "viz-svg" });
    body.append(controls, svg);
    let pass = 12;
    function draw() {
      clearSvg(svg);
      for (let i = 0; i < 15; i++) {
        const x = 24 + i * 22;
        svg.appendChild(svgEl("rect", { x, y: 40, width: 18, height: 36, rx: 4, fill: i < pass ? "#0c5f4e" : "#d7ddd9" }));
      }
      svg.appendChild(svgEl("line", { x1: 24 + 12 * 22, y1: 30, x2: 24 + 12 * 22, y2: 90, stroke: "#c45c26", "stroke-dasharray": "3 3" }));
      read.textContent = `${pass}/15 ${pass >= 12 ? "PASS gate" : "FAIL — rerun weak items"} · dashed = 12/15 line`;
    }
    controls.append(
      slider("Passes", 0, 15, 1, pass, (v) => {
        pass = v;
        draw();
      })
    );
    draw();
    host.appendChild(root);
  }

  function diagramHaircut(host) {
    const { root, body, read } = shell("Collateral haircut → effective equity", "Higher haircut shrinks borrowing power.");
    const controls = el("div", { className: "viz-controls" });
    const svg = svgEl("svg", { viewBox: "0 0 360 160", class: "viz-svg" });
    body.append(controls, svg);
    let cash = 40,
      mark = 60,
      h = 10;
    function draw() {
      clearSvg(svg);
      const adj = cash + (1 - h / 100) * mark;
      svg.appendChild(svgEl("rect", { x: 40, y: 40, width: cash * 2.5, height: 28, rx: 6, fill: "#0c5f4e" }));
      svg.appendChild(svgEl("rect", { x: 40 + cash * 2.5, y: 40, width: mark * 2.5, height: 28, rx: 6, fill: "#8aa39a" }));
      svg.appendChild(svgEl("rect", { x: 40, y: 90, width: adj * 2.5, height: 28, rx: 6, fill: "#c45c26" }));
      svg.appendChild(svgEl("text", { x: 48, y: 59, fill: "#fff", "font-size": 11 }, `Cash ${cash} + asset ${mark}`));
      svg.appendChild(svgEl("text", { x: 48, y: 109, fill: "#fff", "font-size": 11 }, `Adj equity ${adj.toFixed(1)}`));
      read.textContent = `Haircut ${h}% · haircut $ ${(mark * h) / 100} · adjEq ${adj.toFixed(1)}`;
    }
    controls.append(
      slider("Haircut %", 0, 40, 1, h, (v) => {
        h = v;
        draw();
      }),
      slider("Asset mark", 20, 100, 1, mark, (v) => {
        mark = v;
        draw();
      })
    );
    draw();
    host.appendChild(root);
  }

  /* ---------- week → slot catalog ---------- */
  // Each week lists diagrams shown after goal (index0), after each lesson, and lab (last reused if short).

  const FLOW = (title, stages, note) => (host) => diagramFlow(host, title, "Tap a stage to focus.", stages, note);

  const WEEK_DIAGRAMS = {
    1: [diagramPayoff, diagramPayoff, diagramGreeks, diagramPayoff],
    2: [diagramBasis, diagramBasis, diagramBasis, diagramEwma, diagramEwma],
    3: [diagramMargin, diagramMargin, diagramHaircut, diagramMargin],
    4: [diagramThreshold, diagramEs, diagramThreshold, FLOW("Finding → decision", ["Facts", "Options", "Ask", "Decide"], "End with one explicit decision request.")],
    5: [
      FLOW("Own one slice", ["Discover", "Non-goals", "Roadmap", "G/W/T", "Done"], "Cut scope in non-goals."),
      FLOW("Discovery", ["Users", "Pain", "Non-goals", "Tests"], "Acceptance tests strangers can grade."),
      FLOW("Roadmap page", ["Problem", "Scope", "Milestones", "Risks"], "One page, not a novel."),
      FLOW("Acceptance", ["Given", "When", "Then", "Evidence"], "Five tests minimum."),
    ],
    6: [diagramMetrics, diagramMetrics, diagramMetrics, diagramMetrics],
    7: [
      FLOW("Maker–checker", ["Draft", "Maker", "Checker", "Effective", "Audit"], "Rollback is a checked revert."),
      FLOW("Parameter change", ["Propose", "Review", "Approve", "Ship"], "Version id required."),
      FLOW("Dictionary row", ["Name", "Owner", "Unit", "Bounds", "Rollback"], "Eight rows in the lab."),
      FLOW("Approval", ["Maker", "Checker", "SoR write", "Notify"], "No dual-control, no prod."),
    ],
    8: [diagramReplay, diagramReplay, diagramReplay, diagramReplay],
    9: [
      FLOW("Tick → alert", ["Tick", "Position", "Metric", "Rule", "Alert", "Ack"], "correlation_id travels."),
      FLOW("REST limit", ["POST", "Idempotency", "200/409", "Audit"], "Limits as resources."),
      FLOW("Hot path", ["Ingest", "Enrich", "Decide", "Emit"], "Owner per box."),
      FLOW("JSON event", ["ids", "hash", "payload", "ts"], "Hashable inputs."),
    ],
    10: [
      FLOW("System of record", ["Positions", "Marks", "Params", "Decisions"], "Replay store ≠ SoR."),
      FLOW("Storage domains", ["Hot", "Warm", "Cold", "Audit"], "Name retention."),
      FLOW("Paging", ["Signal", "Threshold", "Owner", "Runbook"], "Five pages only."),
      FLOW("Observability", ["Metric", "Log", "Trace", "Page"], "Wake humans sparingly."),
    ],
    11: [
      FLOW("Ship with rollback", ["Test", "Review", "Stage", "Ship", "Watch", "Rollback"], "Config revert."),
      FLOW("Release plan", ["Summary", "Checks", "UAT", "Shadow"], "Three automated checks."),
      FLOW("Watch 48h", ["Input", "Pass/fail", "Owner", "Page"], "Two numbers for 48h."),
      FLOW("Rollback", ["Detect", "Decide", "Revert", "Verify"], "Minutes, not days."),
    ],
    12: [diagramVar, diagramVar, diagramVar, diagramCorr, diagramVar],
    13: [diagramEs, diagramEs, diagramTraffic, diagramEs],
    14: [diagramEwma, diagramEwma, diagramGarch, diagramFactor, diagramCorr],
    15: [diagramMc, diagramMc, diagramFactor, diagramMc, diagramMc],
    16: [
      FLOW("Validation pack", ["Data", "Assumptions", "Challenger", "Limits", "Owner"], "Page-1 for signers."),
      FLOW("SR 11-7 lenses", ["Concept", "Use", "Perf", "Gov"], "Own the VaR."),
      FLOW("Challenger", ["Primary", "Challenger", "Delta", "Explain"], "Divergence is a finding."),
      FLOW("Monitoring", ["Metric", "Threshold", "Owner", "Action"], "After go-live."),
    ],
    17: [diagramPr, diagramPr, diagramPr, diagramPr],
    18: [
      FLOW("Anomaly → close", ["Detect", "Rank", "Card", "Human", "Close"], "Structured close-out."),
      FLOW("MAD vs IF", ["Score", "Overlap", "Top-10", "Investigate"], "Unlabeled honesty."),
      FLOW("Investigation card", ["Why", "Evidence", "Decision", "Owner"], "No free text only."),
      FLOW("Human close", ["Ack", "Classify", "Action", "Learn"], "Model does not close risk."),
    ],
    19: [
      FLOW("RAG control loop", ["Index", "Retrieve", "Cite", "Answer", "Refuse"], "Citations are the control."),
      FLOW("Corpus", ["Memos 1–8", "Chunk", "Embed", "Store"], "No employer data."),
      FLOW("Citation", ["Hit", "Quote", "Week id", "Answer"], "Visible week id."),
      FLOW("Refusal", ["Check", "Refuse", "Log", "Escalate"], "Do-not-index list."),
    ],
    20: [
      FLOW("Agent cannot approve", ["Tools", "Draft", "Stop", "Human", "APPROVE"], "Three tools only."),
      FLOW("Tool schema", ["search", "compute_var", "draft"], "Least privilege."),
      FLOW("Injection defense", ["Input", "Boundary", "Refuse", "Trace"], "Excessive agency."),
      FLOW("Trace", ["Calls", "Args", "Result", "Stop"], "Audit log."),
    ],
    21: [diagramEval, diagramEval, diagramEval, diagramEval],
    22: [
      diagramHaircut,
      FLOW("Secured funding", ["Cash", "Repo", "Collateral", "Haircut", "Call"], "Who eats the loss?"),
      diagramHaircut,
      diagramHaircut,
      diagramMargin,
    ],
    23: [diagramShocks, diagramShocks, diagramShocks, FLOW("PM huddle", ["Facts", "Sleeve", "Options", "Ask"], "Decision request."), diagramShocks],
    24: [
      FLOW("Commercial note", ["User", "Buyer", "Hours", "Loss", "Adoption"], "Will-not-claim."),
      FLOW("User vs buyer", ["User pain", "Buyer budget", "Success", "Risk"], "Both named."),
      FLOW("Adoption", ["Activate", "Retain", "Deepen", "Expand"], "Not vanity launch."),
      FLOW("Will-not", ["Claim", "Evidence", "Refuse"], "Two will-not lines."),
    ],
    25: [
      FLOW("Portfolio folder", ["Pick", "Repair", "TOC", "Feedback"], "Weakest file first."),
      FLOW("Assemble", ["VaR", "Memo", "Replay", "Agent"], "Private folder."),
      FLOW("Repair", ["Gap", "Fix", "Retest", "Log"], "One artifact."),
    ],
    26: [
      FLOW("Narrative defense", ["Identity", "Proof", "Gate", "90 days"], "No inflated titles."),
      FLOW("Spoken defense", ["Threshold", "Agent gate", "Ask", "Next"], "Five minutes."),
      FLOW("90-day plan", ["Conversations", "Community", "Public note", "Booked"], "One next meeting."),
    ],
  };

  function pickDiagram(weekN, slotIndex) {
    const list = WEEK_DIAGRAMS[weekN] || [
      FLOW(`Week ${weekN} path`, ["Learn", "Lab", "Write", "Connect"], "Work top to bottom."),
    ];
    return list[Math.min(slotIndex, list.length - 1)] || list[0];
  }

  function mount(host) {
    if (!host || host.dataset.mounted === "1") return;
    host.dataset.mounted = "1";
    const weekN = Number(host.getAttribute("data-viz-week") || host.getAttribute("data-lab-viz"));
    const slot = Number(host.getAttribute("data-viz-slot") || 0);
    if (!weekN) return;
    try {
      pickDiagram(weekN, slot)(host);
    } catch (err) {
      host.appendChild(el("p", { className: "viz-readout" }, "Diagram failed to render: " + ((err && err.message) || err)));
    }
  }

  function bindViz(container) {
    const root = container || document;
    root.querySelectorAll("[data-viz-week], [data-lab-viz]").forEach(mount);
  }

  window.SixHoursViz = { bindViz, WEEK_DIAGRAMS };
})();
