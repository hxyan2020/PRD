import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ScrollToTop } from './components/ScrollToTop'
import { SiteHeader } from './components/SiteHeader'
import { PaintingsProvider } from './data/PaintingsProvider'
import { I18nProvider, useI18n } from './i18n/I18nContext'
import { CollectionPage } from './pages/CollectionPage'
import { GalleryPage } from './pages/GalleryPage'
import { HomePage } from './pages/HomePage'
import { PaintingPage } from './pages/PaintingPage'
import { PreferencesPage } from './pages/PreferencesPage'
import { TodayPage } from './pages/TodayPage'
import './App.css'

function Footer() {
  const { t } = useI18n()
  return (
    <footer className="site-footer">
      <p>{t('footer')}</p>
    </footer>
  )
}

export default function App() {
  return (
    <I18nProvider>
      <PaintingsProvider>
        <HashRouter>
          <ScrollToTop />
          <div className="app-shell">
            <SiteHeader />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/today" element={<TodayPage />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/collection" element={<CollectionPage />} />
              <Route path="/preferences" element={<PreferencesPage />} />
              <Route path="/painting/:id" element={<PaintingPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Footer />
          </div>
        </HashRouter>
      </PaintingsProvider>
    </I18nProvider>
  )
}
