/**
 * Auth modal + HUD account controls.
 */
(function () {
  "use strict";

  function t(key, vars) {
    return window.FatumI18n ? window.FatumI18n.t(key, vars) : key;
  }

  function els() {
    return {
      modal: document.getElementById("auth-modal"),
      form: document.getElementById("auth-form"),
      email: document.getElementById("auth-email"),
      password: document.getElementById("auth-password"),
      error: document.getElementById("auth-error"),
      title: document.getElementById("auth-title"),
      submit: document.getElementById("auth-submit"),
      switchBtn: document.getElementById("auth-switch"),
      switchHint: document.getElementById("auth-switch-hint"),
      close: document.getElementById("auth-close"),
      backdrop: document.getElementById("auth-backdrop"),
      modeLogin: document.getElementById("auth-mode-login"),
      modeRegister: document.getElementById("auth-mode-register"),
      openBtn: document.getElementById("auth-open"),
      account: document.getElementById("auth-account"),
      accountEmail: document.getElementById("auth-account-email"),
      logoutBtn: document.getElementById("auth-logout"),
    };
  }

  let mode = "login"; // login | register

  function setMode(next) {
    mode = next === "register" ? "register" : "login";
    const e = els();
    if (e.title) e.title.textContent = t(mode === "login" ? "auth.loginTitle" : "auth.registerTitle");
    if (e.submit) e.submit.textContent = t(mode === "login" ? "auth.login" : "auth.register");
    if (e.switchHint) {
      e.switchHint.textContent = t(mode === "login" ? "auth.needAccount" : "auth.haveAccount");
    }
    if (e.switchBtn) {
      e.switchBtn.textContent = t(mode === "login" ? "auth.createOne" : "auth.signInInstead");
    }
    if (e.modeLogin) e.modeLogin.classList.toggle("is-active", mode === "login");
    if (e.modeRegister) e.modeRegister.classList.toggle("is-active", mode === "register");
    if (e.password) {
      e.password.autocomplete = mode === "register" ? "new-password" : "current-password";
    }
    if (e.error) {
      e.error.hidden = true;
      e.error.textContent = "";
    }
  }

  function showError(key) {
    const e = els();
    if (!e.error) return;
    e.error.hidden = false;
    e.error.textContent = t(key);
  }

  function openModal(startMode) {
    const e = els();
    if (!e.modal) return;
    setMode(startMode || "login");
    e.modal.hidden = false;
    e.modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("auth-open");
    setTimeout(() => e.email && e.email.focus(), 40);
  }

  function closeModal() {
    const e = els();
    if (!e.modal) return;
    e.modal.hidden = true;
    e.modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("auth-open");
    if (e.form) e.form.reset();
    if (e.error) {
      e.error.hidden = true;
      e.error.textContent = "";
    }
  }

  function refreshHud() {
    const e = els();
    const user = window.FatumAuth && window.FatumAuth.currentUser();
    if (user) {
      if (e.openBtn) e.openBtn.hidden = true;
      if (e.account) e.account.hidden = false;
      if (e.accountEmail) {
        e.accountEmail.textContent = user.email;
        e.accountEmail.title = user.email;
      }
      document.body.classList.add("is-signed-in");
    } else {
      if (e.openBtn) e.openBtn.hidden = false;
      if (e.account) e.account.hidden = true;
      document.body.classList.remove("is-signed-in");
    }
  }

  async function onSubmit(ev) {
    ev.preventDefault();
    const e = els();
    const email = e.email && e.email.value;
    const password = e.password && e.password.value;
    if (!window.FatumAuth) return;
    e.submit.disabled = true;
    try {
      const result =
        mode === "register"
          ? await window.FatumAuth.register(email, password)
          : await window.FatumAuth.login(email, password);
      if (!result.ok) {
        showError(result.error || "auth.error.credentials");
        return;
      }
      closeModal();
      refreshHud();
      window.FatumPlay?.showToast?.(
        t(mode === "register" ? "auth.toast.registered" : "auth.toast.signedIn", {
          email: result.email,
        }),
        { ms: 2600 }
      );
      // Refresh journal list / seals if on those pages
      if (window.FatumJournal) {
        window.FatumJournal.renderJournalList(document.getElementById("journal-list"));
      }
      document.dispatchEvent(new CustomEvent("fatum:journal-changed"));
    } catch (err) {
      showError("auth.error.generic");
    } finally {
      e.submit.disabled = false;
    }
  }

  function bind() {
    const e = els();
    e.openBtn?.addEventListener("click", () => openModal("login"));
    e.close?.addEventListener("click", closeModal);
    e.backdrop?.addEventListener("click", closeModal);
    e.form?.addEventListener("submit", onSubmit);
    e.switchBtn?.addEventListener("click", () => setMode(mode === "login" ? "register" : "login"));
    e.modeLogin?.addEventListener("click", () => setMode("login"));
    e.modeRegister?.addEventListener("click", () => setMode("register"));
    e.logoutBtn?.addEventListener("click", () => {
      window.FatumAuth?.logout();
      refreshHud();
      if (window.FatumJournal) {
        window.FatumJournal.renderJournalList(document.getElementById("journal-list"));
      }
      document.dispatchEvent(new CustomEvent("fatum:journal-changed"));
      window.FatumPlay?.showToast?.(t("auth.toast.signedOut"), { ms: 2200 });
    });
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape" && e.modal && !e.modal.hidden) closeModal();
    });
    document.addEventListener("fatum:auth-changed", refreshHud);
    document.addEventListener("fatum:locale-changed", () => {
      setMode(mode);
      refreshHud();
    });
  }

  function init() {
    bind();
    // Restore persistent session into user-data layer
    const user = window.FatumAuth && window.FatumAuth.currentUser();
    if (user && window.FatumUserData) {
      window.FatumUserData.onSignedIn(user.email, { migrateGuest: false });
    }
    refreshHud();
    setMode("login");
  }

  window.FatumAuthUI = { open: openModal, close: closeModal, refresh: refreshHud };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
