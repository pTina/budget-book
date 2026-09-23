import { useMemo, type KeyboardEvent, type MouseEvent } from 'react'
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
import { useHorizontalSwipe } from '@/shared/lib/useHorizontalSwipe'
import { getDayExpenses, sumDayAmount } from '@/features/expense/utils/recurring'
import type { DisplayExpense } from '@/shared/types'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
/** 칸당 보이는 막대 최대 개수 */
const MAX_BARS_MOBILE = 3
const MAX_BARS_DESKTOP = 4

export function MonthGrid() {
  const monthKey = useUiStore((s) => s.monthKey)
  const selectedDate = useUiStore((s) => s.selectedDate)
  const setSelectedDate = useUiStore((s) => s.setSelectedDate)
  const openDayExpense = useUiStore((s) => s.openDayExpense)
  const openExpenseForm = useUiStore((s) => s.openExpenseForm)
  const shiftMonth = useUiStore((s) => s.shiftMonth)
  const { display } = useDisplayExpenses()
  const { data: categories = [] } = useCategories()
  const swipe = useHorizontalSwipe({
    onSwipeLeft: () => shiftMonth(1),
    onSwipeRight: () => shiftMonth(-1),
  })

  const month = useMemo(() => parseISO(`${monthKey}-01`), [monthKey])
  const days = useMemo(() => buildCalendarDays(month), [month])
  const catColor = useMemo(
    () => new Map(categories.map((c) => [c.id, c.color])),
    [categories],
  )

  const isMobile = () => window.matchMedia('(max-width: 767px)').matches

  const onSelectDay = (dateKey: string, inMonth: boolean) => {
    if (!inMonth) return
    setSelectedDate(dateKey)
    if (isMobile()) openDayExpense(dateKey)
  }

  const onDoubleClickDay = (dateKey: string, inMonth: boolean) => {
    if (!inMonth) return
    if (isMobile()) return
    setSelectedDate(dateKey)
    openExpenseForm({ date: dateKey })
  }

  const onBarClick = (
    e: MouseEvent,
    expense: DisplayExpense,
    dateKey: string,
  ) => {
    e.stopPropagation()
    if (!isCurrentMonth(parseISO(dateKey), month)) return
    setSelectedDate(dateKey)
    if (isMobile()) {
      openDayExpense(dateKey)
      return
    }
    openExpenseForm({ id: expense.id })
  }

  return (
    <div
      className="flex h-full min-h-0 flex-col touch-pan-y"
      {...swipe}
    >
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
          const visibleDesktop = dayItems.slice(0, MAX_BARS_DESKTOP)
          const overflowDesktop = Math.max(0, dayItems.length - MAX_BARS_DESKTOP)
          const overflowMobile = Math.max(0, dayItems.length - MAX_BARS_MOBILE)

          const onKeyDown = (e: KeyboardEvent) => {
            if (!inMonth) return
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onSelectDay(dateKey, inMonth)
            }
          }

          return (
            <div
              key={dateKey}
              role="button"
              tabIndex={inMonth ? 0 : -1}
              aria-disabled={!inMonth}
              aria-label={`${dateKey}${total ? `, 지출 ${formatAmount(total)}` : ''}`}
              aria-pressed={selected}
              onClick={() => onSelectDay(dateKey, inMonth)}
              onDoubleClick={() => onDoubleClickDay(dateKey, inMonth)}
              onKeyDown={onKeyDown}
              className={`relative flex min-h-[72px] flex-col items-stretch border-b border-r border-line p-1 text-left transition-colors md:min-h-[112px] md:p-1.5 ${
                !inMonth
                  ? 'bg-canvas/50 text-faint cursor-default'
                  : 'bg-paper cursor-pointer hover:bg-canvas/60'
              } ${selected ? 'bg-accent/15 ring-2 ring-inset ring-accent' : ''}`}
            >
              <span
                className={`inline-flex h-5 w-5 shrink-0 items-center justify-center text-xs font-medium md:h-6 md:w-6 ${
                  today ? 'rounded-full bg-ink text-white' : ''
                } ${sunday && inMonth && !today ? 'text-sunday' : ''}`}
              >
                {day.getDate()}
              </span>

              {inMonth && dayItems.length > 0 ? (
                <div className="mt-0.5 flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden">
                  {visibleDesktop.map((item, index) => {
                    const color = catColor.get(item.categoryId) ?? '#D2D8EA'
                    const hideOnMobile = index >= MAX_BARS_MOBILE
                    return (
                      <button
                        key={item.id}
                        type="button"
                        title={`${item.title} · ${formatAmount(item.amount)}`}
                        onClick={(e) => onBarClick(e, item, dateKey)}
                        className={`flex h-[18px] w-full shrink-0 items-center rounded-full px-1.5 text-left outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent ${
                          hideOnMobile ? 'hidden md:flex' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      >
                        <span className="truncate text-[10px] font-medium leading-none text-ink/80">
                          {item.title}
                        </span>
                      </button>
                    )
                  })}
                  {overflowMobile > 0 ? (
                    <span className="pl-0.5 text-[10px] font-medium text-faint md:hidden">
                      +{overflowMobile}
                    </span>
                  ) : null}
                  {overflowDesktop > 0 ? (
                    <span className="hidden pl-0.5 text-[10px] font-medium text-faint md:inline">
                      +{overflowDesktop}
                    </span>
                  ) : null}
                </div>
              ) : null}

              {inMonth && total > 0 ? (
                <>
                  <span className="mt-auto self-end pt-0.5 text-[10px] font-medium tabular-nums text-muted md:hidden">
                    {formatAmountShort(total)}
                  </span>
                  <span className="mt-auto hidden self-end pt-0.5 text-xs font-medium tabular-nums text-muted md:inline">
                    {formatAmount(total)}
                  </span>
                </>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
