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
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 md:px-6">
        <h1 className="hidden m-0 text-lg font-bold tracking-tight text-ink md:block">
          가계부
        </h1>

        <div className="flex flex-1 items-center justify-center gap-2 md:flex-none md:justify-start">
          <button
            type="button"
            aria-label="이전 달"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-canvas"
            onClick={() => shiftMonth(-1)}
          >
            ‹
          </button>
          <p className="m-0 min-w-[7.5rem] text-center text-base font-semibold tabular-nums">
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
          <Button
            size="sm"
            variant="secondary"
            className="ml-1 hidden md:inline-flex"
            onClick={goToday}
          >
            오늘
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden md:block">
            <SegmentControl<ViewMode>
              ariaLabel="보기 전환"
              value={viewMode}
              onChange={setViewMode}
              options={[
                { value: 'calendar', label: '캘린더' },
                { value: 'stats', label: '통계' },
              ]}
            />
          </div>
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

      <div className="px-4 pb-3 md:hidden">
        <SegmentControl<ViewMode>
          ariaLabel="보기 전환"
          value={viewMode}
          onChange={setViewMode}
          fullWidth
          options={[
            { value: 'calendar', label: '캘린더' },
            { value: 'stats', label: '통계' },
          ]}
        />
      </div>
    </header>
  )
}
