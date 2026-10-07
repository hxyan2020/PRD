import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { SiteHeader } from './components/SiteHeader'
import { GalleryPage } from './pages/GalleryPage'
import { HomePage } from './pages/HomePage'
import { PaintingPage } from './pages/PaintingPage'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <SiteHeader />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/painting/:id" element={<PaintingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <footer className="site-footer">
          <p>
            Mille sources painting metadata and images from Wikidata and Wikimedia Commons, with
            introductions drawn from Wikipedia. Works are ranked by multilingual sitelink count as a
            popularity proxy.
          </p>
        </footer>
      </div>
    </BrowserRouter>
  )
}
