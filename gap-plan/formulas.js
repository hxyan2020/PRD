/* KaTeX formula cards + inline math typesetting for courseware. */
(function () {
  const WEEK_FORMULAS = {
    1: [
      { title: "Call / put payoff at expiry", latex: "\\text{Call}=\\max(S-K,0),\\quad \\text{Put}=\\max(K-S,0)" },
      { title: "Put–call parity (non-dividend)", latex: "C - P = S - Ke^{-rT}" },
      {
        title: "Black–Scholes European call",
        latex: "C = SN(d_1) - Ke^{-rT}N(d_2)",
        note: "N(·) is the standard normal CDF.",
      },
      {
        title: "d₁ and d₂",
        latex: "d_1=\\frac{\\ln(S/K)+(r+\\tfrac{1}{2}\\sigma^2)T}{\\sigma\\sqrt{T}},\\quad d_2=d_1-\\sigma\\sqrt{T}",
      },
      {
        title: "Greeks (call)",
        latex: "\\Delta=N(d_1),\\; \\Gamma=\\frac{n(d_1)}{S\\sigma\\sqrt{T}},\\; \\nu=S\\,n(d_1)\\sqrt{T}",
        note: "n(·) = standard normal density. State θ units when you report it.",
      },
    ],
    2: [
      { title: "Basis", latex: "\\text{basis}=F-S" },
      { title: "Minimum-variance hedge ratio", latex: "h^*=\\rho\\,\\frac{\\sigma_S}{\\sigma_F}" },
      { title: "Log return", latex: "r_t=\\ln\\!\\left(\\frac{P_t}{P_{t-1}}\\right)" },
      {
        title: "Realized vol (annualized)",
        latex: "\\sigma_{\\text{real}}=\\sqrt{252}\\,\\widehat{\\mathrm{sd}}(r_{t-19:t})",
      },
      {
        title: "RiskMetrics EWMA variance",
        latex: "\\sigma^2_t=\\lambda\\sigma^2_{t-1}+(1-\\lambda)r_{t-1}^2,\\quad \\lambda=0.94",
      },
    ],
    3: [
      { title: "Maintenance requirement", latex: "\\text{maint}=m\\cdot N" },
      { title: "Margin ratio", latex: "\\text{margin ratio}=\\frac{E}{N}" },
      { title: "Buffer & liquidation move", latex: "\\text{buffer}=E-\\text{maint},\\quad \\text{liq move}\\approx\\frac{\\text{buffer}}{N}" },
      { title: "Haircut-adjusted equity", latex: "E_{\\text{adj}}=\\text{cash}+(1-h)\\cdot\\text{mark}_B" },
    ],
    4: [
      {
        title: "VaR as a loss quantile",
        latex: "\\mathrm{VaR}_{\\alpha}=Q_{\\alpha}(L),\\quad L=-\\mathrm{P\\&L}",
      },
      {
        title: "Expected shortfall",
        latex: "\\mathrm{ES}_{\\alpha}=\\mathbb{E}[L\\mid L\\ge \\mathrm{VaR}_{\\alpha}]",
      },
      {
        title: "False-positive rate (alert economics)",
        latex: "\\mathrm{FPR}\\approx\\frac{\\text{alerts}-\\text{true}}{\\text{alerts}}",
      },
    ],
    8: [
      {
        title: "Replay alert delta",
        latex: "\\Delta\\text{alerts}=\\#\\{u_i>c_{\\text{new}}\\}-\\#\\{u_i>c_{\\text{old}}\\}",
      },
    ],
    12: [
      {
        title: "Historical VaR",
        latex: "\\mathrm{VaR}_{99\\%}^{\\text{hist}}=Q_{0.99}(L_1,\\ldots,L_n)",
      },
      {
        title: "Portfolio variance (parametric)",
        latex: "\\sigma_p^2=w^{\\top}\\Sigma w",
      },
      {
        title: "Parametric / variance–covariance VaR",
        latex: "\\mathrm{VaR}_{99\\%}^{\\text{param}}=z_{0.99}\\,\\sigma_p\\,V,\\quad z_{0.99}\\approx 2.326",
      },
      {
        title: "Covariance entry",
        latex: "\\Sigma_{ij}=\\rho_{ij}\\sigma_i\\sigma_j",
      },
    ],
    13: [
      {
        title: "Expected shortfall",
        latex: "\\mathrm{ES}_{\\alpha}=\\frac{1}{1-\\alpha}\\int_{\\alpha}^{1}\\mathrm{VaR}_{u}\\,du \\approx \\text{mean of losses }\\ge\\mathrm{VaR}_{\\alpha}",
      },
      {
        title: "Exception indicator",
        latex: "I_t=\\mathbf{1}\\{L_t>\\mathrm{VaR}_t\\}",
      },
      {
        title: "Kupiec LR (proportion of failures)",
        latex: "LR=-2\\ln\\frac{(1-p)^{n-x}p^{x}}{(1-\\hat{\\pi})^{n-x}\\hat{\\pi}^{x}},\\quad \\hat{\\pi}=x/n",
        note: "Compare to \\(\\chi^2_1\\). Traffic-light zones use exception counts over ~250 days.",
      },
    ],
    14: [
      {
        title: "EWMA variance",
        latex: "\\sigma^2_t=\\lambda\\sigma^2_{t-1}+(1-\\lambda)r_{t-1}^2",
      },
      {
        title: "GARCH(1,1)",
        latex: "\\sigma^2_t=\\omega+\\alpha r_{t-1}^2+\\beta\\sigma^2_{t-1}",
      },
      {
        title: "GARCH long-run variance",
        latex: "\\bar{\\sigma}^2=\\frac{\\omega}{1-\\alpha-\\beta},\\quad \\alpha+\\beta<1",
      },
      {
        title: "Two-asset portfolio vol",
        latex: "\\sigma_p=\\sqrt{w_1^2\\sigma_1^2+w_2^2\\sigma_2^2+2w_1w_2\\rho\\sigma_1\\sigma_2}",
      },
    ],
    15: [
      {
        title: "Monte Carlo loss quantile",
        latex: "\\widehat{\\mathrm{VaR}}_{\\alpha}=Q_{\\alpha}\\!\\left(L^{(1)},\\ldots,L^{(M)}\\right)",
      },
      {
        title: "Correlated normals (Cholesky)",
        latex: "Z=LX,\\quad LL^{\\top}=\\Rho,\\quad X\\sim\\mathcal{N}(0,I)",
      },
    ],
    17: [
      { title: "Precision", latex: "\\mathrm{Precision}=\\frac{TP}{TP+FP}" },
      { title: "Recall", latex: "\\mathrm{Recall}=\\frac{TP}{TP+FN}" },
      { title: "F1 score", latex: "F_1=\\frac{2\\cdot\\mathrm{Precision}\\cdot\\mathrm{Recall}}{\\mathrm{Precision}+\\mathrm{Recall}}" },
    ],
    18: [
      {
        title: "Median absolute deviation (MAD)",
        latex: "\\mathrm{MAD}=\\mathrm{median}\\big(|x_i-\\mathrm{median}(x)|\\big)",
      },
      {
        title: "Robust z-score",
        latex: "z_i=\\frac{x_i-\\mathrm{median}(x)}{1.4826\\,\\mathrm{MAD}}",
      },
    ],
    22: [
      { title: "Repo cash interest (simple)", latex: "\\text{interest}=\\text{cash}\\cdot r\\cdot\\frac{\\text{days}}{360}" },
      { title: "Haircut-adjusted collateral value", latex: "V_{\\text{post}}=\\text{mark}\\,(1-h)" },
    ],
    23: [
      {
        title: "Sleeve P&L (linear)",
        latex: "\\Delta\\mathrm{P\\&L}_i \\approx \\delta_i\\,\\Delta S_i \\quad\\text{or full revaluation}",
      },
      {
        title: "Dominant sleeve share",
        latex: "\\text{share}_i=\\frac{|\\mathrm{loss}_i|}{\\sum_j|\\mathrm{loss}_j|}",
      },
    ],
  };

  function ensureKatex() {
    return new Promise((resolve, reject) => {
      if (window.katex) {
        resolve(window.katex);
        return;
      }
      const cssHref = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css";
      if (!document.querySelector(`link[href="${cssHref}"]`)) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = cssHref;
        document.head.appendChild(link);
      }
      const src = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js";
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        existing.addEventListener("load", () => resolve(window.katex));
        if (window.katex) resolve(window.katex);
        return;
      }
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = () => resolve(window.katex);
      s.onerror = () => reject(new Error("KaTeX failed to load"));
      document.head.appendChild(s);
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function renderFormulaPanel(weekN) {
    const items = WEEK_FORMULAS[weekN];
    if (!items || !items.length) return "";
    return `<section class="block formula-panel">
      <h3>Key formulas</h3>
      <p class="block-label">Rendered math for this week — scroll the lab IDE to implement them</p>
      <div class="formula-list">
        ${items
          .map(
            (item, i) => `<figure class="formula-card">
              <figcaption>${escapeHtml(item.title)}</figcaption>
              <div class="formula-math" data-display="1" data-latex="${escapeHtml(item.latex)}"></div>
              ${item.note ? `<p class="formula-note">${escapeHtml(item.note)}</p>` : ""}
            </figure>`
          )
          .join("")}
      </div>
    </section>`;
  }

  /** Convert common plain-text formula phrases into \\( ... \\) for KaTeX. */
  function enrichMathInText(text) {
    let s = String(text);
    const replacements = [
      [/max\(S\s*[−-]\s*K,\s*0\)/gi, "\\(\\max(S-K,0)\\)"],
      [/max\(K\s*[−-]\s*S,\s*0\)/gi, "\\(\\max(K-S,0)\\)"],
      [/C\s*[−-]\s*P\s*=\s*S\s*[−-]\s*K\s*e\^\{?−rT\}?/g, "\\(C-P=S-Ke^{-rT}\\)"],
      [/S\s*N\(d1\)\s*[−-]\s*K\s*e\^\{?−rT\}?\s*N\(d2\)/gi, "\\(SN(d_1)-Ke^{-rT}N(d_2)\\)"],
      [/h\*\s*=\s*ρ\s*σ_S\s*\/\s*σ_F/g, "\\(h^*=\\rho\\,\\sigma_S/\\sigma_F\\)"],
      [/F\s*[−-]\s*S/g, "\\(F-S\\)"],
      [/λ\s*=\s*0\.94|lambda\s*0\.94/gi, "\\(\\lambda=0.94\\)"],
      [/sqrt\(252\)/gi, "\\(\\sqrt{252}\\)"],
      [/σ\^?2_t\s*=\s*λσ\^?2_\{?t-1\}?\s*\+\s*\(1\s*[−-]\s*λ\)r\^?2_\{?t-1\}?/gi, "\\(\\sigma^2_t=\\lambda\\sigma^2_{t-1}+(1-\\lambda)r_{t-1}^2\\)"],
      [/w-transpose times Sigma times w/gi, "\\(w^{\\top}\\Sigma w\\)"],
      [/z\s*=\s*2\.33/gi, "\\(z\\approx 2.33\\)"],
    ];
    for (const [re, out] of replacements) s = s.replace(re, out);
    return s;
  }

  function formatCourseText(text) {
    const enriched = enrichMathInText(text);
    // Escape HTML, but protect \( ... \) and \[ ... \] segments
    const parts = [];
    const re = /(\\\([\s\S]+?\\\)|\\\[[\s\S]+?\\\])/g;
    let last = 0;
    let m;
    while ((m = re.exec(enriched))) {
      parts.push({ t: "text", v: enriched.slice(last, m.index) });
      parts.push({ t: "math", v: m[0] });
      last = m.index + m[0].length;
    }
    parts.push({ t: "text", v: enriched.slice(last) });
    return parts
      .map((p) => {
        if (p.t === "text") return escapeHtml(p.v);
        const display = p.v.startsWith("\\[");
        const latex = p.v.slice(2, -2);
        return `<span class="formula-math" data-display="${display ? "1" : "0"}" data-latex="${escapeHtml(latex.trim())}"></span>`;
      })
      .join("");
  }

  async function typeset(root) {
    const host = root || document;
    const nodes = host.querySelectorAll(".formula-math[data-latex]");
    if (!nodes.length) return;
    let katex;
    try {
      katex = await ensureKatex();
    } catch (_) {
      nodes.forEach((node) => {
        node.textContent = node.getAttribute("data-latex") || "";
        node.classList.add("is-fallback");
      });
      return;
    }
    nodes.forEach((node) => {
      if (node.dataset.typeset === "1") return;
      const latex = node.getAttribute("data-latex") || "";
      const display = node.getAttribute("data-display") === "1";
      try {
        katex.render(latex, node, { throwOnError: false, displayMode: display });
        node.dataset.typeset = "1";
      } catch (_) {
        node.textContent = latex;
      }
    });
  }

  window.SixHoursFormulas = {
    WEEK_FORMULAS,
    renderFormulaPanel,
    formatCourseText,
    typeset,
    enrichMathInText,
  };
})();
