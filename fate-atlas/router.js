/**
 * Hash router — splits Fatum Atlas into focused pages.
 * Routes: home | atlas | journal | about | terms
 * Legacy #/play and #begin redirect to home (recommendations live under the hero).
 */
(function () {
  "use strict";

  const ROUTES = ["home", "atlas", "journal", "about", "terms"];
  let current = "home";
  const listeners = new Set();

  function t(key, vars) {
    return window.FatumI18n ? window.FatumI18n.t(key, vars) : key;
  }

  const LEGACY = {
    play: "home",
    begin: "home",
    catalog: "atlas",
    regions: "atlas",
    journal: "journal",
    howto: "about",
    sources: "about",
    terms: "terms",
    top: "home",
  };

  function parseHash() {
    const raw = (location.hash || "#/home").replace(/^#\/?/, "");
    const [path, query = ""] = raw.split("?");
    const legacyHit = Object.prototype.hasOwnProperty.call(LEGACY, path) && !ROUTES.includes(path);
    const normalized = ROUTES.includes(path)
      ? path
      : LEGACY[path] || "home";
    const page = ROUTES.includes(normalized) ? normalized : "home";
    const params = {};
    query.split("&").forEach((pair) => {
      if (!pair) return;
      const [k, v] = pair.split("=");
      try {
        params[decodeURIComponent(k)] = decodeURIComponent(v || "");
      } catch (_) {
        params[k] = v || "";
      }
    });
    const focusPlay =
      path === "play" ||
      path === "begin" ||
      params.focus === "play" ||
      params.focus === "featured";
    return { page, params, legacy: legacyHit, focusPlay };
  }

  function setHash(page, params, replace) {
    let hash = `#/${page}`;
    const keys = Object.keys(params || {}).filter((k) => params[k] != null && params[k] !== "");
    if (keys.length) {
      hash +=
        "?" +
        keys
          .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
          .join("&");
    }
    if (replace) {
      // replaceState does not fire hashchange — apply immediately
      if (location.hash !== hash) history.replaceState(null, "", hash);
      apply();
    } else if (location.hash !== hash) {
      location.hash = hash;
    } else {
      apply();
    }
  }

  function navigate(page, params, opts) {
    if (!ROUTES.includes(page)) page = "home";
    setHash(page, params || {}, opts && opts.replace);
  }

  function paramsFromHref(href) {
    const params = {};
    if (!href) return params;
    const hash = href.includes("#") ? href.slice(href.indexOf("#")) : href;
    const raw = hash.replace(/^#\/?/, "");
    const [, query = ""] = raw.split("?");
    query.split("&").forEach((pair) => {
      if (!pair) return;
      const [k, v] = pair.split("=");
      try {
        params[decodeURIComponent(k)] = decodeURIComponent(v || "");
      } catch (_) {
        params[k] = v || "";
      }
    });
    return params;
  }

  function scrollToFeatured() {
    requestAnimationFrame(() => {
      document.getElementById("play")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function apply() {
    const parsed = parseHash();
    const { page, params } = parsed;
    // Rewrite legacy anchors (#/play → #/home, #catalog → #/atlas) so the URL stays clean
    if (parsed.legacy) {
      const nextParams = { ...params };
      if (parsed.focusPlay) nextParams.focus = "play";
      navigate(page, nextParams, { replace: true });
      return;
    }
    current = page;
    document.body.dataset.page = page;

    document.querySelectorAll(".page[data-page]").forEach((el) => {
      const pageId = el.getAttribute("data-page");
      const on = pageId === page;
      el.hidden = !on;
      el.classList.toggle("is-active-page", on);
      if (on) el.removeAttribute("aria-hidden");
      else el.setAttribute("aria-hidden", "true");
    });

    document.querySelectorAll("[data-nav]").forEach((el) => {
      const target = el.getAttribute("data-nav");
      // Only highlight primary nav / path links, not every CTA with data-nav
      const isChrome = el.classList.contains("site-nav__link") || el.classList.contains("hud__brand");
      const active = isChrome && target === page;
      el.classList.toggle("is-active", active);
      if (active) el.setAttribute("aria-current", "page");
      else el.removeAttribute("aria-current");
    });

    // Close mobile nav
    document.body.classList.remove("nav-open");
    const toggle = document.getElementById("nav-toggle");
    const backdrop = document.getElementById("nav-backdrop");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
    if (backdrop) backdrop.hidden = true;

    // Page-specific logic
    if (page === "atlas" && params.continent) {
      const sel = document.getElementById("continent-filter");
      if (sel && sel.value !== params.continent) {
        sel.value = params.continent;
        sel.dispatchEvent(new Event("change", { bubbles: true }));
      }
      document.querySelectorAll(".continent-btn").forEach((b) => {
        b.classList.toggle("is-active", b.dataset.continent === params.continent);
      });
    }
    if (page === "atlas" && params.method) {
      requestAnimationFrame(() => {
        const target = document.getElementById(`method-${params.method}`);
        if (target) {
          target.classList.add("is-route-focus");
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          setTimeout(() => target.classList.remove("is-route-focus"), 1800);
        }
      });
    }
    if ((page === "atlas" || page === "home") && params.surprise === "1") {
      navigate("atlas", {}, { replace: true });
      requestAnimationFrame(() => {
        document.getElementById("recommend")?.scrollIntoView({ behavior: "smooth", block: "start" });
        document.getElementById("draw-btn")?.click();
      });
      return;
    }

    let focusPlay = page === "home" && parsed.focusPlay;
    if (page === "home" && (params.focus === "play" || params.focus === "featured")) {
      const cleaned = { ...params };
      delete cleaned.focus;
      let cleanHash = "#/home";
      const keys = Object.keys(cleaned).filter((k) => cleaned[k] != null && cleaned[k] !== "");
      if (keys.length) {
        cleanHash +=
          "?" +
          keys
            .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(cleaned[k])}`)
            .join("&");
      }
      if (location.hash !== cleanHash) history.replaceState(null, "", cleanHash);
      focusPlay = true;
    }

    if (focusPlay) scrollToFeatured();
    else window.scrollTo(0, 0);

    listeners.forEach((fn) => {
      try {
        fn(page, params);
      } catch (_) {}
    });

    document.dispatchEvent(
      new CustomEvent("fatum:route", { detail: { page, params } })
    );
  }

  function bindNav() {
    document.addEventListener("click", (e) => {
      const link = e.target.closest("[data-nav]");
      if (!link) return;
      const page = link.getAttribute("data-nav");
      if (!ROUTES.includes(page)) return;
      e.preventDefault();
      const params = {
        ...paramsFromHref(link.getAttribute("href")),
      };
      const continent = link.getAttribute("data-continent");
      if (continent) params.continent = continent;
      const scroll = link.getAttribute("data-scroll");
      if (scroll) params.focus = scroll;
      navigate(page, params);
    });

    const toggle = document.getElementById("nav-toggle");
    const backdrop = document.getElementById("nav-backdrop");
    toggle?.addEventListener("click", () => {
      const open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      if (backdrop) backdrop.hidden = !open;
    });

    backdrop?.addEventListener("click", () => {
      document.body.classList.remove("nav-open");
      toggle?.setAttribute("aria-expanded", "false");
      backdrop.hidden = true;
    });
  }

  function onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function init() {
    bindNav();
    window.addEventListener("hashchange", apply);
    if (!location.hash || location.hash === "#") {
      navigate("home", {}, { replace: true });
    } else {
      apply();
    }
  }

  window.FatumRouter = {
    ROUTES,
    navigate,
    apply,
    getPage: () => current,
    parseHash,
    onChange,
    init,
    t,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
