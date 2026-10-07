import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { Curriculum } from './pages/Curriculum'
import { DayLessonPage } from './pages/DayLesson'
import { Glossary } from './pages/Glossary'
import { UseCases } from './pages/UseCases'
import { OpsPlaybook } from './pages/OpsPlaybook'
import { Career } from './pages/Career'
import { Tracker } from './pages/Tracker'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="curriculum" element={<Curriculum />} />
          <Route path="tracker" element={<Tracker />} />
          <Route path="day/:day" element={<DayLessonPage />} />
          <Route path="glossary" element={<Glossary />} />
          <Route path="use-cases" element={<UseCases />} />
          <Route path="ops" element={<OpsPlaybook />} />
          <Route path="career" element={<Career />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
