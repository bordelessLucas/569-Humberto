import type {
  Activity,
  Alert,
  Camera,
  CameraAudit,
  ClientCompany,
  Connection,
  DemoState,
  Device,
  Garage,
  IntegrityIssue,
  MediaFile,
  Plate,
  ProcessingJob,
  Recording,
  Segment,
  Session,
  StoragePolicy,
  SystemSettings,
  StorageStatus,
  SyncRun,
  Transfer,
  User,
  Vehicle,
  VehiclePeriodHistory,
} from '../../../domain/types.ts'
import { createSeed } from './seed.ts'

export interface Credential {
  userId: string
  password: string
}

export interface FleetStore {
  clockMinutes: number
  users: User[]
  credentials: Credential[]
  session: Session | null
  clients: ClientCompany[]
  garages: Garage[]
  vehicles: Vehicle[]
  plates: Plate[]
  devices: Device[]
  cameras: Camera[]
  connections: Connection[]
  recordings: Recording[]
  transfers: Transfer[]
  syncRuns: SyncRun[]
  periodHistory: VehiclePeriodHistory[]
  files: MediaFile[]
  segments: Segment[]
  processingJobs: ProcessingJob[]
  integrityIssues: IntegrityIssue[]
  cameraAudits: CameraAudit[]
  alerts: Alert[]
  storageStatus: StorageStatus
  storagePolicy: StoragePolicy
  settings: SystemSettings
  activity: Activity[]
  demo: DemoState
}

const SESSION_KEY = 'full-lock-session'

let state = hydrate(createSeed())
let seedSnapshot = structuredClone(state)

export function getState(): FleetStore {
  return state
}

export function resetState(): FleetStore {
  state = hydrate(structuredClone(seedSnapshot))
  markStoreDirty()
  return state
}

export function replaceState(next: FleetStore): void {
  const session = state.session
  state = next
  state.session = session
}

const dirtyListeners = new Set<() => void>()

export function markStoreDirty(): void {
  for (const listener of dirtyListeners) listener()
}

export function onStoreDirty(listener: () => void): () => void {
  dirtyListeners.add(listener)
  return () => dirtyListeners.delete(listener)
}

export function rememberSession(userId: string | null): void {
  if (typeof sessionStorage === 'undefined') return
  if (userId) sessionStorage.setItem(SESSION_KEY, userId)
  else sessionStorage.removeItem(SESSION_KEY)
}

export function stamp(store: FleetStore): string {
  store.clockMinutes += 1
  const hours = String(Math.floor(store.clockMinutes / 60)).padStart(2, '0')
  const minutes = String(store.clockMinutes % 60).padStart(2, '0')
  return `2026-09-14T${hours}:${minutes}:00-03:00`
}

export function pushActivity(store: FleetStore, activity: Omit<Activity, 'id' | 'at'> & { at?: string }): Activity {
  const entry: Activity = {
    id: `act-${store.activity.length + 1}-${activity.type}`,
    at: activity.at ?? stamp(store),
    type: activity.type,
    message: activity.message,
    vehicleId: activity.vehicleId,
  }
  store.activity.unshift(entry)
  return entry
}

function hydrate(store: FleetStore): FleetStore {
  if (typeof sessionStorage === 'undefined') return store
  const userId = sessionStorage.getItem(SESSION_KEY)
  const user = store.users.find((item) => item.id === userId)
  if (!user) return store
  store.session = {
    token: `mock-${user.id}`,
    user,
    expiresAt: '2026-09-15T08:00:00-03:00',
  }
  return store
}

