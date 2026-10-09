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
          aria-label="Close menu"
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

          <div className="header-tools header-tools--compact">
            <div className="muted mono header-progress" title="Unlocked by you">
              {count} unlocked
            </div>
            <LanguagePicker />
            <div className="header-auth-desktop">
              {isLoggedIn ? (
                <div className="auth-chip">
                  <span className="auth-chip__email" title={email ?? undefined}>
                    {email}
                  </span>
                  <button type="button" className="btn btn--quiet btn--tiny" onClick={() => logOut()}>
                    {t("nav.logout")}
                  </button>
                </div>
              ) : (
                <>
                  <NavLink className="btn btn--quiet btn--tiny" to="/login">
                    {t("nav.login")}
                  </NavLink>
                  <NavLink className="btn btn--forest btn--tiny" to="/signup">
                    {t("nav.signup")}
                  </NavLink>
                </>
              )}
            </div>
            <button
              type="button"
              className={`nav-toggle ${menuOpen ? "is-open" : ""}`}
              aria-expanded={menuOpen}
              aria-controls="primary-nav"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>

          <nav
            id="primary-nav"
            className={`nav ${menuOpen ? "is-open" : ""}`}
            aria-label="Primary"
          >
            <div className="nav__mobile-head">
              <span className="nav__mobile-title">Menu</span>
              <button
                type="button"
                className="nav-close"
                aria-label="Close menu"
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
            <NavLink to="/scan" onClick={closeMenu}>
              {t("nav.scan")}
            </NavLink>
            <NavLink to="/about" onClick={closeMenu}>
              {t("nav.about")}
            </NavLink>
            <NavLink to="/contact" onClick={closeMenu}>
              {t("nav.contact")}
            </NavLink>
            <NavLink to="/terms" onClick={closeMenu}>
              {t("nav.terms")}
            </NavLink>
            <div className="nav-auth">
              {isLoggedIn ? (
                <>
                  <span className="auth-chip__email" title={email ?? undefined}>
                    {email}
                  </span>
                  <button
                    type="button"
                    className="btn btn--quiet btn--tiny"
                    onClick={() => {
                      logOut();
                      closeMenu();
                    }}
                  >
                    {t("nav.logout")}
                  </button>
                </>
              ) : (
                <>
                  <NavLink className="btn btn--quiet btn--tiny" to="/login" onClick={closeMenu}>
                    {t("nav.login")}
                  </NavLink>
                  <NavLink className="btn btn--forest btn--tiny" to="/signup" onClick={closeMenu}>
                    {t("nav.signup")}
                  </NavLink>
                </>
              )}
            </div>
          </nav>
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
        <div className="footer-links">
          <NavLink to="/contact">{t("nav.contact")}</NavLink>
          <NavLink to="/terms">{t("nav.terms")}</NavLink>
          <NavLink to="/about">{t("nav.about")}</NavLink>
        </div>
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
