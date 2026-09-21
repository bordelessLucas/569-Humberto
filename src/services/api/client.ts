import type { DemoState } from '../../domain/types.ts'
import type { FleetApi } from './contracts.ts'
import { apiMode } from './mode.ts'

let apiPromise: Promise<FleetApi> | undefined

export const api = new Proxy(
  {},
  {
    get(_target, key) {
      return (...args: unknown[]) =>
        getApi().then((client) => {
          const method = client[key as keyof FleetApi]
          if (typeof method !== 'function') throw new Error(`Metodo de API invalido: ${String(key)}`)
          return (method as (...input: unknown[]) => unknown)(...args)
        })
    },
  },
) as FleetApi

export interface DemoClient {
  getState(): Promise<DemoState>
  playArrival(onUpdate: () => void): Promise<void>
  reset(): Promise<void>
}

export function getDemoClient(): DemoClient | null {
  if (apiMode() !== 'mock') return null
  return {
    async getState() {
      const demo = await import('./mock/demo.ts')
      return demo.getDemoState()
    },
    async playArrival(onUpdate) {
      const demo = await import('./mock/demo.ts')
      await demo.playArrival(onUpdate)
    },
    async reset() {
      const demo = await import('./mock/demo.ts')
      demo.resetDemo()
    },
  }
}

export function waitForDatabase(): Promise<void> {
  if (apiMode() !== 'firestore') return Promise.resolve()
  return import('../database/firestore-store.ts').then((store) => store.databaseReady())
}

function getApi(): Promise<FleetApi> {
  apiPromise ??= createApi()
  return apiPromise
}

async function createApi(): Promise<FleetApi> {
  const mode = apiMode()
  if (mode === 'real') return import('./http.ts').then((module) => module.createHttpApi())
  if (mode === 'firestore') return import('./firestore-api.ts').then((module) => module.createFirestoreApi())
  return import('./mock/handlers.ts').then((module) => module.createMockApi())
}
