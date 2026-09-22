import { useMemo } from 'react'
import { useCategories } from '@/features/category/hooks/useCategories'
import { useDisplayExpenses } from '@/features/expense/hooks/useExpenses'
import { useUiStore } from '@/store/useUiStore'
import {
  buildCalendarDays,
  formatAmount,
  formatAmountShort,
  formatDateKey,
  isCurrentMonth,
  isSundayDate,
  isTodayDate,
  parseISO,
} from '@/shared/lib/format'
import { getDayExpenses, sumDayAmount } from '@/features/expense/utils/recurring'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export function MonthGrid() {
  const monthKey = useUiStore((s) => s.monthKey)
  const selectedDate = useUiStore((s) => s.selectedDate)
  const setSelectedDate = useUiStore((s) => s.setSelectedDate)
  const openDayExpense = useUiStore((s) => s.openDayExpense)
  const openExpenseForm = useUiStore((s) => s.openExpenseForm)
  const { display } = useDisplayExpenses()
  const { data: categories = [] } = useCategories()

  const month = useMemo(() => parseISO(`${monthKey}-01`), [monthKey])
  const days = useMemo(() => buildCalendarDays(month), [month])
  const catColor = useMemo(
    () => new Map(categories.map((c) => [c.id, c.color])),
    [categories],
  )

  const onSelect = (dateKey: string, inMonth: boolean) => {
    if (!inMonth) return
    setSelectedDate(dateKey)
    if (window.matchMedia('(max-width: 767px)').matches) {
      openDayExpense(dateKey)
    }
  }

  const onDoubleClick = (dateKey: string, inMonth: boolean) => {
    if (!inMonth) return
    if (!window.matchMedia('(min-width: 768px)').matches) return
    setSelectedDate(dateKey)
    openExpenseForm({ date: dateKey })
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="grid grid-cols-7 border-b border-line">
        {WEEKDAYS.map((d, i) => (
          <div
            key={d}
            className={`py-2 text-center text-xs font-medium ${
              i === 0 ? 'text-sunday' : 'text-faint'
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid flex-1 grid-cols-7 auto-rows-fr border-l border-t border-line">
        {days.map((day) => {
          const dateKey = formatDateKey(day)
          const inMonth = isCurrentMonth(day, month)
          const selected = dateKey === selectedDate && inMonth
          const today = isTodayDate(day) && inMonth
          const sunday = isSundayDate(day)
          const dayItems = inMonth ? getDayExpenses(display, dateKey) : []
          const total = inMonth ? sumDayAmount(display, dateKey) : 0
          const dots = [
            ...new Set(dayItems.map((e) => e.categoryId)),
          ].slice(0, 4)

          return (
            <button
              key={dateKey}
              type="button"
              disabled={!inMonth}
              aria-label={`${dateKey}${total ? `, 지출 ${formatAmount(total)}` : ''}`}
              aria-pressed={selected}
              onClick={() => onSelect(dateKey, inMonth)}
              onDoubleClick={() => onDoubleClick(dateKey, inMonth)}
              className={`relative flex min-h-[60px] flex-col items-stretch border-b border-r border-line p-1.5 text-left transition-colors md:min-h-[104px] md:p-2 ${
                !inMonth ? 'bg-canvas/50 text-faint cursor-default' : 'bg-paper hover:bg-canvas/80'
              } ${selected ? 'bg-accent/15 ring-2 ring-inset ring-accent' : ''}`}
            >
              <span
                className={`inline-flex h-7 w-7 items-center justify-center text-sm font-medium ${
                  today ? 'rounded-full bg-ink text-white' : ''
                } ${sunday && inMonth && !today ? 'text-sunday' : ''}`}
              >
                {day.getDate()}
              </span>

              {inMonth && dots.length > 0 ? (
                <span className="mt-1 hidden gap-1 md:flex" aria-hidden="true">
                  {dots.map((id) => (
                    <span
                      key={id}
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: catColor.get(id) ?? '#9CA1A9' }}
                    />
                  ))}
                </span>
              ) : null}

              {inMonth && total > 0 ? (
                <>
                  <span className="mt-auto self-end text-[10px] font-medium tabular-nums text-muted md:hidden">
                    {formatAmountShort(total)}
                  </span>
                  <span className="mt-auto hidden self-end text-xs font-medium tabular-nums text-muted md:inline">
                    {formatAmount(total)}
                  </span>
                </>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
