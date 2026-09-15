import type { FileQuery, ReportQuery, StoragePolicy } from '../../domain/types.ts'
import { restContract, type FleetApi } from './contracts.ts'
import { ApiError } from './errors.ts'

let token: string | null = null

export function createHttpApi(): FleetApi {
  return {
    async login(input) {
      const session = await request<Awaited<ReturnType<FleetApi['login']>>>(restContract.login.method, restContract.login.path, input)
      token = session.token
      return session
    },
    async logout() {
      await request(restContract.logout.method, restContract.logout.path)
      token = null
    },
    getSession: () => request(restContract.session.method, restContract.session.path),
    listUsers: () => request(restContract.users.method, restContract.users.path),
    createUser: (input) => request(restContract.createUser.method, restContract.createUser.path, input),
    listGarages: () => request(restContract.garages.method, restContract.garages.path),
    createGarage: (input) => request(restContract.createGarage.method, restContract.createGarage.path, input),
    listClients: () => request(restContract.clients.method, restContract.clients.path),
    listVehicles: () => request(restContract.vehicles.method, restContract.vehicles.path),
    createVehicle: (input) => request(restContract.createVehicle.method, restContract.createVehicle.path, input),
    listPlates: () => request(restContract.plates.method, restContract.plates.path),
    createPlate: (input) => request(restContract.createPlate.method, restContract.createPlate.path, input),
    listDevices: () => request(restContract.devices.method, restContract.devices.path),
    createDevice: (input) => request(restContract.createDevice.method, restContract.createDevice.path, input),
    assignDevice: (input) => request(restContract.assignDevice.method, restContract.assignDevice.path, input),
    listCameras: () => request(restContract.cameras.method, restContract.cameras.path),
    createCamera: (input) => request(restContract.createCamera.method, restContract.createCamera.path, input),
    listConnections: () => request(restContract.connections.method, restContract.connections.path),
    listRecordings: () => request(restContract.recordings.method, restContract.recordings.path),
    listTransfers: () => request(restContract.transfers.method, restContract.transfers.path),
    listSyncRuns: () => request(restContract.syncRuns.method, restContract.syncRuns.path),
    listFiles: (query) => request(restContract.files.method, `${restContract.files.path}${toQuery(query)}`),
    setFileProtection: (id, protectedFile) =>
      request(restContract.protectFile.method, restContract.protectFile.path.replace(':id', id), { protected: protectedFile }),
    listSegments: () => request(restContract.segments.method, restContract.segments.path),
    listProcessingJobs: () => request(restContract.processingJobs.method, restContract.processingJobs.path),
    listIntegrityIssues: () => request(restContract.integrityIssues.method, restContract.integrityIssues.path),
    listCameraAudits: () => request(restContract.cameraAudits.method, restContract.cameraAudits.path),
    listAlerts: () => request(restContract.alerts.method, restContract.alerts.path),
    acknowledgeAlert: (id) =>
      request(restContract.acknowledgeAlert.method, restContract.acknowledgeAlert.path.replace(':id', id)),
    getStorage: () => request(restContract.storage.method, restContract.storage.path),
    updateStoragePolicy: (input) => request(restContract.updateStoragePolicy.method, restContract.updateStoragePolicy.path, input),
    runRetention: () => request(restContract.runRetention.method, restContract.runRetention.path),
    getDashboard: () => request(restContract.dashboard.method, restContract.dashboard.path),
    listActivity: () => request(restContract.activity.method, restContract.activity.path),
    getReport: (query) => request(restContract.report.method, `${restContract.report.path}${toQuery(query)}`),
    exportReport: (query) => request(restContract.exportReport.method, `${restContract.exportReport.path}${toQuery(query)}`),
    updateUser: (id, input) => request(restContract.updateUser.method, withId(restContract.updateUser.path, id), input),
    getVehicle: (id) => request(restContract.vehicle.method, withId(restContract.vehicle.path, id)),
    updateVehicle: (id, input) => request(restContract.updateVehicle.method, withId(restContract.updateVehicle.path, id), input),
    updateGarage: (id, input) => request(restContract.updateGarage.method, withId(restContract.updateGarage.path, id), input),
    updateDevice: (id, input) => request(restContract.updateDevice.method, withId(restContract.updateDevice.path, id), input),
    getSync: (id) => request(restContract.syncRun.method, withId(restContract.syncRun.path, id)),
    getMedia: (id) => request(restContract.media.method, withId(restContract.media.path, id)),
    getCoverage: (query) => request(restContract.coverage.method, `${restContract.coverage.path}${toQuery(query)}`),
    pauseTransfer: (id) => request(restContract.pauseTransfer.method, withId(restContract.pauseTransfer.path, id)),
    resumeTransfer: (id) => request(restContract.resumeTransfer.method, withId(restContract.resumeTransfer.path, id)),
    retryTransfer: (id) => request(restContract.retryTransfer.method, withId(restContract.retryTransfer.path, id)),
    setTransferPriority: (id, priority) => request(restContract.transferPriority.method, withId(restContract.transferPriority.path, id), { priority }),
    resolveIssue: (id) => request(restContract.resolveIssue.method, withId(restContract.resolveIssue.path, id)),
    getSettings: () => request(restContract.settings.method, restContract.settings.path),
    updateSettings: (input) => request(restContract.updateSettings.method, restContract.updateSettings.path, input),
  }
}

function withId(path: string, id: string): string {
  return path.replace(':id', encodeURIComponent(id))
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL
  if (!baseUrl) {
    throw new ApiError(503, 'Backend real ainda não configurado. Defina VITE_API_BASE_URL.')
  }
  const headers = new Headers({ Accept: 'application/json' })
  if (body !== undefined) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!response.ok) {
    throw new ApiError(response.status, await readError(response))
  }
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

async function readError(response: Response): Promise<string> {
  try {
    const payload: unknown = await response.json()
    if (payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string') {
      return payload.message
    }
  } catch {
    return response.statusText || 'Falha na API.'
  }
  return response.statusText || 'Falha na API.'
}

function toQuery(query: FileQuery | ReportQuery | StoragePolicy | undefined): string {
  if (!query) return ''
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === 'string' && value.length > 0) search.set(key, value)
    if (typeof value === 'boolean') search.set(key, String(value))
    if (typeof value === 'number') search.set(key, String(value))
  }
  const text = search.toString()
  return text ? `?${text}` : ''
}
