import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

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
  /** 중첩 모달용 z-index (기본 50) */
  zIndexClass?: string
}

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'

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
  zIndexClass = 'z-50',
}: ModalProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<Element | null>(null)

  useEffect(() => {
    if (!open) return
    triggerRef.current = document.activeElement
    openModalCount += 1
    document.body.classList.add('modal-open')

    const t = window.setTimeout(() => {
      const panel = panelRef.current
      if (!panel) return
      const target = initialFocusSelector
        ? (panel.querySelector(initialFocusSelector) as HTMLElement | null)
        : (panel.querySelector(FOCUSABLE) as HTMLElement | null)
      target?.focus()
    }, 0)

    return () => {
      window.clearTimeout(t)
      openModalCount = Math.max(0, openModalCount - 1)
      if (openModalCount === 0) {
        document.body.classList.remove('modal-open')
      }
      if (triggerRef.current instanceof HTMLElement) {
        triggerRef.current.focus()
      }
    }
  }, [open, initialFocusSelector])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const onKeyDown = useCallback((e: ReactKeyboardEvent) => {
    if (e.key !== 'Tab' || !panelRef.current) return
    const nodes = [
      ...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
    ].filter((el) => !el.hasAttribute('disabled') && el.tabIndex !== -1)
    if (nodes.length === 0) return
    const first = nodes[0]
    const last = nodes[nodes.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }, [])

  if (!open) return null

  const maxW =
    size === 'lg' ? 'max-w-[560px]' : size === 'sm' ? 'max-w-[360px]' : 'max-w-[440px]'

  return createPortal(
    <div
      className={`fixed inset-0 ${zIndexClass} flex items-center justify-center p-4`}
      role="presentation"
    >
      <button
        type="button"
        aria-label="닫기"
        className="absolute inset-0 bg-ink/30 border-0 cursor-default"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy ?? titleId}
        className={`relative z-10 flex w-full ${maxW} max-h-[calc(100vh-32px)] flex-col rounded-2xl bg-paper shadow-[var(--shadow-panel)]`}
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2 id={titleId} className="m-0 text-base font-semibold text-ink">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="팝업 닫기"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-canvas"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}
