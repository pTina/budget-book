import { getFirebaseAuth } from '@/shared/lib/firebase'
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth'
import { useEffect, useState } from 'react'

const googleProvider = () => {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  return provider
}

/** persistence는 initializeAuth에서 설정됨 */
export async function initAuthPersistence() {
  const auth = getFirebaseAuth()
  await auth.authStateReady()
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

/** GitHub Pages에서는 redirect가 세션을 잃어 다시 로그인 화면이 뜨므로 팝업만 사용 */
export async function signInWithGoogle() {
  await signInWithPopup(getFirebaseAuth(), googleProvider())
}

export function logOut() {
  return signOut(getFirebaseAuth())
}
