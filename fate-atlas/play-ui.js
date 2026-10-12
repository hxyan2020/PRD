/**
 * Fatum play loop — HUD, toast, celebrate, quest bar helpers.
 * Pick → Play → Collect
 */
(function () {
  "use strict";

  const toastEl = () => document.getElementById("toast");
  const celebrateEl = () => document.getElementById("celebrate");
  const questFill = () => document.getElementById("quest-bar-fill");

  let toastTimer = null;
  let celebrateTimer = null;

  function escapeHTML(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function updateHud() {
    const methods = window.FATE_METHODS || [];
    const seals = window.FatumJournal ? window.FatumJournal.loadAll().length : 0;
    const mEl = document.getElementById("hud-methods");
    const sEl = document.getElementById("hud-seals");
    if (mEl) mEl.textContent = String(methods.length);
    if (sEl) {
      sEl.textContent = String(seals);
      sEl.parentElement?.classList.toggle("is-hot", seals > 0);
    }
  }

  function showToast(message, opts) {
    const el = toastEl();
    if (!el) return;
    const ms = (opts && opts.ms) || 2800;
    el.hidden = false;
    el.classList.remove("is-out");
    el.textContent = message;
    el.classList.add("is-in");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.classList.remove("is-in");
      el.classList.add("is-out");
      setTimeout(() => {
        el.hidden = true;
        el.classList.remove("is-out");
      }, 280);
    }, ms);
  }

  function t(key, vars) {
    return window.FatumI18n ? window.FatumI18n.t(key, vars) : key;
  }

  function celebrate(title) {
    const el = celebrateEl();
    if (!el) return;
    el.hidden = false;
    el.setAttribute("aria-hidden", "false");
    el.innerHTML = `
      <div class="celebrate__burst" aria-hidden="true"></div>
      <div class="celebrate__card">
        <p class="celebrate__eyebrow">${escapeHTML(t("celebrate.eyebrow"))}</p>
        <p class="celebrate__title">${escapeHTML(title || t("celebrate.fallback"))}</p>
        <p class="celebrate__hint">${escapeHTML(t("celebrate.hint"))}</p>
      </div>`;
    el.classList.add("is-on");
    clearTimeout(celebrateTimer);
    celebrateTimer = setTimeout(() => {
      el.classList.remove("is-on");
      setTimeout(() => {
        el.hidden = true;
        el.setAttribute("aria-hidden", "true");
        el.innerHTML = "";
      }, 400);
    }, 1600);
  }

  function setQuestProgress(ratio) {
    const fill = questFill();
    if (!fill) return;
    const pct = Math.max(0, Math.min(1, Number(ratio) || 0)) * 100;
    fill.style.width = `${pct}%`;
    fill.parentElement?.setAttribute("aria-valuenow", String(Math.round(pct)));
  }

  function surpriseRite() {
    if (window.FatumRouter) {
      window.FatumRouter.navigate("atlas", { surprise: "1" });
      return;
    }
    document.getElementById("draw-btn")?.click();
  }

  function init() {
    updateHud();

    document.addEventListener("fatum:journal-changed", () => {
      updateHud();
    });

    document.getElementById("hero-surprise")?.addEventListener("click", surpriseRite);

    // Soft pulse on HUD when seals change
    document.addEventListener("fatum:seal-collected", (e) => {
      updateHud();
      const title = e.detail?.title || "Seal collected";
      celebrate(title);
      showToast(t("toast.seal", { title }), { ms: 3200 });
    });
  }

  window.FatumPlay = {
    updateHud,
    showToast,
    celebrate,
    setQuestProgress,
    surpriseRite,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
