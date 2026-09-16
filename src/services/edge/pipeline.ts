/**
 * Pipeline de chegada na garagem (núcleo Full Lock).
 *
 * Fluxo: Wi-Fi detecta MC904 → identifica veículo → valida → descobre pendências
 * → baixa para disco local da base → atualiza histórico → dashboard reflete.
 *
 * Transferência MC904 ainda é simulada (origin: simulado) até JT/T1078/SDK.
 * Análise por terceiros das imagens no servidor do cliente: FORA DO ESCOPO.
 */

import type {
  Connection,
  GarageIngestInput,
  GarageIngestPhase,
  GarageIngestStatus,
  MediaFile,
  SyncRun,
  Transfer,
} from '../../domain/types.ts'
import { ApiError } from '../api/errors.ts'
import { getState, markStoreDirty, pushActivity, stamp } from '../api/mock/store.ts'
import { describeEdgeAgent } from './agent.ts'
import { MC904_CAPABILITIES } from './adapters/mettax-mc904.ts'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

let runtime: GarageIngestStatus | null = null
let runToken = 0

export function getGarageIngestStatus(): GarageIngestStatus {
  if (runtime) return structuredClone(runtime)
  return idleStatus(null)
}

export function describeIngestCapableAgent(garageId: string) {
  const edge = describeEdgeAgent(garageId)
  return {
    ...edge,
    mode: 'ingest_pipeline' as const,
    ingest: getGarageIngestStatus(),
    note:
      'Pipeline de chegada ativo (simulado até API MC904). Vídeo fica no servidor da base; análise por terceiros fora do escopo.',
  }
}

export async function startGarageIngest(input: GarageIngestInput): Promise<GarageIngestStatus> {
  if (runtime && isActivePhase(runtime.phase)) {
    throw new ApiError(409, 'Já há uma ingestão em andamento nesta sessão do agente.')
  }

  const store = getState()
  const garage = store.garages.find((item) => item.id === input.garageId)
  if (!garage) throw new ApiError(404, 'Garagem não encontrada.')

  const vehicle = store.vehicles.find((item) => item.id === input.vehicleId)
  if (!vehicle) throw new ApiError(404, 'Veículo não encontrado.')

  const plate = store.plates.find((item) => item.vehicleId === vehicle.id && item.active)?.value ?? '—'
  const device = store.devices.find((item) => item.vehicleId === vehicle.id)
  if (!device) throw new ApiError(400, 'Veículo sem equipamento MC904 associado.')

  const token = ++runToken
  runtime = {
    garageId: garage.id,
    garageName: garage.name,
    vehicleId: vehicle.id,
    vehicleName: vehicle.name,
    plate,
    deviceSerial: device.serial,
    phase: 'detectando',
    progress: 0,
    message: `Detectando ${device.model} no Wi-Fi ${garage.wifiSsid}…`,
    syncRunId: null,
    filesStored: 0,
    origin: 'simulado',
    updatedAt: new Date().toISOString(),
    outOfScopeNote: 'Após o vídeo estar no servidor da base, o cliente pode entregar a uma empresa terceirizada para análise — isso não faz parte do Full Lock.',
  }
  markStoreDirty()

  void runPipeline(token, input.garageId, vehicle.id).catch((error: unknown) => {
    if (token !== runToken) return
    const message = error instanceof Error ? error.message : 'Falha na ingestão.'
    patchRuntime({ phase: 'erro', progress: 100, message })
  })

  return getGarageIngestStatus()
}

async function runPipeline(token: number, garageId: string, vehicleId: string): Promise<void> {
  const alive = () => token === runToken

  await sleep(450)
  if (!alive()) return
  detectWifi(garageId, vehicleId)
  patchRuntime({ phase: 'identificando', progress: 12, message: 'Equipamento no Wi-Fi. Identificando veículo…' })

  await sleep(450)
  if (!alive()) return
  const identity = identifyVehicle(vehicleId)
  patchRuntime({
    phase: 'validando',
    progress: 22,
    message: `Identificado: ${identity.name} · placa ${identity.plate}`,
  })

  await sleep(400)
  if (!alive()) return
  const authorized = validateVehicle(vehicleId)
  if (!authorized.ok) {
    markUnauthorized(garageId, vehicleId, authorized.reason)
    patchRuntime({
      phase: 'nao_autorizado',
      progress: 100,
      message: authorized.reason,
    })
    return
  }
  patchRuntime({ phase: 'descobrindo', progress: 32, message: 'Consultando histórico e pendências no MC904…' })

  await sleep(500)
  if (!alive()) return
  const pending = discoverPending(vehicleId)
  const sync = openSyncRun(garageId, vehicleId, pending.length)
  patchRuntime({
    phase: 'na_fila',
    progress: 40,
    syncRunId: sync.id,
    message: pending.length
      ? `${pending.length} período(s)/câmera(s) pendente(s) enfileirados`
      : 'Sem backlog antigo; capturando janela recente das câmeras',
  })

  await sleep(350)
  if (!alive()) return
  patchRuntime({ phase: 'baixando', progress: 48, message: 'Servidor da base puxando gravações do MC904…' })

  const cameras = getState().cameras.filter((item) => item.vehicleId === vehicleId)
  const targets = cameras.length > 0 ? cameras : []
  let stored = 0
  const total = Math.max(targets.length, 1)

  for (let index = 0; index < targets.length; index += 1) {
    if (!alive()) return
    const camera = targets[index]
    downloadCameraChunk(garageId, vehicleId, camera.id, sync.id, index)
    stored += 1
    const progress = 48 + Math.round(((index + 1) / total) * 45)
    patchRuntime({
      phase: 'baixando',
      progress,
      filesStored: stored,
      message: `Baixando ${camera.name} (${index + 1}/${total}) → disco local da base`,
    })
    await sleep(420)
  }

  if (!alive()) return
  completeIngest(garageId, vehicleId, sync.id, stored)
  patchRuntime({
    phase: 'concluido',
    progress: 100,
    filesStored: stored,
    message: `Ingestão concluída. ${stored} arquivo(s) no servidor da base. Pronto para o cliente entregar a terceiros (fora do escopo).`,
  })
}

function detectWifi(garageId: string, vehicleId: string): void {
  const store = getState()
  const vehicle = mustVehicle(vehicleId)
  const device = mustDevice(vehicleId)
  const garage = mustGarage(garageId)
  const now = stamp(store)

  for (const connection of store.connections) {
    if (connection.vehicleId === vehicleId && connection.status === 'ativa') {
      connection.status = 'encerrada'
      connection.disconnectedAt = now
    }
  }

  const connection: Connection = {
    id: `con-ingest-${Date.now()}`,
    deviceId: device.id,
    vehicleId,
    garageId,
    ip: device.ip,
    mac: device.mac,
    status: 'ativa',
    connectedAt: now,
    disconnectedAt: null,
    origin: 'simulado',
  }
  store.connections.unshift(connection)
  vehicle.operationalStatus = 'conectado'
  vehicle.lastConnectionAt = now
  vehicle.lastSeenGarageId = garageId
  device.lastSeenAt = now
  for (const camera of store.cameras.filter((item) => item.vehicleId === vehicleId)) {
    camera.online = true
  }

  pushActivity(store, {
    type: 'connection.opened',
    vehicleId,
    message: `${vehicle.name} entrou no Wi-Fi ${garage.wifiSsid} (MC904 ${device.serial}).`,
  })
  markStoreDirty()
}

function identifyVehicle(vehicleId: string) {
  const store = getState()
  const vehicle = mustVehicle(vehicleId)
  const plate = store.plates.find((item) => item.vehicleId === vehicleId && item.active)?.value ?? '—'
  return { name: vehicle.name, plate }
}

function validateVehicle(vehicleId: string): { ok: true } | { ok: false; reason: string } {
  const vehicle = mustVehicle(vehicleId)
  if (!vehicle.active) {
    return { ok: false, reason: 'Veículo inativo no cadastro — download bloqueado.' }
  }
  return { ok: true }
}

function markUnauthorized(garageId: string, vehicleId: string, reason: string): void {
  const store = getState()
  const vehicle = mustVehicle(vehicleId)
  vehicle.operationalStatus = 'nao_autorizado'
  const sync: SyncRun = {
    id: `sync-deny-${Date.now()}`,
    vehicleId,
    garageId,
    startedAt: stamp(store),
    finishedAt: stamp(store),
    status: 'falha',
    sessionStatus: 'nao_autorizado',
    unauthorizedReason: reason,
    recordingsFound: 0,
    pending: 0,
    downloaded: 0,
    failed: 0,
    origin: 'simulado',
  }
  store.syncRuns.unshift(sync)
  pushActivity(store, {
    type: 'alert.raised',
    vehicleId,
    message: `Não autorizado na base: ${reason}`,
  })
  markStoreDirty()
}

function discoverPending(vehicleId: string): Array<{ cameraId: string; periodId: string }> {
  const store = getState()
  const pending = store.periodHistory.filter(
    (item) => item.vehicleId === vehicleId && (item.status === 'pendente' || item.status === 'falhou' || item.status === 'parcial'),
  )

  if (pending.length > 0) {
    pushActivity(store, {
      type: 'recordings.discovered',
      vehicleId,
      message: `${pending.length} período(s) pendentes encontrados no histórico incremental.`,
    })
    markStoreDirty()
    return pending.map((item) => ({ cameraId: item.cameraId, periodId: item.id }))
  }

  // Sem backlog: cria pendência da janela recente por câmera (chegada “limpa”).
  const cameras = store.cameras.filter((item) => item.vehicleId === vehicleId)
  const end = new Date()
  const start = new Date(end.getTime() - 60 * 60 * 1000)
  const created: Array<{ cameraId: string; periodId: string }> = []
  for (const camera of cameras) {
    const id = `hist-ingest-${vehicleId}-${camera.id}-${Date.now()}`
    store.periodHistory.unshift({
      id,
      vehicleId,
      cameraId: camera.id,
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      status: 'pendente',
      lastGarageId: null,
      lastAttemptAt: null,
      completedAt: null,
      bytesDownloaded: 0,
      notes: 'Janela detectada na chegada à base',
    })
    created.push({ cameraId: camera.id, periodId: id })
  }
  pushActivity(store, {
    type: 'recordings.discovered',
    vehicleId,
    message: `${created.length} canal(is) MC904 (${MC904_CAPABILITIES.cameras.analogMax} máx.) prontos para download.`,
  })
  markStoreDirty()
  return created
}

function openSyncRun(garageId: string, vehicleId: string, pendingCount: number): SyncRun {
  const store = getState()
  const vehicle = mustVehicle(vehicleId)
  vehicle.operationalStatus = 'baixando'
  const sync: SyncRun = {
    id: `sync-ingest-${Date.now()}`,
    vehicleId,
    garageId,
    startedAt: stamp(store),
    finishedAt: null,
    status: 'em_andamento',
    sessionStatus: 'baixando',
    unauthorizedReason: null,
    recordingsFound: pendingCount,
    pending: pendingCount,
    downloaded: 0,
    failed: 0,
    origin: 'simulado',
  }
  store.syncRuns.unshift(sync)
  pushActivity(store, {
    type: 'transfer.queued',
    vehicleId,
    message: `Fila de download aberta na base (${pendingCount} item(ns)).`,
  })
  markStoreDirty()
  return sync
}

function downloadCameraChunk(
  garageId: string,
  vehicleId: string,
  cameraId: string,
  syncId: string,
  index: number,
): void {
  const store = getState()
  const vehicle = mustVehicle(vehicleId)
  const camera = store.cameras.find((item) => item.id === cameraId)
  const now = stamp(store)
  const sizeBytes = 420_000_000 + index * 12_000_000
  const recordingId = `rec-ingest-${vehicleId}-${cameraId}-${Date.now()}`

  store.recordings.unshift({
    id: recordingId,
    vehicleId,
    cameraId,
    deviceId: mustDevice(vehicleId).id,
    startsAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    endsAt: now,
    status: 'baixada',
  })

  const transfer: Transfer = {
    id: `tr-ingest-${Date.now()}-${index}`,
    vehicleId,
    recordingId,
    priority: 1,
    status: 'concluido',
    progress: 100,
    attempts: 1,
    resumeOffsetBytes: sizeBytes,
    bytesTotal: sizeBytes,
    origin: 'simulado',
  }
  store.transfers.unshift(transfer)

  const fileName = `${(camera?.name ?? 'CAM').replace(/\s+/g, '-')}-${now.slice(0, 13).replace(/[:T]/g, '')}-seq01.mp4`
  const garageSlug = mustGarage(garageId).name.toLowerCase().replace(/\s+/g, '-')
  const file: MediaFile = {
    id: `file-ingest-${Date.now()}-${index}`,
    garageId,
    vehicleId,
    cameraId,
    recordedAt: now,
    kind: 'mp4',
    originalFileId: null,
    path: `${garageSlug}/${vehicle.fleetNumber}/${now.slice(0, 10)}/${fileName}`,
    name: fileName,
    status: 'disponivel',
    protected: false,
    indexed: true,
    sizeBytes,
    sequence: index + 1,
  }
  store.files.unshift(file)
  store.storageStatus.usedBytes += sizeBytes
  store.storageStatus.availableBytes = Math.max(0, store.storageStatus.capacityBytes - store.storageStatus.usedBytes)

  for (const period of store.periodHistory) {
    if (period.vehicleId === vehicleId && period.cameraId === cameraId && period.status !== 'baixado') {
      period.status = 'baixado'
      period.lastGarageId = garageId
      period.lastAttemptAt = now
      period.completedAt = now
      period.bytesDownloaded = sizeBytes
      period.notes = 'Baixado na chegada à base'
    }
  }

  const sync = store.syncRuns.find((item) => item.id === syncId)
  if (sync) {
    sync.downloaded += 1
    sync.pending = Math.max(0, sync.pending - 1)
    sync.sessionStatus = 'baixando'
  }

  vehicle.operationalStatus = 'baixando'
  vehicle.lastSyncAt = now
  vehicle.lastJobMinutes = 45 + index

  pushActivity(store, {
    type: 'transfer.progress',
    vehicleId,
    message: `${camera?.name ?? cameraId} armazenado em ${file.path}`,
  })
  pushActivity(store, {
    type: 'file.available',
    vehicleId,
    message: `Arquivo disponível no servidor da base: ${file.name}`,
  })
  markStoreDirty()
}

function completeIngest(garageId: string, vehicleId: string, syncId: string, filesStored: number): void {
  const store = getState()
  const vehicle = mustVehicle(vehicleId)
  const now = stamp(store)
  const sync = store.syncRuns.find((item) => item.id === syncId)
  if (sync) {
    sync.status = 'concluida'
    sync.sessionStatus = 'concluido'
    sync.finishedAt = now
    sync.pending = 0
  }
  vehicle.operationalStatus = 'concluido'
  vehicle.lastSyncAt = now
  vehicle.lastSeenGarageId = garageId

  const connection = store.connections.find((item) => item.vehicleId === vehicleId && item.status === 'ativa')
  // Mantém conexão ativa até o veículo sair; status operacional já concluído.

  pushActivity(store, {
    type: 'audit.completed',
    vehicleId,
    message: `Sessão na base concluída (${filesStored} arquivo(s)). Análise terceirizada fora do Full Lock.`,
  })
  void connection
  markStoreDirty()
}

function patchRuntime(patch: Partial<GarageIngestStatus>): void {
  if (!runtime) return
  runtime = {
    ...runtime,
    ...patch,
    updatedAt: new Date().toISOString(),
  }
  markStoreDirty()
}

function idleStatus(garageId: string | null): GarageIngestStatus {
  return {
    garageId: garageId ?? '',
    garageName: '',
    vehicleId: null,
    vehicleName: null,
    plate: null,
    deviceSerial: null,
    phase: 'idle',
    progress: 0,
    message: 'Aguardando veículo no Wi-Fi da base.',
    syncRunId: null,
    filesStored: 0,
    origin: 'simulado',
    updatedAt: new Date().toISOString(),
    outOfScopeNote:
      'Full Lock para no armazenamento local. Entrega/análise por empresa terceirizada não está no escopo.',
  }
}

function isActivePhase(phase: GarageIngestPhase): boolean {
  return !['idle', 'concluido', 'nao_autorizado', 'erro'].includes(phase)
}

function mustVehicle(id: string) {
  const vehicle = getState().vehicles.find((item) => item.id === id)
  if (!vehicle) throw new ApiError(404, 'Veículo não encontrado.')
  return vehicle
}

function mustDevice(vehicleId: string) {
  const device = getState().devices.find((item) => item.vehicleId === vehicleId)
  if (!device) throw new ApiError(400, 'Equipamento não encontrado.')
  return device
}

function mustGarage(id: string) {
  const garage = getState().garages.find((item) => item.id === id)
  if (!garage) throw new ApiError(404, 'Garagem não encontrada.')
  return garage
}
