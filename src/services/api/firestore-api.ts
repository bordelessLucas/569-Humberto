import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import type { LoginInput, Session } from '../../domain/types.ts'
import { getFirebaseApp } from '../firebase.ts'
import { databaseReady, flushNow, provisionAuthUser, reloadFromFirestore, toApiError } from '../database/firestore-store.ts'
import type { FleetApi } from './contracts.ts'
import { ApiError } from './errors.ts'
import { createMockApi } from './mock/handlers.ts'
import { getState, rememberSession } from './mock/store.ts'

export function createFirestoreApi(): FleetApi {
  const mock = createMockApi()

  return {
    ...mock,
    login: async (input) => login(input),
    logout: async () => {
      await signOut(getAuth(getFirebaseApp()))
      await mock.logout()
    },
    getSession: () => currentSession(),
    createUser: (input) =>
      saved(async () => {
        const email = input.email.trim().toLowerCase()
        if (getState().users.some((user) => user.email === email)) {
          throw new ApiError(409, 'Já existe usuário com este e-mail.')
        }
        await provisionAuthUser(email, input.password)
        return mock.createUser(input)
      }),
    createGarage: (input) => saved(() => mock.createGarage(input)),
    createVehicle: (input) => saved(() => mock.createVehicle(input)),
    createPlate: (input) => saved(() => mock.createPlate(input)),
    createDevice: (input) => saved(() => mock.createDevice(input)),
    assignDevice: (input) => saved(() => mock.assignDevice(input)),
    createCamera: (input) => saved(() => mock.createCamera(input)),
    setFileProtection: (id, protectedFile) => saved(() => mock.setFileProtection(id, protectedFile)),
    acknowledgeAlert: (id) => saved(() => mock.acknowledgeAlert(id)),
    updateStoragePolicy: (input) => saved(() => mock.updateStoragePolicy(input)),
    runRetention: () => saved(() => mock.runRetention()),
    updateUser: (id, input) => saved(() => mock.updateUser(id, input)),
    updateVehicle: (id, input) => saved(() => mock.updateVehicle(id, input)),
    updateGarage: (id, input) => saved(() => mock.updateGarage(id, input)),
    updateDevice: (id, input) => saved(() => mock.updateDevice(id, input)),
    pauseTransfer: (id) => saved(() => mock.pauseTransfer(id)),
    resumeTransfer: (id) => saved(() => mock.resumeTransfer(id)),
    retryTransfer: (id) => saved(() => mock.retryTransfer(id)),
    setTransferPriority: (id, priority) => saved(() => mock.setTransferPriority(id, priority)),
    resolveIssue: (id) => saved(() => mock.resolveIssue(id)),
    updateSettings: (input) => saved(() => mock.updateSettings(input)),
    startGarageIngest: (input) => saved(() => mock.startGarageIngest(input)),
  }
}

async function saved<T>(work: () => Promise<T>): Promise<T> {
  await gate()
  const value = await work()
  await flushNow()
  return value
}

async function gate(): Promise<void> {
  try {
    await databaseReady()
  } catch (error) {
    throw toApiError(error, 'Não foi possível abrir o Firestore.')
  }
}

async function login(input: LoginInput): Promise<Session> {
  await gate()
  const auth = getAuth(getFirebaseApp())
  try {
    const credential = await signInWithEmailAndPassword(auth, input.email.trim().toLowerCase(), input.password)
    await reloadFromFirestore()
    const user = getState().users.find((item) => item.email === credential.user.email)
    if (!user?.active) {
      await signOut(auth)
      throw new ApiError(401, user ? 'Usuário inativo.' : 'Usuário sem perfil no painel.')
    }
    const session: Session = {
      token: await credential.user.getIdToken(),
      user,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    }
    getState().session = session
    rememberSession(user.id)
    return structuredClone(session)
  } catch (error) {
    throw toApiError(error, 'Não foi possível entrar.')
  }
}

async function currentSession(): Promise<Session | null> {
  const auth = getAuth(getFirebaseApp())
  await auth.authStateReady()
  const current = auth.currentUser
  if (!current?.email) {
    getState().session = null
    return null
  }
  await gate()
  const user = getState().users.find((item) => item.email === current.email)
  if (!user?.active) return null
  const session: Session = {
    token: await current.getIdToken(),
    user,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  }
  getState().session = session
  rememberSession(user.id)
  return structuredClone(session)
}
