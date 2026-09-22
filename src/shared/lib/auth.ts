import { getFirebaseAuth } from '@/shared/lib/firebase'
import { FirebaseError } from 'firebase/app'
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  getRedirectResult,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth'
import { useEffect, useState } from 'react'

const googleProvider = () => new GoogleAuthProvider()

function prefersRedirectSignIn() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const iOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  return iOS || /Android/i.test(ua)
}

export async function initAuthPersistence() {
  await setPersistence(getFirebaseAuth(), browserLocalPersistence)
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

export async function completeGoogleRedirect() {
  await getRedirectResult(getFirebaseAuth())
}

export async function signInWithGoogle() {
  const auth = getFirebaseAuth()
  const provider = googleProvider()

  if (prefersRedirectSignIn()) {
    await signInWithRedirect(auth, provider)
    return
  }

  try {
    await signInWithPopup(auth, provider)
  } catch (error) {
    if (
      error instanceof FirebaseError &&
      (error.code === 'auth/popup-blocked' ||
        error.code === 'auth/operation-not-supported-in-this-environment')
    ) {
      await signInWithRedirect(auth, provider)
      return
    }
    throw error
  }
}

export function logOut() {
  return signOut(getFirebaseAuth())
}
