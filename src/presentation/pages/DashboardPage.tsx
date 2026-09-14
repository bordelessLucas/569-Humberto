import { Link } from 'react-router-dom'
import { canOperateQueue } from '../access.ts'
import { DemoPanel } from '../components/DemoPanel.tsx'
import { DataTable, PageHeader, ProgressBar, QueryState, StatusChip } from '../components/ui.tsx'
import { formatBytes, formatDateTime } from '../format.ts'
import { useDemoScenario } from '../hooks/useDemoScenario.ts'
import { useDashboard, useSession, useStorage } from '../hooks/useFleet.ts'

export function DashboardPage() {
  const dashboard = useDashboard()
  const storage = useStorage()
  const session = useSession()
  const demo = useDemoScenario()
  const summary = dashboard.data
  const role = session.data?.user.role
  const showDemo = demo.available && role && canOperateQueue(role)

  return (
    <div>
      <PageHeader title="Dashboard" lede="Porta de entrada da operação. O que concluiu, o que está baixando, o que está pendente e o que falhou." />
      <div className="mt-6 flex flex-col gap-4">
        {showDemo ? <DemoPanel state={demo.state} running={demo.running} onStart={demo.start} onReset={demo.reset} /> : null}
        <QueryState isLoading={dashboard.isLoading} error={dashboard.error}>
          {summary ? (
            <>
              <section className="grid grid-cols-2 gap-3 xl:grid-cols-5" aria-label="Indicadores principais">
                <Kpi value={summary.concluded} label="Concluídos" />
                <Kpi value={summary.downloading} label="Baixando" />
                <Kpi value={summary.pending} label="Pendentes" />
                <Kpi value={summary.withError} label="Com erro" />
                <Kpi value={summary.total} label="Total" />
              </section>
              <section className="grid grid-cols-2 gap-3 xl:grid-cols-5" aria-label="Indicadores da operação">
                <Kpi value={summary.connected} label="Conectados" />
                <Kpi value={summary.activeSyncs} label="Sincronizações" />
                <Kpi value={summary.activeDownloads} label="Downloads ativos" />
                <Kpi value={summary.camerasOnline} label="Câmeras online" />
                <Kpi value={summary.segments15} label="Blocos de 15 min" />
              </section>
              <p className="text-sm text-ink-muted">
                Arquivos processados: {summary.filesProcessed}. Storage utilizado: {summary.storageUsedPercent}%
                {storage.data ? ` (${formatBytes(storage.data.status.usedBytes)})` : ''}.
              </p>
              <DataTable
                rows={summary.vehicles}
                empty="Nenhum veículo cadastrado."
                columns={[
                  { id: 'vehicle', header: 'Veículo', cell: (row) => <Link to={`/vehicles/${row.vehicleId}`}>{row.name}</Link> },
                  { id: 'plate', header: 'Placa', cell: (row) => row.plate },
                  { id: 'status', header: 'Status', cell: (row) => <StatusChip value={row.status} /> },
                  { id: 'cameras', header: 'Câmeras', cell: (row) => `${row.camerasReady}/${row.camerasTotal}` },
                  { id: 'progress', header: 'Progresso', cell: (row) => <ProgressBar value={row.progress} /> },
                  { id: 'updated', header: 'Atualização', cell: (row) => formatDateTime(row.lastUpdate) },
                ]}
              />
            </>
          ) : null}
        </QueryState>
      </div>
    </div>
  )
}

function Kpi({ value, label }: { value: number; label: string }) {
  return (
    <article className="rounded-2xl border border-line bg-white p-4">
      <strong className="block text-3xl font-semibold tracking-tight">{value}</strong>
      <span className="mt-1 block text-xs text-ink-muted">{label}</span>
    </article>
  )
}
