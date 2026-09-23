import { Button } from '@/shared/ui/Button'
import { SegmentControl } from '@/shared/ui/SegmentControl'
import { SettingsIcon } from '@/shared/ui/SettingsIcon'
import { useUiStore } from '@/store/useUiStore'
import { formatMonthLabel } from '@/shared/lib/format'
import type { ViewMode } from '@/shared/types'

const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: 'calendar', label: '캘린더' },
  { value: 'stats', label: '통계' },
  { value: 'details', label: '세부내역' },
]

export function CalendarHeader() {
  const monthKey = useUiStore((s) => s.monthKey)
  const viewMode = useUiStore((s) => s.viewMode)
  const shiftMonth = useUiStore((s) => s.shiftMonth)
  const goToday = useUiStore((s) => s.goToday)
  const setViewMode = useUiStore((s) => s.setViewMode)
  const openSettings = useUiStore((s) => s.openSettings)

  return (
    <header className="border-b border-line bg-paper">
      <div className="flex items-center gap-1.5 px-3 py-3 md:gap-3 md:px-6">
        <h1 className="hidden m-0 text-lg font-bold tracking-tight text-ink md:block">
          가계부
        </h1>

        <div className="flex shrink-0 items-center md:gap-2">
          <button
            type="button"
            aria-label="이전 달"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-canvas md:h-9 md:w-9"
            onClick={() => shiftMonth(-1)}
          >
            ‹
          </button>
          <p className="m-0 min-w-[4.75rem] text-center text-sm font-semibold tabular-nums md:min-w-[7.5rem] md:text-base">
            {formatMonthLabel(monthKey)}
          </p>
          <button
            type="button"
            aria-label="다음 달"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-canvas md:h-9 md:w-9"
            onClick={() => shiftMonth(1)}
          >
            ›
          </button>
          <div className="ml-1 hidden md:block">
            <Button size="sm" variant="secondary" onClick={goToday}>
              오늘
            </Button>
          </div>
        </div>

        <div className="ml-auto flex min-w-0 shrink-0 items-center gap-1.5 md:gap-3">
          <SegmentControl<ViewMode>
            ariaLabel="보기 전환"
            value={viewMode}
            onChange={setViewMode}
            options={VIEW_OPTIONS}
          />
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-canvas hover:text-ink md:h-9 md:w-9"
            aria-label="설정"
            onClick={() => openSettings('budget')}
          >
            <SettingsIcon />
          </button>
        </div>
      </div>
    </header>
  )
}
