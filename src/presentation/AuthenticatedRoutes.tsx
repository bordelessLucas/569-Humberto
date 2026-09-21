import { QueryClientProvider } from '@tanstack/react-query'
import { lazy } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { queryClient } from '../services/api/query-client.ts'
import { accessFor } from './access.ts'
import { AppShell } from './components/AppShell.tsx'
import { useSession } from './hooks/useFleet.ts'

const DashboardPage = lazy(() => import('./pages/DashboardPage.tsx').then((module) => ({ default: module.DashboardPage })))
const FleetPage = lazy(() => import('./pages/FleetPage.tsx').then((module) => ({ default: module.FleetPage })))
const VehiclePage = lazy(() => import('./pages/FleetPage.tsx').then((module) => ({ default: module.VehiclePage })))
const GaragesPage = lazy(() => import('./pages/admin.tsx').then((module) => ({ default: module.GaragesPage })))
const DevicesPage = lazy(() => import('./pages/admin.tsx').then((module) => ({ default: module.DevicesPage })))
const CamerasPage = lazy(() => import('./pages/admin.tsx').then((module) => ({ default: module.CamerasPage })))
const StoragePage = lazy(() => import('./pages/admin.tsx').then((module) => ({ default: module.StoragePage })))
const UsersPage = lazy(() => import('./pages/admin.tsx').then((module) => ({ default: module.UsersPage })))
const SettingsPage = lazy(() => import('./pages/admin.tsx').then((module) => ({ default: module.SettingsPage })))
const ConnectionsPage = lazy(() => import('./pages/operations.tsx').then((module) => ({ default: module.ConnectionsPage })))
const SyncListPage = lazy(() => import('./pages/operations.tsx').then((module) => ({ default: module.SyncListPage })))
const SyncDetailPage = lazy(() => import('./pages/operations.tsx').then((module) => ({ default: module.SyncDetailPage })))
const DownloadsPage = lazy(() => import('./pages/operations.tsx').then((module) => ({ default: module.DownloadsPage })))
const ProcessingPage = lazy(() => import('./pages/operations.tsx').then((module) => ({ default: module.ProcessingPage })))
const MediaPage = lazy(() => import('./pages/evidence.tsx').then((module) => ({ default: module.MediaPage })))
const PlayerPage = lazy(() => import('./pages/evidence.tsx').then((module) => ({ default: module.PlayerPage })))
const CameraAuditPage = lazy(() => import('./pages/evidence.tsx').then((module) => ({ default: module.CameraAuditPage })))
const IncidentsPage = lazy(() => import('./pages/evidence.tsx').then((module) => ({ default: module.IncidentsPage })))
const ActivityPage = lazy(() => import('./pages/evidence.tsx').then((module) => ({ default: module.ActivityPage })))
const ReportsPage = lazy(() => import('./pages/evidence.tsx').then((module) => ({ default: module.ReportsPage })))

function RequireAuth() {
  const session = useSession()
  if (session.isLoading) return <p className="text-sm leading-6 text-ink-muted">Carregando...</p>
  if (!session.data) return <Navigate to="/login" replace />
  return <Outlet />
}

function RoleGate() {
  const session = useSession()
  const location = useLocation()
  const role = session.data?.user.role
  if (!role) return null
  if (accessFor(role, location.pathname) === 'none') return <Navigate to="/dashboard" replace />
  return <AppShell />
}

export function AuthenticatedRoutes() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route element={<RequireAuth />}>
          <Route element={<RoleGate />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="fleet" element={<FleetPage />} />
            <Route path="vehicles/:id" element={<VehiclePage />} />
            <Route path="garages" element={<GaragesPage />} />
            <Route path="devices" element={<DevicesPage />} />
            <Route path="cameras" element={<CamerasPage />} />
            <Route path="connections" element={<ConnectionsPage />} />
            <Route path="synchronizations" element={<SyncListPage />} />
            <Route path="synchronizations/:id" element={<SyncDetailPage />} />
            <Route path="downloads" element={<DownloadsPage />} />
            <Route path="processing" element={<ProcessingPage />} />
            <Route path="media" element={<MediaPage />} />
            <Route path="media/:id" element={<PlayerPage />} />
            <Route path="camera-audit" element={<CameraAuditPage />} />
            <Route path="incidents" element={<IncidentsPage />} />
            <Route path="activity" element={<ActivityPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="storage" element={<StoragePage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Routes>
    </QueryClientProvider>
  )
}
