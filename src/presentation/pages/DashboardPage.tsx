import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { DashboardDailyFailure, DashboardSummary } from '../../domain/types.ts'
import { queryKeys } from '../../services/api/query-keys.ts'
import { canManageSetup, canOperateQueue } from '../access.ts'
import { DemoPanel } from '../components/DemoPanel.tsx'
import { GarageArrivalPanel } from '../components/GarageArrivalPanel.tsx'
import { DataTable, PageHeader, ProgressBar, QueryState, StatusChip } from '../components/ui.tsx'
import { formatDateTime } from '../format.ts'
import { useDemoScenario } from '../hooks/useDemoScenario.ts'
import { useDashboard, useGarageIngestStatus, useSession } from '../hooks/useFleet.ts'

export function DashboardPage() {
  const dashboard = useDashboard()
  const session = useSession()
  const demo = useDemoScenario()
  const ingest = useGarageIngestStatus(true)
  const queryClient = useQueryClient()
  const summary = dashboard.data
  const role = session.data?.user.role
  const isAdmin = role === 'admin' || (role ? canManageSetup(role) : false)
  const showDemo = demo.available && role && canOperateQueue(role)
  const canIngest = role ? canOperateQueue(role) : false

  useEffect(() => {
    const phase = ingest.data?.phase
    if (!phase || phase === 'idle') return
    void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    void queryClient.invalidateQueries({ queryKey: queryKeys.vehicles })
    void queryClient.invalidateQueries({ queryKey: queryKeys.activity })
    void queryClient.invalidateQueries({ queryKey: queryKeys.files })
    void queryClient.invalidateQueries({ queryKey: queryKeys.transfers })
    void queryClient.invalidateQueries({ queryKey: queryKeys.syncRuns })
    void queryClient.invalidateQueries({ queryKey: queryKeys.connections })
  }, [ingest.data?.phase, ingest.data?.progress, ingest.data?.filesStored, queryClient])

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title={isAdmin ? 'Dashboard administrativo' : 'Dashboard'}
        lede={
          isAdmin
            ? 'Status das bases e da frota. Download fica no servidor local da garagem.'
            : 'O que concluiu, o que está baixando, o que está pendente e o que falhou.'
        }
      />

      <div className="mt-8 flex flex-col gap-6">
        <QueryState isLoading={dashboard.isLoading} error={dashboard.error} loadingLabel="Carregando indicadores…">
          {summary ? <KpiStrip summary={summary} /> : null}
        </QueryState>

        {canIngest ? <GarageArrivalPanel enabled={canIngest} /> : null}

        <QueryState isLoading={dashboard.isLoading} error={null} showSkeleton={false}>
          {summary ? (
            <>
              {isAdmin ? <GarageOverview summary={summary} /> : null}
              {isAdmin ? <DailyFailureReport summary={summary} /> : null}
              <FleetStatusTable summary={summary} showGarage={isAdmin} />
            </>
          ) : null}
        </QueryState>

        {showDemo ? <DemoPanel state={demo.state} running={demo.running} onStart={demo.start} onReset={demo.reset} /> : null}
      </div>
    </div>
  )
}

function KpiStrip({ summary }: { summary: DashboardSummary }) {
  const total = Math.max(summary.total, 1)
  const cards = [
    { label: 'Concluídos', value: summary.concluded, valueClass: 'text-ink', bar: 'bg-ink' },
    { label: 'Baixando', value: summary.downloading, valueClass: 'text-ink', bar: 'bg-neutral-500' },
    { label: 'Pendentes', value: summary.pending, valueClass: 'text-ink', bar: 'bg-neutral-400' },
    { label: 'Com erro', value: summary.withError, valueClass: 'text-brand', bar: 'bg-brand' },
    { label: 'Total', value: summary.total, valueClass: 'text-ink', bar: 'bg-ink' },
  ] as const

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5" aria-label="Indicadores principais">
      {cards.map((card) => {
        const percent = card.label === 'Total' ? 100 : Math.round((card.value / total) * 100)
        return (
          <article key={card.label} className="rounded-lg border border-line bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
            <span className="text-[11px] font-medium tracking-wide text-ink-muted">{card.label}</span>
            <strong className={`mt-2 block text-3xl font-semibold tracking-tight tabular-nums ${card.valueClass}`}>
              {card.value}
            </strong>
            {card.label === 'Total' ? (
              <p className="mt-1 text-[11px] text-ink-muted">Frota monitorada</p>
            ) : (
              <p className="mt-1 text-[11px] tabular-nums text-ink-muted">{percent}% da frota</p>
            )}
            <span className="mt-3 block h-1 overflow-hidden rounded-full bg-neutral-100" aria-hidden="true">
              <span className={`block h-full ${card.bar}`} style={{ width: `${percent}%` }} />
            </span>
          </article>
        )
      })}
    </section>
  )
}

function SectionHead({
  title,
  lede,
  action,
}: {
  title: string
  lede: string
  action?: { to: string; label: string }
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0 max-w-2xl">
        <h2 className="text-pretty text-base font-semibold tracking-tight text-ink">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-ink-muted">{lede}</p>
      </div>
      {action ? (
        <Link
          className="shrink-0 text-sm font-medium text-ink underline-offset-2 transition-colors hover:text-brand hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          to={action.to}
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  )
}

function GarageOverview({ summary }: { summary: DashboardSummary }) {
  return (
    <section className="rounded-lg border border-line bg-white p-5" aria-label="Garagens">
      <SectionHead
        title="Garagens e frotas"
        lede="Resumo por unidade. Priorize bases com pendência ou erro."
        action={{ to: '/garages', label: 'Gerenciar garagens' }}
      />
      <div className="grid gap-3 md:grid-cols-2">
        {summary.garages.map((garage) => {
          const attention = garage.withError > 0 || garage.pending > 0
          return (
            <article
              key={garage.garageId}
              className={`rounded-lg border p-4 ${attention ? 'border-brand/25 bg-red-50/30' : 'border-line bg-neutral-50'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-ink">{garage.name}</h3>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {garage.city}
                    <span className="text-ink-muted/50"> · </span>
                    <span className="tabular-nums">{garage.vehicles}</span> veículos
                  </p>
                </div>
                {attention ? (
                  <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-medium text-brand">
                    <span className="tabular-nums">{garage.withError + garage.pending}</span> sem download
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-medium text-ink-muted">Em dia</span>
                )}
              </div>
              <dl className="mt-4 grid grid-cols-4 gap-2 border-t border-line/80 pt-3 text-center text-xs">
                <div>
                  <dt className="text-ink-muted">OK</dt>
                  <dd className="mt-0.5 font-semibold tabular-nums text-ink">{garage.concluded}</dd>
                </div>
                <div>
                  <dt className="text-ink-muted">Baixando</dt>
                  <dd className="mt-0.5 font-semibold tabular-nums text-ink">{garage.downloading}</dd>
                </div>
                <div>
                  <dt className="text-ink-muted">Pendente</dt>
                  <dd className="mt-0.5 font-semibold tabular-nums text-ink">{garage.pending}</dd>
                </div>
                <div>
                  <dt className="text-ink-muted">Erro</dt>
                  <dd className={`mt-0.5 font-semibold tabular-nums ${garage.withError > 0 ? 'text-brand' : 'text-ink'}`}>{garage.withError}</dd>
                </div>
              </dl>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function DailyFailureReport({ summary }: { summary: DashboardSummary }) {
  const grouped = groupFailures(summary.dailyFailures)
  const garageCount = grouped.length
  const vehicleCount = summary.dailyFailures.length

  return (
    <section className="rounded-lg border border-line bg-white p-5" aria-label="Relatório de falhas do dia">
      <SectionHead
        title="O que não baixou hoje"
        lede={
          garageCount === 0
            ? `${formatReportDate(summary.reportDate)}. Nenhuma falha de download registrada.`
            : `${formatReportDate(summary.reportDate)}. ${garageCount} garagem${garageCount > 1 ? 's' : ''} · ${vehicleCount} veículo${vehicleCount > 1 ? 's' : ''} sem vídeo.`
        }
      />
      {garageCount === 0 ? (
        <p className="rounded-lg border border-dashed border-line bg-neutral-50 px-4 py-8 text-center text-sm text-ink-muted">
          Nada pendente hoje — todas as bases concluíram o download.
        </p>
      ) : (
        <div className="grid gap-3">
          {grouped.map((group) => (
            <article key={group.garageId} className="rounded-lg border border-brand/20 bg-red-50/35 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-semibold text-ink">{group.garageName}</h3>
                <span className="text-[11px] font-medium tabular-nums text-brand">
                  {group.vehicles.length} veículo{group.vehicles.length > 1 ? 's' : ''}
                </span>
              </div>
              <ul className="mt-3 grid gap-2">
                {group.vehicles.map((item) => (
                  <li
                    key={item.vehicleId}
                    className="flex flex-col gap-2 rounded-lg border border-line bg-white px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <Link
                        className="font-medium text-ink underline-offset-2 transition-colors hover:text-brand hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                        to={`/vehicles/${item.vehicleId}`}
                      >
                        {item.vehicleName}
                      </Link>
                      <p className="truncate text-xs text-ink-muted">
                        Frota {item.fleetNumber}
                        <span className="text-ink-muted/50"> · </span>
                        {item.clientName}
                        <span className="text-ink-muted/50"> · </span>
                        <span translate="no">{item.plate}</span>
                      </p>
                    </div>
                    <span className="max-w-full shrink-0 text-xs font-medium leading-5 text-brand sm:max-w-[14rem] sm:text-right">
                      {item.reason}
                    </span>
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
      <SectionHead
        title="Status da frota"
        lede="Acompanhamento por veículo — status, câmeras e última atualização."
        action={{ to: '/fleet', label: 'Abrir frota' }}
      />
      <DataTable
        rows={summary.vehicles}
        empty="Nenhum veículo cadastrado."
        rowKey={(row) => row.vehicleId}
        columns={[
          {
            id: 'vehicle',
            header: 'Veículo',
            cell: (row) => (
              <Link
                className="underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                to={`/vehicles/${row.vehicleId}`}
              >
                {row.name}
              </Link>
            ),
          },
          ...(showGarage
            ? [
                { id: 'garage', header: 'Base', cell: (row: DashboardSummary['vehicles'][number]) => <span className="max-w-[9rem] truncate">{row.garageName}</span> },
                { id: 'client', header: 'Cliente', cell: (row: DashboardSummary['vehicles'][number]) => row.clientName },
                { id: 'fleet', header: 'Frota', cell: (row: DashboardSummary['vehicles'][number]) => <span className="tabular-nums">{row.fleetNumber}</span> },
              ]
            : []),
          { id: 'plate', header: 'Placa', cell: (row) => <span translate="no">{row.plate}</span> },
          { id: 'status', header: 'Status', cell: (row) => <StatusChip value={row.status} /> },
          {
            id: 'cameras',
            header: 'Câmeras',
            cell: (row) => (
              <span className="tabular-nums">
                {row.camerasReady}/{row.camerasTotal}
              </span>
            ),
          },
          {
            id: 'duration',
            header: 'Duração / progresso',
            cell: (row) =>
              row.status === 'baixando' && row.progress !== null ? (
                <ProgressBar value={row.progress} />
              ) : row.durationMinutes !== null ? (
                <span className="tabular-nums">{row.durationMinutes} min</span>
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
