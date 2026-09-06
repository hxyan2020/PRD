import { useEffect, useId, useRef, useState } from "react";
import { ABOUT_SECTIONS, TERMS_SECTIONS } from "./pages.js";
import { useI18n } from "./I18n.jsx";

const MENU_LINKS = [
  ["collections", "collections"],
  ["log", "recommendLog"],
  ["about", "aboutNav"],
  ["terms", "termsNav"],
];

export function SiteMenu({ page }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const navId = useId();

  useEffect(() => {
    const onHash = () => setOpen(false);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={`menu-bar ${open ? "is-open" : ""}`} ref={rootRef}>
      <button
        type="button"
        className="menu-toggle"
        aria-expanded={open}
        aria-controls={navId}
        aria-label={open ? t("menuClose") : t("menuOpen")}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="menu-toggle-bars" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>
      <nav id={navId} className="menu-nav" aria-label={t("menu")}>
        {MENU_LINKS.map(([hash, key]) => (
          <a key={hash} href={`#${hash}`} className={page === hash ? "is-on" : ""}>
            {t(key)}
          </a>
        ))}
      </nav>
    </div>
  );
}

export function SiteDoc({ page }) {
  const { t } = useI18n();
  const isAbout = page === "about";
  const sections = isAbout ? ABOUT_SECTIONS : TERMS_SECTIONS;
  return (
    <article className="site-doc" aria-label={isAbout ? t("aboutTitle") : t("termsTitle")}>
      <p className="eyebrow">{isAbout ? t("aboutEyebrow") : t("termsEyebrow")}</p>
      <h2>{isAbout ? t("aboutTitle") : t("termsTitle")}</h2>
      <p className="site-doc-lead">{isAbout ? t("aboutLead") : t("termsUpdated")}</p>
      {sections.map(([titleKey, bodyKey]) => (
        <section key={titleKey}>
          <h3>{t(titleKey)}</h3>
          <p>{t(bodyKey)}</p>
        </section>
      ))}
    </article>
  );
}
