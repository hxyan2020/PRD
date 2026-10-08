import {
  BrowserRouter,
  HashRouter,
  NavLink,
  Route,
  Routes,
} from "react-router-dom";
import { LanguagePicker } from "./components/LanguagePicker";
import { useAuth } from "./hooks/useAuth";
import { useUnlocks } from "./hooks/useUnlocks";
import { useI18n } from "./i18n/I18nProvider";
import { logOut } from "./lib/auth";
import { formatPct } from "./lib/unlocks";
import { useCatalog } from "./hooks/useCatalog";
import { overallProgress } from "./lib/progress";
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
  const { catalog } = useCatalog();
  const { isLoggedIn, email } = useAuth();
  const pct = catalog ? overallProgress(catalog).pct : 0;

  return (
    <header className="site-header">
      <div className="shell site-header__inner">
        <NavLink to="/" className="brand" end>
          Seen <span>catalogue</span>
        </NavLink>
        <nav className="nav" aria-label="Primary">
          <NavLink to="/" end>
            {t("nav.home")}
          </NavLink>
          <NavLink to="/catalog">{t("nav.catalog")}</NavLink>
          <NavLink to="/scan">{t("nav.scan")}</NavLink>
          <NavLink to="/about">{t("nav.about")}</NavLink>
          <NavLink to="/contact">{t("nav.contact")}</NavLink>
          <NavLink to="/terms">{t("nav.terms")}</NavLink>
        </nav>
        <div className="header-tools">
          <LanguagePicker />
          <div className="muted mono header-progress" title="Overall unlock progress">
            {count} · {formatPct(pct)}
          </div>
          {isLoggedIn ? (
            <button type="button" className="btn btn--quiet btn--tiny" onClick={() => logOut()}>
              {t("nav.logout")}
              <span className="sr-only"> ({email})</span>
            </button>
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
      </div>
    </header>
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
