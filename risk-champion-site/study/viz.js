/* Interactive diagrams for courseware weeks (pure SVG / DOM, no CDN charts). */
(function () {
  const NS = "http://www.w3.org/2000/svg";

  function el(tag, attrs = {}, text) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "className") node.className = v;
      else node.setAttribute(k, v);
    }
    if (text != null) node.textContent = text;
    return node;
  }

  function svgEl(tag, attrs = {}) {
    const node = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
    return node;
  }

  function shell(title, subtitle) {
    const root = el("section", { className: "viz-panel" });
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
  const N = (x) => 0.5 * (1 + erf(x / Math.SQRT2));
  const nPdf = (x) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);

  function bsCall(S, K, r, sigma, T) {
    const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);
    const price = S * N(d1) - K * Math.exp(-r * T) * N(d2);
    const delta = N(d1);
    const gamma = nPdf(d1) / (S * sigma * Math.sqrt(T));
    const vega = S * nPdf(d1) * Math.sqrt(T);
    return { price, delta, gamma, vega, d1, d2 };
  }

  /** W1 — call payoff + interactive Greeks */
  function viz1(host) {
    const { root, body, read } = shell(
      "Interactive · call payoff & Greeks",
      "Drag spot and vol. Payoff is dashed; Black–Scholes value is solid."
    );
    const controls = el("div", { className: "viz-controls" });
    let S = 100,
      sigma = 0.2,
      T = 0.5;
    const K = 100,
      r = 0.02;
    const svg = svgEl("svg", { viewBox: "0 0 360 200", class: "viz-svg" });
    body.append(controls, svg);

    function draw() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      const g = bsCall(S, K, r, sigma, T);
      const x0 = 36,
        y0 = 170,
        w = 300,
        h = 140;
      svg.appendChild(svgEl("line", { x1: x0, y1: y0, x2: x0 + w, y2: y0, stroke: "#8aa39a", "stroke-width": 1 }));
      svg.appendChild(svgEl("line", { x1: x0, y1: y0, x2: x0, y2: y0 - h, stroke: "#8aa39a", "stroke-width": 1 }));
      const spots = [];
      for (let i = 0; i <= 60; i++) spots.push(60 + i * 1.5);
      const payoffs = spots.map((s) => Math.max(s - K, 0));
      const values = spots.map((s) => bsCall(s, K, r, sigma, T).price);
      const ymax = Math.max(...payoffs, ...values, 1) * 1.1;
      const path = (arr, stroke, dash) => {
        const d = arr
          .map((y, i) => {
            const x = x0 + (i / (arr.length - 1)) * w;
            const yy = y0 - (y / ymax) * h;
            return `${i ? "L" : "M"}${x.toFixed(1)},${yy.toFixed(1)}`;
          })
          .join(" ");
        const p = svgEl("path", { d, fill: "none", stroke, "stroke-width": 2 });
        if (dash) p.setAttribute("stroke-dasharray", dash);
        svg.appendChild(p);
      };
      path(payoffs, "#0c5f4e", "5 4");
      path(values, "#c45c26");
      const sx = x0 + ((S - 60) / 90) * w;
      svg.appendChild(svgEl("line", { x1: sx, y1: y0, x2: sx, y2: y0 - h, stroke: "#1a3c34", "stroke-width": 1, "stroke-dasharray": "2 3" }));
      svg.appendChild(svgEl("text", { x: x0, y: 16, fill: "#1a3c34", "font-size": 11 }, "Payoff (dashed) vs BS value (solid)"));
      svg.appendChild(svgEl("text", { x: x0 + w - 4, y: y0 + 14, fill: "#5c736c", "font-size": 10, "text-anchor": "end" }, "Spot"));
      read.textContent = `S=${S.toFixed(0)}  σ=${(sigma * 100).toFixed(0)}%  T=${T.toFixed(2)}y  →  price=${g.price.toFixed(3)}  Δ=${g.delta.toFixed(3)}  Γ=${g.gamma.toFixed(4)}  vega=${g.vega.toFixed(3)}`;
    }

    controls.append(
      slider("Spot S", 70, 140, 1, S, (v) => {
        S = v;
        draw();
      }),
      slider("Vol σ %", 5, 60, 1, sigma * 100, (v) => {
        sigma = v / 100;
        draw();
      }),
      slider("Tenor T (y)", 0.05, 2, 0.05, T, (v) => {
        T = v;
        draw();
      })
    );
    draw();
    host.appendChild(root);
  }

  /** W2 — realized vs EWMA */
  function viz2(host) {
    const { root, body, read } = shell("Interactive · realized vol vs EWMA", "Synthetic returns. λ closer to 1 = slower EWMA.");
    const controls = el("div", { className: "viz-controls" });
    let lam = 0.94;
    const svg = svgEl("svg", { viewBox: "0 0 360 200", class: "viz-svg" });
    body.append(controls, svg);
    // fixed synthetic series
    let seed = 2;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const rets = Array.from({ length: 60 }, () => {
      const u = rand() * 2 - 1;
      return u * 0.012;
    });

    function draw() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      const realized = [];
      const ewma = [];
      let v = 0;
      for (let i = 0; i < 20; i++) v += rets[i] * rets[i];
      v /= 19;
      let e = v;
      for (let t = 19; t < 60; t++) {
        const win = rets.slice(t - 19, t + 1);
        const m = win.reduce((a, b) => a + b, 0) / win.length;
        const svar = win.reduce((a, b) => a + (b - m) ** 2, 0) / (win.length - 1);
        realized.push(Math.sqrt(svar * 252));
        if (t === 19) e = svar;
        else e = lam * e + (1 - lam) * rets[t] * rets[t];
        ewma.push(Math.sqrt(e * 252));
      }
      const x0 = 36,
        y0 = 170,
        w = 300,
        h = 140;
      svg.appendChild(svgEl("line", { x1: x0, y1: y0, x2: x0 + w, y2: y0, stroke: "#8aa39a", "stroke-width": 1 }));
      svg.appendChild(svgEl("line", { x1: x0, y1: y0, x2: x0, y2: y0 - h, stroke: "#8aa39a", "stroke-width": 1 }));
      const ymax = Math.max(...realized, ...ewma) * 1.15;
      const path = (arr, stroke) => {
        const d = arr
          .map((y, i) => {
            const x = x0 + (i / (arr.length - 1)) * w;
            const yy = y0 - (y / ymax) * h;
            return `${i ? "L" : "M"}${x.toFixed(1)},${yy.toFixed(1)}`;
          })
          .join(" ");
        svg.appendChild(svgEl("path", { d, fill: "none", stroke, "stroke-width": 2 }));
      };
      path(realized, "#0c5f4e");
      path(ewma, "#c45c26");
      svg.appendChild(svgEl("text", { x: x0, y: 16, fill: "#1a3c34", "font-size": 11 }, "Teal: 20d realized · Orange: EWMA (ann.)"));
      read.textContent = `λ=${lam.toFixed(2)}  last realized=${(realized.at(-1) * 100).toFixed(1)}%  last EWMA=${(ewma.at(-1) * 100).toFixed(1)}%`;
    }
    controls.append(
      slider("λ ×100", 80, 99, 1, lam * 100, (v) => {
        lam = v / 100;
        draw();
      })
    );
    draw();
    host.appendChild(root);
  }

  /** W3 — margin buffer / liquidation */
  function viz3(host) {
    const { root, body, read } = shell("Interactive · margin buffer & liquidation", "Equity vs maintenance. Liquidation when buffer hits zero.");
    const controls = el("div", { className: "viz-controls" });
    let E = 100,
      N = 500,
      m = 0.02;
    const svg = svgEl("svg", { viewBox: "0 0 360 200", class: "viz-svg" });
    body.append(controls, svg);

    function draw() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      const maint = m * N;
      const buffer = E - maint;
      const ratio = E / N;
      const liq = buffer / N;
      const x0 = 40,
        barW = 280,
        yEq = 70,
        yM = 120;
      const maxV = Math.max(E, maint, N * 0.05) * 1.2;
      const wEq = (E / maxV) * barW;
      const wM = (maint / maxV) * barW;
      svg.appendChild(svgEl("text", { x: x0, y: 28, fill: "#1a3c34", "font-size": 12 }, "Equity vs maintenance margin"));
      svg.appendChild(svgEl("rect", { x: x0, y: yEq, width: wEq, height: 28, rx: 6, fill: "#0c5f4e" }));
      svg.appendChild(svgEl("text", { x: x0 + 8, y: yEq + 18, fill: "#fff", "font-size": 11 }, `Equity ${E.toFixed(0)}`));
      svg.appendChild(svgEl("rect", { x: x0, y: yM, width: wM, height: 28, rx: 6, fill: "#c45c26" }));
      svg.appendChild(svgEl("text", { x: x0 + 8, y: yM + 18, fill: "#fff", "font-size": 11 }, `Maint ${maint.toFixed(1)}`));
      const bufColor = buffer > 0 ? "#1a3c34" : "#b42318";
      svg.appendChild(
        svgEl("text", { x: x0, y: 175, fill: bufColor, "font-size": 12 }, `Buffer ${buffer.toFixed(1)} · ratio ${(ratio * 100).toFixed(1)}% · liq move ≈ ${(liq * 100).toFixed(2)}%`)
      );
      read.textContent = buffer > 0 ? "Still solvent on this mark. Shrink equity or raise MMR to see liquidation." : "Buffer ≤ 0 → liquidation zone.";
    }
    controls.append(
      slider("Equity E", 20, 200, 1, E, (v) => {
        E = v;
        draw();
      }),
      slider("Notional N", 200, 1000, 10, N, (v) => {
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

  /** W4 — threshold tradeoff */
  function viz4(host) {
    const { root, body, read } = shell("Interactive · 3% vs 5% alert economics", "Wider band cuts fatigue; missed-loss rises. Find your decision point.");
    const controls = el("div", { className: "viz-controls" });
    let thr = 4;
    const svg = svgEl("svg", { viewBox: "0 0 360 200", class: "viz-svg" });
    body.append(controls, svg);
    function model(t) {
      // synthetic: alerts fall with threshold; missed loss rises
      const alerts = Math.max(10, Math.round(180 * Math.exp(-18 * (t / 100))));
      const trueEv = 16;
      const fp = Math.max(0, (alerts - trueEv) / alerts);
      const missed = Math.round(40000 * Math.pow(t / 3, 1.4));
      return { alerts, trueEv, fp, missed };
    }
    function draw() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      const pts = [];
      for (let t = 2; t <= 8; t += 0.25) pts.push({ t, ...model(t) });
      const x0 = 40,
        y0 = 170,
        w = 290,
        h = 130;
      const maxA = Math.max(...pts.map((p) => p.alerts));
      const maxM = Math.max(...pts.map((p) => p.missed));
      const path = (key, max, stroke) => {
        const d = pts
          .map((p, i) => {
            const x = x0 + ((p.t - 2) / 6) * w;
            const y = y0 - (p[key] / max) * h;
            return `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
          })
          .join(" ");
        svg.appendChild(svgEl("path", { d, fill: "none", stroke, "stroke-width": 2 }));
      };
      path("alerts", maxA, "#0c5f4e");
      path("missed", maxM, "#c45c26");
      const cur = model(thr);
      const cx = x0 + ((thr - 2) / 6) * w;
      svg.appendChild(svgEl("line", { x1: cx, y1: y0, x2: cx, y2: y0 - h, stroke: "#1a3c34", "stroke-dasharray": "3 3" }));
      svg.appendChild(svgEl("text", { x: x0, y: 18, fill: "#1a3c34", "font-size": 11 }, "Teal: alerts/day proxy · Orange: missed-loss $"));
      read.textContent = `Threshold ${thr.toFixed(1)}% → alerts≈${cur.alerts}  FP≈${(cur.fp * 100).toFixed(0)}%  missed-loss≈$${cur.missed.toLocaleString()}`;
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

  /** Flow diagram helper */
  function flowDiagram(host, title, subtitle, stages, note) {
    const { root, body, read } = shell(title, subtitle);
    const svg = svgEl("svg", { viewBox: "0 0 360 120", class: "viz-svg viz-flow" });
    body.appendChild(svg);
    const n = stages.length;
    const boxW = Math.min(70, (320 - (n - 1) * 16) / n);
    const markerId = "arrow-" + Math.random().toString(36).slice(2, 8);
    let active = 0;
    function draw() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      const defs = svgEl("defs");
      const marker = svgEl("marker", { id: markerId, markerWidth: 6, markerHeight: 6, refX: 5, refY: 3, orient: "auto" });
      marker.appendChild(svgEl("path", { d: "M0,0 L6,3 L0,6 Z", fill: "#0c5f4e" }));
      defs.appendChild(marker);
      svg.appendChild(defs);
      stages.forEach((label, i) => {
        const x = 16 + i * (boxW + 16);
        const y = 36;
        const fill = i === active ? "#0c5f4e" : "#e7efeb";
        const ink = i === active ? "#fff" : "#1a3c34";
        const r = svgEl("rect", { x, y, width: boxW, height: 44, rx: 8, fill, stroke: "#0c5f4e", "stroke-width": 1, style: "cursor:pointer" });
        r.addEventListener("click", () => {
          active = i;
          draw();
        });
        svg.appendChild(r);
        const words = label.split(" ");
        words.forEach((w, wi) => {
          svg.appendChild(
            svgEl("text", { x: x + boxW / 2, y: y + 18 + wi * 12, fill: ink, "font-size": 10, "text-anchor": "middle", style: "pointer-events:none" }, w)
          );
        });
        if (i < n - 1) {
          svg.appendChild(
            svgEl("line", {
              x1: x + boxW,
              y1: y + 22,
              x2: x + boxW + 16,
              y2: y + 22,
              stroke: "#0c5f4e",
              "stroke-width": 2,
              "marker-end": `url(#${markerId})`,
            })
          );
        }
      });
      read.textContent = `${note}  Focus: ${stages[active].replace(/\s+/g, " ")}`;
    }
    draw();
    host.appendChild(root);
  }

  function viz5(host) {
    flowDiagram(host, "Interactive · slice ownership flow", "Tap a stage. Discovery → roadmap → acceptance tests.", ["Discover", "Non-goals", "Roadmap", "G/W/T", "Done"], "Scope cuts happen in Non-goals, not in font size.");
  }

  function viz7(host) {
    flowDiagram(host, "Interactive · maker–checker", "Tap each control step. Parameter changes need both roles.", ["Draft", "Maker", "Checker", "Effective", "Audit"], "Rollback is a checked parameter revert, not a code redeploy.");
  }

  function viz9(host) {
    flowDiagram(host, "Interactive · tick → alert path", "Tap to walk the hot path. Every box needs an owner.", ["Tick", "Position", "Metric", "Rule", "Alert", "Ack"], "correlation_id and inputs_hash travel with the AlertEvent.");
  }

  function viz11(host) {
    flowDiagram(host, "Interactive · ship with rollback", "Minimal delivery path. Rollback is config revert.", ["Test", "Review", "Stage", "Ship", "Watch", "Rollback"], "Three automated checks must be pass/fail before Ship.");
  }

  /** W12 — VaR histogram */
  function viz12(host) {
    const { root, body, read } = shell("Interactive · loss histogram & VaR", "Synthetic P&L. Drag confidence to move the VaR cut.");
    const controls = el("div", { className: "viz-controls" });
    let conf = 99;
    let seed = 7;
    const randn = () => {
      // Box-Muller
      seed = (seed * 48271) % 2147483647;
      const u1 = seed / 2147483647;
      seed = (seed * 48271) % 2147483647;
      const u2 = seed / 2147483647;
      return Math.sqrt(-2 * Math.log(Math.max(u1, 1e-12))) * Math.cos(2 * Math.PI * u2);
    };
    const pnl = Array.from({ length: 500 }, () => randn() * 1.2 - 0.05);
    const losses = pnl.map((x) => -x).sort((a, b) => a - b);
    const svg = svgEl("svg", { viewBox: "0 0 360 200", class: "viz-svg" });
    body.append(controls, svg);
    function draw() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      const q = conf / 100;
      const idx = Math.min(losses.length - 1, Math.floor(q * (losses.length - 1)));
      const varEst = losses[idx];
      const bins = 24;
      const minL = losses[0],
        maxL = losses[losses.length - 1];
      const counts = Array(bins).fill(0);
      losses.forEach((v) => {
        const b = Math.min(bins - 1, Math.floor(((v - minL) / (maxL - minL + 1e-9)) * bins));
        counts[b]++;
      });
      const maxC = Math.max(...counts);
      const x0 = 30,
        y0 = 170,
        w = 310,
        h = 140;
      counts.forEach((c, i) => {
        const bw = w / bins;
        const bh = (c / maxC) * h;
        svg.appendChild(svgEl("rect", { x: x0 + i * bw, y: y0 - bh, width: bw - 1, height: bh, fill: "#0c5f4e", opacity: 0.75 }));
      });
      const vx = x0 + ((varEst - minL) / (maxL - minL)) * w;
      svg.appendChild(svgEl("line", { x1: vx, y1: y0, x2: vx, y2: y0 - h, stroke: "#c45c26", "stroke-width": 2 }));
      svg.appendChild(svgEl("text", { x: x0, y: 18, fill: "#1a3c34", "font-size": 11 }, "Orange line = historical VaR cut on −P&L"));
      read.textContent = `${conf}% historical VaR ≈ ${varEst.toFixed(3)} (loss units). Parametric would use μ+σ·z.`;
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

  /** W13 — ES vs VaR */
  function viz13(host) {
    const { root, body, read } = shell("Interactive · VaR vs expected shortfall", "ES averages losses beyond VaR — always ≥ VaR for the same level.");
    const controls = el("div", { className: "viz-controls" });
    let conf = 97.5;
    let seed = 13;
    const randn = () => {
      seed = (seed * 48271) % 2147483647;
      const u1 = seed / 2147483647;
      seed = (seed * 48271) % 2147483647;
      const u2 = seed / 2147483647;
      return Math.sqrt(-2 * Math.log(Math.max(u1, 1e-12))) * Math.cos(2 * Math.PI * u2);
    };
    const losses = Array.from({ length: 800 }, () => Math.abs(randn()) * 1.1 + Math.max(0, randn()) * 0.4).sort((a, b) => a - b);
    const svg = svgEl("svg", { viewBox: "0 0 360 160", class: "viz-svg" });
    body.append(controls, svg);
    function draw() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      const idx = Math.min(losses.length - 1, Math.floor((conf / 100) * (losses.length - 1)));
      const varEst = losses[idx];
      const tail = losses.slice(idx);
      const es = tail.reduce((a, b) => a + b, 0) / tail.length;
      const maxV = Math.max(varEst, es) * 1.25;
      const bar = (y, val, label, fill) => {
        const w = (val / maxV) * 280;
        svg.appendChild(svgEl("rect", { x: 50, y, width: w, height: 32, rx: 6, fill }));
        svg.appendChild(svgEl("text", { x: 54, y: y + 20, fill: "#fff", "font-size": 12 }, `${label} ${val.toFixed(3)}`));
      };
      bar(40, varEst, "VaR", "#0c5f4e");
      bar(90, es, "ES", "#c45c26");
      read.textContent = `At ${conf}%: ES − VaR = ${(es - varEst).toFixed(3)}. Tail mean of ${tail.length} observations.`;
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

  /** W15 — MC fan chart */
  function viz15(host) {
    const { root, body, read } = shell("Interactive · Monte Carlo loss fan", "Drag path count. Orange = 95% loss quantile.");
    const controls = el("div", { className: "viz-controls" });
    let nPaths = 200;
    const svg = svgEl("svg", { viewBox: "0 0 360 200", class: "viz-svg" });
    body.append(controls, svg);
    function draw() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      let seed = 15;
      const rnd = () => {
        seed = (seed * 48271) % 2147483647;
        return seed / 2147483647;
      };
      const randn = () => {
        const u1 = Math.max(rnd(), 1e-12),
          u2 = rnd();
        return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      };
      const steps = 20;
      const paths = [];
      const terminal = [];
      for (let p = 0; p < nPaths; p++) {
        const series = [0];
        for (let t = 1; t <= steps; t++) series.push(series[t - 1] + randn() * 0.8);
        paths.push(series);
        terminal.push(-series[steps]); // loss
      }
      terminal.sort((a, b) => a - b);
      const q95 = terminal[Math.floor(0.95 * (terminal.length - 1))];
      const x0 = 30,
        y0 = 100,
        w = 300,
        h = 70;
      const show = paths.slice(0, Math.min(40, paths.length));
      show.forEach((series) => {
        const d = series
          .map((y, i) => {
            const x = x0 + (i / steps) * w;
            const yy = y0 - y * 3;
            return `${i ? "L" : "M"}${x.toFixed(1)},${yy.toFixed(1)}`;
          })
          .join(" ");
        svg.appendChild(svgEl("path", { d, fill: "none", stroke: "#0c5f4e", "stroke-width": 1, opacity: 0.25 }));
      });
      svg.appendChild(svgEl("text", { x: x0, y: 18, fill: "#1a3c34", "font-size": 11 }, `${nPaths} paths (showing ${show.length})`));
      svg.appendChild(svgEl("text", { x: x0, y: 185, fill: "#c45c26", "font-size": 12 }, `95% loss ≈ ${q95.toFixed(2)}  ·  mean loss ≈ ${(terminal.reduce((a, b) => a + b, 0) / terminal.length).toFixed(2)}`));
      read.textContent = "Liquidity add-on sits on top of this market loss — document the rule, not Almgren–Chriss.";
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

  /** W17 — precision/recall */
  function viz17(host) {
    const { root, body, read } = shell("Interactive · precision at fixed recall", "Threshold on score. Target recall 0.80 and read precision.");
    const controls = el("div", { className: "viz-controls" });
    let thr = 0.45;
    // synthetic scores
    let seed = 17;
    const rnd = () => {
      seed = (seed * 48271) % 2147483647;
      return seed / 2147483647;
    };
    const rows = Array.from({ length: 200 }, () => {
      const y = rnd() < 0.25 ? 1 : 0;
      const score = y ? 0.55 + rnd() * 0.45 : rnd() * 0.7;
      return { y, score };
    });
    const svg = svgEl("svg", { viewBox: "0 0 360 180", class: "viz-svg" });
    body.append(controls, svg);
    function draw() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      const pred = rows.map((r) => ({ ...r, p: r.score >= thr ? 1 : 0 }));
      const tp = pred.filter((r) => r.p && r.y).length;
      const fp = pred.filter((r) => r.p && !r.y).length;
      const fn = pred.filter((r) => !r.p && r.y).length;
      const prec = tp / Math.max(1, tp + fp);
      const rec = tp / Math.max(1, tp + fn);
      // PR curve rough
      const curve = [];
      for (let t = 0; t <= 1.001; t += 0.05) {
        const p2 = rows.map((r) => (r.score >= t ? 1 : 0));
        const tp2 = rows.filter((r, i) => p2[i] && r.y).length;
        const fp2 = rows.filter((r, i) => p2[i] && !r.y).length;
        const fn2 = rows.filter((r, i) => !p2[i] && r.y).length;
        curve.push({ rec: tp2 / Math.max(1, tp2 + fn2), prec: tp2 / Math.max(1, tp2 + fp2) });
      }
      const x0 = 40,
        y0 = 150,
        w = 280,
        h = 120;
      svg.appendChild(svgEl("line", { x1: x0, y1: y0, x2: x0 + w, y2: y0, stroke: "#8aa39a" }));
      svg.appendChild(svgEl("line", { x1: x0, y1: y0, x2: x0, y2: y0 - h, stroke: "#8aa39a" }));
      const d = curve
        .map((c, i) => {
          const x = x0 + c.rec * w;
          const y = y0 - c.prec * h;
          return `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" ");
      svg.appendChild(svgEl("path", { d, fill: "none", stroke: "#0c5f4e", "stroke-width": 2 }));
      svg.appendChild(svgEl("circle", { cx: x0 + rec * w, cy: y0 - prec * h, r: 5, fill: "#c45c26" }));
      svg.appendChild(svgEl("line", { x1: x0 + 0.8 * w, y1: y0, x2: x0 + 0.8 * w, y2: y0 - h, stroke: "#1a3c34", "stroke-dasharray": "3 3" }));
      svg.appendChild(svgEl("text", { x: x0, y: 18, fill: "#1a3c34", "font-size": 11 }, "PR curve · dashed = recall 0.80 target"));
      read.textContent = `thr=${thr.toFixed(2)} → precision=${prec.toFixed(3)}  recall=${rec.toFixed(3)}  (aim recall≥0.80)`;
    }
    controls.append(
      slider("Score thr ×100", 5, 95, 1, thr * 100, (v) => {
        thr = v / 100;
        draw();
      })
    );
    draw();
    host.appendChild(root);
  }

  function viz20(host) {
    flowDiagram(host, "Interactive · agent that cannot approve", "Tools may draft; only a human APPROVE gate ships.", ["Tools", "Draft", "Stop", "Human", "APPROVE"], "search_memos · compute_var · draft_finding — nothing else.");
  }

  function viz22(host) {
    flowDiagram(host, "Interactive · secured funding chain", "Tap each link. Haircuts and rehypothecation change who eats the loss.", ["Cash", "Repo", "Collateral", "Haircut", "Margin call"], "Crypto margin ≠ PB: map the eight-row table before the arithmetic.");
  }

  function viz23(host) {
    const { root, body, read } = shell("Interactive · four shocks, dominant sleeve", "Three sleeves. Joint shocks — which sleeve owns the loss?");
    const controls = el("div", { className: "viz-controls" });
    let shock = 1;
    const svg = svgEl("svg", { viewBox: "0 0 360 180", class: "viz-svg" });
    body.append(controls, svg);
    const base = { rates: 12, credit: 18, liquidity: 9 };
    function draw() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      const mult = { rates: 1 + 0.4 * shock, credit: 1 + 0.55 * shock, liquidity: 1 + 0.7 * shock };
      const vals = Object.fromEntries(Object.entries(base).map(([k, v]) => [k, v * mult[k]]));
      const total = Object.values(vals).reduce((a, b) => a + b, 0);
      const colors = { rates: "#0c5f4e", credit: "#c45c26", liquidity: "#2a6f97" };
      let x = 40;
      Object.entries(vals).forEach(([k, v]) => {
        const w = (v / total) * 280;
        svg.appendChild(svgEl("rect", { x, y: 60, width: w, height: 40, fill: colors[k] }));
        if (w > 40) svg.appendChild(svgEl("text", { x: x + 6, y: 85, fill: "#fff", "font-size": 11 }, k));
        x += w;
      });
      const dom = Object.entries(vals).sort((a, b) => b[1] - a[1])[0];
      svg.appendChild(svgEl("text", { x: 40, y: 30, fill: "#1a3c34", "font-size": 12 }, `Joint shock ×${shock.toFixed(1)} · total loss ${total.toFixed(1)}`));
      read.textContent = `Dominant sleeve: ${dom[0]} (${((dom[1] / total) * 100).toFixed(0)}% of loss). Write that sentence in the lab.`;
    }
    controls.append(
      slider("Shock intensity", 0.5, 3, 0.1, shock, (v) => {
        shock = v;
        draw();
      })
    );
    draw();
    host.appendChild(root);
  }

  /** Generic lesson-path diagram for remaining weeks */
  function vizGeneric(host, weekN, lessonTitles) {
    if (!lessonTitles.length) return;
    flowDiagram(
      host,
      `Interactive · week ${weekN} path`,
      "Tap each lesson focus. Use this as a mental checklist before the lab.",
      lessonTitles.map((t) => t.split(/\s+/).slice(0, 2).join(" ")).slice(0, 5),
      "Open courseware top-to-bottom; the lab only works if these hold."
    );
  }

  const SPECIFIC = {
    1: viz1,
    2: viz2,
    3: viz3,
    4: viz4,
    5: viz5,
    7: viz7,
    9: viz9,
    11: viz11,
    12: viz12,
    13: viz13,
    15: viz15,
    17: viz17,
    20: viz20,
    22: viz22,
    23: viz23,
  };

  function mount(host) {
    if (!host || host.dataset.mounted === "1") return;
    host.dataset.mounted = "1";
    const weekN = Number(host.getAttribute("data-lab-viz"));
    const lessons = (() => {
      try {
        return JSON.parse(host.getAttribute("data-lessons") || "[]");
      } catch (_) {
        return [];
      }
    })();
    const fn = SPECIFIC[weekN];
    if (fn) fn(host);
    else vizGeneric(host, weekN, lessons);
  }

  function bindViz(container) {
    (container || document).querySelectorAll("[data-lab-viz]").forEach(mount);
  }

  window.SixHoursViz = { bindViz };
})();
