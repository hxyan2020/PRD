import { NavLink, useNavigate } from "react-router-dom";
import { useJournal } from "../hooks/useJournal";
import { useAuth } from "../hooks/useAuth";
import { LanguageSwitcher, useI18n } from "../i18n";

export function Header() {
  const { counts } = useJournal();
  const { user, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <header className="site-header">
      <div className="inner">
        <NavLink to="/" className="brand" end>
          <span className="brand-mark" aria-hidden="true" />
          Ludus Atlas
        </NavLink>
        <nav className="nav" aria-label={t("nav.primary")}>
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
                  navigate("/");
                }}
              >
                {t("nav.logout")}
              </button>
            </div>
          ) : (
            <NavLink to="/login">{t("nav.login")}</NavLink>
          )}
          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  );
}
