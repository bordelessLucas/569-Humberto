import type { DemoState } from '../../domain/types.ts'
import { databaseReady } from '../database/firestore-store.ts'
import type { FleetApi } from './contracts.ts'
import { createFirestoreApi } from './firestore-api.ts'
import { createHttpApi } from './http.ts'
import { getDemoState, playArrival, resetDemo } from './mock/demo.ts'
import { createMockApi } from './mock/handlers.ts'
import { apiMode } from './mode.ts'

export const api: FleetApi = createApi()

export interface DemoClient {
  getState(): DemoState
  playArrival(onUpdate: () => void): Promise<void>
  reset(): void
}

export function getDemoClient(): DemoClient | null {
  if (apiMode() === 'real') return null
  return {
    getState: getDemoState,
    playArrival,
    reset: resetDemo,
  }
}

export function waitForDatabase(): Promise<void> {
  if (apiMode() !== 'firestore') return Promise.resolve()
  return databaseReady()
}

function createApi(): FleetApi {
  const mode = apiMode()
  if (mode === 'real') return createHttpApi()
  if (mode === 'firestore') return createFirestoreApi()
  return createMockApi()
}
