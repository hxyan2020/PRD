/**
 * Journal page panes: saved rite collection + browsing history.
 */
(function () {
  "use strict";

  function t(key, vars) {
    return window.FatumI18n ? window.FatumI18n.t(key, vars) : key;
  }

  function methodById(id) {
    const list = window.FATE_METHODS || [];
    return list.find((m) => m.id === id) || null;
  }

  function methodName(id, fallback) {
    const m = methodById(id);
    if (!m) return fallback || id;
    if (window.FatumMethodText) return window.FatumMethodText.localize(m).name;
    return m.name;
  }

  function escapeHTML(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderCollection() {
    const listEl = document.getElementById("collection-list");
    const emptyEl = document.getElementById("collection-empty");
    if (!listEl) return;
    const ids = window.FatumUserData ? window.FatumUserData.getCollection() : [];
    if (!ids.length) {
      listEl.innerHTML = "";
      if (emptyEl) emptyEl.hidden = false;
      return;
    }
    if (emptyEl) emptyEl.hidden = true;
    listEl.innerHTML = ids
      .map((id) => {
        const name = methodName(id);
        return `<li class="user-pane__item">
          <a href="#/atlas?method=${encodeURIComponent(id)}" data-nav="atlas">${escapeHTML(name)}</a>
          <button type="button" class="btn btn--ghost btn--small" data-unsave="${escapeHTML(id)}">${escapeHTML(t("collection.remove"))}</button>
        </li>`;
      })
      .join("");
  }

  function renderHistory() {
    const listEl = document.getElementById("history-list");
    const emptyEl = document.getElementById("history-empty");
    if (!listEl) return;
    const rows = window.FatumUserData ? window.FatumUserData.getHistory() : [];
    if (!rows.length) {
      listEl.innerHTML = "";
      if (emptyEl) emptyEl.hidden = false;
      return;
    }
    if (emptyEl) emptyEl.hidden = true;
    listEl.innerHTML = rows
      .map((h) => {
        const name = h.name || methodName(h.methodId);
        const when = window.FatumJournal
          ? window.FatumJournal.formatStamp(h.at)
          : h.at;
        return `<li class="user-pane__item">
          <a href="#/atlas?method=${encodeURIComponent(h.methodId)}" data-nav="atlas">${escapeHTML(name)}</a>
          <time datetime="${escapeHTML(h.at)}">${escapeHTML(when)}</time>
        </li>`;
      })
      .join("");
  }

  function refreshAuthHint() {
    const hint = document.getElementById("journal-auth-hint");
    if (!hint) return;
    const signedIn = window.FatumAuth && window.FatumAuth.isSignedIn();
    hint.hidden = !!signedIn;
  }

  function refresh() {
    renderCollection();
    renderHistory();
    refreshAuthHint();
  }

  function bind() {
    document.getElementById("journal-auth-open")?.addEventListener("click", () => {
      window.FatumAuthUI?.open("login");
    });
    document.getElementById("collection-list")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-unsave]");
      if (!btn || !window.FatumUserData) return;
      window.FatumUserData.toggleCollection(btn.getAttribute("data-unsave"));
      refresh();
    });
    ["fatum:auth-changed", "fatum:collection-changed", "fatum:history-changed", "fatum:userdata-ready", "fatum:locale-changed", "fatum:route"].forEach((ev) => {
      document.addEventListener(ev, refresh);
    });
  }

  function init() {
    bind();
    refresh();
  }

  window.FatumAccountUI = { refresh };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
