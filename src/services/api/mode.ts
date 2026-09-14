export type ApiMode = 'mock' | 'firestore' | 'real'

export function apiMode(): ApiMode {
  const mode = import.meta.env.VITE_API_MODE
  if (mode === 'firestore' || mode === 'real') return mode
  return 'mock'
}

export function isMockMode(): boolean {
  return apiMode() === 'mock'
}

export function isFirestoreMode(): boolean {
  return apiMode() === 'firestore'
}

export const DEMO_PASSWORD = 'borderless'
