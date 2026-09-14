import type {
  AssignDeviceInput,
  CreateCameraInput,
  CreateDeviceInput,
  CreateGarageInput,
  CreatePlateInput,
  CreateUserInput,
  CreateVehicleInput,
  DashboardSummary,
  FileQuery,
  MediaFile,
  OperationsReport,
  ReportQuery,
  StoragePolicy,
} from '../../../domain/types.ts'
import type { FleetApi } from '../contracts.ts'
import { ApiError } from '../errors.ts'
import { getState, pushActivity, rememberSession, stamp, type FleetStore } from './store.ts'
import {
  coverage,
  mediaDetail,
  pauseTransfer as pauseTransferRecord,
  readSettings,
  resolveIssue as resolveIssueRecord,
  resumeTransfer as resumeTransferRecord,
  retryTransfer as retryTransferRecord,
  setPriority,
  syncDetail,
  updateDevice as updateDeviceRecord,
  updateGarage as updateGarageRecord,
  updateUser as updateUserRecord,
  updateVehicle as updateVehicleRecord,
  vehicleDetail,
  writeSettings,
} from './views.ts'

const wait = () => new Promise((resolve) => setTimeout(resolve, 80))

export function createMockApi(): FleetApi {
  return {
    async login(input) {
      await wait()
      const store = getState()
      const user = store.users.find((item) => item.email === input.email.trim().toLowerCase())
      const credential = store.credentials.find((item) => item.userId === user?.id)
      if (!user || !user.active || !credential || credential.password !== input.password) {
        throw new ApiError(401, 'E-mail ou senha inválidos.')
      }
      store.session = {
        token: `mock-${user.id}`,
        user,
        expiresAt: '2026-09-15T08:00:00-03:00',
      }
      rememberSession(user.id)
      return structuredClone(store.session)
    },
    async logout() {
      await wait()
      getState().session = null
      rememberSession(null)
    },
    async getSession() {
      await wait()
      const session = getState().session
      return session ? structuredClone(session) : null
    },
    async listUsers() {
      await wait()
      requireSession()
      return structuredClone(getState().users)
    },
    async createUser(input) {
      await wait()
      requireAdmin()
      return createUser(input)
    },
    async listGarages() {
      await wait()
      requireSession()
      return structuredClone(getState().garages)
    },
    async createGarage(input) {
      await wait()
      requireAdmin()
      return createGarage(input)
    },
    async listVehicles() {
      await wait()
      requireSession()
      return structuredClone(getState().vehicles)
    },
    async createVehicle(input) {
      await wait()
      requireAdmin()
      return createVehicle(input)
    },
    async listPlates() {
      await wait()
      requireSession()
      return structuredClone(getState().plates)
    },
    async createPlate(input) {
      await wait()
      requireAdmin()
      return createPlate(input)
    },
    async listDevices() {
      await wait()
      requireSession()
      return structuredClone(getState().devices)
    },
    async createDevice(input) {
      await wait()
      requireAdmin()
      return createDevice(input)
    },
    async assignDevice(input) {
      await wait()
      requireAdmin()
      return assignDevice(input)
    },
    async listCameras() {
      await wait()
      requireSession()
      return structuredClone(getState().cameras)
    },
    async createCamera(input) {
      await wait()
      requireAdmin()
      return createCamera(input)
    },
    async listConnections() {
      await wait()
      requireSession()
      return structuredClone(getState().connections)
    },
    async listRecordings() {
      await wait()
      requireSession()
      return structuredClone(getState().recordings)
    },
    async listTransfers() {
      await wait()
      requireSession()
      return structuredClone(getState().transfers)
    },
    async listSyncRuns() {
      await wait()
      requireSession()
      return structuredClone(getState().syncRuns)
    },
    async listFiles(query) {
      await wait()
      requireSession()
      return structuredClone(filterFiles(getState(), query))
    },
    async setFileProtection(id, protectedFile) {
      await wait()
      requireAdmin()
      const file = find(getState().files, id, 'Arquivo não encontrado.')
      file.protected = protectedFile
      return structuredClone(file)
    },
    async listSegments() {
      await wait()
      requireSession()
      return structuredClone(getState().segments)
    },
    async listProcessingJobs() {
      await wait()
      requireSession()
      return structuredClone(getState().processingJobs)
    },
    async listIntegrityIssues() {
      await wait()
      requireSession()
      return structuredClone(getState().integrityIssues)
    },
    async listCameraAudits() {
      await wait()
      requireSession()
      return structuredClone(getState().cameraAudits)
    },
    async listAlerts() {
      await wait()
      requireSession()
      return structuredClone(getState().alerts)
    },
    async acknowledgeAlert(id) {
      await wait()
      requireSession()
      const alert = find(getState().alerts, id, 'Alerta não encontrado.')
      alert.acknowledged = true
      return structuredClone(alert)
    },
    async getStorage() {
      await wait()
      requireSession()
      const store = getState()
      return { status: structuredClone(store.storageStatus), policy: structuredClone(store.storagePolicy) }
    },
    async updateStoragePolicy(input) {
      await wait()
      requireAdmin()
      return updatePolicy(input)
    },
    async runRetention() {
      await wait()
      requireAdmin()
      return runRetention()
    },
    async getDashboard() {
      await wait()
      requireSession()
      return buildDashboard(getState())
    },
    async listActivity() {
      await wait()
      requireSession()
      return structuredClone(getState().activity)
    },
    async getReport(query) {
      await wait()
      requireSession()
      return buildReport(getState(), query)
    },
    async exportReport(query) {
      await wait()
      requireSession()
      const report = buildReport(getState(), query)
      const lines = [
        'veiculo,placa,downloads,falhas',
        ...report.byVehicle.map((row) => `${row.name},${row.plate},${row.downloads},${row.failures}`),
      ]
      return {
        filename: `relatorio-${query.from}-${query.to}.csv`,
        mimeType: 'text/csv',
        content: lines.join('\n'),
      }
    },
    async updateUser(id, input) {
      await wait()
      requireAdmin()
      return updateUserRecord(id, input)
    },
    async getVehicle(id) {
      await wait()
      requireSession()
      return vehicleDetail(id)
    },
    async updateVehicle(id, input) {
      await wait()
      requireAdmin()
      return updateVehicleRecord(id, input)
    },
    async updateGarage(id, input) {
      await wait()
      requireAdmin()
      return updateGarageRecord(id, input)
    },
    async updateDevice(id, input) {
      await wait()
      requireAdmin()
      return updateDeviceRecord(id, input)
    },
    async getSync(id) {
      await wait()
      requireSession()
      return syncDetail(id)
    },
    async getMedia(id) {
      await wait()
      requireSession()
      return mediaDetail(id)
    },
    async getCoverage(query) {
      await wait()
      requireSession()
      return coverage(query)
    },
    async pauseTransfer(id) {
      await wait()
      requireOperator()
      return pauseTransferRecord(id)
    },
    async resumeTransfer(id) {
      await wait()
      requireOperator()
      return resumeTransferRecord(id)
    },
    async retryTransfer(id) {
      await wait()
      requireOperator()
      return retryTransferRecord(id)
    },
    async setTransferPriority(id, priority) {
      await wait()
      requireOperator()
      return setPriority(id, priority)
    },
    async resolveIssue(id) {
      await wait()
      requireOperator()
      return resolveIssueRecord(id)
    },
    async getSettings() {
      await wait()
      requireAdmin()
      return readSettings()
    },
    async updateSettings(input) {
      await wait()
      requireAdmin()
      return writeSettings(input)
    },
  }
}

function requireSession() {
  if (!getState().session) throw new ApiError(401, 'Sessão expirada.')
}

function requireAdmin() {
  requireSession()
  if (getState().session?.user.role !== 'admin') {
    throw new ApiError(403, 'Apenas administrador pode alterar cadastros.')
  }
}

function requireOperator() {
  requireSession()
  const role = getState().session?.user.role
  if (role !== 'admin' && role !== 'operador') {
    throw new ApiError(403, 'Este perfil só acompanha a operação.')
  }
}

function find<T extends { id: string }>(items: T[], id: string, message: string): T {
  const item = items.find((entry) => entry.id === id)
  if (!item) throw new ApiError(404, message)
  return item
}

function nextId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

function createUser(input: CreateUserInput) {
  const store = getState()
  const email = input.email.trim().toLowerCase()
  if (store.users.some((item) => item.email === email)) {
    throw new ApiError(409, 'Já existe usuário com este e-mail.')
  }
  const user = { id: nextId('user'), name: input.name.trim(), email, role: input.role, active: true }
  store.users.push(user)
  store.credentials.push({ userId: user.id, password: input.password })
  pushActivity(store, { type: 'user.created', vehicleId: null, message: `Usuário ${user.name} cadastrado.` })
  return structuredClone(user)
}

function createGarage(input: CreateGarageInput) {
  const garage = {
    id: nextId('garage'),
    name: input.name.trim(),
    city: input.city.trim(),
    wifiSsid: input.wifiSsid.trim(),
  }
  getState().garages.push(garage)
  return structuredClone(garage)
}

function createVehicle(input: CreateVehicleInput) {
  const store = getState()
  find(store.garages, input.garageId, 'Garagem não encontrada.')
  const plateValue = input.plate.trim().toUpperCase()
  if (store.plates.some((item) => item.value === plateValue && item.active)) {
    throw new ApiError(409, 'Placa já cadastrada.')
  }
  const vehicle = {
    id: nextId('veh'),
    garageId: input.garageId,
    name: input.name.trim(),
    fleetNumber: input.fleetNumber.trim(),
    operationalStatus: 'desconectado' as const,
    lastConnectionAt: null,
    lastSyncAt: null,
    lastJobMinutes: null,
  }
  store.vehicles.push(vehicle)
  store.plates.push({ id: nextId('plt'), vehicleId: vehicle.id, value: plateValue, active: true })
  if (input.deviceId) assignDevice({ deviceId: input.deviceId, vehicleId: vehicle.id })
  return structuredClone(vehicle)
}

function createPlate(input: CreatePlateInput) {
  const store = getState()
  find(store.vehicles, input.vehicleId, 'Veículo não encontrado.')
  const value = input.value.trim().toUpperCase()
  if (store.plates.some((item) => item.value === value && item.active)) {
    throw new ApiError(409, 'Placa já cadastrada.')
  }
  const plate = { id: nextId('plt'), vehicleId: input.vehicleId, value, active: true }
  store.plates.push(plate)
  return structuredClone(plate)
}

function createDevice(input: CreateDeviceInput) {
  const store = getState()
  if (input.vehicleId) find(store.vehicles, input.vehicleId, 'Veículo não encontrado.')
  const device = {
    id: nextId('dev'),
    vehicleId: input.vehicleId ?? null,
    model: input.model.trim(),
    serial: input.serial.trim(),
    firmware: input.firmware.trim(),
    ip: input.ip.trim(),
    mac: input.mac.trim().toUpperCase(),
    lastSeenAt: null,
  }
  store.devices.push(device)
  return structuredClone(device)
}

function assignDevice(input: AssignDeviceInput) {
  const store = getState()
  find(store.vehicles, input.vehicleId, 'Veículo não encontrado.')
  const device = find(store.devices, input.deviceId, 'Equipamento não encontrado.')
  device.vehicleId = input.vehicleId
  return structuredClone(device)
}

function createCamera(input: CreateCameraInput) {
  const store = getState()
  find(store.vehicles, input.vehicleId, 'Veículo não encontrado.')
  const device = find(store.devices, input.deviceId, 'Equipamento não encontrado.')
  if (device.vehicleId && device.vehicleId !== input.vehicleId) {
    throw new ApiError(409, 'Equipamento já associado a outro veículo.')
  }
  device.vehicleId = input.vehicleId
  const camera = {
    id: nextId('cam'),
    vehicleId: input.vehicleId,
    deviceId: input.deviceId,
    name: input.name.trim(),
    position: input.position.trim(),
    online: false,
  }
  store.cameras.push(camera)
  return structuredClone(camera)
}

function updatePolicy(input: StoragePolicy) {
  const store = getState()
  if (input.retentionDays < 1) throw new ApiError(400, 'Retenção precisa ser de pelo menos 1 dia.')
  store.storagePolicy = { ...input }
  const usedPercent = (store.storageStatus.usedBytes / store.storageStatus.capacityBytes) * 100
  store.storageStatus.alert = usedPercent >= input.alertThresholdPercent
  return { status: structuredClone(store.storageStatus), policy: structuredClone(store.storagePolicy) }
}

function runRetention() {
  const store = getState()
  const limit = Date.now() - store.storagePolicy.retentionDays * 24 * 60 * 60 * 1000
  let deleted = 0
  let keptProtected = 0
  if (!store.storagePolicy.autoDelete) {
    return { deleted: 0, keptProtected: store.files.filter((file) => file.protected).length, ranAt: stamp(store) }
  }
  for (const file of store.files) {
    if (file.status === 'excluido') continue
    if (new Date(file.recordedAt).getTime() >= limit) continue
    if (file.protected) {
      keptProtected += 1
      continue
    }
    file.status = 'excluido'
    store.storageStatus.usedBytes = Math.max(0, store.storageStatus.usedBytes - file.sizeBytes)
    deleted += 1
  }
  store.storageStatus.availableBytes = store.storageStatus.capacityBytes - store.storageStatus.usedBytes
  pushActivity(store, {
    type: 'retention.ran',
    vehicleId: null,
    message: `Retenção simulada: ${deleted} arquivo(s) excluído(s), ${keptProtected} protegido(s).`,
  })
  return { deleted, keptProtected, ranAt: stamp(store) }
}

function filterFiles(store: FleetStore, query: FileQuery | undefined): MediaFile[] {
  return store.files.filter((file) => {
    if (!query) return true
    const vehicle = store.vehicles.find((item) => item.id === file.vehicleId)
    const plate = store.plates.find((item) => item.vehicleId === file.vehicleId && item.active)
    if (query.vehicleId && file.vehicleId !== query.vehicleId) return false
    if (query.cameraId && file.cameraId !== query.cameraId) return false
    if (query.garageId && file.garageId !== query.garageId) return false
    if (query.status && file.status !== query.status) return false
    if (query.plate && !plate?.value.toLowerCase().includes(query.plate.toLowerCase())) return false
    if (query.date && !file.recordedAt.startsWith(query.date)) return false
    if (query.time && !file.recordedAt.includes(`T${query.time}`)) return false
    if (query.vehicleId && vehicle?.id !== query.vehicleId) return false
    return true
  })
}

function buildDashboard(store: FleetStore): DashboardSummary {
  const vehicles = store.vehicles.map((vehicle) => {
    const cameras = store.cameras.filter((item) => item.vehicleId === vehicle.id)
    const transfer = store.transfers.find(
      (item) => item.vehicleId === vehicle.id && (item.status === 'baixando' || item.status === 'interrompido'),
    )
    const plate = store.plates.find((item) => item.vehicleId === vehicle.id && item.active)
    return {
      vehicleId: vehicle.id,
      name: vehicle.name,
      plate: plate?.value ?? '—',
      status: vehicle.operationalStatus,
      camerasReady: cameras.filter((item) => item.online).length,
      camerasTotal: cameras.length,
      durationMinutes: vehicle.lastJobMinutes,
      progress: transfer?.progress ?? null,
      lastUpdate: vehicle.lastSyncAt ?? vehicle.lastConnectionAt,
    }
  })
  const count = (status: DashboardSummary['vehicles'][number]['status']) =>
    store.vehicles.filter((item) => item.operationalStatus === status).length
  return {
    concluded: count('concluido'),
    downloading: count('baixando'),
    pending: count('pendente'),
    withError: count('erro'),
    total: store.vehicles.length,
    connected: store.connections.filter((item) => item.status === 'ativa').length,
    activeSyncs: store.syncRuns.filter((item) => item.status === 'em_andamento' || item.status === 'interrompida').length,
    activeDownloads: store.transfers.filter((item) => item.status === 'baixando' || item.status === 'pausado').length,
    camerasOnline: store.cameras.filter((item) => item.online).length,
    filesProcessed: store.files.filter((item) => item.status === 'disponivel' || item.indexed).length,
    segments15: store.segments.length,
    storageUsedPercent: Math.round((store.storageStatus.usedBytes / store.storageStatus.capacityBytes) * 100),
    updatedAt: new Date().toISOString(),
    vehicles,
  }
}

function buildReport(store: FleetStore, query: ReportQuery): OperationsReport {
  const vehicles = store.vehicles.filter((item) => !query.vehicleId || item.id === query.vehicleId)
  return {
    from: query.from,
    to: query.to,
    synchronizations: store.syncRuns.filter((item) => !query.vehicleId || item.vehicleId === query.vehicleId).length,
    downloads: store.transfers.filter((item) => item.status === 'concluido' && (!query.vehicleId || item.vehicleId === query.vehicleId)).length,
    processings: store.processingJobs.filter((item) => !query.vehicleId || item.vehicleId === query.vehicleId).length,
    failures: store.syncRuns.filter((item) => item.status === 'falha' && (!query.vehicleId || item.vehicleId === query.vehicleId)).length,
    byVehicle: vehicles.map((vehicle) => ({
      vehicleId: vehicle.id,
      name: vehicle.name,
      plate: store.plates.find((item) => item.vehicleId === vehicle.id && item.active)?.value ?? '—',
      downloads: store.transfers.filter((item) => item.vehicleId === vehicle.id && item.status === 'concluido').length,
      failures: store.syncRuns.filter((item) => item.vehicleId === vehicle.id && item.status === 'falha').length,
    })),
  }
}

