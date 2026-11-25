import { useEffect, useId, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useJournal } from "../hooks/useJournal";
import { useAuth } from "../hooks/useAuth";
import { LanguageSwitcher, useI18n } from "../i18n";

export function Header() {
  const { counts } = useJournal();
  const { user, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    document.body.classList.toggle("nav-open", menuOpen);
    return () => document.body.classList.remove("nav-open");
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header className={`site-header${menuOpen ? " is-open" : ""}`}>
      <div className="inner">
        <NavLink to="/" className="brand" end>
          <span className="brand-mark" aria-hidden="true" />
          Ludus Atlas
        </NavLink>

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={menuOpen}
          aria-controls={menuId}
          aria-label={menuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="nav-toggle-bars" aria-hidden="true" />
        </button>

        <nav
          id={menuId}
          className={`nav${menuOpen ? " is-open" : ""}`}
          aria-label={t("nav.primary")}
        >
          <NavLink to="/" end>
            {t("nav.home")}
          </NavLink>
          <NavLink to="/collection">{t("nav.collection")}</NavLink>
          <NavLink to="/guide">{t("nav.guide")}</NavLink>
          <NavLink to="/preferences">{t("nav.preferences")}</NavLink>
          <NavLink to="/journal">
            {t("nav.journal")}
            {isLoggedIn && counts.total > 0 ? (
              <span
                className="nav-count"
                aria-label={t("nav.journalCount", { n: counts.total })}
              >
                {counts.total}
              </span>
            ) : null}
          </NavLink>
          {isLoggedIn ? (
            <div className="nav-account">
              <span className="nav-email" title={user?.email}>
                {user?.email}
              </span>
              <button
                type="button"
                className="nav-logout"
                onClick={() => {
                  logout();
                  setMenuOpen(false);
                  navigate("/");
                }}
              >
                {t("nav.logout")}
              </button>
            </div>
          ) : (
            <NavLink to="/login">{t("nav.login")}</NavLink>
          )}
          <div className="nav-lang">
            <LanguageSwitcher />
          </div>
        </nav>
      </div>
      {menuOpen ? (
        <button
          type="button"
          className="nav-backdrop"
          aria-label={t("nav.closeMenu")}
          onClick={() => setMenuOpen(false)}
        />
      ) : null}
    </header>
  );
}
