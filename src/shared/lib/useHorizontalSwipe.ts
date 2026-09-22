import { useRef, type TouchEventHandler } from 'react'

type Options = {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  /** 가로 스와이프로 인정할 최소 거리(px) */
  threshold?: number
}

/**
 * 좌우 스와이프 감지. 세로 스크롤과 구분하기 위해
 * |dx| > |dy| 이고 threshold 이상일 때만 콜백합니다.
 */
export function useHorizontalSwipe({
  onSwipeLeft,
  onSwipeRight,
  threshold = 56,
}: Options) {
  const start = useRef<{ x: number; y: number } | null>(null)

  const onTouchStart: TouchEventHandler = (e) => {
    const t = e.changedTouches[0]
    if (!t) return
    start.current = { x: t.clientX, y: t.clientY }
  }

  const onTouchEnd: TouchEventHandler = (e) => {
    if (!start.current) return
    const t = e.changedTouches[0]
    if (!t) {
      start.current = null
      return
    }
    const dx = t.clientX - start.current.x
    const dy = t.clientY - start.current.y
    start.current = null

    if (Math.abs(dx) < threshold) return
    if (Math.abs(dx) < Math.abs(dy)) return

    if (dx < 0) onSwipeLeft?.()
    else onSwipeRight?.()
  }

  const onTouchCancel: TouchEventHandler = () => {
    start.current = null
  }

  return { onTouchStart, onTouchEnd, onTouchCancel }
}
