(function () {
  "use strict";

  const J = () => window.FatumJournal;

  function refresh() {
    if (!J()) return;
    J().renderJournalList(document.getElementById("journal-list"));
  }

  function openDetail(id) {
    const entry = J().get(id);
    if (!entry) return;
    const modal = document.getElementById("journal-detail");
    const body = document.getElementById("journal-detail-body");
    const title = document.getElementById("journal-detail-title");
    if (!modal || !body) return;
    title.textContent = entry.title;
    body.innerHTML =
      J().renderEntryDetail(entry) +
      `<div class="studio__actions">
        <button type="button" class="btn btn--ghost studio__btn-muted" data-close-detail>Close</button>
        <button type="button" class="btn btn--primary" data-read="${entry.methodId || ""}">Read this method again</button>
      </div>`;
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("studio-open");
  }

  function closeDetail() {
    const modal = document.getElementById("journal-detail");
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    if (document.getElementById("reading-studio")?.hidden !== false) {
      document.body.classList.remove("studio-open");
    }
  }

  function init() {
    refresh();

    document.addEventListener("fatum:journal-changed", refresh);
    document.addEventListener("fatum:locale-changed", refresh);

    document.getElementById("journal-clear")?.addEventListener("click", () => {
      if (!J().loadAll().length) return;
      const msg = window.FatumI18n
        ? window.FatumI18n.t("journal.clearConfirm")
        : "Clear all seals from this browser?";
      if (confirm(msg)) {
        J().clearAll();
        refresh();
      }
    });

    document.getElementById("journal-list")?.addEventListener("click", (e) => {
      const view = e.target.closest("[data-journal-view]");
      const del = e.target.closest("[data-journal-delete]");
      if (view) {
        openDetail(view.getAttribute("data-journal-view"));
      }
      if (del) {
        const id = del.getAttribute("data-journal-delete");
        const msg = window.FatumI18n
          ? window.FatumI18n.t("journal.removeConfirm")
          : "Remove this seal?";
        if (confirm(msg)) {
          J().remove(id);
          refresh();
        }
      }
    });

    const detail = document.getElementById("journal-detail");
    detail?.addEventListener("click", (e) => {
      if (e.target === detail || e.target.closest("[data-close-detail]")) closeDetail();
      const relaunch = e.target.closest("[data-read]");
      if (relaunch && relaunch.getAttribute("data-read")) {
        closeDetail();
        // reading.js listens for [data-read] clicks
      }
    });
    document.getElementById("journal-detail-close")?.addEventListener("click", closeDetail);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && detail && !detail.hidden) closeDetail();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
