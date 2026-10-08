/**
 * Contact page — builds a mailto: draft from the form.
 */
(function () {
  "use strict";

  const CONTACT_TO = "hello@fatumatlas.com";

  function t(key, vars) {
    return window.FatumI18n ? window.FatumI18n.t(key, vars) : key;
  }

  function bind() {
    const form = document.getElementById("contact-form");
    if (!form || form.dataset.bound) return;
    form.dataset.bound = "1";
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = (document.getElementById("contact-name")?.value || "").trim();
      const email = (document.getElementById("contact-email")?.value || "").trim();
      const message = (document.getElementById("contact-message")?.value || "").trim();
      if (!name || !email || !message) {
        form.reportValidity?.();
        return;
      }
      const subject = encodeURIComponent(`Fatum Atlas — message from ${name}`);
      const body = encodeURIComponent(
        `Name: ${name}\nEmail: ${email}\n\n${message}\n`
      );
      window.FatumPlay?.showToast?.(t("contact.toast"), { ms: 2200 });
      window.location.href = `mailto:${CONTACT_TO}?subject=${subject}&body=${body}`;
    });
  }

  function init() {
    bind();
    document.addEventListener("fatum:route", (e) => {
      if (e.detail && e.detail.page === "contact") bind();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
