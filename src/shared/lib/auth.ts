import { getFirebaseAuth } from '@/shared/lib/firebase'
import { FirebaseError } from 'firebase/app'
import {
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth'
import { useEffect, useState } from 'react'

const REDIRECT_FLAG = 'budget-book:google-redirect'

const googleProvider = () => {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  return provider
}

function isMobileBrowser() {
  if (typeof navigator === 'undefined') return false
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
}

function isRedirectFallbackError(error: unknown) {
  if (!(error instanceof FirebaseError)) return false
  return (
    error.code === 'auth/popup-blocked' ||
    error.code === 'auth/popup-closed-by-user' ||
    error.code === 'auth/cancelled-popup-request' ||
    error.code === 'auth/operation-not-supported-in-this-environment' ||
    error.code === 'auth/argument-error'
  )
}

/** persistence는 initializeAuth에서 설정됨 */
export async function initAuthPersistence() {
  getFirebaseAuth()
}

export function subscribeAuth(onUser: (user: User | null) => void) {
  return onAuthStateChanged(getFirebaseAuth(), onUser)
}

export function useAuthUser() {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    return onAuthStateChanged(getFirebaseAuth(), (next) => {
      setUser(next)
      setReady(true)
    })
  }, [])

  return { user, ready }
}

export function requireUid() {
  const uid = getFirebaseAuth().currentUser?.uid
  if (!uid) {
    throw new Error('로그인이 필요합니다.')
  }
  return uid
}

export function isGoogleRedirectPending() {
  try {
    return sessionStorage.getItem(REDIRECT_FLAG) === '1'
  } catch {
    return false
  }
}

export async function completeGoogleRedirect(): Promise<User | null> {
  const auth = getFirebaseAuth()
  try {
    const result = await getRedirectResult(auth)
    try {
      sessionStorage.removeItem(REDIRECT_FLAG)
    } catch {
      /* ignore */
    }
    return result?.user ?? auth.currentUser
  } catch (error) {
    try {
      sessionStorage.removeItem(REDIRECT_FLAG)
    } catch {
      /* ignore */
    }
    throw error
  }
}

async function startGoogleRedirect() {
  try {
    sessionStorage.setItem(REDIRECT_FLAG, '1')
  } catch {
    /* ignore */
  }
  await signInWithRedirect(getFirebaseAuth(), googleProvider())
}

/**
 * PC: 팝업 우선, 실패 시 redirect.
 * 모바일: popup이 자주 깨지므로 redirect를 우선 사용.
 */
export async function signInWithGoogle() {
  if (isMobileBrowser()) {
    await startGoogleRedirect()
    return
  }

  try {
    await signInWithPopup(getFirebaseAuth(), googleProvider())
  } catch (error) {
    if (!isRedirectFallbackError(error)) throw error
    await startGoogleRedirect()
  }
}

export function logOut() {
  return signOut(getFirebaseAuth())
}
