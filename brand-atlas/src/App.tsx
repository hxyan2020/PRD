import { useEffect, useState } from "react";
import {
  BrowserRouter,
  HashRouter,
  NavLink,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { LanguagePicker } from "./components/LanguagePicker";
import { useAuth } from "./hooks/useAuth";
import { useUnlocks } from "./hooks/useUnlocks";
import { useI18n } from "./i18n/I18nProvider";
import { logOut } from "./lib/auth";
import { AboutPage } from "./pages/AboutPage";
import { AuthPage } from "./pages/AuthPage";
import { CatalogPage } from "./pages/CatalogPage";
import { ContactPage } from "./pages/ContactPage";
import { HomePage } from "./pages/HomePage";
import { ScanPage } from "./pages/ScanPage";
import { SharePage } from "./pages/SharePage";
import { TermsPage } from "./pages/TermsPage";
import { UnlockedPage } from "./pages/UnlockedPage";

const useHashRouter = import.meta.env.BASE_URL !== "/";
const Router = useHashRouter ? HashRouter : BrowserRouter;

function Header() {
  const { t } = useI18n();
  const { count } = useUnlocks();
  const { isLoggedIn, email } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search, location.hash]);

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
    <>
      {menuOpen && (
        <button
          type="button"
          className="nav-backdrop"
          aria-label={t("nav.closeMenu")}
          onClick={closeMenu}
        />
      )}
      <header className="site-header">
        <div className="shell site-header__inner">
          <NavLink to="/" className="brand" end onClick={closeMenu}>
            <img
              className="brand__logo"
              src={`${import.meta.env.BASE_URL}logo-seen.png`}
              alt=""
              width={40}
              height={40}
            />
            <span className="brand__text">
              Seen <span>catalogue</span>
            </span>
          </NavLink>

          <nav
            id="primary-nav"
            className={`nav ${menuOpen ? "is-open" : ""}`}
            aria-label="Primary"
          >
            <div className="nav__mobile-head">
              <span className="nav__mobile-title">{t("nav.menu")}</span>
              <button
                type="button"
                className="nav-close"
                aria-label={t("nav.closeMenu")}
                onClick={closeMenu}
              >
                ×
              </button>
            </div>
            <NavLink to="/" end onClick={closeMenu}>
              {t("nav.home")}
            </NavLink>
            <NavLink to="/catalog" onClick={closeMenu}>
              {t("nav.catalog")}
            </NavLink>
            <NavLink to="/unlocked" onClick={closeMenu}>
              {t("nav.unlocked")}
            </NavLink>
            <NavLink to="/scan" onClick={closeMenu}>
              {t("nav.scan")}
            </NavLink>
            <div className="nav-auth">
              {isLoggedIn ? (
                <button
                  type="button"
                  className="btn btn--quiet btn--tiny"
                  title={email ?? undefined}
                  onClick={() => {
                    logOut();
                    closeMenu();
                  }}
                >
                  {t("nav.logout")}
                </button>
              ) : (
                <NavLink className="btn btn--forest btn--tiny" to="/login" onClick={closeMenu}>
                  {t("nav.login")}
                </NavLink>
              )}
            </div>
          </nav>

          <div className="header-tools header-tools--compact">
            <NavLink
              to="/unlocked"
              className="mono header-progress header-progress--link"
              title={t("header.unlockedTitle")}
              aria-label={t("header.unlocked", { count: String(count) })}
              onClick={closeMenu}
            >
              <svg
                className="header-progress__icon"
                viewBox="0 0 24 24"
                width="18"
                height="18"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  fill="currentColor"
                  d="M5 3.75A1.75 1.75 0 0 1 6.75 2h10.5c.69 0 1.25.56 1.25 1.25V20.5a.75.75 0 0 1-1.12.65l-1.63-.93-1.63.93a.75.75 0 0 1-.74 0L12 20.22l-1.38.93a.75.75 0 0 1-.74 0l-1.63-.93-1.63.93A.75.75 0 0 1 5 20.5V3.75ZM6.5 3.5v15.27l.88-.5a.75.75 0 0 1 .74 0l1.63.93 1.38-.93a.75.75 0 0 1 .74 0l1.38.93 1.63-.93a.75.75 0 0 1 .74 0l.88.5V3.5H6.5Z"
                />
                <path
                  fill="currentColor"
                  d="M8.5 7h7a.75.75 0 0 1 0 1.5h-7A.75.75 0 0 1 8.5 7Zm0 3.25h7a.75.75 0 0 1 0 1.5h-7a.75.75 0 0 1 0-1.5Zm0 3.25h4.5a.75.75 0 0 1 0 1.5H8.5a.75.75 0 0 1 0-1.5Z"
                />
              </svg>
              <span className="header-progress__full">
                {t("header.unlocked", { count: String(count) })}
              </span>
              <span className="header-progress__short" aria-hidden="true">
                <span className="header-progress__label">
                  {t("header.collectionShort")}
                </span>
                <span className="header-progress__count">{count}</span>
              </span>
            </NavLink>
            <LanguagePicker />
            <div className="header-auth-desktop">
              {isLoggedIn ? (
                <button
                  type="button"
                  className="btn btn--quiet btn--tiny"
                  title={email ?? undefined}
                  onClick={() => logOut()}
                >
                  {t("nav.logout")}
                </button>
              ) : (
                <NavLink className="btn btn--forest btn--tiny" to="/login">
                  {t("nav.login")}
                </NavLink>
              )}
            </div>
            <button
              type="button"
              className={`nav-toggle ${menuOpen ? "is-open" : ""}`}
              aria-expanded={menuOpen}
              aria-controls="primary-nav"
              aria-label={menuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}

function Footer() {
  const { t } = useI18n();
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <p>{t("footer.tagline")}</p>
        <nav className="footer-links" aria-label="Site">
          <NavLink to="/about">{t("nav.about")}</NavLink>
          <NavLink to="/contact">{t("nav.contact")}</NavLink>
          <NavLink to="/terms">{t("nav.terms")}</NavLink>
        </nav>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/catalog/:categoryId" element={<CatalogPage />} />
        <Route path="/unlocked" element={<UnlockedPage />} />
        <Route path="/scan" element={<ScanPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/signup" element={<AuthPage mode="signup" />} />
        <Route path="/u/:shareId" element={<SharePage />} />
      </Routes>
      <Footer />
    </Router>
  );
}
