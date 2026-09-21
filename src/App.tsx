import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from './presentation/pages/LoginPage.tsx'

const AuthenticatedRoutes = lazy(() => import('./presentation/AuthenticatedRoutes.tsx').then((module) => ({ default: module.AuthenticatedRoutes })))

export default function App() {
  return (
    <Suspense fallback={<p className="p-6 text-sm leading-6 text-ink-muted">Carregando...</p>}>
      <Routes>
        <Route index element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={<AuthenticatedRoutes />} />
      </Routes>
    </Suspense>
  )
}
