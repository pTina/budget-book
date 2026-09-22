import { Button } from './Button'
import { Modal } from './Modal'
import { useUiStore } from '@/store/useUiStore'

export function ConfirmDialog() {
  const open = useUiStore((s) => s.confirmOpen)
  const title = useUiStore((s) => s.confirmTitle)
  const description = useUiStore((s) => s.confirmDescription)
  const confirmLabel = useUiStore((s) => s.confirmConfirmLabel)
  const resolveConfirm = useUiStore((s) => s.resolveConfirm)

  return (
    <Modal
      open={open}
      title={title}
      hideTitle
      onClose={() => resolveConfirm(false)}
      size="sm"
      zIndexClass="z-[60]"
      initialFocusSelector="[data-confirm-action]"
      footer={
        <>
          <Button
            variant="secondary"
            size="lg"
            className="min-w-0 flex-1"
            onClick={() => resolveConfirm(false)}
          >
            취소
          </Button>
          <Button
            variant="primary"
            size="lg"
            className="min-w-0 flex-1"
            onClick={() => resolveConfirm(true)}
            data-confirm-action
            autoFocus
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="m-0 text-center text-base font-semibold text-ink leading-relaxed">{title}</p>
      {description ? (
        <p className="mt-2 mb-0 text-center text-sm text-muted leading-relaxed">{description}</p>
      ) : null}
    </Modal>
  )
}

export function ScopeDialog() {
  const open = useUiStore((s) => s.scopeOpen)
  const resolveScope = useUiStore((s) => s.resolveScope)

  return (
    <Modal
      open={open}
      title="반복 지출 변경 범위"
      onClose={() => resolveScope(null)}
      size="sm"
      footer={
        <>
          <button
            type="button"
            className="h-10 rounded-xl px-4 text-sm font-medium text-muted hover:bg-canvas"
            onClick={() => resolveScope(null)}
          >
            취소
          </button>
          <button
            type="button"
            className="h-10 rounded-xl px-4 text-sm font-medium text-ink hover:bg-canvas"
            onClick={() => resolveScope('this')}
          >
            이번만
          </button>
          <button
            type="button"
            className="h-10 rounded-xl bg-ink px-4 text-sm font-semibold text-white"
            onClick={() => resolveScope('following')}
            autoFocus
          >
            이후 전체
          </button>
        </>
      }
    >
      <p className="m-0 text-sm text-muted leading-relaxed">
        이 회차만 변경할까요, 이후 회차 전체에 적용할까요?
      </p>
    </Modal>
  )
}
