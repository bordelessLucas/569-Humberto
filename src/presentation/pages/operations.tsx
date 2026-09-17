import { Link, useParams } from 'react-router-dom'
import { canOperateQueue } from '../access.ts'
import { DataTable, PageHeader, ProgressBar, QueryState, StatusChip } from '../components/ui.tsx'
import { errorMessage, formatBytes, formatDateTime } from '../format.ts'
import {
  useConnections,
  useCameras,
  usePauseTransfer,
  useProcessingJobs,
  useRecordings,
  useResumeTransfer,
  useRetryTransfer,
  useSession,
  useSetPriority,
  useSync,
  useSyncRuns,
  useTransfers,
  useVehicles,
} from '../hooks/useFleet.ts'
import { priorityLabel } from '../status.ts'

const stages = [
  ['recebido', 'Recebido'],
  ['validacao', 'Validando'],
  ['conversao_mp4', 'Convertendo MP4'],
  ['corte_15', 'Segmentando 15 min'],
  ['indexacao', 'Indexando'],
] as const

export function ConnectionsPage() {
  const connections = useConnections()
  const vehicles = useVehicles()
  return (
    <div>
      <PageHeader title="Conexões" lede="Quem entrou e saiu do Wi-Fi. A identificação do equipamento é automática no agente; aqui a operação só acompanha." />
      <div className="mt-6 flex flex-col gap-4">
        <QueryState isLoading={connections.isLoading} error={connections.error}>
          <DataTable
            rows={connections.data ?? []}
            empty="Nenhuma conexão registrada."
            columns={[
              { id: 'vehicle', header: 'Veículo', cell: (row) => <Link to={`/vehicles/${row.vehicleId}`}>{vehicles.data?.find((item) => item.id === row.vehicleId)?.name ?? row.vehicleId}</Link> },
              { id: 'ip', header: 'IP', cell: (row) => row.ip },
              { id: 'mac', header: 'MAC', cell: (row) => row.mac },
              { id: 'status', header: 'Status', cell: (row) => <StatusChip value={row.status} /> },
              { id: 'origin', header: 'Origem', cell: (row) => <StatusChip value={row.origin} /> },
              { id: 'in', header: 'Entrada', cell: (row) => formatDateTime(row.connectedAt) },
              { id: 'out', header: 'Saída', cell: (row) => formatDateTime(row.disconnectedAt) },
            ]}
          />
        </QueryState>
      </div>
    </div>
  )
}

export function SyncListPage() {
  const syncs = useSyncRuns()
  const vehicles = useVehicles()
  return (
    <div>
      <PageHeader title="Sincronizações" lede="Sessões abertas quando o caminhão chega. A consulta das gravações começa sozinha." />
      <div className="mt-6 flex flex-col gap-4">
        <QueryState isLoading={syncs.isLoading} error={syncs.error}>
          <DataTable
            rows={syncs.data ?? []}
            empty="Nenhuma sincronização."
            columns={[
              { id: 'id', header: 'Sessão', cell: (row) => <Link to={`/synchronizations/${row.id}`}>{row.id}</Link> },
              { id: 'vehicle', header: 'Veículo', cell: (row) => vehicles.data?.find((item) => item.id === row.vehicleId)?.name ?? row.vehicleId },
              { id: 'status', header: 'Status', cell: (row) => <StatusChip value={row.status} /> },
              { id: 'found', header: 'Encontradas', cell: (row) => String(row.recordingsFound) },
              { id: 'pending', header: 'Pendentes', cell: (row) => String(row.pending) },
              { id: 'down', header: 'Baixadas', cell: (row) => String(row.downloaded) },
              { id: 'failed', header: 'Falhas', cell: (row) => String(row.failed) },
            ]}
          />
        </QueryState>
      </div>
    </div>
  )
}

export function SyncDetailPage() {
  const params = useParams()
  const detail = useSync(params.id ?? '')
  const cameras = useCameras()
  const data = detail.data
  return (
    <div>
      <PageHeader title={data ? `${data.vehicleName} · ${data.plate}` : 'Sincronização'} lede="O que foi encontrado no equipamento, o que ainda está pendente e o que falhou." />
      <div className="mt-6 flex flex-col gap-4">
        <QueryState isLoading={detail.isLoading} error={detail.error}>
          {data ? (
            <>
              <p className="text-sm leading-6 text-ink-muted">
                <StatusChip value={data.sync.status} /> {data.sync.recordingsFound} encontradas · {data.sync.pending} pendentes · {data.sync.downloaded} baixadas · {data.sync.failed} falhas
              </p>
              <DataTable
                rows={data.recordings}
                empty="Nenhuma gravação nesta sessão."
                columns={[
                  { id: 'camera', header: 'Câmera', cell: (row) => cameras.data?.find((item) => item.id === row.cameraId)?.name ?? row.cameraId },
                  { id: 'start', header: 'Início', cell: (row) => formatDateTime(row.startsAt) },
                  { id: 'status', header: 'Status', cell: (row) => <StatusChip value={row.status} /> },
                ]}
              />
            </>
          ) : null}
        </QueryState>
      </div>
    </div>
  )
}

export function DownloadsPage() {
  const transfers = useTransfers()
  const vehicles = useVehicles()
  const recordings = useRecordings()
  const cameras = useCameras()
  const session = useSession()
  const pause = usePauseTransfer()
  const resume = useResumeTransfer()
  const retry = useRetryTransfer()
  const priority = useSetPriority()
  const canOperate = session.data?.user.role ? canOperateQueue(session.data.user.role) : false

  return (
    <div>
      <PageHeader title="Downloads" lede="Fila, prioridade, pausa, retomada e nova tentativa. O download em si não depende de um clique a cada arquivo." />
      <div className="mt-6 flex flex-col gap-4">
        {pause.error || resume.error || retry.error ? <p className="text-sm text-brand">{errorMessage(pause.error ?? resume.error ?? retry.error)}</p> : null}
        <QueryState isLoading={transfers.isLoading} error={transfers.error}>
          <DataTable
            rows={transfers.data ?? []}
            empty="Nenhum download na fila."
            columns={[
              { id: 'id', header: 'Item', cell: (row) => row.id },
              {
                id: 'vehicle',
                header: 'Veículo',
                cell: (row) => {
                  const vehicle = vehicles.data?.find((item) => item.id === row.vehicleId)
                  return <Link to={`/vehicles/${row.vehicleId}`}>{vehicle ? `${vehicle.name} · frota ${vehicle.fleetNumber}` : row.vehicleId}</Link>
                },
              },
              {
                id: 'camera',
                header: 'Câmera',
                cell: (row) => {
                  const recording = recordings.data?.find((item) => item.id === row.recordingId)
                  return cameras.data?.find((item) => item.id === recording?.cameraId)?.name ?? recording?.cameraId ?? '—'
                },
              },
              { id: 'priority', header: 'Prioridade', cell: (row) => canOperate ? (
                <select value={row.priority} onChange={(event) => priority.mutate({ id: row.id, priority: Number(event.target.value) })}>
                  <option value={1}>Alta</option>
                  <option value={2}>Média</option>
                  <option value={3}>Baixa</option>
                </select>
              ) : priorityLabel(row.priority) },
              { id: 'status', header: 'Status', cell: (row) => <StatusChip value={row.status} /> },
              { id: 'progress', header: 'Progresso', cell: (row) => <ProgressBar value={row.progress} /> },
              { id: 'attempts', header: 'Tentativas', cell: (row) => String(row.attempts) },
              { id: 'resume', header: 'Retomada', cell: (row) => formatBytes(row.resumeOffsetBytes) },
              { id: 'actions', header: 'Ação', cell: (row) => canOperate ? (
                <span className="flex flex-wrap items-center gap-2">
                  {row.status === 'baixando' ? <button type="button" className="btn btn-secondary" onClick={() => pause.mutate(row.id)}>Pausar</button> : null}
                  {row.status === 'pausado' || row.status === 'interrompido' ? <button type="button" className="btn btn-secondary" onClick={() => resume.mutate(row.id)}>Retomar</button> : null}
                  {row.status === 'erro' || row.status === 'interrompido' ? <button type="button" className="btn btn-secondary" onClick={() => retry.mutate(row.id)}>Tentar novamente</button> : null}
                </span>
              ) : 'Somente leitura' },
            ]}
          />
        </QueryState>
      </div>
    </div>
  )
}

export function ProcessingPage() {
  const jobs = useProcessingJobs()
  const recordings = useRecordings()
  return (
    <div>
      <PageHeader title="Processamento" lede="Recebido, validação, MP4, corte de 15 minutos e indexação. Não há botão de converter: isso é automático." />
      <div className="mt-6 flex flex-col gap-4">
        <ol className="text-sm leading-6 text-ink-muted">
          {stages.map(([, label]) => <li key={label}>{label}</li>)}
        </ol>
        <p className="text-sm leading-6 text-ink-muted">Se uma etapa falhar, a ação disponível é tentar novamente. Gravações consultadas: {recordings.data?.length ?? 0}.</p>
        <QueryState isLoading={jobs.isLoading} error={jobs.error}>
          <DataTable
            rows={jobs.data ?? []}
            empty="Nenhum processamento em andamento. A demonstração de chegada cria este fluxo."
            columns={[
              { id: 'stage', header: 'Etapa', cell: (row) => stages.find((item) => item[0] === row.stage)?.[1] ?? row.stage },
              { id: 'status', header: 'Status', cell: (row) => <StatusChip value={row.status} /> },
              { id: 'file', header: 'Arquivo', cell: (row) => row.fileId.startsWith('file-') ? <Link to={`/media/${row.fileId}`}>{row.fileId}</Link> : row.fileId },
              { id: 'start', header: 'Início', cell: (row) => formatDateTime(row.startedAt) },
            ]}
          />
        </QueryState>
      </div>
    </div>
  )
}
