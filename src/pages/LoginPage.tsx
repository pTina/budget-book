import { signInWithGoogle } from '@/shared/lib/auth'
import { Button } from '@/shared/ui/Button'
import { useState } from 'react'

export function LoginPage({ initialError = null }: { initialError?: string | null }) {
  const [error, setError] = useState<string | null>(initialError ?? null)
  const [pending, setPending] = useState(false)

  return (
    <main className="grid h-full place-items-center bg-canvas px-6">
      <div className="w-full max-w-sm rounded-2xl bg-paper px-6 py-8 shadow-[var(--shadow-panel)]">
        <h1 className="m-0 text-2xl font-semibold text-ink">가계부</h1>
        <p className="mt-2 text-sm text-muted leading-relaxed">
          Google 계정으로 로그인하면 기기와 브라우저가 달라도 같은 지출 기록을 볼 수 있습니다.
        </p>
        <Button
          className="mt-6 w-full"
          disabled={pending}
          onClick={async () => {
            setPending(true)
            setError(null)
            try {
              await signInWithGoogle()
            } catch (caught) {
              setError(caught instanceof Error ? caught.message : '로그인에 실패했습니다.')
            } finally {
              setPending(false)
            }
          }}
        >
          {pending ? '로그인 중…' : 'Google로 로그인'}
        </Button>
        {error ? <p className="mt-3 m-0 text-sm text-danger">{error}</p> : null}
      </div>
    </main>
  )
}
