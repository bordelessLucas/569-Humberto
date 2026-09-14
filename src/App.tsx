import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { accessFor } from './presentation/access.ts'
import { AppShell } from './presentation/components/AppShell.tsx'
import { CamerasPage, DevicesPage, GaragesPage, SettingsPage, StoragePage, UsersPage } from './presentation/pages/admin.tsx'
import { DashboardPage } from './presentation/pages/DashboardPage.tsx'
import { ActivityPage, CameraAuditPage, IncidentsPage, MediaPage, PlayerPage, ReportsPage } from './presentation/pages/evidence.tsx'
import { FleetPage, VehiclePage } from './presentation/pages/FleetPage.tsx'
import { LoginPage } from './presentation/pages/LoginPage.tsx'
import { ConnectionsPage, DownloadsPage, ProcessingPage, SyncDetailPage, SyncListPage } from './presentation/pages/operations.tsx'
import { useSession } from './presentation/hooks/useFleet.ts'

function RequireAuth() {
  const session = useSession()
  if (session.isLoading) return <p className="text-sm leading-6 text-ink-muted">Carregando…</p>
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

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<RoleGate />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
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
  )
}
