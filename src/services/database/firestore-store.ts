import { FirebaseError, getApps, initializeApp } from 'firebase/app'
import { type Auth, createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { collection, doc, getDoc, getDocs, setDoc, type DocumentData, writeBatch } from 'firebase/firestore'
import { getFirestore } from 'firebase/firestore'
import { createSeed } from '../api/mock/seed.ts'
import { getState, onStoreDirty, replaceState, type FleetStore } from '../api/mock/store.ts'
import { ApiError } from '../api/errors.ts'
import { DEMO_PASSWORD } from '../api/mode.ts'
import { getFirebaseApp } from '../firebase.ts'
import type { Vehicle } from '../../domain/types.ts'

const ENTITIES = [
  'users',
  'clients',
  'garages',
  'vehicles',
  'plates',
  'devices',
  'cameras',
  'connections',
  'recordings',
  'transfers',
  'syncRuns',
  'periodHistory',
  'files',
  'segments',
  'processingJobs',
  'integrityIssues',
  'cameraAudits',
  'alerts',
  'activity',
] as const

type EntityKey = (typeof ENTITIES)[number]

const META = {
  bootstrap: 'bootstrap',
  runtime: 'runtime',
  storage: 'storage',
  settings: 'settings',
  demo: 'demo',
} as const

const PROVISION_APP = 'lock-provision'

let ready: Promise<void> | undefined
let tail: Promise<void> = Promise.resolve()
let dirty = false
let timer: number | undefined

export function startFirestoreStore(): Promise<void> {
  ready ??= prepare()
      .then(() => {
        onStoreDirty(() => flushSoon())
      })
      .catch((error: unknown) => {
        throw toApiError(error, 'Não foi possível abrir o Firestore.')
      })
  return ready
}

export function databaseReady(): Promise<void> {
  return startFirestoreStore()
}

export async function provisionAuthUser(email: string, password: string): Promise<void> {
  if (password.length < 6) {
    throw new ApiError(400, 'A senha precisa ter pelo menos 6 caracteres.')
  }
  const auth = provisionAuth()
  try {
    await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password)
    await signOut(auth)
  } catch (error) {
    if (error instanceof FirebaseError && error.code === 'auth/email-already-in-use') return
    throw toApiError(error, 'Não foi possível criar o acesso.')
  }
}

export function flushSoon(): void {
  if (timer !== undefined) return
  timer = window.setTimeout(() => {
    timer = undefined
    void flushNow()
  }, 700)
}

export function flushNow(): Promise<void> {
  dirty = true
  const run = tail.then(() => drain())
  tail = run.catch(() => undefined)
  return run
}

async function prepare(): Promise<void> {
  const auth = getAuth(getFirebaseApp())
  await auth.authStateReady()
  const signedIn = auth.currentUser
  await ensureDemoAccounts()
  let provisional: string | null = null
  if (!signedIn) {
    const credential = await signInWithEmailAndPassword(auth, 'admin@fulllock.local', DEMO_PASSWORD)
    provisional = credential.user.uid
  }
  try {
    const boot = await getDoc(doc(db(), 'meta', META.bootstrap))
    if (!boot.exists()) {
      await writeAll(createSeed())
      await setDoc(doc(db(), 'meta', META.bootstrap), { version: 1, seededAt: new Date().toISOString() })
    }
    await hydrate()
    if (await syncStandardProfiles()) await writeAll(getState())
  } finally {
    if (provisional && auth.currentUser?.uid === provisional) await signOut(auth)
  }
}

export function reloadFromFirestore(): Promise<void> {
  return hydrate().catch((error: unknown) => {
    throw toApiError(error, 'Não foi possível ler o Firestore.')
  })
}

const STANDARD_EMAILS: Record<string, string> = {
  'user-admin': 'admin@fulllock.local',
  'user-operador': 'operador@fulllock.local',
  'user-auditor': 'auditor@fulllock.local',
  'user-gestor': 'gestor@fulllock.local',
}

async function syncStandardProfiles(): Promise<boolean> {
  const store = getState()
  let changed = false
  for (const user of store.users) {
    const email = STANDARD_EMAILS[user.id]
    if (!email || user.email === email) continue
    user.email = email
    changed = true
  }
  return changed
}

async function ensureDemoAccounts(): Promise<void> {
  for (const user of createSeed().users) {
    await provisionAuthUser(user.email, DEMO_PASSWORD)
  }
}

function provisionAuth(): Auth {
  const existing = getApps().find((app) => app.name === PROVISION_APP)
  const app = existing ?? initializeApp(getFirebaseApp().options, PROVISION_APP)
  return getAuth(app)
}

function db() {
  return getFirestore(getFirebaseApp())
}

async function drain(): Promise<void> {
  await ready
  while (dirty) {
    dirty = false
    try {
      await writeAll(getState())
    } catch (error) {
      throw toApiError(error, 'Não foi possível gravar no Firestore.')
    }
  }
}

async function hydrate(): Promise<void> {
  const seed = createSeed()
  const next = structuredClone(seed)
  for (const key of ENTITIES) {
    assignRows(next, key, await readCollection(key))
  }
  const runtime = await readMeta<{ clockMinutes: number }>(META.runtime)
  const storage = await readMeta<{ status: FleetStore['storageStatus']; policy: FleetStore['storagePolicy'] }>(META.storage)
  const settings = await readMeta<FleetStore['settings']>(META.settings)
  const demo = await readMeta<FleetStore['demo']>(META.demo)
  if (runtime) next.clockMinutes = runtime.clockMinutes
  if (storage) {
    next.storageStatus = storage.status
    next.storagePolicy = storage.policy
  }
  if (settings) next.settings = settings
  if (demo) next.demo = demo
  next.credentials = []
  next.session = null
  migrateDomainShape(next)
  replaceState(next)
}

/** Compatibilidade com documentos gravados antes da reestruturação do domínio. */
function migrateDomainShape(store: FleetStore): void {
  if (store.clients.length === 0) {
    store.clients = createSeed().clients
  }
  for (const vehicle of store.vehicles) {
    const legacy = vehicle as Vehicle & { garageId?: string }
    if (!legacy.clientId) legacy.clientId = 'client-enel'
    if (legacy.active === undefined) legacy.active = true
    if (legacy.lastSeenGarageId === undefined) {
      legacy.lastSeenGarageId = typeof legacy.garageId === 'string' ? legacy.garageId : null
    }
    delete legacy.garageId
  }
  for (const sync of store.syncRuns) {
    if (!sync.sessionStatus) {
      sync.sessionStatus =
        sync.status === 'concluida' ? 'concluido' : sync.status === 'falha' ? 'erro' : sync.status === 'interrompida' ? 'interrompido' : 'baixando'
    }
    if (sync.unauthorizedReason === undefined) sync.unauthorizedReason = null
  }
  if (!store.periodHistory) store.periodHistory = []
  store.storagePolicy.autoDelete = false
}

function assignRows(store: FleetStore, key: EntityKey, rows: FleetStore[EntityKey]): void {
  if (key === 'users') store.users = rows as FleetStore['users']
  else if (key === 'clients') store.clients = rows as FleetStore['clients']
  else if (key === 'garages') store.garages = rows as FleetStore['garages']
  else if (key === 'vehicles') store.vehicles = rows as FleetStore['vehicles']
  else if (key === 'plates') store.plates = rows as FleetStore['plates']
  else if (key === 'devices') store.devices = rows as FleetStore['devices']
  else if (key === 'cameras') store.cameras = rows as FleetStore['cameras']
  else if (key === 'connections') store.connections = rows as FleetStore['connections']
  else if (key === 'recordings') store.recordings = rows as FleetStore['recordings']
  else if (key === 'transfers') store.transfers = rows as FleetStore['transfers']
  else if (key === 'syncRuns') store.syncRuns = rows as FleetStore['syncRuns']
  else if (key === 'periodHistory') store.periodHistory = rows as FleetStore['periodHistory']
  else if (key === 'files') store.files = rows as FleetStore['files']
  else if (key === 'segments') store.segments = rows as FleetStore['segments']
  else if (key === 'processingJobs') store.processingJobs = rows as FleetStore['processingJobs']
  else if (key === 'integrityIssues') store.integrityIssues = rows as FleetStore['integrityIssues']
  else if (key === 'cameraAudits') store.cameraAudits = rows as FleetStore['cameraAudits']
  else if (key === 'alerts') store.alerts = rows as FleetStore['alerts']
  else store.activity = rows as FleetStore['activity']
}

async function readCollection(key: EntityKey): Promise<FleetStore[EntityKey]> {
  const snap = await getDocs(collection(db(), key))
  return snap.docs.map((item) => item.data()) as FleetStore[EntityKey]
}

async function readMeta<T>(id: string): Promise<T | null> {
  const snap = await getDoc(doc(db(), 'meta', id))
  if (!snap.exists()) return null
  return snap.data() as T
}

async function writeAll(store: FleetStore): Promise<void> {
  const ops: Array<{ kind: 'set'; path: string; id: string; data: DocumentData } | { kind: 'delete'; path: string; id: string }> = []
  for (const key of ENTITIES) {
    const items = store[key] as Array<{ id: string }>
    const keep = new Set(items.map((item) => item.id))
    const existing = await getDocs(collection(db(), key))
    for (const item of existing.docs) {
      if (!keep.has(item.id)) ops.push({ kind: 'delete', path: key, id: item.id })
    }
    for (const item of items) {
      ops.push({ kind: 'set', path: key, id: item.id, data: plain(item) })
    }
  }
  ops.push({ kind: 'set', path: 'meta', id: META.runtime, data: { clockMinutes: store.clockMinutes } })
  ops.push({ kind: 'set', path: 'meta', id: META.storage, data: plain({ status: store.storageStatus, policy: store.storagePolicy }) })
  ops.push({ kind: 'set', path: 'meta', id: META.settings, data: plain(store.settings) })
  ops.push({ kind: 'set', path: 'meta', id: META.demo, data: plain(store.demo) })
  for (let index = 0; index < ops.length; index += 400) {
    const batch = writeBatch(db())
    for (const op of ops.slice(index, index + 400)) {
      const ref = doc(db(), op.path, op.id)
      if (op.kind === 'set') batch.set(ref, op.data)
      else batch.delete(ref)
    }
    await batch.commit()
  }
}

function plain(value: unknown): DocumentData {
  return JSON.parse(JSON.stringify(value)) as DocumentData
}

function toApiError(error: unknown, fallback: string): ApiError {
  if (error instanceof ApiError) return error
  if (error instanceof FirebaseError) {
    if (error.code === 'auth/email-already-in-use') return new ApiError(409, 'Já existe usuário com este e-mail.')
    if (error.code === 'auth/weak-password') return new ApiError(400, 'A senha precisa ter pelo menos 6 caracteres.')
    if (error.code === 'auth/operation-not-allowed') {
      return new ApiError(503, 'Ative o login por e-mail e senha no Firebase Authentication.')
    }
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-email' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      return new ApiError(401, 'E-mail ou senha inválidos.')
    }
    if (error.code === 'permission-denied') {
      return new ApiError(503, 'O Firestore recusou o acesso. Publique firestore.rules neste projeto.')
    }
  }
  return new ApiError(500, error instanceof Error ? error.message : fallback)
}

export { toApiError }
