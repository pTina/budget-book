import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'

type ModalProps = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  /** 열릴 때 포커스할 선택자. 없으면 첫 포커스 가능 요소 */
  initialFocusSelector?: string
  size?: 'md' | 'lg' | 'sm'
  labelledBy?: string
  hideTitle?: boolean
}

let openModalCount = 0

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  initialFocusSelector,
  size = 'md',
  labelledBy,
  hideTitle = false,
}: ModalProps) {
  const titleId = useId()
  const contentRef = useRef<HTMLDivElement>(null)
  const [zIndex, setZIndex] = useState(50)

  useLayoutEffect(() => {
    if (!open) return
    openModalCount += 1
    setZIndex(50 + openModalCount * 10)
    document.body.classList.add('modal-open')
    return () => {
      openModalCount = Math.max(0, openModalCount - 1)
      if (openModalCount === 0) {
        document.body.classList.remove('modal-open')
      }
    }
  }, [open])

  useEffect(() => {
    if (!open) setZIndex(50)
  }, [open])

  const maxW =
    size === 'lg' ? 'max-w-[560px]' : size === 'sm' ? 'max-w-[360px]' : 'max-w-[440px]'

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
    >
      <Dialog.Portal>
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex }}>
          <Dialog.Overlay className="absolute inset-0 bg-ink/30" />
          <Dialog.Content
            ref={contentRef}
            aria-labelledby={labelledBy ?? titleId}
            aria-describedby={undefined}
            className={`relative z-10 flex w-full ${maxW} max-h-[calc(100vh-32px)] flex-col rounded-2xl bg-paper shadow-[var(--shadow-panel)]`}
            onOpenAutoFocus={(e) => {
              if (!initialFocusSelector) return
              const target = contentRef.current?.querySelector(
                initialFocusSelector,
              ) as HTMLElement | null
              if (!target) return
              e.preventDefault()
              target.focus()
            }}
          >
            <div
              className={`flex items-center gap-3 px-5 ${
                hideTitle ? 'justify-end pt-4 pb-0' : 'justify-between border-b border-line py-4'
              }`}
            >
              <Dialog.Title
                id={titleId}
                className={hideTitle ? 'sr-only' : 'm-0 text-base font-semibold text-ink'}
              >
                {title}
              </Dialog.Title>
              <Dialog.Close
                type="button"
                aria-label="팝업 닫기"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-canvas"
              >
                <span aria-hidden="true">✕</span>
              </Dialog.Close>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
            {footer ? (
              <div
                className={`flex items-center justify-end gap-2 px-5 py-3 ${
                  hideTitle ? '' : 'border-t border-line'
                }`}
              >
                {footer}
              </div>
            ) : null}
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
