import type {
  CameraCoverage,
  CoverageQuery,
  MediaDetail,
  SyncDetail,
  SystemSettings,
  Transfer,
  UpdateDeviceInput,
  UpdateGarageInput,
  UpdateUserInput,
  UpdateVehicleInput,
  VehicleDetail,
} from '../../../domain/types.ts'
import { ApiError } from '../errors.ts'
import { getState, pushActivity, stamp, type FleetStore } from './store.ts'

export function vehicleDetail(id: string): VehicleDetail {
  const store = getState()
  const vehicle = must(store.vehicles, id, 'Veículo não encontrado.')
  const garage = must(store.garages, vehicle.garageId, 'Garagem não encontrada.')
  return {
    vehicle: structuredClone(vehicle),
    plate: store.plates.find((item) => item.vehicleId === id && item.active)?.value ?? '—',
    garage: structuredClone(garage),
    device: structuredClone(store.devices.find((item) => item.vehicleId === id) ?? null),
    cameras: structuredClone(store.cameras.filter((item) => item.vehicleId === id)),
    activity: structuredClone(store.activity.filter((item) => item.vehicleId === id)),
    connections: structuredClone(store.connections.filter((item) => item.vehicleId === id)),
  }
}

export function syncDetail(id: string): SyncDetail {
  const store = getState()
  const sync = must(store.syncRuns, id, 'Sincronização não encontrada.')
  const vehicle = must(store.vehicles, sync.vehicleId, 'Veículo não encontrado.')
  return {
    sync: structuredClone(sync),
    vehicleName: vehicle.name,
    plate: store.plates.find((item) => item.vehicleId === vehicle.id && item.active)?.value ?? '—',
    recordings: structuredClone(store.recordings.filter((item) => item.vehicleId === vehicle.id)),
  }
}

export function mediaDetail(id: string): MediaDetail {
  const store = getState()
  const file = must(store.files, id, 'Arquivo não encontrado.')
  const vehicle = must(store.vehicles, file.vehicleId, 'Veículo não encontrado.')
  const original = file.originalFileId ? store.files.find((item) => item.id === file.originalFileId) ?? null : store.files.find((item) => item.id === file.id && item.kind === 'original') ?? null
  return {
    file: structuredClone(file),
    original: file.kind === 'mp4' ? structuredClone(store.files.find((item) => item.id === file.originalFileId) ?? null) : structuredClone(original),
    segments: structuredClone(store.segments.filter((item) => item.fileId === file.id || item.vehicleId === file.vehicleId && item.cameraId === file.cameraId)),
    issues: structuredClone(store.integrityIssues.filter((item) => item.vehicleId === file.vehicleId && (item.fileId === file.id || item.cameraId === file.cameraId))),
    jobs: structuredClone(store.processingJobs.filter((item) => item.fileId === file.id)),
    vehicleName: vehicle.name,
    plate: store.plates.find((item) => item.vehicleId === vehicle.id && item.active)?.value ?? '—',
    cameraName: store.cameras.find((item) => item.id === file.cameraId)?.name ?? file.cameraId,
  }
}

export function coverage(query: CoverageQuery): CameraCoverage {
  const store = getState()
  const vehicle = must(store.vehicles, query.vehicleId, 'Veículo não encontrado.')
  const cameras = store.cameras.filter((item) => item.vehicleId === vehicle.id)
  const gap = store.integrityIssues.find((item) => item.vehicleId === vehicle.id && item.kind === 'intervalo_ausente' && !item.resolvedAt)
  return {
    vehicleId: vehicle.id,
    vehicleName: vehicle.name,
    plate: store.plates.find((item) => item.vehicleId === vehicle.id && item.active)?.value ?? '—',
    date: query.date,
    cameras: cameras.map((camera) => ({
      cameraId: camera.id,
      name: camera.name,
      blocks: blocksFor(camera.id, query.date === '2026-09-14' && gap?.cameraId === camera.id ? gap.id : null),
    })),
  }
}

export function updateUser(id: string, input: UpdateUserInput) {
  const store = getState()
  const user = must(store.users, id, 'Usuário não encontrado.')
  if (!input.active && user.role === 'admin') {
    const others = store.users.filter((item) => item.role === 'admin' && item.active && item.id !== id)
    if (others.length === 0) throw new ApiError(409, 'Não é possível desativar o último administrador.')
  }
  user.name = input.name.trim()
  user.role = input.role
  user.active = input.active
  if (!input.active && store.session?.user.id === id) store.session = null
  return structuredClone(user)
}

export function updateVehicle(id: string, input: UpdateVehicleInput) {
  const store = getState()
  const vehicle = must(store.vehicles, id, 'Veículo não encontrado.')
  must(store.garages, input.garageId, 'Garagem não encontrada.')
  const plateValue = input.plate.trim().toUpperCase()
  const plate = store.plates.find((item) => item.vehicleId === id && item.active)
  if (store.plates.some((item) => item.value === plateValue && item.active && item.vehicleId !== id)) {
    throw new ApiError(409, 'Placa já cadastrada.')
  }
  vehicle.name = input.name.trim()
  vehicle.garageId = input.garageId
  vehicle.fleetNumber = input.fleetNumber.trim()
  if (plate) plate.value = plateValue
  else store.plates.push({ id: `plt-${id}`, vehicleId: id, value: plateValue, active: true })
  return vehicleDetail(id)
}

export function updateGarage(id: string, input: UpdateGarageInput) {
  const garage = must(getState().garages, id, 'Garagem não encontrada.')
  garage.name = input.name.trim()
  garage.city = input.city.trim()
  garage.wifiSsid = input.wifiSsid.trim()
  return structuredClone(garage)
}

export function updateDevice(id: string, input: UpdateDeviceInput) {
  const store = getState()
  const device = must(store.devices, id, 'Equipamento não encontrado.')
  if (input.vehicleId) must(store.vehicles, input.vehicleId, 'Veículo não encontrado.')
  device.model = input.model.trim()
  device.serial = input.serial.trim()
  device.firmware = input.firmware.trim()
  device.ip = input.ip.trim()
  device.mac = input.mac.trim().toUpperCase()
  device.vehicleId = input.vehicleId
  return structuredClone(device)
}

export function pauseTransfer(id: string): Transfer {
  const transfer = must(getState().transfers, id, 'Download não encontrado.')
  if (transfer.status !== 'baixando') throw new ApiError(409, 'Só é possível pausar um download em andamento.')
  transfer.status = 'pausado'
  pushActivity(getState(), { type: 'transfer.interrupted', vehicleId: transfer.vehicleId, message: `Download ${id} pausado em ${transfer.progress}%.` })
  return structuredClone(transfer)
}

export function resumeTransfer(id: string): Transfer {
  const transfer = must(getState().transfers, id, 'Download não encontrado.')
  if (transfer.status !== 'pausado' && transfer.status !== 'interrompido') {
    throw new ApiError(409, 'Este download não está pausado nem interrompido.')
  }
  transfer.status = 'baixando'
  transfer.attempts += 1
  const vehicle = getState().vehicles.find((item) => item.id === transfer.vehicleId)
  if (vehicle) vehicle.operationalStatus = 'baixando'
  pushActivity(getState(), { type: 'transfer.resumed', vehicleId: transfer.vehicleId, message: `Download ${id} retomado a partir de ${transfer.progress}%.` })
  return structuredClone(transfer)
}

export function retryTransfer(id: string): Transfer {
  const transfer = must(getState().transfers, id, 'Download não encontrado.')
  if (transfer.status !== 'erro' && transfer.status !== 'interrompido') {
    throw new ApiError(409, 'Tentar novamente só vale para falha ou interrupção.')
  }
  transfer.status = 'na_fila'
  transfer.attempts += 1
  pushActivity(getState(), { type: 'transfer.queued', vehicleId: transfer.vehicleId, message: `Download ${id} recolocado na fila. Tentativa ${transfer.attempts}.` })
  return structuredClone(transfer)
}

export function setPriority(id: string, priority: number): Transfer {
  const transfer = must(getState().transfers, id, 'Download não encontrado.')
  transfer.priority = priority
  return structuredClone(transfer)
}

export function resolveIssue(id: string) {
  const issue = must(getState().integrityIssues, id, 'Ocorrência não encontrada.')
  issue.resolvedAt = stamp(getState())
  return structuredClone(issue)
}

export function readSettings(): SystemSettings {
  return structuredClone(getState().settings)
}

export function writeSettings(input: SystemSettings): SystemSettings {
  const store = getState()
  store.settings = { ...input, segmentMinutes: 15 }
  store.storagePolicy.retentionDays = input.retentionDays
  return structuredClone(store.settings)
}

function blocksFor(cameraId: string, gapIssueId: string | null): CameraCoverage['cameras'][number]['blocks'] {
  const startMinutes = 14 * 60
  return Array.from({ length: 16 }, (_, index) => {
    const minutes = startMinutes + index * 15
    const label = clock(minutes)
    const missing = gapIssueId !== null && cameraId.endsWith('-2') && label === '15:30'
    return { label, covered: !missing, issueId: missing ? gapIssueId : null }
  })
}

function clock(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

function must<T extends { id: string }>(items: T[], id: string, message: string): T {
  const item = items.find((entry) => entry.id === id)
  if (!item) throw new ApiError(404, message)
  return item
}

export function plateOf(store: FleetStore, vehicleId: string): string {
  return store.plates.find((item) => item.vehicleId === vehicleId && item.active)?.value ?? '—'
}
