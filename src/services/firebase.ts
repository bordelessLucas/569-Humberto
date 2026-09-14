import { type Analytics, getAnalytics, isSupported } from 'firebase/analytics'
import { type FirebaseApp, type FirebaseOptions, initializeApp } from 'firebase/app'

const FIREBASE_ENV_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_MEASUREMENT_ID',
] as const

type FirebaseEnvKey = (typeof FIREBASE_ENV_KEYS)[number]

function readEnv(key: FirebaseEnvKey): string {
  const value = import.meta.env[key]

  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Variavel de ambiente ausente: ${key}`)
  }

  return value
}

function readFirebaseOptions(): FirebaseOptions {
  return {
    apiKey: readEnv('VITE_FIREBASE_API_KEY'),
    authDomain: readEnv('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: readEnv('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: readEnv('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: readEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: readEnv('VITE_FIREBASE_APP_ID'),
    measurementId: readEnv('VITE_FIREBASE_MEASUREMENT_ID'),
  }
}

let firebaseApp: FirebaseApp | undefined
let analyticsPromise: Promise<Analytics | null> | undefined

export function getFirebaseApp(): FirebaseApp {
  if (!firebaseApp) {
    firebaseApp = initializeApp(readFirebaseOptions())
  }

  return firebaseApp
}

export function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (!analyticsPromise) {
    analyticsPromise = isSupported()
      .then((supported) => (supported ? getAnalytics(getFirebaseApp()) : null))
      .catch(() => null)
  }

  return analyticsPromise
}

export function bootstrapFirebase(): FirebaseApp {
  const app = getFirebaseApp()
  void getFirebaseAnalytics()
  return app
}
