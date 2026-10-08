import {
  BrowserRouter,
  HashRouter,
  NavLink,
  Route,
  Routes,
} from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { CatalogPage } from "./pages/CatalogPage";
import { ScanPage } from "./pages/ScanPage";
import { AboutPage } from "./pages/AboutPage";
import { useUnlocks } from "./hooks/useUnlocks";

const useHashRouter = import.meta.env.BASE_URL !== "/";
const Router = useHashRouter ? HashRouter : BrowserRouter;

function Header() {
  const { count } = useUnlocks();
  return (
    <header className="site-header">
      <div className="shell site-header__inner">
        <NavLink to="/" className="brand">
          Seen <span>catalogue</span>
        </NavLink>
        <nav className="nav" aria-label="Primary">
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/catalog">Catalogue</NavLink>
          <NavLink to="/scan">Scan</NavLink>
          <NavLink to="/about">About</NavLink>
        </nav>
        <div className="muted mono" title="Unlocked items">
          {count} unlocked
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell">
        Seen keeps a living catalogue of brands and living things still around.
        Photograph or upload → identify → unlock. Refreshed every week.
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
      </Routes>
      <Footer />
    </Router>
  );
}
