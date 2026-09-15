import { Link } from 'react-router-dom'
import type { DashboardDailyFailure, DashboardSummary } from '../../domain/types.ts'
import { canManageSetup, canOperateQueue } from '../access.ts'
import { DemoPanel } from '../components/DemoPanel.tsx'
import { DataTable, PageHeader, ProgressBar, QueryState, StatusChip } from '../components/ui.tsx'
import { formatDateTime } from '../format.ts'
import { useDemoScenario } from '../hooks/useDemoScenario.ts'
import { useDashboard, useSession } from '../hooks/useFleet.ts'

export function DashboardPage() {
  const dashboard = useDashboard()
  const session = useSession()
  const demo = useDemoScenario()
  const summary = dashboard.data
  const role = session.data?.user.role
  const isAdmin = role === 'admin' || (role ? canManageSetup(role) : false)
  const showDemo = demo.available && role && canOperateQueue(role)

  return (
    <div>
      <PageHeader
        title={isAdmin ? 'Dashboard administrativo' : 'Dashboard'}
        lede={
          isAdmin
            ? 'Visão de todas as garagens e frotas. KPIs do dia, relatório do que não baixou e status por veículo.'
            : 'Porta de entrada da operação. O que concluiu, o que está baixando, o que está pendente e o que falhou.'
        }
      />
      <div className="mt-6 flex flex-col gap-5">
        {showDemo && !isAdmin ? <DemoPanel state={demo.state} running={demo.running} onStart={demo.start} onReset={demo.reset} /> : null}
        <QueryState isLoading={dashboard.isLoading} error={dashboard.error}>
          {summary ? (
            <>
              <KpiStrip summary={summary} />
              {isAdmin ? <GarageOverview summary={summary} /> : null}
              {isAdmin ? <DailyFailureReport summary={summary} /> : null}
              {showDemo && isAdmin ? <DemoPanel state={demo.state} running={demo.running} onStart={demo.start} onReset={demo.reset} /> : null}
              <FleetStatusTable summary={summary} showGarage={isAdmin} />
            </>
          ) : null}
        </QueryState>
      </div>
    </div>
  )
}

function KpiStrip({ summary }: { summary: DashboardSummary }) {
  const total = Math.max(summary.total, 1)
  const cards = [
    { label: 'Concluídos', value: summary.concluded, tone: 'text-emerald-700', bar: 'bg-emerald-500' },
    { label: 'Baixando', value: summary.downloading, tone: 'text-sky-700', bar: 'bg-sky-500' },
    { label: 'Pendentes', value: summary.pending, tone: 'text-amber-700', bar: 'bg-amber-500' },
    { label: 'Com erro', value: summary.withError, tone: 'text-brand', bar: 'bg-brand' },
    { label: 'Total', value: summary.total, tone: 'text-ink', bar: 'bg-ink' },
  ] as const

  return (
    <section className="grid grid-cols-2 gap-3 xl:grid-cols-5" aria-label="Indicadores principais">
      {cards.map((card) => {
        const percent = card.label === 'Total' ? 100 : Math.round((card.value / total) * 100)
        return (
          <article key={card.label} className="rounded-2xl border border-line bg-white p-4">
            <span className="text-xs font-medium text-ink-muted">{card.label}</span>
            <strong className={`mt-2 block text-3xl font-semibold tracking-tight ${card.tone}`}>{String(card.value).padStart(2, '0')}</strong>
            <p className="mt-1 text-xs text-ink-muted">{percent}%</p>
            <span className="mt-3 block h-1 overflow-hidden rounded-full bg-neutral-100">
              <span className={`block h-full ${card.bar}`} style={{ width: `${percent}%` }} />
            </span>
          </article>
        )
      })}
    </section>
  )
}

function GarageOverview({ summary }: { summary: DashboardSummary }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5" aria-label="Garagens">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Garagens e frotas</h2>
          <p className="mt-1 text-sm text-ink-muted">Administração de todas as unidades do sistema.</p>
        </div>
        <Link className="text-sm font-medium text-ink underline-offset-2 hover:text-brand hover:underline" to="/garages">
          Gerenciar garagens
        </Link>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {summary.garages.map((garage) => (
          <article key={garage.garageId} className="rounded-xl border border-line bg-neutral-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-ink">{garage.name}</h3>
                <p className="text-xs text-ink-muted">{garage.city} · {garage.vehicles} veículos</p>
              </div>
              {garage.withError > 0 || garage.pending > 0 ? (
                <span className="rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-brand">
                  {garage.withError + garage.pending} sem download
                </span>
              ) : (
                <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium text-ink-muted">Em dia</span>
              )}
            </div>
            <dl className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
              <div>
                <dt className="text-ink-muted">OK</dt>
                <dd className="mt-0.5 font-semibold text-emerald-700">{garage.concluded}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Baixando</dt>
                <dd className="mt-0.5 font-semibold text-sky-700">{garage.downloading}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Pendente</dt>
                <dd className="mt-0.5 font-semibold text-amber-700">{garage.pending}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Erro</dt>
                <dd className="mt-0.5 font-semibold text-brand">{garage.withError}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  )
}

function DailyFailureReport({ summary }: { summary: DashboardSummary }) {
  const grouped = groupFailures(summary.dailyFailures)
  const garageCount = grouped.length
  const vehicleCount = summary.dailyFailures.length

  return (
    <section className="rounded-2xl border border-line bg-white p-5" aria-label="Relatório de falhas do dia">
      <div className="mb-4">
        <h2 className="text-base font-semibold tracking-tight">Relatório do dia — o que não baixou</h2>
        <p className="mt-1 text-sm text-ink-muted">
          {formatReportDate(summary.reportDate)}. {garageCount === 0
            ? 'Nenhuma falha de download registrada.'
            : `${garageCount} garagem${garageCount > 1 ? 's' : ''} com ${vehicleCount} veículo${vehicleCount > 1 ? 's' : ''} sem vídeo baixado.`}
        </p>
      </div>
      {garageCount === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-neutral-50 px-4 py-8 text-sm text-ink-muted">
          Todas as garagens concluíram o download do dia.
        </p>
      ) : (
        <div className="grid gap-3">
          {grouped.map((group) => (
            <article key={group.garageId} className="rounded-xl border border-red-100 bg-red-50/40 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-semibold text-ink">{group.garageName}</h3>
                <span className="text-xs font-medium text-brand">
                  {group.vehicles.length} veículo{group.vehicles.length > 1 ? 's' : ''} sem download
                </span>
              </div>
              <ul className="mt-3 grid gap-2">
                {group.vehicles.map((item) => (
                  <li key={item.vehicleId} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <Link className="font-medium text-ink hover:text-brand" to={`/vehicles/${item.vehicleId}`}>
                        {item.vehicleName}
                      </Link>
                      <p className="text-xs text-ink-muted">
                        Frota {item.fleetNumber} · {item.clientName} · Placa {item.plate}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-brand">{item.reason}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function FleetStatusTable({ summary, showGarage }: { summary: DashboardSummary; showGarage: boolean }) {
  return (
    <section aria-label="Status da frota">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Status da frota</h2>
          <p className="mt-1 text-sm text-ink-muted">Acompanhamento em tempo real por veículo.</p>
        </div>
        <Link className="text-sm font-medium text-ink underline-offset-2 hover:text-brand hover:underline" to="/fleet">
          Abrir frota
        </Link>
      </div>
      <DataTable
        rows={summary.vehicles}
        empty="Nenhum veículo cadastrado."
        columns={[
          { id: 'vehicle', header: 'Veículo', cell: (row) => <Link to={`/vehicles/${row.vehicleId}`}>{row.name}</Link> },
          ...(showGarage
            ? [
                { id: 'garage', header: 'Base', cell: (row: DashboardSummary['vehicles'][number]) => row.garageName },
                { id: 'client', header: 'Cliente', cell: (row: DashboardSummary['vehicles'][number]) => row.clientName },
                { id: 'fleet', header: 'Frota', cell: (row: DashboardSummary['vehicles'][number]) => row.fleetNumber },
              ]
            : []),
          { id: 'plate', header: 'Placa', cell: (row) => row.plate },
          { id: 'status', header: 'Status', cell: (row) => <StatusChip value={row.status} /> },
          { id: 'cameras', header: 'Câmeras', cell: (row) => `${row.camerasReady}/${row.camerasTotal}` },
          {
            id: 'duration',
            header: 'Duração / progresso',
            cell: (row) =>
              row.status === 'baixando' && row.progress !== null ? (
                <ProgressBar value={row.progress} />
              ) : row.durationMinutes !== null ? (
                `${row.durationMinutes} min`
              ) : (
                '—'
              ),
          },
          {
            id: 'updated',
            header: 'Última atualização',
            cell: (row) => {
              if (row.status === 'pendente') return 'Na fila'
              if (row.status === 'desconectado') return 'Aguardando'
              return formatDateTime(row.lastUpdate)
            },
          },
        ]}
      />
    </section>
  )
}

function groupFailures(rows: DashboardDailyFailure[]) {
  const map = new Map<string, { garageId: string; garageName: string; vehicles: DashboardDailyFailure[] }>()
  for (const row of rows) {
    const current = map.get(row.garageId) ?? { garageId: row.garageId, garageName: row.garageName, vehicles: [] }
    current.vehicles.push(row)
    map.set(row.garageId, current)
  }
  return [...map.values()]
}

function formatReportDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(`${value}T12:00:00`))
}
