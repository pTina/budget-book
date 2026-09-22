import { QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import { LoginPage } from '@/pages/LoginPage'
import { initAuthPersistence, subscribeAuth } from '@/shared/lib/auth'
import { getFirebaseConfigError } from '@/shared/lib/firebase'
import { queryClient } from '@/shared/lib/queryClient'
import { queryKeys } from '@/shared/lib/queryKeys'
import { clearStorageCache, subscribeUserData } from '@/shared/storage'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <FirebaseGate>{children}</FirebaseGate>
    </QueryClientProvider>
  )
}

function FirebaseGate({ children }: { children: ReactNode }) {
  const configError = getFirebaseConfigError()
  const [ready, setReady] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (configError) return

    let stopData = () => {}
    let stopAuth = () => {}
    let cancelled = false

    void (async () => {
      try {
        await initAuthPersistence()
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof Error ? caught.message : '인증 초기화에 실패했습니다.',
          )
          setReady(true)
        }
        return
      }

      if (cancelled) return

      stopAuth = subscribeAuth((user) => {
        stopData()
        clearStorageCache()
        void queryClient.removeQueries({ queryKey: queryKeys.all })
        void queryClient.removeQueries({ queryKey: queryKeys.categories })
        void queryClient.removeQueries({ queryKey: queryKeys.paymentMethods })
        void queryClient.removeQueries({ queryKey: queryKeys.expenses })
        void queryClient.removeQueries({ queryKey: queryKeys.recurrings })
        void queryClient.removeQueries({ queryKey: queryKeys.budget })

        if (!user) {
          setSignedIn(false)
          setReady(true)
          return
        }

        try {
          stopData = subscribeUserData(() => {
            void queryClient.invalidateQueries({ queryKey: queryKeys.all })
            void queryClient.invalidateQueries({ queryKey: queryKeys.categories })
            void queryClient.invalidateQueries({ queryKey: queryKeys.paymentMethods })
            void queryClient.invalidateQueries({ queryKey: queryKeys.expenses })
            void queryClient.invalidateQueries({ queryKey: queryKeys.recurrings })
            void queryClient.invalidateQueries({ queryKey: queryKeys.budget })
          })
          setSignedIn(true)
          setReady(true)
          setError(null)
        } catch (caught) {
          setError(
            caught instanceof Error ? caught.message : 'Firebase 연결에 실패했습니다.',
          )
          setReady(true)
        }
      })
    })()

    return () => {
      cancelled = true
      stopAuth()
      stopData()
    }
  }, [configError])

  if (configError) {
    return (
      <div className="grid h-full place-items-center bg-canvas px-6 text-center text-sm text-muted leading-relaxed">
        {configError}
        <br />
        <span className="mt-2 block text-xs">
          .env.example을 복사해 .env를 만든 뒤 Firebase 콘솔 값을 넣어 주세요.
        </span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid h-full place-items-center bg-canvas px-6 text-center text-sm text-muted">
        {error}
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="grid h-full place-items-center bg-canvas text-sm text-muted">
        불러오는 중…
      </div>
    )
  }

  if (!signedIn) {
    return <LoginPage />
  }

  return children
}
