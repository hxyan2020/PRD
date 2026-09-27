(() => {
  function studyHref() {
    const path = location.pathname || "/";
    const m = path.match(/^(.*?\/risk-champion-site)(?:\/|$)/);
    if (m) return m[1].replace(/\/$/, "") + "/study/";
    // Local static / Vercel root deploy
    return "/study/";
  }

  function ensureNavLink(nav) {
    const href = studyHref();
    if (!nav || nav.querySelector(`a[data-rc-study="1"]`)) return;
    const demos = [...nav.querySelectorAll("a")].find((a) => (a.getAttribute("href") || "").includes("/demos"));
    const link = document.createElement("a");
    link.href = href;
    link.dataset.rcStudy = "1";
    link.textContent = "Study Plan";
    link.className = demos?.className || "hover:text-teal-700 transition-colors";
    if (demos && demos.nextSibling) demos.parentNode.insertBefore(link, demos.nextSibling);
    else nav.appendChild(link);
  }

  function ensureHomeBanner() {
    const path = location.pathname || "/";
    const isHome =
      path === "/" ||
      /\/risk-champion-site\/?$/.test(path) ||
      /\/risk-champion-site\/index\.html$/.test(path);
    if (!isHome) return;
    if (document.getElementById("study-plan")) return;
    const about = document.querySelector("#about");
    const host = about?.parentElement || document.querySelector("main") || document.body;
    const section = document.createElement("section");
    section.id = "study-plan";
    section.className = "rc-page my-16 rounded-3xl border border-teal-700/20 bg-teal-50 p-8 md:p-10";
    const href = studyHref();
    section.innerHTML = `
      <p class="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Study plan</p>
      <h2 class="mt-2 font-display text-3xl font-bold tracking-tight text-ink-900">Six hours · 26 weeks</h2>
      <p class="mt-3 max-w-2xl text-ink-700/80">Close trading-risk, risk product, platform, quant, and AI gaps with plain-English courseware, an AI tutor, a notebook, and a live lab IDE — without replacing any Risk Champion demos or domains.</p>
      <a class="mt-5 inline-flex rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800" href="${href}">Open the study plan →</a>
    `;
    if (about) about.insertAdjacentElement("beforebegin", section);
    else host.appendChild(section);
  }

  function run() {
    document.querySelectorAll("header nav, .rc-page nav").forEach(ensureNavLink);
    ensureHomeBanner();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
  window.addEventListener("load", run);
  setTimeout(run, 400);
  setTimeout(run, 1200);
})();
