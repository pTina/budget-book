import { Button } from '@/shared/ui/Button'
import { SegmentControl } from '@/shared/ui/SegmentControl'
import { SettingsIcon } from '@/shared/ui/SettingsIcon'
import { useUiStore } from '@/store/useUiStore'
import { formatMonthLabel } from '@/shared/lib/format'
import type { ViewMode } from '@/shared/types'

export function CalendarHeader() {
  const monthKey = useUiStore((s) => s.monthKey)
  const viewMode = useUiStore((s) => s.viewMode)
  const shiftMonth = useUiStore((s) => s.shiftMonth)
  const goToday = useUiStore((s) => s.goToday)
  const setViewMode = useUiStore((s) => s.setViewMode)
  const openSettings = useUiStore((s) => s.openSettings)

  return (
    <header className="border-b border-line bg-paper">
      <div className="flex items-center gap-2 px-4 py-3 md:gap-3 md:px-6">
        <h1 className="hidden m-0 text-lg font-bold tracking-tight text-ink md:block">
          가계부
        </h1>

        <div className="flex items-center gap-1 md:gap-2">
          <button
            type="button"
            aria-label="이전 달"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-canvas"
            onClick={() => shiftMonth(-1)}
          >
            ‹
          </button>
          <p className="m-0 min-w-[6.5rem] text-center text-base font-semibold tabular-nums md:min-w-[7.5rem]">
            {formatMonthLabel(monthKey)}
          </p>
          <button
            type="button"
            aria-label="다음 달"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-canvas"
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

        <div className="ml-auto flex shrink-0 items-center gap-2 md:gap-3">
          <SegmentControl<ViewMode>
            ariaLabel="보기 전환"
            value={viewMode}
            onChange={setViewMode}
            options={[
              { value: 'calendar', label: '캘린더' },
              { value: 'stats', label: '통계' },
            ]}
          />
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-canvas hover:text-ink"
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
