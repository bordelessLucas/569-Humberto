import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { FileQuery, FileStatus } from '../../domain/types.ts'
import { canExport, canResolveIncident } from '../access.ts'
import { DataTable, PageHeader, QueryState, StatusChip } from '../components/ui.tsx'
import { errorMessage, formatDateTime } from '../format.ts'
import {
  useActivity,
  useAlerts,
  useCameras,
  useCoverage,
  useFiles,
  useIntegrityIssues,
  useMedia,
  useExportReport,
  useReport,
  useResolveIssue,
  useSession,
  useSetFileProtection,
  useGarages,
  useVehicles,
} from '../hooks/useFleet.ts'

export function MediaPage() {
  const [filters, setFilters] = useState<FileQuery>({})
  const files = useFiles(filters)
  const session = useSession()
  const vehicles = useVehicles()
  const cameras = useCameras()
  const garages = useGarages()
  const protect = useSetFileProtection()
  const canProtect = session.data?.user.role ? canResolveIncident(session.data.user.role) || session.data.user.role === 'admin' : false

  return (
    <div>
      <PageHeader title="Videoteca" lede="Busca por placa, veículo, data, horário, câmera, garagem e status." />
      <div className="mt-6 flex flex-col gap-4">
        <form className="flex flex-wrap items-end gap-3">
          <label>Placa<input value={filters.plate ?? ''} onChange={(event) => setFilters({ ...filters, plate: event.target.value })} /></label>
          <label>
            Veículo
            <select value={filters.vehicleId ?? ''} onChange={(event) => setFilters({ ...filters, vehicleId: event.target.value || undefined })}>
              <option value="">Todos</option>
              {(vehicles.data ?? []).map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.name}</option>)}
            </select>
          </label>
          <label>Data<input type="date" value={filters.date ?? ''} onChange={(event) => setFilters({ ...filters, date: event.target.value })} /></label>
          <label>Horário<input type="time" value={filters.time ?? ''} onChange={(event) => setFilters({ ...filters, time: event.target.value })} /></label>
          <label>
            Câmera
            <select value={filters.cameraId ?? ''} onChange={(event) => setFilters({ ...filters, cameraId: event.target.value || undefined })}>
              <option value="">Todas</option>
              {(cameras.data ?? []).map((camera) => <option key={camera.id} value={camera.id}>{camera.name}</option>)}
            </select>
          </label>
          <label>
            Garagem
            <select value={filters.garageId ?? ''} onChange={(event) => setFilters({ ...filters, garageId: event.target.value || undefined })}>
              <option value="">Todas</option>
              {(garages.data ?? []).map((garage) => <option key={garage.id} value={garage.id}>{garage.name}</option>)}
            </select>
          </label>
          <label>
            Status
            <select value={filters.status ?? ''} onChange={(event) => setFilters({ ...filters, status: event.target.value ? (event.target.value as FileStatus) : undefined })}>
              <option value="">Todos</option>
              <option value="disponivel">Disponível</option>
              <option value="convertido">Convertido</option>
              <option value="segmentado">Segmentado</option>
              <option value="corrompido">Corrompido</option>
            </select>
          </label>
        </form>
        <QueryState isLoading={files.isLoading} error={files.error}>
          <DataTable
            rows={files.data ?? []}
            empty="Nenhuma gravação para este filtro."
            columns={[
              { id: 'name', header: 'Arquivo', cell: (row) => <Link to={`/media/${row.id}`}>{row.name}</Link> },
              { id: 'kind', header: 'Tipo', cell: (row) => row.kind === 'mp4' ? 'MP4' : 'Original' },
              { id: 'status', header: 'Status', cell: (row) => <StatusChip value={row.status} /> },
              { id: 'when', header: 'Quando', cell: (row) => formatDateTime(row.recordedAt) },
              { id: 'path', header: 'Organização', cell: (row) => row.path },
              { id: 'protected', header: 'Protegido', cell: (row) => canProtect ? (
                <button type="button" className="btn btn-secondary" onClick={() => protect.mutate({ id: row.id, protectedFile: !row.protected })}>
                  {row.protected ? 'Protegido' : 'Proteger'}
                </button>
              ) : row.protected ? 'Protegido' : 'Não' },
            ]}
          />
        </QueryState>
      </div>
    </div>
  )
}

export function PlayerPage() {
  const params = useParams()
  const detail = useMedia(params.id ?? '')
  const [playing, setPlaying] = useState(false)
  const [index, setIndex] = useState(0)
  const data = detail.data
  const blocks = data?.segments ?? []
  const current = blocks[index]

  useEffect(() => {
    if (!playing || blocks.length === 0) return
    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % blocks.length)
    }, 900)
    return () => window.clearInterval(timer)
  }, [playing, blocks.length])

  return (
    <div>
      <PageHeader title={data?.file.name ?? 'Gravação'} lede="Original, MP4, segmentos e integridade. A reprodução percorre os blocos de 15 minutos já indexados." />
      <div className="mt-6 flex flex-col gap-4">
        <QueryState isLoading={detail.isLoading} error={detail.error}>
          {data ? (
            <section className="grid gap-3 rounded-lg border border-line bg-white p-5">
              <p>{data.vehicleName} · {data.plate} · {data.cameraName}</p>
              <p className="text-sm leading-6 text-ink-muted">Original: {data.original?.name ?? 'não vinculado'} · MP4: {data.file.kind === 'mp4' ? data.file.name : 'aguardando conversão automática'}</p>
              <div className="flex min-h-16 items-end gap-1" aria-label="Segmentos">
                {blocks.map((segment, segmentIndex) => (
                  <span key={segment.id} className={`h-12 flex-1 rounded-t ${segmentIndex === index && playing ? 'bg-brand' : 'bg-charcoal'}`} title={segment.name} />
                ))}
              </div>
              <p className="text-sm leading-6 text-ink-muted">{current ? `${current.name} · sequência ${current.sequence} · ${formatDateTime(current.startsAt)} → ${formatDateTime(current.endsAt)}` : 'Sem segmentos de 15 minutos neste arquivo.'}</p>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" className="btn btn-primary" onClick={() => setPlaying((value) => !value)} disabled={blocks.length === 0}>
                  {playing ? 'Pausar' : 'Reproduzir blocos'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setIndex((value) => Math.min(blocks.length - 1, value + 1))} disabled={blocks.length === 0}>
                  Próximo bloco
                </button>
              </div>
              {data.issues.length > 0 ? (
                <p className="text-sm text-brand">Integridade: {data.issues.map((issue) => issue.description).join(' ')}</p>
              ) : <p className="text-sm leading-6 text-ink-muted">Nenhuma inconsistência ligada a este arquivo.</p>}
              <p><Link to="/activity">Ver histórico</Link></p>
            </section>
          ) : null}
        </QueryState>
      </div>
    </div>
  )
}

export function CameraAuditPage() {
  const vehicles = useVehicles()
  const [vehicleId, setVehicleId] = useState('veh-01')
  const [date, setDate] = useState('2026-09-14')
  const coverage = useCoverage({ vehicleId, date })

  return (
    <div>
      <PageHeader title="Auditoria de câmeras" lede="A câmera gravou o período inteiro? A lacuna aparece no canal, não escondida numa média." />
      <div className="mt-6 flex flex-col gap-4">
        <form className="flex flex-wrap items-end gap-3">
          <label>
            Veículo
            <select value={vehicleId} onChange={(event) => setVehicleId(event.target.value)}>
              {(vehicles.data ?? []).map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.name}</option>)}
            </select>
          </label>
          <label>Data<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
        </form>
        <QueryState isLoading={coverage.isLoading} error={coverage.error}>
          {coverage.data ? (
            <section className="rounded-lg border border-line bg-white p-5">
              <p>{coverage.data.vehicleName} · {coverage.data.plate} · {coverage.data.date}</p>
              {coverage.data.cameras.map((camera) => (
                <div key={camera.cameraId} className="mt-4">
                  <strong>{camera.name}</strong>
                  <div className="mt-2 flex min-w-72 gap-0.5" aria-label={camera.name}>
                    {camera.blocks.map((block) => (
                      block.issueId ? (
                        <Link key={block.label} to="/incidents" title={`${block.label} gravação ausente`}>
                          <i className="block h-5 w-4 rounded-sm bg-brand" />
                        </Link>
                      ) : <i key={block.label} className="block h-5 w-4 rounded-sm bg-neutral-800" title={block.label} />
                    ))}
                  </div>
                </div>
              ))}
              <p className="text-sm leading-6 text-ink-muted">Janela 14:00–18:00, blocos de 15 minutos. Vermelho é lacuna.</p>
            </section>
          ) : null}
        </QueryState>
      </div>
    </div>
  )
}

export function IncidentsPage() {
  const issues = useIntegrityIssues()
  const alerts = useAlerts()
  const cameras = useCameras()
  const session = useSession()
  const resolve = useResolveIssue()
  const canResolve = session.data?.user.role ? canResolveIncident(session.data.user.role) : false

  return (
    <div>
      <PageHeader title="Ocorrências" lede="Erros, lacunas e falhas. Resolver não apaga o histórico." />
      <div className="mt-6 flex flex-col gap-4">
        {resolve.error ? <p className="text-sm text-brand">{errorMessage(resolve.error)}</p> : null}
        <QueryState isLoading={issues.isLoading || alerts.isLoading} error={issues.error ?? alerts.error}>
          <DataTable
            rows={issues.data ?? []}
            empty="Nenhuma inconsistência."
            columns={[
              { id: 'kind', header: 'Tipo', cell: (row) => <StatusChip value={row.kind} /> },
              { id: 'camera', header: 'Câmera', cell: (row) => cameras.data?.find((item) => item.id === row.cameraId)?.name ?? row.cameraId },
              { id: 'desc', header: 'Descrição', cell: (row) => row.description },
              { id: 'state', header: 'Estado', cell: (row) => row.resolvedAt ? `Resolvida ${formatDateTime(row.resolvedAt)}` : canResolve ? (
                <button type="button" className="btn btn-secondary" onClick={() => resolve.mutate(row.id)}>Resolver</button>
              ) : 'Aberta' },
            ]}
          />
          <h2 className="mb-3 text-base font-semibold tracking-tight">Alertas</h2>
          <DataTable
            rows={alerts.data ?? []}
            empty="Nenhum alerta."
            columns={[
              { id: 'when', header: 'Quando', cell: (row) => formatDateTime(row.createdAt) },
              { id: 'message', header: 'Mensagem', cell: (row) => row.message },
              { id: 'state', header: 'Estado', cell: (row) => row.acknowledged ? 'Reconhecido' : 'Aberto' },
            ]}
          />
        </QueryState>
      </div>
    </div>
  )
}

export function ActivityPage() {
  const activity = useActivity()
  return (
    <div>
      <PageHeader title="Atividades" lede="Rastreio do que o sistema e a operação registraram." />
      <div className="mt-6 flex flex-col gap-4">
        <QueryState isLoading={activity.isLoading} error={activity.error}>
          <DataTable
            rows={activity.data ?? []}
            empty="Sem atividades."
            columns={[
              { id: 'at', header: 'Quando', cell: (row) => formatDateTime(row.at) },
              { id: 'type', header: 'Evento', cell: (row) => row.type },
              { id: 'message', header: 'Registro', cell: (row) => row.message },
            ]}
          />
        </QueryState>
      </div>
    </div>
  )
}

export function ReportsPage() {
  const vehicles = useVehicles()
  const session = useSession()
  const [from, setFrom] = useState('2026-09-01')
  const [to, setTo] = useState('2026-09-14')
  const [vehicleId, setVehicleId] = useState('')
  const query = { from, to, vehicleId: vehicleId || undefined }
  const report = useReport(query)
  const exporter = useExportReport()
  const allowExport = session.data?.user.role ? canExport(session.data.user.role) : false

  return (
    <div>
      <PageHeader title="Relatórios" lede="Sincronizações, downloads, falhas e período. Exportar é investigação, não configuração." />
      <div className="mt-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <label>De<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label>
          <label>Até<input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label>
          <label>
            Veículo
            <select value={vehicleId} onChange={(event) => setVehicleId(event.target.value)}>
              <option value="">Todos</option>
              {(vehicles.data ?? []).map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.name}</option>)}
            </select>
          </label>
          {allowExport ? <button className="btn btn-primary" type="button" onClick={() => exporter.mutate(query)}>Exportar CSV</button> : <p className="text-sm leading-6 text-ink-muted">Este perfil consulta o relatório, sem exportar.</p>}
        </div>
        <QueryState isLoading={report.isLoading} error={report.error}>
          {report.data ? (
            <DataTable
              rows={report.data.byVehicle}
              empty="Sem linhas."
              columns={[
                { id: 'name', header: 'Veículo', cell: (row) => row.name },
                { id: 'plate', header: 'Placa', cell: (row) => row.plate },
                { id: 'downloads', header: 'Downloads', cell: (row) => String(row.downloads) },
                { id: 'failures', header: 'Falhas', cell: (row) => String(row.failures) },
              ]}
            />
          ) : null}
        </QueryState>
      </div>
    </div>
  )
}
