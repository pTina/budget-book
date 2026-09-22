import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  browserLocalPersistence,
  getAuth,
  indexedDBLocalPersistence,
  initializeAuth,
  type Auth,
} from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

const required = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
] as const

export function getFirebaseConfigError(): string | null {
  const missing = required.filter((key) => !import.meta.env[key])
  if (missing.length === 0) return null
  return `Firebase 설정이 없습니다. .env에 ${missing.join(', ')} 를 추가하세요.`
}

let app: FirebaseApp | undefined
let authInstance: Auth | undefined
let dbInstance: Firestore | undefined

function ensureApp(): FirebaseApp {
  const error = getFirebaseConfigError()
  if (error) throw new Error(error)
  if (!app) {
    app = initializeApp({
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    })
  }
  return app
}

/** 모바일 Safari 등에서 redirect 로그인 세션 유지를 위해 IndexedDB 우선 */
export function getFirebaseAuth(): Auth {
  if (authInstance) return authInstance
  const firebaseApp = ensureApp()
  try {
    authInstance = initializeAuth(firebaseApp, {
      persistence: [indexedDBLocalPersistence, browserLocalPersistence],
    })
  } catch {
    authInstance = getAuth(firebaseApp)
  }
  return authInstance
}

export function getFirestoreDb(): Firestore {
  if (!dbInstance) dbInstance = getFirestore(ensureApp())
  return dbInstance
}
