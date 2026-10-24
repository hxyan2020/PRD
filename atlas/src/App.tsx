import {
  BrowserRouter,
  HashRouter,
  Route,
  Routes,
} from "react-router-dom";
import { Header } from "./components/Header";
import { HomePage } from "./pages/HomePage";
import { CollectionPage } from "./pages/CollectionPage";
import { GameDetailPage } from "./pages/GameDetailPage";
import { JournalPage } from "./pages/JournalPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { GuidePage } from "./pages/GuidePage";
import { PreferencesPage } from "./pages/PreferencesPage";

/** GitHub Pages serves the app under /PRD/ludus-atlas/; hash routes keep deep links working. */
const useHashRouter = import.meta.env.BASE_URL !== "/";
const Router = useHashRouter ? HashRouter : BrowserRouter;

export default function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/collection" element={<CollectionPage />} />
        <Route path="/guide" element={<GuidePage />} />
        <Route path="/preferences" element={<PreferencesPage />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/game/:slug" element={<GameDetailPage />} />
      </Routes>
    </Router>
  );
}
