import { Navigate, Route, Routes } from 'react-router-dom'
import { isPageKey, type PageKey } from './config/menu'
import { AdminLayout } from './layout/AdminLayout'
import { pageComponents } from './pages/registry'

const routeKeys = Object.keys(pageComponents) as PageKey[]

function PageRouter() {
  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<Navigate to="/overview" replace />} />
        {routeKeys.map((key) => {
          const Page = pageComponents[key]
          return <Route key={key} path={key} element={<Page />} />
        })}
        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return <PageRouter />
}

export { isPageKey }
